import { getUserSignals, analyzeSignals } from "./signal-observer";
import { getUserLearnerProfile } from "./learner-profile";

/**
 * Signal-Driven Recommendation Engine
 * Generates personalized content recommendations based on learner signals
 */

export interface ContentRecommendation {
  conceptId: number;
  conceptName: string;
  reason: string;
  confidence: number; // 0-1
  priority: "high" | "medium" | "low";
}

export interface LearningRecommendation {
  nextConceptId: number;
  nextConceptName: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  reason: string;
  confidence: number;
}

export interface ReviewRecommendation {
  conceptId: number;
  conceptName: string;
  reason: string;
  urgency: "high" | "medium" | "low";
}

/**
 * Generate content recommendations based on signal analysis
 */
export async function recommendContent(
  userId: number,
  limit: number = 5
): Promise<ContentRecommendation[]> {
  try {
    const profile = await getUserLearnerProfile(userId);
    if (!profile) return [];

    const recommendations: ContentRecommendation[] = [];

    // 1. Recommend content for knowledge gaps
    for (const gap of profile.knowledgeGaps.slice(0, 3)) {
      let priority: "high" | "medium" | "low" = "medium";
      if (gap.reason === "stuck_signal") {
        priority = "high"; // Stuck points need immediate help
      } else if (gap.reason === "low_confidence") {
        priority = "high";
      }

      recommendations.push({
        conceptId: gap.conceptId,
        conceptName: gap.conceptName,
        reason: `Address knowledge gap: ${gap.reason}`,
        confidence: 0.9,
        priority,
      });
    }

    // 2. Recommend content for concepts with low confidence
    for (const concept of profile.topConceptsByConfidence) {
      if (concept.confidence < 0.4) {
        recommendations.push({
          conceptId: concept.conceptId,
          conceptName: concept.conceptName,
          reason: "Low confidence - needs reinforcement",
          confidence: 0.85,
          priority: "high",
        });
      }
    }

    // 3. Recommend advanced content for high-confidence concepts
    for (const concept of profile.topConceptsByConfidence.slice(0, 2)) {
      if (concept.confidence > 0.7) {
        recommendations.push({
          conceptId: concept.conceptId,
          conceptName: concept.conceptName,
          reason: "Strong mastery - explore advanced applications",
          confidence: 0.8,
          priority: "low",
        });
      }
    }

    // Sort by priority and confidence
    recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityDiff =
        priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.confidence - a.confidence;
    });

    return recommendations.slice(0, limit);
  } catch (error) {
    console.error("[Recommendations] Failed to generate content recommendations:", error);
    return [];
  }
}

/**
 * Suggest next concept to learn based on breakthroughs and stuck points
 */
export async function suggestNextConcept(
  userId: number
): Promise<LearningRecommendation | null> {
  try {
    const profile = await getUserLearnerProfile(userId);
    if (!profile) return null;

    // If learner has had breakthroughs, suggest related advanced concepts
    if (profile.breakthroughsThisWeek > 2) {
      const topConcept = profile.topConceptsByConfidence[0];
      if (topConcept) {
        return {
          nextConceptId: topConcept.conceptId + 1, // Simplified - would fetch from DB
          nextConceptName: `Advanced: ${topConcept.conceptName}`,
          difficulty: "advanced",
          reason: "You're having breakthroughs - ready for advanced content",
          confidence: 0.85,
        };
      }
    }

    // If learner is struggling, suggest foundational concepts
    if (profile.confidenceTrajectory === "struggling") {
      return {
        nextConceptId: 0,
        nextConceptName: "Foundational Concepts Review",
        difficulty: "beginner",
        reason: "Strengthen your foundation before moving forward",
        confidence: 0.9,
      };
    }

    // Default: suggest next logical concept
    return {
      nextConceptId: 1,
      nextConceptName: "Next Concept",
      difficulty: "intermediate",
      reason: "Continue your learning journey",
      confidence: 0.7,
    };
  } catch (error) {
    console.error("[Recommendations] Failed to suggest next concept:", error);
    return null;
  }
}

/**
 * Detect knowledge gaps from stuck signals
 */
export async function detectKnowledgeGaps(userId: number): Promise<string[]> {
  try {
    const signals = await getUserSignals(userId, {});
    const stuckSignals = signals.filter((s) => s.signalType === "stuck");

    const gaps: string[] = [];
    for (const signal of stuckSignals) {
      if (signal.metadata && typeof signal.metadata === "object") {
        const meta = signal.metadata as any;
        if (meta.content) {
          gaps.push(meta.content as string);
        }
      }
    }

    return gaps.slice(0, 5);
  } catch (error) {
    console.error("[Recommendations] Failed to detect knowledge gaps:", error);
    return [];
  }
}

/**
 * Suggest topics for review based on confidence trajectory
 */
export async function suggestReviewTopics(
  userId: number
): Promise<ReviewRecommendation[]> {
  try {
    const profile = await getUserLearnerProfile(userId);
    if (!profile) return [];

    const reviews: ReviewRecommendation[] = [];

    // If confidence is declining, suggest reviewing recent concepts
    if (profile.confidenceTrajectory === "struggling") {
      for (const concept of profile.topConceptsByConfidence.slice(0, 3)) {
        reviews.push({
          conceptId: concept.conceptId,
          conceptName: concept.conceptName,
          reason: "Confidence declining - review recommended",
          urgency: "high",
        });
      }
    }

    // If there are stuck points, suggest reviewing those concepts
    for (const gap of profile.knowledgeGaps.slice(0, 2)) {
      reviews.push({
        conceptId: gap.conceptId,
        conceptName: gap.conceptName,
        reason: `You got stuck on this - review "${gap.reason}"`,
        urgency: "high",
      });
    }

    // Suggest spaced repetition for concepts with medium confidence
    for (const concept of profile.topConceptsByConfidence) {
      if (concept.confidence > 0.4 && concept.confidence < 0.7) {
        reviews.push({
          conceptId: concept.conceptId,
          conceptName: concept.conceptName,
          reason: "Time to review - strengthen your understanding",
          urgency: "medium",
        });
      }
    }

    return reviews.slice(0, 5);
  } catch (error) {
    console.error("[Recommendations] Failed to suggest review topics:", error);
    return [];
  }
}

