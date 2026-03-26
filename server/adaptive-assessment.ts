/**
 * Adaptive Assessment Engine
 * 
 * Infers knowledge gaps from user behavior without explicit testing.
 * Analyzes quiz accuracy, time spent, reactions, and chat patterns.
 */

import * as db from "./db";

interface KnowledgeGap {
  conceptId: number;
  conceptName: string;
  severity: "low" | "medium" | "high";
  confidence: number; // 0-1 how confident we are about this gap
  reason: string;
  suggestedPrimer?: string;
}

interface UserKnowledgeProfile {
  userId: number;
  totalConceptsLearned: number;
  averageAccuracy: number;
  knowledgeGaps: KnowledgeGap[];
  recommendedNextSteps: string[];
}

/**
 * Update user concept metrics based on quiz performance
 */
export async function recordQuizPerformance(
  userId: number,
  conceptId: number,
  isCorrect: boolean,
  timeSpentSeconds: number
): Promise<void> {
  try {
    const existing = await db.getUserConceptMetric(userId, conceptId);

    if (!existing) {
      // First interaction with this concept
      await db.upsertUserConceptMetric({
        userId,
        conceptId,
        quizAccuracy: isCorrect ? 1 : 0,
        timeSpentSeconds,
        confidenceInferred: isCorrect ? 0.7 : 0.2,
      });
    } else {
      // Update with exponential moving average for accuracy
      const alpha = 0.3; // Weight for new data
      const newAccuracy = isCorrect ? 1 : 0;
      const updatedAccuracy = alpha * newAccuracy + (1 - alpha) * existing.quizAccuracy;

      // Infer confidence: high accuracy + reasonable time = high confidence
      let confidenceInferred = updatedAccuracy;
      if (timeSpentSeconds < 10 && updatedAccuracy > 0.8) {
        confidenceInferred = Math.min(1, updatedAccuracy + 0.1); // Bonus for quick correct answers
      } else if (timeSpentSeconds > 60 && updatedAccuracy < 0.5) {
        confidenceInferred = Math.max(0, updatedAccuracy - 0.2); // Penalty for struggling
      }

      await db.upsertUserConceptMetric({
        userId,
        conceptId,
        quizAccuracy: updatedAccuracy,
        timeSpentSeconds: existing.timeSpentSeconds + timeSpentSeconds,
        confidenceInferred,
      });
    }
  } catch (error) {
    console.error("[AdaptiveAssessment] Failed to record quiz performance:", error);
    throw error;
  }
}

/**
 * Update user concept metrics based on content engagement
 */
export async function recordContentEngagement(
  userId: number,
  conceptId: number,
  timeSpentSeconds: number,
  reaction?: "mindBlown" | "knew" | "save" | "skip"
): Promise<void> {
  try {
    const existing = await db.getUserConceptMetric(userId, conceptId);

    if (!existing) {
      // First interaction
      let confidenceInferred = 0.3; // Default for passive engagement
      if (reaction === "mindBlown") confidenceInferred = 0.6;
      if (reaction === "knew") confidenceInferred = 0.8;
      if (reaction === "skip") confidenceInferred = 0.1;

      await db.upsertUserConceptMetric({
        userId,
        conceptId,
        quizAccuracy: 0,
        timeSpentSeconds,
        confidenceInferred,
      });
    } else {
      // Update confidence based on reaction and time
      let confidenceAdjustment = 0;
      if (reaction === "mindBlown") confidenceAdjustment = 0.15;
      if (reaction === "knew") confidenceAdjustment = 0.25;
      if (reaction === "skip") confidenceAdjustment = -0.15;

      // Time-based adjustment: more time = more confidence (diminishing returns)
      const timeBonus = Math.min(0.1, timeSpentSeconds / 600); // Max 0.1 for 10+ min

      const updatedConfidence = Math.max(
        0,
        Math.min(1, existing.confidenceInferred + confidenceAdjustment + timeBonus)
      );

      await db.upsertUserConceptMetric({
        userId,
        conceptId,
        quizAccuracy: existing.quizAccuracy, // Don't change quiz accuracy from content engagement
        timeSpentSeconds: existing.timeSpentSeconds + timeSpentSeconds,
        confidenceInferred: updatedConfidence,
      });
    }
  } catch (error) {
    console.error("[AdaptiveAssessment] Failed to record content engagement:", error);
    throw error;
  }
}

/**
 * Detect knowledge gaps by analyzing prerequisites
 * If user struggles with concept C, flag prerequisites of C as potential gaps
 */
