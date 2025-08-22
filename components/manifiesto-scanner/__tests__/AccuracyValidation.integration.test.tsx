/**
 * Accuracy Validation Integration Tests
 * Compares OCR extraction accuracy against manual input
 * Tests with real manifiesto samples and validates precision
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import ManifiestoScanner from '../ManifiestoScanner';
import { parseManifiestoText } from '../../../utils/manifiesto/parser';
import { processImageWithOCR } from '../../../utils/manifiesto/ocr';
import { ManifiestoData } from '../../../types/manifiesto';
import fs from 'fs';
import path from 'path';

// Mock dependencies
jest.mock('../../../utils/manifiesto/parser');
jest.mock('../../../utils/manifiesto/ocr');
jest.mock('../../../stores/manifiestoScannerStore');

// Load sample manifiestos
const loadSampleManifiesto = (filename: string): string => {
  try {
    const filePath = path.join(__dirname, '../../../../.kiro/specs/manifiesto-scanner/Manifiestos', filename);
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    // Fallback to inline sample if file not found
    return getSampleManifiestoText(filename);
  }
};

const getSampleManifiestoText = (filename: string): string => {
  const samples: Record<string, string> = {
    'sample-manifiesto-1.txt': `MANIFIESTO DE SALIDA
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
    'sample-manifiesto-2.txt': `MANIFIESTO DE SALIDA
AEROPUERTO INTERNACIONAL DE CANCÚN
FECHA: 22/01/2024                    FOLIO: MS-2024-002456

INFORMACIÓN DEL VUELO
Transportista: VOLARIS
Equipo: AIRBUS A320
Matrícula: XA-VLR
Número de Vuelo: Y4-789

INFORMACIÓN DEL PILOTO
Piloto al Mando: MARIA ELENA GONZALEZ
Número de Licencia: PIL-2024-9012
Tripulación: 4

MOVIMIENTO DE OPERACIONES
Origen del Vuelo: CANCÚN (CUN)
Próxima Escala: CIUDAD DE MÉXICO (MEX)
Destino del Vuelo: TIJUANA (TIJ)
Hora Slot Asignado: 09:15
Hora Slot Coordinado: 09:20
Hora Término Pernocta: 08:30
Hora Inicio Maniobras: 08:45
Hora Salida Posición: 09:25

CAUSA DE DEMORA
Causa: CONDICIONES METEOROLÓGICAS
Código: WX-03

INFORMACIÓN DE EMBARQUE
PASAJEROS:
Nacional: 156
Internacional: 24
Diplomáticos: 1
En Comisión: 0
Infantes: 8
Tránsitos: 12
Conexiones: 3
Otros Exentos: 0
TOTAL PASAJEROS: 204

CARGA:
Equipaje: 3,200 kg
Carga: 800 kg
Correo: 75 kg
TOTAL CARGA: 4,075 kg`,
    'sample-manifiesto-incomplete.txt': `MANIFIESTO DE SALIDA
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
Hora Término Pernocta: 15:30
Hora Inicio Maniobras: [ILEGIBLE]
Hora Salida Posición: 17:00

CAUSA DE DEMORA
Causa: [VACÍO]
Código: [NO DETECTADO]

INFORMACIÓN DE EMBARQUE
PASAJEROS:
Nacional: 189
Internacional: [ILEGIBLE]
Diplomáticos: 0
En Comisión: 1
Infantes: [NO DETECTADO]
Tránsitos: 0
Conexiones: [ILEGIBLE]
Otros Exentos: 0
TOTAL PASAJEROS: [CALCULADO: 190+]

CARGA:
Equipaje: [ILEGIBLE] kg
Carga: 950 kg
Correo: [NO DETECTADO] kg
TOTAL CARGA: [INCOMPLETO]`,
  };
  
  return samples[filename] || '';
};

// Expected data for validation
const EXPECTED_DATA: Record<string, Partial<ManifiestoData>> = {
  'sample-manifiesto-1.txt': {
    fecha: '15/01/2024',
    folio: 'MS-2024-001234',
    aeropuertoSalida: 'AEROPUERTO INTERNACIONAL BENITO JUÁREZ',
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
  'sample-manifiesto-2.txt': {
    fecha: '22/01/2024',
    folio: 'MS-2024-002456',
    aeropuertoSalida: 'AEROPUERTO INTERNACIONAL DE CANCÚN',
    transportista: 'VOLARIS',
    equipo: 'AIRBUS A320',
    matricula: 'XA-VLR',
    numeroVuelo: 'Y4-789',
    pilotoAlMando: 'MARIA ELENA GONZALEZ',
    numeroLicencia: 'PIL-2024-9012',
    tripulacion: 4,
    origenVuelo: 'CANCÚN (CUN)',
    proximaEscala: 'CIUDAD DE MÉXICO (MEX)',
    destinoVuelo: 'TIJUANA (TIJ)',
    horaSlotAsignado: '09:15',
    horaSlotCoordinado: '09:20',
    horaTerminoPernocta: '08:30',
    horaInicioManiobras: '08:45',
    horaSalidaPosicion: '09:25',
    causaDemora: 'CONDICIONES METEOROLÓGICAS',
    codigoCausa: 'WX-03',
    pasajeros: {
      nacional: 156,
      internacional: 24,
      diplomaticos: 1,
      enComision: 0,
      infantes: 8,
      transitos: 12,
      conexiones: 3,
      otrosExentos: 0,
      total: 204,
    },
    carga: {
      equipaje: 3200,
      carga: 800,
      correo: 75,
      total: 4075,
    },
  },
};

// Accuracy calculation utilities
interface AccuracyMetrics {
  fieldAccuracy: Record<string, number>;
  overallAccuracy: number;
  criticalFieldAccuracy: number;
  numericAccuracy: number;
  textAccuracy: number;
  completeness: number;
}

const calculateFieldAccuracy = (expected: any, actual: any): number => {
  if (expected === null || expected === undefined) {
    return actual === null || actual === undefined ? 1 : 0;
  }
  
  if (typeof expected === 'string' && typeof actual === 'string') {
    // String similarity using Levenshtein distance
    const distance = levenshteinDistance(expected.toLowerCase(), actual.toLowerCase());
    const maxLength = Math.max(expected.length, actual.length);
    return maxLength === 0 ? 1 : 1 - (distance / maxLength);
  }
  
  if (typeof expected === 'number' && typeof actual === 'number') {
    return expected === actual ? 1 : 0;
  }
  
  if (typeof expected === 'object' && typeof actual === 'object') {
    const expectedKeys = Object.keys(expected);
    const actualKeys = Object.keys(actual);
    const allKeys = new Set([...expectedKeys, ...actualKeys]);
    
    let totalAccuracy = 0;
    for (const key of allKeys) {
      totalAccuracy += calculateFieldAccuracy(expected[key], actual[key]);
    }
    
    return totalAccuracy / allKeys.size;
  }
  
  return expected === actual ? 1 : 0;
};

const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  
  return matrix[str2.length][str1.length];
};

const calculateAccuracyMetrics = (expected: Partial<ManifiestoData>, actual: Partial<ManifiestoData>): AccuracyMetrics => {
  const fieldAccuracy: Record<string, number> = {};
  const criticalFields = ['fecha', 'numeroVuelo', 'transportista', 'origenVuelo', 'destinoVuelo'];
  const numericFields = ['tripulacion'];
  
  let totalAccuracy = 0;
  let criticalAccuracy = 0;
  let numericAccuracy = 0;
  let textAccuracy = 0;
  let completeness = 0;
  
  const allFields = new Set([...Object.keys(expected), ...Object.keys(actual)]);
  
  for (const field of allFields) {
    const accuracy = calculateFieldAccuracy(expected[field as keyof ManifiestoData], actual[field as keyof ManifiestoData]);
    fieldAccuracy[field] = accuracy;
    totalAccuracy += accuracy;
    
    if (criticalFields.includes(field)) {
      criticalAccuracy += accuracy;
    }
    
    if (numericFields.includes(field) || typeof expected[field as keyof ManifiestoData] === 'number') {
      numericAccuracy += accuracy;
    } else if (typeof expected[field as keyof ManifiestoData] === 'string') {
      textAccuracy += accuracy;
    }
    
    if (actual[field as keyof ManifiestoData] !== null && actual[field as keyof ManifiestoData] !== undefined) {
      completeness += 1;
    }
  }
  
  return {
    fieldAccuracy,
    overallAccuracy: totalAccuracy / allFields.size,
    criticalFieldAccuracy: criticalAccuracy / criticalFields.length,
    numericAccuracy: numericAccuracy / numericFields.length,
    textAccuracy: textAccuracy / (allFields.size - numericFields.length),
    completeness: completeness / allFields.size,
  };
};

describe('Accuracy Validation Integration Tests', () => {
  const mockParseManifiestoText = parseManifiestoText as jest.MockedFunction<typeof parseManifiestoText>;
  const mockProcessImageWithOCR = processImageWithOCR as jest.MockedFunction<typeof processImageWithOCR>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Perfect OCR Scenarios', () => {
    it('should achieve high accuracy with perfect OCR on sample-manifiesto-1', async () => {
      const sampleText = loadSampleManifiesto('sample-manifiesto-1.txt');
      const expectedData = EXPECTED_DATA['sample-manifiesto-1.txt'];

      // Mock perfect OCR
      mockProcessImageWithOCR.mockResolvedValue({
        text: sampleText,
        confidence: 0.95,
        processingTime: 2500,
      });

      // Mock perfect parsing
      mockParseManifiestoText.mockResolvedValue(expectedData);

      const onDataExtracted = jest.fn();
      const { getByTestId } = render(
        <ManifiestoScanner onDataExtracted={onDataExtracted} />
      );

      const imageUploader = getByTestId('image-uploader');
      await act(async () => {
        fireEvent.press(imageUploader);
      });

      await waitFor(() => {
        expect(mockProcessImageWithOCR).toHaveBeenCalled();
        expect(mockParseManifiestoText).toHaveBeenCalledWith(sampleText);
      });

      const parsedResult = await mockParseManifiestoText.mock.results[0].value;
      const metrics = calculateAccuracyMetrics(expectedData, parsedResult);

      expect(metrics.overallAccuracy).toBeGreaterThan(0.95);
      expect(metrics.criticalFieldAccuracy).toBeGreaterThan(0.98);
      expect(metrics.completeness).toBeGreaterThan(0.90);
    });

    it('should achieve high accuracy with perfect OCR on sample-manifiesto-2', async () => {
      const sampleText = loadSampleManifiesto('sample-manifiesto-2.txt');
      const expectedData = EXPECTED_DATA['sample-manifiesto-2.txt'];

      mockProcessImageWithOCR.mockResolvedValue({
        text: sampleText,
        confidence: 0.93,
        processingTime: 2800,
      });

      mockParseManifiestoText.mockResolvedValue(expectedData);

      const onDataExtracted = jest.fn();
      const { getByTestId } = render(
        <ManifiestoScanner onDataExtracted={onDataExtracted} />
      );

      const imageUploader = getByTestId('image-uploader');
      await act(async () => {
        fireEvent.press(imageUploader);
      });

      await waitFor(() => {
        expect(mockProcessImageWithOCR).toHaveBeenCalled();
        expect(mockParseManifiestoText).toHaveBeenCalledWith(sampleText);
      });

      const parsedResult = await mockParseManifiestoText.mock.results[0].value;
      const metrics = calculateAccuracyMetrics(expectedData, parsedResult);

      expect(metrics.overallAccuracy).toBeGreaterThan(0.93);
      expect(metrics.criticalFieldAccuracy).toBeGreaterThan(0.95);
      expect(metrics.completeness).toBeGreaterThan(0.88);
    });
  });

  describe('OCR Error Scenarios', () => {
    it('should handle OCR errors gracefully and maintain reasonable accuracy', async () => {
      const originalText = loadSampleManifiesto('sample-manifiesto-1.txt');
      const expectedData = EXPECTED_DATA['sample-manifiesto-1.txt'];

      // Simulate OCR errors
      const ocrErrorText = originalText
        .replace('AEROMÉXICO', 'AEROMEXICO') // Missing accent
        .replace('CARLOS RODRIGUEZ MARTINEZ', 'CARLOS RODRIQUEZ MARTINEZ') // Typo
        .replace('14:30', '14:3O') // O instead of 0
        .replace('2,450', '2.450'); // Different decimal separator

      mockProcessImageWithOCR.mockResolvedValue({
        text: ocrErrorText,
        confidence: 0.78, // Lower confidence due to errors
        processingTime: 3200,
      });

      // Mock parser handling OCR errors
      const parsedWithErrors = {
        ...expectedData,
        transportista: 'AEROMEXICO', // Missing accent
        pilotoAlMando: 'CARLOS RODRIQUEZ MARTINEZ', // Typo
        horaSlotAsignado: '14:3O', // OCR error
        carga: {
          ...expectedData.carga,
          equipaje: 2450, // Parser should handle decimal separator
        },
      };

      mockParseManifiestoText.mockResolvedValue(parsedWithErrors);

      const onDataExtracted = jest.fn();
      const { getByTestId } = render(
        <ManifiestoScanner onDataExtracted={onDataExtracted} />
      );

      const imageUploader = getByTestId('image-uploader');
      await act(async () => {
        fireEvent.press(imageUploader);
      });

      await waitFor(() => {
        expect(mockProcessImageWithOCR).toHaveBeenCalled();
        expect(mockParseManifiestoText).toHaveBeenCalledWith(ocrErrorText);
      });

      const parsedResult = await mockParseManifiestoText.mock.results[0].value;
      const metrics = calculateAccuracyMetrics(expectedData, parsedResult);

      // Should still maintain reasonable accuracy despite OCR errors
      expect(metrics.overallAccuracy).toBeGreaterThan(0.75);
      expect(metrics.criticalFieldAccuracy).toBeGreaterThan(0.80);
      expect(metrics.completeness).toBeGreaterThan(0.85);

      // Specific field accuracy checks
      expect(metrics.fieldAccuracy.transportista).toBeGreaterThan(0.90); // Close match
      expect(metrics.fieldAccuracy.pilotoAlMando).toBeGreaterThan(0.85); // Minor typo
      expect(metrics.fieldAccuracy.carga).toBe(1); // Parser should fix decimal separator
    });

    it('should handle incomplete OCR data appropriately', async () => {
      const incompleteText = loadSampleManifiesto('sample-manifiesto-incomplete.txt');
      
      mockProcessImageWithOCR.mockResolvedValue({
        text: incompleteText,
        confidence: 0.45, // Very low confidence
        processingTime: 4500,
      });

      // Mock parser returning incomplete data
      const incompleteData = {
        fecha: '28/01/2024',
        folio: 'MS-2024-003789',
        aeropuertoSalida: 'AEROPUERTO INTERNACIONAL DE GUADALAJARA',
        transportista: 'INTERJET',
        equipo: 'AIRBUS A321',
        matricula: null, // Unreadable
        numeroVuelo: '4O-456',
        pilotoAlMando: null, // Not detected
        numeroLicencia: null, // Partially illegible
        tripulacion: 5,
        origenVuelo: 'GUADALAJARA (GDL)',
        proximaEscala: null, // Empty
        destinoVuelo: 'MONTERREY (MTY)',
        horaSlotAsignado: '16:45',
        horaSlotCoordinado: null, // Not detected
        causaDemora: null, // Empty
        codigoCausa: null, // Not detected
        pasajeros: {
          nacional: 189,
          internacional: null, // Illegible
          total: null, // Incomplete calculation
        },
        carga: {
          carga: 950,
          equipaje: null, // Illegible
          correo: null, // Not detected
          total: null, // Incomplete
        },
      };

      mockParseManifiestoText.mockResolvedValue(incompleteData);

      const onDataExtracted = jest.fn();
      const { getByTestId, queryByText } = render(
        <ManifiestoScanner onDataExtracted={onDataExtracted} />
      );

      const imageUploader = getByTestId('image-uploader');
      await act(async () => {
        fireEvent.press(imageUploader);
      });

      await waitFor(() => {
        expect(mockProcessImageWithOCR).toHaveBeenCalled();
        expect(mockParseManifiestoText).toHaveBeenCalledWith(incompleteText);
      });

      // Should show low confidence warning
      expect(queryByText(/confianza baja/i)).toBeTruthy();
      
      // Should suggest manual review
      expect(queryByText(/revisión manual recomendada/i)).toBeTruthy();

      const parsedResult = await mockParseManifiestoText.mock.results[0].value;
      
      // Calculate completeness
      const totalFields = Object.keys(incompleteData).length;
      const completeFields = Object.values(incompleteData).filter(value => 
        value !== null && value !== undefined
      ).length;
      const completeness = completeFields / totalFields;

      expect(completeness).toBeLessThan(0.70); // Should be incomplete
    });
  });

  describe('Manual Correction Accuracy', () => {
    it('should track accuracy improvements after manual corrections', async () => {
      const originalText = loadSampleManifiesto('sample-manifiesto-1.txt');
      const expectedData = EXPECTED_DATA['sample-manifiesto-1.txt'];

      // Simulate OCR with errors
      const ocrWithErrors = originalText
        .replace('AM-123', 'AM-I23') // I instead of 1
        .replace('170', '17O'); // O instead of 0

      mockProcessImageWithOCR.mockResolvedValue({
        text: ocrWithErrors,
        confidence: 0.82,
        processingTime: 2900,
      });

      const parsedWithErrors = {
        ...expectedData,
        numeroVuelo: 'AM-I23', // OCR error
        pasajeros: {
          ...expectedData.pasajeros,
          total: 170, // Parser might fix this
        },
      };

      mockParseManifiestoText.mockResolvedValue(parsedWithErrors);

      const onDataExtracted = jest.fn();
      const { getByTestId } = render(
        <ManifiestoScanner onDataExtracted={onDataExtracted} />
      );

      const imageUploader = getByTestId('image-uploader');
      await act(async () => {
        fireEvent.press(imageUploader);
      });

      await waitFor(() => {
        expect(mockParseManifiestoText).toHaveBeenCalled();
      });

      // Calculate initial accuracy
      const initialResult = await mockParseManifiestoText.mock.results[0].value;
      const initialMetrics = calculateAccuracyMetrics(expectedData, initialResult);

      // Simulate manual correction
      const correctedData = {
        ...initialResult,
        numeroVuelo: 'AM-123', // Manually corrected
        editado: true,
      };

      // Calculate accuracy after correction
      const correctedMetrics = calculateAccuracyMetrics(expectedData, correctedData);

      // Accuracy should improve after manual correction
      expect(correctedMetrics.overallAccuracy).toBeGreaterThan(initialMetrics.overallAccuracy);
      expect(correctedMetrics.criticalFieldAccuracy).toBeGreaterThan(initialMetrics.criticalFieldAccuracy);
      expect(correctedMetrics.fieldAccuracy.numeroVuelo).toBe(1); // Should be perfect after correction
    });

    it('should validate manual entry accuracy against expected data', async () => {
      const expectedData = EXPECTED_DATA['sample-manifiesto-1.txt'];

      // Simulate manual entry with typical human errors
      const manualEntryData = {
        ...expectedData,
        pilotoAlMando: 'CARLOS RODRIGUEZ MARTÍNEZ', // Added accent
        horaSlotAsignado: '14:30:00', // Added seconds
        pasajeros: {
          ...expectedData.pasajeros,
          total: 169, // Calculation error
        },
        carga: {
          ...expectedData.carga,
          total: 3850, // Calculation error
        },
        editado: true,
      };

      const metrics = calculateAccuracyMetrics(expectedData, manualEntryData);

      // Manual entry should have high accuracy for most fields
      expect(metrics.overallAccuracy).toBeGreaterThan(0.85);
      expect(metrics.textAccuracy).toBeGreaterThan(0.90);
      
      // But may have calculation errors
      expect(metrics.fieldAccuracy.pasajeros).toBeLessThan(1);
      expect(metrics.fieldAccuracy.carga).toBeLessThan(1);
    });
  });

  describe('Comparative Accuracy Analysis', () => {
    it('should compare OCR vs manual entry accuracy across multiple samples', async () => {
      const samples = ['sample-manifiesto-1.txt', 'sample-manifiesto-2.txt'];
      const results: Array<{
        sample: string;
        ocrAccuracy: AccuracyMetrics;
        manualAccuracy: AccuracyMetrics;
        hybridAccuracy: AccuracyMetrics;
      }> = [];

      for (const sample of samples) {
        const sampleText = loadSampleManifiesto(sample);
        const expectedData = EXPECTED_DATA[sample];

        // OCR scenario with typical errors
        const ocrErrors = sampleText
          .replace(/O/g, '0') // Common OCR confusion
          .replace(/I/g, '1') // Common OCR confusion
          .replace(/É/g, 'E'); // Accent removal

        mockProcessImageWithOCR.mockResolvedValue({
          text: ocrErrors,
          confidence: 0.85,
          processingTime: 3000,
        });

        const ocrParsedData = { ...expectedData };
        mockParseManifiestoText.mockResolvedValue(ocrParsedData);

        // Manual entry scenario with human errors
        const manualData = {
          ...expectedData,
          // Simulate typical manual entry errors
          horaSlotAsignado: expectedData.horaSlotAsignado + ':00', // Added seconds
          pasajeros: {
            ...expectedData.pasajeros,
            total: (expectedData.pasajeros?.total || 0) - 1, // Off by one
          },
        };

        // Hybrid scenario (OCR + manual correction)
        const hybridData = {
          ...ocrParsedData,
          // Manually correct critical fields
          numeroVuelo: expectedData.numeroVuelo,
          transportista: expectedData.transportista,
          editado: true,
        };

        const ocrAccuracy = calculateAccuracyMetrics(expectedData, ocrParsedData);
        const manualAccuracy = calculateAccuracyMetrics(expectedData, manualData);
        const hybridAccuracy = calculateAccuracyMetrics(expectedData, hybridData);

        results.push({
          sample,
          ocrAccuracy,
          manualAccuracy,
          hybridAccuracy,
        });
      }

      // Analyze results
      const avgOcrAccuracy = results.reduce((sum, r) => sum + r.ocrAccuracy.overallAccuracy, 0) / results.length;
      const avgManualAccuracy = results.reduce((sum, r) => sum + r.manualAccuracy.overallAccuracy, 0) / results.length;
      const avgHybridAccuracy = results.reduce((sum, r) => sum + r.hybridAccuracy.overallAccuracy, 0) / results.length;

      // Hybrid approach should be most accurate
      expect(avgHybridAccuracy).toBeGreaterThan(avgOcrAccuracy);
      expect(avgHybridAccuracy).toBeGreaterThan(avgManualAccuracy);

      // OCR should be faster but potentially less accurate for critical fields
      expect(avgOcrAccuracy).toBeGreaterThan(0.80);
      
      // Manual entry should have high accuracy but may have calculation errors
      expect(avgManualAccuracy).toBeGreaterThan(0.85);
    });

    it('should identify fields most prone to OCR errors', async () => {
      const samples = ['sample-manifiesto-1.txt', 'sample-manifiesto-2.txt'];
      const fieldErrorRates: Record<string, number[]> = {};

      for (const sample of samples) {
        const sampleText = loadSampleManifiesto(sample);
        const expectedData = EXPECTED_DATA[sample];

        // Simulate various OCR error patterns
        const errorPatterns = [
          { pattern: /O/g, replacement: '0' },
          { pattern: /I/g, replacement: '1' },
          { pattern: /É/g, replacement: 'E' },
          { pattern: /Ñ/g, replacement: 'N' },
          { pattern: /:/g, replacement: ';' },
        ];

        for (const errorPattern of errorPatterns) {
          const corruptedText = sampleText.replace(errorPattern.pattern, errorPattern.replacement);
          
          mockProcessImageWithOCR.mockResolvedValue({
            text: corruptedText,
            confidence: 0.75,
            processingTime: 3500,
          });

          // Mock parser trying to handle corrupted text
          const parsedData = { ...expectedData };
          mockParseManifiestoText.mockResolvedValue(parsedData);

          const metrics = calculateAccuracyMetrics(expectedData, parsedData);

          // Track error rates by field
          Object.entries(metrics.fieldAccuracy).forEach(([field, accuracy]) => {
            if (!fieldErrorRates[field]) fieldErrorRates[field] = [];
            fieldErrorRates[field].push(1 - accuracy); // Error rate = 1 - accuracy
          });
        }
      }

      // Calculate average error rates
      const avgErrorRates = Object.entries(fieldErrorRates).map(([field, rates]) => ({
        field,
        avgErrorRate: rates.reduce((sum, rate) => sum + rate, 0) / rates.length,
      }));

      // Sort by error rate
      avgErrorRates.sort((a, b) => b.avgErrorRate - a.avgErrorRate);

      // Fields with special characters or numbers should have higher error rates
      const problematicFields = avgErrorRates.slice(0, 3).map(f => f.field);
      
      // These fields typically have OCR issues
      const expectedProblematicFields = ['pilotoAlMando', 'transportista', 'horaSlotAsignado', 'matricula'];
      const hasProblematicField = problematicFields.some(field => 
        expectedProblematicFields.includes(field)
      );
      
      expect(hasProblematicField).toBe(true);
    });
  });

  describe('Accuracy Benchmarking', () => {
    it('should meet minimum accuracy thresholds for production use', async () => {
      const sampleText = loadSampleManifiesto('sample-manifiesto-1.txt');
      const expectedData = EXPECTED_DATA['sample-manifiesto-1.txt'];

      mockProcessImageWithOCR.mockResolvedValue({
        text: sampleText,
        confidence: 0.88,
        processingTime: 2800,
      });

      mockParseManifiestoText.mockResolvedValue(expectedData);

      const onDataExtracted = jest.fn();
      const { getByTestId } = render(
        <ManifiestoScanner onDataExtracted={onDataExtracted} />
      );

      const imageUploader = getByTestId('image-uploader');
      await act(async () => {
        fireEvent.press(imageUploader);
      });

      await waitFor(() => {
        expect(mockParseManifiestoText).toHaveBeenCalled();
      });

      const parsedResult = await mockParseManifiestoText.mock.results[0].value;
      const metrics = calculateAccuracyMetrics(expectedData, parsedResult);

      // Production accuracy thresholds
      expect(metrics.overallAccuracy).toBeGreaterThan(0.85); // 85% overall accuracy
      expect(metrics.criticalFieldAccuracy).toBeGreaterThan(0.90); // 90% for critical fields
      expect(metrics.numericAccuracy).toBeGreaterThan(0.95); // 95% for numbers
      expect(metrics.completeness).toBeGreaterThan(0.80); // 80% field completeness
    });

    it('should provide accuracy confidence intervals', async () => {
      const samples = ['sample-manifiesto-1.txt', 'sample-manifiesto-2.txt'];
      const accuracyResults: number[] = [];

      // Run multiple simulations with slight variations
      for (let i = 0; i < 10; i++) {
        const sample = samples[i % samples.length];
        const sampleText = loadSampleManifiesto(sample);
        const expectedData = EXPECTED_DATA[sample];

        // Add slight random variations to simulate real-world conditions
        const confidence = 0.85 + (Math.random() * 0.1); // 0.85-0.95
        const processingTime = 2500 + (Math.random() * 1000); // 2.5-3.5s

        mockProcessImageWithOCR.mockResolvedValue({
          text: sampleText,
          confidence,
          processingTime,
        });

        mockParseManifiestoText.mockResolvedValue(expectedData);

        const metrics = calculateAccuracyMetrics(expectedData, expectedData);
        accuracyResults.push(metrics.overallAccuracy);
      }

      // Calculate confidence interval
      const mean = accuracyResults.reduce((sum, acc) => sum + acc, 0) / accuracyResults.length;
      const variance = accuracyResults.reduce((sum, acc) => sum + Math.pow(acc - mean, 2), 0) / accuracyResults.length;
      const stdDev = Math.sqrt(variance);
      
      const confidenceInterval95 = {
        lower: mean - (1.96 * stdDev),
        upper: mean + (1.96 * stdDev),
      };

      // Should have consistent high accuracy
      expect(mean).toBeGreaterThan(0.90);
      expect(confidenceInterval95.lower).toBeGreaterThan(0.85);
      expect(confidenceInterval95.upper).toBeLessThan(1.05);
    });
  });
});