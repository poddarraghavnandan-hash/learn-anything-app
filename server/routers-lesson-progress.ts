/**
 * tRPC Router for Lesson Progress Tracking
 * Records user progress, quiz answers, and learning metrics
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { userConceptMetrics } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const lessonProgressRouter = router({
  /**
   * Update lesson progress and quiz accuracy
   */
  updateProgress: protectedProcedure
    .input(
      z.object({
        conceptId: z.number(),
        conceptName: z.string(),
        isCorrect: z.boolean(),
        timeSpentSeconds: z.number(),
        difficulty: z.number().min(1).max(5),
        confidenceLevel: z.number().min(1).max(5),
        quality: z.number().min(0).max(5),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error("User not authenticated");

      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      try {
        // Get or create user concept metrics
        const existing = await db
          .select()
          .from(userConceptMetrics)
          .where(
            and(
              eq(userConceptMetrics.userId, userId),
              eq(userConceptMetrics.conceptId, input.conceptId)
            )
          )
          .then((rows: any[]) => rows[0]);

        if (existing) {
          // Update existing metrics
          const newAccuracy =
            (existing.quizAccuracy * existing.reviewCount +
              (input.isCorrect ? 100 : 0)) /
            (existing.reviewCount + 1);

          await db
            .update(userConceptMetrics)
            .set({
              quizAccuracy: newAccuracy,
              timeSpentSeconds:
                existing.timeSpentSeconds + input.timeSpentSeconds,
              confidenceInferred:
                (existing.confidenceInferred * existing.reviewCount +
                  input.confidenceLevel) /
                (existing.reviewCount + 1),
              reviewCount: existing.reviewCount + 1,
              lastInteractionAt: new Date(),
            })
            .where(
              and(
                eq(userConceptMetrics.userId, userId),
                eq(userConceptMetrics.conceptId, input.conceptId)
              )
            );
        } else {
          // Create new metrics
          await db.insert(userConceptMetrics).values({
            userId,
            conceptId: input.conceptId,
            conceptName: input.conceptName,
            quizAccuracy: input.isCorrect ? 100 : 0,
            timeSpentSeconds: input.timeSpentSeconds,
            confidenceInferred: input.confidenceLevel,
            easeFactor: 2.5, // Default SM-2 ease factor
            interval: 1,
            repetitions: 0,
            nextReviewDate: new Date(),
            reviewCount: 1,
          });
        }

        return {
          success: true,
          conceptId: input.conceptId,
          accuracy: input.isCorrect ? 100 : 0,
        };
      } catch (error) {
        console.error("Failed to update progress:", error);
        throw new Error("Failed to save progress");
      }
    }),

  /**
   * Get user's learning statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.id;
    if (!userId) throw new Error("User not authenticated");

    const db = await getDb();
    if (!db) return null;

    try {
      const metrics = await db
        .select()
        .from(userConceptMetrics)
        .where(eq(userConceptMetrics.userId, userId));

      if (metrics.length === 0) {
        return {
          totalConcepts: 0,
          averageAccuracy: 0,
          totalTimeSpent: 0,
          conceptsDue: 0,
          masteredConcepts: 0,
        };
      }

      const now = new Date();
      const conceptsDue = metrics.filter(
        (m: any) => new Date(m.nextReviewDate) <= now
      ).length;

      const masteredConcepts = metrics.filter(
        (m: any) => m.quizAccuracy >= 90 && m.repetitions >= 3
      ).length;

      const totalAccuracy =
        metrics.reduce((sum: number, m: any) => sum + m.quizAccuracy, 0) /
        metrics.length;

      const totalTime = metrics.reduce(
        (sum: number, m: any) => sum + (m.timeSpentSeconds || 0),
        0
      );

      return {
        totalConcepts: metrics.length,
        averageAccuracy: Math.round(totalAccuracy),
        totalTimeSpent: totalTime,
        conceptsDue,
        masteredConcepts,
      };
    } catch (error) {
      console.error("Failed to get stats:", error);
      return null;
    }
  }),

  /**
   * Get concepts due for review
   */
  getConceptsDue: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.id;
    if (!userId) throw new Error("User not authenticated");

    const db = await getDb();
    if (!db) return [];

    try {
      const now = new Date();
      const metrics = await db
        .select()
        .from(userConceptMetrics)
        .where(eq(userConceptMetrics.userId, userId));

      return metrics
        .filter((m: any) => new Date(m.nextReviewDate) <= now)
        .sort(
          (a: any, b: any) =>
            new Date(a.nextReviewDate).getTime() -
            new Date(b.nextReviewDate).getTime()
        )
        .slice(0, 10);
    } catch (error) {
      console.error("Failed to get concepts due:", error);
      return [];
    }
  }),
});
