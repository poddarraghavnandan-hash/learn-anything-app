/**
 * Hook for Learning Ladder API integration
 * Fetches ladder stages with multi-layer content and prerequisite information
 */

import { useCallback } from "react";
import { trpc } from "@/lib/trpc";

interface UseLearningLadderOptions {
  topicSlug: string;
  enabled?: boolean;
}

export function useLearningLadder({ topicSlug, enabled = true }: UseLearningLadderOptions) {
  const utils = trpc.useUtils();

  // Fetch ladder with all stages and content
  const ladderQuery = trpc.integration.ladder.getWithContent.useQuery(
    { topicSlug },
    { enabled, staleTime: 5 * 60 * 1000 }
  );

  // Fetch specific stage with content
  const getStage = useCallback(
    (stageNumber: number) => {
      return trpc.integration.ladder.getStage.useQuery({
        topicSlug,
        stageNumber,
      });
    },
    [topicSlug]
  );

  // Get next stage suggestion
  const getNextStageSuggestion = useCallback((currentStageNumber: number) => {
    return trpc.integration.ladder.suggestNext.useQuery({ topicSlug, currentStageNumber });
  }, [topicSlug]);

  // Record stage completion
  const recordCompletionMutation = trpc.integration.ladder.recordCompletion.useMutation({
    onSuccess: () => {
      utils.integration.ladder.getProgress.invalidate({ topicSlug });
    },
  });

  // Get progress
  const progressQuery = trpc.integration.ladder.getProgress.useQuery(
    { topicSlug },
    { enabled, staleTime: 5 * 60 * 1000 }
  );

  return {
    stages: ladderQuery.data,
    isLoadingLadder: ladderQuery.isLoading,
    ladderError: ladderQuery.error,
    progress: progressQuery.data,
    isLoadingProgress: progressQuery.isLoading,
    getStage,
    getNextStageSuggestion,
    recordCompletion: recordCompletionMutation.mutate,
    isRecordingCompletion: recordCompletionMutation.isPending,
    refetch: ladderQuery.refetch,
  };
}
