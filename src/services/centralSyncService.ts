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
   * Initial synchronization with Node.js Server on application boot
   */
  public async initSync(): Promise<boolean> {
    try {
      const res = await fetch('/api/sync/all', {
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!res.ok) {
        this.status.connected = false;
        this.notifyStatus();
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

        // Populate local IndexedDB from the central server
        await this.populateLocalDbFromPayload(json.data);
        this.notifyStatus();
        this.startBackgroundSync();
        return true;
      }
    } catch {
      this.status.connected = false;
      this.notifyStatus();
      // Retry periodically even if initially offline
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
    }, 3500);

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
  }

  /**
   * Checks if server revision is higher than local revision
   */
  public async checkForRemoteUpdates() {
    if (this.isSyncing) return;

    try {
      const res = await fetch('/api/sync/version', {
        headers: { 'Cache-Control': 'no-cache' }
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

        // If server has newer data than we have locally, pull and apply
        if (json.revision > this.currentRevision) {
          console.log(`[PLMSys Sync] Remote update detected (rev ${this.currentRevision} -> ${json.revision}). Syncing...`);
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
  public async pullFromServer() {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      const res = await fetch('/api/sync/all', {
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!res.ok) return;

      const json = await res.json();
      if (json.success && json.data) {
        this.currentRevision = json.revision || (this.currentRevision + 1);
        this.status.serverRevision = this.currentRevision;
        this.status.localRevision = this.currentRevision;
        this.status.lastSyncTime = new Date().toLocaleTimeString();
        localStorage.setItem('plmsys_sync_revision', String(this.currentRevision));

        await this.populateLocalDbFromPayload(json.data);

        if (this.onRemoteDataChangedCallback) {
          await this.onRemoteDataChangedCallback();
        }

        this.notifyStatus();
      }
    } catch (err) {
      console.warn('[PLMSys Sync] Failed to pull latest data from server:', err);
    } finally {
      this.isSyncing = false;
    }
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
      if (payload.sets && payload.sets.length > 0) {
        await db.sets.clear();
        await db.sets.bulkPut(payload.sets);
      }
      if (payload.positions && payload.positions.length > 0) {
        await db.positions.clear();
        await db.positions.bulkPut(payload.positions);
      }
      if (payload.plates && payload.plates.length > 0) {
        await db.plates.clear();
        await db.plates.bulkPut(payload.plates);
      }
      if (payload.installations && payload.installations.length > 0) {
        await db.plateInstallations.clear();
        await db.plateInstallations.bulkPut(payload.installations);
      }
      if (payload.removals) {
        await db.plateRemovals.clear();
        if (payload.removals.length > 0) await db.plateRemovals.bulkPut(payload.removals);
      }
      if (payload.production) {
        await db.dailyProduction.clear();
        if (payload.production.length > 0) await db.dailyProduction.bulkPut(payload.production);
      }
      if (payload.replacements) {
        await db.replacements.clear();
        if (payload.replacements.length > 0) await db.replacements.bulkPut(payload.replacements);
      }
      if (payload.jobOrders && payload.jobOrders.length > 0) {
        await db.jobOrders.clear();
        await db.jobOrders.bulkPut(payload.jobOrders);
      }
      if (payload.auditLogs && payload.auditLogs.length > 0) {
        await db.auditLogs.clear();
        await db.auditLogs.bulkPut(payload.auditLogs);
      }
      if (payload.personnel && payload.personnel.length > 0) {
        await db.personnel.clear();
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
