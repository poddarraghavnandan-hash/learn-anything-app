import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { personalLearningIntelligence } from "./services/personal-learning-intelligence";

/**
 * Personal Learning Intelligence Router
 *
 * tRPC endpoints for accessing the unified Personal Learning Intelligence system
 */

export const personalLearningIntelligenceRouter = router({
  /**
   * Generate comprehensive intelligence report for a learner
   */
  generateIntelligenceReport: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        topicId: z.number(),
        topicDifficulty: z.number().min(1).max(5),
        currentApproachId: z.number().optional(),
        userAge: z.number().optional(),
        knowledgeScore: z.number().min(0).max(100).optional(),
        sessionMetrics: z
          .object({
            assessmentScores: z.array(z.number()),
            timeSpentSeconds: z.number(),
            attentionDropoffs: z.number(),
            hintUsageCount: z.number(),
            clarificationQuestionsAsked: z.number(),
            mistakesCount: z.number(),
            scrollDepth: z.number(),
            clickInteractionCount: z.number(),
            pauseCount: z.number(),
            rewindCount: z.number(),
          })
          .optional(),
      })
    )
    .query(async ({ input }) => {
      return await personalLearningIntelligence.generateIntelligenceReport(
        input.userId,
        input.topicId,
        input.topicDifficulty,
        input.currentApproachId,
        input.userAge,
        input.knowledgeScore,
        input.sessionMetrics
      );
    }),

  /**
   * Get real-time session optimization recommendations
   */
  optimizeSessionInRealTime: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        topicId: z.number(),
        currentApproachId: z.number(),
        sessionMetrics: z.object({
          elapsedTimeSeconds: z.number(),
          engagementScore: z.number(),
          comprehensionScore: z.number(),
          assessmentScores: z.array(z.number()),
          timePerQuestion: z.number(),
          hintUsageRate: z.number(),
          mistakeRate: z.number(),
          attentionDropoffs: z.number(),
          scrollDepth: z.number(),
          clickInteractionCount: z.number(),
          pauseCount: z.number(),
          rewindCount: z.number(),
          mistakesCount: z.number(),
          clarificationQuestionsAsked: z.number(),
          hintUsageCount: z.number(),
        }),
      })
    )
    .query(async ({ input }) => {
      return await personalLearningIntelligence.optimizeSessionInRealTime(
        input.userId,
        input.topicId,
        input.currentApproachId,
        input.sessionMetrics
      );
    }),

  /**
   * Predict struggle risk for a topic/approach combination
   */
  predictStruggleRisk: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        topicDifficulty: z.number().min(1).max(5),
        approachId: z.number().min(1).max(9),
        userAge: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      return await personalLearningIntelligence.predictStruggleRisk(
        input.userId,
        input.topicDifficulty,
        input.approachId,
        input.userAge
      );
    }),
});
