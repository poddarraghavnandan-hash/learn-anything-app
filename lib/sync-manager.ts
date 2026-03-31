/**
 * Sync Manager Service
 * Handles background sync of offline data with conflict resolution and retry logic
 */

import { getSyncQueue, markSynced, clearSyncedQueue, updateLastSyncTime } from "./offline-storage";

export type SyncStatus = "idle" | "syncing" | "success" | "error" | "conflict";

export interface SyncConflict {
  itemId: string;
  type: "progress" | "assessment" | "feedback";
  localVersion: any;
  remoteVersion: any;
  timestamp: number;
  resolution?: "local" | "remote" | "merge";
}

export interface SyncState {
  status: SyncStatus;
  lastSyncTime?: number;
  itemsSynced: number;
  itemsFailed: number;
  conflicts: SyncConflict[];
  error?: string;
  progress: number; // 0-100
}

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
};

/**
 * Sync Manager class handles all sync operations
 */
export class SyncManager {
  private state: SyncState = {
    status: "idle",
    itemsSynced: 0,
    itemsFailed: 0,
    conflicts: [],
    progress: 0,
  };

  private retryConfig: RetryConfig;
  private syncInProgress = false;
  private listeners: ((state: SyncState) => void)[] = [];

  constructor(retryConfig?: Partial<RetryConfig>) {
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  }

