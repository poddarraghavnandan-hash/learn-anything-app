/**
 * tRPC Router for Real-Time Recommendations
 * 
 * Endpoints for retrieving personalized learning recommendations based on:
 * - Learner profile and progress
 * - Signal patterns and learning behavior
 * - Adaptive difficulty adjustments
 * - Learning style preferences
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  generatePersonalizedRecommendations,
  recommendNextConcept,
  recommendReviewTopics,
  recommendContentType,
  prioritizeRecommendations,
} from "./real-time-recommendations";

export const recommendationsRouter = router({
  /**
   * Get personalized recommendations for a learner
   * 
   * Returns up to `limit` recommendations sorted by priority and engagement score.
   * Includes knowledge gaps, spaced repetition, next concepts, challenges, etc.
   */
  getPersonalized: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
        includeTypes: z
          .array(
            z.enum([
              "knowledge_gap",
              "spaced_repetition",
              "next_concept",
              "challenge",
              "reinforcement",
              "learning_style_match",
            ])
          )
          .optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error("User not authenticated");

      try {
        const recommendations = await generatePersonalizedRecommendations(
          userId,
          input.limit
        );

        // Filter by type if specified
        if (input.includeTypes && input.includeTypes.length > 0) {
          return recommendations.filter((r) =>
            input.includeTypes!.includes(r.type)
          );
        }

        return recommendations;
      } catch (error) {
        console.error("[Recommendations] Failed to get personalized recommendations:", error);
        return [];
      }
    }),

  /**
   * Get next concept recommendation for a specific concept
   * 
   * Suggests the next concept to learn based on mastery level and prerequisites.
   */
  getNextConcept: protectedProcedure
    .input(
      z.object({
        conceptId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error("User not authenticated");

      try {
        const nextConcept = await recommendNextConcept(
          userId,
          input.conceptId
        );
        return nextConcept ? [nextConcept] : [];
      } catch (error) {
        console.error("[Recommendations] Failed to get next concept:", error);
        return [];
      }
    }),

  /**
   * Get spaced repetition review topics
   * 
   * Recommends concepts to review based on spaced repetition intervals.
   * Intervals: 1 day, 3 days, 7 days, 14 days, 30 days
   */
  getReviewTopics: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(20).default(5),
      })
    )
    .query(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error("User not authenticated");

      try {
        const reviewTopics = await recommendReviewTopics(userId, input.limit);
        return reviewTopics;
      } catch (error) {
        console.error("[Recommendations] Failed to get review topics:", error);
        return [];
      }
    }),

  /**
   * Get recommended content type for a concept
   * 
   * Suggests the best content type (article, video, interactive, project)
   * based on learner's learning style and past engagement.
   */
  getContentType: protectedProcedure
    .input(
      z.object({
        conceptId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error("User not authenticated");

      try {
        const contentTypes = await recommendContentType(userId, input.conceptId);
        return {
          conceptId: input.conceptId,
          recommendedTypes: contentTypes,
          reasoning: "Based on your learning style",
        };
      } catch (error) {
        console.error("[Recommendations] Failed to get content type:", error);
        return {
          conceptId: input.conceptId,
          recommendedType: "video",
          alternatives: ["article", "interactive", "project"],
          reasoning: "Default recommendation",
        };
      }
    }),

  /**
   * Get prioritized recommendations
   * 
   * Returns recommendations sorted by priority and engagement score.
   * Useful for displaying in a ranked list or feed.
   */
  getPrioritized: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error("User not authenticated");

      try {
        const recommendations = await generatePersonalizedRecommendations(
          userId,
          input.limit * 2 // Get more to sort
        );

        const prioritized = prioritizeRecommendations(recommendations);

        return prioritized.slice(0, input.limit);
      } catch (error) {
        console.error("[Recommendations] Failed to get prioritized recommendations:", error);
        return [];
      }
    }),

  /**
   * Get recommendations for a specific learning goal
   * 
   * Returns recommendations that help achieve a specific learning goal.
   */
  getForGoal: protectedProcedure
    .input(
      z.object({
        goalId: z.number(),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error("User not authenticated");

      try {
        // Get all recommendations and filter by goal
        const recommendations = await generatePersonalizedRecommendations(
          userId,
          input.limit * 2
        );

        // Filter recommendations related to this goal
        // This would require goal tracking in the database
        // For now, return top recommendations
        return recommendations.slice(0, input.limit);
      } catch (error) {
        console.error("[Recommendations] Failed to get recommendations for goal:", error);
        return [];
      }
    }),

  /**
   * Get challenge recommendations for high performers
   * 
   * Returns advanced challenges for learners who are performing well.
   */
  getChallenges: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(20).default(5),
        difficulty: z.enum(["advanced", "expert"]).default("advanced"),
      })
    )
    .query(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error("User not authenticated");

      try {
        const recommendations = await generatePersonalizedRecommendations(
          userId,
          input.limit * 2
        );

        const challenges = recommendations
          .filter((r) => r.type === "challenge" && r.difficulty === input.difficulty)
          .slice(0, input.limit);

        return challenges;
      } catch (error) {
        console.error("[Recommendations] Failed to get challenges:", error);
        return [];
      }
    }),

  /**
   * Get reinforcement recommendations for struggling concepts
   * 
   * Returns foundational content to help with concepts learner is struggling with.
   */
  getReinforcement: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(20).default(5),
      })
    )
    .query(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error("User not authenticated");

      try {
        const recommendations = await generatePersonalizedRecommendations(
          userId,
          input.limit * 2
        );

        const reinforcement = recommendations
          .filter((r) => r.type === "reinforcement")
          .slice(0, input.limit);

        return reinforcement;
      } catch (error) {
        console.error("[Recommendations] Failed to get reinforcement:", error);
        return [];
      }
    }),

  /**
   * Get learning style matched recommendations
   * 
   * Returns recommendations tailored to learner's preferred learning style.
   */
  getByLearningStyle: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(20).default(5),
      })
    )
    .query(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error("User not authenticated");

      try {
        const recommendations = await generatePersonalizedRecommendations(
          userId,
          input.limit * 2
        );

        const styleMatched = recommendations
          .filter((r) => r.type === "learning_style_match")
          .slice(0, input.limit);

        return styleMatched;
      } catch (error) {
        console.error("[Recommendations] Failed to get learning style recommendations:", error);
        return [];
      }
    }),

  /**
   * Dismiss a recommendation
   * 
   * Marks a recommendation as dismissed so it won't be shown again.
   * Useful for user feedback and improving recommendations.
   */
  dismiss: protectedProcedure
    .input(
      z.object({
        recommendationId: z.string(),
        reason: z.enum(["not_interested", "already_know", "too_hard", "too_easy", "other"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error("User not authenticated");

      try {
        // In a real implementation, this would save to database
        // For now, just return success
        console.log(
          `[Recommendations] User ${userId} dismissed recommendation ${input.recommendationId}`,
          input.reason
        );
        return { success: true };
      } catch (error) {
        console.error("[Recommendations] Failed to dismiss recommendation:", error);
        return { success: false, error: String(error) };
      }
    }),

  /**
   * Accept a recommendation
   * 
   * Marks a recommendation as accepted and starts the learning content.
   * Useful for tracking recommendation effectiveness.
   */
  accept: protectedProcedure
    .input(
      z.object({
        recommendationId: z.string(),
        conceptId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error("User not authenticated");

      try {
        // In a real implementation, this would save to database
        // and trigger content loading
        console.log(
          `[Recommendations] User ${userId} accepted recommendation ${input.recommendationId} for concept ${input.conceptId}`
        );
        return { success: true, conceptId: input.conceptId };
      } catch (error) {
        console.error("[Recommendations] Failed to accept recommendation:", error);
        return { success: false, error: String(error) };
      }
    }),
});

export type RecommendationsRouter = typeof recommendationsRouter;
