/**
 * Unit tests for OCR utilities
 * Tests OCR configuration, preprocessing, and text cleaning functions
 */

import {
  cleanOCRText,
  calculateTimeout,
  estimateTextQuality,
  OCR_CONFIG,
  OCR_TIMEOUTS,
  PREPROCESSING_CONFIG
} from '../ocr';

// Mock Tesseract para tests
jest.mock('tesseract.js', () => ({
  createWorker: jest.fn(),
  PSM: {
    AUTO: 3
  }
}));

describe('OCR Utilities', () => {
  
  describe('cleanOCRText', () => {
    it('should remove control characters', () => {
      const dirtyText = 'Hello\x00World\x1F\x7F';
      const cleaned = cleanOCRText(dirtyText);
      expect(cleaned).toBe('HelloWorld');
    });

    it('should normalize multiple spaces', () => {
      const text = 'Hello    world   test';
      const cleaned = cleanOCRText(text);
      expect(cleaned).toBe('Hello world test');
    });

    it('should remove multiple empty lines', () => {
      const text = 'Line 1\n\n\n\nLine 2\n\n\nLine 3';
      const cleaned = cleanOCRText(text);
      // Verificar que se redujeron las líneas vacías múltiples
      expect(cleaned.split('\n\n\n').length).toBe(1); // No debe haber 3 líneas vacías consecutivas
      expect(cleaned).toContain('Line 1');
      expect(cleaned).toContain('Line 2');
      expect(cleaned).toContain('Line 3');
    });

    it('should replace pipe characters with I', () => {
      const text = 'F|ight number: |234';
      const cleaned = cleanOCRText(text);
      expect(cleaned).toBe('FIight number: I234');
    });

    it('should handle O/0 replacement based on context', () => {
      const text = 'Flight 1O23 to MEXICO';
      const cleaned = cleanOCRText(text);
      expect(cleaned).toBe('Flight 1023 to MEXICO');
    });

    it('should trim whitespace', () => {
      const text = '   Hello World   ';
      const cleaned = cleanOCRText(text);
      expect(cleaned).toBe('Hello World');
    });

    it('should handle empty string', () => {
      const cleaned = cleanOCRText('');
      expect(cleaned).toBe('');
    });
  });

  describe('calculateTimeout', () => {
    it('should return small timeout for small images', () => {
      const smallSize = 0.5 * 1024 * 1024; // 0.5MB
      const timeout = calculateTimeout(smallSize);
      expect(timeout).toBe(OCR_TIMEOUTS.small);
    });

    it('should return default timeout for medium images', () => {
      const mediumSize = 3 * 1024 * 1024; // 3MB
      const timeout = calculateTimeout(mediumSize);
      expect(timeout).toBe(OCR_TIMEOUTS.default);
    });

    it('should return large timeout for large images', () => {
      const largeSize = 8 * 1024 * 1024; // 8MB
      const timeout = calculateTimeout(largeSize);
      expect(timeout).toBe(OCR_TIMEOUTS.large);
    });

    it('should handle edge cases', () => {
      expect(calculateTimeout(0)).toBe(OCR_TIMEOUTS.small);
      expect(calculateTimeout(1 * 1024 * 1024)).toBe(OCR_TIMEOUTS.default);
      expect(calculateTimeout(5 * 1024 * 1024)).toBe(OCR_TIMEOUTS.default);
      expect(calculateTimeout(5.1 * 1024 * 1024)).toBe(OCR_TIMEOUTS.large);
    });
  });

  describe('estimateTextQuality', () => {
    it('should return confidence for normal text', () => {
      const text = 'This is a normal text with good length and readable content';
      const confidence = 85;
      const quality = estimateTextQuality(text, confidence);
      expect(quality).toBe(confidence);
    });

    it('should penalize very short text', () => {
      const shortText = 'Short';
      const confidence = 90;
      const quality = estimateTextQuality(shortText, confidence);
      expect(quality).toBeLessThan(confidence);
      expect(quality).toBe(72); // 90 * 0.8
    });

    it('should penalize text with too many special characters', () => {
      const specialText = '!@#$%^&*()_+{}|:"<>?[]\\;\',./' + 'normal text';
      const confidence = 80;
      const quality = estimateTextQuality(specialText, confidence);
      expect(quality).toBeLessThan(confidence);
    });

    it('should bonus for manifest keywords', () => {
      const manifestText = 'MANIFIESTO DE VUELO fecha hora destino pasajeros carga equipaje';
      const confidence = 70;
      const quality = estimateTextQuality(manifestText, confidence);
      expect(quality).toBeGreaterThan(confidence);
    });

    it('should cap quality at 100', () => {
      const excellentText = 'MANIFIESTO DE VUELO con fecha hora destino origen pasajeros carga equipaje aeropuerto';
      const confidence = 95;
      const quality = estimateTextQuality(excellentText, confidence);
      expect(quality).toBeLessThanOrEqual(100);
    });

    it('should not go below 0', () => {
      const terribleText = '!@#$';
      const confidence = 10;
      const quality = estimateTextQuality(terribleText, confidence);
      expect(quality).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Configuration Constants', () => {
    it('should have correct OCR_CONFIG values', () => {
      expect(OCR_CONFIG.languages).toBe('spa+eng');
      expect(OCR_CONFIG.options.tessedit_char_whitelist).toContain('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
      expect(OCR_CONFIG.options.tessedit_char_whitelist).toContain('ÁÉÍÓÚáéíóúÑñ');
      expect(OCR_CONFIG.options.tessedit_char_whitelist).toContain('0123456789');
      expect(OCR_CONFIG.options.preserve_interword_spaces).toBe('1');
    });

    it('should have reasonable timeout values', () => {
      expect(OCR_TIMEOUTS.small).toBeLessThan(OCR_TIMEOUTS.default);
      expect(OCR_TIMEOUTS.default).toBeLessThan(OCR_TIMEOUTS.large);
      expect(OCR_TIMEOUTS.small).toBeGreaterThan(10000);
      expect(OCR_TIMEOUTS.large).toBeLessThan(120000);
    });

    it('should have valid preprocessing config', () => {
      expect(PREPROCESSING_CONFIG.maxWidth).toBeGreaterThan(0);
      expect(PREPROCESSING_CONFIG.maxHeight).toBeGreaterThan(0);
      expect(PREPROCESSING_CONFIG.contrast).toBeGreaterThan(0);
      expect(PREPROCESSING_CONFIG.brightness).toBeGreaterThan(0);
      expect(typeof PREPROCESSING_CONFIG.enableGrayscale).toBe('boolean');
    });
  });

  describe('Real-world Scenarios', () => {
    it('should clean typical manifest OCR output', () => {
      const ocrOutput = `
        MAN|FIESTO  DE   SAL|DA
        
        
        FECHA:    12/O8/2O24
        VUELO:    AM-123
        AEROPUERTO:   MEX|CO  C|TY
        
        
        PASAJEROS:
        NACIONAL:     15O
        |NTERNAC|ONAL: 25
        
        
        CARGA:
        EQU|PAJE:     2000  KG
      `;

      const cleaned = cleanOCRText(ocrOutput);
      
      expect(cleaned).toContain('MANIFIESTO DE SALIDA');
      expect(cleaned).toContain('FECHA: 12/08/2024');
      expect(cleaned).toContain('MEXICO CITY');
      expect(cleaned).toContain('NACIONAL: 150');
      expect(cleaned).toContain('INTERNACIONAL: 25');
      expect(cleaned).toContain('EQUIPAJE: 2000 KG');
    });

    it('should estimate quality for typical manifest text', () => {
      const manifestText = `
        MANIFIESTO DE SALIDA
        FECHA: 12/08/2024
        VUELO: AM-123
        DESTINO: MEXICO CITY
        PASAJEROS: 150
        CARGA: 2000 KG
      `;

      const quality = estimateTextQuality(manifestText, 85);
      expect(quality).toBeGreaterThan(85);
      expect(quality).toBeLessThanOrEqual(100);
    });

    it('should calculate appropriate timeouts for different image types', () => {
      const smartphonePhoto = 3 * 1024 * 1024;
      expect(calculateTimeout(smartphonePhoto)).toBe(OCR_TIMEOUTS.default);

      const scannedDoc = 1.5 * 1024 * 1024;
      expect(calculateTimeout(scannedDoc)).toBe(OCR_TIMEOUTS.default);

      const highResScan = 7 * 1024 * 1024;
      expect(calculateTimeout(highResScan)).toBe(OCR_TIMEOUTS.large);

      const thumbnail = 0.5 * 1024 * 1024;
      expect(calculateTimeout(thumbnail)).toBe(OCR_TIMEOUTS.small);
    });
  });
});