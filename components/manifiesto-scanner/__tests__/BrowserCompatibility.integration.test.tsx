/**
 * Browser Compatibility Integration Tests
 * Tests functionality across different browsers and their specific features
 * Validates graceful degradation when features are not available
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import ManifiestoScanner from '../ManifiestoScanner';
import { processImageWithOCR } from '../../../utils/manifiesto/ocr';
import { saveManifiestoData } from '../../../utils/manifiesto/storage';

// Mock dependencies
jest.mock('../../../utils/manifiesto/ocr');
jest.mock('../../../utils/manifiesto/storage');
jest.mock('../../../stores/manifiestoScannerStore');

// Browser feature detection utilities
const mockBrowserFeatures = (features: Partial<BrowserFeatures>) => {
  const defaultFeatures: BrowserFeatures = {
    webWorkers: true,
    indexedDB: true,
    webp: true,
    canvas: true,
    fileAPI: true,
    webGL: false,
    serviceWorker: false,
  };

  const mockFeatures = { ...defaultFeatures, ...features };

  // Mock Worker
  if (mockFeatures.webWorkers) {
    (global as any).Worker = jest.fn().mockImplementation(() => ({
      postMessage: jest.fn(),
      terminate: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));
  } else {
    delete (global as any).Worker;
  }

  // Mock IndexedDB
  if (mockFeatures.indexedDB) {
    (global as any).indexedDB = {
      open: jest.fn().mockReturnValue({
        onsuccess: null,
        onerror: null,
        result: {
          createObjectStore: jest.fn(),
          transaction: jest.fn(),
        },
      }),
      deleteDatabase: jest.fn(),
    };
  } else {
    delete (global as any).indexedDB;
  }

  // Mock Canvas
  if (mockFeatures.canvas) {
    HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
      drawImage: jest.fn(),
      getImageData: jest.fn(),
      putImageData: jest.fn(),
      createImageData: jest.fn(),
      fillRect: jest.fn(),
      fillText: jest.fn(),
      createLinearGradient: jest.fn().mockReturnValue({
        addColorStop: jest.fn(),
      }),
    });
    HTMLCanvasElement.prototype.toDataURL = jest.fn().mockReturnValue('data:image/jpeg;base64,mock');
  }

  // Mock File API
  if (mockFeatures.fileAPI) {
    (global as any).File = jest.fn();
    (global as any).FileReader = jest.fn().mockImplementation(() => ({
      readAsDataURL: jest.fn(),
      result: 'data:image/jpeg;base64,mock',
      onload: null,
      onerror: null,
    }));
  } else {
    delete (global as any).File;
    delete (global as any).FileReader;
  }

  return mockFeatures;
};

interface BrowserFeatures {
  webWorkers: boolean;
  indexedDB: boolean;
  webp: boolean;
  canvas: boolean;
  fileAPI: boolean;
  webGL: boolean;
  serviceWorker: boolean;
}

interface BrowserConfig {
  name: string;
  userAgent: string;
  features: Partial<BrowserFeatures>;
  limitations: string[];
}

const BROWSER_CONFIGS: BrowserConfig[] = [
  {
    name: 'Chrome Desktop',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    features: {
      webWorkers: true,
      indexedDB: true,
      webp: true,
      canvas: true,
      fileAPI: true,
      webGL: true,
      serviceWorker: true,
    },
    limitations: [],
  },
  {
    name: 'Firefox Desktop',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    features: {
      webWorkers: true,
      indexedDB: true,
      webp: true,
      canvas: true,
      fileAPI: true,
      webGL: true,
      serviceWorker: true,
    },
    limitations: [],
  },
  {
    name: 'Safari Desktop',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
    features: {
      webWorkers: true,
      indexedDB: true,
      webp: false, // Safari has limited WebP support
      canvas: true,
      fileAPI: true,
      webGL: true,
      serviceWorker: true,
    },
    limitations: ['Limited WebP support'],
  },
  {
    name: 'Edge Desktop',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
    features: {
      webWorkers: true,
      indexedDB: true,
      webp: true,
      canvas: true,
      fileAPI: true,
      webGL: true,
      serviceWorker: true,
    },
    limitations: [],
  },
  {
    name: 'Chrome Mobile',
    userAgent: 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
    features: {
      webWorkers: true,
      indexedDB: true,
      webp: true,
      canvas: true,
      fileAPI: true,
      webGL: false, // Limited on mobile
      serviceWorker: true,
    },
    limitations: ['Limited WebGL support', 'Memory constraints'],
  },
  {
    name: 'Safari Mobile',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
    features: {
      webWorkers: true,
      indexedDB: true,
      webp: false,
      canvas: true,
      fileAPI: true,
      webGL: false,
      serviceWorker: true,
    },
    limitations: ['No WebP support', 'Limited WebGL', 'iOS file restrictions'],
  },
  {
    name: 'Internet Explorer 11',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko',
    features: {
      webWorkers: true,
      indexedDB: true,
      webp: false,
      canvas: true,
      fileAPI: true,
      webGL: false,
      serviceWorker: false,
    },
    limitations: ['No WebP support', 'No Service Worker', 'Limited ES6 support'],
  },
  {
    name: 'Legacy Browser',
    userAgent: 'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)',
    features: {
      webWorkers: false,
      indexedDB: false,
      webp: false,
      canvas: true,
      fileAPI: false,
      webGL: false,
      serviceWorker: false,
    },
    limitations: ['No Web Workers', 'No IndexedDB', 'Limited File API', 'No modern features'],
  },
];

describe('Browser Compatibility Integration Tests', () => {
  const mockProcessImageWithOCR = processImageWithOCR as jest.MockedFunction<typeof processImageWithOCR>;
  const mockSaveManifiestoData = saveManifiestoData as jest.MockedFunction<typeof saveManifiestoData>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset global objects
    delete (global as any).Worker;
    delete (global as any).indexedDB;
    delete (global as any).File;
    delete (global as any).FileReader;
  });

  BROWSER_CONFIGS.forEach(browserConfig => {
    describe(`${browserConfig.name} Compatibility`, () => {
      beforeEach(() => {
        // Set user agent
        Object.defineProperty(navigator, 'userAgent', {
          value: browserConfig.userAgent,
          configurable: true,
        });

        // Mock browser features
        mockBrowserFeatures(browserConfig.features);
      });

      it('should detect browser capabilities correctly', () => {
        const features = mockBrowserFeatures(browserConfig.features);
        
        expect(!!global.Worker).toBe(features.webWorkers);
        expect(!!global.indexedDB).toBe(features.indexedDB);
        expect(!!global.File).toBe(features.fileAPI);
      });

      it('should initialize scanner with appropriate configuration', async () => {
        const onDataExtracted = jest.fn();
        const { getByTestId } = render(
          <ManifiestoScanner onDataExtracted={onDataExtracted} />
        );

        const scanner = getByTestId('manifiesto-scanner-container');
        expect(scanner).toBeTruthy();

        // Should show feature warnings for limited browsers
        if (browserConfig.limitations.length > 0) {
          const warningMessage = getByTestId('browser-compatibility-warning');
          expect(warningMessage).toBeTruthy();
        }
      });

      it('should handle image upload with available features', async () => {
        mockProcessImageWithOCR.mockResolvedValue({
          text: 'MANIFIESTO DE SALIDA\nFECHA: 15/01/2024',
          confidence: browserConfig.features.webWorkers ? 0.90 : 0.75, // Lower confidence without workers
          processingTime: browserConfig.features.webWorkers ? 2000 : 4000, // Slower without workers
        });

        const onDataExtracted = jest.fn();
        const { getByTestId } = render(
          <ManifiestoScanner onDataExtracted={onDataExtracted} />
        );

        const imageUploader = getByTestId('image-uploader');
        
        if (browserConfig.features.fileAPI) {
          await act(async () => {
            fireEvent.press(imageUploader);
          });

          await waitFor(() => {
            expect(mockProcessImageWithOCR).toHaveBeenCalledWith(
              expect.any(String),
              expect.objectContaining({
                useWebWorker: browserConfig.features.webWorkers,
              })
            );
          });
        } else {
          // Should show file API not supported message
          expect(getByTestId('file-api-not-supported')).toBeTruthy();
        }
      });

      it('should handle OCR processing with browser-specific optimizations', async () => {
        if (!browserConfig.features.fileAPI) {
          return; // Skip if file API not supported
        }

        const expectedProcessingTime = browserConfig.features.webWorkers ? 2500 : 5000;
        const expectedConfidence = browserConfig.features.webWorkers ? 0.88 : 0.72;

        mockProcessImageWithOCR.mockImplementation(async (imageData, options) => {
          // Simulate processing time based on browser capabilities
          const processingTime = options?.useWebWorker ? 2500 : 5000;
          await new Promise(resolve => setTimeout(resolve, Math.min(processingTime, 100))); // Speed up for tests
          
          return {
            text: 'MANIFIESTO DE SALIDA\nTRANSPORTISTA: AEROMEXICO\nVUELO: AM123',
            confidence: options?.useWebWorker ? 0.88 : 0.72,
            processingTime,
          };
        });

        const onDataExtracted = jest.fn();
        const { getByTestId } = render(
          <ManifiestoScanner onDataExtracted={onDataExtracted} />
        );

        const imageUploader = getByTestId('image-uploader');
        await act(async () => {
          fireEvent.press(imageUploader);
        });

        await waitFor(() => {
          expect(mockProcessImageWithOCR).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
              useWebWorker: browserConfig.features.webWorkers,
            })
          );
        });

        const result = await mockProcessImageWithOCR.mock.results[0].value;
        expect(result.confidence).toBeCloseTo(expectedConfidence, 1);
      });

      it('should handle data storage with available storage options', async () => {
        const testData = {
          fecha: '15/01/2024',
          numeroVuelo: 'AM123',
          transportista: 'AEROMEXICO',
          imagenOriginal: 'base64-data',
          fechaProcesamiento: new Date(),
          editado: false,
        };

        if (browserConfig.features.indexedDB) {
          mockSaveManifiestoData.mockResolvedValue(true);
        } else {
          // Should fallback to localStorage or show warning
          mockSaveManifiestoData.mockRejectedValue(new Error('IndexedDB not supported'));
        }

        const onDataExtracted = jest.fn();
        const { getByTestId, getByText, queryByText } = render(
          <ManifiestoScanner onDataExtracted={onDataExtracted} />
        );

        // Simulate completing workflow to save step
        const saveButton = queryByText('Guardar');
        if (saveButton) {
          await act(async () => {
            fireEvent.press(saveButton);
          });

          if (browserConfig.features.indexedDB) {
            expect(mockSaveManifiestoData).toHaveBeenCalled();
          } else {
            // Should show storage limitation warning
            expect(queryByText(/almacenamiento limitado/i)).toBeTruthy();
          }
        }
      });

      it('should provide appropriate fallbacks for missing features', async () => {
        const onDataExtracted = jest.fn();
        const { getByTestId, queryByTestId, queryByText } = render(
          <ManifiestoScanner onDataExtracted={onDataExtracted} />
        );

        // Check for fallback UI elements
        if (!browserConfig.features.webWorkers) {
          expect(queryByText(/procesamiento más lento/i)).toBeTruthy();
        }

        if (!browserConfig.features.indexedDB) {
          expect(queryByText(/funcionalidad de guardado limitada/i)).toBeTruthy();
        }

        if (!browserConfig.features.fileAPI) {
          expect(queryByTestId('manual-entry-only')).toBeTruthy();
        }

        if (!browserConfig.features.webp) {
          // Should use JPEG fallback
          expect(queryByText(/formato de imagen limitado/i)).toBeTruthy();
        }
      });

      it('should handle performance appropriately for browser capabilities', async () => {
        if (!browserConfig.features.fileAPI) {
          return; // Skip if basic features not supported
        }

        const startTime = Date.now();

        mockProcessImageWithOCR.mockImplementation(async () => {
          // Simulate realistic processing times
          const baseTime = 2000;
          const workerMultiplier = browserConfig.features.webWorkers ? 1 : 2.5;
          const mobileMultiplier = browserConfig.userAgent.includes('Mobile') ? 1.5 : 1;
          
          const processingTime = baseTime * workerMultiplier * mobileMultiplier;
          await new Promise(resolve => setTimeout(resolve, Math.min(processingTime, 200))); // Speed up for tests
          
          return {
            text: 'MANIFIESTO TEST',
            confidence: 0.85,
            processingTime,
          };
        });

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
        });

        const endTime = Date.now();
        const totalTime = endTime - startTime;

        // Performance expectations based on browser capabilities
        const expectedMaxTime = browserConfig.features.webWorkers ? 1000 : 2000;
        expect(totalTime).toBeLessThan(expectedMaxTime);
      });

      it('should show appropriate user guidance for browser limitations', async () => {
        const onDataExtracted = jest.fn();
        const { queryByText, queryByTestId } = render(
          <ManifiestoScanner onDataExtracted={onDataExtracted} />
        );

        // Check for specific guidance messages
        browserConfig.limitations.forEach(limitation => {
          switch (limitation) {
            case 'No WebP support':
              expect(queryByText(/recomendamos usar imágenes JPEG/i)).toBeTruthy();
              break;
            case 'Limited WebGL':
              expect(queryByText(/funciones de imagen avanzadas no disponibles/i)).toBeTruthy();
              break;
            case 'Memory constraints':
              expect(queryByText(/recomendamos imágenes más pequeñas/i)).toBeTruthy();
              break;
            case 'No Web Workers':
              expect(queryByText(/procesamiento puede ser más lento/i)).toBeTruthy();
              break;
            case 'No IndexedDB':
              expect(queryByText(/datos no se guardarán permanentemente/i)).toBeTruthy();
              break;
          }
        });

        // Should show browser upgrade suggestion for very limited browsers
        if (browserConfig.limitations.length > 3) {
          expect(queryByText(/recomendamos actualizar su navegador/i)).toBeTruthy();
        }
      });
    });
  });

  describe('Feature Detection and Graceful Degradation', () => {
    it('should detect and adapt to partial feature support', async () => {
      // Mock a browser with mixed feature support
      mockBrowserFeatures({
        webWorkers: true,
        indexedDB: false,
        webp: true,
        canvas: true,
        fileAPI: true,
      });

      const onDataExtracted = jest.fn();
      const { getByTestId, queryByText } = render(
        <ManifiestoScanner onDataExtracted={onDataExtracted} />
      );

      // Should work with available features
      expect(getByTestId('image-uploader')).toBeTruthy();
      
      // Should warn about missing features
      expect(queryByText(/almacenamiento temporal/i)).toBeTruthy();
      
      // Should still allow core functionality
      const imageUploader = getByTestId('image-uploader');
      await act(async () => {
        fireEvent.press(imageUploader);
      });

      // Should use web workers for OCR
      expect(mockProcessImageWithOCR).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          useWebWorker: true,
        })
      );
    });

    it('should provide manual entry fallback when OCR is not supported', async () => {
      // Mock a very limited browser
      mockBrowserFeatures({
        webWorkers: false,
        indexedDB: false,
        webp: false,
        canvas: false,
        fileAPI: false,
      });

      const onDataExtracted = jest.fn();
      const { getByTestId, getByText } = render(
        <ManifiestoScanner onDataExtracted={onDataExtracted} />
      );

      // Should show manual entry option
      expect(getByText('Entrada Manual')).toBeTruthy();
      
      // Should explain limitations
      expect(getByText(/funcionalidad de escaneo no disponible/i)).toBeTruthy();
      
      const manualEntryButton = getByText('Entrada Manual');
      await act(async () => {
        fireEvent.press(manualEntryButton);
      });

      // Should navigate to manual data entry
      expect(getByTestId('data-editor')).toBeTruthy();
    });

    it('should handle progressive enhancement correctly', async () => {
      // Start with limited features
      mockBrowserFeatures({
        webWorkers: false,
        indexedDB: true,
        fileAPI: true,
      });

      const onDataExtracted = jest.fn();
      const { getByTestId, rerender } = render(
        <ManifiestoScanner onDataExtracted={onDataExtracted} />
      );

      // Should work with basic functionality
      expect(getByTestId('image-uploader')).toBeTruthy();

      // Simulate feature becoming available (e.g., polyfill loaded)
      mockBrowserFeatures({
        webWorkers: true,
        indexedDB: true,
        fileAPI: true,
      });

      rerender(<ManifiestoScanner onDataExtracted={onDataExtracted} />);

      // Should now use enhanced features
      const imageUploader = getByTestId('image-uploader');
      await act(async () => {
        fireEvent.press(imageUploader);
      });

      expect(mockProcessImageWithOCR).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          useWebWorker: true,
        })
      );
    });
  });
});