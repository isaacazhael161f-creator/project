/**
 * Tests for useManifiestoStorage hook
 * Covers React hook functionality for storage operations
 */

import { renderHook, act } from '@testing-library/react';
import { useManifiestoStorage } from '../useManifiestoStorage';
import { ManifiestoData, StoredManifiesto, PassengerData, CargoData } from '../../types/manifiesto';

// Mock the storage utilities
jest.mock('../../utils/manifiesto/storage', () => ({
  saveManifiesto: jest.fn(),
  updateManifiesto: jest.fn(),
  getManifiesto: jest.fn(),
  getAllManifiestos: jest.fn(),
  deleteManifiesto: jest.fn(),
  getStorageInfo: jest.fn(),
  getManifiestosPaginated: jest.fn(),
  searchManifiestos: jest.fn(),
  exportBackup: jest.fn(),
  importBackup: jest.fn()
}));

// Mock the storage manager
jest.mock('../../utils/manifiesto/storageManager', () => ({
  getStorageManager: jest.fn(),
  StorageManager: jest.fn()
}));

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
} from '../../utils/manifiesto/storage';

import { getStorageManager } from '../../utils/manifiesto/storageManager';

// Helper function to create test manifiesto data
const createTestManifiestoData = (overrides: Partial<ManifiestoData> = {}): ManifiestoData => {
  const passengerData: PassengerData = {
    nacional: 50,
    internacional: 25,
    diplomaticos: 0,
    enComision: 2,
    infantes: 5,
    transitos: 0,
    conexiones: 10,
    otrosExentos: 0,
    total: 92
  };

  const cargoData: CargoData = {
    equipaje: 1500,
    carga: 2000,
    correo: 100,
    total: 3600
  };

  return {
    fecha: '2024-01-15',
    folio: 'TEST001',
    aeropuertoSalida: 'MEX',
    tipoVuelo: 'Internacional',
    transportista: 'Aeromexico',
    equipo: 'B737',
    matricula: 'XA-ABC',
    numeroVuelo: 'AM123',
    pilotoAlMando: 'Juan Pérez',
    numeroLicencia: 'LIC123456',
    tripulacion: 6,
    origenVuelo: 'MEX',
    proximaEscala: 'MIA',
    destinoVuelo: 'JFK',
    horaSlotAsignado: '14:30',
    horaSlotCoordinado: '14:35',
    horaTerminoPernocta: '06:00',
    horaInicioManiobras: '13:45',
    horaSalidaPosicion: '14:40',
    causaDemora: 'Condiciones meteorológicas',
    codigoCausa: 'WX01',
    pasajeros: passengerData,
    carga: cargoData,
    imagenOriginal: 'data:image/jpeg;base64,test',
    fechaProcesamiento: new Date(),
    editado: false,
    ...overrides
  };
};

const createStoredManifiesto = (id: string, data?: Partial<ManifiestoData>): StoredManifiesto => ({
  id,
  data: createTestManifiestoData(data),
  createdAt: new Date(),
  updatedAt: new Date()
});

