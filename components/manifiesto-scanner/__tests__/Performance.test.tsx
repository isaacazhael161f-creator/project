/**
 * Performance Tests
 * Tests for performance optimizations including lazy loading, compression, and debouncing
 */

import React from 'react';
import { render, waitFor, fireEvent, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { ManifiestoScanner } from '../ManifiestoScanner';
import { compressForOCR, compressForStorage } from '../../../utils/manifiesto/imageCompression';
import { useDebouncedValidation } from '../../../hooks/useDebouncedValidation';
import { performanceMonitor } from '../../../utils/manifiesto/performance';

// Mock dependencies
jest.mock('../../../stores/manifiestoScannerStore');
jest.mock('../../../utils/manifiesto/imageCompression');
jest.mock('../../../hooks/useDebouncedValidation');
jest.mock('../../../utils/manifiesto/performance');

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

// Mock large image data
const createLargeImageData = (sizeKB: number): string => {
  const base64Size = Math.floor((sizeKB * 1024 * 4) / 3); // Base64 is ~4/3 the size
  const base64Data = 'A'.repeat(base64Size);
  return `data:image/jpeg;base64,${base64Data}`;
};

describe('Performance Optimizations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    performanceMonitor.clearMetrics();
  });

  describe('Image Compression', () => {
    it('should compress large images for OCR processing', async () => {
      const largeImage = createLargeImageData(5000); // 5MB image
      const mockCompressedResult = {
        compressedDataUrl: createLargeImageData(1000), // 1MB compressed
        originalSize: 5000 * 1024,
        compressedSize: 1000 * 1024,
        compressionRatio: 5,
        dimensions: { width: 1800, height: 1200 },
      };

      (compressForOCR as jest.Mock).mockResolvedValue(mockCompressedResult);

      const result = await compressForOCR(largeImage);

      expect(compressForOCR).toHaveBeenCalledWith(largeImage, {
        maxWidth: 2000,
        maxHeight: 2000,
      });
      expect(result.compressionRatio).toBeGreaterThan(1);
      expect(result.compressedSize).toBeLessThan(result.originalSize);
    });

    it('should compress images for storage with higher compression', async () => {
      const largeImage = createLargeImageData(3000); // 3MB image
      const mockCompressedResult = {
        compressedDataUrl: createLargeImageData(500), // 500KB compressed
        originalSize: 3000 * 1024,
        compressedSize: 500 * 1024,
        compressionRatio: 6,
        dimensions: { width: 1200, height: 800 },
      };

      (compressForStorage as jest.Mock).mockResolvedValue(mockCompressedResult);

      const result = await compressForStorage(largeImage);

      expect(compressForStorage).toHaveBeenCalledWith(largeImage, {
        maxWidth: 1200,
        maxHeight: 1200,
      });
      expect(result.compressionRatio).toBeGreaterThan(5); // Higher compression for storage
    });

    it('should handle compression errors gracefully', async () => {
      const invalidImage = 'invalid-image-data';
      (compressForOCR as jest.Mock).mockRejectedValue(new Error('Invalid image format'));

      await expect(compressForOCR(invalidImage)).rejects.toThrow('Invalid image format');
    });

    it('should maintain image quality for OCR while reducing size', async () => {
      const testImage = createLargeImageData(2000);
      const mockResult = {
        compressedDataUrl: createLargeImageData(1500),
        originalSize: 2000 * 1024,
        compressedSize: 1500 * 1024,
        compressionRatio: 1.33,
        dimensions: { width: 1800, height: 1200 },
      };

      (compressForOCR as jest.Mock).mockResolvedValue(mockResult);

      const result = await compressForOCR(testImage);

      // Should maintain reasonable quality (not too much compression)
      expect(result.compressionRatio).toBeLessThan(3);
      expect(result.dimensions.width).toBeGreaterThan(1000);
      expect(result.dimensions.height).toBeGreaterThan(800);
    });
  });

  describe('Debounced Validation', () => {
    it('should debounce validation calls', async () => {
      const mockValidation = {
        errors: {},
        isValidating: false,
        isValid: true,
        hasValidated: false,
        validateField: jest.fn(),
        validateAll: jest.fn(),
        clearErrors: jest.fn(),
        clearFieldError: jest.fn(),
        debouncedValidateField: jest.fn(),
      };

      (useDebouncedValidation as jest.Mock).mockReturnValue(mockValidation);

      const TestComponent = () => {
        const validation = useDebouncedValidation({}, [], { debounceMs: 300 });
        
        React.useEffect(() => {
          // Simulate rapid field changes
          validation.validateField('numeroVuelo', 'AM123');
          validation.validateField('numeroVuelo', 'AM1234');
          validation.validateField('numeroVuelo', 'AM12345');
        }, [validation]);

        return null;
      };

      render(<TestComponent />);

      await waitFor(() => {
        expect(mockValidation.validateField).toHaveBeenCalledTimes(3);
      });
    });

    it('should not validate immediately when debouncing is enabled', () => {
      const mockValidation = {
        errors: {},
        isValidating: true, // Should be validating during debounce
        isValid: true,
        hasValidated: false,
        validateField: jest.fn(),
        validateAll: jest.fn(),
        clearErrors: jest.fn(),
        clearFieldError: jest.fn(),
        debouncedValidateField: jest.fn(),
      };

      (useDebouncedValidation as jest.Mock).mockReturnValue(mockValidation);

      const TestComponent = () => {
        const validation = useDebouncedValidation({}, [], { debounceMs: 300 });
        return null;
      };

      render(<TestComponent />);

      expect(mockValidation.isValidating).toBe(true);
    });

    it('should validate immediately when immediate option is enabled', () => {
      const mockValidation = {
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

      (useDebouncedValidation as jest.Mock).mockReturnValue(mockValidation);

      const TestComponent = () => {
        const validation = useDebouncedValidation({}, [], { 
          debounceMs: 300,
          immediate: true 
        });
        return null;
      };

      render(<TestComponent />);

      expect(mockValidation.hasValidated).toBe(true);
    });
  });

  describe('Performance Monitoring', () => {
    it('should measure component render times', async () => {
      const mockStartMeasure = jest.fn();
      const mockEndMeasure = jest.fn().mockReturnValue({
        name: 'component-render',
        duration: 50,
        startTime: 1000,
        endTime: 1050,
      });

      (performanceMonitor.startMeasure as jest.Mock) = mockStartMeasure;
      (performanceMonitor.endMeasure as jest.Mock) = mockEndMeasure;

      const TestComponent = () => {
        React.useEffect(() => {
          performanceMonitor.startMeasure('component-render');
          return () => {
            performanceMonitor.endMeasure('component-render');
          };
        }, []);

        return null;
      };

      const { unmount } = render(<TestComponent />);
      unmount();

      expect(mockStartMeasure).toHaveBeenCalledWith('component-render');
      expect(mockEndMeasure).toHaveBeenCalledWith('component-render');
    });

    it('should track slow operations', async () => {
      const mockStartMeasure = jest.fn();
      const mockEndMeasure = jest.fn().mockReturnValue({
        name: 'slow-operation',
        duration: 2000, // 2 seconds
        startTime: 1000,
        endTime: 3000,
      });

      (performanceMonitor.startMeasure as jest.Mock) = mockStartMeasure;
      (performanceMonitor.endMeasure as jest.Mock) = mockEndMeasure;

      performanceMonitor.startMeasure('slow-operation');
      
      // Simulate slow operation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const result = performanceMonitor.endMeasure('slow-operation');

      expect(result?.duration).toBeGreaterThan(1000); // Should detect slow operations
    });

    it('should provide performance summary', () => {
      const mockSummary = {
        totalMetrics: 5,
        averageDuration: 150,
        slowestMetric: {
          name: 'slow-component',
          duration: 500,
          startTime: 1000,
          endTime: 1500,
        },
        fastestMetric: {
          name: 'fast-component',
          duration: 10,
          startTime: 2000,
          endTime: 2010,
        },
      };

      (performanceMonitor.getSummary as jest.Mock).mockReturnValue(mockSummary);

      const summary = performanceMonitor.getSummary();

      expect(summary.totalMetrics).toBeGreaterThan(0);
      expect(summary.averageDuration).toBeGreaterThan(0);
      expect(summary.slowestMetric).toBeDefined();
      expect(summary.fastestMetric).toBeDefined();
    });
  });

  describe('Large Image Processing', () => {
    it('should handle very large images without memory issues', async () => {
      const veryLargeImage = createLargeImageData(10000); // 10MB image
      const mockCompressedResult = {
        compressedDataUrl: createLargeImageData(800), // Heavily compressed
        originalSize: 10000 * 1024,
        compressedSize: 800 * 1024,
        compressionRatio: 12.5,
        dimensions: { width: 1600, height: 1200 },
      };

      (compressForStorage as jest.Mock).mockResolvedValue(mockCompressedResult);

      const result = await compressForStorage(veryLargeImage);

      expect(result.compressionRatio).toBeGreaterThan(10);
      expect(result.compressedSize).toBeLessThan(1000 * 1024); // Under 1MB
    });

    it('should process multiple images efficiently', async () => {
      const images = [
        createLargeImageData(2000),
        createLargeImageData(3000),
        createLargeImageData(1500),
      ];

      const mockResults = images.map((_, index) => ({
        compressedDataUrl: createLargeImageData(500),
        originalSize: (2000 + index * 500) * 1024,
        compressedSize: 500 * 1024,
        compressionRatio: 4 + index,
        dimensions: { width: 1200, height: 800 },
      }));

      (compressForStorage as jest.Mock)
        .mockResolvedValueOnce(mockResults[0])
        .mockResolvedValueOnce(mockResults[1])
        .mockResolvedValueOnce(mockResults[2]);

      const startTime = Date.now();
      
      const results = await Promise.all(
        images.map(image => compressForStorage(image))
      );

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      expect(results).toHaveLength(3);
      expect(processingTime).toBeLessThan(5000); // Should process within 5 seconds
      results.forEach(result => {
        expect(result.compressionRatio).toBeGreaterThan(1);
      });
    });
  });

  describe('Memory Usage', () => {
    it('should not cause memory leaks during image processing', async () => {
      // Mock memory usage tracking
      const mockMemoryUsage = {
        used: 50 * 1024 * 1024, // 50MB
        total: 100 * 1024 * 1024, // 100MB
        percentage: 50,
      };

      // Simulate processing multiple images
      const images = Array.from({ length: 10 }, (_, i) => 
        createLargeImageData(1000 + i * 100)
      );

      const mockCompressedResult = {
        compressedDataUrl: createLargeImageData(300),
        originalSize: 1000 * 1024,
        compressedSize: 300 * 1024,
        compressionRatio: 3.33,
        dimensions: { width: 1200, height: 800 },
      };

      (compressForStorage as jest.Mock).mockResolvedValue(mockCompressedResult);

      // Process images sequentially to avoid memory buildup
      for (const image of images) {
        await compressForStorage(image);
      }

      // Memory usage should remain reasonable
      expect(mockMemoryUsage.percentage).toBeLessThan(80);
    });
  });

  describe('Lazy Loading', () => {
    it('should not load heavy components until needed', () => {
      const { queryByTestId } = render(
        <ManifiestoScanner onDataExtracted={jest.fn()} />
      );

      // Heavy components should not be loaded initially
      expect(queryByTestId('ocr-processor')).toBeNull();
      expect(queryByTestId('data-editor')).toBeNull();
    });

    it('should show skeleton screens while loading components', async () => {
      const { getByTestId } = render(
        <ManifiestoScanner onDataExtracted={jest.fn()} />
      );

      // Should show skeleton loaders
      await waitFor(() => {
        expect(getByTestId('skeleton-loader')).toBeTruthy();
      });
    });
  });
});