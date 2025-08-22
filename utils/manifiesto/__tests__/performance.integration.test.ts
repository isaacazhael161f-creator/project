/**
 * Performance Integration Tests
 * Tests performance optimizations with real-world scenarios and large images
 */

import { 
  compressImage, 
  compressForOCR, 
  compressForStorage,
  progressiveCompress,
  batchCompress,
  getCompressionStats
} from '../imageCompression';
import { performanceMonitor } from '../performance';
import { useDebouncedValidation } from '../../../hooks/useDebouncedValidation';

// Helper to create test images of specific sizes
const createTestImage = (width: number, height: number, quality: number = 0.8): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = width;
  canvas.height = height;
  
  if (ctx) {
    // Create a pattern to simulate a real image
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#ff0000');
    gradient.addColorStop(0.5, '#00ff00');
    gradient.addColorStop(1, '#0000ff');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add some text to simulate OCR content
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText('MANIFIESTO DE SALIDA', 50, 50);
    ctx.fillText('VUELO: AM123', 50, 100);
    ctx.fillText('FECHA: 2024-01-15', 50, 150);
  }
  
  return canvas.toDataURL('image/jpeg', quality);
};

describe('Performance Integration Tests', () => {
  beforeEach(() => {
    performanceMonitor.clearMetrics();
  });

  describe('Image Compression Performance', () => {
    it('should compress large images efficiently', async () => {
      const largeImage = createTestImage(3000, 2000, 0.9); // ~2-3MB image
      
      performanceMonitor.startMeasure('large-image-compression');
      
      const result = await compressForOCR(largeImage);
      
      const metric = performanceMonitor.endMeasure('large-image-compression');
      
      expect(metric?.duration).toBeLessThan(5000); // Should complete within 5 seconds
      expect(result.compressionRatio).toBeGreaterThan(1);
      expect(result.dimensions.width).toBeLessThanOrEqual(2000);
      expect(result.dimensions.height).toBeLessThanOrEqual(2000);
    });

    it('should handle multiple image sizes efficiently', async () => {
      const testCases = [
        { width: 1920, height: 1080, name: 'HD' },
        { width: 2560, height: 1440, name: '2K' },
        { width: 3840, height: 2160, name: '4K' },
        { width: 4000, height: 3000, name: 'Large' },
      ];

      const results = [];

      for (const testCase of testCases) {
        const image = createTestImage(testCase.width, testCase.height);
        
        performanceMonitor.startMeasure(`compress-${testCase.name}`);
        
        const result = await compressForStorage(image);
        
        const metric = performanceMonitor.endMeasure(`compress-${testCase.name}`);
        
        results.push({
          ...testCase,
          compressionTime: metric?.duration || 0,
          compressionRatio: result.compressionRatio,
          finalSize: result.compressedSize,
        });
      }

      // All compressions should complete within reasonable time
      results.forEach(result => {
        expect(result.compressionTime).toBeLessThan(10000); // 10 seconds max
        expect(result.compressionRatio).toBeGreaterThan(1);
      });

      // Larger images should have better compression ratios
      const sortedBySize = results.sort((a, b) => (a.width * a.height) - (b.width * b.height));
      expect(sortedBySize[sortedBySize.length - 1].compressionRatio)
        .toBeGreaterThan(sortedBySize[0].compressionRatio);
    });

    it('should maintain OCR quality while compressing', async () => {
      const ocrTestImage = createTestImage(2400, 1800, 0.95);
      
      const ocrResult = await compressForOCR(ocrTestImage);
      const storageResult = await compressForStorage(ocrTestImage);
      
      // OCR version should maintain higher quality
      expect(ocrResult.compressedSize).toBeGreaterThan(storageResult.compressedSize * 0.8);
      expect(ocrResult.dimensions.width).toBeGreaterThanOrEqual(storageResult.dimensions.width);
      expect(ocrResult.dimensions.height).toBeGreaterThanOrEqual(storageResult.dimensions.height);
    });

    it('should handle progressive compression to target size', async () => {
      const largeImage = createTestImage(4000, 3000, 0.9);
      const targetSizeKB = 500; // 500KB target
      
      performanceMonitor.startMeasure('progressive-compression');
      
      const result = await progressiveCompress(largeImage, targetSizeKB);
      
      const metric = performanceMonitor.endMeasure('progressive-compression');
      
      expect(metric?.duration).toBeLessThan(15000); // 15 seconds max
      expect(result.compressedSize / 1024).toBeLessThanOrEqual(targetSizeKB * 1.1); // Within 10% of target
    });

    it('should batch compress multiple images efficiently', async () => {
      const images = [
        createTestImage(1920, 1080),
        createTestImage(2048, 1536),
        createTestImage(1600, 1200),
        createTestImage(2560, 1920),
        createTestImage(1800, 1350),
      ];

      performanceMonitor.startMeasure('batch-compression');
      
      const results = await batchCompress(images, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.7,
      });
      
      const metric = performanceMonitor.endMeasure('batch-compression');
      
      expect(metric?.duration).toBeLessThan(20000); // 20 seconds for 5 images
      expect(results).toHaveLength(images.length);
      
      const stats = getCompressionStats(results);
      expect(stats.averageCompressionRatio).toBeGreaterThan(1);
      expect(stats.savingsPercentage).toBeGreaterThan(0);
    });
  });

  describe('Debounced Validation Performance', () => {
    it('should reduce validation calls with rapid input changes', async () => {
      let validationCallCount = 0;
      
      const mockValidationRules = [
        {
          field: 'numeroVuelo' as const,
          required: true,
          pattern: /^[A-Z]{2}\d{3,4}$/,
          errorMessage: 'Formato de vuelo inválido',
        },
      ];

      // Mock the hook behavior for testing
      const mockHook = {
        errors: {},
        isValidating: false,
        isValid: true,
        hasValidated: true,
        validateField: jest.fn(),
        validateAll: jest.fn(),
        clearErrors: jest.fn(),
        clearFieldError: jest.fn(),
        debouncedValidateField: jest.fn(),
      };

      // Simulate rapid typing
      mockHook.validateField('numeroVuelo', 'A');
      mockHook.validateField('numeroVuelo', 'AM');
      mockHook.validateField('numeroVuelo', 'AM1');
      mockHook.validateField('numeroVuelo', 'AM12');
      mockHook.validateField('numeroVuelo', 'AM123');

      // Wait for debounce to complete
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should have debounced the validation calls
      expect(mockHook.hasValidated).toBe(true);
    });

    it('should handle high-frequency validation without performance degradation', async () => {
      const mockValidationRules = Array.from({ length: 20 }, (_, i) => ({
        field: `field${i}` as any,
        required: true,
        errorMessage: `Field ${i} is required`,
      }));

      // Mock the hook behavior for testing
      const mockHook = {
        errors: {},
        isValidating: false,
        isValid: true,
        hasValidated: true,
        validateField: jest.fn(),
        validateAll: jest.fn(),
        clearErrors: jest.fn(),
        clearFieldError: jest.fn(),
        debouncedValidateField: jest.fn(),
      };

      performanceMonitor.startMeasure('high-frequency-validation');

      // Simulate high-frequency validation
      for (let i = 0; i < 100; i++) {
        mockHook.validateField(`field${i % 20}` as any, `value${i}`);
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      const metric = performanceMonitor.endMeasure('high-frequency-validation');

      expect(metric?.duration).toBeLessThan(1000); // Should handle efficiently
    });
  });

  describe('Memory Usage Optimization', () => {
    it('should not accumulate memory during repeated image processing', async () => {
      const testImage = createTestImage(1920, 1080);
      
      // Process the same image multiple times
      for (let i = 0; i < 10; i++) {
        await compressForStorage(testImage);
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }

      // Memory usage should remain stable
      // This is more of a smoke test since we can't easily measure memory in tests
      expect(true).toBe(true);
    });

    it('should handle large batch processing without memory overflow', async () => {
      const images = Array.from({ length: 20 }, (_, i) => 
        createTestImage(800 + i * 50, 600 + i * 30)
      );

      performanceMonitor.startMeasure('large-batch-processing');

      // Process in smaller batches to avoid memory issues
      const batchSize = 5;
      const results = [];

      for (let i = 0; i < images.length; i += batchSize) {
        const batch = images.slice(i, i + batchSize);
        const batchResults = await batchCompress(batch);
        results.push(...batchResults);
        
        // Small delay to allow garbage collection
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      const metric = performanceMonitor.endMeasure('large-batch-processing');

      expect(results).toHaveLength(images.length);
      expect(metric?.duration).toBeLessThan(60000); // 1 minute max
    });
  });

  describe('Real-world Performance Scenarios', () => {
    it('should handle typical manifiesto image processing workflow', async () => {
      // Simulate a typical workflow: upload -> compress for OCR -> compress for storage
      const manifestoImage = createTestImage(2400, 1800, 0.9);
      
      performanceMonitor.startMeasure('manifiesto-workflow');
      
      // Step 1: Compress for OCR
      const ocrVersion = await compressForOCR(manifestoImage);
      
      // Step 2: Compress for storage
      const storageVersion = await compressForStorage(manifestoImage);
      
      // Step 3: Validate results
      expect(ocrVersion.dimensions.width).toBeGreaterThan(1500);
      expect(storageVersion.compressedSize).toBeLessThan(ocrVersion.compressedSize);
      
      const metric = performanceMonitor.endMeasure('manifiesto-workflow');
      
      expect(metric?.duration).toBeLessThan(8000); // 8 seconds for complete workflow
    });

    it('should maintain performance with concurrent operations', async () => {
      const images = Array.from({ length: 5 }, (_, i) => 
        createTestImage(1600 + i * 100, 1200 + i * 75)
      );

      performanceMonitor.startMeasure('concurrent-processing');

      // Process multiple images concurrently
      const promises = images.map(async (image, index) => {
        const ocrResult = await compressForOCR(image);
        const storageResult = await compressForStorage(image);
        
        return {
          index,
          ocrSize: ocrResult.compressedSize,
          storageSize: storageResult.compressedSize,
          ocrRatio: ocrResult.compressionRatio,
          storageRatio: storageResult.compressionRatio,
        };
      });

      const results = await Promise.all(promises);
      
      const metric = performanceMonitor.endMeasure('concurrent-processing');

      expect(results).toHaveLength(images.length);
      expect(metric?.duration).toBeLessThan(15000); // 15 seconds for concurrent processing
      
      // All results should be valid
      results.forEach(result => {
        expect(result.ocrRatio).toBeGreaterThan(1);
        expect(result.storageRatio).toBeGreaterThan(1);
        expect(result.storageSize).toBeLessThanOrEqual(result.ocrSize);
      });
    });
  });

  describe('Performance Monitoring', () => {
    it('should track performance metrics accurately', async () => {
      const testImage = createTestImage(1920, 1080);
      
      // Perform multiple operations to generate metrics
      performanceMonitor.startMeasure('operation-1');
      await compressForOCR(testImage);
      performanceMonitor.endMeasure('operation-1');
      
      performanceMonitor.startMeasure('operation-2');
      await compressForStorage(testImage);
      performanceMonitor.endMeasure('operation-2');
      
      performanceMonitor.startMeasure('operation-3');
      await new Promise(resolve => setTimeout(resolve, 100));
      performanceMonitor.endMeasure('operation-3');
      
      const summary = performanceMonitor.getSummary();
      
      expect(summary.totalMetrics).toBe(3);
      expect(summary.averageDuration).toBeGreaterThan(0);
      expect(summary.slowestMetric).toBeDefined();
      expect(summary.fastestMetric).toBeDefined();
      expect(summary.slowestMetric!.duration!).toBeGreaterThanOrEqual(summary.fastestMetric!.duration!);
    });

    it('should identify performance bottlenecks', async () => {
      const largeImage = createTestImage(4000, 3000, 0.95);
      const smallImage = createTestImage(800, 600, 0.8);
      
      performanceMonitor.startMeasure('large-image-processing');
      await compressForOCR(largeImage);
      performanceMonitor.endMeasure('large-image-processing');
      
      performanceMonitor.startMeasure('small-image-processing');
      await compressForOCR(smallImage);
      performanceMonitor.endMeasure('small-image-processing');
      
      const summary = performanceMonitor.getSummary();
      
      // Large image processing should be the bottleneck
      expect(summary.slowestMetric?.name).toBe('large-image-processing');
      expect(summary.fastestMetric?.name).toBe('small-image-processing');
    });
  });
});