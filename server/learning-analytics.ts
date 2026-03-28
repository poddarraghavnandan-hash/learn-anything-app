/**
 * Learning Analytics Engine
 * 
 * Aggregates signal data into comprehensive learning metrics and trends.
 * Provides insights into learner progress, learning velocity, and concept mastery.
 */

import { getUserSignals, getConceptSignals, analyzeSignals } from "./signal-observer";
import { getUserLearnerProfile } from "./learner-profile";

export interface SignalVelocity {
  signalsPerHour: number;
  totalSignalsThisWeek: number;
  averageSignalsPerDay: number;
  trend: "increasing" | "stable" | "decreasing";
}

export interface ConceptMastery {
  conceptId: number;
  conceptName: string;
  masteryScore: number; // 0-1
  confidenceLevel: "low" | "medium" | "high";
  breakthroughCount: number;
  stuckCount: number;
  lastInteractionTime: Date | null;
  progressTrend: "improving" | "stable" | "declining";
}

export interface LearningTrend {
  trendType: "breakthrough_streak" | "stuck_pattern" | "learning_acceleration" | "learning_plateau";
  intensity: number; // 0-1
  duration: number; // hours
  affectedConcepts: string[];
  recommendation: string;
}

export interface LearningReport {
  userId: number;
  reportDate: Date;
  overallMastery: number; // 0-1
  signalVelocity: SignalVelocity;
  conceptMasteries: ConceptMastery[];
  learningTrends: LearningTrend[];
  estimatedLearningVelocity: number; // concepts per week
  recommendedFocusAreas: string[];
  learningStyleProfile: {
    preferredContentTypes: string[];
    optimalLearningPace: "slow" | "moderate" | "fast";
    engagementLevel: number; // 0-1
  };
}

/**
 * Calculate signal velocity (signals per hour)
 */
export async function calculateSignalVelocity(userId: number, hoursBack: number = 24): Promise<SignalVelocity> {
  try {
    const signals = await getUserSignals(userId, { since: new Date(Date.now() - hoursBack * 60 * 60 * 1000) });
    
    if (!signals || signals.length === 0) {
      return {
        signalsPerHour: 0,
        totalSignalsThisWeek: 0,
        averageSignalsPerDay: 0,
        trend: "stable",
      };
    }

    const signalsPerHour = signals.length / hoursBack;
    
    // Calculate week stats
    const weekSignals = await getUserSignals(userId, { since: new Date(Date.now() - 168 * 60 * 60 * 1000) }); // 7 days
    const totalSignalsThisWeek = weekSignals?.length ?? 0;
    const averageSignalsPerDay = totalSignalsThisWeek / 7;

    // Determine trend
    const recentSignals = signals.length;
    const olderSignals = (await getUserSignals(userId, { since: new Date(Date.now() - hoursBack * 2 * 60 * 60 * 1000) }))?.length ?? 0;
    const olderVelocity = (olderSignals - recentSignals) / hoursBack;
    
    let trend: "increasing" | "stable" | "decreasing" = "stable";
    if (signalsPerHour > olderVelocity * 1.2) {
      trend = "increasing";
    } else if (signalsPerHour < olderVelocity * 0.8) {
      trend = "decreasing";
    }

    return {
      signalsPerHour,
      totalSignalsThisWeek,
      averageSignalsPerDay,
      trend,
    };
  } catch (error) {
    console.error("[Analytics] Error calculating signal velocity:", error);
    return {
      signalsPerHour: 0,
      totalSignalsThisWeek: 0,
      averageSignalsPerDay: 0,
      trend: "stable",
    };
  }
}

/**
 * Calculate concept mastery score
 */
