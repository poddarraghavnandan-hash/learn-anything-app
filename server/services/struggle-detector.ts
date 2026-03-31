import { learningBehaviorAnalyzer } from "./learning-behavior-analyzer";

/**
 * Struggle Detector
 *
 * Real-time detection of learning struggles:
 * - Misconceptions (incorrect understanding)
 * - Disengagement (loss of interest, attention)
 * - Fatigue (cognitive overload, burnout)
 *
 * Triggers interventions before learner gives up
 */

export interface StruggleDetection {
  strugglesDetected: boolean;
  misconceptions: Array<{
    concept: string;
    severity: "low" | "medium" | "high";
    evidence: string;
    recommendation: string;
  }>;
  disengagement: {
    detected: boolean;
    severity: "low" | "medium" | "high";
    triggers: string[];
    recommendation: string;
  };
  fatigue: {
    detected: boolean;
    severity: "low" | "medium" | "high";
    triggers: string[];
    recommendation: string;
  };
  overallRisk: "low" | "medium" | "high";
  interventionNeeded: boolean;
  suggestedIntervention: string;
}

class StruggleDetector {
  /**
   * Detect struggles in real-time during a learning session
   */
  async detectStruggles(
    userId: string,
    topicId: number,
    approachId: number,
    sessionMetrics: {
      assessmentScores: number[]; // Recent assessment scores
      timeSpentSeconds: number;
      attentionDropoffs: number;
      hintUsageCount: number;
      clarificationQuestionsAsked: number;
      mistakesCount: number;
      scrollDepth: number; // 0-100%
      clickInteractionCount: number;
      pauseCount: number;
      rewindCount: number;
      sessionStartTime: Date;
    }
  ): Promise<StruggleDetection> {
    const learningProfile = await learningBehaviorAnalyzer.getLearningStyleProfile(userId);
    const behaviorPatterns = await learningBehaviorAnalyzer.getBehaviorPatterns(userId);

    // Detect misconceptions
    const misconceptions = this.detectMisconceptions(
      sessionMetrics.assessmentScores,
      sessionMetrics.mistakesCount,
      sessionMetrics.clarificationQuestionsAsked,
      topicId
    );

    // Detect disengagement
    const disengagement = this.detectDisengagement(
      sessionMetrics,
      learningProfile,
      behaviorPatterns
    );

    // Detect fatigue
    const fatigue = this.detectFatigue(sessionMetrics, learningProfile, behaviorPatterns);

    // Calculate overall risk
    const overallRisk = this.calculateOverallRisk(misconceptions, disengagement, fatigue);

    // Determine if intervention is needed
    const interventionNeeded =
      misconceptions.length > 0 ||
      disengagement.detected ||
      fatigue.detected ||
      overallRisk === "high";

    // Suggest intervention
    const suggestedIntervention = this.suggestIntervention(
      misconceptions,
      disengagement,
      fatigue,
      approachId
    );

    return {
      strugglesDetected: interventionNeeded,
      misconceptions,
      disengagement,
      fatigue,
      overallRisk,
      interventionNeeded,
      suggestedIntervention,
    };
  }

  /**
   * Detect misconceptions from assessment performance
   */
  private detectMisconceptions(
    assessmentScores: number[],
    mistakesCount: number,
    clarificationQuestionsAsked: number,
    topicId: number
  ): Array<{
    concept: string;
    severity: "low" | "medium" | "high";
    evidence: string;
    recommendation: string;
  }> {
    const misconceptions: Array<{
      concept: string;
      severity: "low" | "medium" | "high";
      evidence: string;
      recommendation: string;
    }> = [];

    // Detect misconception patterns
    if (assessmentScores.length > 0) {
      const avgScore = assessmentScores.reduce((a, b) => a + b, 0) / assessmentScores.length;
      const scoreVariance =
        assessmentScores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) /
        assessmentScores.length;
      const scoreStdDev = Math.sqrt(scoreVariance);

      // High variance = inconsistent understanding (misconception indicator)
      if (scoreStdDev > 20) {
        misconceptions.push({
          concept: "Inconsistent understanding",
          severity: scoreStdDev > 30 ? "high" : "medium",
          evidence: `Assessment scores vary widely (std dev: ${Math.round(scoreStdDev)})`,
          recommendation: "Review foundational concepts and practice with simpler examples",
        });
      }

      // Low average score = fundamental misunderstanding
      if (avgScore < 50) {
        misconceptions.push({
          concept: "Fundamental misunderstanding",
          severity: avgScore < 30 ? "high" : "medium",
          evidence: `Average assessment score: ${Math.round(avgScore)}%`,
          recommendation: "Start with prerequisite concepts; use simpler explanations",
        });
      }
    }

