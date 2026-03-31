import { router, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { geminiContentAnalyzer } from "./services/gemini-content-analyzer";

/**
 * Gemini Content Analysis Router
 *
 * Provides tRPC endpoints for analyzing multimodal content using Gemini API
 */

export const geminiContentRouter = router({
  /**
   * Analyze text content and extract learning information
   */
  analyzeTextContent: publicProcedure
    .input(
      z.object({
        content: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const analysis = await geminiContentAnalyzer.analyzeTextContent(
          input.content
        );

        return {
          success: true,
          analysis,
        };
      } catch (error) {
        console.error("Failed to analyze text content:", error);
        return {
          success: false,
          error: "Failed to analyze content",
        };
      }
    }),

  /**
   * Generate learning objectives from content
   */
  generateLearningObjectives: publicProcedure
    .input(
      z.object({
        topic: z.string(),
        content: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const objectives =
          await geminiContentAnalyzer.generateLearningObjectives(
            input.topic,
            input.content
          );

        return {
          success: true,
          objectives,
        };
      } catch (error) {
        console.error("Failed to generate learning objectives:", error);
        return {
          success: false,
          error: "Failed to generate objectives",
        };
      }
    }),

  /**
   * Generate accessibility content (alt text, captions, transcripts)
   */
  generateAccessibilityContent: publicProcedure
    .input(
      z.object({
        contentType: z.enum(["image", "video", "diagram"]),
        contentUrl: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const accessibility =
          await geminiContentAnalyzer.generateAccessibilityContent(
            input.contentType,
            input.contentUrl
          );

        return {
          success: true,
          accessibility,
        };
      } catch (error) {
        console.error("Failed to generate accessibility content:", error);
        return {
          success: false,
          error: "Failed to generate accessibility content",
        };
      }
    }),

  /**
   * Assess content quality and relevance
   */
  assessContentQuality: publicProcedure
    .input(
      z.object({
        topic: z.string(),
        content: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const assessment = await geminiContentAnalyzer.assessContentQuality(
          input.topic,
          input.content
        );

        return {
          success: true,
          assessment,
        };
      } catch (error) {
        console.error("Failed to assess content quality:", error);
        return {
          success: false,
          error: "Failed to assess quality",
        };
      }
    }),
});
