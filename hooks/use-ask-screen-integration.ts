/**
 * Hook for Ask Screen Integration
 * Combines adaptive chat and personalized content recommendations
 */

import { useCallback } from "react";
import { useAdaptiveChat } from "./use-adaptive-chat-api";
import { usePersonalizedContent } from "./use-personalized-content-api";

interface UseAskScreenIntegrationOptions {
  enabled?: boolean;
}

export function useAskScreenIntegration({ enabled = true }: UseAskScreenIntegrationOptions = {}) {
  const adaptiveChat = useAdaptiveChat({ enabled });
  const personalizedContent = usePersonalizedContent({ enabled, limit: 3 });

  // Handle user message submission
  const handleSendMessage = useCallback(
    async (message: string, conceptName: string) => {
      // Generate adaptive response
      adaptiveChat.generateResponse({
        message,
        conceptName,
      });
    },
    [adaptiveChat]
  );

  // Get suggestions for current topic
  const getSuggestionsForTopic = useCallback(
    async (conceptName: string) => {
      // Refresh personalized recommendations
      personalizedContent.refetch?.();
    },
    [personalizedContent]
  );

  // Record chat interaction for analytics
  const recordChatInteraction = useCallback(
    (conceptId: number, userMessage: string, assistantResponse: string, layer: "foundation" | "deepDive" | "expert") => {
      adaptiveChat.recordInteraction({
        conceptId,
        userMessage,
        assistantResponse,
        layer,
      });
    },
    [adaptiveChat]
  );

  return {
    // Chat functionality
    generateResponse: adaptiveChat.generateResponse,
    isGenerating: adaptiveChat.isGenerating,
    generatedResponse: adaptiveChat.generatedResponse,
    generateError: adaptiveChat.generateError,
    chatSuggestions: adaptiveChat.suggestions,
    isLoadingSuggestions: adaptiveChat.isLoadingSuggestions,

    // Content recommendations
    recommendations: personalizedContent.recommendations,
    isLoadingRecommendations: personalizedContent.isLoading,
    recommendationsError: personalizedContent.error,

    // Handlers
    handleSendMessage,
    getSuggestionsForTopic,
    recordChatInteraction,

    // Utilities
    reset: () => {
      adaptiveChat.reset();
      personalizedContent.refetch?.();
    },
  };
}
