import { learningBehaviorAnalyzer } from "./learning-behavior-analyzer";

/**
 * Time Optimizer
 *
 * Customizes session length, break timing, and pacing based on learner profile
 * Maximizes learning efficiency by respecting individual rhythms and patterns
 */

export interface TimeOptimization {
  recommendedSessionLength: number; // minutes
  recommendedBreakLength: number; // minutes
  breakFrequency: number; // minutes between breaks
  optimalLearningTime: string; // "morning" | "afternoon" | "evening"
  pacingSpeed: "fast" | "moderate" | "slow"; // Content delivery speed
  spaceRepetitionSchedule: string[]; // Dates for review
  estimatedTimeToMastery: number; // minutes
  totalWeeklyCommitment: number; // minutes
  sessionPattern: {
    sessionsPerWeek: number;
    averageSessionLength: number;
    recommendedDaysOff: number;
  };
}

class TimeOptimizer {
  /**
   * Generate personalized time optimization for a learner
   */
  async optimizeTime(
    userId: string,
    topicDifficulty: number, // 1-5
    estimatedContentLength: number, // minutes
    learnerGoal: "fast_mastery" | "deep_understanding" | "long_term_retention" = "deep_understanding"
  ): Promise<TimeOptimization> {
    // Get user's learning profile
    const learningProfile = await learningBehaviorAnalyzer.getLearningStyleProfile(userId);
    const behaviorPatterns = await learningBehaviorAnalyzer.getBehaviorPatterns(userId);

    // Determine optimal learning time
    const optimalLearningTime = this.determineOptimalLearningTime(behaviorPatterns);

    // Determine recommended session length
    const recommendedSessionLength = this.calculateSessionLength(
      learningProfile,
      topicDifficulty,
      learnerGoal
    );

    // Determine break timing
    const { breakLength, breakFrequency } = this.calculateBreakTiming(
      learningProfile,
      recommendedSessionLength
    );

    // Determine pacing speed
    const pacingSpeed = this.determinePacingSpeed(learningProfile, learnerGoal);

    // Calculate spaced repetition schedule
    const spaceRepetitionSchedule = this.calculateSpacedRepetitionSchedule(
      learnerGoal,
      learningProfile
    );

    // Calculate time to mastery
    const estimatedTimeToMastery = this.calculateTimeToMastery(
      estimatedContentLength,
      recommendedSessionLength,
      topicDifficulty,
      learningProfile,
      learnerGoal
    );

    // Calculate weekly commitment
    const totalWeeklyCommitment = this.calculateWeeklyCommitment(
      estimatedTimeToMastery,
      recommendedSessionLength,
      learningProfile
    );

    // Determine session pattern
    const sessionPattern = this.determineSessionPattern(
      totalWeeklyCommitment,
      recommendedSessionLength,
      learningProfile
    );

    return {
      recommendedSessionLength,
      recommendedBreakLength: breakLength,
      breakFrequency,
      optimalLearningTime,
      pacingSpeed,
      spaceRepetitionSchedule,
      estimatedTimeToMastery,
      totalWeeklyCommitment,
      sessionPattern,
    };
  }

  /**
   * Determine optimal learning time based on behavior patterns
   */
  private determineOptimalLearningTime(behaviorPatterns: any[]): string {
    // Find time of day pattern
    const timePattern = behaviorPatterns.find((p) => p.patternType === "time_of_day");

    if (!timePattern) return "morning"; // Default

    const timeData = timePattern.patternData || {};
    const times = {
      morning: timeData.morningEngagement || 0,
      afternoon: timeData.afternoonEngagement || 0,
      evening: timeData.eveningEngagement || 0,
    };

    // Return time with highest engagement
    let bestTime: "morning" | "afternoon" | "evening" = "morning";
    let bestEngagement = 0;
    
    Object.entries(times).forEach(([time, engagement]) => {
      if ((engagement as number) > bestEngagement) {
        bestEngagement = engagement as number;
        bestTime = time as "morning" | "afternoon" | "evening";
      }
    });
    
    return bestTime;
  }

