/**
 * Spaced Repetition Service
 * Implements SM-2 algorithm for scheduling reviews based on forgetting curve
 */

import { getDb } from "./db";
import { userConceptMetrics } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

interface SM2State {
  easeFactor: number; // Ease factor (1.3-2.5)
  interval: number; // Days until next review
  repetitions: number; // Number of successful repetitions
}

interface ReviewSchedule {
  conceptId: number;
  conceptName: string;
  nextReviewDate: Date;
  daysUntilReview: number;
  difficulty: "easy" | "medium" | "hard";
  easeFactor: number;
  repetitions: number;
}

/**
 * Calculate SM-2 parameters based on user response quality
 * Quality scale: 0-5 (0=complete failure, 5=perfect response)
 */
export function calculateSM2(
  currentState: SM2State,
  quality: number
): SM2State {
  const { easeFactor, interval, repetitions } = currentState;

  // Clamp quality to 0-5
  const q = Math.max(0, Math.min(5, quality));

  // Calculate new ease factor
  let newEaseFactor = easeFactor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
  newEaseFactor = Math.max(1.3, newEaseFactor); // Minimum ease factor is 1.3

  // Calculate new interval
  let newInterval: number;
  if (q < 3) {
    // Failed - reset interval
    newInterval = 1;
  } else if (repetitions === 0) {
    newInterval = 1;
  } else if (repetitions === 1) {
    newInterval = 3;
  } else {
    newInterval = Math.round(interval * newEaseFactor);
  }

  return {
    easeFactor: newEaseFactor,
    interval: newInterval,
    repetitions: q < 3 ? 0 : repetitions + 1,
  };
}

/**
 * Get review schedule for a user's concepts
 */
export async function getReviewSchedule(
  userId: number,
  limit: number = 10
): Promise<ReviewSchedule[]> {
  const db = await getDb();
  if (!db) return [];

  const metrics = await db
    .select()
    .from(userConceptMetrics)
    .where(eq(userConceptMetrics.userId, userId))
    .limit(limit);

  const now = new Date();

  return metrics
    .map((metric: any) => {
      const nextReviewDate = new Date(metric.nextReviewDate || now);
      const daysUntilReview = Math.ceil(
        (nextReviewDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      let difficulty: "easy" | "medium" | "hard";
      if (metric.easeFactor > 2.0) {
        difficulty = "easy";
      } else if (metric.easeFactor > 1.6) {
        difficulty = "medium";
      } else {
        difficulty = "hard";
      }

      return {
        conceptId: metric.conceptId,
        conceptName: metric.conceptName || "Unknown",
        nextReviewDate,
        daysUntilReview: Math.max(0, daysUntilReview),
        difficulty,
        easeFactor: metric.easeFactor,
        repetitions: metric.repetitions,
      };
    })
    .sort((a: ReviewSchedule, b: ReviewSchedule) => a.daysUntilReview - b.daysUntilReview);
}

/**
 * Record a review response and update schedule
 */
export async function recordReviewResponse(
  userId: number,
  conceptId: number,
  quality: number // 0-5
): Promise<ReviewSchedule | null> {
  const db = await getDb();
  if (!db) return null;

  // Get current metrics
  const metric = await db
    .select()
    .from(userConceptMetrics)
    .where(
      and(
        eq(userConceptMetrics.userId, userId),
        eq(userConceptMetrics.conceptId, conceptId)
      )
    )
    .then((rows: any[]) => rows[0]);

  if (!metric) {
    return null;
  }

  // Calculate new SM-2 state
  const currentState: SM2State = {
    easeFactor: metric.easeFactor,
    interval: metric.interval,
    repetitions: metric.repetitions,
  };

  const newState = calculateSM2(currentState, quality);

  // Calculate next review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newState.interval);

  // Update database
  await db
    .update(userConceptMetrics)
    .set({
      easeFactor: newState.easeFactor,
      interval: newState.interval,
      repetitions: newState.repetitions,
      nextReviewDate,
      lastReviewDate: new Date(),
      reviewCount: (metric.reviewCount || 0) + 1,
    })
    .where(
      and(
        eq(userConceptMetrics.userId, userId),
        eq(userConceptMetrics.conceptId, conceptId)
      )
    );

  // Return updated schedule
  const daysUntilReview = Math.ceil(
    (nextReviewDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  let difficulty: "easy" | "medium" | "hard";
  if (newState.easeFactor > 2.0) {
    difficulty = "easy";
  } else if (newState.easeFactor > 1.6) {
    difficulty = "medium";
  } else {
    difficulty = "hard";
  }

  return {
    conceptId,
    conceptName: metric.conceptName || "Unknown",
    nextReviewDate,
    daysUntilReview: Math.max(0, daysUntilReview),
    difficulty,
    easeFactor: newState.easeFactor,
    repetitions: newState.repetitions,
  };
}

/**
 * Get concepts due for review
 */
export async function getConceptsDueForReview(
  userId: number,
  limit: number = 5
): Promise<ReviewSchedule[]> {
  const schedule = await getReviewSchedule(userId, 100);
  return schedule.filter((item) => item.daysUntilReview <= 0).slice(0, limit);
}

/**
 * Get review statistics for a user
 */
export async function getReviewStats(userId: number) {
  const db = await getDb();
  if (!db) return { totalConcepts: 0, masteredConcepts: 0, dueConcepts: 0, masteryPercentage: 0, avgEaseFactor: 0 };

  const metrics = await db
    .select()
    .from(userConceptMetrics)
    .where(eq(userConceptMetrics.userId, userId));

  const totalConcepts = metrics.length;
  const masteredConcepts = metrics.filter((m: any) => m.repetitions >= 5).length;
  const dueConcepts = metrics.filter((m: any) => {
    const nextReview = new Date(m.nextReviewDate || new Date());
    return nextReview <= new Date();
  }).length;

  const avgEaseFactor =
    metrics.length > 0
      ? metrics.reduce((sum: number, m: any) => sum + m.easeFactor, 0) / metrics.length
      : 0;

  return {
    totalConcepts,
    masteredConcepts,
    dueConcepts,
    masteryPercentage:
      totalConcepts > 0
        ? Math.round((masteredConcepts / totalConcepts) * 100)
        : 0,
    avgEaseFactor: Math.round((avgEaseFactor as number) * 100) / 100,
  };
}
