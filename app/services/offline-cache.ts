/**
 * Offline Content Caching Service
 * Manages local storage of learning content for offline access
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

export interface CachedContent {
  id: string;
  type: "lesson" | "video" | "quiz" | "learning_path";
  title: string;
  content: any;
  timestamp: number;
  expiresAt?: number;
  size: number; // bytes
}

export interface CacheStats {
  totalSize: number;
  itemCount: number;
  oldestItem?: CachedContent;
  newestItem?: CachedContent;
}

const CACHE_PREFIX = "@learn-anything:cache:";
const CACHE_METADATA_KEY = "@learn-anything:cache:metadata";
const MAX_CACHE_SIZE = 500 * 1024 * 1024; // 500MB

/**
 * Save content to offline cache
 */
export async function cacheContent(
  id: string,
  type: "lesson" | "video" | "quiz" | "learning_path",
  content: any,
  ttl?: number // time to live in seconds
): Promise<{ success: boolean; error?: string }> {
  try {
    const cacheKey = `${CACHE_PREFIX}${type}:${id}`;
    const now = Date.now();
    const expiresAt = ttl ? now + ttl * 1000 : undefined;

    const cacheEntry: CachedContent = {
      id,
      type,
      title: content.title || id,
      content,
      timestamp: now,
      expiresAt,
      size: JSON.stringify(content).length,
    };

    // Check cache size before saving
    const stats = await getCacheStats();
    if (stats.totalSize + cacheEntry.size > MAX_CACHE_SIZE) {
      // Remove oldest items to make space
      await evictOldestItems(cacheEntry.size);
    }

    // Save content
    await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheEntry));

    // Update metadata
    await updateCacheMetadata(id, type, "add");

    console.log(`[OfflineCache] Cached ${type}:${id} (${cacheEntry.size} bytes)`);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to cache content",
    };
  }
}

/**
 * Retrieve cached content
 */
export async function getCachedContent(
  id: string,
  type: "lesson" | "video" | "quiz" | "learning_path"
): Promise<{ success: boolean; content?: any; error?: string }> {
  try {
    const cacheKey = `${CACHE_PREFIX}${type}:${id}`;
    const cached = await AsyncStorage.getItem(cacheKey);

    if (!cached) {
      return { success: false, error: "Content not found in cache" };
    }

    const cacheEntry: CachedContent = JSON.parse(cached);

    // Check if content has expired
    if (cacheEntry.expiresAt && cacheEntry.expiresAt < Date.now()) {
      await removeCachedContent(id, type);
      return { success: false, error: "Cached content has expired" };
    }

    console.log(`[OfflineCache] Retrieved ${type}:${id} from cache`);

    return { success: true, content: cacheEntry.content };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to retrieve cached content",
    };
  }
}

/**
 * Remove cached content
 */
export async function removeCachedContent(
  id: string,
  type: "lesson" | "video" | "quiz" | "learning_path"
): Promise<{ success: boolean; error?: string }> {
  try {
    const cacheKey = `${CACHE_PREFIX}${type}:${id}`;
    await AsyncStorage.removeItem(cacheKey);

    // Update metadata
    await updateCacheMetadata(id, type, "remove");

    console.log(`[OfflineCache] Removed ${type}:${id} from cache`);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to remove cached content",
    };
  }
}

/**
 * Clear all cached content
 */
export async function clearAllCache(): Promise<{ success: boolean; error?: string }> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX));

    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
      console.log(`[OfflineCache] Cleared ${cacheKeys.length} cached items`);
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to clear cache",
    };
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<CacheStats> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX));

    let totalSize = 0;
    let oldestItem: CachedContent | undefined;
    let newestItem: CachedContent | undefined;

    for (const key of cacheKeys) {
      const cached = await AsyncStorage.getItem(key);
      if (cached) {
        const entry: CachedContent = JSON.parse(cached);
        totalSize += entry.size;

        if (!oldestItem || entry.timestamp < oldestItem.timestamp) {
          oldestItem = entry;
        }

        if (!newestItem || entry.timestamp > newestItem.timestamp) {
          newestItem = entry;
        }
      }
    }

    return {
      totalSize,
      itemCount: cacheKeys.length,
      oldestItem,
      newestItem,
    };
  } catch (error) {
    console.error("[OfflineCache] Error getting cache stats:", error);
    return { totalSize: 0, itemCount: 0 };
  }
}

/**
 * List all cached content
 */
export async function listCachedContent(): Promise<CachedContent[]> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX));

    const items: CachedContent[] = [];

    for (const key of cacheKeys) {
      const cached = await AsyncStorage.getItem(key);
      if (cached) {
        items.push(JSON.parse(cached));
      }
    }

    return items.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error("[OfflineCache] Error listing cached content:", error);
    return [];
  }
}

/**
 * Sync cached content when connection returns
 */
export async function syncCachedContent(
  onProgress?: (progress: { synced: number; total: number }) => void
): Promise<{ success: boolean; synced: number; error?: string }> {
  try {
    const items = await listCachedContent();
    let synced = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      // TODO: Implement actual sync logic
      // This would send cached content to server and update timestamps
      console.log(`[OfflineCache] Syncing ${item.type}:${item.id}`);

      synced++;
      onProgress?.({ synced, total: items.length });
    }

    console.log(`[OfflineCache] Synced ${synced} items`);

    return { success: true, synced };
  } catch (error) {
    return {
      success: false,
      synced: 0,
      error: error instanceof Error ? error.message : "Sync failed",
    };
  }
}

/**
 * Evict oldest items to make space for new content
 */
async function evictOldestItems(requiredSpace: number): Promise<void> {
  try {
    const items = await listCachedContent();
    let freedSpace = 0;

    // Sort by timestamp (oldest first)
    items.sort((a, b) => a.timestamp - b.timestamp);

    for (const item of items) {
      if (freedSpace >= requiredSpace) break;

      await removeCachedContent(item.id, item.type);
      freedSpace += item.size;

      console.log(`[OfflineCache] Evicted ${item.type}:${item.id} to free space`);
    }
  } catch (error) {
    console.error("[OfflineCache] Error evicting items:", error);
  }
}

/**
 * Update cache metadata
 */
async function updateCacheMetadata(
  id: string,
  type: string,
  action: "add" | "remove"
): Promise<void> {
  try {
    const metadata = await AsyncStorage.getItem(CACHE_METADATA_KEY);
    const items = metadata ? JSON.parse(metadata) : {};

    const key = `${type}:${id}`;

    if (action === "add") {
      items[key] = Date.now();
    } else {
      delete items[key];
    }

    await AsyncStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(items));
  } catch (error) {
    console.error("[OfflineCache] Error updating metadata:", error);
  }
}
