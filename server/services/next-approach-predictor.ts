import { learningBehaviorAnalyzer } from "./learning-behavior-analyzer";

/**
 * Next Approach Predictor
 *
 * Predicts the optimal next learning approach based on:
 * - Current state (what they just learned, where they are)
 * - Historical effectiveness (what approaches worked for similar concepts)
 * - Engagement signals (are they getting bored? need challenge? need break?)
 * - Learning science principles (spacing, interleaving, difficulty calibration)
 */

export interface ApproachPrediction {
  recommendedApproachId: number;
  approachName: string;
  confidence: number; // 0-100
  reasoning: string;
  alternativeApproaches: Array<{
    approachId: number;
    approachName: string;
    confidence: number;
  }>;
  predictedEngagement: number; // 0-100
  predictedComprehension: number; // 0-100
  predictedRetention: number; // 0-100
  estimatedTimeMinutes: number;
  shouldTakeBreak: boolean;
  breakRecommendation?: string;
}

const APPROACH_NAMES: Record<number, string> = {
  1: "Socratic Questioning",
  2: "Problem-Based Learning",
  3: "Experiential Learning",
  4: "Peer Learning Network",
  5: "Learn by Teaching",
  6: "Gamified Challenges",
  7: "Microlearning Bursts",
  8: "AI-Guided Discovery",
  9: "Multimodal Synthesis",
};

class NextApproachPredictor {
  /**
   * Predict next optimal learning approach for user
   */
  async predictNextApproach(
    userId: string,
    currentTopicId: number,
    recentEngagementScore: number,
    recentComprehensionScore: number,
    sessionDurationSeconds: number,
    consecutiveSessionsWithoutBreak: number
  ): Promise<ApproachPrediction> {
    // Get user's learning profile
    const learningProfile = await learningBehaviorAnalyzer.getLearningStyleProfile(userId);
    const approachEffectiveness = await learningBehaviorAnalyzer.getApproachEffectiveness(userId);
    const behaviorPatterns = await learningBehaviorAnalyzer.getBehaviorPatterns(userId);

    // Analyze current state
    const currentState = this.analyzeCurrentState(
      recentEngagementScore,
      recentComprehensionScore,
      sessionDurationSeconds,
      consecutiveSessionsWithoutBreak,
      learningProfile
    );

    // Check if break is needed
    const shouldTakeBreak = this.shouldTakeBreak(
      sessionDurationSeconds,
      consecutiveSessionsWithoutBreak,
      learningProfile
    );

    if (shouldTakeBreak) {
      return this.generateBreakRecommendation(userId);
    }

    // Get approach effectiveness scores
    const approachScores = this.scoreApproaches(
      currentState,
      approachEffectiveness,
      learningProfile,
      behaviorPatterns
    );

    // Select top approach
    const topApproach = approachScores[0];
    const alternativeApproaches = approachScores.slice(1, 3);

    // Predict outcomes
    const predictions = this.predictOutcomes(topApproach, learningProfile);

    // Generate reasoning
    const reasoning = this.generateReasoning(topApproach, currentState, learningProfile);

    return {
      recommendedApproachId: topApproach.approachId,
      approachName: APPROACH_NAMES[topApproach.approachId],
      confidence: topApproach.score,
      reasoning,
      alternativeApproaches: alternativeApproaches.map((a) => ({
        approachId: a.approachId,
        approachName: APPROACH_NAMES[a.approachId],
        confidence: a.score,
      })),
      predictedEngagement: predictions.engagement,
      predictedComprehension: predictions.comprehension,
      predictedRetention: predictions.retention,
      estimatedTimeMinutes: this.estimateSessionTime(topApproach.approachId, learningProfile),
      shouldTakeBreak: false,
    };
  }

