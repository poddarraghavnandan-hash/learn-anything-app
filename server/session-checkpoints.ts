import { getDb } from "./db";
import { eq, and } from "drizzle-orm";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface SessionCheckpoint {
  userId: number;
  topicSlug: string;
  currentStageNumber: number;
  completedStages: number[];
  lastAccessedAt: Date;
  createdAt: Date;
}

const CHECKPOINT_STORAGE_KEY = "module_checkpoints";

/**
 * Save a session checkpoint for a user's learning progress
 */
export async function saveSessionCheckpoint(
  userId: number,
  topicSlug: string,
  currentStageNumber: number,
  completedStages: number[] = []
): Promise<void> {
  try {
    const checkpoint: SessionCheckpoint = {
      userId,
      topicSlug,
      currentStageNumber,
      completedStages,
      lastAccessedAt: new Date(),
      createdAt: new Date(),
    };

    // Save to local storage for quick access
    const key = `${CHECKPOINT_STORAGE_KEY}_${userId}_${topicSlug}`;
    await AsyncStorage.setItem(key, JSON.stringify(checkpoint));

    // TODO: Also save to database for cross-device sync
  } catch (error) {
    console.error("Error saving session checkpoint:", error);
  }
}

/**
 * Get the last session checkpoint for a user and topic
 */
export async function getSessionCheckpoint(
  userId: number,
  topicSlug: string
): Promise<SessionCheckpoint | null> {
  try {
    const key = `${CHECKPOINT_STORAGE_KEY}_${userId}_${topicSlug}`;
    const checkpoint = await AsyncStorage.getItem(key);

    if (checkpoint) {
      const parsed = JSON.parse(checkpoint);
      return {
        ...parsed,
        lastAccessedAt: new Date(parsed.lastAccessedAt),
        createdAt: new Date(parsed.createdAt),
      };
    }

    return null;
  } catch (error) {
    console.error("Error getting session checkpoint:", error);
    return null;
  }
}

/**
 * Get time since last session
 */
export async function getTimeSinceLastSession(
  userId: number,
  topicSlug: string
): Promise<number | null> {
  try {
    const checkpoint = await getSessionCheckpoint(userId, topicSlug);
    if (!checkpoint) return null;

    const now = new Date();
    const delayMs = now.getTime() - checkpoint.lastAccessedAt.getTime();
    const delayDays = delayMs / (1000 * 60 * 60 * 24);

    return delayDays;
  } catch (error) {
    console.error("Error calculating time since last session:", error);
    return null;
  }
}

/**
 * Clear a session checkpoint
 */
export async function clearSessionCheckpoint(userId: number, topicSlug: string): Promise<void> {
  try {
    const key = `${CHECKPOINT_STORAGE_KEY}_${userId}_${topicSlug}`;
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error("Error clearing session checkpoint:", error);
  }
}

/**
 * Get all checkpoints for a user
 */
export async function getUserCheckpoints(userId: number): Promise<SessionCheckpoint[]> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const checkpointKeys = allKeys.filter((key) => key.startsWith(CHECKPOINT_STORAGE_KEY) && key.includes(`_${userId}_`));

    const checkpoints: SessionCheckpoint[] = [];
    for (const key of checkpointKeys) {
      const data = await AsyncStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        checkpoints.push({
          ...parsed,
          lastAccessedAt: new Date(parsed.lastAccessedAt),
          createdAt: new Date(parsed.createdAt),
        });
      }
    }

    return checkpoints;
  } catch (error) {
    console.error("Error getting user checkpoints:", error);
    return [];
  }
}

/**
 * Mark a stage as completed
 */
export async function markStageCompleted(
  userId: number,
  topicSlug: string,
  stageNumber: number
): Promise<void> {
  try {
    const checkpoint = await getSessionCheckpoint(userId, topicSlug);
    if (!checkpoint) return;

    const completedStages = new Set(checkpoint.completedStages);
    completedStages.add(stageNumber);

    await saveSessionCheckpoint(userId, topicSlug, checkpoint.currentStageNumber, Array.from(completedStages));
  } catch (error) {
    console.error("Error marking stage as completed:", error);
  }
}

/**
 * Get next unvisited stage
 */
export async function getNextUnvisitedStage(
  userId: number,
  topicSlug: string,
  totalStages: number
): Promise<number> {
  try {
    const checkpoint = await getSessionCheckpoint(userId, topicSlug);
    if (!checkpoint) return 1;

    // Find first stage not in completedStages
    for (let i = 1; i <= totalStages; i++) {
      if (!checkpoint.completedStages.includes(i)) {
        return i;
      }
    }

    return checkpoint.currentStageNumber;
  } catch (error) {
    console.error("Error getting next unvisited stage:", error);
    return 1;
  }
}
