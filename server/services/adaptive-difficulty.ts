/**
 * Adaptive Difficulty Engine
 *
 * Adjusts lesson difficulty in real-time based on:
 * - Performance on comprehension checks
 * - Time spent on concepts
 * - Struggle indicators (hesitation, mistakes)
 * - Confidence levels
 * - Engagement metrics
 *
 * Goal: Maintain optimal challenge level (flow state)
 */

export type DifficultyLevel = "beginner" | "intermediate" | "advanced" | "expert";

export interface DifficultyMetrics {
  currentLevel: DifficultyLevel;
  performanceScore: number; // 0-100
  struggleLevel: number; // 0-100 (0 = no struggle, 100 = extreme struggle)
  engagementLevel: number; // 0-100
  confidenceLevel: number; // 0-100
  recommendedAdjustment: "increase" | "maintain" | "decrease";
  reason: string;
}

export interface LessonDifficultyConfig {
  topicId: string;
  currentLevel: DifficultyLevel;
  sessionCount: number;
  averagePerformance: number;
  lastAdjustmentTime: Date;
  adjustmentHistory: Array<{
    from: DifficultyLevel;
    to: DifficultyLevel;
    reason: string;
    timestamp: Date;
  }>;
}

export class AdaptiveDifficultyEngine {
  private configs: Map<string, LessonDifficultyConfig> = new Map();

  // Thresholds for difficulty adjustment
  private readonly INCREASE_THRESHOLD = 85; // If performance > 85%, increase difficulty
  private readonly DECREASE_THRESHOLD = 50; // If performance < 50%, decrease difficulty
  private readonly MAINTAIN_RANGE = [50, 85]; // Optimal performance range

  /**
   * Assess current difficulty and recommend adjustment
   */
  assessDifficulty(
    topicId: string,
    performanceScore: number,
    timeSpentSeconds: number,
    mistakeCount: number,
    confidenceLevel: number,
    engagementLevel: number
  ): DifficultyMetrics {
    // Calculate struggle level (0-100)
    const struggleLevel = this.calculateStruggle(
      performanceScore,
      timeSpentSeconds,
      mistakeCount,
      confidenceLevel
    );

    // Determine recommendation
    let recommendedAdjustment: "increase" | "maintain" | "decrease";
    let reason: string;

    if (performanceScore > this.INCREASE_THRESHOLD && struggleLevel < 30) {
      recommendedAdjustment = "increase";
      reason = "Excellent performance - ready for more challenge";
    } else if (performanceScore < this.DECREASE_THRESHOLD || struggleLevel > 70) {
      recommendedAdjustment = "decrease";
      reason = "Struggling - need simpler concepts first";
    } else {
      recommendedAdjustment = "maintain";
      reason = "Optimal challenge level - keep current difficulty";
    }

    return {
      currentLevel: this.getCurrentLevel(topicId),
      performanceScore,
      struggleLevel,
      engagementLevel,
      confidenceLevel,
      recommendedAdjustment,
      reason,
    };
  }

  /**
   * Calculate struggle level (0-100)
   * Combines multiple signals to determine if user is struggling
   */
  private calculateStruggle(
    performanceScore: number,
    timeSpentSeconds: number,
    mistakeCount: number,
    confidenceLevel: number
  ): number {
    // Performance component (0-100)
    const performanceStruggle = Math.max(0, 100 - performanceScore);

    // Time component: too much time = struggle
    // Assume optimal time is 5-10 minutes per concept
    const optimalTimeSeconds = 600; // 10 minutes
    const timeStruggle = Math.abs(timeSpentSeconds - optimalTimeSeconds) > 300 ? 40 : 0;

    // Mistake component
    const mistakeStruggle = Math.min(100, mistakeCount * 10);

    // Confidence component
    const confidenceStruggle = Math.max(0, 100 - confidenceLevel);

    // Weighted average
    const struggle =
      performanceStruggle * 0.4 + timeStruggle * 0.2 + mistakeStruggle * 0.2 + confidenceStruggle * 0.2;

    return Math.round(struggle);
  }