describe('useManifiestoStorage', () => {
  const mockStorageManager = {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    checkAndCleanup: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock storage manager
    (getStorageManager as jest.Mock).mockReturnValue(mockStorageManager);
    
    // Mock storage functions with default implementations
    (getStorageInfo as jest.Mock).mockResolvedValue({
      used: 500000,
      quota: 1000000,
      count: 10,
      usagePercentage: 50
    });
    
    (getManifiestosPaginated as jest.Mock).mockResolvedValue({
      manifiestos: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: 1
    });
  });

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useManifiestoStorage());
      const [state] = result.current;
      
      expect(state.manifiestos).toEqual([]);
      expect(state.currentManifiesto).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.pagination.currentPage).toBe(1);
    });

    it('should initialize storage manager when autoCleanup is enabled', () => {
      renderHook(() => useManifiestoStorage({ autoCleanup: true }));
      
      expect(getStorageManager).toHaveBeenCalledWith({
        cleanupThreshold: 80,
        autoBackupEnabled: false
      });
      expect(mockStorageManager.addEventListener).toHaveBeenCalled();
      expect(mockStorageManager.start).toHaveBeenCalled();
    });

    it('should initialize storage manager with backup enabled', () => {
      renderHook(() => useManifiestoStorage({ enableBackup: true }));
      
      expect(getStorageManager).toHaveBeenCalledWith({
        cleanupThreshold: 80,
        autoBackupEnabled: true
      });
    });

    it('should load initial data on mount', async () => {
      const { result } = renderHook(() => useManifiestoStorage());
      
      // Wait for initial effects to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      expect(getStorageInfo).toHaveBeenCalled();
      expect(getManifiestosPaginated).toHaveBeenCalledWith(1, 10);
    });
  });

  describe('CRUD Operations', () => {
    it('should save manifiesto', async () => {
      const testData = createTestManifiestoData();
      const testId = 'test-id-123';
      
      (saveManifiesto as jest.Mock).mockResolvedValue(testId);
      
      const { result } = renderHook(() => useManifiestoStorage());
      const [, actions] = result.current;
      
      let savedId: string;
      await act(async () => {
        savedId = await actions.save(testData);
      });
      
      expect(saveManifiesto).toHaveBeenCalledWith(testData);
      expect(savedId!).toBe(testId);
      expect(getStorageInfo).toHaveBeenCalled(); // Should refresh storage info
      expect(getManifiestosPaginated).toHaveBeenCalled(); // Should refresh page
    });

    it('should handle save errors', async () => {
      const testData = createTestManifiestoData();
      const error = new Error('Save failed');
      
      (saveManifiesto as jest.Mock).mockRejectedValue(error);
      
      const { result } = renderHook(() => useManifiestoStorage());
      const [, actions] = result.current;
      
      await act(async () => {
        await expect(actions.save(testData)).rejects.toThrow('Save failed');
      });
      
      const [state] = result.current;
      expect(state.error).toBe('Save failed');
      expect(state.loading).toBe(false);
    });

    it('should update manifiesto', async () => {
      const testId = 'test-id-123';
      const testData = createTestManifiestoData();
      
      (updateManifiesto as jest.Mock).mockResolvedValue(undefined);
      
      const { result } = renderHook(() => useManifiestoStorage());
      const [, actions] = result.current;
      
      await act(async () => {
        await actions.update(testId, testData);
      });
      
      expect(updateManifiesto).toHaveBeenCalledWith(testId, testData);
      expect(getStorageInfo).toHaveBeenCalled();
      expect(getManifiestosPaginated).toHaveBeenCalled();
    });

    it('should update current manifiesto when updating', async () => {
      const testId = 'test-id-123';
      const testData = createTestManifiestoData();
      const currentManifiesto = createStoredManifiesto(testId);
      
      (updateManifiesto as jest.Mock).mockResolvedValue(undefined);
      
      const { result } = renderHook(() => useManifiestoStorage());
      const [, actions] = result.current;
      
      // Set current manifiesto
      act(() => {
        actions.setCurrentManifiesto(currentManifiesto);
      });
      
      await act(async () => {
        await actions.update(testId, testData);
      });
      
      const [state] = result.current;
      expect(state.currentManifiesto?.data).toEqual(testData);
    });

    it('should load manifiesto by ID', async () => {
      const testId = 'test-id-123';
      const storedManifiesto = createStoredManifiesto(testId);
      
      (getManifiesto as jest.Mock).mockResolvedValue(storedManifiesto);
      
      const { result } = renderHook(() => useManifiestoStorage());
      const [, actions] = result.current;
      
      let loadedManifiesto: StoredManifiesto | null;
      await act(async () => {
        loadedManifiesto = await actions.load(testId);
      });
      
      expect(getManifiesto).toHaveBeenCalledWith(testId);
      expect(loadedManifiesto!).toEqual(storedManifiesto);
    });

    it('should delete manifiesto', async () => {
      const testId = 'test-id-123';
      
      (deleteManifiesto as jest.Mock).mockResolvedValue(undefined);
      
      const { result } = renderHook(() => useManifiestoStorage());
      const [, actions] = result.current;
      
      await act(async () => {
        await actions.remove(testId);
      });
      
      expect(deleteManifiesto).toHaveBeenCalledWith(testId);
      expect(getStorageInfo).toHaveBeenCalled();
      expect(getManifiestosPaginated).toHaveBeenCalled();
    });

    it('should clear current manifiesto when deleting it', async () => {
      const testId = 'test-id-123';
      const currentManifiesto = createStoredManifiesto(testId);
      
      (deleteManifiesto as jest.Mock).mockResolvedValue(undefined);
      
      const { result } = renderHook(() => useManifiestoStorage());
      const [, actions] = result.current;
      
      // Set current manifiesto
      act(() => {
        actions.setCurrentManifiesto(currentManifiesto);
      });
      
      await act(async () => {
        await actions.remove(testId);
      });
      
      const [state] = result.current;
      expect(state.currentManifiesto).toBeNull();
    });
  });

  describe('List Operations', () => {
    it('should load all manifiestos', async () => {
      const testManifiestos = [
        createStoredManifiesto('1'),
        createStoredManifiesto('2')
      ];
      
      (getAllManifiestos as jest.Mock).mockResolvedValue(testManifiestos);
      
      const { result } = renderHook(() => useManifiestoStorage());
      const [, actions] = result.current;
      
      let manifiestos: StoredManifiesto[];
      await act(async () => {
        manifiestos = await actions.loadAll();
      });
      
      expect(getAllManifiestos).toHaveBeenCalled();
      expect(manifiestos!).toEqual(testManifiestos);
      
      const [state] = result.current;
      expect(state.manifiestos).toEqual(testManifiestos);
    });

    it('should load paginated manifiestos', async () => {
      const testManifiestos = [createStoredManifiesto('1')];
      const paginationResult = {
        manifiestos: testManifiestos,
        totalCount: 25,
        totalPages: 3,
        currentPage: 2
      };
      
      (getManifiestosPaginated as jest.Mock).mockResolvedValue(paginationResult);
      
      const { result } = renderHook(() => useManifiestoStorage());
      const [, actions] = result.current;
      
      await act(async () => {
        await actions.loadPage(2);
      });
      
      expect(getManifiestosPaginated).toHaveBeenCalledWith(2, 10);
      
      const [state] = result.current;
      expect(state.manifiestos).toEqual(testManifiestos);
      expect(state.pagination).toEqual({
        currentPage: 2,
        totalPages: 3,
        totalCount: 25
      });
    });

    it('should search manifiestos', async () => {
      const searchCriteria = { transportista: 'Aeromexico' };
      const searchResults = [createStoredManifiesto('1')];
      
      (searchManifiestos as jest.Mock).mockResolvedValue(searchResults);
      
      const { result } = renderHook(() => useManifiestoStorage());
      const [, actions] = result.current;
      
      let results: StoredManifiesto[];
      await act(async () => {
        results = await actions.search(searchCriteria);
      });
      
      expect(searchManifiestos).toHaveBeenCalledWith(searchCriteria);
      expect(results!).toEqual(searchResults);
      
      const [state] = result.current;
      expect(state.manifiestos).toEqual(searchResults);
    });
  });

  describe('Storage Management', () => {
    it('should refresh storage info', async () => {
      const storageInfo = {
        used: 750000,
        quota: 1000000,
        count: 15,
        usagePercentage: 75
      };
      
      (getStorageInfo as jest.Mock).mockResolvedValue(storageInfo);
      
      const { result } = renderHook(() => useManifiestoStorage());
      const [, actions] = result.current;
      
      await act(async () => {
        await actions.refreshStorageInfo();
      });
      
      const [state] = result.current;
      expect(state.storageInfo).toEqual(storageInfo);
    });

    it('should perform cleanup', async () => {
      const cleanupResult = {
        cleanupPerformed: true,
        storageInfo: { used: 500000, quota: 1000000, count: 8, usagePercentage: 50 }
      };
      
      mockStorageManager.checkAndCleanup.mockResolvedValue(cleanupResult);
      
      const { result } = renderHook(() => useManifiestoStorage({ autoCleanup: true }));
      const [, actions] = result.current;
      
      await act(async () => {
        await actions.performCleanup();
      });
      
      expect(mockStorageManager.checkAndCleanup).toHaveBeenCalled();
      expect(getStorageInfo).toHaveBeenCalled();
      expect(getManifiestosPaginated).toHaveBeenCalled();
    });

    it('should handle cleanup error when storage manager not initialized', async () => {
      const { result } = renderHook(() => useManifiestoStorage({ autoCleanup: false }));
      const [, actions] = result.current;
      
      await act(async () => {
        await expect(actions.performCleanup()).rejects.toThrow('Storage manager not initialized');
      });
    });
  });

  describe('Backup Operations', () => {
    it('should create backup', async () => {
      const backupData = '{"backup": "data"}';
      
      (exportBackup as jest.Mock).mockResolvedValue(backupData);
      
      const { result } = renderHook(() => useManifiestoStorage());
      const [, actions] = result.current;
      
      let backup: string;
      await act(async () => {
        backup = await actions.createBackup();
      });
      
      expect(exportBackup).toHaveBeenCalled();
      expect(backup!).toBe(backupData);
    });

    it('should restore backup', async () => {
      const backupData = '{"backup": "data"}';
      const importResult = { imported: 5, skipped: 0, errors: [] };
      
      (importBackup as jest.Mock).mockResolvedValue(importResult);
      
      const { result } = renderHook(() => useManifiestoStorage());
      const [, actions] = result.current;
      
      await act(async () => {
        await actions.restoreBackup(backupData);
      });
      
      expect(importBackup).toHaveBeenCalledWith(backupData, undefined);
      expect(getStorageInfo).toHaveBeenCalled();
      expect(getManifiestosPaginated).toHaveBeenCalledWith(1, 10); // Should go to first page
    });

    it('should restore backup with options', async () => {
      const backupData = '{"backup": "data"}';
      const options = { clearExisting: true };
      const importResult = { imported: 5, skipped: 0, errors: [] };
      
      (importBackup as jest.Mock).mockResolvedValue(importResult);
      
      const { result } = renderHook(() => useManifiestoStorage());
      const [, actions] = result.current;
      
      await act(async () => {
        await actions.restoreBackup(backupData, options);
      });
      
      expect(importBackup).toHaveBeenCalledWith(backupData, options);
    });
  });

  describe('State Management', () => {
    it('should set current manifiesto', () => {
      const testManifiesto = createStoredManifiesto('test-id');
      
      const { result } = renderHook(() => useManifiestoStorage());
      const [, actions] = result.current;
      
      act(() => {
        actions.setCurrentManifiesto(testManifiesto);
      });
      
      const [state] = result.current;
      expect(state.currentManifiesto).toEqual(testManifiesto);
    });

    it('should clear error', () => {
      const { result } = renderHook(() => useManifiestoStorage());
      
      // First set an error by triggering a failed operation
      act(() => {
        (saveManifiesto as jest.Mock).mockRejectedValue(new Error('Test error'));
      });
      
      const [, actions] = result.current;
      
      act(() => {
        actions.clearError();
      });
      
      const [state] = result.current;
      expect(state.error).toBeNull();
    });

    it('should handle loading states correctly', async () => {
      (saveManifiesto as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve('test-id'), 100))
      );
      
      const { result } = renderHook(() => useManifiestoStorage());
      const [, actions] = result.current;
      
      // Start async operation
      act(() => {
        actions.save(createTestManifiestoData());
      });
      
      // Should be loading
      expect(result.current[0].loading).toBe(true);
      
      // Wait for completion
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });
      
      // Should not be loading anymore
      expect(result.current[0].loading).toBe(false);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup storage manager on unmount', () => {
      const { unmount } = renderHook(() => useManifiestoStorage({ autoCleanup: true }));
      
      unmount();
      
      expect(mockStorageManager.removeEventListener).toHaveBeenCalled();
      expect(mockStorageManager.stop).toHaveBeenCalled();
    });

    it('should not cleanup if storage manager was not initialized', () => {
      const { unmount } = renderHook(() => useManifiestoStorage({ autoCleanup: false }));
      
      unmount();
      
      expect(mockStorageManager.removeEventListener).not.toHaveBeenCalled();
      expect(mockStorageManager.stop).not.toHaveBeenCalled();
    });
  });
});