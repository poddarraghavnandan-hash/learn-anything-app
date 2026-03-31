import { outcomePredictor } from "./outcome-predictor";
import { timeOptimizer } from "./time-optimizer";
import { struggleDetector } from "./struggle-detector";
import { dynamicDifficultyEngine } from "./dynamic-difficulty-engine";
import { peerIntelligence } from "./peer-intelligence";

/**
 * Personal Learning Intelligence
 *
 * Unified system that orchestrates all intelligence components:
 * - Outcome prediction
 * - Time optimization
 * - Struggle detection
 * - Dynamic difficulty
 * - Peer learning
 *
 * Silent intelligence that optimizes learning without user awareness
 */

export interface PersonalLearningIntelligenceReport {
  userId: string;
  timestamp: Date;
  
  // Outcome predictions
  predictedOutcomes: {
    approachId: number;
    comprehension: number;
    retention: number;
    engagement: number;
    overallScore: number;
  }[];
  
  // Time optimization
  timeOptimization: {
    recommendedSessionLength: number;
    recommendedBreakLength: number;
    breakFrequency: number;
    optimalLearningTime: string;
    pacingSpeed: "fast" | "moderate" | "slow";
    spaceRepetitionSchedule: string[];
  };
  
  // Struggle detection
  strugglesDetected: boolean;
  struggles: {
    misconceptions: Array<{ concept: string; severity: "low" | "medium" | "high" }>;
    disengagement: { detected: boolean; severity: "low" | "medium" | "high" };
    fatigue: { detected: boolean; severity: "low" | "medium" | "high" };
  };
  
  // Dynamic difficulty
  difficultyAdjustment: {
    currentDifficulty: number;
    recommendedDifficulty: number;
    shouldAdjust: boolean;
  };
  
  // Peer insights
  peerInsights: {
    similarLearnerCount: number;
    mostEffectiveApproach: number;
    successRate: number;
    recommendedPath: number[];
  };
  
  // Overall recommendation
  recommendation: {
    nextApproachId: number;
    sessionLength: number;
    difficulty: number;
    reasoning: string;
    confidence: number; // 0-100
  };
}