  /**
   * Analyze current learning state
   */
  private analyzeCurrentState(
    engagementScore: number,
    comprehensionScore: number,
    sessionDurationSeconds: number,
    consecutiveSessions: number,
    learningProfile: any
  ): {
    engagementLevel: "low" | "moderate" | "high";
    comprehensionLevel: "struggling" | "adequate" | "strong";
    fatigueLevel: "low" | "moderate" | "high";
    needsChallenge: boolean;
    needsSupport: boolean;
    needsVariety: boolean;
  } {
    // Engagement level
    const engagementLevel =
      engagementScore > 75 ? "high" : engagementScore > 50 ? "moderate" : "low";

    // Comprehension level
    const comprehensionLevel =
      comprehensionScore > 75 ? "strong" : comprehensionScore > 50 ? "adequate" : "struggling";

    // Fatigue level (based on session duration and consecutive sessions)
    const avgSessionLength = learningProfile?.preferredSessionLength || 30;
    const fatigueFactor = (sessionDurationSeconds / 60 / avgSessionLength) * consecutiveSessions;
    const fatigueLevel = fatigueFactor > 2 ? "high" : fatigueFactor > 1 ? "moderate" : "low";

    // Determine needs
    const needsChallenge = comprehensionScore > 80 && engagementScore > 70;
    const needsSupport = comprehensionScore < 50;
    const needsVariety = consecutiveSessions > 3;

    return {
      engagementLevel: engagementLevel as "low" | "moderate" | "high",
      comprehensionLevel: comprehensionLevel as "struggling" | "adequate" | "strong",
      fatigueLevel: fatigueLevel as "low" | "moderate" | "high",
      needsChallenge,
      needsSupport,
      needsVariety,
    };
  }

  /**
   * Check if user should take a break
   */
  private shouldTakeBreak(
    sessionDurationSeconds: number,
    consecutiveSessions: number,
    learningProfile: any
  ): boolean {
    const avgSessionLength = learningProfile?.preferredSessionLength || 30;
    const maxConsecutiveSessions = 4;

    // Take break if session is too long
    if (sessionDurationSeconds / 60 > avgSessionLength * 1.5) {
      return true;
    }

    // Take break after too many consecutive sessions
    if (consecutiveSessions >= maxConsecutiveSessions) {
      return true;
    }

    return false;
  }

  /**
   * Generate break recommendation
   */
  private generateBreakRecommendation(userId: string): ApproachPrediction {
    return {
      recommendedApproachId: 0,
      approachName: "Take a Break",
      confidence: 100,
      reasoning: "You've been learning for a while. Taking a break will help consolidate your learning and prevent burnout.",
      alternativeApproaches: [],
      predictedEngagement: 0,
      predictedComprehension: 0,
      predictedRetention: 100, // Breaks improve retention through consolidation
      estimatedTimeMinutes: 15,
      shouldTakeBreak: true,
      breakRecommendation:
        "Take a 10-15 minute break. Go for a walk, get some water, or do some light stretching. Your brain needs time to consolidate what you've learned.",
    };
  }

