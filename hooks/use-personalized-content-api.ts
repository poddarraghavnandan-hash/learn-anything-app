/**
 * Hook for Personalized Content Feed API integration
 * Fetches content recommendations based on user's knowledge gaps
 */

import { useCallback } from "react";
import { trpc } from "@/lib/trpc";

interface UsePersonalizedContentOptions {
  enabled?: boolean;
  limit?: number;
}

export function usePersonalizedContent({ 
  enabled = true,
  limit = 5,
}: UsePersonalizedContentOptions = {}) {
  const utils = trpc.useUtils();

  // Get personalized content recommendations
  const recommendationsQuery = trpc.integration.summary.getRecommendations.useQuery(
    { limit },
    { enabled, staleTime: 10 * 60 * 1000 }
  );

  // Get content by layer
  const getByLayer = useCallback(
    (conceptId: number, layer: "foundation" | "deepDive" | "expert") => {
      return trpc.integration.summary.getByLayer.useQuery({ conceptId, layer });
    },
    []
  );

  // Enrich single content summary (as lazy query)
  const enrichQuery = useCallback(
    (contentId: number) => {
      return trpc.integration.summary.enrich.useQuery({ contentId });
    },
    []
  );

  // Batch enrich summaries (as lazy query)
  const enrichBatchQuery = useCallback(
    (contentIds: number[]) => {
      return trpc.integration.summary.enrichBatch.useQuery({ contentIds });
    },
    []
  );

  return {
    recommendations: recommendationsQuery.data?.recommendations,
    isLoading: recommendationsQuery.isLoading,
    error: recommendationsQuery.error,
    getByLayer,
    enrich: enrichQuery,
    enrichBatch: enrichBatchQuery,
    refetch: recommendationsQuery.refetch,
  };
}
