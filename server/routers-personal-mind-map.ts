import { router, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { mindMapGenerator } from "./services/mind-map-generator";
import { nextApproachPredictor } from "./services/next-approach-predictor";
import { learningBehaviorAnalyzer } from "./services/learning-behavior-analyzer";

/**
 * Personal Learning Mind Map Router
 *
 * tRPC endpoints for generating and managing personalized learning mind maps
 */

export const personalMindMapRouter = router({
  /**
   * Generate personalized learning mind map for a user and topic
   */
  generateMindMap: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        topicId: z.number(),
        topicName: z.string(),
        knowledgeTestScore: z.number().optional(),
        userAge: z.number().optional(),
      })
    )
    .mutation(async ({ input }: any) => {
      try {
        const mindMap = await mindMapGenerator.generatePersonalizedMindMap(
          input.userId,
          input.topicId,
          input.topicName,
          input.knowledgeTestScore,
          input.userAge
        );

        return {
          success: true,
          data: mindMap,
        };
      } catch (error) {
        console.error("Error generating mind map:", error);
        return {
          success: false,
          error: "Failed to generate personalized mind map",
        };
      }
    }),

  /**
   * Get next recommended learning approach
   */
  getNextApproach: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        currentTopicId: z.number(),
        recentEngagementScore: z.number(),
        recentComprehensionScore: z.number(),
        sessionDurationSeconds: z.number(),
        consecutiveSessionsWithoutBreak: z.number(),
      })
    )
    .query(async ({ input }: any) => {
      try {
        const prediction = await nextApproachPredictor.predictNextApproach(
          input.userId,
          input.currentTopicId,
          input.recentEngagementScore,
          input.recentComprehensionScore,
          input.sessionDurationSeconds,
          input.consecutiveSessionsWithoutBreak
        );

        return {
          success: true,
          data: prediction,
        };
      } catch (error) {
        console.error("Error predicting next approach:", error);
        return {
          success: false,
          error: "Failed to predict next approach",
        };
      }
    }),

  /**
   * Record a learning behavior signal
   */
  recordBehaviorSignal: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        topicId: z.number(),
        approachId: z.number(),
        timeSpentSeconds: z.number(),
        attentionDropoffs: z.number(),
        revisitCount: z.number(),
        completionPercentage: z.number(),
        assessmentScore: z.number(),
        engagementType: z.string(),
        engagementScore: z.number(),
        selfReportedConfidence: z.number(),
      })
    )
    .mutation(async ({ input }: any) => {
      try {
        await learningBehaviorAnalyzer.recordBehaviorSignal({
          userId: input.userId,
          topicId: input.topicId,
          approachId: input.approachId,
          timeSpentSeconds: input.timeSpentSeconds,
          attentionDropoffs: input.attentionDropoffs,
          revisitCount: input.revisitCount,
          completionPercentage: input.completionPercentage,
          assessmentScore: input.assessmentScore,
          engagementType: input.engagementType,
          engagementScore: input.engagementScore,
          selfReportedConfidence: input.selfReportedConfidence,
        });

        return {
          success: true,
          message: "Behavior signal recorded",
        };
      } catch (error) {
        console.error("Error recording behavior signal:", error);
        return {
          success: false,
          error: "Failed to record behavior signal",
        };
      }
    }),

  /**
   * Get user's learning style profile
   */
  getLearningProfile: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }: any) => {
      try {
        const profile = await learningBehaviorAnalyzer.getLearningStyleProfile(input.userId);

        return {
          success: true,
          data: profile,
        };
      } catch (error) {
        console.error("Error getting learning profile:", error);
        return {
          success: false,
          error: "Failed to get learning profile",
        };
      }
    }),

  /**
   * Get user's behavior patterns
   */
  getBehaviorPatterns: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }: any) => {
      try {
        const patterns = await learningBehaviorAnalyzer.getBehaviorPatterns(input.userId);

        return {
          success: true,
          data: patterns,
        };
      } catch (error) {
        console.error("Error getting behavior patterns:", error);
        return {
          success: false,
          error: "Failed to get behavior patterns",
        };
      }
    }),

  /**
   * Get approach effectiveness for user
   */
  getApproachEffectiveness: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }: any) => {
      try {
        const effectiveness = await learningBehaviorAnalyzer.getApproachEffectiveness(input.userId);

        return {
          success: true,
          data: effectiveness,
        };
      } catch (error) {
        console.error("Error getting approach effectiveness:", error);
        return {
          success: false,
          error: "Failed to get approach effectiveness",
        };
      }
    }),

  /**
   * Get user's learning context
   */
  getLearningContext: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }: any) => {
      try {
        const context = await learningBehaviorAnalyzer.getLearningContext(input.userId);

        return {
          success: true,
          data: context,
        };
      } catch (error) {
        console.error("Error getting learning context:", error);
        return {
          success: false,
          error: "Failed to get learning context",
        };
      }
    }),
});
