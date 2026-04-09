/**
 * Gemini Content Generation Router
 * API endpoints for generating learning content using Gemini
 */

import { router, publicProcedure } from "./trpc";
import { z } from "zod";
import { GeminiContentGenerator, createGeminiGenerator } from "./services/gemini-content-generator";

// Input validation schemas
const generateContentSchema = z.object({
  topic: z.string().min(3).max(200).describe("Topic to generate content about"),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("intermediate"),
  customPrompt: z.string().max(500).optional().describe("Additional custom requirements"),
});

const generateVariationsSchema = z.object({
  topic: z.string().min(3).max(200),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("intermediate"),
  count: z.number().min(1).max(5).default(3),
});

export const geminiRouter = router({
  /**
   * Generate learning content on a topic
   * POST /api/trpc/gemini.generateContent
   */
  generateContent: publicProcedure
    .input(generateContentSchema)
    .mutation(async ({ input }) => {
      try {
        const generator = createGeminiGenerator();

        const content = await generator.generateContent(
          input.topic,
          input.difficulty,
          input.customPrompt
        );

        return {
          success: true,
          data: content,
        };
      } catch (error) {
        console.error("Content generation error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to generate content",
        };
      }
    }),

  /**
   * Generate multiple content variations for A/B testing
   * POST /api/trpc/gemini.generateVariations
   */
  generateVariations: publicProcedure
    .input(generateVariationsSchema)
    .mutation(async ({ input }) => {
      try {
        const generator = createGeminiGenerator();

        const variations = await generator.generateContentVariations(
          input.topic,
          input.difficulty,
          input.count
        );

        return {
          success: true,
          data: variations,
        };
      } catch (error) {
        console.error("Variations generation error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to generate variations",
        };
      }
    }),

  /**
   * Get topic suggestions based on user interests
   * GET /api/trpc/gemini.getSuggestions
   */
  getSuggestions: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
        count: z.number().min(1).max(10).default(5),
      })
    )
    .query(async ({ input }) => {
      try {
        const generator = createGeminiGenerator();

        // Generate topic suggestions
        const prompt = input.category
          ? `Suggest ${input.count} interesting and engaging learning topics in the category of "${input.category}". 
             Make them specific, actionable, and suitable for learners of all levels.
             Format as a JSON array of strings.`
          : `Suggest ${input.count} trending and interesting learning topics across various fields.
             Make them specific, actionable, and suitable for learners of all levels.
             Format as a JSON array of strings.`;

        const response = await (generator as any).model.generateContent(prompt);
        const text = response.response.text();

        // Extract JSON array from response
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        const suggestions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

        return {
          success: true,
          data: suggestions.slice(0, input.count),
        };
      } catch (error) {
        console.error("Suggestions error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to get suggestions",
          data: [],
        };
      }
    }),

  /**
   * Validate topic before generation
   * POST /api/trpc/gemini.validateTopic
   */
  validateTopic: publicProcedure
    .input(
      z.object({
        topic: z.string().min(3).max(200),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const generator = createGeminiGenerator();

        // Quick validation check
        const validationPrompt = `Is "${input.topic}" a valid and specific learning topic? 
        Respond with only "valid" or "invalid" and a brief reason.`;

        const response = await (generator as any).model.generateContent(validationPrompt);
        const text = response.response.text().toLowerCase();

        const isValid = text.includes("valid") && !text.includes("invalid");

        return {
          success: true,
          isValid,
          message: text,
        };
      } catch (error) {
        console.error("Validation error:", error);
        return {
          success: false,
          isValid: false,
          error: error instanceof Error ? error.message : "Validation failed",
        };
      }
    }),

  /**
   * Get content metadata without full content
   * POST /api/trpc/gemini.getMetadata
   */
  getMetadata: publicProcedure
    .input(
      z.object({
        topic: z.string().min(3).max(200),
        difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("intermediate"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const generator = createGeminiGenerator();

        // Generate just metadata
        const metadataPrompt = `For the topic "${input.topic}" at ${input.difficulty} level:
        1. Provide 5 key learning objectives
        2. List 3-5 prerequisites
        3. Estimate reading time in minutes
        4. Suggest 5 related topics
        
        Format as JSON with keys: objectives, prerequisites, estimatedTime, relatedTopics`;

        const response = await (generator as any).model.generateContent(metadataPrompt);
        const text = response.response.text();

        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const metadata = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

        return {
          success: true,
          data: {
            topic: input.topic,
            difficulty: input.difficulty,
            ...metadata,
          },
        };
      } catch (error) {
        console.error("Metadata error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to get metadata",
        };
      }
    }),
});
