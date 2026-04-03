/**
 * tRPC Router for Spaced Repetition
 * Endpoints for SM-2 scheduling and review management
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as spacedRep from "./spaced-repetition";
import { seedConceptsFromJourney } from "./services/heuristic-engine";

export const spacedRepetitionRouter = router({
  /**
   * Get review schedule for user's concepts
   */
  getSchedule: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(50).optional().default(10) }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error("User not authenticated");

      const schedule = await spacedRep.getReviewSchedule(userId, input.limit);
      return { schedule };
    }),

  /**
   * Get concepts due for review
   */
  getConceptsDue: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(20).optional().default(5) }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error("User not authenticated");

      const concepts = await spacedRep.getConceptsDueForReview(userId, input.limit);
      return { concepts };
    }),

  /**
   * Record a review response and update schedule
   */
  recordReview: protectedProcedure
    .input(
      z.object({
        conceptId: z.number(),
        quality: z.number().min(0).max(5), // 0-5 quality score
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error("User not authenticated");

      const updated = await spacedRep.recordReviewResponse(
        userId,
        input.conceptId,
        input.quality
      );

      if (!updated) {
        throw new Error("Failed to record review");
      }

      return updated;
    }),

  /**
   * Seed concepts from a completed journey into spaced repetition
   * Creates userConceptMetrics rows so concepts appear in review schedule
   */
  seedFromJourney: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        concepts: z.array(
          z.object({
            name: z.string(),
            checkCorrect: z.boolean().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const seeded = await seedConceptsFromJourney(input.userId, input.concepts);
      return { seeded, total: input.concepts.length };
    }),

  /**
   * Get review statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.id;
    if (!userId) throw new Error("User not authenticated");

    const stats = await spacedRep.getReviewStats(userId);
    return stats;
  }),
});