export async function detectKnowledgeGaps(userId: number): Promise<KnowledgeGap[]> {
  try {
    const userMetrics = await db.getUserConceptMetrics(userId);
    const gaps: KnowledgeGap[] = [];

    // Analyze each concept the user has interacted with
    for (const metric of userMetrics) {
      // If accuracy is low or confidence is low, check prerequisites
      if (metric.quizAccuracy < 0.6 || metric.confidenceInferred < 0.4) {
        const prerequisites = await db.getPrerequisitesForConcept(metric.conceptId);

        for (const prereq of prerequisites) {
          // Check if user has learned this prerequisite
          const prereqMetric = await db.getUserConceptMetric(userId, prereq.prerequisiteId);

          // Gap detected if: prerequisite not learned OR learned with low confidence
          if (!prereqMetric || prereqMetric.confidenceInferred < 0.5) {
            const prereqConcept = await db.getConceptById(prereq.prerequisiteId);
            if (prereqConcept) {
              // Severity based on prerequisite confidence and user's struggle
              let severity: "low" | "medium" | "high" = "medium";
              if (prereq.confidence > 0.8 && metric.quizAccuracy < 0.4) {
                severity = "high"; // Essential prerequisite + user struggling
              } else if (prereq.confidence < 0.5) {
                severity = "low"; // Weak prerequisite relationship
              }

              gaps.push({
                conceptId: prereq.prerequisiteId,
                conceptName: prereqConcept.name,
                severity,
                confidence: prereq.confidence,
                reason: `Missing prerequisite for "${prereqConcept.name}" (user accuracy: ${(metric.quizAccuracy * 100).toFixed(0)}%)`,
                suggestedPrimer: `Quick primer: ${prereqConcept.name}`,
              });
            }
          }
        }
      }
    }

    // Deduplicate gaps (same concept might appear multiple times)
    const uniqueGaps = new Map<number, KnowledgeGap>();
    for (const gap of gaps) {
      const existing = uniqueGaps.get(gap.conceptId);
      if (!existing || gap.severity === "high") {
        uniqueGaps.set(gap.conceptId, gap);
      }
    }

    return Array.from(uniqueGaps.values());
  } catch (error) {
    console.error("[AdaptiveAssessment] Failed to detect knowledge gaps:", error);
    return [];
  }
}

/**
 * Get user's knowledge profile for adaptive content selection
 */
export async function getUserKnowledgeProfile(userId: number): Promise<UserKnowledgeProfile> {
  try {
    const metrics = await db.getUserConceptMetrics(userId);
    const gaps = await detectKnowledgeGaps(userId);

    // Calculate aggregate statistics
    const totalConceptsLearned = metrics.length;
    const averageAccuracy =
      metrics.length > 0
        ? metrics.reduce((sum, m) => sum + m.quizAccuracy, 0) / metrics.length
        : 0;

    // Generate recommendations
    const recommendedNextSteps: string[] = [];

    if (gaps.length > 0) {
      const highSeverityGaps = gaps.filter((g) => g.severity === "high");
      if (highSeverityGaps.length > 0) {
        recommendedNextSteps.push(
          `Learn ${highSeverityGaps[0].conceptName} to improve understanding`
        );
      }
    }

    if (averageAccuracy > 0.8 && totalConceptsLearned >= 5) {
      recommendedNextSteps.push("Ready for advanced concepts - try Expert layer");
    }

    if (averageAccuracy < 0.5 && totalConceptsLearned >= 3) {
      recommendedNextSteps.push("Review fundamentals - consider Foundation layer");
    }

    if (totalConceptsLearned === 0) {
      recommendedNextSteps.push("Start with Foundation layer to build basics");
    }

    return {
      userId,
      totalConceptsLearned,
      averageAccuracy,
      knowledgeGaps: gaps,
      recommendedNextSteps,
    };
  } catch (error) {
    console.error("[AdaptiveAssessment] Failed to get knowledge profile:", error);
    return {
      userId,
      totalConceptsLearned: 0,
      averageAccuracy: 0,
      knowledgeGaps: [],
      recommendedNextSteps: ["Error loading profile"],
    };
  }
}

/**
 * Determine which content layer to show based on user's knowledge
 */
export async function selectContentLayer(
  userId: number,
  conceptId: number
): Promise<"foundation" | "deepDive" | "expert"> {
  try {
    const metric = await db.getUserConceptMetric(userId, conceptId);

    if (!metric) {
      // Never seen this concept - start with Foundation
      return "foundation";
    }

    // Layer selection based on confidence
    if (metric.confidenceInferred < 0.4) {
      return "foundation"; // Struggling - go back to basics
    } else if (metric.confidenceInferred < 0.7) {
      return "deepDive"; // Intermediate understanding
    } else {
      return "expert"; // High confidence - ready for advanced
    }
  } catch (error) {
    console.error("[AdaptiveAssessment] Failed to select content layer:", error);
    return "foundation"; // Fallback to foundation
  }
}

/**
 * Check if user should be offered a prerequisite primer
 */
export async function shouldOfferPrimer(userId: number, conceptId: number): Promise<boolean> {
  try {
    const prerequisites = await db.getPrerequisitesForConcept(conceptId);

    for (const prereq of prerequisites) {
      // High-confidence prerequisite
      if (prereq.confidence > 0.7) {
        const userMetric = await db.getUserConceptMetric(userId, prereq.prerequisiteId);

        // User hasn't learned it or learned with low confidence
        if (!userMetric || userMetric.confidenceInferred < 0.5) {
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    console.error("[AdaptiveAssessment] Failed to check primer offer:", error);
    return false;
  }
}

/**
 * Get confidence score for a user on a specific concept (0-1)
 */
export async function getUserConceptConfidence(userId: number, conceptId: number): Promise<number> {
  try {
    const metric = await db.getUserConceptMetric(userId, conceptId);
    return metric?.confidenceInferred ?? 0;
  } catch (error) {
    console.error("[AdaptiveAssessment] Failed to get concept confidence:", error);
    return 0;
  }
}

/**
 * Batch update user metrics from quiz results
 */
export async function recordBatchQuizResults(
  userId: number,
  results: Array<{
    conceptId: number;
    isCorrect: boolean;
    timeSpentSeconds: number;
  }>
): Promise<void> {
  try {
    for (const result of results) {
      await recordQuizPerformance(userId, result.conceptId, result.isCorrect, result.timeSpentSeconds);
    }
  } catch (error) {
    console.error("[AdaptiveAssessment] Failed to record batch quiz results:", error);
    throw error;
  }
}
