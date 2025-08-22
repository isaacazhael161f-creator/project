/**
 * Storage utilities for persisting manifiesto data using IndexedDB
 * Handles local storage of processed manifiestos and images
 */

import { ManifiestoData, StoredManifiesto, isValidManifiestoData } from '../../types/manifiesto';

const DB_NAME = 'ManifiestoScanner';
const DB_VERSION = 1;
const STORE_NAME = 'manifiestos';

/**
 * Initialize IndexedDB database
 */
export const initializeDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };
  });
};

/**
 * Save manifiesto data to IndexedDB
 */
export const saveManifiesto = async (data: ManifiestoData): Promise<string> => {
  const db = await initializeDatabase();
  const id = generateId();
  const now = new Date();
  
  const storedManifiesto: StoredManifiesto = {
    id,
    data,
    createdAt: now,
    updatedAt: now
  };
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(storedManifiesto);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(id);
  });
};

/**
 * Update existing manifiesto data
 */
export const updateManifiesto = async (id: string, data: ManifiestoData): Promise<void> => {
  const db = await initializeDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const getRequest = store.get(id);
    
    getRequest.onsuccess = () => {
      const existingRecord = getRequest.result;
      if (existingRecord) {
        existingRecord.data = data;
        existingRecord.updatedAt = new Date();
        
        const updateRequest = store.put(existingRecord);
        updateRequest.onerror = () => reject(updateRequest.error);
        updateRequest.onsuccess = () => resolve();
      } else {
        reject(new Error('Manifiesto not found'));
      }
    };
    
    getRequest.onerror = () => reject(getRequest.error);
  });
};

/**
 * Get manifiesto by ID
 */
export const getManifiesto = async (id: string): Promise<StoredManifiesto | null> => {
  const db = await initializeDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
  });
};

/**
 * Get all manifiestos with optional date range filter
 */
export const getAllManifiestos = async (
  startDate?: Date,
  endDate?: Date
): Promise<StoredManifiesto[]> => {
  const db = await initializeDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('createdAt');
    
    let request: IDBRequest;
    
    if (startDate && endDate) {
      const range = IDBKeyRange.bound(startDate, endDate);
      request = index.getAll(range);
    } else {
      request = store.getAll();
    }
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

/**
 * Delete manifiesto by ID
 */
export const deleteManifiesto = async (id: string): Promise<void> => {
  const db = await initializeDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

/**
 * Clear all manifiestos (for cleanup)
 */
export const clearAllManifiestos = async (): Promise<void> => {
  const db = await initializeDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

/**
 * Get storage usage information
 */
export const getStorageInfo = async (): Promise<{
  used: number;
  quota: number;
  count: number;
  usagePercentage: number;
}> => {
  const manifiestos = await getAllManifiestos();
  const count = manifiestos.length;
  
  // Estimate storage usage (rough calculation)
  const estimatedSize = manifiestos.reduce((total, manifiesto) => {
    const dataSize = JSON.stringify(manifiesto).length;
    const imageSize = manifiesto.data.imagenOriginal ? manifiesto.data.imagenOriginal.length : 0;
    return total + dataSize + imageSize;
  }, 0);
  
  // Get storage quota if available
  let quota = 0;
  let actualUsed = 0;
  
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate();
      quota = estimate.quota || 0;
      actualUsed = estimate.usage || estimatedSize;
    } catch (error) {
      console.warn('Could not get storage estimate:', error);
      actualUsed = estimatedSize;
    }
  } else {
    actualUsed = estimatedSize;
  }
  
  const usagePercentage = quota > 0 ? (actualUsed / quota) * 100 : 0;
  
  return {
    used: actualUsed,
    quota,
    count,
    usagePercentage
  };
};

/**
 * Check if storage cleanup is needed based on usage threshold
 */
export const isCleanupNeeded = async (threshold: number = 80): Promise<boolean> => {
  const storageInfo = await getStorageInfo();
  return storageInfo.usagePercentage > threshold;
};

/**
 * Perform automatic cleanup of old manifiestos
 * Removes oldest manifiestos until storage usage is below target percentage
 */
export const performAutomaticCleanup = async (
  targetPercentage: number = 70,
  preserveCount: number = 10
): Promise<{
  deletedCount: number;
  remainingCount: number;
  newUsagePercentage: number;
}> => {
  const manifiestos = await getAllManifiestos();
  
  // Sort by creation date (oldest first)
  const sortedManifiestos = manifiestos.sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  
  let deletedCount = 0;
  let currentStorageInfo = await getStorageInfo();
  
  // Keep deleting oldest manifiestos until we're below target percentage
  // but always preserve the minimum count
  while (
    currentStorageInfo.usagePercentage > targetPercentage &&
    sortedManifiestos.length > preserveCount &&
    deletedCount < sortedManifiestos.length - preserveCount
  ) {
    const manifestoToDelete = sortedManifiestos[deletedCount];
    await deleteManifiesto(manifestoToDelete.id);
    deletedCount++;
    
    // Recalculate storage info
    currentStorageInfo = await getStorageInfo();
  }
  
  return {
    deletedCount,
    remainingCount: currentStorageInfo.count,
    newUsagePercentage: currentStorageInfo.usagePercentage
  };
};

/**
 * Export all manifiestos data for backup
 */
export const exportBackup = async (): Promise<string> => {
  const manifiestos = await getAllManifiestos();
  const backup = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    count: manifiestos.length,
    data: manifiestos
  };
  
  return JSON.stringify(backup, null, 2);
};

