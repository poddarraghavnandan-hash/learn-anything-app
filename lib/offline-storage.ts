/**
 * Offline Storage & Sync Service
 * Enables offline learning with local caching and background sync
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

export interface OfflineLesson {
  id: string;
  title: string;
  content: string;
  sections: any[];
  downloadedAt: number;
  expiresAt: number;
}

export interface OfflineProgress {
  lessonId: string;
  userId: string;
  currentSectionIndex: number;
  userAnswers: Record<string, string>;
  masteryScore: number;
  lastAccessedAt: number;
  syncedAt?: number;
}

export interface SyncQueue {
  id: string;
  type: "progress" | "assessment" | "feedback";
  data: any;
  createdAt: number;
  synced: boolean;
  syncedAt?: number;
}

const STORAGE_KEYS = {
  LESSONS: "offline_lessons",
  PROGRESS: "offline_progress",
  SYNC_QUEUE: "sync_queue",
  LAST_SYNC: "last_sync",
  OFFLINE_MODE: "offline_mode",
};

const CACHE_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const MAX_STORAGE_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * Save lesson for offline access
 */
export async function saveLessonOffline(lesson: OfflineLesson): Promise<boolean> {
  try {
    const lessons = await getOfflineLessons();
    const updatedLessons = lessons.filter((l) => l.id !== lesson.id);
    updatedLessons.push({
      ...lesson,
      downloadedAt: Date.now(),
      expiresAt: Date.now() + CACHE_DURATION_MS,
    });

    await AsyncStorage.setItem(STORAGE_KEYS.LESSONS, JSON.stringify(updatedLessons));
    return true;
  } catch (error) {
    console.error("[OfflineStorage] Failed to save lesson:", error);
    return false;
  }
}

/**
 * Get all offline lessons
 */
export async function getOfflineLessons(): Promise<OfflineLesson[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.LESSONS);
    if (!data) return [];

    const lessons: OfflineLesson[] = JSON.parse(data);

    // Filter out expired lessons
    const now = Date.now();
    const validLessons = lessons.filter((l) => l.expiresAt > now);

    // Update storage if any were expired
    if (validLessons.length < lessons.length) {
      await AsyncStorage.setItem(STORAGE_KEYS.LESSONS, JSON.stringify(validLessons));
    }

    return validLessons;
  } catch (error) {
    console.error("[OfflineStorage] Failed to get lessons:", error);
    return [];
  }
}

/**
 * Get specific offline lesson
 */
export async function getOfflineLesson(lessonId: string): Promise<OfflineLesson | null> {
  try {
    const lessons = await getOfflineLessons();
    return lessons.find((l) => l.id === lessonId) || null;
  } catch (error) {
    console.error("[OfflineStorage] Failed to get lesson:", error);
    return null;
  }
}

/**
 * Delete offline lesson to free space
 */
export async function deleteOfflineLesson(lessonId: string): Promise<boolean> {
  try {
    const lessons = await getOfflineLessons();
    const filtered = lessons.filter((l) => l.id !== lessonId);
    await AsyncStorage.setItem(STORAGE_KEYS.LESSONS, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error("[OfflineStorage] Failed to delete lesson:", error);
    return false;
  }
}

/**
 * Save progress locally (for offline sync)
 */
export async function saveProgressOffline(progress: OfflineProgress): Promise<boolean> {
  try {
    const allProgress = await getOfflineProgress();
    const updated = allProgress.filter((p) => p.lessonId !== progress.lessonId);
    updated.push({
      ...progress,
      lastAccessedAt: Date.now(),
    });

    await AsyncStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(updated));

    // Add to sync queue
    await addToSyncQueue({
      type: "progress",
      data: progress,
    });

    return true;
  } catch (error) {
    console.error("[OfflineStorage] Failed to save progress:", error);
    return false;
  }
}

/**
 * Get all offline progress
 */
export async function getOfflineProgress(): Promise<OfflineProgress[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PROGRESS);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error("[OfflineStorage] Failed to get progress:", error);
    return [];
  }
}

/**
 * Get progress for specific lesson
 */
export async function getLessonProgress(lessonId: string): Promise<OfflineProgress | null> {
  try {
    const progress = await getOfflineProgress();
    return progress.find((p) => p.lessonId === lessonId) || null;
  } catch (error) {
    console.error("[OfflineStorage] Failed to get lesson progress:", error);
    return null;
  }
}

/**
 * Add item to sync queue
 */
