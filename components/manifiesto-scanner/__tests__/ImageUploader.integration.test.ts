/**
 * Integration tests for ImageUploader validation logic
 * Tests the validation functions used by the ImageUploader component
 */

import { 
  validateImageFile, 
  validateImageForOCR,
  formatFileSize,
  ImageFileInfo 
} from '../../../utils/manifiesto/imageValidation';

describe('ImageUploader Integration Tests', () => {
  
  describe('File Validation Integration', () => {
    it('should validate a typical manifest image file', () => {
      const manifestImage: ImageFileInfo = {
        mimeType: 'image/jpeg',
        size: 3 * 1024 * 1024, // 3MB
        width: 1200,
        height: 900
      };

      const result = validateImageFile(manifestImage);
      expect(result.isValid).toBe(true);
    });

    it('should reject oversized files', () => {
      const oversizedImage: ImageFileInfo = {
        mimeType: 'image/jpeg',
        size: 15 * 1024 * 1024, // 15MB - exceeds 10MB limit
        width: 2000,
        height: 1500
      };

      const result = validateImageFile(oversizedImage);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('demasiado grande');
    });

    it('should reject unsupported formats', () => {
      const unsupportedImage: ImageFileInfo = {
        mimeType: 'image/gif',
        size: 2 * 1024 * 1024,
        width: 800,
        height: 600
      };

      const supportedFormats = ['image/jpeg', 'image/png', 'image/webp'];
      const result = validateImageFile(unsupportedImage, { supportedFormats });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Formato no soportado');
    });

    it('should validate images without dimensions', () => {
      const imageWithoutDimensions: ImageFileInfo = {
        mimeType: 'image/png',
        size: 1 * 1024 * 1024 // 1MB
      };

      const result = validateImageFile(imageWithoutDimensions);
      expect(result.isValid).toBe(true);
    });
  });

  describe('OCR Validation Integration', () => {
    it('should validate good quality images for OCR', () => {
      const result = validateImageForOCR(1600, 1200, 4 * 1024 * 1024);
      expect(result.isValid).toBe(true);
    });

    it('should warn about low resolution images', () => {
      const result = validateImageForOCR(200, 150, 1 * 1024 * 1024);
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('LOW_RESOLUTION_FOR_OCR');
    });

    it('should warn about very large files for OCR', () => {
      const result = validateImageForOCR(2000, 1500, 20 * 1024 * 1024);
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('TOO_LARGE_FOR_OCR');
    });

    it('should warn about extreme aspect ratios', () => {
      const result = validateImageForOCR(3000, 300, 3 * 1024 * 1024); // 10:1 ratio
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('EXTREME_ASPECT_RATIO');
    });
  });

  describe('File Size Formatting', () => {
    it('should format file sizes correctly for display', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.5 MB');
      expect(formatFileSize(10 * 1024 * 1024)).toBe('10 MB');
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle typical smartphone photo', () => {
      const smartphonePhoto: ImageFileInfo = {
        mimeType: 'image/jpeg',
        size: 2.8 * 1024 * 1024, // 2.8MB
        width: 3024,
        height: 4032 // Portrait orientation
      };

      const result = validateImageFile(smartphonePhoto);
      expect(result.isValid).toBe(true);

      const ocrResult = validateImageForOCR(smartphonePhoto.width!, smartphonePhoto.height!, smartphonePhoto.size);
      expect(ocrResult.isValid).toBe(true);
    });

    it('should handle scanned document', () => {
      const scannedDoc: ImageFileInfo = {
        mimeType: 'image/png',
        size: 1.2 * 1024 * 1024, // 1.2MB
        width: 2480,
        height: 3508 // A4 at 300 DPI
      };

      const result = validateImageFile(scannedDoc);
      expect(result.isValid).toBe(true);

      const ocrResult = validateImageForOCR(scannedDoc.width!, scannedDoc.height!, scannedDoc.size);
      expect(ocrResult.isValid).toBe(true);
    });

    it('should handle low quality image', () => {
      const lowQualityImage: ImageFileInfo = {
        mimeType: 'image/jpeg',
        size: 150 * 1024, // 150KB
        width: 640,
        height: 480
      };

      const result = validateImageFile(lowQualityImage);
      expect(result.isValid).toBe(true);

      const ocrResult = validateImageForOCR(lowQualityImage.width!, lowQualityImage.height!, lowQualityImage.size);
      expect(ocrResult.isValid).toBe(true);
    });

    it('should reject very small thumbnail', () => {
      const thumbnail: ImageFileInfo = {
        mimeType: 'image/jpeg',
        size: 15 * 1024, // 15KB
        width: 150,
        height: 100
      };

      const result = validateImageFile(thumbnail);
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('IMAGE_TOO_SMALL');
    });

    it('should handle edge case of exactly maximum size', () => {
      const maxSizeImage: ImageFileInfo = {
        mimeType: 'image/jpeg',
        size: 10 * 1024 * 1024, // Exactly 10MB
        width: 2000,
        height: 1500
      };

      const result = validateImageFile(maxSizeImage);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Custom Validation Options', () => {
    it('should respect custom supported formats', () => {
      const webpImage: ImageFileInfo = {
        mimeType: 'image/webp',
        size: 1 * 1024 * 1024,
        width: 800,
        height: 600
      };

      // Should pass with default formats
      const defaultResult = validateImageFile(webpImage);
      expect(defaultResult.isValid).toBe(true);

      // Should fail with custom formats that don't include webp
      const customResult = validateImageFile(webpImage, {
        supportedFormats: ['image/jpeg', 'image/png']
      });
      expect(customResult.isValid).toBe(false);
    });

    it('should respect custom file size limits', () => {
      const mediumImage: ImageFileInfo = {
        mimeType: 'image/jpeg',
        size: 3 * 1024 * 1024, // 3MB
        width: 1200,
        height: 900
      };

      // Should pass with default 10MB limit
      const defaultResult = validateImageFile(mediumImage);
      expect(defaultResult.isValid).toBe(true);

      // Should fail with custom 2MB limit
      const customResult = validateImageFile(mediumImage, {
        maxFileSize: 2 * 1024 * 1024
      });
      expect(customResult.isValid).toBe(false);
    });

    it('should respect custom dimension limits', () => {
      const smallImage: ImageFileInfo = {
        mimeType: 'image/jpeg',
        size: 500 * 1024, // 500KB
        width: 400,
        height: 300
      };

      // Should pass with default limits (min 100x100)
      const defaultResult = validateImageFile(smallImage);
      expect(defaultResult.isValid).toBe(true);

      // Should fail with custom higher minimum limits
      const customResult = validateImageFile(smallImage, {
        minWidth: 800,
        minHeight: 600
      });
      expect(customResult.isValid).toBe(false);
    });
  });
});