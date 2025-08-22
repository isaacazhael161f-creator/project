/**
 * Tests for StorageManager
 * Covers automated storage management, monitoring, and backup functionality
 */

import {
  StorageManager,
  DEFAULT_CONFIG,
  getStorageManager,
  initializeStorageManagement,
  StorageEvent
} from '../storageManager';

// Mock the storage utilities
jest.mock('../storage', () => ({
  getStorageInfo: jest.fn(),
  isCleanupNeeded: jest.fn(),
  performAutomaticCleanup: jest.fn(),
  exportBackup: jest.fn(),
  importBackup: jest.fn(),
  getAllManifiestos: jest.fn()
}));

import {
  getStorageInfo,
  isCleanupNeeded,
  performAutomaticCleanup,
  exportBackup,
  importBackup,
  getAllManifiestos
} from '../storage';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  key: jest.fn(),
  length: 0
};

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

// Mock timers
jest.useFakeTimers();

describe('StorageManager', () => {
  let storageManager: StorageManager;
  let mockEventListener: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    
    storageManager = new StorageManager();
    mockEventListener = jest.fn();
    
    // Reset localStorage mock
    mockLocalStorage.length = 0;
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.key.mockReturnValue(null);
  });

  afterEach(() => {
    storageManager.stop();
  });

  describe('Configuration', () => {
    it('should use default configuration', () => {
      const manager = new StorageManager();
      expect(manager['config']).toEqual(DEFAULT_CONFIG);
    });

    it('should merge custom configuration with defaults', () => {
      const customConfig = {
        cleanupThreshold: 90,
        autoBackupEnabled: true
      };
      
      const manager = new StorageManager(customConfig);
      expect(manager['config']).toEqual({
        ...DEFAULT_CONFIG,
        ...customConfig
      });
    });

    it('should update configuration', () => {
      storageManager.addEventListener(mockEventListener);
      
      const newConfig = { cleanupThreshold: 85 };
      storageManager.updateConfig(newConfig);
      
      expect(storageManager['config'].cleanupThreshold).toBe(85);
      expect(mockEventListener).toHaveBeenCalledWith('configUpdated', {
        oldConfig: DEFAULT_CONFIG,
        newConfig: { ...DEFAULT_CONFIG, ...newConfig }
      });
    });
  });

  describe('Monitoring and Cleanup', () => {
    beforeEach(() => {
      (getStorageInfo as jest.Mock).mockResolvedValue({
        used: 500000,
        quota: 1000000,
        count: 10,
        usagePercentage: 50
      });
      
      (isCleanupNeeded as jest.Mock).mockResolvedValue(false);
      (performAutomaticCleanup as jest.Mock).mockResolvedValue({
        deletedCount: 5,
        remainingCount: 5,
        newUsagePercentage: 30
      });
    });

    it('should start monitoring', () => {
      storageManager.addEventListener(mockEventListener);
      storageManager.start();
      
      expect(mockEventListener).toHaveBeenCalledWith('started', {
        config: DEFAULT_CONFIG
      });
    });

    it('should stop monitoring', () => {
      storageManager.addEventListener(mockEventListener);
      storageManager.start();
      storageManager.stop();
      
      expect(mockEventListener).toHaveBeenCalledWith('stopped', {});
    });

    it('should check storage periodically', async () => {
      storageManager.addEventListener(mockEventListener);
      storageManager.start();
      
      // Fast forward time to trigger monitoring
      jest.advanceTimersByTime(DEFAULT_CONFIG.monitoringInterval);
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(getStorageInfo).toHaveBeenCalled();
      expect(mockEventListener).toHaveBeenCalledWith('storageChecked', {
        storageInfo: expect.any(Object)
      });
    });

    it('should perform cleanup when needed', async () => {
      (isCleanupNeeded as jest.Mock).mockResolvedValue(true);
      
      storageManager.addEventListener(mockEventListener);
      
      const result = await storageManager.checkAndCleanup();
      
      expect(result.cleanupPerformed).toBe(true);
      expect(performAutomaticCleanup).toHaveBeenCalledWith(
        DEFAULT_CONFIG.targetUsage,
        DEFAULT_CONFIG.minRetainCount
      );
      
      expect(mockEventListener).toHaveBeenCalledWith('cleanupStarted', {
        storageInfo: expect.any(Object)
      });
      
      expect(mockEventListener).toHaveBeenCalledWith('cleanupCompleted', {
        storageInfo: expect.any(Object),
        cleanupResult: expect.any(Object)
      });
    });

    it('should not perform cleanup when not needed', async () => {
      (isCleanupNeeded as jest.Mock).mockResolvedValue(false);
      
      const result = await storageManager.checkAndCleanup();
      
      expect(result.cleanupPerformed).toBe(false);
      expect(performAutomaticCleanup).not.toHaveBeenCalled();
    });

    it('should handle cleanup errors', async () => {
      const error = new Error('Cleanup failed');
      (getStorageInfo as jest.Mock).mockRejectedValue(error);
      
      storageManager.addEventListener(mockEventListener);
      
      await expect(storageManager.checkAndCleanup()).rejects.toThrow('Cleanup failed');
      
      expect(mockEventListener).toHaveBeenCalledWith('error', {
        error: 'Cleanup failed',
        operation: 'checkAndCleanup'
      });
    });
  });

  describe('Automatic Backup', () => {
    beforeEach(() => {
      (exportBackup as jest.Mock).mockResolvedValue('{"backup": "data"}');
    });

    it('should start automatic backup when enabled', () => {
      const manager = new StorageManager({ autoBackupEnabled: true });
      manager.addEventListener(mockEventListener);
      manager.start();
      
      expect(mockEventListener).toHaveBeenCalledWith('started', {
        config: expect.objectContaining({ autoBackupEnabled: true })
      });
    });

    it('should perform automatic backup', async () => {
      storageManager.addEventListener(mockEventListener);
      
      const backupKey = await storageManager.performAutoBackup();
      
      expect(exportBackup).toHaveBeenCalled();
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        backupKey,
        '{"backup": "data"}'
      );
      
      expect(mockEventListener).toHaveBeenCalledWith('backupStarted', {});
      expect(mockEventListener).toHaveBeenCalledWith('backupCompleted', {
        backupKey
      });
    });

    it('should clean up old backups', async () => {
      const now = Date.now();
      const oldBackupKey = `autobackup_${now - 8 * 24 * 60 * 60 * 1000}`; // 8 days old
      const newBackupKey = `autobackup_${now - 1 * 24 * 60 * 60 * 1000}`; // 1 day old
      
      mockLocalStorage.length = 2;
      mockLocalStorage.key
        .mockReturnValueOnce(oldBackupKey)
        .mockReturnValueOnce(newBackupKey);
      
      storageManager.addEventListener(mockEventListener);
      await storageManager.performAutoBackup();
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(oldBackupKey);
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalledWith(newBackupKey);
      
      expect(mockEventListener).toHaveBeenCalledWith('oldBackupsCleanedUp', {
        deletedCount: 1
      });
    });

    it('should handle backup errors', async () => {
      const error = new Error('Backup failed');
      (exportBackup as jest.Mock).mockRejectedValue(error);
      
      storageManager.addEventListener(mockEventListener);
      
      await expect(storageManager.performAutoBackup()).rejects.toThrow('Backup failed');
      
      expect(mockEventListener).toHaveBeenCalledWith('error', {
        error: 'Backup failed',
        operation: 'performAutoBackup'
      });
    });
  });

  describe('Backup Management', () => {
    it('should get available backups', () => {
      const now = Date.now();
      const backup1Key = `autobackup_${now - 1000}`;
      const backup2Key = `autobackup_${now - 2000}`;
      const backup1Data = '{"data": "backup1"}';
      const backup2Data = '{"data": "backup2"}';
      
      mockLocalStorage.length = 2;
      mockLocalStorage.key
        .mockReturnValueOnce(backup1Key)
        .mockReturnValueOnce(backup2Key);
      mockLocalStorage.getItem
        .mockReturnValueOnce(backup1Data)
        .mockReturnValueOnce(backup2Data);
      
      const backups = storageManager.getAvailableBackups();
      
      expect(backups).toHaveLength(2);
      expect(backups[0].key).toBe(backup1Key); // Newest first
      expect(backups[1].key).toBe(backup2Key);
      expect(backups[0].size).toBe(backup1Data.length);
    });

    it('should restore from backup', async () => {
      const backupKey = 'autobackup_123456789';
      const backupData = '{"backup": "data"}';
      const importResult = { imported: 5, skipped: 0, errors: [] };
      
      mockLocalStorage.getItem.mockReturnValue(backupData);
      (importBackup as jest.Mock).mockResolvedValue(importResult);
      
      storageManager.addEventListener(mockEventListener);
      
      const result = await storageManager.restoreFromBackup(backupKey);
      
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(backupKey);
      expect(importBackup).toHaveBeenCalledWith(backupData, {});
      expect(result).toEqual(importResult);
      
      expect(mockEventListener).toHaveBeenCalledWith('restoreStarted', { backupKey });
      expect(mockEventListener).toHaveBeenCalledWith('restoreCompleted', {
        backupKey,
        result: importResult
      });
    });

    it('should handle missing backup during restore', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      await expect(storageManager.restoreFromBackup('missing-backup'))
        .rejects.toThrow('Backup not found: missing-backup');
    });

    it('should handle restore errors', async () => {
      const backupKey = 'autobackup_123456789';
      const backupData = '{"backup": "data"}';
      const error = new Error('Restore failed');
      
      mockLocalStorage.getItem.mockReturnValue(backupData);
      (importBackup as jest.Mock).mockRejectedValue(error);
      
      storageManager.addEventListener(mockEventListener);
      
      await expect(storageManager.restoreFromBackup(backupKey)).rejects.toThrow('Restore failed');
      
      expect(mockEventListener).toHaveBeenCalledWith('error', {
        error: 'Restore failed',
        operation: 'restoreFromBackup',
        backupKey
      });
    });
  });

  describe('Storage Statistics', () => {
    it('should get comprehensive storage stats', async () => {
      const mockStorageInfo = {
        used: 500000,
        quota: 1000000,
        count: 15,
        usagePercentage: 50
      };
      
      const mockManifiestos = [
        {
          id: '1',
          data: { fecha: '2024-01-15' },
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15')
        },
        {
          id: '2',
          data: { fecha: '2024-02-10' },
          createdAt: new Date('2024-02-10'),
          updatedAt: new Date('2024-02-10')
        }
      ];
      
      (getStorageInfo as jest.Mock).mockResolvedValue(mockStorageInfo);
      (getAllManifiestos as jest.Mock).mockResolvedValue(mockManifiestos);
      
      // Mock backups
      const now = Date.now();
      mockLocalStorage.length = 2;
      mockLocalStorage.key
        .mockReturnValueOnce(`autobackup_${now - 1000}`)
        .mockReturnValueOnce(`autobackup_${now - 2000}`);
      mockLocalStorage.getItem
        .mockReturnValueOnce('{"data": "backup1"}')
        .mockReturnValueOnce('{"data": "backup2"}');
      
      const stats = await storageManager.getStorageStats();
      
      expect(stats.storage).toEqual(mockStorageInfo);
      expect(stats.manifiestos.total).toBe(2);
      expect(stats.manifiestos.byMonth).toEqual({
        '2024-01': 1,
        '2024-02': 1
      });
      expect(stats.backups.count).toBe(2);
    });
  });

  describe('Event Handling', () => {
    it('should add and remove event listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      storageManager.addEventListener(listener1);
      storageManager.addEventListener(listener2);
      
      // Trigger an event
      storageManager['notifyListeners']('started', { test: true });
      
      expect(listener1).toHaveBeenCalledWith('started', { test: true });
      expect(listener2).toHaveBeenCalledWith('started', { test: true });
      
      // Remove one listener
      storageManager.removeEventListener(listener1);
      
      // Trigger another event
      storageManager['notifyListeners']('stopped', {});
      
      expect(listener1).toHaveBeenCalledTimes(1); // Not called again
      expect(listener2).toHaveBeenCalledTimes(2); // Called again
    });

    it('should handle listener errors gracefully', () => {
      const errorListener = jest.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });
      const normalListener = jest.fn();
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      storageManager.addEventListener(errorListener);
      storageManager.addEventListener(normalListener);
      
      storageManager['notifyListeners']('started', {});
      
      expect(consoleSpy).toHaveBeenCalledWith('Error in storage event listener:', expect.any(Error));
      expect(normalListener).toHaveBeenCalled(); // Should still be called
      
      consoleSpy.mockRestore();
    });
  });

  describe('Global Instance Management', () => {
    it('should create and return global storage manager', () => {
      const manager1 = getStorageManager();
      const manager2 = getStorageManager();
      
      expect(manager1).toBe(manager2); // Same instance
    });

    it('should update global manager config', () => {
      const manager = getStorageManager({ cleanupThreshold: 90 });
      expect(manager['config'].cleanupThreshold).toBe(90);
      
      // Update config
      getStorageManager({ targetUsage: 60 });
      expect(manager['config'].targetUsage).toBe(60);
      expect(manager['config'].cleanupThreshold).toBe(90); // Should retain previous config
    });

    it('should initialize storage management', () => {
      const manager = initializeStorageManagement({ autoBackupEnabled: true });
      
      expect(manager['config'].autoBackupEnabled).toBe(true);
      // Should have started monitoring (timers would be set)
    });
  });
});