import { router, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { metaLearningEngine } from "./services/meta-learning-engine";
import { learningApproaches } from "./services/learning-approaches";

/**
 * Meta-Learning Router
 *
 * Provides tRPC endpoints for the revolutionary meta-learning system
 * that discovers each user's optimal learning approach through continuous
 * experimentation with 9 innovative pedagogies
 */

export const metaLearningRouter = router({
  /**
   * Initialize user learning profile
   */
  initializeProfile: publicProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const profile = await metaLearningEngine.initializeUserProfile(input.userId);
        return {
          success: true,
          profile,
        };
      } catch (error) {
        console.error("Failed to initialize profile:", error);
        return {
          success: false,
          error: "Failed to initialize profile",
        };
      }
    }),

  /**
   * Get user's current learning profile
   */
  getProfile: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      try {
        const profile = await metaLearningEngine.getUserLearningProfile(input.userId);
        return {
          success: true,
          profile,
        };
      } catch (error) {
        console.error("Failed to get profile:", error);
        return {
          success: false,
          error: "Failed to get profile",
        };
      }
    }),

  /**
   * Select next learning approach for a user
   */
  selectNextApproach: publicProcedure
    .input(z.object({ userId: z.string(), topicId: z.number() }))
    .query(async ({ input }) => {
      try {
        const approachId = await metaLearningEngine.selectNextApproach(
          input.userId,
          input.topicId
        );
        return {
          success: true,
          approachId,
        };
      } catch (error) {
        console.error("Failed to select approach:", error);
        return {
          success: false,
          error: "Failed to select approach",
        };
      }
    }),

  /**
   * Record learning experiment
   */
  recordExperiment: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        topicId: z.number(),
        topicName: z.string(),
        approachId: z.number(),
        engagementScore: z.number().min(0).max(100),
        comprehensionScore: z.number().min(0).max(100),
        retentionScore: z.number().min(0).max(100),
        applicationScore: z.number().min(0).max(100),
        confidenceScore: z.number().min(0).max(100),
        timeSpentSeconds: z.number(),
        completionPercentage: z.number().min(0).max(100),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await metaLearningEngine.recordExperiment(
          input.userId,
          input.topicId,
          input.topicName,
          input.approachId,
          {
            engagementScore: input.engagementScore,
            comprehensionScore: input.comprehensionScore,
            retentionScore: input.retentionScore,
            applicationScore: input.applicationScore,
            confidenceScore: input.confidenceScore,
            timeSpentSeconds: input.timeSpentSeconds,
            completionPercentage: input.completionPercentage,
          }
        );
        return {
          success: true,
        };
      } catch (error) {
        console.error("Failed to record experiment:", error);
        return {
          success: false,
          error: "Failed to record experiment",
        };
      }
    }),

  /**
   * Generate content for all 9 learning approaches
   */
  generateAllApproaches: publicProcedure
    .input(
      z.object({
        topic: z.string(),
        learnerLevel: z.enum(["beginner", "intermediate", "advanced"]),
      })
    )
    .query(async ({ input }) => {
      try {
        const approaches = await learningApproaches.generateAllApproaches(
          input.topic,
          input.learnerLevel
        );
        return {
          success: true,
          approaches,
        };
      } catch (error) {
        console.error("Failed to generate approaches:", error);
        return {
          success: false,
          error: "Failed to generate approaches",
        };
      }
    }),

  /**
   * Generate specific approach content
   */
  generateApproach: publicProcedure
    .input(
      z.object({
        approachId: z.number().min(1).max(9),
        topic: z.string(),
        learnerLevel: z.enum(["beginner", "intermediate", "advanced"]),
      })
    )
    .query(async ({ input }) => {
      try {
        let content;
        switch (input.approachId) {
          case 1:
            content = await learningApproaches.generateSocraticContent(
              input.topic,
              input.learnerLevel
            );
            break;
          case 2:
            content = await learningApproaches.generateProblemBasedContent(
              input.topic,
              input.learnerLevel
            );
            break;
          case 3:
            content = await learningApproaches.generateExperientialContent(
              input.topic,
              input.learnerLevel
            );
            break;
          case 4:
            content = await learningApproaches.generatePeerLearningContent(
              input.topic,
              input.learnerLevel
            );
            break;
          case 5:
            content = await learningApproaches.generateTeachingContent(
              input.topic,
              input.learnerLevel
            );
            break;
          case 6:
            content = await learningApproaches.generateChallengeContent(
              input.topic,
              input.learnerLevel
            );
            break;
          case 7:
            content = await learningApproaches.generateMicrolearningContent(
              input.topic,
              input.learnerLevel
            );
            break;
          case 8:
            content = await learningApproaches.generateDiscoveryContent(
              input.topic,
              input.learnerLevel
            );
            break;
          case 9:
            content = await learningApproaches.generateSynthesisContent(
              input.topic,
              input.learnerLevel
            );
            break;
          default:
            throw new Error("Invalid approach ID");
        }

        return {
          success: true,
          content,
        };
      } catch (error) {
        console.error("Failed to generate approach:", error);
        return {
          success: false,
          error: "Failed to generate approach",
        };
      }
    }),

  /**
   * Get approach effectiveness scores
   */
  getApproachEffectiveness: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      try {
        const profile = await metaLearningEngine.getUserLearningProfile(input.userId);
        return {
          success: true,
          approaches: profile.approaches,
        };
      } catch (error) {
        console.error("Failed to get effectiveness:", error);
        return {
          success: false,
          error: "Failed to get effectiveness",
        };
      }
    }),
});
