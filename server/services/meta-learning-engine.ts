import { getDb } from "../db";
import { eq, and, desc } from "drizzle-orm";
import {
  learningApproaches,
  userLearningProfiles,
  learningApproachExperiments,
  approachEffectivenessScores,
  stagnationEvents,
} from "../db/schema-meta-learning";

/**
 * Meta-Learning Engine
 *
 * Core system that:
 * 1. Experiments with 9 learning approaches for each user
 * 2. Measures effectiveness across multiple dimensions
 * 3. Learns optimal approach mix for each learner
 * 4. Prevents stagnation through innovation triggers
 * 5. Continuously evolves with the learner
 */

export interface LearningApproachMetrics {
  engagementScore: number; // 0-100
  comprehensionScore: number; // 0-100
  retentionScore: number; // 0-100
  applicationScore: number; // 0-100
  confidenceScore: number; // 0-100
  timeSpentSeconds: number;
  completionPercentage: number; // 0-100
}

export interface UserLearningProfile {
  userId: string;
  preferredApproaches: {
    approachId: number;
    weight: number;
    confidence: number;
  }[];
  learningStyle: string;
  pacePreference: string;
  engagementLevel: number;
  confidenceLevel: number;
  stagnationScore: number;
}

class MetaLearningEngine {
  // The 9 innovative learning approaches
  private readonly approaches = [
    {
      id: 1,
      name: "socratic",
      displayName: "Socratic Questioning",
      description: "Learn through guided questions that lead to discovery",
      category: "questioning",
    },
    {
      id: 2,
      name: "problem_based",
      displayName: "Problem-Based Learning",
      description: "Learn by solving real-world problems",
      category: "problem_solving",
    },
    {
      id: 3,
      name: "experiential",
      displayName: "Experiential Learning",
      description: "Learn through hands-on experience and simulation",
      category: "experience",
    },
    {
      id: 4,
      name: "peer_learning",
      displayName: "Peer Learning Network",
      description: "Learn from and with other learners",
      category: "social",
    },
    {
      id: 5,
      name: "teach_others",
      displayName: "Learn by Teaching",
      description: "Solidify understanding by teaching others",
      category: "creation",
    },
    {
      id: 6,
      name: "challenges",
      displayName: "Gamified Challenges",
      description: "Learn through competitive problem-solving",
      category: "competition",
    },
    {
      id: 7,
      name: "microlearning",
      displayName: "Microlearning Bursts",
      description: "Learn in short, focused bursts with spaced innovation",
      category: "micro",
    },
    {
      id: 8,
      name: "discovery",
      displayName: "AI-Guided Discovery",
      description: "Learn through AI-guided exploration and discovery",
      category: "discovery",
    },
    {
      id: 9,
      name: "synthesis",
      displayName: "Multimodal Synthesis",
      description: "Learn by synthesizing knowledge across multiple modalities",
      category: "synthesis",
    },
  ];

  /**
   * Initialize or get user learning profile
   */
  async initializeUserProfile(userId: string): Promise<UserLearningProfile> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Check if profile exists
    const existing = await db
      .select()
      .from(userLearningProfiles)
      .where(eq(userLearningProfiles.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      return this.mapToUserProfile(existing[0]);
    }

    // Create new profile with equal weights for all approaches
    const initialWeights = this.approaches.map((approach) => ({
      approachId: approach.id,
      weight: 100 / this.approaches.length, // ~11% each
      confidence: 10, // Low confidence initially
    }));

    await db.insert(userLearningProfiles).values({
      userId,
      preferredApproaches: initialWeights,
      engagementLevel: 50,
      confidenceLevel: 50,
      stagnationScore: 0,
    });

    return {
      userId,
      preferredApproaches: initialWeights,
      learningStyle: "visual",
      pacePreference: "moderate",
      engagementLevel: 50,
      confidenceLevel: 50,
      stagnationScore: 0,
    };
  }

  /**
   * Select next learning approach for a user
   * Uses weighted random selection based on effectiveness
   */
  async selectNextApproach(userId: string, topicId: number): Promise<number> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const profile = await this.initializeUserProfile(userId);

    // Get effectiveness scores for each approach
    const scores = await db
      .select()
      .from(approachEffectivenessScores)
      .where(eq(approachEffectivenessScores.userId, userId));

    // Build weighted selection pool
    const weights = profile.preferredApproaches.map((pref) => {
      const score = scores.find((s) => s.approachId === pref.approachId);
      // Combine preference weight with effectiveness
      const effectiveness = score?.overallScore || 50;
      return {
        approachId: pref.approachId,
        weight: pref.weight * (effectiveness / 100),
      };
    });

    // Normalize weights
    const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
    const normalized = weights.map((w) => ({
      ...w,
      weight: w.weight / totalWeight,
    }));

    // Weighted random selection
    const random = Math.random();
    let cumulative = 0;
    for (const item of normalized) {
      cumulative += item.weight;
      if (random <= cumulative) {
        return item.approachId;
      }
    }

