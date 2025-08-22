/**
 * Storage Manager - High-level storage management utilities
 * Provides automated storage management, monitoring, and maintenance
 */

import {
  getStorageInfo,
  isCleanupNeeded,
  performAutomaticCleanup,
  exportBackup,
  importBackup,
  getAllManifiestos,
  deleteManifiesto
} from './storage';

export interface StorageManagerConfig {
  // Cleanup thresholds
  cleanupThreshold: number; // Percentage at which to trigger cleanup
  targetUsage: number; // Target usage percentage after cleanup
  minRetainCount: number; // Minimum number of manifiestos to retain
  
  // Monitoring intervals
  monitoringInterval: number; // Milliseconds between storage checks
  
  // Backup settings
  autoBackupEnabled: boolean;
  backupInterval: number; // Milliseconds between automatic backups
  maxBackupAge: number; // Maximum age of backups to retain (milliseconds)
}

export const DEFAULT_CONFIG: StorageManagerConfig = {
  cleanupThreshold: 80,
  targetUsage: 70,
  minRetainCount: 10,
  monitoringInterval: 60000, // 1 minute
  autoBackupEnabled: false,
  backupInterval: 86400000, // 24 hours
  maxBackupAge: 604800000 // 7 days
};

export class StorageManager {
  private config: StorageManagerConfig;
  private monitoringTimer: ReturnType<typeof setInterval> | null = null;
  private backupTimer: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<StorageEventListener> = new Set();

  constructor(config: Partial<StorageManagerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Start automatic storage monitoring and management
   */
  start(): void {
    this.stop(); // Stop any existing timers

    // Start storage monitoring
    this.monitoringTimer = setInterval(async () => {
      await this.checkAndCleanup();
    }, this.config.monitoringInterval);

    // Start automatic backup if enabled
    if (this.config.autoBackupEnabled) {
      this.backupTimer = setInterval(async () => {
        await this.performAutoBackup();
      }, this.config.backupInterval);
    }

    this.notifyListeners('started', { config: this.config });
  }

  /**
   * Stop automatic storage monitoring and management
   */
  stop(): void {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
    }

    if (this.backupTimer) {
      clearInterval(this.backupTimer);
      this.backupTimer = null;
    }

    this.notifyListeners('stopped', {});
  }

