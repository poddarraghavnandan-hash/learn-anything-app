/**
 * tRPC Router for Spaced Repetition
 * Endpoints for SM-2 scheduling and review management
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as spacedRep from "./spaced-repetition";

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
   * Get review statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.id;
    if (!userId) throw new Error("User not authenticated");

    const stats = await spacedRep.getReviewStats(userId);
    return stats;
  }),
});
