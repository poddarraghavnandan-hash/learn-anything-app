import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";

/**
 * Hook to fetch the count of pending reviews for the current user
 * Returns the count and loading state
 */
export function usePendingReviews() {
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    // Fetch pending reviews count
    const fetchPendingReviews = async () => {
      try {
        setIsLoading(true);
        
        // Query the database for concepts that need review
        // A concept needs review if nextReviewDate <= today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // For now, return a mock count
        // In production, this would query the database
        // Example: SELECT COUNT(*) FROM userConceptMetrics WHERE userId = ? AND nextReviewDate <= TODAY
        setPendingCount(0); // TODO: Implement actual database query
      } catch (error) {
        console.error("Failed to fetch pending reviews:", error);
        setPendingCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPendingReviews();

    // Refresh every 5 minutes
    const interval = setInterval(fetchPendingReviews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user?.id]);

  return { pendingCount, isLoading };
}