  /**
   * Check storage usage and perform cleanup if needed
   */
  async checkAndCleanup(): Promise<{
    cleanupPerformed: boolean;
    storageInfo: Awaited<ReturnType<typeof getStorageInfo>>;
    cleanupResult?: Awaited<ReturnType<typeof performAutomaticCleanup>>;
  }> {
    try {
      const storageInfo = await getStorageInfo();
      this.notifyListeners('storageChecked', { storageInfo });

      const needsCleanup = await isCleanupNeeded(this.config.cleanupThreshold);

      if (needsCleanup) {
        this.notifyListeners('cleanupStarted', { storageInfo });
        
        const cleanupResult = await performAutomaticCleanup(
          this.config.targetUsage,
          this.config.minRetainCount
        );

        this.notifyListeners('cleanupCompleted', { 
          storageInfo, 
          cleanupResult 
        });

        return {
          cleanupPerformed: true,
          storageInfo,
          cleanupResult
        };
      }

      return {
        cleanupPerformed: false,
        storageInfo
      };

    } catch (error) {
      this.notifyListeners('error', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        operation: 'checkAndCleanup'
      });
      throw error;
    }
  }

  /**
   * Perform automatic backup
   */
  async performAutoBackup(): Promise<string> {
    try {
      this.notifyListeners('backupStarted', {});
      
      const backupData = await exportBackup();
      const backupKey = `autobackup_${Date.now()}`;
      
      // Store backup in localStorage (for web) or other persistent storage
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(backupKey, backupData);
        
        // Clean up old backups
        await this.cleanupOldBackups();
      }

      this.notifyListeners('backupCompleted', { backupKey });
      return backupKey;

    } catch (error) {
      this.notifyListeners('error', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        operation: 'performAutoBackup'
      });
      throw error;
    }
  }

  /**
   * Clean up old automatic backups
   */
  private async cleanupOldBackups(): Promise<void> {
    if (typeof localStorage === 'undefined') return;

    const now = Date.now();
    const keysToDelete: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('autobackup_')) {
        const timestamp = parseInt(key.replace('autobackup_', ''));
        if (now - timestamp > this.config.maxBackupAge) {
          keysToDelete.push(key);
        }
      }
    }

    keysToDelete.forEach(key => localStorage.removeItem(key));
    
    if (keysToDelete.length > 0) {
      this.notifyListeners('oldBackupsCleanedUp', { 
        deletedCount: keysToDelete.length 
      });
    }
  }

  /**
   * Get available automatic backups
   */
  getAvailableBackups(): Array<{ key: string; timestamp: Date; size: number }> {
    if (typeof localStorage === 'undefined') return [];

    const backups: Array<{ key: string; timestamp: Date; size: number }> = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('autobackup_')) {
        const timestamp = parseInt(key.replace('autobackup_', ''));
        const data = localStorage.getItem(key);
        
        backups.push({
          key,
          timestamp: new Date(timestamp),
          size: data ? data.length : 0
        });
      }
    }

    return backups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Restore from automatic backup
   */
  async restoreFromBackup(
    backupKey: string,
    options: Parameters<typeof importBackup>[1] = {}
  ): Promise<Awaited<ReturnType<typeof importBackup>>> {
    if (typeof localStorage === 'undefined') {
      throw new Error('localStorage not available');
    }

    const backupData = localStorage.getItem(backupKey);
    if (!backupData) {
      throw new Error(`Backup not found: ${backupKey}`);
    }

    this.notifyListeners('restoreStarted', { backupKey });

    try {
      const result = await importBackup(backupData, options);
      this.notifyListeners('restoreCompleted', { backupKey, result });
      return result;
    } catch (error) {
      this.notifyListeners('error', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        operation: 'restoreFromBackup',
        backupKey
      });
      throw error;
    }
  }

  /**
   * Get current storage statistics
   */
  async getStorageStats(): Promise<{
    storage: Awaited<ReturnType<typeof getStorageInfo>>;
    manifiestos: {
      total: number;
      byMonth: Record<string, number>;
      oldestDate: Date | null;
      newestDate: Date | null;
    };
    backups: {
      count: number;
      totalSize: number;
      oldest: Date | null;
      newest: Date | null;
    };
  }> {
    const storage = await getStorageInfo();
    const manifiestos = await getAllManifiestos();
    const backups = this.getAvailableBackups();

    // Analyze manifiestos by month
    const byMonth: Record<string, number> = {};
    let oldestDate: Date | null = null;
    let newestDate: Date | null = null;

    manifiestos.forEach(m => {
      const date = new Date(m.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      byMonth[monthKey] = (byMonth[monthKey] || 0) + 1;

      if (!oldestDate || date < oldestDate) oldestDate = date;
      if (!newestDate || date > newestDate) newestDate = date;
    });

    // Analyze backups
    const backupStats = {
      count: backups.length,
      totalSize: backups.reduce((sum, b) => sum + b.size, 0),
      oldest: backups.length > 0 ? backups[backups.length - 1].timestamp : null,
      newest: backups.length > 0 ? backups[0].timestamp : null
    };

    return {
      storage,
      manifiestos: {
        total: manifiestos.length,
        byMonth,
        oldestDate,
        newestDate
      },
      backups: backupStats
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<StorageManagerConfig>): void {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...newConfig };
    
    this.notifyListeners('configUpdated', { 
      oldConfig, 
      newConfig: this.config 
    });

    // Restart if monitoring interval changed
    if (oldConfig.monitoringInterval !== this.config.monitoringInterval ||
        oldConfig.autoBackupEnabled !== this.config.autoBackupEnabled ||
        oldConfig.backupInterval !== this.config.backupInterval) {
      if (this.monitoringTimer || this.backupTimer) {
        this.start();
      }
    }
  }

  /**
   * Add event listener
   */
  addEventListener(listener: StorageEventListener): void {
    this.listeners.add(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener(listener: StorageEventListener): void {
    this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of an event
   */
  private notifyListeners(event: StorageEvent, data: any): void {
    this.listeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error('Error in storage event listener:', error);
      }
    });
  }
}

// Event types and listener interface
export type StorageEvent = 
  | 'started'
  | 'stopped'
  | 'storageChecked'
  | 'cleanupStarted'
  | 'cleanupCompleted'
  | 'backupStarted'
  | 'backupCompleted'
  | 'oldBackupsCleanedUp'
  | 'restoreStarted'
  | 'restoreCompleted'
  | 'configUpdated'
  | 'error';

export type StorageEventListener = (event: StorageEvent, data: any) => void;

// Singleton instance for global use
let globalStorageManager: StorageManager | null = null;

/**
 * Get the global storage manager instance
 */
export const getStorageManager = (config?: Partial<StorageManagerConfig>): StorageManager => {
  if (!globalStorageManager) {
    globalStorageManager = new StorageManager(config);
  } else if (config) {
    globalStorageManager.updateConfig(config);
  }
  return globalStorageManager;
};

/**
 * Initialize storage management with default settings
 */
export const initializeStorageManagement = (config?: Partial<StorageManagerConfig>): StorageManager => {
  const manager = getStorageManager(config);
  manager.start();
  return manager;
};