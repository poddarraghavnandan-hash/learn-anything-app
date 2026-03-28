/**
 * tRPC Router for Adaptive Chat
 * 
 * Endpoints for knowledge-aware chat interactions
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as adaptiveChat from "./adaptive-chat";
import {
  captureQuestionSignal,
  captureTeachingSignal,
  captureBreakthroughSignal,
  captureStuckSignal,
  captureFeedbackSignal,
} from "./signal-capture-middleware";

export const chatRouter = router({
  /**
   * Generate adaptive response to user message
   */
  generateResponse: protectedProcedure
    .input(
      z.object({
        message: z.string(),
        conceptName: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error("User not authenticated");

      const response = await adaptiveChat.generateAdaptiveResponse(
        userId,
        input.message,
        input.conceptName
      );

      if (!response) {
        throw new Error("Failed to generate response");
      }

      // Record the interaction
      await adaptiveChat.recordChatInteraction(
        userId,
        0, // TODO: Get actual conceptId
        input.message,
        response.message,
        response.layer
      );

      // Capture signals from the interaction
      // Capture question signal from user message
      await captureQuestionSignal(userId, input.message, 0, {
        layer: response.layer,
        timestamp: new Date(),
      });

      // Capture teaching signal from AI response
      if (response.message && response.message.length > 50) {
        await captureTeachingSignal(userId, response.message, 0, {
          layer: response.layer,
          timestamp: new Date(),
        });
      }

      return response;
    }),

  /**
   * Get chat suggestions based on user's learning gaps
   */
  getSuggestions: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.id;
    if (!userId) throw new Error("User not authenticated");

    const suggestions = await adaptiveChat.getChatSuggestions(userId);
    return { suggestions };
  }),

  /**
   * Record a chat interaction (for analytics)
   */
  recordInteraction: protectedProcedure
    .input(
      z.object({
        conceptId: z.number(),
        userMessage: z.string(),
        assistantResponse: z.string(),
        layer: z.enum(["foundation", "deepDive", "expert"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new Error("User not authenticated");

      await adaptiveChat.recordChatInteraction(
        userId,
        input.conceptId,
        input.userMessage,
        input.assistantResponse,
        input.layer
      );

      // Capture signals from the interaction
      // Capture question signal from user message
      await captureQuestionSignal(userId, input.userMessage, input.conceptId, {
        layer: input.layer,
        timestamp: new Date(),
      });

      // Capture teaching signal from assistant response
      if (input.assistantResponse && input.assistantResponse.length > 50) {
        await captureTeachingSignal(userId, input.assistantResponse, input.conceptId, {
          layer: input.layer,
          timestamp: new Date(),
        });
      }

      return { success: true };
    }),
});
