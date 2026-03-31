import { learningBehaviorAnalyzer } from "./learning-behavior-analyzer";

/**
 * Outcome Predictor
 *
 * Predicts learning outcomes (comprehension, retention, engagement) for any approach/topic combination
 * Based on user's learning profile, historical performance, and peer data
 */

export interface OutcomePrediction {
  approachId: number;
  topicId: number;
  comprehensionScore: number; // 0-100
  retentionScore: number; // 0-100
  engagementScore: number; // 0-100
  overallScore: number; // 0-100
  confidence: number; // 0-100 (how confident is this prediction)
  timeToMastery: number; // minutes
  recommendedSessionLength: number; // minutes
  riskFactors: string[]; // Potential issues to watch for
  opportunityFactors: string[]; // Strengths to leverage
}

class OutcomePredictor {
  /**
   * Predict outcomes for a specific approach and topic for a user
   */
  async predictOutcomes(
    userId: string,
    approachId: number,
    topicId: number,
    topicDifficulty: number, // 1-5
    userAge?: number,
    knowledgeScore?: number
  ): Promise<OutcomePrediction> {
    // Get user's learning profile
    const learningProfile = await learningBehaviorAnalyzer.getLearningStyleProfile(userId);
    const approachEffectiveness = await learningBehaviorAnalyzer.getApproachEffectiveness(userId);
    const learningContext = await learningBehaviorAnalyzer.getLearningContext(userId);

    // Get historical performance for this approach
    const approachHistory = approachEffectiveness.find((a) => a.approachId === approachId);

    // Base prediction scores
    let comprehensionScore = 70;
    let retentionScore = 70;
    let engagementScore = 70;
    let confidence = 50;

    // Adjust based on approach effectiveness history
    if (approachHistory) {
      comprehensionScore = approachHistory.averageComprehension || 70;
      retentionScore = approachHistory.averageRetention || 70;
      engagementScore = approachHistory.averageEngagement || 70;
      confidence = Math.min(100, 50 + approachHistory.totalExperiences * 2);
    }

    // Adjust based on learning profile
    if (learningProfile) {
      // Adjust comprehension based on learning style match
      const comprehensionAdjustment = this.calculateLearningStyleAdjustment(
        approachId,
        learningProfile
      );
      comprehensionScore = Math.max(0, Math.min(100, comprehensionScore + comprehensionAdjustment));

      // Adjust engagement based on motivation alignment
      const engagementAdjustment = this.calculateMotivationAdjustment(
        approachId,
        learningProfile
      );
      engagementScore = Math.max(0, Math.min(100, engagementScore + engagementAdjustment));

      // Adjust retention based on confidence
      const retentionAdjustment = ((learningProfile as any).baselineConfidence || 50) / 100 * 20 - 10;
      retentionScore = Math.max(0, Math.min(100, retentionScore + retentionAdjustment));
    }

    // Adjust based on topic difficulty
    const difficultyAdjustment = (6 - topicDifficulty) * 5; // Harder topics = lower scores
    comprehensionScore = Math.max(0, Math.min(100, comprehensionScore - difficultyAdjustment));
    retentionScore = Math.max(0, Math.min(100, retentionScore - difficultyAdjustment * 0.7));

    // Adjust based on user age (cognitive development)
    if (userAge) {
      const ageAdjustment = this.calculateAgeAdjustment(userAge, topicDifficulty);
      comprehensionScore = Math.max(0, Math.min(100, comprehensionScore + ageAdjustment));
    }

    // Adjust based on knowledge score
    if (knowledgeScore !== undefined) {
      const knowledgeAdjustment = (knowledgeScore - 50) / 100 * 30;
      comprehensionScore = Math.max(0, Math.min(100, comprehensionScore + knowledgeAdjustment));
      retentionScore = Math.max(0, Math.min(100, retentionScore + knowledgeAdjustment * 0.8));
    }

    // Calculate overall score (weighted average)
    const overallScore = comprehensionScore * 0.4 + retentionScore * 0.35 + engagementScore * 0.25;

    // Identify risk and opportunity factors
    const riskFactors = this.identifyRiskFactors(
      comprehensionScore,
      retentionScore,
      engagementScore,
      approachId,
      learningProfile
    );

    const opportunityFactors = this.identifyOpportunityFactors(
      comprehensionScore,
      retentionScore,
      engagementScore,
      approachId,
      learningProfile
    );

    // Calculate time to mastery
    const timeToMastery = this.calculateTimeToMastery(
      comprehensionScore,
      retentionScore,
      topicDifficulty,
      learningProfile
    );

    // Recommend session length
    const recommendedSessionLength = this.recommendSessionLength(
      approachId,
      learningProfile,
      engagementScore
    );

    return {
      approachId,
      topicId,
      comprehensionScore: Math.round(comprehensionScore),
      retentionScore: Math.round(retentionScore),
      engagementScore: Math.round(engagementScore),
      overallScore: Math.round(overallScore),
      confidence: Math.round(confidence),
      timeToMastery,
      recommendedSessionLength,
      riskFactors,
      opportunityFactors,
    };
  }

