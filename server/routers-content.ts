/**
 * tRPC Router for Content Generation
 * 
 * Endpoints for generating and retrieving multi-layer content
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as contentGen from "./content-generator";
import * as db from "./db";

export const contentRouter = router({
  /**
   * Generate all three layers for a concept
   */
  generateAllLayers: publicProcedure
    .input(
      z.object({
        conceptName: z.string(),
        conceptSlug: z.string(),
        conceptDescription: z.string().optional(),
        topicSlug: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await contentGen.generateAllLayers(
        input.conceptName,
        input.conceptSlug,
        input.conceptDescription,
        input.topicSlug
      );

      if (!result) {
        throw new Error("Failed to generate content");
      }

      return result;
    }),

  /**
   * Generate content for a specific layer
   */
  generateLayer: publicProcedure
    .input(
      z.object({
        conceptId: z.number(),
        layer: z.enum(["foundation", "deepDive", "expert"]),
      })
    )
    .mutation(async ({ input }) => {
      const content = await contentGen.generateLayerContent(input.conceptId, input.layer);

      if (!content) {
        throw new Error("Failed to generate layer content");
      }

      return content;
    }),

  /**
   * Get content for a concept (all layers)
   */
  getContent: publicProcedure
    .input(
      z.object({
        conceptId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const concept = await db.getConceptById(input.conceptId);
      if (!concept) {
        throw new Error("Concept not found");
      }

      const [foundation, deepDive, expert] = await Promise.all([
        db.getConceptContent(input.conceptId, "foundation"),
        db.getConceptContent(input.conceptId, "deepDive"),
        db.getConceptContent(input.conceptId, "expert"),
      ]);

      return {
        conceptId: input.conceptId,
        conceptName: concept.name,
        foundation: foundation ? JSON.parse(foundation.content) : null,
        deepDive: deepDive ? JSON.parse(deepDive.content) : null,
        expert: expert ? JSON.parse(expert.content) : null,
      };
    }),

  /**
   * Get content for a specific layer
   */
  getLayer: publicProcedure
    .input(
      z.object({
        conceptId: z.number(),
        layer: z.enum(["foundation", "deepDive", "expert"]),
      })
    )
    .query(async ({ input }) => {
      const content = await db.getConceptContent(input.conceptId, input.layer);

      if (!content) {
        return null;
      }

      return JSON.parse(content.content);
    }),

  /**
   * Batch generate content for multiple concepts
   */
  generateBatch: publicProcedure
    .input(
      z.object({
        concepts: z.array(
          z.object({
            name: z.string(),
            slug: z.string(),
            description: z.string().optional(),
            topicSlug: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const results = await contentGen.generateBatchContent(input.concepts);
      return {
        count: results.length,
        results,
      };
    }),

  /**
   * Regenerate content for a concept (admin only)
   */
  regenerate: protectedProcedure
    .input(
      z.object({
        conceptId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check if user is admin
      if (ctx.user?.role !== "admin") {
        throw new Error("Only admins can regenerate content");
      }

      const result = await contentGen.regenerateContent(input.conceptId);

      if (!result) {
        throw new Error("Failed to regenerate content");
      }

      return result;
    }),

  /**
   * Get content statistics (admin only)
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== "admin") {
      throw new Error("Only admins can view statistics");
    }

    const concepts = await db.getAllConcepts();
    const contentItems = await db.getConceptContentByIds(concepts.map((c) => c.id));

    const stats = {
      totalConcepts: concepts.length,
      totalContentItems: contentItems.length,
      layerBreakdown: {
        foundation: contentItems.filter((c) => c.layer === "foundation").length,
        deepDive: contentItems.filter((c) => c.layer === "deepDive").length,
        expert: contentItems.filter((c) => c.layer === "expert").length,
      },
      averageVersion: contentItems.length > 0 ? contentItems.reduce((sum, c) => sum + c.version, 0) / contentItems.length : 0,
    };

    return stats;
  }),
});
