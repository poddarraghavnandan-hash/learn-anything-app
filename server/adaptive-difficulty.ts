/**
 * Adaptive Difficulty System
 * 
 * Adjusts learning path difficulty based on learner signals and performance.
 * Implements dynamic difficulty scaling to optimize learning velocity and engagement.
 */

import { getUserSignals, getConceptSignals } from "./signal-observer";
import { calculateConceptMastery } from "./learning-analytics";

export type DifficultyLevel = "foundation" | "intermediate" | "advanced" | "expert";

export interface DifficultyAdjustment {
  currentLevel: DifficultyLevel;
  recommendedLevel: DifficultyLevel;
  reason: string;
  confidence: number; // 0-1
  adjustmentFactor: number; // -2 to +2 (negative = easier, positive = harder)
}

export interface AdaptiveRecommendation {
  conceptId: number;
  conceptName: string;
  recommendedDifficulty: DifficultyLevel;
  estimatedCompletionTime: number; // minutes
  successProbability: number; // 0-1
  engagementScore: number; // 0-1
}

/**
 * Determine recommended difficulty level based on signals
 */
export async function recommendDifficultyLevel(
  userId: number,
  conceptId: number,
  currentLevel: DifficultyLevel
): Promise<DifficultyLevel> {
  try {
    const signals = await getConceptSignals(userId, conceptId);

    if (!signals || signals.length < 3) {
      // Not enough data, keep current level
      return currentLevel;
    }

    // Count signal types
    const breakthroughCount = signals.filter((s: any) => s.type === "breakthrough").length;
    const stuckCount = signals.filter((s: any) => s.type === "stuck").length;
    const totalSignals = signals.length;

    const breakthroughRatio = breakthroughCount / totalSignals;
    const stuckRatio = stuckCount / totalSignals;

    // Difficulty adjustment logic
    if (breakthroughRatio >= 0.6 && stuckRatio <= 0.1) {
      // High breakthrough rate, low stuck rate -> increase difficulty
      switch (currentLevel) {
        case "foundation":
          return "intermediate";
        case "intermediate":
          return "advanced";
        case "advanced":
          return "expert";
        case "expert":
          return "expert";
      }
    } else if (stuckRatio >= 0.4 || breakthroughRatio <= 0.2) {
      // High stuck rate or low breakthrough rate -> decrease difficulty
      switch (currentLevel) {
        case "expert":
          return "advanced";
        case "advanced":
          return "intermediate";
        case "intermediate":
          return "foundation";
        case "foundation":
          return "foundation";
      }
    }

    // Stable performance -> keep current level
    return currentLevel;
  } catch (error) {
    console.error("[AdaptiveDifficulty] Error recommending difficulty level:", error);
    return currentLevel;
  }
}

/**
 * Calculate difficulty adjustment with detailed reasoning
 */
export async function adjustDifficultyBasedOnSignals(
  userId: number,
  conceptId: number,
  currentLevel: DifficultyLevel
): Promise<DifficultyAdjustment> {
  try {
    const signals = await getConceptSignals(userId, conceptId);

    if (!signals || signals.length === 0) {
      return {
        currentLevel,
        recommendedLevel: currentLevel,
        reason: "Insufficient signal data for difficulty adjustment",
        confidence: 0.3,
        adjustmentFactor: 0,
      };
    }

    // Calculate signal metrics
    const breakthroughCount = signals.filter((s: any) => s.type === "breakthrough").length;
    const stuckCount = signals.filter((s: any) => s.type === "stuck").length;
    const questionCount = signals.filter((s: any) => s.type === "question").length;
    const totalSignals = signals.length;

    const breakthroughRatio = breakthroughCount / totalSignals;
    const stuckRatio = stuckCount / totalSignals;
    const questionRatio = questionCount / totalSignals;

    // Calculate confidence based on signal volume
    const confidence = Math.min(1, totalSignals / 20);

    // Determine adjustment factor
    let adjustmentFactor = 0;
    let reason = "";

    if (breakthroughRatio >= 0.7) {
      adjustmentFactor = 2; // Significantly increase difficulty
      reason = `Excellent performance: ${breakthroughCount} breakthroughs. Ready for advanced challenges.`;
    } else if (breakthroughRatio >= 0.5) {
      adjustmentFactor = 1; // Increase difficulty
      reason = `Strong performance: ${breakthroughCount} breakthroughs. Increase difficulty gradually.`;
    } else if (stuckRatio >= 0.5) {
      adjustmentFactor = -2; // Significantly decrease difficulty
      reason = `Struggling: ${stuckCount} stuck signals. Need easier content.`;
    } else if (stuckRatio >= 0.3) {
      adjustmentFactor = -1; // Decrease difficulty
      reason = `Some difficulty: ${stuckCount} stuck signals. Reduce difficulty slightly.`;
    } else if (questionRatio >= 0.4) {
      adjustmentFactor = 0; // Keep same level
      reason = `Active learning: ${questionCount} questions asked. Current difficulty is appropriate.`;
    } else {
      adjustmentFactor = 0;
      reason = "Balanced performance. Current difficulty level is suitable.";
    }

    // Determine recommended level
    let recommendedLevel = currentLevel;
    if (adjustmentFactor > 0) {
      recommendedLevel = await recommendDifficultyLevel(userId, conceptId, currentLevel);
    } else if (adjustmentFactor < 0) {
      // Decrease difficulty
      switch (currentLevel) {
        case "expert":
          recommendedLevel = "advanced";
          break;
        case "advanced":
          recommendedLevel = "intermediate";
          break;
        case "intermediate":
          recommendedLevel = "foundation";
          break;
        case "foundation":
          recommendedLevel = "foundation";
          break;
      }
    }

    return {
      currentLevel,
      recommendedLevel,
      reason,
      confidence,
      adjustmentFactor,
    };
  } catch (error) {
    console.error("[AdaptiveDifficulty] Error adjusting difficulty:", error);
    return {
      currentLevel,
      recommendedLevel: currentLevel,
      reason: "Error calculating difficulty adjustment",
      confidence: 0,
      adjustmentFactor: 0,
    };
  }
}

