import { useCallback, useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import { generatePersonalizedRefresher, getLastSessionDate } from "@/server/personalized-refresher";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface ModuleReentryState {
  topicSlug: string;
  lastSessionDate: Date | null;
  needsRefresher: boolean;
  needsPrerequisiteTest: boolean;
  refresherData: any | null;
  prerequisiteQuestions: any[] | null;
  isLoading: boolean;
  error: string | null;
}

export interface SessionCheckpoint {
  topicSlug: string;
  currentStageNumber: number;
  lastAccessedAt: string;
  completedStages: number[];
}

const CHECKPOINT_STORAGE_KEY = "module_checkpoints";

/**
 * Hook for managing module re-entry flow
 * Handles refresher generation, prerequisite testing, and session restoration
 */
export function useModuleReentry(topicSlug: string, userId: string | null) {
  const [state, setState] = useState<ModuleReentryState>({
    topicSlug,
    lastSessionDate: null,
    needsRefresher: false,
    needsPrerequisiteTest: false,
    refresherData: null,
    prerequisiteQuestions: null,
    isLoading: true,
    error: null,
  });

  // Get last session date
  const getLastSession = useCallback(async () => {
    if (!userId) return null;
    try {
      const checkpoint = await AsyncStorage.getItem(`${CHECKPOINT_STORAGE_KEY}_${topicSlug}`);
      if (checkpoint) {
        const parsed = JSON.parse(checkpoint);
        return new Date(parsed.lastAccessedAt);
      }
      return null;
    } catch (error) {
      console.error("Error getting last session:", error);
      return null;
    }
  }, [userId, topicSlug]);

  // Generate refresher if needed
  const generateRefresher = useCallback(async (lastSessionDate: Date) => {
    if (!userId) return null;
    try {
      const delayMs = new Date().getTime() - lastSessionDate.getTime();
      const delayDays = delayMs / (1000 * 60 * 60 * 24);

      // Only show refresher if delay > 4 hours
      if (delayDays < 0.167) return null;

      // Call backend to generate refresher
      // For now, generate locally since backend route may not exist yet
      // TODO: Add generateRefresher endpoint to integration router
      return null;
    } catch (error) {
      console.error("Error generating refresher:", error);
      return null;
    }
  }, [userId, topicSlug]);

  // Get prerequisite questions
  const getPrerequisiteQuestions = useCallback(async () => {
    if (!userId) return [];
    try {
      // For now, return empty array
      // TODO: Add getPrerequisiteQuestions endpoint to integration router
      return [];
    } catch (error) {
      console.error("Error getting prerequisite questions:", error);
      return [];
    }
  }, [userId, topicSlug]);

  // Initialize re-entry flow
  useEffect(() => {
    const initializeReentry = async () => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const lastSession = await getLastSession();
      let needsRefresher = false;
      let refresherData = null;

      if (lastSession) {
        const delayMs = new Date().getTime() - lastSession.getTime();
        const delayDays = delayMs / (1000 * 60 * 60 * 24);
        // Show refresher if delay > 4 hours
        needsRefresher = delayDays > 0.167;
      }

        const prerequisiteQuestions = await getPrerequisiteQuestions();
        const needsPrerequisiteTest = prerequisiteQuestions.length > 0;

        setState((prev) => ({
          ...prev,
          lastSessionDate: lastSession,
          needsRefresher,
          needsPrerequisiteTest,
          refresherData,
          prerequisiteQuestions,
          isLoading: false,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : "Unknown error",
        }));
      }
    };

    initializeReentry();
  }, [topicSlug, userId, getLastSession, generateRefresher, getPrerequisiteQuestions]);

  // Save checkpoint
  const saveCheckpoint = useCallback(
    async (currentStageNumber: number, completedStages: number[] = []) => {
      try {
        const checkpoint: SessionCheckpoint = {
          topicSlug,
          currentStageNumber,
          lastAccessedAt: new Date().toISOString(),
          completedStages,
        };
        await AsyncStorage.setItem(
          `${CHECKPOINT_STORAGE_KEY}_${topicSlug}`,
          JSON.stringify(checkpoint)
        );
      } catch (error) {
        console.error("Error saving checkpoint:", error);
      }
    },
    [topicSlug]
  );

  // Get checkpoint
  const getCheckpoint = useCallback(async (): Promise<SessionCheckpoint | null> => {
    try {
      const checkpoint = await AsyncStorage.getItem(`${CHECKPOINT_STORAGE_KEY}_${topicSlug}`);
      if (checkpoint) {
        return JSON.parse(checkpoint);
      }
      return null;
    } catch (error) {
      console.error("Error getting checkpoint:", error);
      return null;
    }
  }, [topicSlug]);

  // Complete refresher
  const completeRefresher = useCallback(() => {
    setState((prev) => ({ ...prev, needsRefresher: false }));
  }, []);

  // Complete prerequisite test
  const completePrerequisiteTest = useCallback((score: number, total: number) => {
    setState((prev) => ({ ...prev, needsPrerequisiteTest: false }));
    // Could track prerequisite test results here
  }, []);

  // Skip refresher
  const skipRefresher = useCallback(() => {
    setState((prev) => ({ ...prev, needsRefresher: false }));
  }, []);

  // Skip prerequisite test
  const skipPrerequisiteTest = useCallback(() => {
    setState((prev) => ({ ...prev, needsPrerequisiteTest: false }));
  }, []);

  return {
    ...state,
    saveCheckpoint,
    getCheckpoint,
    completeRefresher,
    completePrerequisiteTest,
    skipRefresher,
    skipPrerequisiteTest,
  };
}