export async function calculateConceptMastery(
  userId: number,
  conceptId: number,
  conceptName: string
): Promise<ConceptMastery> {
  try {
    const signals = await getConceptSignals(userId, conceptId);
    
    if (!signals || signals.length === 0) {
      return {
        conceptId,
        conceptName,
        masteryScore: 0,
        confidenceLevel: "low",
        breakthroughCount: 0,
        stuckCount: 0,
        lastInteractionTime: null,
        progressTrend: "stable",
      };
    }

    // Count signal types
    const breakthroughCount = signals.filter((s: any) => s.type === "breakthrough").length;
    const stuckCount = signals.filter((s: any) => s.type === "stuck").length;
    const totalSignals = signals.length;

    // Calculate mastery score based on signal distribution
    const breakthroughRatio = breakthroughCount / totalSignals;
    const stuckRatio = stuckCount / totalSignals;
    
    // Mastery = (breakthroughs - stucks) / total, normalized to 0-1
    const masteryScore = Math.max(0, Math.min(1, (breakthroughRatio - stuckRatio * 0.5) * 1.5));

    // Determine confidence level
    let confidenceLevel: "low" | "medium" | "high" = "low";
    if (masteryScore >= 0.7) {
      confidenceLevel = "high";
    } else if (masteryScore >= 0.4) {
      confidenceLevel = "medium";
    }

    // Get last interaction time
    const lastInteractionTime = signals.length > 0 ? signals[0].timestamp : null;

    // Determine progress trend
    const recentSignals = signals.slice(0, Math.ceil(signals.length / 2));
    const olderSignals = signals.slice(Math.ceil(signals.length / 2));
    
    const recentMastery = recentSignals.length > 0
      ? (recentSignals.filter((s: any) => s.type === "breakthrough").length / recentSignals.length) -
        (recentSignals.filter((s: any) => s.type === "stuck").length / recentSignals.length) * 0.5
      : 0;
    
    const olderMastery = olderSignals.length > 0
      ? (olderSignals.filter((s: any) => s.type === "breakthrough").length / olderSignals.length) -
        (olderSignals.filter((s: any) => s.type === "stuck").length / olderSignals.length) * 0.5
      : 0;

    let progressTrend: "improving" | "stable" | "declining" = "stable";
    if (recentMastery > olderMastery * 1.2) {
      progressTrend = "improving";
    } else if (recentMastery < olderMastery * 0.8) {
      progressTrend = "declining";
    }

    return {
      conceptId,
      conceptName,
      masteryScore,
      confidenceLevel,
      breakthroughCount,
      stuckCount,
      lastInteractionTime,
      progressTrend,
    };
  } catch (error) {
    console.error("[Analytics] Error calculating concept mastery:", error);
    return {
      conceptId,
      conceptName,
      masteryScore: 0,
      confidenceLevel: "low",
      breakthroughCount: 0,
      stuckCount: 0,
      lastInteractionTime: null,
      progressTrend: "stable",
    };
  }
}

/**
 * Detect learning trends from signals
 */
export async function detectLearningTrends(userId: number): Promise<LearningTrend[]> {
  try {
    const signals = await getUserSignals(userId, { since: new Date(Date.now() - 168 * 60 * 60 * 1000) }); // Last 7 days
    
    if (!signals || signals.length < 5) {
      return [];
    }

    const trends: LearningTrend[] = [];

    // Detect breakthrough streaks
    let breakthroughStreak = 0;
    let currentStreakConcepts = new Set<string>();
    
    for (const signal of signals as any[]) {
      if (signal.type === "breakthrough") {
        breakthroughStreak++;
        if (signal.conceptName) {
          currentStreakConcepts.add(signal.conceptName);
        }
      } else if (breakthroughStreak >= 3) {
        trends.push({
          trendType: "breakthrough_streak",
          intensity: Math.min(1, breakthroughStreak / 10),
          duration: 24, // Approximate
          affectedConcepts: Array.from(currentStreakConcepts),
          recommendation: `Great momentum! You're having breakthroughs on ${Array.from(currentStreakConcepts).join(", ")}. Keep this pace!`,
        });
        breakthroughStreak = 0;
        currentStreakConcepts = new Set();
      } else {
        breakthroughStreak = 0;
        currentStreakConcepts = new Set();
      }
    }

    // Detect stuck patterns
    let stuckCount = 0;
    let stuckConcepts = new Set<string>();
    
    for (const signal of signals as any[]) {
      if (signal.type === "stuck") {
        stuckCount++;
        if (signal.conceptName) {
          stuckConcepts.add(signal.conceptName);
        }
      }
    }

    if (stuckCount >= 3) {
      trends.push({
        trendType: "stuck_pattern",
        intensity: Math.min(1, stuckCount / 10),
        duration: 48,
        affectedConcepts: Array.from(stuckConcepts),
        recommendation: `You're struggling with ${Array.from(stuckConcepts).join(", ")}. Try a different learning approach or take a break.`,
      });
    }

    // Detect learning acceleration
    const recentSignals = signals.slice(0, Math.ceil(signals.length / 3));
    const olderSignals = signals.slice(Math.ceil(signals.length / 3));
    
    if ((recentSignals as any[]).length > 0 && (olderSignals as any[]).length > 0) {
      const recentVelocity = (recentSignals as any[]).length / 2.33; // ~2.33 days
      const olderVelocity = (olderSignals as any[]).length / 4.67; // ~4.67 days
      
      if (recentVelocity > olderVelocity * 1.5) {
        trends.push({
          trendType: "learning_acceleration",
          intensity: Math.min(1, (recentVelocity - olderVelocity) / olderVelocity),
          duration: 72,
          affectedConcepts: [],
          recommendation: "You're accelerating your learning! This is excellent progress.",
        });
      }
    }

    return trends;
  } catch (error) {
    console.error("[Analytics] Error detecting learning trends:", error);
    return [];
  }
}

/**
 * Generate comprehensive learning report
 */
