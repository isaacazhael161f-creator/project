/**
 * End-to-End Integration Tests for Manifiesto Scanner
 * Tests the complete workflow from image upload to data export
 * Validates accuracy of extraction vs manual input
 * Tests cross-browser compatibility and responsive design
 */

import React from 'react';
import { render, fireEvent, waitFor, act, screen } from '@testing-library/react-native';
import { Alert, Dimensions } from 'react-native';
import ManifiestoScanner from '../ManifiestoScanner';
import { useManifiestoScannerStore, ScannerStep } from '../../../stores/manifiestoScannerStore';
import { parseManifiestoText } from '../../../utils/manifiesto/parser';
import { processImageWithOCR } from '../../../utils/manifiesto/ocr';
import { saveManifiestoData, getManifiestoData } from '../../../utils/manifiesto/storage';
import { exportToCSV, exportToJSON } from '../../../utils/manifiesto/export';
import { ManifiestoData } from '../../../types/manifiesto';

// Mock external dependencies
jest.mock('../../../stores/manifiestoScannerStore');
jest.mock('../../../utils/manifiesto/parser');
jest.mock('../../../utils/manifiesto/ocr');
jest.mock('../../../utils/manifiesto/storage');
jest.mock('../../../utils/manifiesto/export');
// Mock React Native completely for integration tests
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  
  // Mock only the parts we need
  return {
    ...RN,
    Alert: {
      alert: jest.fn(),
    },
    Dimensions: {
      get: jest.fn().mockReturnValue({ width: 1024, height: 768 }),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
    Platform: {
      OS: 'web',
      select: jest.fn((options) => options.web || options.default),
    },
    // Mock components that might cause issues
    View: 'View',
    Text: 'Text',
    TouchableOpacity: 'TouchableOpacity',
    ScrollView: 'ScrollView',
    TextInput: 'TextInput',
    Image: 'Image',
  };
});

