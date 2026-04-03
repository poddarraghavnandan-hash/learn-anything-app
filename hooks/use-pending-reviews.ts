import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";

/**
 * Hook to fetch the count of pending reviews for the current user.
 * Uses the spacedRepetition.getConceptsDue tRPC query.
 */
export function usePendingReviews() {
  const { user } = useAuth();

  const { data, isLoading } = trpc.spacedRepetition.getConceptsDue.useQuery(
    { limit: 20 },
    {
      enabled: !!user?.id,
      refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    }
  );

  return {
    pendingCount: data?.concepts?.length ?? 0,
    isLoading,
  };
}