export async function generateLearningReport(userId: number): Promise<LearningReport> {
  try {
    const profile = await getUserLearnerProfile(userId);
    const signalVelocity = await calculateSignalVelocity(userId, 24);
    const learningTrends = await detectLearningTrends(userId);

    // Get all signals for concept mastery calculation
    const signals = await getUserSignals(userId, { since: new Date(Date.now() - 168 * 60 * 60 * 1000) });
    const conceptIds = new Set<number>();
    const conceptNames = new Map<number, string>();
    
    if (signals) {
      for (const signal of signals as any[]) {
        conceptIds.add(signal.conceptId);
        if ((signal as any).conceptName) {
          conceptNames.set(signal.conceptId, (signal as any).conceptName);
        }
      }
    }

    // Calculate mastery for each concept
    const conceptMasteries: ConceptMastery[] = [];
    for (const conceptId of conceptIds) {
      const conceptName = conceptNames.get(conceptId) || `Concept ${conceptId}`;
      const mastery = await calculateConceptMastery(userId, conceptId, conceptName);
      conceptMasteries.push(mastery);
    }

    // Calculate overall mastery
    const overallMastery = conceptMasteries.length > 0
      ? conceptMasteries.reduce((sum, m) => sum + m.masteryScore, 0) / conceptMasteries.length
      : 0;

    // Estimate learning velocity (concepts per week)
    const weekSignals = await getUserSignals(userId, { since: new Date(Date.now() - 168 * 60 * 60 * 1000) });
    const uniqueConceptsThisWeek = new Set(
      weekSignals?.map((s: any) => s.conceptId) ?? []
    ).size;
    const estimatedLearningVelocity = uniqueConceptsThisWeek;

    // Identify focus areas
    const recommendedFocusAreas = conceptMasteries
      .filter((m) => m.masteryScore < 0.5)
      .sort((a, b) => a.masteryScore - b.masteryScore)
      .slice(0, 3)
      .map((m) => m.conceptName);

    // Determine learning style profile
    const applicationSignals = signals?.filter((s: any) => s.type === "application").length ?? 0;
    const teachingSignals = signals?.filter((s: any) => s.type === "teaching").length ?? 0;
    const totalSignals = signals?.length ?? 1;
    
    const preferredContentTypes = [];
    if (applicationSignals > totalSignals * 0.3) preferredContentTypes.push("practical_exercises");
    if (teachingSignals > totalSignals * 0.3) preferredContentTypes.push("explanations");
    if ((signals?.filter((s: any) => s.type === "question").length ?? 0) > totalSignals * 0.3) {
      preferredContentTypes.push("interactive_content");
    }

    const engagementLevel = Math.min(1, (totalSignals / 50) * 0.5 + 0.5); // Normalize to 0-1

    return {
      userId,
      reportDate: new Date(),
      overallMastery,
      signalVelocity,
      conceptMasteries,
      learningTrends,
      estimatedLearningVelocity,
      recommendedFocusAreas,
      learningStyleProfile: {
        preferredContentTypes: preferredContentTypes.length > 0 ? preferredContentTypes : ["mixed"],
        optimalLearningPace: signalVelocity.signalsPerHour > 2 ? "fast" : signalVelocity.signalsPerHour > 0.5 ? "moderate" : "slow",
        engagementLevel,
      },
    };
  } catch (error) {
    console.error("[Analytics] Error generating learning report:", error);
    return {
      userId,
      reportDate: new Date(),
      overallMastery: 0,
      signalVelocity: {
        signalsPerHour: 0,
        totalSignalsThisWeek: 0,
        averageSignalsPerDay: 0,
        trend: "stable",
      },
      conceptMasteries: [],
      learningTrends: [],
      estimatedLearningVelocity: 0,
      recommendedFocusAreas: [],
      learningStyleProfile: {
        preferredContentTypes: ["mixed"],
        optimalLearningPace: "moderate",
        engagementLevel: 0,
      },
    };
  }
}

/**
 * Track learning velocity over time
 */
export async function trackLearningVelocity(userId: number): Promise<{
  current: number;
  oneWeekAgo: number;
  twoWeeksAgo: number;
  trend: "accelerating" | "stable" | "decelerating";
}> {
  try {
    const current = await calculateSignalVelocity(userId, 24);
    const oneWeekAgo = await calculateSignalVelocity(userId, 24 * 8); // 8 days back to 1 day back
    const twoWeeksAgo = await calculateSignalVelocity(userId, 24 * 15); // 15 days back to 8 days back

    const currentVelocity = current.signalsPerHour;
    const oneWeekVelocity = (oneWeekAgo.signalsPerHour + currentVelocity) / 2;
    const twoWeekVelocity = (twoWeeksAgo.signalsPerHour + oneWeekVelocity) / 2;

    let trend: "accelerating" | "stable" | "decelerating" = "stable";
    if (currentVelocity > oneWeekVelocity * 1.2 && oneWeekVelocity > twoWeekVelocity * 1.2) {
      trend = "accelerating";
    } else if (currentVelocity < oneWeekVelocity * 0.8 && oneWeekVelocity < twoWeekVelocity * 0.8) {
      trend = "decelerating";
    }

    return {
      current: currentVelocity,
      oneWeekAgo: oneWeekVelocity,
      twoWeeksAgo: twoWeekVelocity,
      trend,
    };
  } catch (error) {
    console.error("[Analytics] Error tracking learning velocity:", error);
    return {
      current: 0,
      oneWeekAgo: 0,
      twoWeeksAgo: 0,
      trend: "stable",
    };
  }
}
