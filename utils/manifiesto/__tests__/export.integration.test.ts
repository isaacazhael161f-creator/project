/**
 * Integration tests for export functionality
 * Tests the complete export workflow with real data
 */

import { 
  exportManifiestos, 
  createDefaultExportOptions,
  validateExportOptions,
  getAvailableCSVFields
} from '../export';
import { 
  ExportFormat, 
  StoredManifiesto, 
  ManifiestoData,
  PassengerData,
  CargoData
} from '../../../types/manifiesto';

// Mock DOM for Node environment
beforeAll(() => {
  (global as any).document = {
    createElement: jest.fn().mockReturnValue({
      href: '',
      download: '',
      style: { display: '' },
      click: jest.fn()
    }),
    body: {
      appendChild: jest.fn(),
      removeChild: jest.fn()
    }
  };
  
  (global as any).URL = {
    createObjectURL: jest.fn().mockReturnValue('blob:mock-url'),
    revokeObjectURL: jest.fn()
  };
  
  (global as any).Blob = class MockBlob {
    constructor(public content: any[], public options: any) {}
  };
});

describe('Export Integration Tests', () => {
  const mockPassengerData: PassengerData = {
    nacional: 50,
    internacional: 25,
    diplomaticos: 2,
    enComision: 1,
    infantes: 5,
    transitos: 10,
    conexiones: 8,
    otrosExentos: 3,
    total: 104
  };

  const mockCargoData: CargoData = {
    equipaje: 2500,
    carga: 1200,
    correo: 50,
    total: 3750
  };

  const mockManifiestoData: ManifiestoData = {
    fecha: '2024-01-15',
    folio: 'MAN-001',
    aeropuertoSalida: 'SCL',
    tipoVuelo: 'Internacional',
    transportista: 'LATAM Airlines',
    equipo: 'B787',
    matricula: 'CC-BGG',
    numeroVuelo: 'LA800',
    pilotoAlMando: 'Juan Pérez',
    numeroLicencia: 'PIL-12345',
    tripulacion: 8,
    origenVuelo: 'SCL',
    proximaEscala: 'LIM',
    destinoVuelo: 'MIA',
    horaSlotAsignado: '14:30',
    horaSlotCoordinado: '14:35',
    horaTerminoPernocta: '13:00',
    horaInicioManiobras: '13:30',
    horaSalidaPosicion: '14:40',
    causaDemora: 'Condiciones meteorológicas',
    codigoCausa: 'WX01',
    pasajeros: mockPassengerData,
    carga: mockCargoData,
    imagenOriginal: 'data:image/jpeg;base64,mock-image-data',
    fechaProcesamiento: new Date('2024-01-15T10:30:00Z'),
    editado: true
  };

  const mockStoredManifiesto: StoredManifiesto = {
    id: 'test-id-1',
    data: mockManifiestoData,
    createdAt: new Date('2024-01-15T10:30:00Z'),
    updatedAt: new Date('2024-01-15T10:35:00Z')
  };

  it('should complete full CSV export workflow', async () => {
    // 1. Create export options
    const options = createDefaultExportOptions(ExportFormat.CSV);
    
    // 2. Validate options
    const errors = validateExportOptions(options);
    expect(errors).toHaveLength(0);
    
    // 3. Export data
    await expect(exportManifiestos([mockStoredManifiesto], options))
      .resolves.not.toThrow();
  });

  it('should complete full JSON export workflow', async () => {
    // 1. Create export options
    const options = createDefaultExportOptions(ExportFormat.JSON);
    
    // 2. Validate options
    const errors = validateExportOptions(options);
    expect(errors).toHaveLength(0);
    
    // 3. Export data
    await expect(exportManifiestos([mockStoredManifiesto], options))
      .resolves.not.toThrow();
  });

  it('should handle custom CSV export with field selection', async () => {
    const availableFields = getAvailableCSVFields();
    expect(availableFields.length).toBeGreaterThan(0);
    
    const selectedFields = availableFields.slice(0, 5).map(f => f.key);
    
    const options = {
      format: ExportFormat.CSV,
      includeMetadata: false,
      csvOptions: {
        delimiter: ';',
        includeHeaders: true,
        dateFormat: 'DD/MM/YYYY' as const,
        numberFormat: 'integer' as const,
        customFields: selectedFields
      }
    };
    
    const errors = validateExportOptions(options);
    expect(errors).toHaveLength(0);
    
    await expect(exportManifiestos([mockStoredManifiesto], options))
      .resolves.not.toThrow();
  });

  it('should handle multiple manifiestos export', async () => {
    const manifiestos = [
      mockStoredManifiesto,
      {
        ...mockStoredManifiesto,
        id: 'test-id-2',
        data: {
          ...mockManifiestoData,
          folio: 'MAN-002',
          numeroVuelo: 'LA801'
        }
      }
    ];

    const options = createDefaultExportOptions(ExportFormat.JSON);
    
    await expect(exportManifiestos(manifiestos, options))
      .resolves.not.toThrow();
  });

  it('should handle date range filtering', async () => {
    const options = {
      ...createDefaultExportOptions(ExportFormat.CSV),
      dateRange: {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      }
    };
    
    const errors = validateExportOptions(options);
    expect(errors).toHaveLength(0);
    
    await expect(exportManifiestos([mockStoredManifiesto], options))
      .resolves.not.toThrow();
  });

  it('should validate and reject invalid options', () => {
    const invalidOptions = {
      format: 'INVALID' as any,
      includeMetadata: true,
      csvOptions: {
        delimiter: 'too-long', // Should be single character
        dateFormat: 'INVALID' as any
      }
    };
    
    const errors = validateExportOptions(invalidOptions);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors).toContain('Formato de exportación no válido');
    expect(errors).toContain('El delimitador CSV debe ser un solo carácter');
    expect(errors).toContain('Formato de fecha no válido');
  });

  it('should handle empty manifiestos array', async () => {
    const options = createDefaultExportOptions(ExportFormat.CSV);
    
    await expect(exportManifiestos([], options))
      .resolves.not.toThrow();
  });

  it('should provide comprehensive field list for CSV customization', () => {
    const fields = getAvailableCSVFields();
    
    // Should include all major categories
    const fieldKeys = fields.map(f => f.key);
    
    expect(fieldKeys).toContain('fecha');
    expect(fieldKeys).toContain('folio');
    expect(fieldKeys).toContain('transportista');
    expect(fieldKeys).toContain('numeroVuelo');
    expect(fieldKeys).toContain('totalPasajeros');
    expect(fieldKeys).toContain('totalCarga');
    
    // Each field should have a label
    fields.forEach(field => {
      expect(field.key).toBeTruthy();
      expect(field.label).toBeTruthy();
      expect(typeof field.key).toBe('string');
      expect(typeof field.label).toBe('string');
    });
  });
});