/**
 * useLadderProgress Hook
 * Manages learning ladder progression and mastery tracking
 */

import { useState, useCallback, useEffect } from "react";
import { trpc } from "@/lib/trpc";

interface LadderLevel {
  level: number;
  name: string;
  description: string;
  icon: string;
  masteryPercentage: number;
  isCurrentLevel: boolean;
  isUnlocked: boolean;
}

interface LadderProgressState {
  currentLevel: number;
  masteryPercentage: number;
  levels: LadderLevel[];
  isLoading: boolean;
  error: string | null;
  lastAdvancementTime?: Date;
}

const LADDER_LEVELS = [
  {
    level: 1,
    name: "Foundation",
    description: "Learn the basics and core concepts",
    icon: "🌱",
    requiredMastery: 0,
  },
  {
    level: 2,
    name: "Understanding",
    description: "Understand how concepts work",
    icon: "📚",
    requiredMastery: 60,
  },
  {
    level: 3,
    name: "Application",
    description: "Apply concepts to real-world scenarios",
    icon: "🎯",
    requiredMastery: 75,
  },
  {
    level: 4,
    name: "Deep Dive",
    description: "Master advanced theory and principles",
    icon: "🔬",
    requiredMastery: 85,
  },
  {
    level: 5,
    name: "Mastery",
    description: "Become an expert and teach others",
    icon: "👑",
    requiredMastery: 95,
  },
];

export function useLadderProgress(conceptId: string) {
  const [state, setState] = useState<LadderProgressState>({
    currentLevel: 1,
    masteryPercentage: 0,
    levels: [],
    isLoading: true,
    error: null,
  });

  // Initialize ladder levels
  useEffect(() => {
    const levels: LadderLevel[] = LADDER_LEVELS.map((level) => ({
      ...level,
      masteryPercentage: 0,
      isCurrentLevel: level.level === state.currentLevel,
      isUnlocked: level.level <= state.currentLevel + 1,
    }));

    setState((prev) => ({
      ...prev,
      levels,
      isLoading: false,
    }));
  }, []);

  /**
   * Update mastery percentage for current level
   */
  const updateMastery = useCallback(
    (newMasteryPercentage: number) => {
      setState((prev) => {
        const capped = Math.min(100, Math.max(0, newMasteryPercentage));
        const updatedLevels = prev.levels.map((level) => {
          if (level.level === prev.currentLevel) {
            return { ...level, masteryPercentage: capped };
          }
          return level;
        });

        return {
          ...prev,
          masteryPercentage: capped,
          levels: updatedLevels,
        };
      });
    },
    []
  );

  /**
   * Check if user should advance to next level
   */
  const checkAdvancement = useCallback((): boolean => {
    const nextLevelRequired = LADDER_LEVELS[state.currentLevel]?.requiredMastery || 100;

    if (state.masteryPercentage >= nextLevelRequired && state.currentLevel < 5) {
      advanceLevel();
      return true;
    }

    return false;
  }, [state.currentLevel, state.masteryPercentage]);

  /**
   * Advance to next level
   */
  const advanceLevel = useCallback(() => {
    if (state.currentLevel >= 5) return;

    setState((prev) => {
      const newLevel = prev.currentLevel + 1;
      const updatedLevels = prev.levels.map((level) => ({
        ...level,
        isCurrentLevel: level.level === newLevel,
        isUnlocked: level.level <= newLevel + 1,
      }));

      return {
        ...prev,
        currentLevel: newLevel,
        masteryPercentage: 0, // Reset mastery for new level
        levels: updatedLevels,
        lastAdvancementTime: new Date(),
      };
    });
  }, [state.currentLevel]);

  /**
   * Get current level details
   */
  const getCurrentLevelDetails = useCallback(() => {
    return LADDER_LEVELS[state.currentLevel - 1];
  }, [state.currentLevel]);

  /**
   * Get next level details
   */
  const getNextLevelDetails = useCallback(() => {
    if (state.currentLevel >= 5) return null;
    return LADDER_LEVELS[state.currentLevel];
  }, [state.currentLevel]);

  /**
   * Calculate progress to next level
   */
  const getProgressToNextLevel = useCallback(() => {
    if (state.currentLevel >= 5) return 100;

    const currentLevelRequired = LADDER_LEVELS[state.currentLevel - 1]?.requiredMastery || 0;
    const nextLevelRequired = LADDER_LEVELS[state.currentLevel]?.requiredMastery || 100;
    const range = nextLevelRequired - currentLevelRequired;
    const progress = state.masteryPercentage - currentLevelRequired;

    return Math.round((progress / range) * 100);
  }, [state.currentLevel, state.masteryPercentage]);

  return {
    ...state,
    updateMastery,
    checkAdvancement,
    advanceLevel,
    getCurrentLevelDetails,
    getNextLevelDetails,
    getProgressToNextLevel,
  };
}
