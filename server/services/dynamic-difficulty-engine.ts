import { learningBehaviorAnalyzer } from "./learning-behavior-analyzer";

/**
 * Dynamic Difficulty Engine
 *
 * Adjusts challenge level in real-time during learning sessions
 * Maintains "desirable difficulty" - challenging enough to promote learning,
 * but not so hard as to cause frustration
 */

export interface DifficultyAdjustment {
  currentDifficulty: number; // 1-5
  recommendedDifficulty: number; // 1-5
  adjustmentReason: string;
  shouldAdjust: boolean;
  adjustmentMagnitude: "small" | "medium" | "large";
  nextChallengeType: string;
}

class DynamicDifficultyEngine {
  /**
   * Analyze current performance and recommend difficulty adjustment
   */
  async adjustDifficultyInRealTime(
    userId: string,
    currentDifficulty: number, // 1-5
    sessionMetrics: {
      assessmentScores: number[]; // Recent scores
      timePerQuestion: number; // seconds
      hintUsageRate: number; // 0-1
      mistakeRate: number; // 0-1
      engagementScore: number; // 0-100
      confidenceScore: number; // 0-100
      timeSpentSeconds: number;
    }
  ): Promise<DifficultyAdjustment> {
    const learningProfile = await learningBehaviorAnalyzer.getLearningStyleProfile(userId);

    // Calculate performance metrics
    const avgScore = sessionMetrics.assessmentScores.length > 0
      ? sessionMetrics.assessmentScores.reduce((a, b) => a + b, 0) / sessionMetrics.assessmentScores.length
      : 50;

    const performanceIndex = this.calculatePerformanceIndex(
      avgScore,
      sessionMetrics.timePerQuestion,
      sessionMetrics.hintUsageRate,
      sessionMetrics.mistakeRate,
      sessionMetrics.engagementScore
    );

    // Determine recommended difficulty
    let recommendedDifficulty = currentDifficulty;
    let adjustmentReason = "";
    let adjustmentMagnitude: "small" | "medium" | "large" = "small";

    // Optimal performance index is 70-80 (challenging but achievable)
    if (performanceIndex > 85) {
      // Too easy - increase difficulty
      recommendedDifficulty = Math.min(5, currentDifficulty + 1);
      adjustmentReason = "Performance is excellent; increasing challenge to maintain engagement";
      adjustmentMagnitude = performanceIndex > 95 ? "large" : "medium";
    } else if (performanceIndex < 40) {
      // Too hard - decrease difficulty
      recommendedDifficulty = Math.max(1, currentDifficulty - 1);
      adjustmentReason = "Performance is struggling; decreasing difficulty for better comprehension";
      adjustmentMagnitude = performanceIndex < 20 ? "large" : "medium";
    } else if (performanceIndex >= 40 && performanceIndex <= 60) {
      // Slightly too hard
      recommendedDifficulty = Math.max(1, currentDifficulty - 1);
      adjustmentReason = "Performance could improve; slightly decreasing difficulty";
      adjustmentMagnitude = "small";
    } else if (performanceIndex >= 75 && performanceIndex <= 85) {
      // Slightly too easy
      recommendedDifficulty = Math.min(5, currentDifficulty + 1);
      adjustmentReason = "Performance is solid; slightly increasing challenge";
      adjustmentMagnitude = "small";
    } else {
      adjustmentReason = "Performance is in optimal range; maintaining current difficulty";
    }

    // Don't adjust if confidence is low (learner needs stability)
    if (sessionMetrics.confidenceScore < 40 && recommendedDifficulty > currentDifficulty) {
      recommendedDifficulty = currentDifficulty;
      adjustmentReason = "Confidence is low; maintaining current difficulty for stability";
    }

    // Determine next challenge type
    const nextChallengeType = this.determineNextChallengeType(
      recommendedDifficulty,
      sessionMetrics,
      learningProfile
    );

    const shouldAdjust = recommendedDifficulty !== currentDifficulty;

    return {
      currentDifficulty,
      recommendedDifficulty,
      adjustmentReason,
      shouldAdjust,
      adjustmentMagnitude,
      nextChallengeType,
    };
  }