  /**
   * Calculate learning style adjustment for an approach
   */
  private calculateLearningStyleAdjustment(approachId: number, learningProfile: any): number {
    // Map approaches to learning styles
    const styleBoosts: Record<number, Record<string, number>> = {
      1: { reading: 15, auditory: 10 }, // Socratic
      2: { reading: 10, kinesthetic: 15 }, // Problem-based
      3: { kinesthetic: 20, visual: 10 }, // Experiential
      4: { auditory: 15, reading: 5 }, // Peer
      5: { reading: 15, auditory: 10 }, // Teaching
      6: { kinesthetic: 15, visual: 10 }, // Challenges
      7: { visual: 10, reading: 10 }, // Microlearning
      8: { visual: 15, reading: 10 }, // Discovery
      9: { visual: 20, reading: 10, kinesthetic: 10 }, // Synthesis
    };

    const boosts = styleBoosts[approachId] || {};
    let adjustment = 0;

    if (learningProfile.visualLearning > 70 && boosts.visual) adjustment += boosts.visual;
    if (learningProfile.kinestheticLearning > 70 && boosts.kinesthetic) adjustment += boosts.kinesthetic;
    if (learningProfile.auditoryLearning > 70 && boosts.auditory) adjustment += boosts.auditory;
    if (learningProfile.readingWritingLearning > 70 && boosts.reading) adjustment += boosts.reading;

    return adjustment / 2; // Normalize
  }

  /**
   * Calculate motivation alignment adjustment
   */
  private calculateMotivationAdjustment(approachId: number, learningProfile: any): number {
    // Map approaches to motivation drivers
    const motivationBoosts: Record<number, Record<string, number>> = {
      1: { curiosity: 15, mastery: 10 }, // Socratic
      2: { mastery: 15, achievement: 10 }, // Problem-based
      3: { autonomy: 15, curiosity: 10 }, // Experiential
      4: { relatedness: 20, autonomy: 10 }, // Peer
      5: { mastery: 15, autonomy: 10 }, // Teaching
      6: { achievement: 20, autonomy: 5 }, // Challenges
      7: { autonomy: 15, mastery: 10 }, // Microlearning
      8: { curiosity: 20, autonomy: 10 }, // Discovery
      9: { mastery: 15, autonomy: 15 }, // Synthesis
    };

    const boosts = motivationBoosts[approachId] || {};
    let adjustment = 0;

    if (learningProfile.primaryMotivator === "mastery" && boosts.mastery) adjustment += boosts.mastery;
    if (learningProfile.primaryMotivator === "achievement" && boosts.achievement) adjustment += boosts.achievement;
    if (learningProfile.primaryMotivator === "autonomy" && boosts.autonomy) adjustment += boosts.autonomy;
    if (learningProfile.primaryMotivator === "relatedness" && boosts.relatedness) adjustment += boosts.relatedness;
    if (learningProfile.primaryMotivator === "curiosity" && boosts.curiosity) adjustment += boosts.curiosity;

    return adjustment / 2;
  }

