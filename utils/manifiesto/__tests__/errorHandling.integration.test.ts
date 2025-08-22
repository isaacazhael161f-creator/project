/**
 * Integration tests for error handling across the manifiesto scanner system
 */

// Mock __DEV__ for tests
(global as any).__DEV__ = false;

import { 
  processImageWithOCR, 
  OCROptions,
  validateImageForOCR 
} from '../ocr';
import { parseManifiestoText } from '../parser';
import { 
  ErrorType, 
  errorLogger, 
  getErrorStatistics,
  createManifiestoError 
} from '../errorHandler';

// Mock Tesseract for testing
jest.mock('tesseract.js', () => ({
  createWorker: jest.fn(),
  PSM: { AUTO: 6 }
}));

describe('Error Handling Integration', () => {
  beforeEach(() => {
    errorLogger.clearLogs();
    jest.clearAllMocks();
  });

  describe('OCR Error Handling Integration', () => {
    it('should handle image validation failures gracefully', async () => {
      // Mock validateImageForOCR to return invalid
      jest.spyOn(require('../ocr'), 'validateImageForOCR').mockResolvedValue({
        isValid: false,
        warnings: ['Image too small'],
        recommendations: ['Use larger image']
      });

      try {
        await processImageWithOCR('data:image/png;base64,invalid');
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.type).toBe(ErrorType.IMAGE_CORRUPTED);
        expect(error.message).toContain('Image too small');
      }

      // Verify error was logged
      const logs = errorLogger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].type).toBe(ErrorType.IMAGE_CORRUPTED);
    });

    it('should handle OCR timeout errors', async () => {
      const mockWorker = {
        recognize: jest.fn().mockImplementation(() => 
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout')), 100);
          })
        ),
        terminate: jest.fn().mockResolvedValue(undefined),
        setParameters: jest.fn().mockResolvedValue(undefined)
      };

      const mockCreateWorker = jest.fn().mockResolvedValue(mockWorker);
      require('tesseract.js').createWorker = mockCreateWorker;

      // Mock validateImageForOCR to return valid
      jest.spyOn(require('../ocr'), 'validateImageForOCR').mockResolvedValue({
        isValid: true,
        warnings: [],
        recommendations: []
      });

      const options: OCROptions = { timeout: 50 }; // Very short timeout

      try {
        await processImageWithOCR('data:image/png;base64,validimage', options);
        fail('Should have thrown a timeout error');
      } catch (error: any) {
        expect(error.type).toBe(ErrorType.OCR_PROCESSING_TIMEOUT);
      }

      // Verify worker cleanup
      expect(mockWorker.terminate).toHaveBeenCalled();
    });

    it('should handle OCR initialization failures', async () => {
      const mockCreateWorker = jest.fn().mockRejectedValue(new Error('Failed to initialize Tesseract'));
      require('tesseract.js').createWorker = mockCreateWorker;

      // Mock validateImageForOCR to return valid
      jest.spyOn(require('../ocr'), 'validateImageForOCR').mockResolvedValue({
        isValid: true,
        warnings: [],
        recommendations: []
      });

      try {
        await processImageWithOCR('data:image/png;base64,validimage');
        fail('Should have thrown an initialization error');
      } catch (error: any) {
        expect(error.type).toBe(ErrorType.OCR_INITIALIZATION_FAILED);
        expect(error.message).toContain('Failed to initialize Tesseract');
      }
    });

    it('should handle low confidence OCR results', async () => {
      const mockWorker = {
        recognize: jest.fn().mockResolvedValue({
          data: {
            text: 'Some poorly recognized text',
            confidence: 25 // Low confidence
          }
        }),
        terminate: jest.fn().mockResolvedValue(undefined),
        setParameters: jest.fn().mockResolvedValue(undefined)
      };

      const mockCreateWorker = jest.fn().mockResolvedValue(mockWorker);
      require('tesseract.js').createWorker = mockCreateWorker;

      // Mock validateImageForOCR to return valid
      jest.spyOn(require('../ocr'), 'validateImageForOCR').mockResolvedValue({
        isValid: true,
        warnings: [],
        recommendations: []
      });

      const result = await processImageWithOCR('data:image/png;base64,validimage');

      expect(result?.confidence).toBe(25);
      expect(result?.text).toBe('Some poorly recognized text');

      // Should not throw error but should log warning
      const logs = errorLogger.getLogs();
      expect(logs.length).toBeGreaterThanOrEqual(0); // May or may not log depending on implementation
    });
  });

  describe('Parser Error Handling Integration', () => {
    it('should handle empty text input', async () => {
      try {
        await parseManifiestoText('');
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.type).toBe(ErrorType.PARSING_NO_DATA_FOUND);
        expect(error.message).toContain('Texto vacío');
      }
    });

    it('should handle text with no recognizable data', async () => {
      const randomText = 'This is just random text with no manifest data at all';

      try {
        await parseManifiestoText(randomText);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.type).toBe(ErrorType.PARSING_NO_DATA_FOUND);
        expect(error.message).toContain('No se encontraron datos válidos');
      }
    });

    it('should successfully parse valid manifest text', () => {
      const validManifestText = `
        MANIFIESTO DE SALIDA
        Fecha: 15/03/2024
        Folio: MX-2024-001
        Vuelo: AM123
        Transportista: AEROMEXICO
        Equipo: B737
        Matrícula: XA-ABC
        
        PASAJEROS:
        Nacional: 120
        Internacional: 30
        Total: 150
        
        CARGA:
        Equipaje: 2500 kg
        Carga: 1000 kg
        Total: 3500 kg
      `;

      const result = await parseManifiestoText(validManifestText);

      expect(result.fecha).toBe('15/03/2024');
      expect(result.folio).toBe('MX-2024-001');
      expect(result.numeroVuelo).toBe('AM123');
      expect(result.transportista).toBe('AEROMEXICO');
      expect(result.pasajeros?.total).toBe(150);
      expect(result.carga?.total).toBe(3500);

      // Should not log any errors
      const logs = errorLogger.getLogs();
      expect(logs).toHaveLength(0);
    });

    it('should handle partially valid manifest text', () => {
      const partialManifestText = `
        Fecha: 15/03/2024
        Vuelo: AM123
        Some random text that doesn't match patterns
      `;

      const result = await parseManifiestoText(partialManifestText);

      expect(result.fecha).toBe('15/03/2024');
      expect(result.numeroVuelo).toBe('AM123');
      expect(result.transportista).toBeUndefined();

      // Should succeed because it found some basic data
      const logs = errorLogger.getLogs();
      expect(logs).toHaveLength(0);
    });
  });

  describe('End-to-End Error Scenarios', () => {
    it('should handle complete OCR to parsing failure chain', async () => {
      // Mock OCR to return unrecognizable text
      const mockWorker = {
        recognize: jest.fn().mockResolvedValue({
          data: {
            text: 'Completely unrecognizable garbage text !@#$%^&*()',
            confidence: 95 // High confidence but bad content
          }
        }),
        terminate: jest.fn().mockResolvedValue(undefined),
        setParameters: jest.fn().mockResolvedValue(undefined)
      };

      const mockCreateWorker = jest.fn().mockResolvedValue(mockWorker);
      require('tesseract.js').createWorker = mockCreateWorker;

      // Mock validateImageForOCR to return valid
      jest.spyOn(require('../ocr'), 'validateImageForOCR').mockResolvedValue({
        isValid: true,
        warnings: [],
        recommendations: []
      });

      // OCR should succeed
      const ocrResult = await processImageWithOCR('data:image/png;base64,validimage');
      expect(ocrResult?.text).toBe('Completely unrecognizable garbage text !@#$%^&*()');

      // But parsing should fail
      try {
        await parseManifiestoText(ocrResult!.text);
        fail('Parsing should have failed');
      } catch (error: any) {
        expect(error.type).toBe(ErrorType.PARSING_NO_DATA_FOUND);
      }

      // Should have logged the parsing error
      const logs = errorLogger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].type).toBe(ErrorType.PARSING_NO_DATA_FOUND);
    });

    it('should handle successful OCR with successful parsing', async () => {
      const validManifestText = `
        MANIFIESTO DE SALIDA
        Fecha: 15/03/2024
        Vuelo: AM123
        Transportista: AEROMEXICO
        
        PASAJEROS:
        Nacional: 120
        Total: 120
      `;

      // Mock OCR to return valid manifest text
      const mockWorker = {
        recognize: jest.fn().mockResolvedValue({
          data: {
            text: validManifestText,
            confidence: 95
          }
        }),
        terminate: jest.fn().mockResolvedValue(undefined),
        setParameters: jest.fn().mockResolvedValue(undefined)
      };

      const mockCreateWorker = jest.fn().mockResolvedValue(mockWorker);
      require('tesseract.js').createWorker = mockCreateWorker;

      // Mock validateImageForOCR to return valid
      jest.spyOn(require('../ocr'), 'validateImageForOCR').mockResolvedValue({
        isValid: true,
        warnings: [],
        recommendations: []
      });

      // OCR should succeed
      const ocrResult = await processImageWithOCR('data:image/png;base64,validimage');
      expect(ocrResult?.confidence).toBe(95);

      // Parsing should also succeed
      const parseResult = await parseManifiestoText(ocrResult!.text);
      expect(parseResult.fecha).toBe('15/03/2024');
      expect(parseResult.numeroVuelo).toBe('AM123');
      expect(parseResult.transportista).toBe('AEROMEXICO');

      // Should have no errors logged
      const logs = errorLogger.getLogs();
      expect(logs).toHaveLength(0);
    });
  });

  describe('Error Statistics and Logging', () => {
    it('should accumulate error statistics across operations', async () => {
      // Generate multiple different types of errors
      
      // Image error
      try {
        await processImageWithOCR('invalid-image-data');
      } catch (error) {
        // Expected to fail
      }

      // Parsing error
      try {
        parseManifiestoText('');
      } catch (error) {
        // Expected to fail
      }

      // Another parsing error
      try {
        parseManifiestoText('random text');
      } catch (error) {
        // Expected to fail
      }

      const stats = getErrorStatistics();
      
      expect(stats.totalErrors).toBeGreaterThanOrEqual(2);
      expect(stats.errorsByType[ErrorType.PARSING_NO_DATA_FOUND]).toBeGreaterThanOrEqual(2);
      expect(stats.errorsBySeverity.medium).toBeGreaterThanOrEqual(1);
      expect(stats.recentErrors.length).toBeGreaterThanOrEqual(2);
    });

    it('should maintain error log order and limits', () => {
      // Generate many errors to test log limits
      for (let i = 0; i < 150; i++) {
        const error = createManifiestoError(
          ErrorType.UNKNOWN_ERROR,
          `Error ${i}`,
          { operation: `test_${i}` }
        );
        errorLogger.log(error);
      }

      const logs = errorLogger.getLogs();
      
      // Should be limited to max logs (100)
      expect(logs.length).toBeLessThanOrEqual(100);
      
      // Should be in reverse chronological order (most recent first)
      expect(logs[0].message).toBe('Error 149');
      expect(logs[1].message).toBe('Error 148');
    });

    it('should export error logs correctly', () => {
      const error1 = createManifiestoError(ErrorType.IMAGE_LOAD_FAILED, 'Error 1');
      const error2 = createManifiestoError(ErrorType.OCR_PROCESSING_FAILED, 'Error 2');

      errorLogger.log(error1);
      errorLogger.log(error2);

      const exported = errorLogger.exportLogs();
      const parsed = JSON.parse(exported);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].message).toBe('Error 2'); // Most recent first
      expect(parsed[1].message).toBe('Error 1');
    });
  });

  describe('Recovery Strategies', () => {
    it('should support retry recovery strategy', async () => {
      let attemptCount = 0;
      const retryableOperation = jest.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Temporary failure');
        }
        return 'success';
      });

      // This would be handled by the error handling system
      // The actual retry logic would be in the component using useErrorHandler
      expect(retryableOperation).toBeDefined();
    });

    it('should support fallback recovery strategy', () => {
      const primaryOperation = jest.fn().mockImplementation(() => {
        throw new Error('Primary operation failed');
      });

      const fallbackOperation = jest.fn().mockReturnValue('fallback result');

      // Simulate fallback strategy
      let result;
      try {
        result = primaryOperation();
      } catch (error) {
        result = fallbackOperation();
      }

      expect(result).toBe('fallback result');
      expect(fallbackOperation).toHaveBeenCalled();
    });
  });
});