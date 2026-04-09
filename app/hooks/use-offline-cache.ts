/**
 * useOfflineCache Hook
 * Manages offline content caching and synchronization
 */

import { useState, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as OfflineCache from "@/app/services/offline-cache";

// Simple online status detection (fallback if netinfo not available)
const useNetInfo = () => ({
  isConnected: true, // Default to online
});

export interface UseOfflineCacheState {
  isOnline: boolean;
  isSyncing: boolean;
  cacheStats: {
    totalSize: number;
    itemCount: number;
  };
  syncProgress: {
    synced: number;
    total: number;
  };
  error: string | null;
}

export function useOfflineCache() {
  const [state, setState] = useState<UseOfflineCacheState>({
    isOnline: true,
    isSyncing: false,
    cacheStats: { totalSize: 0, itemCount: 0 },
    syncProgress: { synced: 0, total: 0 },
    error: null,
  });

  // Trigger sync when connection is restored
  useEffect(() => {
    if (state.isOnline && !state.isSyncing) {
      syncCachedContent();
    }
  }, [state.isOnline]);

  // Update cache stats on mount and periodically
  useEffect(() => {
    const updateStats = async () => {
      const stats = await OfflineCache.getCacheStats();
      setState((prev) => ({
        ...prev,
        cacheStats: {
          totalSize: stats.totalSize,
          itemCount: stats.itemCount,
        },
      }));
    };

    updateStats();

    const interval = setInterval(updateStats, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  /**
   * Cache content for offline access
   */
  const cacheContent = useCallback(
    async (
      id: string,
      type: "lesson" | "video" | "quiz" | "learning_path",
      content: any,
      ttl?: number
    ) => {
      try {
        setState((prev) => ({ ...prev, error: null }));

        const result = await OfflineCache.cacheContent(id, type, content, ttl);

        if (!result.success) {
          throw new Error(result.error);
        }

        // Update stats
        const stats = await OfflineCache.getCacheStats();
        setState((prev) => ({
          ...prev,
          cacheStats: {
            totalSize: stats.totalSize,
            itemCount: stats.itemCount,
          },
        }));

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Caching failed";
        setState((prev) => ({ ...prev, error: errorMessage }));
        throw error;
      }
    },
    []
  );

  /**
   * Get cached content
   */
  const getCachedContent = useCallback(
    async (id: string, type: "lesson" | "video" | "quiz" | "learning_path") => {
      try {
        setState((prev) => ({ ...prev, error: null }));

        const result = await OfflineCache.getCachedContent(id, type);

        if (!result.success) {
          throw new Error(result.error);
        }

        return result.content;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to get cached content";
        setState((prev) => ({ ...prev, error: errorMessage }));
        return null;
      }
    },
    []
  );

  /**
   * Remove cached content
   */
  const removeCachedContent = useCallback(
    async (id: string, type: "lesson" | "video" | "quiz" | "learning_path") => {
      try {
        setState((prev) => ({ ...prev, error: null }));

        const result = await OfflineCache.removeCachedContent(id, type);

        if (!result.success) {
          throw new Error(result.error);
        }

        // Update stats
        const stats = await OfflineCache.getCacheStats();
        setState((prev) => ({
          ...prev,
          cacheStats: {
            totalSize: stats.totalSize,
            itemCount: stats.itemCount,
          },
        }));

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to remove cached content";
        setState((prev) => ({ ...prev, error: errorMessage }));
        throw error;
      }
    },
    []
  );

  /**
   * Clear all cache
   */
  const clearAllCache = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, error: null }));

      const result = await OfflineCache.clearAllCache();

      if (!result.success) {
        throw new Error(result.error);
      }

      setState((prev) => ({
        ...prev,
        cacheStats: { totalSize: 0, itemCount: 0 },
      }));

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to clear cache";
      setState((prev) => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  /**
   * List all cached content
   */
  const listCachedContent = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, error: null }));
      return await OfflineCache.listCachedContent();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to list cached content";
      setState((prev) => ({ ...prev, error: errorMessage }));
      return [];
    }
  }, []);

  /**
   * Sync cached content when connection is restored
   */
  const syncCachedContent = useCallback(async () => {
    // Sync is triggered automatically when connection is restored
    // or can be called manually

    try {
      setState((prev) => ({
        ...prev,
        isSyncing: true,
        error: null,
        syncProgress: { synced: 0, total: 0 },
      }));

      const result = await OfflineCache.syncCachedContent((progress) => {
        setState((prev) => ({
          ...prev,
          syncProgress: progress,
        }));
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      setState((prev) => ({
        ...prev,
        isSyncing: false,
        syncProgress: { synced: result.synced, total: result.synced },
      }));

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Sync failed";
      setState((prev) => ({
        ...prev,
        isSyncing: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, [state.isOnline, state.isSyncing]);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    cacheContent,
    getCachedContent,
    removeCachedContent,
    clearAllCache,
    listCachedContent,
    syncCachedContent,
    clearError,
  };
}