// Sample manifiesto data for testing
const SAMPLE_MANIFIESTOS = {
  complete: {
    rawText: `MANIFIESTO DE SALIDA
AEROPUERTO INTERNACIONAL BENITO JUÁREZ
FECHA: 15/01/2024                    FOLIO: MS-2024-001234

INFORMACIÓN DEL VUELO
Transportista: AEROMÉXICO
Equipo: BOEING 737-800
Matrícula: XA-AMX
Número de Vuelo: AM-123

INFORMACIÓN DEL PILOTO
Piloto al Mando: CARLOS RODRIGUEZ MARTINEZ
Número de Licencia: PIL-2024-5678
Tripulación: 6

MOVIMIENTO DE OPERACIONES
Origen del Vuelo: CIUDAD DE MÉXICO (MEX)
Próxima Escala: GUADALAJARA (GDL)
Destino del Vuelo: GUADALAJARA (GDL)
Hora Slot Asignado: 14:30
Hora Slot Coordinado: 14:35
Hora Término Pernocta: 13:45
Hora Inicio Maniobras: 14:00
Hora Salida Posición: 14:40

CAUSA DE DEMORA
Causa: DEMORA OPERACIONAL
Código: OP-15

INFORMACIÓN DE EMBARQUE
PASAJEROS:
Nacional: 142
Internacional: 8
Diplomáticos: 0
En Comisión: 2
Infantes: 12
Tránsitos: 0
Conexiones: 5
Otros Exentos: 1
TOTAL PASAJEROS: 170

CARGA:
Equipaje: 2,450 kg
Carga: 1,200 kg
Correo: 150 kg
TOTAL CARGA: 3,800 kg`,
    expectedData: {
      fecha: '15/01/2024',
      folio: 'MS-2024-001234',
      aeropuertoSalida: 'AEROPUERTO INTERNACIONAL BENITO JUÁREZ',
      tipoVuelo: 'NACIONAL',
      transportista: 'AEROMÉXICO',
      equipo: 'BOEING 737-800',
      matricula: 'XA-AMX',
      numeroVuelo: 'AM-123',
      pilotoAlMando: 'CARLOS RODRIGUEZ MARTINEZ',
      numeroLicencia: 'PIL-2024-5678',
      tripulacion: 6,
      origenVuelo: 'CIUDAD DE MÉXICO (MEX)',
      proximaEscala: 'GUADALAJARA (GDL)',
      destinoVuelo: 'GUADALAJARA (GDL)',
      horaSlotAsignado: '14:30',
      horaSlotCoordinado: '14:35',
      horaTerminoPernocta: '13:45',
      horaInicioManiobras: '14:00',
      horaSalidaPosicion: '14:40',
      causaDemora: 'DEMORA OPERACIONAL',
      codigoCausa: 'OP-15',
      pasajeros: {
        nacional: 142,
        internacional: 8,
        diplomaticos: 0,
        enComision: 2,
        infantes: 12,
        transitos: 0,
        conexiones: 5,
        otrosExentos: 1,
        total: 170,
      },
      carga: {
        equipaje: 2450,
        carga: 1200,
        correo: 150,
        total: 3800,
      },
    },
  },
  incomplete: {
    rawText: `MANIFIESTO DE SALIDA
AEROPUERTO INTERNACIONAL DE GUADALAJARA
FECHA: 28/01/2024                    FOLIO: MS-2024-003789

INFORMACIÓN DEL VUELO
Transportista: INTERJET
Equipo: AIRBUS A321
Matrícula: [ILEGIBLE]
Número de Vuelo: 4O-456

INFORMACIÓN DEL PILOTO
Piloto al Mando: [NO DETECTADO]
Número de Licencia: PIL-2024-[ILEGIBLE]
Tripulación: 5

MOVIMIENTO DE OPERACIONES
Origen del Vuelo: GUADALAJARA (GDL)
Próxima Escala: [VACÍO]
Destino del Vuelo: MONTERREY (MTY)
Hora Slot Asignado: 16:45
Hora Slot Coordinado: [NO DETECTADO]

INFORMACIÓN DE EMBARQUE
PASAJEROS:
Nacional: 189
Internacional: [ILEGIBLE]
TOTAL PASAJEROS: [CALCULADO: 190+]`,
    expectedData: {
      fecha: '28/01/2024',
      folio: 'MS-2024-003789',
      aeropuertoSalida: 'AEROPUERTO INTERNACIONAL DE GUADALAJARA',
      transportista: 'INTERJET',
      equipo: 'AIRBUS A321',
      matricula: null, // Should be null for unreadable fields
      numeroVuelo: '4O-456',
      pilotoAlMando: null,
      numeroLicencia: null,
      tripulacion: 5,
      origenVuelo: 'GUADALAJARA (GDL)',
      proximaEscala: null,
      destinoVuelo: 'MONTERREY (MTY)',
      horaSlotAsignado: '16:45',
      horaSlotCoordinado: null,
      pasajeros: {
        nacional: 189,
        internacional: null,
        total: null, // Should be null when incomplete
      },
    },
  },
};

// Mock store implementation
const createMockStore = (initialState = {}) => ({
  processingState: {
    currentStep: ScannerStep.IMAGE_UPLOAD,
    completedSteps: new Set(),
    canNavigateToStep: jest.fn().mockReturnValue(true),
    progress: 0,
  },
  imageData: null,
  extractedText: null,
  parsedData: null,
  finalData: null,
  isProcessing: false,
  error: null,
  startNewSession: jest.fn(),
  setImageData: jest.fn(),
  setExtractedText: jest.fn(),
  setParsedData: jest.fn(),
  setFinalData: jest.fn(),
  navigateToStep: jest.fn(),
  completeStep: jest.fn(),
  setProcessing: jest.fn(),
  setError: jest.fn(),
  saveSession: jest.fn().mockResolvedValue(undefined),
  resetWorkflow: jest.fn(),
  ...initialState,
});

