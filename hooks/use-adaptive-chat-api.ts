/**
 * Hook for Adaptive Chat API integration
 * Generates knowledge-level-aware LLM responses
 */

import { trpc } from "@/lib/trpc";

interface UseAdaptiveChatOptions {
  enabled?: boolean;
}

export function useAdaptiveChat({ enabled = true }: UseAdaptiveChatOptions = {}) {
  // Generate adaptive response based on user's knowledge level
  const generateResponseMutation = trpc.adaptiveChat.generateResponse.useMutation();

  // Get chat suggestions based on user's learning gaps
  const suggestionsQuery = trpc.adaptiveChat.getSuggestions.useQuery(
    undefined,
    { enabled, staleTime: 10 * 60 * 1000 }
  );

  // Record a chat interaction (for analytics)
  const recordInteractionMutation = trpc.adaptiveChat.recordInteraction.useMutation();

  return {
    // Generate response
    generateResponse: generateResponseMutation.mutate,
    isGenerating: generateResponseMutation.isPending,
    generatedResponse: generateResponseMutation.data,
    generateError: generateResponseMutation.error,

    // Get suggestions
    suggestions: suggestionsQuery.data?.suggestions,
    isLoadingSuggestions: suggestionsQuery.isLoading,
    suggestionsError: suggestionsQuery.error,

    // Record interaction
    recordInteraction: recordInteractionMutation.mutate,
    isRecording: recordInteractionMutation.isPending,

    // Utilities
    refetchSuggestions: suggestionsQuery.refetch,
    reset: () => {
      generateResponseMutation.reset();
      recordInteractionMutation.reset();
    },
  };
}
