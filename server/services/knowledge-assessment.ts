// Knowledge Assessment Agent - uses local heuristics (no LLM dependency)

export interface UserKnowledgeProfile {
  estimatedLevel: "beginner" | "intermediate" | "advanced" | "expert";
  confidenceScore: number; // 0-100
  topicSpecificLevels: Record<string, number>; // topic -> level 1-5
  quizAccuracyByTopic: Record<string, number>; // topic -> accuracy %
  averageQuizAccuracy: number; // overall accuracy %
  timeSpentByTopic: Record<string, number>; // topic -> minutes
  totalTimeSpent: number; // total minutes
  completedTopics: string[];
  inProgressTopics: string[];
  strugglingTopics: string[]; // topics with <60% accuracy
  mastery: Record<string, { level: number; progress: number }>; // topic -> {level, progress}
  reasoning: string;
}

export interface UserHistoryData {
  topicId: string;
  quizzes: Array<{
    id: string;
    accuracy: number; // 0-1
    timestamp: number;
  }>;
  contentViewed: number; // count of content items viewed
  timeSpent: number; // minutes
  reactions: {
    mindBlown: number;
    knewThis: number;
    saved: number;
    skipped: number;
  };
  currentLadderLevel?: number; // 1-5
}

export class KnowledgeAssessmentAgent {

  /**
   * Assess user's knowledge based on learning history
   */
  async assessUserKnowledge(
    userHistory: UserHistoryData[]
  ): Promise<UserKnowledgeProfile> {
    // Calculate aggregate statistics
    const topicSpecificLevels: Record<string, number> = {};
    const quizAccuracyByTopic: Record<string, number> = {};
    const timeSpentByTopic: Record<string, number> = {};
    const strugglingTopics: string[] = [];
    const completedTopics: string[] = [];
    const inProgressTopics: string[] = [];

    let totalAccuracy = 0;
    let totalTimeSpent = 0;
    let totalQuizzes = 0;

    for (const history of userHistory) {
      const topicId = history.topicId;

      // Calculate average accuracy for this topic
      if (history.quizzes.length > 0) {
        const avgAccuracy =
          history.quizzes.reduce((sum, q) => sum + q.accuracy, 0) /
          history.quizzes.length;
        quizAccuracyByTopic[topicId] = avgAccuracy * 100;
        totalAccuracy += avgAccuracy;
        totalQuizzes += history.quizzes.length;

        // Determine if struggling
        if (avgAccuracy < 0.6) {
          strugglingTopics.push(topicId);
        } else if (avgAccuracy > 0.85) {
          completedTopics.push(topicId);
        } else {
          inProgressTopics.push(topicId);
        }
      }

      // Time spent
      timeSpentByTopic[topicId] = history.timeSpent;
      totalTimeSpent += history.timeSpent;

      // Infer ladder level from reactions and accuracy
      const knewThisRatio =
        history.reactions.knewThis /
        (history.reactions.mindBlown +
          history.reactions.knewThis +
          history.reactions.saved +
          history.reactions.skipped +
          1);
      const mindBlownRatio =
        history.reactions.mindBlown /
        (history.reactions.mindBlown +
          history.reactions.knewThis +
          history.reactions.saved +
          history.reactions.skipped +
          1);

      // Estimate level: high "knew this" + low "mind blown" = advanced
      let estimatedLevel = history.currentLadderLevel || 2;
      if (knewThisRatio > 0.6 && mindBlownRatio < 0.2) {
        estimatedLevel = Math.min(5, estimatedLevel + 1);
      } else if (mindBlownRatio > 0.6) {
        estimatedLevel = Math.max(1, estimatedLevel - 1);
      }

      topicSpecificLevels[topicId] = Math.max(1, Math.min(5, estimatedLevel));
    }

    const averageAccuracy = totalQuizzes > 0 ? (totalAccuracy / totalQuizzes) * 100 : 0;

    // Determine overall level
    let estimatedLevel: "beginner" | "intermediate" | "advanced" | "expert" =
      "beginner";
    if (averageAccuracy > 80) {
      estimatedLevel = "expert";
    } else if (averageAccuracy > 70) {
      estimatedLevel = "advanced";
    } else if (averageAccuracy > 60) {
      estimatedLevel = "intermediate";
    }

    const reasoning = this.generateReasoning(
      averageAccuracy,
      totalTimeSpent,
      completedTopics.length,
      strugglingTopics.length
    );

    return {
      estimatedLevel,
      confidenceScore: Math.min(100, totalQuizzes * 10), // Confidence increases with more data
      topicSpecificLevels,
      quizAccuracyByTopic,
      averageQuizAccuracy: averageAccuracy,
      timeSpentByTopic,
      totalTimeSpent,
      completedTopics,
      inProgressTopics,
      strugglingTopics,
      mastery: this.calculateMastery(topicSpecificLevels, quizAccuracyByTopic),
      reasoning,
    };
  }