class PersonalLearningIntelligence {
  /**
   * Generate comprehensive learning intelligence report
   */
  async generateIntelligenceReport(
    userId: string,
    topicId: number,
    topicDifficulty: number,
    currentApproachId?: number,
    userAge?: number,
    knowledgeScore?: number,
    sessionMetrics?: any
  ): Promise<PersonalLearningIntelligenceReport> {
    const timestamp = new Date();

    // 1. Predict outcomes for all approaches
    const predictedOutcomes = await outcomePredictor.predictOutcomesForAllApproaches(
      userId,
      topicId,
      topicDifficulty,
      userAge,
      knowledgeScore
    );

    // 2. Optimize time
    const timeOptimization = await timeOptimizer.optimizeTime(
      userId,
      topicDifficulty,
      60, // estimated content length
      "deep_understanding"
    );

    // 3. Detect struggles (if session metrics provided)
    let strugglesDetected = false;
    let struggles: {
      misconceptions: Array<{ concept: string; severity: "low" | "medium" | "high" }>;
      disengagement: { detected: boolean; severity: "low" | "medium" | "high" };
      fatigue: { detected: boolean; severity: "low" | "medium" | "high" };
    } = {
      misconceptions: [],
      disengagement: { detected: false, severity: "low" },
      fatigue: { detected: false, severity: "low" },
    };

    if (sessionMetrics) {
      const struggleDetection = await struggleDetector.detectStruggles(
        userId,
        topicId,
        currentApproachId || 1,
        sessionMetrics
      );

      strugglesDetected = struggleDetection.strugglesDetected;
      struggles = {
        misconceptions: struggleDetection.misconceptions.map((m) => ({
          concept: m.concept,
          severity: m.severity as "low" | "medium" | "high",
        })),
        disengagement: {
          detected: struggleDetection.disengagement.detected,
          severity: struggleDetection.disengagement.severity as "low" | "medium" | "high",
        },
        fatigue: {
          detected: struggleDetection.fatigue.detected,
          severity: struggleDetection.fatigue.severity as "low" | "medium" | "high",
        },
      };
    }

    // 4. Get dynamic difficulty recommendation
    let difficultyAdjustment = {
      currentDifficulty: topicDifficulty,
      recommendedDifficulty: topicDifficulty,
      shouldAdjust: false,
    };

    if (sessionMetrics) {
      const adjustment = await dynamicDifficultyEngine.adjustDifficultyInRealTime(
        userId,
        topicDifficulty,
        sessionMetrics
      );

      difficultyAdjustment = {
        currentDifficulty: adjustment.currentDifficulty,
        recommendedDifficulty: adjustment.recommendedDifficulty,
        shouldAdjust: adjustment.shouldAdjust,
      };
    }

    // 5. Get peer insights
    const peerInsight = currentApproachId
      ? await peerIntelligence.getPeerInsights(userId, topicId, currentApproachId)
      : { similarLearnerCount: 0, mostEffectiveApproach: 1, successRate: 0.75, recommendedPath: [] };

    // 6. Generate overall recommendation
    const recommendation = this.generateRecommendation(
      predictedOutcomes,
      timeOptimization,
      struggles,
      difficultyAdjustment,
      peerInsight,
      currentApproachId
    );

    return {
      userId,
      timestamp,
      predictedOutcomes: predictedOutcomes.map((p) => ({
        approachId: p.approachId,
        comprehension: p.comprehensionScore,
        retention: p.retentionScore,
        engagement: p.engagementScore,
        overallScore: p.overallScore,
      })),
      timeOptimization: {
        recommendedSessionLength: timeOptimization.recommendedSessionLength,
        recommendedBreakLength: timeOptimization.recommendedBreakLength,
        breakFrequency: timeOptimization.breakFrequency,
        optimalLearningTime: timeOptimization.optimalLearningTime,
        pacingSpeed: timeOptimization.pacingSpeed,
        spaceRepetitionSchedule: timeOptimization.spaceRepetitionSchedule,
      },
      strugglesDetected,
      struggles,
      difficultyAdjustment,
      peerInsights: {
        similarLearnerCount: peerInsight.similarLearnerCount,
        mostEffectiveApproach: peerInsight.mostEffectiveApproach,
        successRate: peerInsight.successRate,
        recommendedPath: peerInsight.recommendedPath,
      },
      recommendation,
    };
  }

  /**
   * Generate overall recommendation from all intelligence components
   */
  private generateRecommendation(
    predictedOutcomes: any[],
    timeOptimization: any,
    struggles: any,
    difficultyAdjustment: any,
    peerInsight: any,
    currentApproachId?: number
  ): {
    nextApproachId: number;
    sessionLength: number;
    difficulty: number;
    reasoning: string;
    confidence: number;
  } {
    let nextApproachId = 1;
    let confidence = 50;
    let reasoning = "";

    // Priority 1: Handle struggles
    if (struggles.misconceptions.length > 0) {
      // Choose approach that addresses misconceptions
      const teachingApproach = 5; // Teaching approach is best for misconceptions
      nextApproachId = teachingApproach;
      reasoning = "Addressing detected misconceptions with teaching approach";
      confidence = 85;
    } else if (struggles.disengagement.detected) {
      // Choose engaging approach
      const engagingApproach = 6; // Gamified challenges
      nextApproachId = engagingApproach;
      reasoning = "Switching to engaging approach due to disengagement";
      confidence = 75;
    } else if (struggles.fatigue.detected) {
      // Choose shorter, simpler approach
      const simpleApproach = 7; // Microlearning
      nextApproachId = simpleApproach;
      reasoning = "Switching to microlearning due to cognitive fatigue";
      confidence = 80;
    } else {
      // Priority 2: Use best predicted outcome
      const bestOutcome = predictedOutcomes[0];
      nextApproachId = bestOutcome.approachId;
      reasoning = `Best predicted outcome: ${bestOutcome.overallScore}% success probability`;
      confidence = Math.min(100, bestOutcome.confidence + 20);

      // Adjust based on peer data
      if (peerInsight.successRate > 0.85) {
        reasoning += `; peer data shows ${Math.round(peerInsight.successRate * 100)}% success rate`;
        confidence = Math.min(100, confidence + 15);
      }
    }

    // Adjust difficulty if needed
    let difficulty = difficultyAdjustment.recommendedDifficulty;
    if (difficultyAdjustment.shouldAdjust) {
      reasoning += `; adjusting difficulty to ${difficulty}`;
    }

    return {
      nextApproachId,
      sessionLength: timeOptimization.recommendedSessionLength,
      difficulty,
      reasoning,
      confidence,
    };
  }