  /**
   * Score all approaches for current state
   */
  private scoreApproaches(
    currentState: any,
    approachEffectiveness: any[],
    learningProfile: any,
    behaviorPatterns: any[]
  ): Array<{ approachId: number; score: number }> {
    const scores: Map<number, number> = new Map();

    // Initialize all approaches with base score
    for (let i = 1; i <= 9; i++) {
      scores.set(i, 50);
    }

    // Adjust based on user's historical effectiveness
    approachEffectiveness.forEach((eff) => {
      const currentScore = scores.get(eff.approachId) || 50;
      scores.set(eff.approachId, currentScore + (eff.overallEffectiveness || 0) * 0.3);
    });

    // Adjust based on current state
    if (currentState.engagementLevel === "low") {
      // Boost engaging approaches (Challenges, Peer, Gamified)
      scores.set(6, (scores.get(6) || 50) + 20); // Challenges
      scores.set(4, (scores.get(4) || 50) + 15); // Peer
      scores.set(7, (scores.get(7) || 50) + 10); // Microlearning
    }

    if (currentState.comprehensionLevel === "struggling") {
      // Boost supportive approaches (Socratic, Experiential, Discovery)
      scores.set(1, (scores.get(1) || 50) + 20); // Socratic
      scores.set(3, (scores.get(3) || 50) + 15); // Experiential
      scores.set(8, (scores.get(8) || 50) + 15); // Discovery
    }

    if (currentState.needsChallenge) {
      // Boost challenging approaches (Problem-based, Teaching, Synthesis)
      scores.set(2, (scores.get(2) || 50) + 20); // Problem-based
      scores.set(5, (scores.get(5) || 50) + 15); // Teaching
      scores.set(9, (scores.get(9) || 50) + 15); // Synthesis
    }

    if (currentState.needsVariety) {
      // Boost approaches different from recent ones
      // This encourages interleaving
      scores.set(8, (scores.get(8) || 50) + 15); // Discovery
      scores.set(4, (scores.get(4) || 50) + 10); // Peer
      scores.set(9, (scores.get(9) || 50) + 10); // Synthesis
    }

    // Adjust based on learning profile preferences
    if (learningProfile) {
      if (learningProfile.socialEngagement > 70) {
        scores.set(4, (scores.get(4) || 50) + 10); // Peer
        scores.set(5, (scores.get(5) || 50) + 5); // Teaching
      }

      if (learningProfile.competitiveEngagement > 70) {
        scores.set(6, (scores.get(6) || 50) + 15); // Challenges
      }

      if (learningProfile.creativeEngagement > 70) {
        scores.set(5, (scores.get(5) || 50) + 10); // Teaching
        scores.set(9, (scores.get(9) || 50) + 10); // Synthesis
      }

      if (learningProfile.discoveryEngagement > 70) {
        scores.set(8, (scores.get(8) || 50) + 15); // Discovery
        scores.set(2, (scores.get(2) || 50) + 10); // Problem-based
      }
    }

    // Convert to array and sort
    return Array.from(scores.entries())
      .map(([approachId, score]) => ({
        approachId,
        score: Math.max(0, Math.min(100, score)), // Clamp to 0-100
      }))
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Predict outcomes for an approach
   */
  private predictOutcomes(
    approach: { approachId: number; score: number },
    learningProfile: any
  ): {
    engagement: number;
    comprehension: number;
    retention: number;
  } {
    // Base predictions for each approach
    const basePredictions: Record<number, { engagement: number; comprehension: number; retention: number }> = {
      1: { engagement: 70, comprehension: 85, retention: 80 }, // Socratic
      2: { engagement: 75, comprehension: 90, retention: 85 }, // Problem-based
      3: { engagement: 85, comprehension: 80, retention: 75 }, // Experiential
      4: { engagement: 80, comprehension: 75, retention: 70 }, // Peer
      5: { engagement: 75, comprehension: 90, retention: 90 }, // Teaching
      6: { engagement: 90, comprehension: 70, retention: 65 }, // Challenges
      7: { engagement: 65, comprehension: 70, retention: 85 }, // Microlearning
      8: { engagement: 80, comprehension: 85, retention: 80 }, // Discovery
      9: { engagement: 85, comprehension: 85, retention: 80 }, // Synthesis
    };

    const base = basePredictions[approach.approachId] || {
      engagement: 75,
      comprehension: 75,
      retention: 75,
    };

    // Adjust based on approach score (confidence)
    const adjustment = (approach.score - 50) / 50; // -1 to 1

    return {
      engagement: Math.round(base.engagement + adjustment * 10),
      comprehension: Math.round(base.comprehension + adjustment * 10),
      retention: Math.round(base.retention + adjustment * 10),
    };
  }

  /**
   * Generate reasoning for recommendation
   */
  private generateReasoning(
    approach: { approachId: number; score: number },
    currentState: any,
    learningProfile: any
  ): string {
    const approachName = APPROACH_NAMES[approach.approachId];
    let reasoning = `${approachName} is recommended because `;

    if (currentState.engagementLevel === "low") {
      reasoning += "you need more engaging content to maintain motivation. ";
    } else if (currentState.comprehensionLevel === "struggling") {
      reasoning += "you need more support to understand the material. ";
    } else if (currentState.needsChallenge) {
      reasoning += "you're ready for a greater challenge. ";
    }

    reasoning += `This approach has a ${approach.score}% match with your learning profile.`;

    return reasoning;
  }

  /**
   * Estimate session time for an approach
   */
  private estimateSessionTime(approachId: number, learningProfile: any): number {
    const baseTime: Record<number, number> = {
      1: 25, // Socratic
      2: 45, // Problem-based
      3: 30, // Experiential
      4: 20, // Peer
      5: 35, // Teaching
      6: 30, // Challenges
      7: 5, // Microlearning
      8: 25, // Discovery
      9: 40, // Synthesis
    };

    const base = baseTime[approachId] || 25;
    const paceMultiplier =
      learningProfile?.preferredPace === "fast"
        ? 0.8
        : learningProfile?.preferredPace === "slow"
          ? 1.2
          : 1;

    return Math.round(base * paceMultiplier);
  }
}

// Export singleton
export const nextApproachPredictor = new NextApproachPredictor();
