/**
 * tRPC Routers for Learning Ladder Integration & Content Summary Enrichment
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as ladderIntegration from "./learning-ladder-integration";
import * as summaryEnrichment from "./content-summary-enrichment";
import {
  captureBreakthroughSignal,
  captureStuckSignal,
  captureConnectionSignal,
} from "./signal-capture-middleware";

export const integrationRouter = router({
  /**
   * Learning Ladder Routes
   */
  ladder: router({
    /**
     * Get Learning Ladder with multi-layer content
     */
    getWithContent: protectedProcedure
      .input(z.object({ topicSlug: z.string() }))
      .query(async ({ input, ctx }) => {
        const userId = ctx.user?.id;
        if (!userId) throw new Error("User not authenticated");

        const ladder = await ladderIntegration.getLearningLadderWithContent(userId, input.topicSlug);
        return { stages: ladder };
      }),

    /**
     * Get specific stage with multi-layer content
     */
    getStage: protectedProcedure
      .input(z.object({ topicSlug: z.string(), stageNumber: z.number().min(1) }))
      .query(async ({ input, ctx }) => {
        const userId = ctx.user?.id;
        if (!userId) throw new Error("User not authenticated");

        const stage = await ladderIntegration.getStageWithContent(userId, input.topicSlug, input.stageNumber);
        return stage;
      }),

    /**
     * Get next stage suggestion
     */
    suggestNext: protectedProcedure
      .input(z.object({ topicSlug: z.string(), currentStageNumber: z.number().min(1) }))
      .query(async ({ input, ctx }) => {
        const userId = ctx.user?.id;
        if (!userId) throw new Error("User not authenticated");

        const suggestion = await ladderIntegration.suggestNextStage(
          userId,
          input.topicSlug,
          input.currentStageNumber
        );
        return suggestion;
      }),

    /**
     * Record stage completion
     */
    recordCompletion: protectedProcedure
      .input(
        z.object({
          topicSlug: z.string(),
          stageNumber: z.number().min(1),
          layerCompleted: z.enum(["foundation", "deepDive", "expert"]),
          accuracy: z.number().min(0).max(1).optional(),
          timeSpentSeconds: z.number().min(0).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const userId = ctx.user?.id;
        if (!userId) throw new Error("User not authenticated");

        await ladderIntegration.recordStageCompletion(
          userId,
          input.topicSlug,
          input.stageNumber,
          input.layerCompleted
        );

        // Capture signals based on stage completion
        const stageDescription = `Completed ${input.topicSlug} stage ${input.stageNumber}`;
        
        if (input.accuracy !== undefined) {
          if (input.accuracy >= 0.8) {
            await captureBreakthroughSignal(userId, stageDescription, 0, {
              topicSlug: input.topicSlug,
              stageNumber: input.stageNumber,
              layerCompleted: input.layerCompleted,
              accuracy: input.accuracy,
              timeSpentSeconds: input.timeSpentSeconds,
              timestamp: new Date(),
            });
          } else if (input.accuracy < 0.5) {
            await captureStuckSignal(userId, stageDescription, 0, {
              topicSlug: input.topicSlug,
              stageNumber: input.stageNumber,
              layerCompleted: input.layerCompleted,
              accuracy: input.accuracy,
              timeSpentSeconds: input.timeSpentSeconds,
              timestamp: new Date(),
            });
          } else {
            await captureConnectionSignal(userId, stageDescription, 0, undefined, {
              topicSlug: input.topicSlug,
              stageNumber: input.stageNumber,
              layerCompleted: input.layerCompleted,
              accuracy: input.accuracy,
              timeSpentSeconds: input.timeSpentSeconds,
              timestamp: new Date(),
            });
          }
        } else {
          await captureBreakthroughSignal(userId, stageDescription, 0, {
            topicSlug: input.topicSlug,
            stageNumber: input.stageNumber,
            layerCompleted: input.layerCompleted,
            timeSpentSeconds: input.timeSpentSeconds,
            timestamp: new Date(),
          });
        }

        return { success: true };
      }),

    /**
     * Get learning ladder progress
     */
    getProgress: protectedProcedure
      .input(z.object({ topicSlug: z.string() }))
      .query(async ({ input, ctx }) => {
        const userId = ctx.user?.id;
        if (!userId) throw new Error("User not authenticated");

        const progress = await ladderIntegration.getLadderProgress(userId, input.topicSlug);
        return progress;
      }),
  }),

  /**
   * Content Summary Routes
   */
  summary: router({
    /**
     * Enrich content summary with adaptive recommendations
     */
    enrich: protectedProcedure
      .input(z.object({ contentId: z.number() }))
      .query(async ({ input, ctx }) => {
        const userId = ctx.user?.id;
        if (!userId) throw new Error("User not authenticated");

        const summary = await summaryEnrichment.enrichContentSummary(userId, input.contentId);
        return summary;
      }),

    /**
     * Batch enrich multiple summaries
     */
    enrichBatch: protectedProcedure
      .input(z.object({ contentIds: z.array(z.number()) }))
      .query(async ({ input, ctx }) => {
        const userId = ctx.user?.id;
        if (!userId) throw new Error("User not authenticated");

        const summaries = await summaryEnrichment.enrichBatchSummaries(userId, input.contentIds);
        return { summaries };
      }),

    /**
     * Get content recommendations based on learning gaps
     */
    getRecommendations: protectedProcedure
      .input(z.object({ limit: z.number().min(1).max(50).optional().default(5) }))
      .query(async ({ input, ctx }) => {
        const userId = ctx.user?.id;
        if (!userId) throw new Error("User not authenticated");

        const recommendations = await summaryEnrichment.getContentRecommendations(userId, input.limit);
        return { recommendations };
      }),

    /**
     * Get content by layer for a concept
     */
    getByLayer: protectedProcedure
      .input(
        z.object({
          conceptId: z.number(),
          layer: z.enum(["foundation", "deepDive", "expert"]),
        })
      )
      .query(async ({ input, ctx }) => {
        const userId = ctx.user?.id;
        if (!userId) throw new Error("User not authenticated");

        const content = await summaryEnrichment.getContentByLayer(userId, input.conceptId, input.layer);
        return content;
      }),

    /**
     * Get personalized content feed
     */
    getPersonalizedFeed: protectedProcedure
      .input(z.object({ limit: z.number().min(1).max(50).optional().default(10) }))
      .query(async ({ input, ctx }) => {
        const userId = ctx.user?.id;
        if (!userId) throw new Error("User not authenticated");

        const feed = await summaryEnrichment.getPersonalizedContentFeed(userId, input.limit);
        return { feed };
      }),
  }),
});