/**
 * Generate adaptive recommendations for next learning steps
 */
export async function generateAdaptiveRecommendations(
  userId: number,
  conceptIds: number[],
  conceptNames: Map<number, string>
): Promise<AdaptiveRecommendation[]> {
  try {
    const recommendations: AdaptiveRecommendation[] = [];

    for (const conceptId of conceptIds) {
      const conceptName = conceptNames.get(conceptId) || `Concept ${conceptId}`;
      const mastery = await calculateConceptMastery(userId, conceptId, conceptName);

      // Determine recommended difficulty based on mastery
      let recommendedDifficulty: DifficultyLevel = "foundation";
      if (mastery.masteryScore >= 0.8) {
        recommendedDifficulty = "expert";
      } else if (mastery.masteryScore >= 0.6) {
        recommendedDifficulty = "advanced";
      } else if (mastery.masteryScore >= 0.4) {
        recommendedDifficulty = "intermediate";
      }

      // Estimate completion time based on mastery
      const baseTime = 30; // minutes
      const completionTimeMultiplier = 1 / (mastery.masteryScore + 0.5); // Harder concepts take longer
      const estimatedCompletionTime = Math.round(baseTime * completionTimeMultiplier);

      // Calculate success probability
      const successProbability = Math.min(1, mastery.masteryScore + 0.2); // Slightly optimistic

      // Calculate engagement score
      const signals = await getConceptSignals(userId, conceptId);
      const engagementScore = Math.min(1, (signals?.length ?? 0) / 50);

      recommendations.push({
        conceptId,
        conceptName,
        recommendedDifficulty,
        estimatedCompletionTime,
        successProbability,
        engagementScore,
      });
    }

    // Sort by priority (low mastery + high engagement first)
    recommendations.sort((a, b) => {
      const aPriority = (1 - a.successProbability) * a.engagementScore;
      const bPriority = (1 - b.successProbability) * b.engagementScore;
      return bPriority - aPriority;
    });

    return recommendations;
  } catch (error) {
    console.error("[AdaptiveDifficulty] Error generating recommendations:", error);
    return [];
  }
}

/**
 * Track difficulty adjustments over time
 */
export async function trackDifficultyAdjustments(
  userId: number,
  conceptId: number
): Promise<{
  adjustmentHistory: Array<{
    timestamp: Date;
    fromLevel: DifficultyLevel;
    toLevel: DifficultyLevel;
    reason: string;
  }>;
  currentTrend: "increasing" | "stable" | "decreasing";
  totalAdjustments: number;
}> {
  try {
    // For now, return empty history (would be populated from database in production)
    const adjustmentHistory: Array<{
      timestamp: Date;
      fromLevel: DifficultyLevel;
      toLevel: DifficultyLevel;
      reason: string;
    }> = [];

    const currentTrend = "stable" as const;
    const totalAdjustments = 0;

    return {
      adjustmentHistory,
      currentTrend,
      totalAdjustments,
    };
  } catch (error) {
    console.error("[AdaptiveDifficulty] Error tracking adjustments:", error);
    return {
      adjustmentHistory: [],
      currentTrend: "stable",
      totalAdjustments: 0,
    };
  }
}

/**
 * Calculate optimal learning path based on adaptive recommendations
 */
export async function calculateOptimalLearningPath(
  userId: number,
  conceptIds: number[],
  conceptNames: Map<number, string>
): Promise<{
  recommendedOrder: Array<{
    conceptId: number;
    conceptName: string;
    difficulty: DifficultyLevel;
    priority: number;
  }>;
  estimatedTotalTime: number; // hours
  successProbability: number; // 0-1
}> {
  try {
    const recommendations = await generateAdaptiveRecommendations(userId, conceptIds, conceptNames);

    const recommendedOrder = recommendations.map((rec, index) => ({
      conceptId: rec.conceptId,
      conceptName: rec.conceptName,
      difficulty: rec.recommendedDifficulty,
      priority: index + 1,
    }));

    const estimatedTotalTime = recommendations.reduce((sum, rec) => sum + rec.estimatedCompletionTime, 0) / 60;
    const successProbability =
      recommendations.length > 0
        ? recommendations.reduce((sum, rec) => sum + rec.successProbability, 0) / recommendations.length
        : 0;

    return {
      recommendedOrder,
      estimatedTotalTime,
      successProbability,
    };
  } catch (error) {
    console.error("[AdaptiveDifficulty] Error calculating learning path:", error);
    return {
      recommendedOrder: [],
      estimatedTotalTime: 0,
      successProbability: 0,
    };
  }
}
