import { db } from '../db/db';
import {
  SetRecord,
  PositionRecord,
  PlateRecord,
  PlateInstallationRecord,
  PlateRemovalRecord,
  DailyProductionRecord,
  ReplacementRecord,
  JobOrderRecord,
  AuditRecord,
  Personnel
} from '../types';

export interface ServerSyncPayload {
  sets: SetRecord[];
  positions: PositionRecord[];
  plates: PlateRecord[];
  installations: PlateInstallationRecord[];
  removals: PlateRemovalRecord[];
  production: DailyProductionRecord[];
  replacements: ReplacementRecord[];
  jobOrders: JobOrderRecord[];
  auditLogs: AuditRecord[];
  personnel: Personnel[];
}

export interface SyncStatus {
  connected: boolean;
  serverRevision: number;
  localRevision: number;
  lastSyncTime: string | null;
  serverHost: string;
  serverPort: number;
  mode: 'CENTRAL_NODE' | 'STANDALONE_LOCAL';
}

class CentralSyncService {
  private currentRevision = 0;
  private isSyncing = false;
  private syncInterval: any = null;
  private eventSource: EventSource | null = null;
  private listeners: Array<(status: SyncStatus) => void> = [];
  private onRemoteDataChangedCallback: (() => Promise<void>) | null = null;
  private status: SyncStatus = {
    connected: false,
    serverRevision: 0,
    localRevision: 0,
    lastSyncTime: null,
    serverHost: window.location.hostname || 'localhost',
    serverPort: Number(window.location.port) || 3000,
    mode: 'CENTRAL_NODE'
  };

  constructor() {
    const savedRev = localStorage.getItem('plmsys_sync_revision');
    if (savedRev) {
      this.currentRevision = parseInt(savedRev, 10) || 0;
      this.status.localRevision = this.currentRevision;
    }
  }

  public subscribeStatus(listener: (status: SyncStatus) => void) {
    this.listeners.push(listener);
    listener(this.status);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyStatus() {
    for (const l of this.listeners) {
      l({ ...this.status });
    }
  }

  public setOnRemoteDataChanged(cb: () => Promise<void>) {
    this.onRemoteDataChangedCallback = cb;
  }

  /**
   * Clears browser CacheStorage to prevent any stale HTML/JS/API cache
   */
  public async clearBrowserCache() {
    try {
      if (typeof window !== 'undefined' && 'caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
        console.log('[PLMSys Sync] Browser CacheStorage cleared');
      }
    } catch (err) {
      console.warn('[PLMSys Sync] Cache clearing notice:', err);
    }
  }

  /**
   * Connect to real-time Server-Sent Events stream for instant LAN updates
   */
  public connectSSE() {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') return;
    if (this.eventSource) {
      try {
        this.eventSource.close();
      } catch {
        // ignore
      }
      this.eventSource = null;
    }

    try {
      this.eventSource = new EventSource(`/api/sync/events?_t=${Date.now()}`);

      this.eventSource.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && typeof data.revision === 'number') {
            this.status.serverRevision = data.revision;
            this.status.connected = true;
            if (data.revision !== this.currentRevision) {
              console.log(`[PLMSys Sync] Instant SSE update notification (local: ${this.currentRevision} -> server: ${data.revision}). Refreshing...`);
              await this.pullFromServer();
            } else {
              this.notifyStatus();
            }
          }
        } catch (e) {
          console.warn('[PLMSys Sync] SSE message parse warning:', e);
        }
      };