    return normalized[0].approachId;
  }

  /**
   * Record learning approach experiment
   */
  async recordExperiment(
    userId: string,
    topicId: number,
    topicName: string,
    approachId: number,
    metrics: LearningApproachMetrics
  ): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Calculate overall effectiveness (weighted average)
    const overallEffectiveness = Math.round(
      (metrics.engagementScore * 0.2 +
        metrics.comprehensionScore * 0.3 +
        metrics.retentionScore * 0.25 +
        metrics.applicationScore * 0.15 +
        metrics.confidenceScore * 0.1) /
        100
    );

    // Get experiment sequence number
    const lastExperiment = await db
      .select()
      .from(learningApproachExperiments)
      .where(eq(learningApproachExperiments.userId, userId))
      .orderBy(desc(learningApproachExperiments.experimentSequence))
      .limit(1);

    const experimentSequence = (lastExperiment[0]?.experimentSequence || 0) + 1;

    // Record experiment
    await db.insert(learningApproachExperiments).values({
      userId,
      topicId,
      topicName,
      approachId,
      experimentSequence,
      isRandomized: true,
      engagementScore: metrics.engagementScore,
      comprehensionScore: metrics.comprehensionScore,
      retentionScore: metrics.retentionScore,
      applicationScore: metrics.applicationScore,
      confidenceScore: metrics.confidenceScore,
      overallEffectiveness,
      timeSpentSeconds: metrics.timeSpentSeconds,
      completionPercentage: metrics.completionPercentage,
      status: "completed",
    });

    // Update effectiveness scores
    await this.updateEffectivenessScores(userId, approachId);

    // Check for stagnation
    await this.checkAndHandleStagnation(userId);
  }

  /**
   * Update aggregated effectiveness scores for an approach
   */
  private async updateEffectivenessScores(userId: string, approachId: number): Promise<void> {
    const db = await getDb();
    if (!db) return;

    // Get all experiments for this user-approach combination
    const experiments = await db
      .select()
      .from(learningApproachExperiments)
      .where(
        and(
          eq(learningApproachExperiments.userId, userId),
          eq(learningApproachExperiments.approachId, approachId)
        )
      );

    if (experiments.length === 0) return;

    // Calculate averages
    const avgEngagement =
      experiments.reduce((sum, e) => sum + (e.engagementScore || 0), 0) / experiments.length;
    const avgComprehension =
      experiments.reduce((sum, e) => sum + (e.comprehensionScore || 0), 0) / experiments.length;
    const avgRetention =
      experiments.reduce((sum, e) => sum + (e.retentionScore || 0), 0) / experiments.length;
    const avgApplication =
      experiments.reduce((sum, e) => sum + (e.applicationScore || 0), 0) / experiments.length;
    const avgConfidence =
      experiments.reduce((sum, e) => sum + (e.confidenceScore || 0), 0) / experiments.length;

    // Calculate overall score
    const overallScore = Math.round(
      avgEngagement * 0.2 +
        avgComprehension * 0.3 +
        avgRetention * 0.25 +
        avgApplication * 0.15 +
        avgConfidence * 0.1
    );

    // Calculate trend (improvement or decline)
    const recent = experiments.slice(-5);
    const older = experiments.slice(0, Math.max(1, experiments.length - 5));
    const recentAvg =
      recent.reduce((sum, e) => sum + (e.overallEffectiveness || 0), 0) / recent.length;
    const olderAvg = older.reduce((sum, e) => sum + (e.overallEffectiveness || 0), 0) / older.length;
    const scoreImprovement = recentAvg - olderAvg;

    // Calculate consistency
    const variance =
      experiments.reduce((sum, e) => sum + Math.pow((e.overallEffectiveness || 0) - overallScore, 2), 0) /
      experiments.length;
    const consistencyScore = Math.max(0, 100 - Math.sqrt(variance));

    // Upsert effectiveness score
    const existing = await db
      .select()
      .from(approachEffectivenessScores)
      .where(
        and(
          eq(approachEffectivenessScores.userId, userId),
          eq(approachEffectivenessScores.approachId, approachId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(approachEffectivenessScores)
        .set({
          totalExperiments: experiments.length,
          averageEngagement: avgEngagement,
          averageComprehension: avgComprehension,
          averageRetention: avgRetention,
          averageApplication: avgApplication,
          averageConfidence: avgConfidence,
          overallScore,
          scoreImprovement,
          consistencyScore,
        })
        .where(
          and(
            eq(approachEffectivenessScores.userId, userId),
            eq(approachEffectivenessScores.approachId, approachId)
          )
        );
    } else {
      await db.insert(approachEffectivenessScores).values({
        userId,
        approachId,
        totalExperiments: experiments.length,
        averageEngagement: avgEngagement,
        averageComprehension: avgComprehension,
        averageRetention: avgRetention,
        averageApplication: avgApplication,
        averageConfidence: avgConfidence,
        overallScore,
        scoreImprovement,
        consistencyScore,
      });
    }
  }

  /**
   * Check for stagnation and trigger innovation if needed
   */
  private async checkAndHandleStagnation(userId: string): Promise<void> {
    const db = await getDb();
    if (!db) return;

    const profile = await db
      .select()
      .from(userLearningProfiles)
      .where(eq(userLearningProfiles.userId, userId))
      .limit(1);

    if (profile.length === 0) return;

    // Calculate stagnation score based on multiple factors
    const recentExperiments = await db
      .select()
      .from(learningApproachExperiments)
      .where(eq(learningApproachExperiments.userId, userId))
      .orderBy(desc(learningApproachExperiments.createdAt))
      .limit(10);

    if (recentExperiments.length < 3) return; // Not enough data

    // Check for performance plateau
    const avgScores = recentExperiments.map((e) => e.overallEffectiveness || 0);
    const variance =
      avgScores.reduce((sum, s) => sum + Math.pow(s - 50, 2), 0) / avgScores.length;
    const performancePlateau = variance < 100 ? 50 : 0; // Low variance = plateau

    // Check for approach overuse (same approach too many times)
    const approachCounts = new Map<number, number>();
    recentExperiments.forEach((e) => {
      approachCounts.set(e.approachId, (approachCounts.get(e.approachId) || 0) + 1);
    });
    const maxCount = Math.max(...Array.from(approachCounts.values()));
    const approachOveruse = maxCount > 6 ? 50 : 0; // More than 6 of same approach

    // Check for engagement decline
    const engagementTrend =
      (recentExperiments[0].engagementScore || 0) -
      (recentExperiments[recentExperiments.length - 1].engagementScore || 0);
    const engagementDecline = engagementTrend < -20 ? 50 : 0;

    const stagnationScore = Math.min(100, performancePlateau + approachOveruse + engagementDecline);

    // Update profile stagnation score
    await db
      .update(userLearningProfiles)
      .set({
        stagnationScore,
        lastInnovationAt: stagnationScore > 60 ? new Date() : profile[0].lastInnovationAt,
      })
      .where(eq(userLearningProfiles.userId, userId));

    // If stagnation is high, trigger innovation
    if (stagnationScore > 60) {
      await this.triggerInnovation(userId, stagnationScore);
    }
  }

  /**
   * Trigger innovation to break stagnation
   */
  private async triggerInnovation(userId: string, stagnationScore: number): Promise<void> {
    const db = await getDb();
    if (!db) return;

    // Determine stagnation type
    let stagnationType = "performance_plateau";
    if (stagnationScore > 70) {
      stagnationType = "approach_overuse";
    } else if (stagnationScore > 80) {
      stagnationType = "engagement_decline";
    }

    // Select underutilized approach to try
    const scores = await db
      .select()
      .from(approachEffectivenessScores)
      .where(eq(approachEffectivenessScores.userId, userId));

    const underutilized = this.approaches.find(
      (approach) => !scores.some((s) => s.approachId === approach.id)
    );

    const innovationApproach = underutilized?.name || "discovery";

    // Record stagnation event
    await db.insert(stagnationEvents).values({
      userId,
      stagnationType,
      stagnationScore,
      innovationApproach,
      innovationDescription: `Triggered innovation to break ${stagnationType}. Introducing ${innovationApproach} approach.`,
    });
  }

  /**
   * Get user's learning profile with approach effectiveness
   */
  async getUserLearningProfile(userId: string): Promise<any> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const profile = await this.initializeUserProfile(userId);
    const scores = await db
      .select()
      .from(approachEffectivenessScores)
      .where(eq(approachEffectivenessScores.userId, userId));

    const approaches = profile.preferredApproaches.map((pref) => {
      const score = scores.find((s) => s.approachId === pref.approachId);
      const approach = this.approaches.find((a) => a.id === pref.approachId);
      return {
        ...approach,
        weight: pref.weight,
        confidence: pref.confidence,
        effectiveness: score?.overallScore || 0,
        experiments: score?.totalExperiments || 0,
      };
    });

    return {
      ...profile,
      approaches,
    };
  }

  /**
   * Map database profile to user profile type
   */
  private mapToUserProfile(dbProfile: any): UserLearningProfile {
    return {
      userId: dbProfile.userId,
      preferredApproaches: dbProfile.preferredApproaches || [],
      learningStyle: dbProfile.learningStyle || "visual",
      pacePreference: dbProfile.pacePreference || "moderate",
      engagementLevel: dbProfile.engagementLevel || 50,
      confidenceLevel: dbProfile.confidenceLevel || 50,
      stagnationScore: dbProfile.stagnationScore || 0,
    };
  }
}

// Export singleton
export const metaLearningEngine = new MetaLearningEngine();