/**
 * Import manifiestos data from backup
 */
export const importBackup = async (
  backupData: string,
  options: {
    clearExisting?: boolean;
    skipDuplicates?: boolean;
  } = {}
): Promise<{
  imported: number;
  skipped: number;
  errors: string[];
}> => {
  const { clearExisting = false, skipDuplicates = true } = options;
  
  try {
    const backup = JSON.parse(backupData);
    
    // Validate backup format
    if (!backup.data || !Array.isArray(backup.data)) {
      throw new Error('Invalid backup format: missing or invalid data array');
    }
    
    // Clear existing data if requested
    if (clearExisting) {
      await clearAllManifiestos();
    }
    
    // Get existing IDs if we need to skip duplicates
    const existingIds = new Set<string>();
    if (skipDuplicates && !clearExisting) {
      const existing = await getAllManifiestos();
      existing.forEach(m => existingIds.add(m.id));
    }
    
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];
    
    // Import each manifiesto
    for (const manifestoData of backup.data) {
      try {
        // Skip if duplicate and skipDuplicates is true
        if (skipDuplicates && existingIds.has(manifestoData.id)) {
          skipped++;
          continue;
        }
        
        // Validate the manifiesto data structure
        if (!isValidStoredManifiesto(manifestoData)) {
          errors.push(`Invalid manifiesto data structure for ID: ${manifestoData.id || 'unknown'}`);
          continue;
        }
        
        // Convert date strings back to Date objects
        const processedData = {
          ...manifestoData,
          createdAt: new Date(manifestoData.createdAt),
          updatedAt: new Date(manifestoData.updatedAt),
          data: {
            ...manifestoData.data,
            fechaProcesamiento: new Date(manifestoData.data.fechaProcesamiento)
          }
        };
        
        // Import the manifiesto
        await importSingleManifiesto(processedData);
        imported++;
        
      } catch (error) {
        errors.push(`Error importing manifiesto ${manifestoData.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    return { imported, skipped, errors };
    
  } catch (error) {
    throw new Error(`Failed to parse backup data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Import a single manifiesto (used internally by importBackup)
 */
const importSingleManifiesto = async (manifiesto: StoredManifiesto): Promise<void> => {
  const db = await initializeDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(manifiesto);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

/**
 * Validate stored manifiesto structure
 */
const isValidStoredManifiesto = (data: any): data is StoredManifiesto => {
  return (
    typeof data === 'object' &&
    typeof data.id === 'string' &&
    typeof data.createdAt === 'string' &&
    typeof data.updatedAt === 'string' &&
    typeof data.data === 'object' &&
    typeof data.data.fecha === 'string' &&
    typeof data.data.folio === 'string'
  );
};

/**
 * Get manifiestos by date range with pagination
 */
export const getManifiestosPaginated = async (
  page: number = 1,
  pageSize: number = 10,
  startDate?: Date,
  endDate?: Date
): Promise<{
  manifiestos: StoredManifiesto[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}> => {
  const allManifiestos = await getAllManifiestos(startDate, endDate);
  const totalCount = allManifiestos.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  
  // Sort by creation date (newest first)
  const sortedManifiestos = allManifiestos.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  // Apply pagination
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const manifiestos = sortedManifiestos.slice(startIndex, endIndex);
  
  return {
    manifiestos,
    totalCount,
    totalPages,
    currentPage: page
  };
};

/**
 * Search manifiestos by various criteria
 */
export const searchManifiestos = async (searchCriteria: {
  folio?: string;
  numeroVuelo?: string;
  transportista?: string;
  fechaDesde?: Date;
  fechaHasta?: Date;
}): Promise<StoredManifiesto[]> => {
  const allManifiestos = await getAllManifiestos();
  
  return allManifiestos.filter(manifiesto => {
    const data = manifiesto.data;
    
    // Filter by folio
    if (searchCriteria.folio && !data.folio.toLowerCase().includes(searchCriteria.folio.toLowerCase())) {
      return false;
    }
    
    // Filter by flight number
    if (searchCriteria.numeroVuelo && !data.numeroVuelo.toLowerCase().includes(searchCriteria.numeroVuelo.toLowerCase())) {
      return false;
    }
    
    // Filter by carrier
    if (searchCriteria.transportista && !data.transportista.toLowerCase().includes(searchCriteria.transportista.toLowerCase())) {
      return false;
    }
    
    // Filter by date range
    const manifestoDate = new Date(data.fecha);
    if (searchCriteria.fechaDesde && manifestoDate < searchCriteria.fechaDesde) {
      return false;
    }
    
    if (searchCriteria.fechaHasta && manifestoDate > searchCriteria.fechaHasta) {
      return false;
    }
    
    return true;
  });
};

/**
 * Generate unique ID for manifiesto
 */
const generateId = (): string => {
  return `manifiesto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};