/**
 * Generate adaptive difficulty suggestions based on learner performance
 */
export async function suggestDifficulty(userId: number): Promise<"beginner" | "intermediate" | "advanced"> {
  try {
    const profile = await getUserLearnerProfile(userId);
    if (!profile) return "beginner";

    // If average confidence is high and improving, suggest advanced
    if (
      profile.averageConfidence > 0.7 &&
      profile.confidenceTrajectory === "improving"
    ) {
      return "advanced";
    }

    // If average confidence is low or struggling, suggest beginner
    if (
      profile.averageConfidence < 0.4 ||
      profile.confidenceTrajectory === "struggling"
    ) {
      return "beginner";
    }

    // Default to intermediate
    return "intermediate";
  } catch (error) {
    console.error("[Recommendations] Failed to suggest difficulty:", error);
    return "intermediate";
  }
}

/**
 * Generate learning path recommendations
 */
export async function generateLearningPath(
  userId: number
): Promise<{
  currentLevel: "beginner" | "intermediate" | "advanced";
  nextSteps: string[];
  estimatedTimeToMastery: number; // in hours
  focusAreas: string[];
}> {
  try {
    const profile = await getUserLearnerProfile(userId);
    if (!profile) {
      return {
        currentLevel: "beginner",
        nextSteps: ["Start with foundational concepts"],
        estimatedTimeToMastery: 40,
        focusAreas: ["Basics"],
      };
    }

    const difficulty = await suggestDifficulty(userId);
    const nextConcept = await suggestNextConcept(userId);
    const reviewTopics = await suggestReviewTopics(userId);

    // Estimate time to mastery based on current velocity and gaps
    const weeklySignals = profile.totalSignalsThisWeek;
    const gapCount = profile.knowledgeGaps.length;
    const estimatedHours = Math.max(10, (gapCount * 5) / (weeklySignals || 1));

    return {
      currentLevel: difficulty,
      nextSteps: profile.recommendedNextSteps,
      estimatedTimeToMastery: Math.round(estimatedHours),
      focusAreas: profile.knowledgeGaps.map((g) => g.conceptName),
    };
  } catch (error) {
    console.error("[Recommendations] Failed to generate learning path:", error);
    return {
      currentLevel: "beginner",
      nextSteps: ["Continue learning"],
      estimatedTimeToMastery: 40,
      focusAreas: [],
    };
  }
}

/**
 * Get personalized learning insights
 */
export async function getLearningInsights(userId: number): Promise<{
  strengths: string[];
  challenges: string[];
  opportunities: string[];
  nextMilestone: string;
}> {
  try {
    const profile = await getUserLearnerProfile(userId);
    if (!profile) {
      return {
        strengths: [],
        challenges: ["Getting started"],
        opportunities: ["Explore any topic"],
        nextMilestone: "Complete first learning journey",
      };
    }

    const strengths: string[] = [];
    const challenges: string[] = [];
    const opportunities: string[] = [];

    // Identify strengths
    if (profile.breakthroughsThisWeek > 2) {
      strengths.push("You're having frequent breakthroughs!");
    }
    if (profile.averageConfidence > 0.7) {
      strengths.push("High confidence across concepts");
    }
    if (profile.confidenceTrajectory === "improving") {
      strengths.push("Your confidence is improving steadily");
    }

    // Identify challenges
    if (profile.stuckPointsThisWeek > 2) {
      challenges.push("You've hit some challenging concepts");
    }
    if (profile.averageConfidence < 0.4) {
      challenges.push("Low overall confidence - need more practice");
    }
    if (profile.confidenceTrajectory === "struggling") {
      challenges.push("Your confidence is declining - time for review");
    }

    // Identify opportunities
    if (profile.learningVelocity > 0.5) {
      opportunities.push("You're learning fast - try advanced topics");
    }
    if (profile.knowledgeGaps.length > 0) {
      opportunities.push(
        `Address ${profile.knowledgeGaps.length} knowledge gaps`
      );
    }
    if (profile.topConceptsByConfidence.length > 0) {
      opportunities.push("Explore related concepts to deepen understanding");
    }

    // Determine next milestone
    let nextMilestone = "Continue learning";
    if (profile.breakthroughsThisWeek === 0) {
      nextMilestone = "Have your first breakthrough";
    } else if (profile.averageConfidence < 0.5) {
      nextMilestone = "Reach 50% average confidence";
    } else if (profile.averageConfidence < 0.8) {
      nextMilestone = "Reach 80% average confidence";
    } else {
      nextMilestone = "Master advanced concepts";
    }

    return {
      strengths: strengths.slice(0, 3),
      challenges: challenges.slice(0, 3),
      opportunities: opportunities.slice(0, 3),
      nextMilestone,
    };
  } catch (error) {
    console.error("[Recommendations] Failed to get learning insights:", error);
    return {
      strengths: [],
      challenges: ["Error loading insights"],
      opportunities: [],
      nextMilestone: "Continue learning",
    };
  }
}