  /**
   * Calculate performance index (0-100, where 70-80 is optimal)
   */
  private calculatePerformanceIndex(
    avgScore: number,
    timePerQuestion: number,
    hintUsageRate: number,
    mistakeRate: number,
    engagementScore: number
  ): number {
    // Accuracy component (0-40 points)
    const accuracyScore = Math.min(40, (avgScore / 100) * 40);

    // Efficiency component (0-30 points)
    // Optimal time: 30-60 seconds per question
    let efficiencyScore = 30;
    if (timePerQuestion < 15 || timePerQuestion > 120) {
      efficiencyScore = 15; // Too fast or too slow
    } else if (timePerQuestion < 25 || timePerQuestion > 90) {
      efficiencyScore = 22; // Suboptimal
    }

    // Independence component (0-20 points)
    // Lower hint usage and mistake rate = higher independence
    const independenceScore = Math.max(0, 20 - hintUsageRate * 10 - mistakeRate * 10);

    // Engagement component (0-10 points)
    const engagementBonus = (engagementScore / 100) * 10;

    const totalScore = accuracyScore + efficiencyScore + independenceScore + engagementBonus;
    return Math.round(totalScore);
  }

  /**
   * Determine next challenge type based on difficulty and performance
   */
  private determineNextChallengeType(
    difficulty: number,
    sessionMetrics: any,
    learningProfile: any
  ): string {
    const challengeTypes: Record<number, string[]> = {
      1: ["recognition", "multiple_choice", "fill_blank"],
      2: ["multiple_choice", "short_answer", "matching"],
      3: ["short_answer", "application", "scenario"],
      4: ["application", "analysis", "problem_solving"],
      5: ["synthesis", "creation", "research"],
    };

    const availableChallenges = challengeTypes[difficulty] || ["multiple_choice"];

    // If high engagement, use more interactive challenges
    if (sessionMetrics.engagementScore > 80) {
      return availableChallenges[Math.floor(Math.random() * availableChallenges.length)];
    }

    // If low engagement, use simpler, quicker challenges
    if (sessionMetrics.engagementScore < 50) {
      return availableChallenges[0];
    }

    // Default: use middle option
    return availableChallenges[Math.floor(availableChallenges.length / 2)];
  }

  /**
   * Predict optimal difficulty for a learner on a new topic
   */
  async predictOptimalDifficulty(
    userId: string,
    topicId: number,
    topicDifficulty: number, // 1-5 (inherent difficulty)
    userAge?: number,
    knowledgeScore?: number
  ): Promise<{
    recommendedDifficulty: number;
    adjustmentFromInherent: number; // -2 to +2
    reasoning: string;
  }> {
    const learningProfile = await learningBehaviorAnalyzer.getLearningStyleProfile(userId);
    const approachEffectiveness = await learningBehaviorAnalyzer.getApproachEffectiveness(userId);

    let adjustmentFromInherent = 0;

    // Adjust based on knowledge score
    if (knowledgeScore !== undefined) {
      if (knowledgeScore > 80) {
        adjustmentFromInherent += 1; // Increase difficulty
      } else if (knowledgeScore < 40) {
        adjustmentFromInherent -= 1; // Decrease difficulty
      }
    }

    // Adjust based on learning profile
    if (learningProfile) {
      // High confidence learners can handle higher difficulty
      if ((learningProfile as any).baselineConfidence > 75) {
        adjustmentFromInherent += 1;
      } else if ((learningProfile as any).baselineConfidence < 40) {
        adjustmentFromInherent -= 1;
      }

      // High learning efficiency = can handle higher difficulty
      if ((learningProfile as any).conceptRetentionRate > 80) {
        adjustmentFromInherent += 1;
      }
    }

    // Adjust based on age
    if (userAge && userAge < 12) {
      adjustmentFromInherent -= 1; // Younger learners need lower difficulty
    }

    // Clamp adjustment
    adjustmentFromInherent = Math.max(-2, Math.min(2, adjustmentFromInherent));

    const recommendedDifficulty = Math.max(1, Math.min(5, topicDifficulty + adjustmentFromInherent));

    const reasoning =
      adjustmentFromInherent > 0
        ? `Learner profile suggests higher capability; recommending difficulty ${recommendedDifficulty}`
        : adjustmentFromInherent < 0
          ? `Learner profile suggests need for support; recommending difficulty ${recommendedDifficulty}`
          : `Learner profile matches topic difficulty; recommending difficulty ${recommendedDifficulty}`;

    return {
      recommendedDifficulty,
      adjustmentFromInherent,
      reasoning,
    };
  }