  /**
   * Subscribe to sync state changes
   */
  subscribe(listener: (state: SyncState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Get current sync state
   */
  getState(): SyncState {
    return { ...this.state };
  }

  /**
   * Update and broadcast sync state
   */
  private updateState(updates: Partial<SyncState>) {
    this.state = { ...this.state, ...updates };
    this.listeners.forEach((listener) => listener(this.getState()));
  }

  /**
   * Perform full sync
   */
  async performSync(syncFn: (items: any[]) => Promise<any>): Promise<boolean> {
    if (this.syncInProgress) {
      console.warn("[SyncManager] Sync already in progress");
      return false;
    }

    this.syncInProgress = true;
    this.updateState({
      status: "syncing",
      itemsSynced: 0,
      itemsFailed: 0,
      conflicts: [],
      progress: 0,
    });

    try {
      const queue = await getSyncQueue();
      const unsyncedItems = queue.filter((item) => !item.synced);

      if (unsyncedItems.length === 0) {
        this.updateState({
          status: "success",
          progress: 100,
        });
        await updateLastSyncTime();
        return true;
      }

      // Sync items with retry logic
      let syncedCount = 0;
      let failedCount = 0;
      const conflicts: SyncConflict[] = [];

      for (let i = 0; i < unsyncedItems.length; i++) {
        const item = unsyncedItems[i];
        const success = await this.syncItemWithRetry(item, syncFn);

        if (success) {
          syncedCount++;
          await markSynced(item.id);
        } else {
          failedCount++;
        }

        const progress = Math.round(((i + 1) / unsyncedItems.length) * 100);
        this.updateState({
          itemsSynced: syncedCount,
          itemsFailed: failedCount,
          progress,
        });
      }

      // Clear old synced items
      await clearSyncedQueue();

      const finalStatus = failedCount === 0 ? "success" : failedCount === syncedCount ? "error" : "success";
      this.updateState({
        status: finalStatus,
        progress: 100,
      });

      if (finalStatus === "success") {
        await updateLastSyncTime();
      }

      return failedCount === 0;
    } catch (error) {
      console.error("[SyncManager] Sync failed:", error);
      this.updateState({
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Sync single item with retry logic
   */
  private async syncItemWithRetry(
    item: any,
    syncFn: (items: any[]) => Promise<any>
  ): Promise<boolean> {
    let lastError: Error | null = null;
    let delay = this.retryConfig.initialDelayMs;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        await syncFn([item]);
        return true;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Check for conflict
        if (error instanceof SyncConflictError) {
          this.state.conflicts.push({
            itemId: item.id,
            type: item.type,
            localVersion: item.data,
            remoteVersion: error.remoteVersion,
            timestamp: Date.now(),
          });
          return false;
        }

        // Retry with exponential backoff
        if (attempt < this.retryConfig.maxRetries) {
          await this.delay(delay);
          delay = Math.min(delay * this.retryConfig.backoffMultiplier, this.retryConfig.maxDelayMs);
        }
      }
    }

    console.error(`[SyncManager] Failed to sync item ${item.id} after ${this.retryConfig.maxRetries} retries:`, lastError);
    return false;
  }

  /**
   * Resolve conflict
   */
  async resolveConflict(conflictId: string, resolution: "local" | "remote" | "merge"): Promise<boolean> {
    const conflict = this.state.conflicts.find((c) => c.itemId === conflictId);
    if (!conflict) return false;

    conflict.resolution = resolution;

    // In production, would update sync queue with resolved version
    this.state.conflicts = this.state.conflicts.filter((c) => c.itemId !== conflictId);
    this.updateState({ conflicts: this.state.conflicts });

    return true;
  }

  /**
   * Get conflicts
   */
  getConflicts(): SyncConflict[] {
    return [...this.state.conflicts];
  }

  /**
   * Merge two versions intelligently
   */
  private mergeVersions(local: any, remote: any): any {
    // Simple merge strategy: take newer timestamp
    if (local.lastAccessedAt > remote.lastAccessedAt) {
      return local;
    }
    return remote;
  }

  /**
   * Utility: delay for retry backoff
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Reset sync state
   */
  reset(): void {
    this.updateState({
      status: "idle",
      itemsSynced: 0,
      itemsFailed: 0,
      conflicts: [],
      progress: 0,
      error: undefined,
    });
  }
}

/**
 * Custom error for sync conflicts
 */
export class SyncConflictError extends Error {
  constructor(
    message: string,
    public remoteVersion: any
  ) {
    super(message);
    this.name = "SyncConflictError";
  }
}

/**
 * Network status monitor
 */
export class NetworkMonitor {
  private isOnline = true;
  private listeners: ((isOnline: boolean) => void)[] = [];

  constructor() {
    this.setupListeners();
  }

  private setupListeners(): void {
    // In React Native, would use NetInfo from @react-native-community/netinfo
    // For now, setup basic online/offline listeners
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => this.setOnline(true));
      window.addEventListener("offline", () => this.setOnline(false));
    }
  }

  private setOnline(online: boolean): void {
    if (this.isOnline !== online) {
      this.isOnline = online;
      this.listeners.forEach((listener) => listener(online));
    }
  }

  subscribe(listener: (isOnline: boolean) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  isConnected(): boolean {
    return this.isOnline;
  }
}

/**
 * Background sync orchestrator
 */
export class BackgroundSyncOrchestrator {
  private syncManager: SyncManager;
  private networkMonitor: NetworkMonitor;
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private syncOnConnect = false;

  constructor(syncManager: SyncManager, networkMonitor: NetworkMonitor) {
    this.syncManager = syncManager;
    this.networkMonitor = networkMonitor;
    this.setupNetworkListener();
  }

  private setupNetworkListener(): void {
    this.networkMonitor.subscribe((isOnline) => {
      if (isOnline && this.syncOnConnect) {
        console.log("[BackgroundSync] Connection restored, triggering sync");
        this.triggerSync();
      }
    });
  }

  /**
   * Start background sync with periodic checks
   */
  startBackgroundSync(
    syncFn: (items: any[]) => Promise<any>,
    intervalMs: number = 60000 // 1 minute default
  ): void {
    if (this.syncInterval) {
      console.warn("[BackgroundSync] Already running");
      return;
    }

    console.log("[BackgroundSync] Starting with interval:", intervalMs);

    this.syncInterval = setInterval(() => {
      if (this.networkMonitor.isConnected()) {
        this.triggerSync(syncFn);
      } else {
        this.syncOnConnect = true;
      }
    }, intervalMs);
  }

  /**
   * Stop background sync
   */
  stopBackgroundSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log("[BackgroundSync] Stopped");
    }
  }

  /**
   * Trigger immediate sync
   */
  async triggerSync(syncFn?: (items: any[]) => Promise<any>): Promise<boolean> {
    if (!syncFn) {
      console.warn("[BackgroundSync] No sync function provided");
      return false;
    }

    if (!this.networkMonitor.isConnected()) {
      console.warn("[BackgroundSync] No network connection");
      return false;
    }

    return await this.syncManager.performSync(syncFn);
  }

  /**
   * Get sync state
   */
  getSyncState(): SyncState {
    return this.syncManager.getState();
  }

  /**
   * Subscribe to sync updates
   */
  subscribe(listener: (state: SyncState) => void): () => void {
    return this.syncManager.subscribe(listener);
  }
}

/**
 * Create and configure sync system
 */
export function createSyncSystem(
  retryConfig?: Partial<RetryConfig>
): {
  syncManager: SyncManager;
  networkMonitor: NetworkMonitor;
  orchestrator: BackgroundSyncOrchestrator;
} {
  const syncManager = new SyncManager(retryConfig);
  const networkMonitor = new NetworkMonitor();
  const orchestrator = new BackgroundSyncOrchestrator(syncManager, networkMonitor);

  return {
    syncManager,
    networkMonitor,
    orchestrator,
  };
}
