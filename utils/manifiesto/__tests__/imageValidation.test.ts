/**
 * Unit tests for image validation utilities
 * Tests all validation functions with various edge cases
 */

import {
  validateFileFormat,
  validateFileSize,
  validateImageDimensions,
  validateImageAspectRatio,
  validateImageFile,
  validateImageForOCR,
  formatFileSize,
  isImageMimeType,
  getFileExtensionFromMimeType,
  MAX_FILE_SIZE,
  DEFAULT_SUPPORTED_FORMATS,
  ImageFileInfo,
  ValidationOptions
} from '../imageValidation';

describe('Image Validation Utilities', () => {
  
  describe('validateFileFormat', () => {
    it('should accept supported JPEG format', () => {
      const result = validateFileFormat('image/jpeg');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept supported PNG format', () => {
      const result = validateFileFormat('image/png');
      expect(result.isValid).toBe(true);
    });

    it('should accept supported WebP format', () => {
      const result = validateFileFormat('image/webp');
      expect(result.isValid).toBe(true);
    });

    it('should reject unsupported format', () => {
      const result = validateFileFormat('image/gif');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Formato no soportado');
      expect(result.errorCode).toBe('UNSUPPORTED_FORMAT');
    });

    it('should handle case-insensitive format validation', () => {
      const result = validateFileFormat('IMAGE/JPEG');
      expect(result.isValid).toBe(true);
    });

    it('should handle format with extra whitespace', () => {
      const result = validateFileFormat('  image/png  ');
      expect(result.isValid).toBe(true);
    });

    it('should reject empty MIME type', () => {
      const result = validateFileFormat('');
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('MISSING_MIME_TYPE');
    });

    it('should use custom supported formats', () => {
      const customFormats = ['image/jpeg', 'image/png'];
      const result = validateFileFormat('image/webp', customFormats);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('image/jpeg, image/png');
    });
  });

  describe('validateFileSize', () => {
    it('should accept file within size limit', () => {
      const result = validateFileSize(5 * 1024 * 1024); // 5MB
      expect(result.isValid).toBe(true);
    });

    it('should accept file at exact size limit', () => {
      const result = validateFileSize(MAX_FILE_SIZE);
      expect(result.isValid).toBe(true);
    });

    it('should reject file exceeding size limit', () => {
      const result = validateFileSize(15 * 1024 * 1024); // 15MB
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('demasiado grande');
      expect(result.errorCode).toBe('FILE_TOO_LARGE');
    });

    it('should reject empty file', () => {
      const result = validateFileSize(0);
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('EMPTY_FILE');
    });

    it('should reject negative file size', () => {
      const result = validateFileSize(-100);
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('INVALID_FILE_SIZE');
    });

    it('should use custom max size', () => {
      const customMaxSize = 2 * 1024 * 1024; // 2MB
      const result = validateFileSize(3 * 1024 * 1024, customMaxSize);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('2.0MB');
    });
  });

  describe('validateImageDimensions', () => {
    it('should accept valid dimensions', () => {
      const result = validateImageDimensions(800, 600);
      expect(result.isValid).toBe(true);
    });

    it('should reject dimensions that are too small', () => {
      const result = validateImageDimensions(50, 50);
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('IMAGE_TOO_SMALL');
    });

    it('should reject dimensions that are too large', () => {
      const result = validateImageDimensions(5000, 5000);
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('IMAGE_TOO_LARGE');
    });

    it('should reject zero or negative dimensions', () => {
      const result1 = validateImageDimensions(0, 600);
      const result2 = validateImageDimensions(800, -100);
      
      expect(result1.isValid).toBe(false);
      expect(result1.errorCode).toBe('INVALID_DIMENSIONS');
      expect(result2.isValid).toBe(false);
      expect(result2.errorCode).toBe('INVALID_DIMENSIONS');
    });

    it('should use custom dimension limits', () => {
      const result = validateImageDimensions(150, 150, 200, 200, 1000, 1000);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('200x200px');
    });
  });

  describe('validateImageAspectRatio', () => {
    it('should accept normal aspect ratios', () => {
      const result1 = validateImageDimensions(800, 600); // 4:3
      const result2 = validateImageDimensions(1920, 1080); // 16:9
      
      expect(result1.isValid).toBe(true);
      expect(result2.isValid).toBe(true);
    });

    it('should reject extreme aspect ratios', () => {
      const result1 = validateImageAspectRatio(1000, 100); // 10:1 (too wide)
      const result2 = validateImageAspectRatio(100, 1000); // 1:10 (too tall)
      
      expect(result1.isValid).toBe(false);
      expect(result1.errorCode).toBe('INVALID_ASPECT_RATIO');
      expect(result2.isValid).toBe(false);
      expect(result2.errorCode).toBe('INVALID_ASPECT_RATIO');
    });

    it('should handle zero dimensions', () => {
      const result = validateImageAspectRatio(0, 600);
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('INVALID_DIMENSIONS_FOR_RATIO');
    });

    it('should use custom aspect ratio limits', () => {
      const result = validateImageAspectRatio(800, 600, 1.0, 1.2); // 4:3 ratio (1.33) with limits 1.0-1.2
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateImageFile', () => {
    const validFile: ImageFileInfo = {
      mimeType: 'image/jpeg',
      size: 2 * 1024 * 1024, // 2MB
      width: 800,
      height: 600
    };

    it('should validate a completely valid file', () => {
      const result = validateImageFile(validFile);
      expect(result.isValid).toBe(true);
    });

    it('should fail on invalid format', () => {
      const invalidFile = { ...validFile, mimeType: 'image/gif' };
      const result = validateImageFile(invalidFile);
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('UNSUPPORTED_FORMAT');
    });

    it('should fail on invalid size', () => {
      const invalidFile = { ...validFile, size: 20 * 1024 * 1024 }; // 20MB
      const result = validateImageFile(invalidFile);
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('FILE_TOO_LARGE');
    });

    it('should fail on invalid dimensions', () => {
      const invalidFile = { ...validFile, width: 50, height: 50 };
      const result = validateImageFile(invalidFile);
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('IMAGE_TOO_SMALL');
    });

    it('should validate without dimensions', () => {
      const fileWithoutDimensions: ImageFileInfo = {
        mimeType: 'image/jpeg',
        size: 2 * 1024 * 1024
      };
      const result = validateImageFile(fileWithoutDimensions);
      expect(result.isValid).toBe(true);
    });

    it('should use custom validation options', () => {
      const options: ValidationOptions = {
        supportedFormats: ['image/png'],
        maxFileSize: 1 * 1024 * 1024, // 1MB
        minWidth: 1000,
        minHeight: 800
      };
      
      const result = validateImageFile(validFile, options);
      expect(result.isValid).toBe(false); // Should fail on format
    });

    it('should validate aspect ratio when requested', () => {
      const wideFile = { ...validFile, width: 2000, height: 100 };
      const options: ValidationOptions = {
        validateAspectRatio: true,
        minAspectRatio: 0.5,
        maxAspectRatio: 2.0
      };
      
      const result = validateImageFile(wideFile, options);
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('INVALID_ASPECT_RATIO');
    });
  });

  describe('validateImageForOCR', () => {
    it('should accept image suitable for OCR', () => {
      const result = validateImageForOCR(1200, 800, 3 * 1024 * 1024);
      expect(result.isValid).toBe(true);
    });

    it('should reject low resolution images', () => {
      const result = validateImageForOCR(200, 150, 1 * 1024 * 1024);
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('LOW_RESOLUTION_FOR_OCR');
    });

    it('should reject very large files', () => {
      const result = validateImageForOCR(2000, 1500, 20 * 1024 * 1024);
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('TOO_LARGE_FOR_OCR');
    });

    it('should reject extreme aspect ratios', () => {
      const result1 = validateImageForOCR(3000, 300, 2 * 1024 * 1024); // Very wide but meets min resolution
      const result2 = validateImageForOCR(300, 3000, 2 * 1024 * 1024); // Very tall but meets min resolution
      
      expect(result1.isValid).toBe(false);
      expect(result1.errorCode).toBe('EXTREME_ASPECT_RATIO');
      expect(result2.isValid).toBe(false);
      expect(result2.errorCode).toBe('EXTREME_ASPECT_RATIO');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('should format decimal values correctly', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB'); // 1.5 KB
      expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.5 MB'); // 2.5 MB
    });

    it('should handle large numbers', () => {
      const result = formatFileSize(5.7 * 1024 * 1024 * 1024);
      expect(result).toBe('5.7 GB');
    });
  });

  describe('isImageMimeType', () => {
    it('should identify image MIME types', () => {
      expect(isImageMimeType('image/jpeg')).toBe(true);
      expect(isImageMimeType('image/png')).toBe(true);
      expect(isImageMimeType('image/gif')).toBe(true);
      expect(isImageMimeType('IMAGE/WEBP')).toBe(true); // Case insensitive
    });

    it('should reject non-image MIME types', () => {
      expect(isImageMimeType('text/plain')).toBe(false);
      expect(isImageMimeType('application/pdf')).toBe(false);
      expect(isImageMimeType('video/mp4')).toBe(false);
    });

    it('should handle empty or invalid input', () => {
      expect(isImageMimeType('')).toBe(false);
      expect(isImageMimeType('invalid')).toBe(false);
    });
  });

  describe('getFileExtensionFromMimeType', () => {
    it('should return correct extensions for common image types', () => {
      expect(getFileExtensionFromMimeType('image/jpeg')).toBe('jpg');
      expect(getFileExtensionFromMimeType('image/jpg')).toBe('jpg');
      expect(getFileExtensionFromMimeType('image/png')).toBe('png');
      expect(getFileExtensionFromMimeType('image/webp')).toBe('webp');
    });

    it('should handle case insensitive input', () => {
      expect(getFileExtensionFromMimeType('IMAGE/JPEG')).toBe('jpg');
      expect(getFileExtensionFromMimeType('Image/PNG')).toBe('png');
    });

    it('should return empty string for unknown types', () => {
      expect(getFileExtensionFromMimeType('image/unknown')).toBe('');
      expect(getFileExtensionFromMimeType('text/plain')).toBe('');
      expect(getFileExtensionFromMimeType('')).toBe('');
    });
  });

  describe('Constants', () => {
    it('should have correct default values', () => {
      expect(MAX_FILE_SIZE).toBe(10 * 1024 * 1024); // 10MB
      expect(DEFAULT_SUPPORTED_FORMATS).toContain('image/jpeg');
      expect(DEFAULT_SUPPORTED_FORMATS).toContain('image/png');
      expect(DEFAULT_SUPPORTED_FORMATS).toContain('image/webp');
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined and null values gracefully', () => {
      // These should not throw errors
      expect(() => validateFileFormat(null as any)).not.toThrow();
      expect(() => validateFileSize(null as any)).not.toThrow();
      expect(() => validateImageDimensions(null as any, null as any)).not.toThrow();
    });

    it('should handle very small positive numbers', () => {
      const result = validateFileSize(1); // 1 byte
      expect(result.isValid).toBe(true);
    });

    it('should handle floating point dimensions', () => {
      const result = validateImageDimensions(800.5, 600.7);
      expect(result.isValid).toBe(true);
    });
  });
});