/**
 * Image Compression Tests
 * Tests for image compression utilities
 */

import {
  compressImage,
  compressForOCR,
  compressForStorage,
  progressiveCompress,
  getCompressionStats,
} from '../imageCompression';

// Mock canvas and image APIs for testing
const mockCanvas = {
  width: 0,
  height: 0,
  getContext: jest.fn(() => ({
    drawImage: jest.fn(),
    getImageData: jest.fn(() => ({
      data: new Uint8ClampedArray(1000),
    })),
    putImageData: jest.fn(),
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high',
  })),
  toDataURL: jest.fn(() => 'data:image/jpeg;base64,compressed-image-data'),
};

const mockImage = {
  width: 1920,
  height: 1080,
  onload: null as any,
  onerror: null as any,
  src: '',
};

// Mock DOM APIs
Object.defineProperty(global, 'document', {
  value: {
    createElement: jest.fn((tagName: string) => {
      if (tagName === 'canvas') return mockCanvas;
      return {};
    }),
  },
});

Object.defineProperty(global, 'Image', {
  value: jest.fn(() => mockImage),
});

describe('Image Compression', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCanvas.toDataURL.mockReturnValue('data:image/jpeg;base64,compressed-image-data');
  });

  describe('compressImage', () => {
    it('should compress image with default options', async () => {
      const testImage = 'data:image/jpeg;base64,test-image-data';
      
      // Mock successful image loading
      setTimeout(() => {
        if (mockImage.onload) mockImage.onload();
      }, 0);

      const result = await compressImage(testImage);

      expect(result.compressedDataUrl).toBe('data:image/jpeg;base64,compressed-image-data');
      expect(result.compressionRatio).toBeGreaterThan(0);
      expect(result.dimensions).toEqual({ width: 1920, height: 1080 });
    });

    it('should handle compression errors', async () => {
      const testImage = 'invalid-image-data';
      
      // Mock image loading error
      setTimeout(() => {
        if (mockImage.onerror) mockImage.onerror();
      }, 0);

      await expect(compressImage(testImage)).rejects.toThrow('Failed to load image');
    });

    it('should apply OCR-specific options', async () => {
      const testImage = 'data:image/jpeg;base64,test-image-data';
      
      setTimeout(() => {
        if (mockImage.onload) mockImage.onload();
      }, 0);

      const result = await compressImage(testImage, { forOCR: true });

      expect(mockCanvas.getContext).toHaveBeenCalled();
      expect(result.compressedDataUrl).toBeDefined();
    });

    it('should apply storage-specific options', async () => {
      const testImage = 'data:image/jpeg;base64,test-image-data';
      
      setTimeout(() => {
        if (mockImage.onload) mockImage.onload();
      }, 0);

      const result = await compressImage(testImage, { forStorage: true });

      expect(result.compressedDataUrl).toBeDefined();
    });
  });

  describe('compressForOCR', () => {
    it('should use OCR-optimized settings', async () => {
      const testImage = 'data:image/jpeg;base64,test-image-data';
      
      setTimeout(() => {
        if (mockImage.onload) mockImage.onload();
      }, 0);

      const result = await compressForOCR(testImage);

      expect(result.compressedDataUrl).toBeDefined();
      expect(result.dimensions.width).toBeLessThanOrEqual(2000);
      expect(result.dimensions.height).toBeLessThanOrEqual(2000);
    });
  });

  describe('compressForStorage', () => {
    it('should use storage-optimized settings', async () => {
      const testImage = 'data:image/jpeg;base64,test-image-data';
      
      setTimeout(() => {
        if (mockImage.onload) mockImage.onload();
      }, 0);

      const result = await compressForStorage(testImage);

      expect(result.compressedDataUrl).toBeDefined();
      expect(result.dimensions.width).toBeLessThanOrEqual(1200);
      expect(result.dimensions.height).toBeLessThanOrEqual(1200);
    });
  });

  describe('progressiveCompress', () => {
    it('should compress to target size', async () => {
      const testImage = 'data:image/jpeg;base64,test-image-data';
      const targetSizeKB = 500;
      
      // Mock multiple compression attempts
      let compressionAttempt = 0;
      mockCanvas.toDataURL.mockImplementation(() => {
        compressionAttempt++;
        const size = Math.max(400, 1000 - compressionAttempt * 200); // Decreasing size
        const data = 'A'.repeat(size);
        return `data:image/jpeg;base64,${data}`;
      });
      
      setTimeout(() => {
        if (mockImage.onload) mockImage.onload();
      }, 0);

      const result = await progressiveCompress(testImage, targetSizeKB);

      expect(result.compressedDataUrl).toBeDefined();
      expect(result.compressedSize / 1024).toBeLessThanOrEqual(targetSizeKB * 1.1);
    });
  });

  describe('getCompressionStats', () => {
    it('should calculate compression statistics', () => {
      const results = [
        {
          compressedDataUrl: 'data:image/jpeg;base64,test1',
          originalSize: 1000,
          compressedSize: 500,
          compressionRatio: 2,
          dimensions: { width: 800, height: 600 },
        },
        {
          compressedDataUrl: 'data:image/jpeg;base64,test2',
          originalSize: 2000,
          compressedSize: 800,
          compressionRatio: 2.5,
          dimensions: { width: 1200, height: 900 },
        },
      ];

      const stats = getCompressionStats(results);

      expect(stats.totalOriginalSize).toBe(3000);
      expect(stats.totalCompressedSize).toBe(1300);
      expect(stats.totalSavings).toBe(1700);
      expect(stats.averageCompressionRatio).toBe(2.25);
      expect(stats.savingsPercentage).toBeCloseTo(56.67, 1);
    });
  });

  describe('Dimension Calculations', () => {
    it('should maintain aspect ratio when resizing', async () => {
      const testImage = 'data:image/jpeg;base64,test-image-data';
      mockImage.width = 3000;
      mockImage.height = 2000;
      
      setTimeout(() => {
        if (mockImage.onload) mockImage.onload();
      }, 0);

      const result = await compressImage(testImage, {
        maxWidth: 1500,
        maxHeight: 1500,
        maintainAspectRatio: true,
      });

      // Should scale down proportionally
      expect(result.dimensions.width).toBe(1500);
      expect(result.dimensions.height).toBe(1000); // Maintains 3:2 ratio
    });

    it('should not maintain aspect ratio when disabled', async () => {
      const testImage = 'data:image/jpeg;base64,test-image-data';
      mockImage.width = 3000;
      mockImage.height = 2000;
      
      setTimeout(() => {
        if (mockImage.onload) mockImage.onload();
      }, 0);

      const result = await compressImage(testImage, {
        maxWidth: 1200,
        maxHeight: 1200,
        maintainAspectRatio: false,
      });

      expect(result.dimensions.width).toBe(1200);
      expect(result.dimensions.height).toBe(1200);
    });
  });

  describe('Error Handling', () => {
    it('should handle canvas context creation failure', async () => {
      const testImage = 'data:image/jpeg;base64,test-image-data';
      (mockCanvas.getContext as jest.Mock).mockReturnValue(null);
      
      setTimeout(() => {
        if (mockImage.onload) mockImage.onload();
      }, 0);

      await expect(compressImage(testImage)).rejects.toThrow('Could not get canvas context');
    });

    it('should handle invalid image data', async () => {
      const testImage = '';
      
      setTimeout(() => {
        if (mockImage.onerror) mockImage.onerror();
      }, 0);

      await expect(compressImage(testImage)).rejects.toThrow('Failed to load image');
    });
  });
});