  /**
   * Calculate recommended session length
   */
  private calculateSessionLength(
    learningProfile: any,
    topicDifficulty: number,
    learnerGoal: string
  ): number {
    // Base session length: 30 minutes
    let sessionLength = 30;

    // Adjust based on user's preferred session length
    if (learningProfile?.preferredSessionLength) {
      sessionLength = learningProfile.preferredSessionLength;
    }

    // Adjust based on topic difficulty
    if (topicDifficulty > 3) {
      sessionLength = Math.max(25, sessionLength - 10); // Harder topics = shorter sessions
    } else if (topicDifficulty < 2) {
      sessionLength = Math.min(45, sessionLength + 10); // Easier topics = longer sessions
    }

    // Adjust based on learner goal
    if (learnerGoal === "fast_mastery") {
      sessionLength = Math.min(60, sessionLength + 15); // Longer sessions for speed
    } else if (learnerGoal === "long_term_retention") {
      sessionLength = Math.max(20, sessionLength - 10); // Shorter, frequent sessions
    }

    // Adjust based on attention span
    if (learningProfile?.attentionSpan) {
      sessionLength = Math.min(sessionLength, learningProfile.attentionSpan);
    }

    return sessionLength;
  }

  /**
   * Calculate break timing
   */
  private calculateBreakTiming(
    learningProfile: any,
    sessionLength: number
  ): { breakLength: number; breakFrequency: number } {
    // Pomodoro-inspired: break every 25 minutes
    // But adjust based on attention span
    let breakFrequency = 25;
    let breakLength = 5;

    if (learningProfile?.attentionSpan) {
      // Shorter attention span = more frequent breaks
      if (learningProfile.attentionSpan < 20) {
        breakFrequency = 15;
        breakLength = 5;
      } else if (learningProfile.attentionSpan > 45) {
        breakFrequency = 40;
        breakLength = 10;
      }
    }

    // Adjust break length based on fatigue patterns
    if (learningProfile?.fatigueRecoveryTime) {
      breakLength = Math.max(breakLength, learningProfile.fatigueRecoveryTime);
    }

    return { breakLength, breakFrequency };
  }

  /**
   * Determine pacing speed
   */
  private determinePacingSpeed(
    learningProfile: any,
    learnerGoal: string
  ): "fast" | "moderate" | "slow" {
    // Default: moderate
    let pace: "fast" | "moderate" | "slow" = "moderate";

    // Adjust based on user preference
    if (learningProfile?.preferredPace) {
      pace = learningProfile.preferredPace;
    }

    // Adjust based on goal
    if (learnerGoal === "fast_mastery") {
      pace = pace === "slow" ? "moderate" : "fast";
    } else if (learnerGoal === "long_term_retention") {
      pace = pace === "fast" ? "moderate" : "slow";
    }

    return pace;
  }

  /**
   * Calculate spaced repetition schedule
   */
  private calculateSpacedRepetitionSchedule(
    learnerGoal: string,
    learningProfile: any
  ): string[] {
    const schedule: string[] = [];
    const today = new Date();

    // Ebbinghaus spacing: 1, 3, 7, 14, 30 days
    let intervals = [1, 3, 7, 14, 30];

    // Adjust intervals based on goal
    if (learnerGoal === "fast_mastery") {
      intervals = [1, 2, 4, 7, 14]; // Faster consolidation
    } else if (learnerGoal === "long_term_retention") {
      intervals = [1, 3, 7, 14, 30, 60, 90]; // Extended retention
    }

    // Adjust based on user's pace preference
    if (learningProfile?.preferredPace === "fast") {
      intervals = intervals.map((i) => Math.ceil(i * 0.7));
    } else if (learningProfile?.preferredPace === "slow") {
      intervals = intervals.map((i) => Math.ceil(i * 1.3));
    }

    // Generate dates
    intervals.forEach((days) => {
      const reviewDate = new Date(today);
      reviewDate.setDate(reviewDate.getDate() + days);
      schedule.push(reviewDate.toISOString().split("T")[0]);
    });

    return schedule;
  }

