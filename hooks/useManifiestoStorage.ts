/**
 * React hook for manifiesto storage operations
 * Provides easy access to storage functionality with React state management
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  saveManifiesto,
  updateManifiesto,
  getManifiesto,
  getAllManifiestos,
  deleteManifiesto,
  getStorageInfo,
  getManifiestosPaginated,
  searchManifiestos,
  exportBackup,
  importBackup
} from '../utils/manifiesto/storage';
import {
  StorageManager,
  getStorageManager,
  StorageEvent,
  StorageEventListener
} from '../utils/manifiesto/storageManager';
import { ManifiestoData, StoredManifiesto } from '../types/manifiesto';

export interface UseManifiestoStorageOptions {
  autoCleanup?: boolean;
  cleanupThreshold?: number;
  enableBackup?: boolean;
  pageSize?: number;
}

export interface StorageState {
  manifiestos: StoredManifiesto[];
  currentManifiesto: StoredManifiesto | null;
  loading: boolean;
  error: string | null;
  storageInfo: {
    used: number;
    quota: number;
    count: number;
    usagePercentage: number;
  } | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
  };
}

export interface StorageActions {
  // CRUD operations
  save: (data: ManifiestoData) => Promise<string>;
  update: (id: string, data: ManifiestoData) => Promise<void>;
  load: (id: string) => Promise<StoredManifiesto | null>;
  remove: (id: string) => Promise<void>;
  
  // List operations
  loadAll: () => Promise<StoredManifiesto[]>;
  loadPage: (page: number) => Promise<void>;
  search: (criteria: Parameters<typeof searchManifiestos>[0]) => Promise<StoredManifiesto[]>;
  
  // Storage management
  refreshStorageInfo: () => Promise<void>;
  performCleanup: () => Promise<void>;
  
  // Backup operations
  createBackup: () => Promise<string>;
  restoreBackup: (backupData: string, options?: Parameters<typeof importBackup>[1]) => Promise<void>;
  
  // State management
  clearError: () => void;
  setCurrentManifiesto: (manifiesto: StoredManifiesto | null) => void;
}

const initialState: StorageState = {
  manifiestos: [],
  currentManifiesto: null,
  loading: false,
  error: null,
  storageInfo: null,
  pagination: {
    currentPage: 1,
    totalPages: 0,
    totalCount: 0
  }
};

export const useManifiestoStorage = (options: UseManifiestoStorageOptions = {}): [StorageState, StorageActions] => {
  const {
    autoCleanup = true,
    cleanupThreshold = 80,
    enableBackup = false,
    pageSize = 10
  } = options;

  const [state, setState] = useState<StorageState>(initialState);
  const storageManagerRef = useRef<StorageManager | null>(null);
  const eventListenerRef = useRef<StorageEventListener | null>(null);

  // Initialize storage manager
  useEffect(() => {
    if (autoCleanup || enableBackup) {
      storageManagerRef.current = getStorageManager({
        cleanupThreshold,
        autoBackupEnabled: enableBackup
      });

      // Create event listener
      eventListenerRef.current = (event: StorageEvent, data: any) => {
        switch (event) {
          case 'cleanupCompleted':
            setState(prev => ({
              ...prev,
              storageInfo: data.storageInfo
            }));
            break;
          case 'error':
            setState(prev => ({
              ...prev,
              error: data.error
            }));
            break;
        }
      };

      storageManagerRef.current.addEventListener(eventListenerRef.current);
      
      if (autoCleanup) {
        storageManagerRef.current.start();
      }
    }

    return () => {
      if (storageManagerRef.current && eventListenerRef.current) {
        storageManagerRef.current.removeEventListener(eventListenerRef.current);
        storageManagerRef.current.stop();
      }
    };
  }, [autoCleanup, enableBackup, cleanupThreshold]);

  // Load initial data
  useEffect(() => {
    refreshStorageInfo();
    loadPage(1);
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  const refreshStorageInfo = useCallback(async () => {
    try {
      const info = await getStorageInfo();
      setState(prev => ({ ...prev, storageInfo: info }));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to get storage info');
    }
  }, [setError]);

  const save = useCallback(async (data: ManifiestoData): Promise<string> => {
    setLoading(true);
    setError(null);
    
    try {
      const id = await saveManifiesto(data);
      await refreshStorageInfo();
      await loadPage(state.pagination.currentPage); // Refresh current page
      return id;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save manifiesto';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [state.pagination.currentPage, refreshStorageInfo, setLoading, setError]);

  const update = useCallback(async (id: string, data: ManifiestoData): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await updateManifiesto(id, data);
      await refreshStorageInfo();
      await loadPage(state.pagination.currentPage); // Refresh current page
      
      // Update current manifiesto if it's the one being updated
      if (state.currentManifiesto?.id === id) {
        setState(prev => ({
          ...prev,
          currentManifiesto: {
            ...prev.currentManifiesto!,
            data,
            updatedAt: new Date()
          }
        }));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update manifiesto';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [state.pagination.currentPage, state.currentManifiesto, refreshStorageInfo, setLoading, setError]);

  const load = useCallback(async (id: string): Promise<StoredManifiesto | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const manifiesto = await getManifiesto(id);
      return manifiesto;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load manifiesto';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const remove = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await deleteManifiesto(id);
      await refreshStorageInfo();
      await loadPage(state.pagination.currentPage); // Refresh current page
      
      // Clear current manifiesto if it's the one being deleted
      if (state.currentManifiesto?.id === id) {
        setState(prev => ({ ...prev, currentManifiesto: null }));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete manifiesto';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [state.pagination.currentPage, state.currentManifiesto, refreshStorageInfo, setLoading, setError]);

  const loadAll = useCallback(async (): Promise<StoredManifiesto[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const manifiestos = await getAllManifiestos();
      setState(prev => ({ ...prev, manifiestos }));
      return manifiestos;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load manifiestos';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const loadPage = useCallback(async (page: number): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getManifiestosPaginated(page, pageSize);
      setState(prev => ({
        ...prev,
        manifiestos: result.manifiestos,
        pagination: {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          totalCount: result.totalCount
        }
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load page';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [pageSize, setLoading, setError]);

  const search = useCallback(async (criteria: Parameters<typeof searchManifiestos>[0]): Promise<StoredManifiesto[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const results = await searchManifiestos(criteria);
      setState(prev => ({ ...prev, manifiestos: results }));
      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to search manifiestos';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const performCleanup = useCallback(async (): Promise<void> => {
    if (!storageManagerRef.current) {
      throw new Error('Storage manager not initialized');
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await storageManagerRef.current.checkAndCleanup();
      await refreshStorageInfo();
      await loadPage(state.pagination.currentPage); // Refresh current page
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to perform cleanup';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [state.pagination.currentPage, refreshStorageInfo, setLoading, setError]);

  const createBackup = useCallback(async (): Promise<string> => {
    setLoading(true);
    setError(null);
    
    try {
      const backupData = await exportBackup();
      return backupData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create backup';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const restoreBackup = useCallback(async (
    backupData: string,
    options?: Parameters<typeof importBackup>[1]
  ): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await importBackup(backupData, options);
      await refreshStorageInfo();
      await loadPage(1); // Go to first page after restore
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to restore backup';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [refreshStorageInfo, setLoading, setError]);

  const setCurrentManifiesto = useCallback((manifiesto: StoredManifiesto | null) => {
    setState(prev => ({ ...prev, currentManifiesto: manifiesto }));
  }, []);

  const actions: StorageActions = {
    save,
    update,
    load,
    remove,
    loadAll,
    loadPage,
    search,
    refreshStorageInfo,
    performCleanup,
    createBackup,
    restoreBackup,
    clearError,
    setCurrentManifiesto
  };

  return [state, actions];
};

export default useManifiestoStorage;