      this.eventSource.onerror = () => {
        this.status.connected = false;
        this.notifyStatus();
        try {
          this.eventSource?.close();
        } catch {
          // ignore
        }
        this.eventSource = null;
        setTimeout(() => {
          if (!this.eventSource) {
            this.connectSSE();
          }
        }, 4000);
      };
    } catch (err) {
      console.warn('[PLMSys Sync] SSE setup notice:', err);
    }
  }

  /**
   * Initial synchronization with Node.js Server on application boot
   * Ensures browser cache is purged and loads the true database from the central server.
   */
  public async initSync(): Promise<boolean> {
    await this.clearBrowserCache();

    try {
      const res = await fetch(`/api/sync/all?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      if (!res.ok) {
        this.status.connected = false;
        this.notifyStatus();
        this.startBackgroundSync();
        return false;
      }

      const json = await res.json();
      if (json.success && json.data) {
        this.status.connected = true;
        this.status.serverRevision = json.revision || 1;
        this.currentRevision = json.revision || 1;
        this.status.localRevision = this.currentRevision;
        this.status.lastSyncTime = new Date().toLocaleTimeString();
        localStorage.setItem('plmsys_sync_revision', String(this.currentRevision));

        // Atomically replace local IndexedDB with central database
        await this.populateLocalDbFromPayload(json.data);
        this.notifyStatus();
        this.connectSSE();
        this.startBackgroundSync();
        return true;
      }
    } catch (err) {
      console.warn('[PLMSys Sync] Initial sync failed, fallback to local cache:', err);
      this.status.connected = false;
      this.notifyStatus();
      this.startBackgroundSync();
    }
    return false;
  }

  /**
   * Background polling loop to detect remote changes from other tablets/browsers
   */
  public startBackgroundSync() {
    if (this.syncInterval) clearInterval(this.syncInterval);

    this.syncInterval = setInterval(async () => {
      await this.checkForRemoteUpdates();
    }, 2500);

    // Also check immediately when browser tab regains focus
    window.addEventListener('focus', () => {
      this.checkForRemoteUpdates();
    });
  }

  public stopBackgroundSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    if (this.eventSource) {
      try {
        this.eventSource.close();
      } catch {
        // ignore
      }
      this.eventSource = null;
    }
  }

  /**
   * Checks if server revision differs from local revision
   */
  public async checkForRemoteUpdates() {
    if (this.isSyncing) return;

    try {
      const res = await fetch(`/api/sync/version?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      if (!res.ok) {
        if (this.status.connected) {
          this.status.connected = false;
          this.notifyStatus();
        }
        return;
      }

      const json = await res.json();
      if (json.success) {
        const wasConnected = this.status.connected;
        this.status.connected = true;
        this.status.serverRevision = json.revision;

        // If server revision differs from local revision, pull immediately
        if (json.revision !== this.currentRevision) {
          console.log(`[PLMSys Sync] Remote update detected (local: ${this.currentRevision} -> server: ${json.revision}). Syncing...`);
          await this.pullFromServer();
        } else if (!wasConnected) {
          this.notifyStatus();
        }
      }
    } catch {
      if (this.status.connected) {
        this.status.connected = false;
        this.notifyStatus();
      }
    }
  }

  /**
   * Pulls the complete dataset from the central Node server and updates local Dexie
   */
  public async pullFromServer(force = false): Promise<boolean> {
    if (this.isSyncing && !force) return false;
    this.isSyncing = true;

    try {
      const res = await fetch(`/api/sync/all?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      if (!res.ok) return false;

      const json = await res.json();
      if (json.success && json.data) {
        this.currentRevision = json.revision || (this.currentRevision + 1);
        this.status.connected = true;
        this.status.serverRevision = this.currentRevision;
        this.status.localRevision = this.currentRevision;
        this.status.lastSyncTime = new Date().toLocaleTimeString();
        localStorage.setItem('plmsys_sync_revision', String(this.currentRevision));

        await this.populateLocalDbFromPayload(json.data);

        if (this.onRemoteDataChangedCallback) {
          await this.onRemoteDataChangedCallback();
        }

        this.notifyStatus();
        return true;
      }
    } catch (err) {
      console.warn('[PLMSys Sync] Failed to pull latest data from server:', err);
    } finally {
      this.isSyncing = false;
    }
    return false;
  }

  /**
   * User or system-initiated force hard refresh:
   * Clears browser cache, resets revision, and pulls pristine database from server
   */
  public async forceHardRefreshFromServer(): Promise<boolean> {
    await this.clearBrowserCache();
    this.currentRevision = 0;
    localStorage.removeItem('plmsys_sync_revision');
    const success = await this.pullFromServer(true);
    return success;
  }

  /**
   * Pushes the current client state to the central Node server
   */
  public async pushToServer(): Promise<boolean> {
    try {
      const [
        sets,
        positions,
        plates,
        installations,
        removals,
        production,
        replacements,
        jobOrders,
        auditLogs,
        personnel
      ] = await Promise.all([
        db.sets.toArray().catch(() => []),
        db.positions.toArray().catch(() => []),
        db.plates.toArray().catch(() => []),
        db.plateInstallations.toArray().catch(() => []),
        db.plateRemovals.toArray().catch(() => []),
        db.dailyProduction.toArray().catch(() => []),
        db.replacements.toArray().catch(() => []),
        db.jobOrders.toArray().catch(() => []),
        db.auditLogs.toArray().catch(() => []),
        db.personnel.toArray().catch(() => [])
      ]);

      const payload: ServerSyncPayload = {
        sets,
        positions,
        plates,
        installations,
        removals,
        production,
        replacements,
        jobOrders,
        auditLogs,
        personnel
      };

      const res = await fetch('/api/sync/all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data: payload })
      });

      if (!res.ok) {
        this.status.connected = false;
        this.notifyStatus();
        return false;
      }

      const json = await res.json();
      if (json.success) {
        this.status.connected = true;
        this.currentRevision = json.revision || (this.currentRevision + 1);
        this.status.serverRevision = this.currentRevision;
        this.status.localRevision = this.currentRevision;
        this.status.lastSyncTime = new Date().toLocaleTimeString();
        localStorage.setItem('plmsys_sync_revision', String(this.currentRevision));
        this.notifyStatus();
        return true;
      }
    } catch (err) {
      console.warn('[PLMSys Sync] Failed to push to central server:', err);
      this.status.connected = false;
      this.notifyStatus();
    }
    return false;
  }

  /**
   * Atomically overwrites local Dexie tables with server payload
   */
  private async populateLocalDbFromPayload(payload: ServerSyncPayload) {
    if (!payload) return;

    await db.transaction('rw', [
      db.sets,
      db.positions,
      db.plates,
      db.plateInstallations,
      db.plateRemovals,
      db.dailyProduction,
      db.replacements,
      db.jobOrders,
      db.auditLogs,
      db.personnel
    ], async () => {
      // Unconditionally wipe all local IndexedDB tables so this PC's local cache mirrors the central database exactly
      await Promise.all([
        db.sets.clear(),
        db.positions.clear(),
        db.plates.clear(),
        db.plateInstallations.clear(),
        db.plateRemovals.clear(),
        db.dailyProduction.clear(),
        db.replacements.clear(),
        db.jobOrders.clear(),
        db.auditLogs.clear(),
        db.personnel.clear()
      ]);

      if (payload.sets && payload.sets.length > 0) {
        await db.sets.bulkPut(payload.sets);
      }
      if (payload.positions && payload.positions.length > 0) {
        await db.positions.bulkPut(payload.positions);
      }
      if (payload.plates && payload.plates.length > 0) {
        await db.plates.bulkPut(payload.plates);
      }
      if (payload.installations && payload.installations.length > 0) {
        await db.plateInstallations.bulkPut(payload.installations);
      }
      if (payload.removals && payload.removals.length > 0) {
        await db.plateRemovals.bulkPut(payload.removals);
      }
      if (payload.production && payload.production.length > 0) {
        await db.dailyProduction.bulkPut(payload.production);
      }
      if (payload.replacements && payload.replacements.length > 0) {
        await db.replacements.bulkPut(payload.replacements);
      }
      if (payload.jobOrders && payload.jobOrders.length > 0) {
        await db.jobOrders.bulkPut(payload.jobOrders);
      }
      if (payload.auditLogs && payload.auditLogs.length > 0) {
        await db.auditLogs.bulkPut(payload.auditLogs);
      }
      if (payload.personnel && payload.personnel.length > 0) {
        await db.personnel.bulkPut(payload.personnel);
      }
    });

    localStorage.setItem('plmsys_browser_initialized', 'true');
  }

  public getStatus(): SyncStatus {
    return { ...this.status };
  }
}

export const centralSync = new CentralSyncService();