  /**
   * Calculate time to mastery
   */
  private calculateTimeToMastery(
    estimatedContentLength: number,
    sessionLength: number,
    topicDifficulty: number,
    learningProfile: any,
    learnerGoal: string
  ): number {
    // Base time: content length + practice time
    let totalTime = estimatedContentLength * 1.5; // 50% practice overhead

    // Adjust based on difficulty
    totalTime *= (topicDifficulty / 3);

    // Adjust based on learning efficiency
    if (learningProfile?.conceptRetentionRate) {
      totalTime *= (100 - learningProfile.conceptRetentionRate) / 50;
    }

    // Adjust based on goal
    if (learnerGoal === "fast_mastery") {
      totalTime *= 0.8; // 20% faster
    } else if (learnerGoal === "long_term_retention") {
      totalTime *= 1.2; // 20% longer for deeper learning
    }

    return Math.round(totalTime);
  }

  /**
   * Calculate weekly commitment
   */
  private calculateWeeklyCommitment(
    estimatedTimeToMastery: number,
    sessionLength: number,
    learningProfile: any
  ): number {
    // Spread mastery time across weeks
    // Assume 3-5 sessions per week
    const sessionsPerWeek = learningProfile?.preferredSessionsPerWeek || 4;

    // Weekly commitment = (total time / number of weeks) rounded to nearest session
    const weeksToMastery = Math.ceil(estimatedTimeToMastery / (sessionLength * sessionsPerWeek));
    const weeklyCommitment = Math.ceil((estimatedTimeToMastery / weeksToMastery) / sessionLength) * sessionLength;

    return Math.max(sessionLength, weeklyCommitment);
  }

  /**
   * Determine session pattern
   */
  private determineSessionPattern(
    totalWeeklyCommitment: number,
    sessionLength: number,
    learningProfile: any
  ): { sessionsPerWeek: number; averageSessionLength: number; recommendedDaysOff: number } {
    // Calculate sessions per week
    const sessionsPerWeek = Math.ceil(totalWeeklyCommitment / sessionLength);

    // Recommended days off (for consolidation and rest)
    const recommendedDaysOff = 7 - sessionsPerWeek;

    return {
      sessionsPerWeek,
      averageSessionLength: sessionLength,
      recommendedDaysOff: Math.max(1, recommendedDaysOff), // At least 1 day off
    };
  }

  /**
   * Adjust session parameters in real-time based on current performance
   */
  async adjustSessionInRealTime(
    userId: string,
    currentEngagementScore: number,
    currentComprehensionScore: number,
    elapsedTimeSeconds: number,
    recommendedSessionLength: number
  ): Promise<{
    shouldContinue: boolean;
    shouldTakeBreak: boolean;
    adjustedSessionLength: number;
    adjustedPacingSpeed: "fast" | "moderate" | "slow";
  }> {
    const learningProfile = await learningBehaviorAnalyzer.getLearningStyleProfile(userId);

    // Check if should take break
    const shouldTakeBreak =
      elapsedTimeSeconds > recommendedSessionLength * 60 * 0.8 && // 80% through session
      currentEngagementScore < 60; // And engagement is dropping

    // Check if should continue
    const shouldContinue =
      currentEngagementScore > 50 && // Still engaged
      currentComprehensionScore > 40; // Still comprehending

    // Adjust pacing based on comprehension
    let adjustedPacingSpeed: "fast" | "moderate" | "slow" = "moderate";
    if (currentComprehensionScore > 80) {
      adjustedPacingSpeed = "fast"; // Speed up if understanding well
    } else if (currentComprehensionScore < 50) {
      adjustedPacingSpeed = "slow"; // Slow down if struggling
    }

    // Adjust session length based on engagement
    let adjustedSessionLength = recommendedSessionLength;
    if (currentEngagementScore < 40) {
      adjustedSessionLength = Math.round(recommendedSessionLength * 0.7); // Cut session short
    } else if (currentEngagementScore > 85) {
      adjustedSessionLength = Math.round(recommendedSessionLength * 1.2); // Extend session
    }

    return {
      shouldContinue,
      shouldTakeBreak,
      adjustedSessionLength,
      adjustedPacingSpeed,
    };
  }
}

// Export singleton
export const timeOptimizer = new TimeOptimizer();