    // High mistake rate = systematic errors
    if (mistakesCount > 5) {
      misconceptions.push({
        concept: "Systematic errors",
        severity: mistakesCount > 10 ? "high" : "medium",
        evidence: `${mistakesCount} mistakes detected in this session`,
        recommendation: "Identify error patterns; practice error correction",
      });
    }

    // Many clarification questions = confusion
    if (clarificationQuestionsAsked > 3) {
      misconceptions.push({
        concept: "Conceptual confusion",
        severity: clarificationQuestionsAsked > 6 ? "high" : "medium",
        evidence: `${clarificationQuestionsAsked} clarification questions asked`,
        recommendation: "Use analogies and real-world examples; break into smaller steps",
      });
    }

    return misconceptions;
  }

  /**
   * Detect disengagement signals
   */
  private detectDisengagement(
    sessionMetrics: any,
    learningProfile: any,
    behaviorPatterns: any[]
  ): {
    detected: boolean;
    severity: "low" | "medium" | "high";
    triggers: string[];
    recommendation: string;
  } {
    const triggers: string[] = [];
    let disengagementScore = 0;

    // Attention dropoffs
    if (sessionMetrics.attentionDropoffs > 3) {
      triggers.push(`${sessionMetrics.attentionDropoffs} attention dropoffs detected`);
      disengagementScore += 20;
    }

    // Low scroll depth
    if (sessionMetrics.scrollDepth < 40) {
      triggers.push("Low content engagement (scrolled through <40%)");
      disengagementScore += 25;
    }

    // Low interaction count
    if (sessionMetrics.clickInteractionCount < 5 && sessionMetrics.timeSpentSeconds > 300) {
      triggers.push("Minimal interaction despite long session");
      disengagementScore += 20;
    }

    // Many pauses/rewinds (confusion or boredom)
    if (sessionMetrics.pauseCount > 10 || sessionMetrics.rewindCount > 5) {
      triggers.push("Frequent pauses/rewinds (confusion or boredom)");
      disengagementScore += 15;
    }

    // High hint usage without improvement
    if (sessionMetrics.hintUsageCount > 5 && sessionMetrics.assessmentScores.length > 0) {
      const avgScore = sessionMetrics.assessmentScores.reduce((a: number, b: number) => a + b, 0) /
        sessionMetrics.assessmentScores.length;
      if (avgScore < 60) {
        triggers.push("Using hints but still not understanding");
        disengagementScore += 20;
      }
    }

    // Detect if this is unusual for the user
    const engagementPattern = behaviorPatterns.find((p) => p.patternType === "engagement_triggers");
    if (engagementPattern && sessionMetrics.clickInteractionCount < engagementPattern.patternData?.avgInteractions * 0.5) {
      triggers.push("Engagement significantly below user's normal pattern");
      disengagementScore += 15;
    }

    const detected = disengagementScore > 30;
    const severity =
      disengagementScore > 60 ? "high" : disengagementScore > 40 ? "medium" : "low";

    const recommendation =
      severity === "high"
        ? "Switch to a more engaging approach (gamified, peer, or experiential)"
        : severity === "medium"
          ? "Add interactive elements; consider a short break"
          : "Monitor engagement; no immediate action needed";

    return {
      detected,
      severity,
      triggers,
      recommendation,
    };
  }

  /**
   * Detect cognitive fatigue
   */
  private detectFatigue(
    sessionMetrics: any,
    learningProfile: any,
    behaviorPatterns: any[]
  ): {
    detected: boolean;
    severity: "low" | "medium" | "high";
    triggers: string[];
    recommendation: string;
  } {
    const triggers: string[] = [];
    let fatigueScore = 0;

    // Session too long
    const maxSessionLength = learningProfile?.attentionSpan || 45;
    if (sessionMetrics.timeSpentSeconds > maxSessionLength * 60) {
      triggers.push(`Session duration (${Math.round(sessionMetrics.timeSpentSeconds / 60)} min) exceeds recommended length`);
      fatigueScore += 30;
    }

    // Declining performance
    if (sessionMetrics.assessmentScores.length > 3) {
      const firstThird = sessionMetrics.assessmentScores.slice(0, Math.ceil(sessionMetrics.assessmentScores.length / 3));
      const lastThird = sessionMetrics.assessmentScores.slice(-Math.ceil(sessionMetrics.assessmentScores.length / 3));

      const firstAvg = firstThird.reduce((a: number, b: number) => a + b, 0) / firstThird.length;
      const lastAvg = lastThird.reduce((a: number, b: number) => a + b, 0) / lastThird.length;

      if (lastAvg < firstAvg - 15) {
        triggers.push(`Performance declining (first: ${Math.round(firstAvg)}%, last: ${Math.round(lastAvg)}%)`);
        fatigueScore += 25;
      }
    }

    // Increasing mistake rate
    if (sessionMetrics.mistakesCount > 8) {
      triggers.push("High mistake rate (sign of mental fatigue)");
      fatigueScore += 20;
    }

    // Slowing down (longer time per interaction)
    if (sessionMetrics.timeSpentSeconds > 600 && sessionMetrics.clickInteractionCount < 10) {
      triggers.push("Slowing down (long time between interactions)");
      fatigueScore += 15;
    }

    // Many consecutive sessions without break
    const fatiguePattern = behaviorPatterns.find((p) => p.patternType === "fatigue_pattern");
    if (fatiguePattern && fatiguePattern.patternData?.consecutiveSessionsWithoutBreak > 3) {
      triggers.push(`${fatiguePattern.patternData.consecutiveSessionsWithoutBreak} consecutive sessions without break`);
      fatigueScore += 20;
    }

    const detected = fatigueScore > 30;
    const severity =
      fatigueScore > 60 ? "high" : fatigueScore > 40 ? "medium" : "low";

    const recommendation =
      severity === "high"
        ? "TAKE A BREAK NOW. Cognitive fatigue detected. Resume later for better retention."
        : severity === "medium"
          ? "Consider taking a short break soon to consolidate learning"
          : "Continue; fatigue level is normal";

    return {
      detected,
      severity,
      triggers,
      recommendation,
    };
  }

  /**
   * Calculate overall risk level
   */
  private calculateOverallRisk(
    misconceptions: any[],
    disengagement: any,
    fatigue: any
  ): "low" | "medium" | "high" {
    let riskScore = 0;

    // Misconception risk
    misconceptions.forEach((m) => {
      riskScore += m.severity === "high" ? 30 : m.severity === "medium" ? 15 : 5;
    });

    // Disengagement risk
    if (disengagement.detected) {
      riskScore += disengagement.severity === "high" ? 25 : disengagement.severity === "medium" ? 15 : 5;
    }

    // Fatigue risk
    if (fatigue.detected) {
      riskScore += fatigue.severity === "high" ? 25 : fatigue.severity === "medium" ? 15 : 5;
    }

    return riskScore > 50 ? "high" : riskScore > 25 ? "medium" : "low";
  }

  /**
   * Suggest intervention based on detected struggles
   */
  private suggestIntervention(
    misconceptions: any[],
    disengagement: any,
    fatigue: any,
    approachId: number
  ): string {
    // Priority 1: Fatigue (physical need)
    if (fatigue.detected && fatigue.severity === "high") {
      return "Take a break. Your brain needs consolidation time.";
    }

    // Priority 2: Misconceptions (learning need)
    if (misconceptions.length > 0) {
      const topMisconception = misconceptions[0];
      return `Misconception detected: ${topMisconception.concept}. ${topMisconception.recommendation}`;
    }

    // Priority 3: Disengagement (engagement need)
    if (disengagement.detected) {
      return disengagement.recommendation;
    }

    return "Continue learning; no intervention needed.";
  }

  /**
   * Predict if learner will struggle with a topic/approach combination
   */
  async predictStruggleRisk(
    userId: string,
    topicDifficulty: number,
    approachId: number,
    learnerAge?: number
  ): Promise<{
    riskLevel: "low" | "medium" | "high";
    riskFactors: string[];
    preventiveMeasures: string[];
  }> {
    const learningProfile = await learningBehaviorAnalyzer.getLearningStyleProfile(userId);

    let riskScore = 0;
    const riskFactors: string[] = [];
    const preventiveMeasures: string[] = [];

    // Topic difficulty risk
    if (topicDifficulty > 4) {
      riskScore += 20;
      riskFactors.push("Very high topic difficulty");
      preventiveMeasures.push("Start with simpler prerequisites");
    } else if (topicDifficulty > 3) {
      riskScore += 10;
      riskFactors.push("High topic difficulty");
    }

    // Approach mismatch risk
    if (learningProfile) {
      // Check if approach matches learning style
      const styleMatch = this.checkApproachStyleMatch(approachId, learningProfile);
      if (!styleMatch) {
        riskScore += 15;
        riskFactors.push("Approach may not match learning style");
        preventiveMeasures.push("Consider alternative approach");
      }

      // Check if approach matches motivation
      const motivationMatch = this.checkApproachMotivationMatch(approachId, learningProfile);
      if (!motivationMatch) {
        riskScore += 10;
        riskFactors.push("Approach may not align with motivation");
        preventiveMeasures.push("Reframe learning goal to match motivation");
      }
    }

    // Age-based risk
    if (learnerAge && learnerAge < 12 && topicDifficulty > 3) {
      riskScore += 15;
      riskFactors.push("Age may be too young for this difficulty level");
      preventiveMeasures.push("Use concrete examples and analogies");
    }

    const riskLevel = riskScore > 40 ? "high" : riskScore > 20 ? "medium" : "low";

    return {
      riskLevel,
      riskFactors,
      preventiveMeasures,
    };
  }

  /**
   * Check if approach matches learning style
   */
  private checkApproachStyleMatch(approachId: number, learningProfile: any): boolean {
    const styleBoosts: Record<number, string[]> = {
      1: ["reading", "auditory"], // Socratic
      2: ["reading", "kinesthetic"], // Problem-based
      3: ["kinesthetic", "visual"], // Experiential
      4: ["auditory", "reading"], // Peer
      5: ["reading", "auditory"], // Teaching
      6: ["kinesthetic", "visual"], // Challenges
      7: ["visual", "reading"], // Microlearning
      8: ["visual", "reading"], // Discovery
      9: ["visual", "reading", "kinesthetic"], // Synthesis
    };

    const approachStyles = styleBoosts[approachId] || [];
    const userStyles = [
      learningProfile.visualLearning > 70 ? "visual" : null,
      learningProfile.kinestheticLearning > 70 ? "kinesthetic" : null,
      learningProfile.auditoryLearning > 70 ? "auditory" : null,
      learningProfile.readingWritingLearning > 70 ? "reading" : null,
    ].filter(Boolean);

    return approachStyles.some((style) => userStyles.includes(style));
  }

  /**
   * Check if approach matches motivation
   */
  private checkApproachMotivationMatch(approachId: number, learningProfile: any): boolean {
    const motivationBoosts: Record<number, string[]> = {
      1: ["curiosity", "mastery"], // Socratic
      2: ["mastery", "achievement"], // Problem-based
      3: ["autonomy", "curiosity"], // Experiential
      4: ["relatedness", "autonomy"], // Peer
      5: ["mastery", "autonomy"], // Teaching
      6: ["achievement", "autonomy"], // Challenges
      7: ["autonomy", "mastery"], // Microlearning
      8: ["curiosity", "autonomy"], // Discovery
      9: ["mastery", "autonomy"], // Synthesis
    };

    const approachMotivations = motivationBoosts[approachId] || [];
    const userMotivation = learningProfile.primaryMotivator || "mastery";

    return approachMotivations.includes(userMotivation);
  }
}

// Export singleton
export const struggleDetector = new StruggleDetector();
