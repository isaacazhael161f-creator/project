/**
 * Tests for export functionality
 */

import { 
  exportManifiestos, 
  generateExportFilename, 
  validateExportOptions,
  getAvailableCSVFields,
  createDefaultExportOptions
} from '../export';
import { 
  ExportFormat, 
  ExportOptions, 
  StoredManifiesto, 
  ManifiestoData,
  PassengerData,
  CargoData
} from '../../../types/manifiesto';

// Mock DOM methods
const mockCreateElement = jest.fn();
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();
const mockClick = jest.fn();
const mockCreateObjectURL = jest.fn();
const mockRevokeObjectURL = jest.fn();

// Setup DOM mocks
beforeAll(() => {
  // Mock global objects
  (global as any).document = {
    createElement: mockCreateElement.mockReturnValue({
      href: '',
      download: '',
      style: { display: '' },
      click: mockClick
    }),
    body: {
      appendChild: mockAppendChild,
      removeChild: mockRemoveChild
    }
  };
  
  (global as any).URL = {
    createObjectURL: mockCreateObjectURL.mockReturnValue('blob:mock-url'),
    revokeObjectURL: mockRevokeObjectURL
  };
  
  (global as any).Blob = class MockBlob {
    constructor(public content: any[], public options: any) {}
  };
  
  (global as any).window = {
    open: jest.fn()
  };
});

beforeEach(() => {
  jest.clearAllMocks();
});

// Test data
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