  /**
   * Generate adaptive content for a specific difficulty level
   */
  async generateAdaptiveContent(
    difficulty: number,
    concept: string,
    learningStyle: string
  ): Promise<{
    contentLength: "short" | "medium" | "long";
    complexity: "simple" | "moderate" | "complex";
    examples: "concrete" | "mixed" | "abstract";
    interactivity: "low" | "medium" | "high";
    scaffolding: "high" | "medium" | "low";
  }> {
    // Map difficulty to content characteristics
    const contentMap: Record<number, any> = {
      1: {
        contentLength: "short",
        complexity: "simple",
        examples: "concrete",
        interactivity: "low",
        scaffolding: "high",
      },
      2: {
        contentLength: "medium",
        complexity: "simple",
        examples: "concrete",
        interactivity: "medium",
        scaffolding: "high",
      },
      3: {
        contentLength: "medium",
        complexity: "moderate",
        examples: "mixed",
        interactivity: "medium",
        scaffolding: "medium",
      },
      4: {
        contentLength: "long",
        complexity: "complex",
        examples: "mixed",
        interactivity: "high",
        scaffolding: "low",
      },
      5: {
        contentLength: "long",
        complexity: "complex",
        examples: "abstract",
        interactivity: "high",
        scaffolding: "low",
      },
    };

    let contentCharacteristics = contentMap[difficulty] || contentMap[3];

    // Adjust based on learning style
    if (learningStyle === "visual") {
      contentCharacteristics.interactivity = "high"; // Visuals are interactive
    } else if (learningStyle === "kinesthetic") {
      contentCharacteristics.interactivity = "high"; // Hands-on activities
    }

    return contentCharacteristics;
  }

  /**
   * Detect if learner is in "flow state" (optimal challenge)
   */
  async detectFlowState(
    userId: string,
    sessionMetrics: {
      engagementScore: number;
      comprehensionScore: number;
      timeSpentSeconds: number;
      pauseCount: number;
      mistakeRate: number;
    }
  ): Promise<{
    inFlowState: boolean;
    flowScore: number; // 0-100
    factors: {
      challenge: boolean; // Challenge is appropriate
      skill: boolean; // Skill level is appropriate
      focus: boolean; // User is focused
      engagement: boolean; // User is engaged
    };
  }> {
    // Flow state indicators:
    // 1. Challenge matches skill (not too easy, not too hard)
    // 2. Clear goals and feedback
    // 3. Deep focus and concentration
    // 4. Sense of control

    const factors = {
      challenge: sessionMetrics.mistakeRate > 0.1 && sessionMetrics.mistakeRate < 0.4, // 10-40% error rate
      skill: sessionMetrics.comprehensionScore > 60 && sessionMetrics.comprehensionScore < 90,
      focus: sessionMetrics.pauseCount < 3 && sessionMetrics.timeSpentSeconds > 600, // Minimal pauses, sustained focus
      engagement: sessionMetrics.engagementScore > 75,
    };

    // Calculate flow score
    const flowScore = Object.values(factors).filter(Boolean).length * 25;
    const inFlowState = flowScore >= 75;

    return {
      inFlowState,
      flowScore,
      factors,
    };
  }
}

// Export singleton
export const dynamicDifficultyEngine = new DynamicDifficultyEngine();