  /**
   * Calculate age-based adjustment
   */
  private calculateAgeAdjustment(userAge: number, topicDifficulty: number): number {
    // Younger learners may struggle with abstract concepts
    if (userAge < 12 && topicDifficulty > 3) return -15;
    if (userAge < 12 && topicDifficulty <= 2) return 10;

    // Teens and adults generally perform better
    if (userAge >= 12 && userAge < 18) return 5;
    if (userAge >= 18) return 0;

    return 0;
  }

  /**
   * Identify risk factors
   */
  private identifyRiskFactors(
    comprehensionScore: number,
    retentionScore: number,
    engagementScore: number,
    approachId: number,
    learningProfile: any
  ): string[] {
    const risks: string[] = [];

    if (comprehensionScore < 50) risks.push("Low comprehension predicted");
    if (retentionScore < 50) risks.push("Poor retention predicted");
    if (engagementScore < 50) risks.push("Low engagement predicted");

    // Approach-specific risks
    if (approachId === 6 && engagementScore < 60) risks.push("Gamified approach may not engage this learner");
    if (approachId === 4 && learningProfile?.socialEngagement < 50) risks.push("Peer learning may not suit this learner");

    return risks;
  }

  /**
   * Identify opportunity factors
   */
  private identifyOpportunityFactors(
    comprehensionScore: number,
    retentionScore: number,
    engagementScore: number,
    approachId: number,
    learningProfile: any
  ): string[] {
    const opportunities: string[] = [];

    if (comprehensionScore > 80) opportunities.push("Strong comprehension potential");
    if (retentionScore > 80) opportunities.push("Excellent retention expected");
    if (engagementScore > 80) opportunities.push("High engagement expected");

    // Approach-specific opportunities
    if (approachId === 5 && comprehensionScore > 75) opportunities.push("Teaching approach will deepen understanding");
    if (approachId === 2 && comprehensionScore > 75) opportunities.push("Problem-solving skills will improve");

    return opportunities;
  }

  /**
   * Calculate time to mastery
   */
  private calculateTimeToMastery(
    comprehensionScore: number,
    retentionScore: number,
    topicDifficulty: number,
    learningProfile: any
  ): number {
    // Base time: 60 minutes
    let baseTime = 60;

    // Adjust based on difficulty
    baseTime *= topicDifficulty / 3;

    // Adjust based on comprehension (lower comprehension = more time needed)
    baseTime *= (100 - comprehensionScore) / 50;

    // Adjust based on learning profile efficiency
    if (learningProfile?.conceptRetentionRate) {
      baseTime *= (100 - learningProfile.conceptRetentionRate) / 50;
    }

    return Math.round(baseTime);
  }

  /**
   * Recommend session length
   */
  private recommendSessionLength(
    approachId: number,
    learningProfile: any,
    engagementScore: number
  ): number {
    // Base session lengths for each approach
    const baseLengths: Record<number, number> = {
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

    let sessionLength = baseLengths[approachId] || 30;

    // Adjust based on user's preferred session length
    if (learningProfile?.preferredSessionLength) {
      sessionLength = Math.min(sessionLength, learningProfile.preferredSessionLength);
    }

    // Adjust based on engagement (low engagement = shorter sessions)
    if (engagementScore < 50) {
      sessionLength = Math.max(5, Math.round(sessionLength * 0.7));
    }

    return sessionLength;
  }

  /**
   * Batch predict outcomes for multiple approaches
   */
  async predictOutcomesForAllApproaches(
    userId: string,
    topicId: number,
    topicDifficulty: number,
    userAge?: number,
    knowledgeScore?: number
  ): Promise<OutcomePrediction[]> {
    const predictions = await Promise.all(
      Array.from({ length: 9 }, (_, i) =>
        this.predictOutcomes(
          userId,
          i + 1,
          topicId,
          topicDifficulty,
          userAge,
          knowledgeScore
        )
      )
    );

    // Sort by overall score (best first)
    return predictions.sort((a, b) => b.overallScore - a.overallScore);
  }
}

// Export singleton
export const outcomePredictor = new OutcomePredictor();
