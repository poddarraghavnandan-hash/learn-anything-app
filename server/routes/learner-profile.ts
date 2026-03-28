import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  getUserLearnerProfile,
  getLearnerProfileSummary,
  updateLearnerModel,
} from "../learner-profile";

/**
 * tRPC Router for Learner Profile endpoints
 * Provides access to learner profile data and signal-driven insights
 */

export const learnerProfileRouter = router({
  /**
   * Get comprehensive learner profile
   * Includes learning style, confidence trajectory, knowledge gaps, recommendations
   */
  getProfile: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const profile = await getUserLearnerProfile(input.userId);
      if (!profile) {
        return {
          error: "Failed to load learner profile",
          profile: null,
        };
      }

      return {
        success: true,
        profile,
      };
    }),

  /**
   * Get quick learner profile summary
   * Lightweight version for quick display
   */
  getSummary: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const summary = await getLearnerProfileSummary(input.userId);
      return summary;
    }),

  /**
   * Update learner model based on latest signals
   */
  updateProfile: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        const profile = await updateLearnerModel(input.userId);
        return {
          success: true,
          profile,
        };
      } catch (error) {
        return {
          success: false,
          error: String(error),
        };
      }
    }),

  /**
   * Get learning style
   */
  getLearningStyle: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const profile = await getUserLearnerProfile(input.userId);
      if (!profile) return null;

      return {
        learningStyle: profile.learningStyle,
        description: getLearningStyleDescription(profile.learningStyle),
      };
    }),

  /**
   * Get confidence trajectory
   */
  getConfidenceTrajectory: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const profile = await getUserLearnerProfile(input.userId);
      if (!profile) return null;

      return {
        trajectory: profile.confidenceTrajectory,
        averageConfidence: profile.averageConfidence,
        breakthroughsThisWeek: profile.breakthroughsThisWeek,
        stuckPointsThisWeek: profile.stuckPointsThisWeek,
      };
    }),

  /**
   * Get knowledge gaps
   */
  getKnowledgeGaps: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const profile = await getUserLearnerProfile(input.userId);
      if (!profile) return [];

      return profile.knowledgeGaps;
    }),

  /**
   * Get recommended next steps
   */
  getRecommendedNextSteps: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const profile = await getUserLearnerProfile(input.userId);
      if (!profile) return [];

      return profile.recommendedNextSteps;
    }),

  /**
   * Get top concepts by confidence
   */
  getTopConcepts: protectedProcedure
    .input(z.object({ userId: z.number(), limit: z.number().default(5) }))
    .query(async ({ input }) => {
      const profile = await getUserLearnerProfile(input.userId);
      if (!profile) return [];

      return profile.topConceptsByConfidence.slice(0, input.limit);
    }),

  /**
   * Get signal distribution
   */
  getSignalDistribution: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const profile = await getUserLearnerProfile(input.userId);
      if (!profile) return null;

      return {
        distribution: profile.signalDistribution,
        totalSignalsThisWeek: profile.totalSignalsThisWeek,
        learningVelocity: profile.learningVelocity,
      };
    }),
});

/**
 * Get human-readable description of learning style
 */
function getLearningStyleDescription(style: string): string {
  const descriptions: Record<string, string> = {
    analytical: "You learn by asking questions and understanding the 'why' behind concepts",
    practical: "You learn by applying concepts to real-world problems and seeing results",
    relational: "You learn by explaining concepts to others and making connections",
    progressive: "You learn by building connections between related concepts",
    balanced: "You have a balanced learning style across multiple approaches",
  };

  return descriptions[style] || "Your learning style is unique and evolving";
}
