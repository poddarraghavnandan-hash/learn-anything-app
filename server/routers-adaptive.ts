/**
 * tRPC Router for Adaptive Assessment Engine
 * 
 * Endpoints for recording user interactions and retrieving adaptive recommendations
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as assessment from "./adaptive-assessment";

export const adaptiveRouter = router({
  /**
   * Record quiz performance for a concept
   */
  recordQuizResult: protectedProcedure
    .input(
      z.object({
        conceptId: z.number(),
        isCorrect: z.boolean(),
        timeSpentSeconds: z.number().min(0),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error("User not authenticated");

      await assessment.recordQuizPerformance(
        userId,
        input.conceptId,
        input.isCorrect,
        input.timeSpentSeconds
      );

      return { success: true };
    }),

  /**
   * Record content engagement (time spent, reactions)
   */
  recordEngagement: protectedProcedure
    .input(
      z.object({
        conceptId: z.number(),
        timeSpentSeconds: z.number().min(0),
        reaction: z.enum(["mindBlown", "knew", "save", "skip"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error("User not authenticated");

      await assessment.recordContentEngagement(
        userId,
        input.conceptId,
        input.timeSpentSeconds,
        input.reaction
      );

      return { success: true };
    }),

  /**
   * Batch record multiple quiz results
   */
  recordBatchResults: protectedProcedure
    .input(
      z.object({
        results: z.array(
          z.object({
            conceptId: z.number(),
            isCorrect: z.boolean(),
            timeSpentSeconds: z.number().min(0),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error("User not authenticated");

      await assessment.recordBatchQuizResults(userId, input.results);

      return { success: true, count: input.results.length };
    }),

  /**
   * Get user's knowledge profile
   */
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.id;
    if (!userId) throw new Error("User not authenticated");

    const profile = await assessment.getUserKnowledgeProfile(userId);
    return profile;
  }),

  /**
   * Detect knowledge gaps for user
   */
  detectGaps: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.id;
    if (!userId) throw new Error("User not authenticated");

    const gaps = await assessment.detectKnowledgeGaps(userId);
    return gaps;
  }),

  /**
   * Get recommended content layer for a concept
   */
  selectLayer: protectedProcedure
    .input(
      z.object({
        conceptId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error("User not authenticated");

      const layer = await assessment.selectContentLayer(userId, input.conceptId);
      return { layer };
    }),

  /**
   * Check if user should be offered a prerequisite primer
   */
  checkPrimer: protectedProcedure
    .input(
      z.object({
        conceptId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error("User not authenticated");

      const shouldOffer = await assessment.shouldOfferPrimer(userId, input.conceptId);
      return { shouldOffer };
    }),

  /**
   * Get user's confidence on a specific concept (0-1)
   */
  getConfidence: protectedProcedure
    .input(
      z.object({
        conceptId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error("User not authenticated");

      const confidence = await assessment.getUserConceptConfidence(userId, input.conceptId);
      return { confidence };
    }),
});
