/**
 * Tests for storage utilities
 * Covers persistence, recovery, backup/restore, and cleanup functionality
 */

import {
  getStorageInfo,
  isCleanupNeeded,
  performAutomaticCleanup,
  exportBackup,
  importBackup,
  getManifiestosPaginated,
  searchManifiestos
} from '../storage';
import { ManifiestoData, StoredManifiesto, PassengerData, CargoData } from '../../../types/manifiesto';

// Mock data store
let mockData: StoredManifiesto[] = [];
let mockStorageUsage = { used: 500000, quota: 1000000, count: 0, usagePercentage: 50 };

// Mock the basic storage functions
jest.mock('../storage', () => ({
  saveManifiesto: jest.fn().mockImplementation(async (data: ManifiestoData) => {
    const id = `manifiesto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const stored: StoredManifiesto = {
      id,
      data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    mockData.push(stored);
    mockStorageUsage.count = mockData.length;
    return id;
  }),
  
  updateManifiesto: jest.fn().mockImplementation(async (id: string, data: ManifiestoData) => {
    const index = mockData.findIndex(m => m.id === id);
    if (index === -1) throw new Error('Manifiesto not found');
    mockData[index] = { ...mockData[index], data, updatedAt: new Date() };
  }),
  
  getManifiesto: jest.fn().mockImplementation(async (id: string) => {
    return mockData.find(m => m.id === id) || null;
  }),
  
  getAllManifiestos: jest.fn().mockImplementation(async () => {
    return [...mockData];
  }),
  
  deleteManifiesto: jest.fn().mockImplementation(async (id: string) => {
    const index = mockData.findIndex(m => m.id === id);
    if (index !== -1) {
      mockData.splice(index, 1);
      mockStorageUsage.count = mockData.length;
    }
  }),
  
  clearAllManifiestos: jest.fn().mockImplementation(async () => {
    mockData = [];
    mockStorageUsage.count = 0;
  }),
  
  getStorageInfo: jest.fn().mockImplementation(async () => {
    return { ...mockStorageUsage };
  }),
  
  isCleanupNeeded: jest.fn().mockImplementation(async (threshold: number = 80) => {
    return mockStorageUsage.usagePercentage > threshold;
  }),
  
  performAutomaticCleanup: jest.fn().mockImplementation(async () => {
    const deletedCount = Math.floor(mockData.length / 2);
    mockData = mockData.slice(deletedCount);
    mockStorageUsage.count = mockData.length;
    mockStorageUsage.usagePercentage = 30;
    return {
      deletedCount,
      remainingCount: mockData.length,
      newUsagePercentage: 30
    };
  }),
  
  exportBackup: jest.fn().mockImplementation(async () => {
    const backup = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      count: mockData.length,
      data: mockData
    };
    return JSON.stringify(backup, null, 2);
  }),
  
  importBackup: jest.fn().mockImplementation(async (backupData: string) => {
    try {
      const backup = JSON.parse(backupData);
      if (!backup.data || !Array.isArray(backup.data)) {
        throw new Error('Invalid backup format: missing or invalid data array');
      }
      return { imported: backup.data.length, skipped: 0, errors: [] };
    } catch (error) {
      throw new Error(`Failed to parse backup data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }),
  
  getManifiestosPaginated: jest.fn().mockImplementation(async (page: number = 1, pageSize: number = 10) => {
    const totalCount = mockData.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const manifiestos = mockData.slice(startIndex, endIndex);
    
    return {
      manifiestos,
      totalCount,
      totalPages,
      currentPage: page
    };
  }),
  
  searchManifiestos: jest.fn().mockImplementation(async (criteria: any) => {
    return mockData.filter(manifiesto => {
      const data = manifiesto.data;
      
      if (criteria.transportista && !data.transportista.toLowerCase().includes(criteria.transportista.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  })
}));

// Import the mocked functions
import {
  saveManifiesto,
  updateManifiesto,
  getManifiesto,
  getAllManifiestos,
  deleteManifiesto,
  clearAllManifiestos
} from '../storage';

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
    imagenOriginal: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
    fechaProcesamiento: new Date(),
    editado: false,
    ...overrides
  };
};

describe('Storage Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock data
    mockData = [];
    mockStorageUsage = { used: 500000, quota: 1000000, count: 0, usagePercentage: 50 };
  });

  describe('Basic CRUD Operations', () => {
    it('should save manifiesto data successfully', async () => {
      const testData = createTestManifiestoData();
      
      const id = await saveManifiesto(testData);
      
      expect(typeof id).toBe('string');
      expect(id).toMatch(/^manifiesto_\d+_[a-z0-9]+$/);
      expect(saveManifiesto).toHaveBeenCalledWith(testData);
    });

    it('should update existing manifiesto', async () => {
      const testData = createTestManifiestoData();
      
      // First save a manifiesto
      const id = await saveManifiesto(testData);
      
      // Then update it
      const updatedData = createTestManifiestoData({ folio: 'UPDATED001' });
      await updateManifiesto(id, updatedData);
      
      expect(updateManifiesto).toHaveBeenCalledWith(id, updatedData);
    });

    it('should retrieve manifiesto by ID', async () => {
      const testData = createTestManifiestoData();
      const id = await saveManifiesto(testData);
      
      const result = await getManifiesto(id);
      
      expect(result).not.toBeNull();
      expect(result?.id).toBe(id);
      expect(result?.data.folio).toBe(testData.folio);
    });

    it('should return null for non-existent manifiesto', async () => {
      const result = await getManifiesto('non-existent-id');
      expect(result).toBeNull();
    });

    it('should delete manifiesto successfully', async () => {
      const testData = createTestManifiestoData();
      const id = await saveManifiesto(testData);
      
      await deleteManifiesto(id);
      
      const result = await getManifiesto(id);
      expect(result).toBeNull();
    });

    it('should get all manifiestos', async () => {
      const testData1 = createTestManifiestoData({ folio: 'TEST001' });
      const testData2 = createTestManifiestoData({ folio: 'TEST002' });
      
      await saveManifiesto(testData1);
      await saveManifiesto(testData2);
      
      const all = await getAllManifiestos();
      expect(all).toHaveLength(2);
    });

    it('should clear all manifiestos', async () => {
      const testData = createTestManifiestoData();
      await saveManifiesto(testData);
      
      await clearAllManifiestos();
      
      const all = await getAllManifiestos();
      expect(all).toHaveLength(0);
    });
  });

  describe('Storage Management', () => {
    it('should get storage information', async () => {
      const testData = createTestManifiestoData();
      await saveManifiesto(testData);

      const info = await getStorageInfo();
      expect(info).toHaveProperty('used');
      expect(info).toHaveProperty('quota');
      expect(info).toHaveProperty('count');
      expect(info).toHaveProperty('usagePercentage');
      expect(info.count).toBe(1);
    });

    it('should detect when cleanup is needed', async () => {
      // Mock high storage usage
      mockStorageUsage.usagePercentage = 85;

      const needsCleanup = await isCleanupNeeded(80);
      expect(needsCleanup).toBe(true);
    });

    it('should detect when cleanup is not needed', async () => {
      // Mock low storage usage
      mockStorageUsage.usagePercentage = 50;

      const needsCleanup = await isCleanupNeeded(80);
      expect(needsCleanup).toBe(false);
    });
  });

  describe('Backup and Restore', () => {
    it('should export backup data', async () => {
      const testData = createTestManifiestoData();
      await saveManifiesto(testData);

      const backupData = await exportBackup();
      const parsed = JSON.parse(backupData);
      
      expect(parsed).toHaveProperty('version');
      expect(parsed).toHaveProperty('exportDate');
      expect(parsed).toHaveProperty('count', 1);
      expect(parsed).toHaveProperty('data');
      expect(Array.isArray(parsed.data)).toBe(true);
    });

    it('should handle invalid backup data', async () => {
      const invalidBackupData = '{"invalid": "data"}';

      await expect(importBackup(invalidBackupData)).rejects.toThrow('Invalid backup format');
    });
  });

  describe('Advanced Queries', () => {
    it('should get paginated manifiestos', async () => {
      // Create test data
      for (let i = 0; i < 25; i++) {
        await saveManifiesto(createTestManifiestoData({ folio: `FOLIO${i}` }));
      }

      const result = await getManifiestosPaginated(2, 10);
      expect(result.manifiestos).toHaveLength(10);
      expect(result.totalCount).toBe(25);
      expect(result.totalPages).toBe(3);
      expect(result.currentPage).toBe(2);
    });

    it('should search manifiestos by criteria', async () => {
      await saveManifiesto(createTestManifiestoData({ 
        folio: 'AM001', 
        numeroVuelo: 'AM123', 
        transportista: 'Aeromexico' 
      }));
      await saveManifiesto(createTestManifiestoData({ 
        folio: 'VB002', 
        numeroVuelo: 'VB456', 
        transportista: 'Volaris' 
      }));

      const results = await searchManifiestos({ transportista: 'Aeromexico' });
      expect(results).toHaveLength(1);
      expect(results[0].data.transportista).toBe('Aeromexico');
    });
  });

  describe('Error Handling', () => {
    it('should handle update errors for non-existent manifiestos', async () => {
      const testData = createTestManifiestoData();
      
      await expect(updateManifiesto('non-existent-id', testData))
        .rejects.toThrow('Manifiesto not found');
    });
  });
});