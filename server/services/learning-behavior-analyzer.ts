import { getDb } from "../db";
import { eq, and, desc, avg, sum } from "drizzle-orm";
import {
  learningBehaviorSignals,
  learningStyleProfiles,
  learningBehaviorPatterns,
  userApproachEffectiveness,
  learningContext,
  knowledgeAssessments,
} from "../db/schema-learning-behavior";

/**
 * Learning Behavior Analyzer
 *
 * Analyzes user learning behavior like TikTok analyzes content preferences
 * Tracks engagement, pacing, comprehension, and learning style to build personalized profiles
 */

export interface BehaviorSignal {
  userId: string;
  topicId: number;
  approachId: number;
  timeSpentSeconds: number;
  attentionDropoffs: number;
  revisitCount: number;
  completionPercentage: number;
  assessmentScore: number;
  engagementType: string;
  engagementScore: number;
  selfReportedConfidence: number;
}

export interface LearningStyleProfile {
  userId: string;
  visualLearning: number;
  kinestheticLearning: number;
  auditoryLearning: number;
  readingWritingLearning: number;
  socialEngagement: number;
  competitiveEngagement: number;
  creativeEngagement: number;
  discoveryEngagement: number;
  preferredPace: string;
  primaryMotivator: string;
  profileStrength: number;
}

class LearningBehaviorAnalyzer {
  /**
   * Record a learning behavior signal
   */
  async recordBehaviorSignal(signal: BehaviorSignal): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Infer engagement type from behavior patterns
    const engagementType = this.inferEngagementType(signal);

    // Infer confidence from behavior
    const inferredConfidence = this.inferConfidence(signal);

    await db.insert(learningBehaviorSignals).values({
      userId: signal.userId,
      topicId: signal.topicId,
      approachId: signal.approachId,
      timeSpentSeconds: signal.timeSpentSeconds,
      attentionDropoffs: signal.attentionDropoffs,
      revisitCount: signal.revisitCount,
      completionPercentage: signal.completionPercentage,
      assessmentScore: signal.assessmentScore,
      engagementType,
      engagementScore: signal.engagementScore,
      selfReportedConfidence: signal.selfReportedConfidence,
      inferredConfidence,
    });

    // Update learning style profile
    await this.updateLearningStyleProfile(signal.userId);