export async function addToSyncQueue(item: Omit<SyncQueue, "id" | "createdAt" | "synced">): Promise<boolean> {
  try {
    const queue = await getSyncQueue();
    queue.push({
      id: `sync-${Date.now()}-${Math.random()}`,
      ...item,
      createdAt: Date.now(),
      synced: false,
    });

    await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
    return true;
  } catch (error) {
    console.error("[OfflineStorage] Failed to add to sync queue:", error);
    return false;
  }
}

/**
 * Get sync queue
 */
export async function getSyncQueue(): Promise<SyncQueue[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error("[OfflineStorage] Failed to get sync queue:", error);
    return [];
  }
}

/**
 * Mark sync item as synced
 */
export async function markSynced(itemId: string): Promise<boolean> {
  try {
    const queue = await getSyncQueue();
    const updated = queue.map((item) =>
      item.id === itemId ? { ...item, synced: true, syncedAt: Date.now() } : item
    );

    await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error("[OfflineStorage] Failed to mark synced:", error);
    return false;
  }
}

/**
 * Clear old synced items from queue
 */
export async function clearSyncedQueue(): Promise<boolean> {
  try {
    const queue = await getSyncQueue();
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    const filtered = queue.filter(
      (item) => !item.synced || (item.syncedAt && item.syncedAt > oneDayAgo)
    );

    await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error("[OfflineStorage] Failed to clear sync queue:", error);
    return false;
  }
}

/**
 * Get storage usage
 */
export async function getStorageUsage(): Promise<{
  lessons: number;
  progress: number;
  syncQueue: number;
  total: number;
}> {
  try {
    const lessonsData = await AsyncStorage.getItem(STORAGE_KEYS.LESSONS);
    const progressData = await AsyncStorage.getItem(STORAGE_KEYS.PROGRESS);
    const syncData = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);

    const lessonsSize = lessonsData ? lessonsData.length : 0;
    const progressSize = progressData ? progressData.length : 0;
    const syncSize = syncData ? syncData.length : 0;

    return {
      lessons: lessonsSize,
      progress: progressSize,
      syncQueue: syncSize,
      total: lessonsSize + progressSize + syncSize,
    };
  } catch (error) {
    console.error("[OfflineStorage] Failed to get storage usage:", error);
    return { lessons: 0, progress: 0, syncQueue: 0, total: 0 };
  }
}

/**
 * Enable offline mode
 */
export async function enableOfflineMode(): Promise<boolean> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_MODE, "true");
    return true;
  } catch (error) {
    console.error("[OfflineStorage] Failed to enable offline mode:", error);
    return false;
  }
}

/**
 * Disable offline mode
 */
export async function disableOfflineMode(): Promise<boolean> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_MODE, "false");
    return true;
  } catch (error) {
    console.error("[OfflineStorage] Failed to disable offline mode:", error);
    return false;
  }
}

/**
 * Check if offline mode is enabled
 */
export async function isOfflineModeEnabled(): Promise<boolean> {
  try {
    const mode = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_MODE);
    return mode === "true";
  } catch (error) {
    console.error("[OfflineStorage] Failed to check offline mode:", error);
    return false;
  }
}

/**
 * Get last sync time
 */
export async function getLastSyncTime(): Promise<number | null> {
  try {
    const time = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    return time ? parseInt(time) : null;
  } catch (error) {
    console.error("[OfflineStorage] Failed to get last sync time:", error);
    return null;
  }
}

/**
 * Update last sync time
 */
export async function updateLastSyncTime(): Promise<boolean> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, Date.now().toString());
    return true;
  } catch (error) {
    console.error("[OfflineStorage] Failed to update sync time:", error);
    return false;
  }
}

/**
 * Clear all offline data
 */
export async function clearAllOfflineData(): Promise<boolean> {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.LESSONS,
      STORAGE_KEYS.PROGRESS,
      STORAGE_KEYS.SYNC_QUEUE,
      STORAGE_KEYS.LAST_SYNC,
    ]);
    return true;
  } catch (error) {
    console.error("[OfflineStorage] Failed to clear all data:", error);
    return false;
  }
}

/**
 * Sync offline data when connection is restored
 */
export async function syncOfflineData(
  syncFn: (queue: SyncQueue[]) => Promise<boolean>
): Promise<boolean> {
  try {
    const queue = await getSyncQueue();
    const unsyncedItems = queue.filter((item) => !item.synced);

    if (unsyncedItems.length === 0) {
      return true;
    }

    const success = await syncFn(unsyncedItems);

    if (success) {
      for (const item of unsyncedItems) {
        await markSynced(item.id);
      }
      await updateLastSyncTime();
      return true;
    }

    return false;
  } catch (error) {
    console.error("[OfflineStorage] Failed to sync offline data:", error);
    return false;
  }
}
