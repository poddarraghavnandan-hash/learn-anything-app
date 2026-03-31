import { router, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { claudeContentGenerator } from "./services/claude-content-generator";

/**
 * Claude Content Generation Router
 *
 * Provides tRPC endpoints for generating adaptive learning content using Claude API
 */

export const claudeContentRouter = router({
  /**
   * Generate personalized lesson content for a learner
   */
  generateLessonContent: publicProcedure
    .input(
      z.object({
        learnerId: z.string(),
        topic: z.string(),
        learningStyle: z.enum(["visual", "kinesthetic", "auditory", "reading"]),
        currentDifficulty: z.enum(["beginner", "intermediate", "advanced"]),
        learningPace: z.enum(["slow", "moderate", "fast"]),
        priorKnowledge: z.array(z.string()).default([]),
        commonMisconceptions: z.array(z.string()).optional(),
        engagementScore: z.number().min(0).max(100),
        motivationLevel: z.enum(["low", "medium", "high"]),
      })
    )
    .query(async ({ input }) => {
      try {
        const content = await claudeContentGenerator.generateLessonContent(
          {
            learnerId: input.learnerId,
            topic: input.topic,
            learningStyle: input.learningStyle,
            currentDifficulty: input.currentDifficulty,
            learningPace: input.learningPace,
            priorKnowledge: input.priorKnowledge,
            commonMisconceptions: input.commonMisconceptions,
            engagementScore: input.engagementScore,
            motivationLevel: input.motivationLevel,
          },
          input.topic
        );

        return {
          success: true,
          content,
        };
      } catch (error) {
        console.error("Failed to generate lesson content:", error);
        return {
          success: false,
          error: "Failed to generate content",
        };
      }
    }),

  /**
   * Generate misconception correction for a specific wrong answer
   */
  generateMisconceptionCorrection: publicProcedure
    .input(
      z.object({
        learnerId: z.string(),
        topic: z.string(),
        learningStyle: z.enum(["visual", "kinesthetic", "auditory", "reading"]),
        currentDifficulty: z.enum(["beginner", "intermediate", "advanced"]),
        learningPace: z.enum(["slow", "moderate", "fast"]),
        engagementScore: z.number().min(0).max(100),
        motivationLevel: z.enum(["low", "medium", "high"]),
        misconception: z.string(),
        correctConcept: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const correction =
          await claudeContentGenerator.generateMisconceptionCorrection(
            {
              learnerId: input.learnerId,
              topic: input.topic,
              learningStyle: input.learningStyle,
              currentDifficulty: input.currentDifficulty,
              learningPace: input.learningPace,
              priorKnowledge: [],
              engagementScore: input.engagementScore,
              motivationLevel: input.motivationLevel,
            },
            input.topic,
            input.misconception,
            input.correctConcept
          );

        return {
          success: true,
          correction,
        };
      } catch (error) {
        console.error("Failed to generate misconception correction:", error);
        return {
          success: false,
          error: "Failed to generate correction",
        };
      }
    }),

  /**
   * Generate content at different difficulty levels
   */
  generateDifficultyVariants: publicProcedure
    .input(
      z.object({
        topic: z.string(),
        content: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const variants = await claudeContentGenerator.generateDifficultyVariants(
          input.topic,
          input.content
        );

        return {
          success: true,
          variants,
        };
      } catch (error) {
        console.error("Failed to generate difficulty variants:", error);
        return {
          success: false,
          error: "Failed to generate variants",
        };
      }
    }),

  /**
   * Generate learning path recommendations
   */
  generateLearningPathRecommendations: publicProcedure
    .input(
      z.object({
        learnerId: z.string(),
        currentTopic: z.string(),
        learningStyle: z.enum(["visual", "kinesthetic", "auditory", "reading"]),
        currentDifficulty: z.enum(["beginner", "intermediate", "advanced"]),
        learningPace: z.enum(["slow", "moderate", "fast"]),
        priorKnowledge: z.array(z.string()).default([]),
        engagementScore: z.number().min(0).max(100),
        motivationLevel: z.enum(["low", "medium", "high"]),
        masteryLevel: z.number().min(0).max(100),
      })
    )
    .query(async ({ input }) => {
      try {
        const recommendations =
          await claudeContentGenerator.generateLearningPathRecommendations(
            {
              learnerId: input.learnerId,
              topic: input.currentTopic,
              learningStyle: input.learningStyle,
              currentDifficulty: input.currentDifficulty,
              learningPace: input.learningPace,
              priorKnowledge: input.priorKnowledge,
              engagementScore: input.engagementScore,
              motivationLevel: input.motivationLevel,
            },
            input.currentTopic,
            input.masteryLevel
          );

        return {
          success: true,
          recommendations,
        };
      } catch (error) {
        console.error("Failed to generate learning path recommendations:", error);
        return {
          success: false,
          error: "Failed to generate recommendations",
        };
      }
    }),

  /**
   * Generate assessment questions for a topic
   */
  generateAssessmentQuestions: publicProcedure
    .input(
      z.object({
        topic: z.string(),
        difficulty: z.enum(["beginner", "intermediate", "advanced"]),
        count: z.number().min(1).max(10).default(5),
      })
    )
    .query(async ({ input }) => {
      try {
        const questions =
          await claudeContentGenerator.generateAssessmentQuestions(
            input.topic,
            input.difficulty,
            input.count
          );

        return {
          success: true,
          questions,
        };
      } catch (error) {
        console.error("Failed to generate assessment questions:", error);
        return {
          success: false,
          error: "Failed to generate questions",
        };
      }
    }),

  /**
   * Generate content tailored to a specific learning style
   */
  generateLearningStyleContent: publicProcedure
    .input(
      z.object({
        topic: z.string(),
        learningStyle: z.enum(["visual", "kinesthetic", "auditory", "reading"]),
      })
    )
    .query(async ({ input }) => {
      try {
        const content =
          await claudeContentGenerator.generateLearningStyleContent(
            input.topic,
            input.learningStyle
          );

        return {
          success: true,
          content,
        };
      } catch (error) {
        console.error("Failed to generate learning style content:", error);
        return {
          success: false,
          error: "Failed to generate content",
        };
      }
    }),
});