describe('Export Utilities', () => {
  describe('generateExportFilename', () => {
    it('should generate CSV filename with timestamp', () => {
      const filename = generateExportFilename(ExportFormat.CSV);
      expect(filename).toMatch(/^manifiestos_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.csv$/);
    });

    it('should generate JSON filename with timestamp', () => {
      const filename = generateExportFilename(ExportFormat.JSON);
      expect(filename).toMatch(/^manifiestos_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.json$/);
    });

    it('should use custom prefix', () => {
      const filename = generateExportFilename(ExportFormat.CSV, 'custom');
      expect(filename).toMatch(/^custom_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.csv$/);
    });
  });

  describe('validateExportOptions', () => {
    it('should validate valid export options', () => {
      const options: ExportOptions = {
        format: ExportFormat.CSV,
        includeMetadata: true
      };
      
      const errors = validateExportOptions(options);
      expect(errors).toHaveLength(0);
    });

    it('should detect invalid format', () => {
      const options: ExportOptions = {
        format: 'invalid' as ExportFormat,
        includeMetadata: true
      };
      
      const errors = validateExportOptions(options);
      expect(errors).toContain('Formato de exportación no válido');
    });

    it('should validate date range', () => {
      const options: ExportOptions = {
        format: ExportFormat.CSV,
        includeMetadata: true,
        dateRange: {
          start: new Date('2024-01-15'),
          end: new Date('2024-01-10') // End before start
        }
      };
      
      const errors = validateExportOptions(options);
      expect(errors).toContain('La fecha de inicio debe ser anterior a la fecha de fin');
    });

    it('should validate CSV options', () => {
      const options: ExportOptions = {
        format: ExportFormat.CSV,
        includeMetadata: true,
        csvOptions: {
          delimiter: 'invalid', // Should be single character
          dateFormat: 'INVALID' as any
        }
      };
      
      const errors = validateExportOptions(options);
      expect(errors).toContain('El delimitador CSV debe ser un solo carácter');
      expect(errors).toContain('Formato de fecha no válido');
    });
  });

  describe('getAvailableCSVFields', () => {
    it('should return all available CSV fields', () => {
      const fields = getAvailableCSVFields();
      expect(fields).toHaveLength(34); // All defined fields (updated count)
      expect(fields[0]).toEqual({ key: 'fecha', label: 'Fecha' });
      expect(fields.find(f => f.key === 'transportista')).toEqual({ key: 'transportista', label: 'Transportista' });
    });
  });

  describe('createDefaultExportOptions', () => {
    it('should create default CSV options', () => {
      const options = createDefaultExportOptions(ExportFormat.CSV);
      expect(options.format).toBe(ExportFormat.CSV);
      expect(options.includeMetadata).toBe(true);
      expect(options.csvOptions).toEqual({
        delimiter: ',',
        includeHeaders: true,
        dateFormat: 'ISO',
        numberFormat: 'decimal'
      });
    });

    it('should create default JSON options', () => {
      const options = createDefaultExportOptions(ExportFormat.JSON);
      expect(options.format).toBe(ExportFormat.JSON);
      expect(options.includeMetadata).toBe(true);
    });
  });

  describe('exportManifiestos', () => {
    it('should export to CSV format', async () => {
      const options: ExportOptions = {
        format: ExportFormat.CSV,
        includeMetadata: true
      };

      await exportManifiestos([mockStoredManifiesto], options);

      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockClick).toHaveBeenCalled();
    });

    it('should export to JSON format', async () => {
      const options: ExportOptions = {
        format: ExportFormat.JSON,
        includeMetadata: true
      };

      await exportManifiestos([mockStoredManifiesto], options);

      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockClick).toHaveBeenCalled();
    });

    it('should filter by date range', async () => {
      const options: ExportOptions = {
        format: ExportFormat.CSV,
        includeMetadata: true,
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31')
        }
      };

      await exportManifiestos([mockStoredManifiesto], options);

      expect(mockCreateObjectURL).toHaveBeenCalled();
    });

    it('should handle custom CSV options', async () => {
      const options: ExportOptions = {
        format: ExportFormat.CSV,
        includeMetadata: false,
        csvOptions: {
          delimiter: ';',
          includeHeaders: false,
          dateFormat: 'DD/MM/YYYY',
          numberFormat: 'integer',
          customFields: ['fecha', 'folio', 'transportista']
        }
      };

      await exportManifiestos([mockStoredManifiesto], options);

      expect(mockCreateObjectURL).toHaveBeenCalled();
    });

    it('should exclude specified fields in CSV', async () => {
      const options: ExportOptions = {
        format: ExportFormat.CSV,
        includeMetadata: true,
        csvOptions: {
          excludeFields: ['imagenOriginal', 'causaDemora']
        }
      };

      await exportManifiestos([mockStoredManifiesto], options);

      expect(mockCreateObjectURL).toHaveBeenCalled();
    });

    it('should throw error for unsupported format', async () => {
      const options: ExportOptions = {
        format: 'UNSUPPORTED' as ExportFormat,
        includeMetadata: true
      };

      await expect(exportManifiestos([mockStoredManifiesto], options))
        .rejects.toThrow('Unsupported export format: UNSUPPORTED');
    });
  });

  describe('CSV Export Content Validation', () => {
    it('should generate correct CSV headers', async () => {
      const options: ExportOptions = {
        format: ExportFormat.CSV,
        includeMetadata: true,
        csvOptions: {
          customFields: ['fecha', 'folio', 'transportista']
        }
      };

      // Mock Blob constructor to capture content
      let capturedContent = '';
      (global as any).Blob = class MockBlob {
        constructor(content: string[], options: any) {
          capturedContent = content[0] || '';
        }
      };

      await exportManifiestos([mockStoredManifiesto], options);

      expect(capturedContent).toContain('Fecha,Folio,Transportista');
      expect(capturedContent).toContain('2024-01-15,MAN-001,LATAM Airlines');
    });

    it('should format dates correctly', async () => {
      const options: ExportOptions = {
        format: ExportFormat.CSV,
        includeMetadata: false,
        csvOptions: {
          dateFormat: 'DD/MM/YYYY',
          customFields: ['fecha']
        }
      };

      let capturedContent = '';
      (global as any).Blob = class MockBlob {
        constructor(content: string[], options: any) {
          capturedContent = content[0] || '';
        }
      };

      await exportManifiestos([mockStoredManifiesto], options);

      expect(capturedContent).toContain('/1/2024'); // DD/MM/YYYY format (day might vary due to timezone)
    });

    it('should format numbers as integers when specified', async () => {
      const options: ExportOptions = {
        format: ExportFormat.CSV,
        includeMetadata: false,
        csvOptions: {
          numberFormat: 'integer',
          customFields: ['tripulacion', 'totalPasajeros']
        }
      };

      let capturedContent = '';
      (global as any).Blob = class MockBlob {
        constructor(content: string[], options: any) {
          capturedContent = content[0] || '';
        }
      };

      await exportManifiestos([mockStoredManifiesto], options);

      expect(capturedContent).toContain('8,104'); // Integer format
    });
  });

  describe('JSON Export Content Validation', () => {
    it('should include version and export metadata', async () => {
      const options: ExportOptions = {
        format: ExportFormat.JSON,
        includeMetadata: true
      };

      let capturedContent = '';
      (global as any).Blob = class MockBlob {
        constructor(content: string[], options: any) {
          capturedContent = content[0] || '';
        }
      };

      await exportManifiestos([mockStoredManifiesto], options);

      const jsonContent = JSON.parse(capturedContent);
      expect(jsonContent.version).toBe('1.0.0');
      expect(jsonContent.exportDate).toBeDefined();
      expect(jsonContent.totalRecords).toBe(1);
      expect(jsonContent.manifiestos).toHaveLength(1);
      expect(jsonContent.manifiestos[0]._metadata).toBeDefined();
      expect(jsonContent.manifiestos[0]._metadata.exportVersion).toBe('1.0.0');
    });

    it('should exclude image data when metadata not included', async () => {
      const options: ExportOptions = {
        format: ExportFormat.JSON,
        includeMetadata: false
      };

      let capturedContent = '';
      (global as any).Blob = class MockBlob {
        constructor(content: string[], options: any) {
          capturedContent = content[0] || '';
        }
      };

      await exportManifiestos([mockStoredManifiesto], options);

      const jsonContent = JSON.parse(capturedContent);
      expect(jsonContent.manifiestos[0].imagenOriginal).toBeUndefined();
    });
  });
});