    // Identify behavior patterns
    await this.identifyBehaviorPatterns(signal.userId);
  }

  /**
   * Infer engagement type from behavior patterns
   */
  private inferEngagementType(signal: BehaviorSignal): string {
    // Analyze behavior to determine engagement type
    if (signal.revisitCount > 3) return "social"; // Returning suggests discussion/collaboration
    if (signal.engagementScore > 80 && signal.assessmentScore > 80) return "competitive"; // High engagement + high score
    if (signal.completionPercentage < 50 && signal.attentionDropoffs > 2) return "discovery"; // Exploring, not completing
    if (signal.timeSpentSeconds > 1800) return "creative"; // Long sessions suggest creation
    if (signal.engagementScore > 70) return "kinesthetic"; // High engagement suggests hands-on
    if (signal.assessmentScore > 75) return "reading"; // High score suggests reading/comprehension
    return "visual"; // Default
  }

  /**
   * Infer confidence from behavior patterns
   */
  private inferConfidence(signal: BehaviorSignal): number {
    let confidence = 50; // Baseline

    // Adjust based on assessment performance
    if (signal.assessmentScore > 80) confidence += 25;
    else if (signal.assessmentScore > 60) confidence += 10;
    else if (signal.assessmentScore < 40) confidence -= 15;

    // Adjust based on completion
    if (signal.completionPercentage > 90) confidence += 10;
    else if (signal.completionPercentage < 50) confidence -= 10;

    // Adjust based on revisits (revisiting suggests uncertainty)
    if (signal.revisitCount > 5) confidence -= 10;

    // Adjust based on attention dropoffs
    confidence -= signal.attentionDropoffs * 5;

    return Math.max(0, Math.min(100, confidence));
  }

  /**
   * Update learning style profile based on new signals
   */
  private async updateLearningStyleProfile(userId: string): Promise<void> {
    const db = await getDb();
    if (!db) return;

    // Get all behavior signals for this user
    const signals = await db
      .select()
      .from(learningBehaviorSignals)
      .where(eq(learningBehaviorSignals.userId, userId));

    if (signals.length === 0) return;

    // Calculate learning modality preferences
    const visualCount = signals.filter((s) => s.engagementType === "visual").length;
    const kinestheticCount = signals.filter((s) => s.engagementType === "kinesthetic").length;
    const auditoryCount = signals.filter((s) => s.engagementType === "auditory").length;
    const readingCount = signals.filter((s) => s.engagementType === "reading").length;

    const total = signals.length;
    const visualLearning = (visualCount / total) * 100;
    const kinestheticLearning = (kinestheticCount / total) * 100;
    const auditoryLearning = (auditoryCount / total) * 100;
    const readingWritingLearning = (readingCount / total) * 100;

    // Calculate engagement preferences
    const socialCount = signals.filter((s) => s.engagementType === "social").length;
    const competitiveCount = signals.filter((s) => s.engagementType === "competitive").length;
    const creativeCount = signals.filter((s) => s.engagementType === "creative").length;
    const discoveryCount = signals.filter((s) => s.engagementType === "discovery").length;

    const socialEngagement = (socialCount / total) * 100;
    const competitiveEngagement = (competitiveCount / total) * 100;
    const creativeEngagement = (creativeCount / total) * 100;
    const discoveryEngagement = (discoveryCount / total) * 100;

    // Calculate pacing preference
    const avgTimeSpent = signals.reduce((sum, s) => sum + s.timeSpentSeconds, 0) / total;
    const preferredPace = avgTimeSpent > 1800 ? "slow" : avgTimeSpent > 900 ? "moderate" : "fast";
    const preferredSessionLength = Math.round(avgTimeSpent / 60);

    // Calculate primary motivator
    const primaryMotivator = this.determinePrimaryMotivator({
      socialEngagement,
      competitiveEngagement,
      creativeEngagement,
      discoveryEngagement,
    });

    // Calculate confidence metrics
    const avgConfidence = signals.reduce((sum, s) => sum + (s.inferredConfidence || 0), 0) / total;
    const avgAssessmentScore = signals.reduce((sum, s) => sum + (s.assessmentScore || 0), 0) / total;

    // Determine profile strength (confidence in accuracy)
    const profileStrength = Math.min(100, total * 10); // More signals = higher confidence

    // Check if profile exists
    const existing = await db
      .select()
      .from(learningStyleProfiles)
      .where(eq(learningStyleProfiles.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(learningStyleProfiles)
        .set({
          visualLearning,
          kinestheticLearning,
          auditoryLearning,
          readingWritingLearning,
          socialEngagement,
          competitiveEngagement,
          creativeEngagement,
          discoveryEngagement,
          preferredPace,
          preferredSessionLength,
          primaryMotivator,
          baselineConfidence: Math.round(avgConfidence),
          profileStrength: Math.min(100, profileStrength),
        })
        .where(eq(learningStyleProfiles.userId, userId));
    } else {
      await db.insert(learningStyleProfiles).values({
        userId,
        visualLearning,
        kinestheticLearning,
        auditoryLearning,
        readingWritingLearning,
        socialEngagement,
        competitiveEngagement,
        creativeEngagement,
        discoveryEngagement,
        preferredPace,
        preferredSessionLength,
        primaryMotivator,
        baselineConfidence: Math.round(avgConfidence),
        profileStrength: Math.min(100, profileStrength),
      });
    }
  }

  /**
   * Determine primary motivator based on engagement patterns
   */
  private determinePrimaryMotivator(engagement: {
    socialEngagement: number;
    competitiveEngagement: number;
    creativeEngagement: number;
    discoveryEngagement: number;
  }): string {
    const max = Math.max(
      engagement.socialEngagement,
      engagement.competitiveEngagement,
      engagement.creativeEngagement,
      engagement.discoveryEngagement
    );

    if (engagement.socialEngagement === max) return "relatedness";
    if (engagement.competitiveEngagement === max) return "achievement";
    if (engagement.creativeEngagement === max) return "autonomy";
    if (engagement.discoveryEngagement === max) return "curiosity";
    return "mastery";
  }

  /**
   * Identify behavior patterns
   */
  private async identifyBehaviorPatterns(userId: string): Promise<void> {
    const db = await getDb();
    if (!db) return;

    // Get recent signals
    const recentSignals = await db
      .select()
      .from(learningBehaviorSignals)
      .where(eq(learningBehaviorSignals.userId, userId))
      .orderBy(desc(learningBehaviorSignals.createdAt))
      .limit(20);

    if (recentSignals.length < 5) return; // Need at least 5 signals to identify patterns

    // Identify time of day pattern
    const timeOfDayPattern = this.identifyTimeOfDayPattern(recentSignals);
    if (timeOfDayPattern) {
      await this.recordPattern(userId, "time_of_day", timeOfDayPattern.name, timeOfDayPattern.data);
    }

    // Identify topic preference pattern
    const topicPattern = this.identifyTopicPreferencePattern(recentSignals);
    if (topicPattern) {
      await this.recordPattern(userId, "topic_preference", topicPattern.name, topicPattern.data);
    }

    // Identify approach preference pattern
    const approachPattern = this.identifyApproachPreferencePattern(recentSignals);
    if (approachPattern) {
      await this.recordPattern(userId, "approach_preference", approachPattern.name, approachPattern.data);
    }

    // Identify difficulty sweet spot
    const difficultyPattern = this.identifyDifficultySweetSpot(recentSignals);
    if (difficultyPattern) {
      await this.recordPattern(userId, "difficulty_sweet_spot", difficultyPattern.name, difficultyPattern.data);
    }
  }

  /**
   * Identify time of day pattern
   */
  private identifyTimeOfDayPattern(signals: any[]): { name: string; data: any } | null {
    const timeGroups = { morning: 0, afternoon: 0, evening: 0 };

    signals.forEach((signal) => {
      const hour = new Date(signal.createdAt).getHours();
      if (hour < 12) timeGroups.morning++;
      else if (hour < 17) timeGroups.afternoon++;
      else timeGroups.evening++;
    });

    const max = Math.max(timeGroups.morning, timeGroups.afternoon, timeGroups.evening);
    const bestTime = Object.entries(timeGroups).find(([_, count]) => count === max)?.[0];

    if (bestTime && max > signals.length * 0.4) {
      return {
        name: `Best learning time: ${bestTime}`,
        data: { timeOfDay: bestTime, frequency: max, total: signals.length },
      };
    }

    return null;
  }

  /**
   * Identify topic preference pattern
   */
  private identifyTopicPreferencePattern(signals: any[]): { name: string; data: any } | null {
    const topicScores = new Map<number, { count: number; avgScore: number }>();

    signals.forEach((signal: any) => {
      const current = topicScores.get(signal.topicId) || { count: 0, avgScore: 0 };
      current.count++;
      current.avgScore = (current.avgScore * (current.count - 1) + (signal.assessmentScore || 0)) / current.count;
      topicScores.set(signal.topicId, current);
    });

    // Find most successful topic
    let bestTopic: [number, { count: number; avgScore: number }] | null = null;
    let bestScore = 0;

    for (const [key, value] of topicScores.entries()) {
      if (value.avgScore > bestScore) {
        bestScore = value.avgScore;
        bestTopic = [key, value];
      }
    }

    if (bestTopic && bestScore > 70) {
      return {
        name: `Preferred topic: ${bestTopic[0]}`,
        data: { topicId: bestTopic[0], avgScore: bestTopic[1].avgScore, frequency: bestTopic[1].count },
      };
    }

    return null;
  }

  /**
   * Identify approach preference pattern
   */
  private identifyApproachPreferencePattern(signals: any[]): { name: string; data: any } | null {
    const approachScores = new Map<number, { count: number; avgScore: number }>();

    signals.forEach((signal: any) => {
      const current = approachScores.get(signal.approachId) || { count: 0, avgScore: 0 };
      current.count++;
      current.avgScore = (current.avgScore * (current.count - 1) + (signal.engagementScore || 0)) / current.count;
      approachScores.set(signal.approachId, current);
    });

    // Find most effective approach
    let bestApproach: [number, { count: number; avgScore: number }] | null = null;
    let bestScore = 0;

    for (const [key, value] of approachScores.entries()) {
      if (value.avgScore > bestScore) {
        bestScore = value.avgScore;
        bestApproach = [key, value];
      }
    }

    if (bestApproach && bestScore > 70) {
      return {
        name: `Preferred approach: ${bestApproach[0]}`,
        data: { approachId: bestApproach[0], avgScore: bestApproach[1].avgScore, frequency: bestApproach[1].count },
      };
    }

    return null;
  }

  /**
   * Identify difficulty sweet spot
   */
  private identifyDifficultySweetSpot(signals: any[]): { name: string; data: any } | null {
    // Analyze signals to find optimal difficulty level
    // High engagement + high completion + high score = sweet spot
    const sweetSpotSignals = signals.filter(
      (s) =>
        (s.engagementScore || 0) > 70 &&
        (s.completionPercentage || 0) > 80 &&
        (s.assessmentScore || 0) > 70
    );

    if (sweetSpotSignals.length > signals.length * 0.3) {
      return {
        name: "Difficulty sweet spot identified",
        data: {
          avgEngagement: sweetSpotSignals.reduce((sum, s) => sum + (s.engagementScore || 0), 0) / sweetSpotSignals.length,
          avgCompletion: sweetSpotSignals.reduce((sum, s) => sum + (s.completionPercentage || 0), 0) / sweetSpotSignals.length,
          avgScore: sweetSpotSignals.reduce((sum, s) => sum + (s.assessmentScore || 0), 0) / sweetSpotSignals.length,
        },
      };
    }

    return null;
  }

  /**
   * Record a behavior pattern
   */
  private async recordPattern(
    userId: string,
    patternType: string,
    patternName: string,
    patternData: any
  ): Promise<void> {
    const db = await getDb();
    if (!db) return;

    await db.insert(learningBehaviorPatterns).values({
      userId,
      patternType,
      patternName,
      description: `Identified pattern: ${patternName}`,
      patternData,
      confidence: 75,
      occurrenceCount: 1,
    });
  }

  /**
   * Get user's learning style profile
   */
  async getLearningStyleProfile(userId: string): Promise<LearningStyleProfile | null> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const profile = await db
      .select()
      .from(learningStyleProfiles)
      .where(eq(learningStyleProfiles.userId, userId))
      .limit(1);

    return profile.length > 0 ? (profile[0] as any) : null;
  }

  /**
   * Get user's behavior patterns
   */
  async getBehaviorPatterns(userId: string): Promise<any[]> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    return db
      .select()
      .from(learningBehaviorPatterns)
      .where(eq(learningBehaviorPatterns.userId, userId))
      .orderBy(desc(learningBehaviorPatterns.createdAt));
  }

  /**
   * Get approach effectiveness for user
   */
  async getApproachEffectiveness(userId: string): Promise<any[]> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    return db
      .select()
      .from(userApproachEffectiveness)
      .where(eq(userApproachEffectiveness.userId, userId))
      .orderBy(desc(userApproachEffectiveness.overallEffectiveness));
  }

  /**
   * Get learning context for user
   */
  async getLearningContext(userId: string): Promise<any | null> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const context = await db
      .select()
      .from(learningContext)
      .where(eq(learningContext.userId, userId))
      .limit(1);

    return context.length > 0 ? context[0] : null;
  }
}

// Export singleton
export const learningBehaviorAnalyzer = new LearningBehaviorAnalyzer();