  /**
   * Continuously optimize learning in real-time during a session
   */
  async optimizeSessionInRealTime(
    userId: string,
    topicId: number,
    currentApproachId: number,
    sessionMetrics: {
      elapsedTimeSeconds: number;
      engagementScore: number;
      comprehensionScore: number;
      assessmentScores: number[];
      timePerQuestion: number;
      hintUsageRate: number;
      mistakeRate: number;
      attentionDropoffs: number;
      scrollDepth: number;
      clickInteractionCount: number;
      pauseCount: number;
      rewindCount: number;
      mistakesCount: number;
      clarificationQuestionsAsked: number;
      hintUsageCount: number;
    }
  ): Promise<{
    shouldContinue: boolean;
    shouldTakeBreak: boolean;
    shouldAdjustDifficulty: boolean;
    adjustedDifficulty?: number;
    adjustedPacingSpeed?: "fast" | "moderate" | "slow";
    adjustedSessionLength?: number;
    interventionSuggested?: string;
  }> {
    // 1. Check for struggles
    const struggleDetection = await struggleDetector.detectStruggles(
      userId,
      topicId,
      currentApproachId,
      {
        assessmentScores: sessionMetrics.assessmentScores,
        timeSpentSeconds: sessionMetrics.elapsedTimeSeconds,
        attentionDropoffs: sessionMetrics.attentionDropoffs,
        hintUsageCount: sessionMetrics.hintUsageCount,
        clarificationQuestionsAsked: sessionMetrics.clarificationQuestionsAsked,
        mistakesCount: sessionMetrics.mistakesCount,
        scrollDepth: sessionMetrics.scrollDepth,
        clickInteractionCount: sessionMetrics.clickInteractionCount,
        pauseCount: sessionMetrics.pauseCount,
        rewindCount: sessionMetrics.rewindCount,
        sessionStartTime: new Date(),
      }
    );

    if (struggleDetection.strugglesDetected) {
      return {
        shouldContinue: false,
        shouldTakeBreak: true,
        shouldAdjustDifficulty: false,
        interventionSuggested: struggleDetection.suggestedIntervention,
      };
    }

    // 2. Check for optimal session length
    const timeAdjustment = await timeOptimizer.adjustSessionInRealTime(
      userId,
      sessionMetrics.engagementScore,
      sessionMetrics.comprehensionScore,
      sessionMetrics.elapsedTimeSeconds,
      60 // recommended session length
    );

    // 3. Check for difficulty adjustment
    const difficultyAdjustment = await dynamicDifficultyEngine.adjustDifficultyInRealTime(
      userId,
      3, // current difficulty
      {
        assessmentScores: sessionMetrics.assessmentScores,
        timePerQuestion: sessionMetrics.timePerQuestion,
        hintUsageRate: sessionMetrics.hintUsageRate,
        mistakeRate: sessionMetrics.mistakeRate,
        engagementScore: sessionMetrics.engagementScore,
        confidenceScore: 70, // placeholder
        timeSpentSeconds: sessionMetrics.elapsedTimeSeconds,
      } as any
    );

    return {
      shouldContinue: timeAdjustment.shouldContinue,
      shouldTakeBreak: timeAdjustment.shouldTakeBreak,
      shouldAdjustDifficulty: difficultyAdjustment.shouldAdjust,
      adjustedDifficulty: difficultyAdjustment.recommendedDifficulty,
      adjustedPacingSpeed: timeAdjustment.adjustedPacingSpeed,
      adjustedSessionLength: timeAdjustment.adjustedSessionLength,
    };
  }

  /**
   * Predict if learner will struggle with a topic/approach
   */
  async predictStruggleRisk(
    userId: string,
    topicDifficulty: number,
    approachId: number,
    userAge?: number
  ): Promise<{
    riskLevel: "low" | "medium" | "high";
    riskFactors: string[];
    preventiveMeasures: string[];
  }> {
    return await struggleDetector.predictStruggleRisk(
      userId,
      topicDifficulty,
      approachId,
      userAge
    );
  }
}

// Export singleton
export const personalLearningIntelligence = new PersonalLearningIntelligence();