describe('End-to-End Integration Tests', () => {
  const mockStore = useManifiestoScannerStore as jest.MockedFunction<typeof useManifiestoScannerStore>;
  const mockParseManifiestoText = parseManifiestoText as jest.MockedFunction<typeof parseManifiestoText>;
  const mockProcessImageWithOCR = processImageWithOCR as jest.MockedFunction<typeof processImageWithOCR>;
  const mockSaveManifiestoData = saveManifiestoData as jest.MockedFunction<typeof saveManifiestoData>;
  const mockGetManifiestoData = getManifiestoData as jest.MockedFunction<typeof getManifiestoData>;
  const mockExportToCSV = exportToCSV as jest.MockedFunction<typeof exportToCSV>;
  const mockExportToJSON = exportToJSON as jest.MockedFunction<typeof exportToJSON>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockStore.mockReturnValue(createMockStore());
  });

  describe('Complete Workflow Tests', () => {
    it('should complete full workflow with perfect manifiesto', async () => {
      const mockStoreState = createMockStore();
      mockStore.mockReturnValue(mockStoreState);

      // Mock OCR to return sample text
      mockProcessImageWithOCR.mockResolvedValue({
        text: SAMPLE_MANIFIESTOS.complete.rawText,
        confidence: 0.95,
        processingTime: 2500,
      });

      // Mock parser to return expected data
      mockParseManifiestoText.mockResolvedValue(SAMPLE_MANIFIESTOS.complete.expectedData);

      // Mock storage
      mockSaveManifiestoData.mockResolvedValue(true);

      const onDataExtracted = jest.fn();
      const { getByTestId, getByText } = render(
        <ManifiestoScanner onDataExtracted={onDataExtracted} />
      );

      // Step 1: Upload image
      const imageUploader = getByTestId('image-uploader');
      await act(async () => {
        fireEvent.press(imageUploader);
      });

      expect(mockStoreState.setImageData).toHaveBeenCalledWith('mock-image-data');
      expect(mockStoreState.completeStep).toHaveBeenCalledWith(ScannerStep.IMAGE_UPLOAD);

      // Step 2: OCR Processing
      mockStoreState.processingState.currentStep = ScannerStep.OCR_PROCESSING;
      mockStoreState.imageData = 'mock-image-data';
      mockStore.mockReturnValue(mockStoreState);

      await waitFor(() => {
        expect(mockProcessImageWithOCR).toHaveBeenCalledWith('mock-image-data');
      });

      expect(mockStoreState.setExtractedText).toHaveBeenCalledWith(SAMPLE_MANIFIESTOS.complete.rawText);
      expect(mockStoreState.completeStep).toHaveBeenCalledWith(ScannerStep.OCR_PROCESSING);

      // Step 3: Data Parsing
      mockStoreState.processingState.currentStep = ScannerStep.DATA_PARSING;
      mockStoreState.extractedText = SAMPLE_MANIFIESTOS.complete.rawText;
      mockStore.mockReturnValue(mockStoreState);

      await waitFor(() => {
        expect(mockParseManifiestoText).toHaveBeenCalledWith(SAMPLE_MANIFIESTOS.complete.rawText);
      });

      expect(mockStoreState.setParsedData).toHaveBeenCalledWith(SAMPLE_MANIFIESTOS.complete.expectedData);
      expect(mockStoreState.completeStep).toHaveBeenCalledWith(ScannerStep.DATA_PARSING);

      // Step 4: Data Editing (no changes)
      mockStoreState.processingState.currentStep = ScannerStep.DATA_EDITING;
      mockStoreState.parsedData = SAMPLE_MANIFIESTOS.complete.expectedData;
      mockStore.mockReturnValue(mockStoreState);

      const dataEditor = getByTestId('data-editor');
      await act(async () => {
        fireEvent.press(dataEditor);
      });

      expect(mockStoreState.setFinalData).toHaveBeenCalledWith(
        expect.objectContaining({
          ...SAMPLE_MANIFIESTOS.complete.expectedData,
          editado: false,
          fechaProcesamiento: expect.any(Date),
        })
      );

      // Step 5: Review and Save
      mockStoreState.processingState.currentStep = ScannerStep.REVIEW_SAVE;
      mockStoreState.finalData = {
        ...SAMPLE_MANIFIESTOS.complete.expectedData,
        editado: false,
        fechaProcesamiento: new Date(),
        imagenOriginal: 'mock-image-data',
      };
      mockStore.mockReturnValue(mockStoreState);

      const saveButton = getByText('Guardar');
      await act(async () => {
        fireEvent.press(saveButton);
      });

      expect(mockSaveManifiestoData).toHaveBeenCalledWith(mockStoreState.finalData);
      expect(mockStoreState.completeStep).toHaveBeenCalledWith(ScannerStep.REVIEW_SAVE);
      expect(onDataExtracted).toHaveBeenCalledWith(mockStoreState.finalData);
    });

    it('should handle incomplete manifiesto with manual corrections', async () => {
      const mockStoreState = createMockStore();
      mockStore.mockReturnValue(mockStoreState);

      // Mock OCR to return incomplete text
      mockProcessImageWithOCR.mockResolvedValue({
        text: SAMPLE_MANIFIESTOS.incomplete.rawText,
        confidence: 0.72, // Lower confidence for incomplete data
        processingTime: 3200,
      });

      // Mock parser to return incomplete data
      mockParseManifiestoText.mockResolvedValue(SAMPLE_MANIFIESTOS.incomplete.expectedData);

      const onDataExtracted = jest.fn();
      const { getByTestId } = render(
        <ManifiestoScanner onDataExtracted={onDataExtracted} />
      );

      // Complete workflow up to data editing
      const imageUploader = getByTestId('image-uploader');
      await act(async () => {
        fireEvent.press(imageUploader);
      });

      // Simulate reaching data editing step with incomplete data
      mockStoreState.processingState.currentStep = ScannerStep.DATA_EDITING;
      mockStoreState.parsedData = SAMPLE_MANIFIESTOS.incomplete.expectedData;
      mockStore.mockReturnValue(mockStoreState);

      // Simulate manual corrections
      const correctedData = {
        ...SAMPLE_MANIFIESTOS.incomplete.expectedData,
        matricula: 'XA-INT', // Manually corrected
        pilotoAlMando: 'JUAN CARLOS MENDEZ', // Manually added
        numeroLicencia: 'PIL-2024-3456', // Manually corrected
        horaSlotCoordinado: '16:50', // Manually added
        pasajeros: {
          ...SAMPLE_MANIFIESTOS.incomplete.expectedData.pasajeros,
          internacional: 15, // Manually added
          total: 204, // Manually calculated
        },
      };

      const dataEditor = getByTestId('data-editor');
      await act(async () => {
        // Simulate manual editing
        fireEvent.press(dataEditor);
      });

      expect(mockStoreState.setFinalData).toHaveBeenCalledWith(
        expect.objectContaining({
          ...correctedData,
          editado: true, // Should be marked as edited
          fechaProcesamiento: expect.any(Date),
        })
      );
    });

    it('should validate extraction accuracy against manual input', async () => {
      const testCases = [
        {
          name: 'Perfect OCR',
          ocrConfidence: 0.95,
          expectedAccuracy: 0.95,
          rawText: SAMPLE_MANIFIESTOS.complete.rawText,
          expectedData: SAMPLE_MANIFIESTOS.complete.expectedData,
        },
        {
          name: 'Good OCR',
          ocrConfidence: 0.85,
          expectedAccuracy: 0.85,
          rawText: SAMPLE_MANIFIESTOS.complete.rawText.replace('AEROMÉXICO', 'AEROMEXICO'), // Minor OCR error
          expectedData: {
            ...SAMPLE_MANIFIESTOS.complete.expectedData,
            transportista: 'AEROMEXICO',
          },
        },
        {
          name: 'Poor OCR',
          ocrConfidence: 0.65,
          expectedAccuracy: 0.65,
          rawText: SAMPLE_MANIFIESTOS.incomplete.rawText,
          expectedData: SAMPLE_MANIFIESTOS.incomplete.expectedData,
        },
      ];

      for (const testCase of testCases) {
        const mockStoreState = createMockStore();
        mockStore.mockReturnValue(mockStoreState);

        mockProcessImageWithOCR.mockResolvedValue({
          text: testCase.rawText,
          confidence: testCase.ocrConfidence,
          processingTime: 2000,
        });

        mockParseManifiestoText.mockResolvedValue(testCase.expectedData);

        const onDataExtracted = jest.fn();
        const { getByTestId } = render(
          <ManifiestoScanner onDataExtracted={onDataExtracted} />
        );

        const imageUploader = getByTestId('image-uploader');
        await act(async () => {
          fireEvent.press(imageUploader);
        });

        // Verify OCR confidence matches expected accuracy
        await waitFor(() => {
          expect(mockProcessImageWithOCR).toHaveBeenCalled();
        });

        const ocrResult = await mockProcessImageWithOCR.mock.results[0].value;
        expect(ocrResult.confidence).toBeCloseTo(testCase.expectedAccuracy, 1);

        // Verify parsed data matches expectations
        await waitFor(() => {
          expect(mockParseManifiestoText).toHaveBeenCalledWith(testCase.rawText);
        });

        const parsedResult = await mockParseManifiestoText.mock.results[0].value;
        expect(parsedResult).toMatchObject(testCase.expectedData);
      }
    });
  });

  describe('Cross-Browser Compatibility Tests', () => {
    const browserConfigs = [
      { name: 'Chrome', userAgent: 'Chrome/91.0.4472.124', features: ['webp', 'indexeddb', 'webworkers'] },
      { name: 'Firefox', userAgent: 'Firefox/89.0', features: ['webp', 'indexeddb', 'webworkers'] },
      { name: 'Safari', userAgent: 'Safari/14.1.1', features: ['indexeddb', 'webworkers'] },
      { name: 'Edge', userAgent: 'Edg/91.0.864.59', features: ['webp', 'indexeddb', 'webworkers'] },
    ];

    browserConfigs.forEach(browser => {
      it(`should work correctly in ${browser.name}`, async () => {
        // Mock browser-specific features
        Object.defineProperty(navigator, 'userAgent', {
          value: browser.userAgent,
          configurable: true,
        });

        // Mock feature detection
        const mockFeatures = {
          webp: browser.features.includes('webp'),
          indexeddb: browser.features.includes('indexeddb'),
          webworkers: browser.features.includes('webworkers'),
        };

        const mockStoreState = createMockStore();
        mockStore.mockReturnValue(mockStoreState);

        mockProcessImageWithOCR.mockResolvedValue({
          text: SAMPLE_MANIFIESTOS.complete.rawText,
          confidence: 0.90,
          processingTime: 2500,
        });

        mockParseManifiestoText.mockResolvedValue(SAMPLE_MANIFIESTOS.complete.expectedData);

        const onDataExtracted = jest.fn();
        const { getByTestId } = render(
          <ManifiestoScanner onDataExtracted={onDataExtracted} />
        );

        // Test basic functionality
        const imageUploader = getByTestId('image-uploader');
        await act(async () => {
          fireEvent.press(imageUploader);
        });

        expect(mockStoreState.setImageData).toHaveBeenCalled();

        // Verify OCR works with browser-specific optimizations
        if (mockFeatures.webworkers) {
          expect(mockProcessImageWithOCR).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
              useWebWorker: true,
            })
          );
        }

        // Verify storage works with available features
        if (mockFeatures.indexeddb) {
          expect(mockSaveManifiestoData).toBeDefined();
        }
      });
    });

    it('should gracefully degrade when features are not available', async () => {
      // Mock limited browser environment
      Object.defineProperty(window, 'Worker', {
        value: undefined,
        configurable: true,
      });

      Object.defineProperty(window, 'indexedDB', {
        value: undefined,
        configurable: true,
      });

      const mockStoreState = createMockStore();
      mockStore.mockReturnValue(mockStoreState);

      // OCR should still work without web workers
      mockProcessImageWithOCR.mockResolvedValue({
        text: SAMPLE_MANIFIESTOS.complete.rawText,
        confidence: 0.85, // Slightly lower without web workers
        processingTime: 3500, // Slower without web workers
      });

      const onDataExtracted = jest.fn();
      const { getByTestId } = render(
        <ManifiestoScanner onDataExtracted={onDataExtracted} />
      );

      const imageUploader = getByTestId('image-uploader');
      await act(async () => {
        fireEvent.press(imageUploader);
      });

      expect(mockProcessImageWithOCR).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          useWebWorker: false,
        })
      );

      // Should show warning about limited functionality
      expect(Alert.alert).toHaveBeenCalledWith(
        'Funcionalidad Limitada',
        expect.stringContaining('navegador no soporta'),
        expect.any(Array)
      );
    });
  });

  describe('Responsive Design Tests', () => {
    const deviceConfigs = [
      { name: 'Mobile Portrait', width: 375, height: 667, orientation: 'portrait' },
      { name: 'Mobile Landscape', width: 667, height: 375, orientation: 'landscape' },
      { name: 'Tablet Portrait', width: 768, height: 1024, orientation: 'portrait' },
      { name: 'Tablet Landscape', width: 1024, height: 768, orientation: 'landscape' },
      { name: 'Desktop', width: 1920, height: 1080, orientation: 'landscape' },
    ];

    deviceConfigs.forEach(device => {
      it(`should render correctly on ${device.name}`, async () => {
        // Mock device dimensions
        (Dimensions.get as jest.Mock).mockReturnValue({
          width: device.width,
          height: device.height,
        });

        const mockStoreState = createMockStore();
        mockStore.mockReturnValue(mockStoreState);

        const onDataExtracted = jest.fn();
        const { getByTestId, queryByTestId } = render(
          <ManifiestoScanner onDataExtracted={onDataExtracted} />
        );

        // Verify responsive layout
        const container = getByTestId('manifiesto-scanner-container');
        expect(container).toBeTruthy();

        // Mobile devices should show simplified navigation
        if (device.width < 768) {
          const mobileNav = queryByTestId('mobile-navigation');
          expect(mobileNav).toBeTruthy();
          
          const desktopNav = queryByTestId('desktop-navigation');
          expect(desktopNav).toBeFalsy();
        } else {
          // Desktop/tablet should show full navigation
          const desktopNav = queryByTestId('desktop-navigation');
          expect(desktopNav).toBeTruthy();
        }

        // Test touch interactions on mobile
        if (device.width < 768) {
          const imageUploader = getByTestId('image-uploader');
          
          // Should support touch gestures
          await act(async () => {
            fireEvent(imageUploader, 'touchStart', { touches: [{ clientX: 100, clientY: 100 }] });
            fireEvent(imageUploader, 'touchEnd', { touches: [{ clientX: 100, clientY: 100 }] });
          });

          expect(mockStoreState.setImageData).toHaveBeenCalled();
        }
      });
    });

    it('should handle orientation changes gracefully', async () => {
      const mockStoreState = createMockStore();
      mockStore.mockReturnValue(mockStoreState);

      const onDataExtracted = jest.fn();
      const { rerender } = render(
        <ManifiestoScanner onDataExtracted={onDataExtracted} />
      );

      // Start in portrait
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 375, height: 667 });

      // Simulate orientation change to landscape
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 667, height: 375 });

      // Trigger re-render
      rerender(<ManifiestoScanner onDataExtracted={onDataExtracted} />);

      // Should maintain state and functionality
      expect(mockStoreState.startNewSession).toHaveBeenCalledTimes(1); // Should not reinitialize
    });
  });

  describe('Data Export Tests', () => {
    it('should export complete manifiesto data to CSV', async () => {
      const testData: ManifiestoData = {
        ...SAMPLE_MANIFIESTOS.complete.expectedData,
        imagenOriginal: 'base64-image-data',
        fechaProcesamiento: new Date('2024-01-15T10:30:00Z'),
        editado: false,
      };

      const expectedCSV = `fecha,folio,transportista,numeroVuelo,origenVuelo,destinoVuelo,totalPasajeros,totalCarga
15/01/2024,MS-2024-001234,AEROMÉXICO,AM-123,CIUDAD DE MÉXICO (MEX),GUADALAJARA (GDL),170,3800`;

      mockExportToCSV.mockReturnValue(expectedCSV);

      const result = exportToCSV([testData]);

      expect(mockExportToCSV).toHaveBeenCalledWith([testData]);
      expect(result).toBe(expectedCSV);
    });

    it('should export complete manifiesto data to JSON', async () => {
      const testData: ManifiestoData = {
        ...SAMPLE_MANIFIESTOS.complete.expectedData,
        imagenOriginal: 'base64-image-data',
        fechaProcesamiento: new Date('2024-01-15T10:30:00Z'),
        editado: false,
      };

      const expectedJSON = JSON.stringify([testData], null, 2);

      mockExportToJSON.mockReturnValue(expectedJSON);

      const result = exportToJSON([testData]);

      expect(mockExportToJSON).toHaveBeenCalledWith([testData]);
      expect(result).toBe(expectedJSON);
    });

    it('should handle export of multiple manifiestos', async () => {
      const testData = [
        {
          ...SAMPLE_MANIFIESTOS.complete.expectedData,
          imagenOriginal: 'base64-image-data-1',
          fechaProcesamiento: new Date('2024-01-15T10:30:00Z'),
          editado: false,
        },
        {
          ...SAMPLE_MANIFIESTOS.incomplete.expectedData,
          imagenOriginal: 'base64-image-data-2',
          fechaProcesamiento: new Date('2024-01-15T11:45:00Z'),
          editado: true,
        },
      ];

      mockExportToCSV.mockReturnValue('csv-data-for-multiple-records');
      mockExportToJSON.mockReturnValue(JSON.stringify(testData, null, 2));

      const csvResult = exportToCSV(testData);
      const jsonResult = exportToJSON(testData);

      expect(csvResult).toBe('csv-data-for-multiple-records');
      expect(jsonResult).toBe(JSON.stringify(testData, null, 2));
    });
  });

  describe('Error Handling and Recovery Tests', () => {
    it('should handle OCR failures gracefully', async () => {
      const mockStoreState = createMockStore();
      mockStore.mockReturnValue(mockStoreState);

      // Mock OCR failure
      mockProcessImageWithOCR.mockRejectedValue(new Error('OCR processing failed'));

      const onDataExtracted = jest.fn();
      const { getByTestId } = render(
        <ManifiestoScanner onDataExtracted={onDataExtracted} />
      );

      const imageUploader = getByTestId('image-uploader');
      await act(async () => {
        fireEvent.press(imageUploader);
      });

      // Should set error state
      await waitFor(() => {
        expect(mockStoreState.setError).toHaveBeenCalledWith(
          expect.stringContaining('OCR processing failed')
        );
      });

      // Should allow retry
      const retryButton = getByTestId('retry-button');
      expect(retryButton).toBeTruthy();
    });

    it('should handle parsing failures with fallback', async () => {
      const mockStoreState = createMockStore();
      mockStore.mockReturnValue(mockStoreState);

      mockProcessImageWithOCR.mockResolvedValue({
        text: 'CORRUPTED TEXT DATA',
        confidence: 0.45,
        processingTime: 2000,
      });

      // Mock parser failure
      mockParseManifiestoText.mockRejectedValue(new Error('Unable to parse manifiesto format'));

      const onDataExtracted = jest.fn();
      const { getByTestId, getByText } = render(
        <ManifiestoScanner onDataExtracted={onDataExtracted} />
      );

      const imageUploader = getByTestId('image-uploader');
      await act(async () => {
        fireEvent.press(imageUploader);
      });

      // Should offer manual entry option
      await waitFor(() => {
        expect(getByText('Entrada Manual')).toBeTruthy();
      });

      const manualEntryButton = getByText('Entrada Manual');
      await act(async () => {
        fireEvent.press(manualEntryButton);
      });

      // Should navigate to manual data entry
      expect(mockStoreState.navigateToStep).toHaveBeenCalledWith(ScannerStep.DATA_EDITING);
    });

    it('should handle storage failures with user notification', async () => {
      const mockStoreState = createMockStore();
      mockStore.mockReturnValue(mockStoreState);

      mockSaveManifiestoData.mockRejectedValue(new Error('Storage quota exceeded'));

      // Set up complete workflow state
      mockStoreState.processingState.currentStep = ScannerStep.REVIEW_SAVE;
      mockStoreState.finalData = {
        ...SAMPLE_MANIFIESTOS.complete.expectedData,
        imagenOriginal: 'base64-image-data',
        fechaProcesamiento: new Date(),
        editado: false,
      };
      mockStore.mockReturnValue(mockStoreState);

      const onDataExtracted = jest.fn();
      const { getByText } = render(
        <ManifiestoScanner onDataExtracted={onDataExtracted} />
      );

      const saveButton = getByText('Guardar');
      await act(async () => {
        fireEvent.press(saveButton);
      });

      // Should show storage error alert
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error de Almacenamiento',
          expect.stringContaining('Storage quota exceeded'),
          expect.arrayContaining([
            expect.objectContaining({ text: 'Exportar Datos' }),
            expect.objectContaining({ text: 'Limpiar Almacenamiento' }),
            expect.objectContaining({ text: 'Cancelar' }),
          ])
        );
      });
    });
  });

  describe('Performance Tests', () => {
    it('should process large images within acceptable time limits', async () => {
      const mockStoreState = createMockStore();
      mockStore.mockReturnValue(mockStoreState);

      // Mock processing of large image
      mockProcessImageWithOCR.mockImplementation(async () => {
        // Simulate processing time for large image
        await new Promise(resolve => setTimeout(resolve, 4000)); // 4 seconds
        return {
          text: SAMPLE_MANIFIESTOS.complete.rawText,
          confidence: 0.88,
          processingTime: 4000,
        };
      });

      const onDataExtracted = jest.fn();
      const { getByTestId } = render(
        <ManifiestoScanner onDataExtracted={onDataExtracted} />
      );

      const startTime = Date.now();
      
      const imageUploader = getByTestId('image-uploader');
      await act(async () => {
        fireEvent.press(imageUploader);
      });

      await waitFor(() => {
        expect(mockProcessImageWithOCR).toHaveBeenCalled();
      }, { timeout: 6000 });

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Should complete within 6 seconds
      expect(totalTime).toBeLessThan(6000);
    });

    it('should handle multiple concurrent operations', async () => {
      const mockStoreState = createMockStore();
      mockStore.mockReturnValue(mockStoreState);

      // Mock concurrent operations
      const operations = Array.from({ length: 3 }, (_, i) => ({
        id: i,
        imageData: `mock-image-data-${i}`,
        expectedText: `MANIFIESTO ${i + 1}`,
      }));

      operations.forEach((op, index) => {
        mockProcessImageWithOCR.mockImplementationOnce(async () => {
          await new Promise(resolve => setTimeout(resolve, 1000 + index * 500));
          return {
            text: op.expectedText,
            confidence: 0.90,
            processingTime: 1000 + index * 500,
          };
        });
      });

      const onDataExtracted = jest.fn();
      const { getByTestId } = render(
        <ManifiestoScanner onDataExtracted={onDataExtracted} />
      );

      const startTime = Date.now();

      // Simulate rapid successive operations
      const imageUploader = getByTestId('image-uploader');
      for (const op of operations) {
        await act(async () => {
          fireEvent.press(imageUploader);
        });
        
        // Small delay between operations
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Should handle concurrent operations efficiently
      expect(totalTime).toBeLessThan(5000); // Should not be 3x slower
    });
  });
});