  /**
   * Assess user's knowledge for a specific topic
   */
  async assessTopicKnowledge(
    topicId: string,
    userHistory: UserHistoryData[]
  ): Promise<{
    level: number;
    accuracy: number;
    timeSpent: number;
    confidence: number;
    recommendation: string;
  }> {
    const topicHistory = userHistory.find((h) => h.topicId === topicId);

    if (!topicHistory) {
      return {
        level: 1,
        accuracy: 0,
        timeSpent: 0,
        confidence: 0,
        recommendation: "Start from the beginning - no prior knowledge detected",
      };
    }

    const accuracy =
      topicHistory.quizzes.length > 0
        ? (topicHistory.quizzes.reduce((sum, q) => sum + q.accuracy, 0) /
            topicHistory.quizzes.length) *
          100
        : 0;

    const level = Math.max(
      1,
      Math.min(5, Math.ceil((accuracy / 100) * 5))
    );

    let recommendation = "";
    if (accuracy < 40) {
      recommendation = "Start from Level 1 - foundational concepts needed";
    } else if (accuracy < 60) {
      recommendation = `Start from Level ${level} - review basics first`;
    } else if (accuracy < 80) {
      recommendation = `Continue from Level ${level} - you're on track`;
    } else {
      recommendation = `Skip to Level ${Math.min(5, level + 1)} - you're ready for advanced content`;
    }

    return {
      level,
      accuracy,
      timeSpent: topicHistory.timeSpent,
      confidence: Math.min(100, topicHistory.quizzes.length * 15),
      recommendation,
    };
  }

  /**
   * Detect knowledge gaps and prerequisites
   */
  async detectKnowledgeGaps(
    targetTopic: string,
    userHistory: UserHistoryData[]
  ): Promise<{
    missingPrerequisites: string[];
    weakAreas: string[];
    readinessScore: number; // 0-100
    suggestedPrep: string[];
  }> {
    // Topic prerequisite mapping
    const prerequisiteMap: Record<string, string[]> = {
      "quantum computing": ["quantum_mechanics", "linear_algebra"],
      "machine learning": ["linear_algebra", "calculus", "probability"],
      "climate science": ["physics", "chemistry", "statistics"],
      justice: ["philosophy_basics", "ethics"],
      "string theory": ["quantum_mechanics", "relativity"],
      "neural networks": ["linear_algebra", "calculus", "programming"],
    };

    const prerequisites = prerequisiteMap[targetTopic.toLowerCase()] || [];
    const userTopics = new Set(userHistory.map((h) => h.topicId));

    const missingPrerequisites = prerequisites.filter((p) => !userTopics.has(p));

    // Find weak areas (accuracy < 70%)
    const weakAreas = userHistory
      .filter((h) => {
        const acc =
          h.quizzes.length > 0
            ? (h.quizzes.reduce((sum, q) => sum + q.accuracy, 0) /
                h.quizzes.length) *
              100
            : 0;
        return acc < 70 && acc > 0;
      })
      .map((h) => h.topicId);

    // Calculate readiness
    let readinessScore = 100;
    readinessScore -= missingPrerequisites.length * 20; // -20 per missing prerequisite
    readinessScore -= weakAreas.length * 10; // -10 per weak area
    readinessScore = Math.max(0, readinessScore);

    const suggestedPrep = [...missingPrerequisites, ...weakAreas].slice(0, 3);

    return {
      missingPrerequisites,
      weakAreas,
      readinessScore,
      suggestedPrep,
    };
  }

  /**
   * Generate reasoning for assessment
   */
  private generateReasoning(
    accuracy: number,
    timeSpent: number,
    completedCount: number,
    strugglingCount: number
  ): string {
    let reasoning = "";

    if (accuracy > 80) {
      reasoning += "Consistently high quiz accuracy suggests advanced understanding. ";
    } else if (accuracy > 60) {
      reasoning += "Moderate quiz accuracy indicates intermediate knowledge. ";
    } else {
      reasoning += "Lower quiz accuracy suggests foundational learning phase. ";
    }

    if (timeSpent > 300) {
      reasoning += "Significant time investment shows commitment to learning. ";
    }

    if (completedCount > 0) {
      reasoning += `Completed ${completedCount} topics successfully. `;
    }

    if (strugglingCount > 0) {
      reasoning += `Struggling with ${strugglingCount} topics - may need targeted support. `;
    }

    return reasoning;
  }

  /**
   * Calculate mastery levels
   */
  private calculateMastery(
    topicLevels: Record<string, number>,
    accuracy: Record<string, number>
  ): Record<string, { level: number; progress: number }> {
    const mastery: Record<string, { level: number; progress: number }> = {};

    for (const [topic, level] of Object.entries(topicLevels)) {
      const acc = accuracy[topic] || 0;
      const progress = Math.min(100, (acc / 100) * 100); // Progress towards next level

      mastery[topic] = {
        level: Math.max(1, Math.min(5, level)),
        progress: Math.round(progress),
      };
    }

    return mastery;
  }
}

export const knowledgeAssessmentAgent = new KnowledgeAssessmentAgent();