  /**
   * Apply difficulty adjustment
   */
  applyDifficultyAdjustment(topicId: string, adjustment: "increase" | "maintain" | "decrease"): DifficultyLevel {
    let config = this.configs.get(topicId);

    if (!config) {
      config = {
        topicId,
        currentLevel: "beginner",
        sessionCount: 0,
        averagePerformance: 0,
        lastAdjustmentTime: new Date(),
        adjustmentHistory: [],
      };
      this.configs.set(topicId, config);
    }

    const previousLevel = config.currentLevel;
    let newLevel: DifficultyLevel = previousLevel;

    if (adjustment === "increase") {
      const levels: DifficultyLevel[] = ["beginner", "intermediate", "advanced", "expert"];
      const currentIndex = levels.indexOf(previousLevel);
      if (currentIndex < levels.length - 1) {
        newLevel = levels[currentIndex + 1];
      }
    } else if (adjustment === "decrease") {
      const levels: DifficultyLevel[] = ["beginner", "intermediate", "advanced", "expert"];
      const currentIndex = levels.indexOf(previousLevel);
      if (currentIndex > 0) {
        newLevel = levels[currentIndex - 1];
      }
    }

    if (newLevel !== previousLevel) {
      config.adjustmentHistory.push({
        from: previousLevel,
        to: newLevel,
        reason: `Automatic adjustment: ${adjustment}`,
        timestamp: new Date(),
      });
      config.currentLevel = newLevel;
      config.lastAdjustmentTime = new Date();
    }

    config.sessionCount++;
    return newLevel;
  }

  /**
   * Get current difficulty level
   */
  getCurrentLevel(topicId: string): DifficultyLevel {
    const config = this.configs.get(topicId);
    return config?.currentLevel || "beginner";
  }

  /**
   * Get difficulty configuration
   */
  getConfig(topicId: string): LessonDifficultyConfig {
    if (!this.configs.has(topicId)) {
      this.configs.set(topicId, {
        topicId,
        currentLevel: "beginner",
        sessionCount: 0,
        averagePerformance: 0,
        lastAdjustmentTime: new Date(),
        adjustmentHistory: [],
      });
    }
    return this.configs.get(topicId)!;
  }

  /**
   * Get content difficulty parameters based on level
   */
  getDifficultyParameters(level: DifficultyLevel): {
    conceptDepth: "surface" | "moderate" | "deep" | "expert";
    exampleComplexity: "simple" | "moderate" | "complex" | "advanced";
    quizDifficulty: "easy" | "medium" | "hard" | "expert";
    timeEstimate: number; // minutes
    prerequisiteCount: number;
  } {
    switch (level) {
      case "beginner":
        return {
          conceptDepth: "surface",
          exampleComplexity: "simple",
          quizDifficulty: "easy",
          timeEstimate: 15,
          prerequisiteCount: 0,
        };
      case "intermediate":
        return {
          conceptDepth: "moderate",
          exampleComplexity: "moderate",
          quizDifficulty: "medium",
          timeEstimate: 25,
          prerequisiteCount: 2,
        };
      case "advanced":
        return {
          conceptDepth: "deep",
          exampleComplexity: "complex",
          quizDifficulty: "hard",
          timeEstimate: 40,
          prerequisiteCount: 4,
        };
      case "expert":
        return {
          conceptDepth: "expert",
          exampleComplexity: "advanced",
          quizDifficulty: "expert",
          timeEstimate: 60,
          prerequisiteCount: 6,
        };
    }
  }

  /**
   * Predict outcome based on current performance
   */
  predictOutcome(
    topicId: string,
    currentPerformance: number,
    sessionCount: number
  ): {
    predictedMastery: number; // 0-100
    estimatedTimeToMastery: number; // minutes
    confidence: number; // 0-100
  } {
    const config = this.getConfig(topicId);

    // Simple linear prediction
    const improvementRate = currentPerformance / Math.max(1, sessionCount);
    const predictedMastery = Math.min(100, currentPerformance + improvementRate * 5);

    // Estimate time based on current pace
    const averageTimePerSession = 20; // minutes
    const sessionsNeeded = Math.max(1, (100 - predictedMastery) / improvementRate);
    const estimatedTimeToMastery = Math.round(sessionsNeeded * averageTimePerSession);

    // Confidence in prediction
    const confidence = Math.min(100, sessionCount * 10 + currentPerformance * 0.5);

    return {
      predictedMastery: Math.round(predictedMastery),
      estimatedTimeToMastery,
      confidence: Math.round(confidence),
    };
  }
}

// Singleton instance
export const adaptiveDifficultyEngine = new AdaptiveDifficultyEngine();
