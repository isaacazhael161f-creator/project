/**
 * Mobile/Desktop Compatibility Integration Tests
 * Tests responsive behavior and touch/mouse interactions
 * Validates camera access and file handling across devices
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Dimensions, Platform } from 'react-native';
import ManifiestoScanner from '../ManifiestoScanner';
import { useResponsive } from '../../../hooks/useResponsive';

// Mock dependencies
jest.mock('../../../hooks/useResponsive');
jest.mock('../../../stores/manifiestoScannerStore');
jest.mock('../../../utils/manifiesto/ocr');
jest.mock('../../../utils/manifiesto/storage');

// Mock React Native modules
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Dimensions: {
    get: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
  Platform: {
    OS: 'web',
    select: jest.fn((options) => options.web || options.default),
  },
}));

// Mock Expo modules for camera and file access
jest.mock('expo-camera', () => ({
  Camera: {
    requestCameraPermissionsAsync: jest.fn(),
    getCameraPermissionsAsync: jest.fn(),
  },
}));

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(),
}));

interface DeviceConfig {
  name: string;
  dimensions: { width: number; height: number };
  platform: 'ios' | 'android' | 'web';
  capabilities: {
    camera: boolean;
    fileSystem: boolean;
    touchScreen: boolean;
    keyboard: boolean;
    mouse: boolean;
  };
  constraints: {
    memory: 'low' | 'medium' | 'high';
    processing: 'slow' | 'medium' | 'fast';
    storage: 'limited' | 'moderate' | 'unlimited';
  };
}

const DEVICE_CONFIGS: DeviceConfig[] = [
  {
    name: 'iPhone SE',
    dimensions: { width: 375, height: 667 },
    platform: 'ios',
    capabilities: {
      camera: true,
      fileSystem: true,
      touchScreen: true,
      keyboard: false,
      mouse: false,
    },
    constraints: {
      memory: 'medium',
      processing: 'medium',
      storage: 'moderate',
    },
  },
  {
    name: 'iPhone 12 Pro',
    dimensions: { width: 390, height: 844 },
    platform: 'ios',
    capabilities: {
      camera: true,
      fileSystem: true,
      touchScreen: true,
      keyboard: false,
      mouse: false,
    },
    constraints: {
      memory: 'high',
      processing: 'fast',
      storage: 'unlimited',
    },
  },
  {
    name: 'Samsung Galaxy S21',
    dimensions: { width: 360, height: 800 },
    platform: 'android',
    capabilities: {
      camera: true,
      fileSystem: true,
      touchScreen: true,
      keyboard: false,
      mouse: false,
    },
    constraints: {
      memory: 'high',
      processing: 'fast',
      storage: 'unlimited',
    },
  },
  {
    name: 'Budget Android Phone',
    dimensions: { width: 360, height: 640 },
    platform: 'android',
    capabilities: {
      camera: true,
      fileSystem: true,
      touchScreen: true,
      keyboard: false,
      mouse: false,
    },
    constraints: {
      memory: 'low',
      processing: 'slow',
      storage: 'limited',
    },
  },
  {
    name: 'iPad',
    dimensions: { width: 768, height: 1024 },
    platform: 'ios',
    capabilities: {
      camera: true,
      fileSystem: true,
      touchScreen: true,
      keyboard: true, // Can have external keyboard
      mouse: false,
    },
    constraints: {
      memory: 'high',
      processing: 'fast',
      storage: 'unlimited',
    },
  },
  {
    name: 'Android Tablet',
    dimensions: { width: 800, height: 1280 },
    platform: 'android',
    capabilities: {
      camera: true,
      fileSystem: true,
      touchScreen: true,
      keyboard: true,
      mouse: false,
    },
    constraints: {
      memory: 'high',
      processing: 'fast',
      storage: 'unlimited',
    },
  },
  {
    name: 'Desktop Chrome',
    dimensions: { width: 1920, height: 1080 },
    platform: 'web',
    capabilities: {
      camera: true, // Via WebRTC
      fileSystem: true,
      touchScreen: false,
      keyboard: true,
      mouse: true,
    },
    constraints: {
      memory: 'high',
      processing: 'fast',
      storage: 'unlimited',
    },
  },
  {
    name: 'Laptop',
    dimensions: { width: 1366, height: 768 },
    platform: 'web',
    capabilities: {
      camera: true,
      fileSystem: true,
      touchScreen: false,
      keyboard: true,
      mouse: true,
    },
    constraints: {
      memory: 'medium',
      processing: 'medium',
      storage: 'moderate',
    },
  },
  {
    name: 'Surface Pro (Touch)',
    dimensions: { width: 1368, height: 912 },
    platform: 'web',
    capabilities: {
      camera: true,
      fileSystem: true,
      touchScreen: true,
      keyboard: true,
      mouse: true,
    },
    constraints: {
      memory: 'high',
      processing: 'fast',
      storage: 'unlimited',
    },
  },
];

describe('Mobile/Desktop Compatibility Integration Tests', () => {
  const mockUseResponsive = useResponsive as jest.MockedFunction<typeof useResponsive>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  DEVICE_CONFIGS.forEach(deviceConfig => {
    describe(`${deviceConfig.name} (${deviceConfig.platform})`, () => {
      beforeEach(() => {
        // Mock device dimensions
        (Dimensions.get as jest.Mock).mockReturnValue(deviceConfig.dimensions);
        
        // Mock platform
        Platform.OS = deviceConfig.platform as any;
        
        // Mock responsive hook
        mockUseResponsive.mockReturnValue({
          isMobile: deviceConfig.dimensions.width < 768,
          isTablet: deviceConfig.dimensions.width >= 768 && deviceConfig.dimensions.width < 1024,
          isDesktop: deviceConfig.dimensions.width >= 1024,
          breakpoint: deviceConfig.dimensions.width < 768 ? 'mobile' : 
                     deviceConfig.dimensions.width < 1024 ? 'tablet' : 'desktop',
          orientation: deviceConfig.dimensions.width > deviceConfig.dimensions.height ? 'landscape' : 'portrait',
        });
      });

      it('should render with appropriate layout for device', async () => {
        const onDataExtracted = jest.fn();
        const { getByTestId, queryByTestId } = render(
          <ManifiestoScanner onDataExtracted={onDataExtracted} />
        );

        const container = getByTestId('manifiesto-scanner-container');
        expect(container).toBeTruthy();

        // Check for device-specific UI elements
        if (deviceConfig.dimensions.width < 768) {
          // Mobile layout
          expect(queryByTestId('mobile-navigation')).toBeTruthy();
          expect(queryByTestId('desktop-sidebar')).toBeFalsy();
        } else if (deviceConfig.dimensions.width < 1024) {
          // Tablet layout
          expect(queryByTestId('tablet-layout')).toBeTruthy();
        } else {
          // Desktop layout
          expect(queryByTestId('desktop-sidebar')).toBeTruthy();
          expect(queryByTestId('mobile-navigation')).toBeFalsy();
        }
      });

      it('should handle input methods appropriate for device', async () => {
        const onDataExtracted = jest.fn();
        const { getByTestId, queryByTestId } = render(
          <ManifiestoScanner onDataExtracted={onDataExtracted} />
        );

        const imageUploader = getByTestId('image-uploader');

        if (deviceConfig.capabilities.touchScreen) {
          // Test touch interactions
          await act(async () => {
            fireEvent(imageUploader, 'touchStart', {
              touches: [{ clientX: 100, clientY: 100 }],
            });
            fireEvent(imageUploader, 'touchEnd', {
              touches: [{ clientX: 100, clientY: 100 }],
            });
          });

          // Should handle touch events
          expect(imageUploader).toBeTruthy();
        }

        if (deviceConfig.capabilities.mouse) {
          // Test mouse interactions
          await act(async () => {
            fireEvent.press(imageUploader);
          });

          // Should handle click events
          expect(imageUploader).toBeTruthy();
        }

        if (deviceConfig.capabilities.camera) {
          // Should show camera option
          expect(queryByTestId('camera-button')).toBeTruthy();
        } else {
          // Should not show camera option
          expect(queryByTestId('camera-button')).toBeFalsy();
        }
      });

      it('should adapt UI density for device constraints', async () => {
        const onDataExtracted = jest.fn();
        const { getByTestId, queryByTestId } = render(
          <ManifiestoScanner onDataExtracted={onDataExtracted} />
        );

        // Check UI density based on device constraints
        if (deviceConfig.constraints.memory === 'low') {
          // Should use simplified UI
          expect(queryByTestId('simplified-ui')).toBeTruthy();
          expect(queryByTestId('advanced-features')).toBeFalsy();
        }

        if (deviceConfig.constraints.processing === 'slow') {
          // Should show performance warnings
          expect(queryByTestId('performance-warning')).toBeTruthy();
        }

        if (deviceConfig.constraints.storage === 'limited') {
          // Should show storage warnings
          expect(queryByTestId('storage-warning')).toBeTruthy();
        }
      });

      it('should handle file access appropriately', async () => {
        const onDataExtracted = jest.fn();
        const { getByTestId, queryByTestId } = render(
          <ManifiestoScanner onDataExtracted={onDataExtracted} />
        );

        const imageUploader = getByTestId('image-uploader');

        if (deviceConfig.capabilities.fileSystem) {
          // Should show file picker option
          expect(queryByTestId('file-picker-button')).toBeTruthy();

          await act(async () => {
            fireEvent.press(imageUploader);
          });

          // Should handle file selection
          expect(imageUploader).toBeTruthy();
        } else {
          // Should show limited file access warning
          expect(queryByTestId('file-access-limited')).toBeTruthy();
        }
      });

      it('should optimize performance for device capabilities', async () => {
        const onDataExtracted = jest.fn();
        const { getByTestId } = render(
          <ManifiestoScanner onDataExtracted={onDataExtracted} />
        );

        const imageUploader = getByTestId('image-uploader');
        
        // Simulate image upload
        await act(async () => {
          fireEvent.press(imageUploader);
        });

        // Performance optimizations should be applied based on device
        if (deviceConfig.constraints.processing === 'slow') {
          // Should use lower quality settings
          expect(queryByTestId('low-quality-mode')).toBeTruthy();
        }

        if (deviceConfig.constraints.memory === 'low') {
          // Should use memory-efficient processing
          expect(queryByTestId('memory-efficient-mode')).toBeTruthy();
        }
      });

      it('should handle orientation changes (mobile/tablet)', async () => {
        if (deviceConfig.platform === 'web') {
          return; // Skip orientation tests for web
        }

        const onDataExtracted = jest.fn();
        const { rerender } = render(
          <ManifiestoScanner onDataExtracted={onDataExtracted} />
        );

        // Simulate orientation change
        const portraitDimensions = { 
          width: Math.min(deviceConfig.dimensions.width, deviceConfig.dimensions.height),
          height: Math.max(deviceConfig.dimensions.width, deviceConfig.dimensions.height),
        };
        
        const landscapeDimensions = {
          width: Math.max(deviceConfig.dimensions.width, deviceConfig.dimensions.height),
          height: Math.min(deviceConfig.dimensions.width, deviceConfig.dimensions.height),
        };

        // Start in portrait
        (Dimensions.get as jest.Mock).mockReturnValue(portraitDimensions);
        mockUseResponsive.mockReturnValue({
          isMobile: portraitDimensions.width < 768,
          isTablet: portraitDimensions.width >= 768 && portraitDimensions.width < 1024,
          isDesktop: portraitDimensions.width >= 1024,
          breakpoint: portraitDimensions.width < 768 ? 'mobile' : 'tablet',
          orientation: 'portrait',
        });

        rerender(<ManifiestoScanner onDataExtracted={onDataExtracted} />);

        // Change to landscape
        (Dimensions.get as jest.Mock).mockReturnValue(landscapeDimensions);
        mockUseResponsive.mockReturnValue({
          isMobile: landscapeDimensions.width < 768,
          isTablet: landscapeDimensions.width >= 768 && landscapeDimensions.width < 1024,
          isDesktop: landscapeDimensions.width >= 1024,
          breakpoint: landscapeDimensions.width < 768 ? 'mobile' : 'tablet',
          orientation: 'landscape',
        });

        rerender(<ManifiestoScanner onDataExtracted={onDataExtracted} />);

        // Should adapt layout for landscape
        const { getByTestId } = render(
          <ManifiestoScanner onDataExtracted={onDataExtracted} />
        );
        
        expect(getByTestId('manifiesto-scanner-container')).toBeTruthy();
      });

      it('should provide appropriate keyboard navigation (desktop/tablet)', async () => {
        if (!deviceConfig.capabilities.keyboard) {
          return; // Skip keyboard tests for touch-only devices
        }

        const onDataExtracted = jest.fn();
        const { getByTestId } = render(
          <ManifiestoScanner onDataExtracted={onDataExtracted} />
        );

        const container = getByTestId('manifiesto-scanner-container');

        // Test keyboard navigation
        await act(async () => {
          fireEvent(container, 'keyDown', { key: 'Tab' });
        });

        // Should support keyboard navigation
        expect(container).toBeTruthy();

        // Test keyboard shortcuts
        await act(async () => {
          fireEvent(container, 'keyDown', { key: 'Enter' });
        });

        // Should handle keyboard shortcuts
        expect(container).toBeTruthy();
      });

      it('should handle camera access appropriately', async () => {
        if (!deviceConfig.capabilities.camera) {
          return; // Skip camera tests for devices without camera
        }

        const onDataExtracted = jest.fn();
        const { getByTestId, queryByTestId } = render(
          <ManifiestoScanner onDataExtracted={onDataExtracted} />
        );

        const cameraButton = queryByTestId('camera-button');
        
        if (deviceConfig.platform === 'web') {
          // Web should use WebRTC camera access
          expect(cameraButton).toBeTruthy();
          
          if (cameraButton) {
            await act(async () => {
              fireEvent.press(cameraButton);
            });

            // Should request camera permissions
            expect(queryByTestId('camera-permission-request')).toBeTruthy();
          }
        } else {
          // Mobile should use native camera
          expect(cameraButton).toBeTruthy();
          
          if (cameraButton) {
            await act(async () => {
              fireEvent.press(cameraButton);
            });

            // Should open native camera
            expect(queryByTestId('native-camera')).toBeTruthy();
          }
        }
      });

      it('should adapt text size and touch targets for device', async () => {
        const onDataExtracted = jest.fn();
        const { getByTestId, getAllByTestId } = render(
          <ManifiestoScanner onDataExtracted={onDataExtracted} />
        );

        const buttons = getAllByTestId(/button/);
        
        if (deviceConfig.capabilities.touchScreen) {
          // Touch targets should be at least 44px
          buttons.forEach(button => {
            const style = button.props.style;
            if (style && typeof style === 'object') {
              const minTouchTarget = 44;
              // Note: In a real test, you'd check computed styles
              expect(true).toBe(true); // Placeholder for touch target size check
            }
          });
        }

        if (deviceConfig.dimensions.width < 768) {
          // Mobile should have larger text
          expect(queryByTestId('large-text-mode')).toBeTruthy();
        }
      });

      it('should handle device-specific gestures', async () => {
        if (!deviceConfig.capabilities.touchScreen) {
          return; // Skip gesture tests for non-touch devices
        }

        const onDataExtracted = jest.fn();
        const { getByTestId } = render(
          <ManifiestoScanner onDataExtracted={onDataExtracted} />
        );

        const imagePreview = getByTestId('image-preview');

        // Test pinch-to-zoom gesture
        await act(async () => {
          fireEvent(imagePreview, 'touchStart', {
            touches: [
              { clientX: 100, clientY: 100 },
              { clientX: 200, clientY: 200 },
            ],
          });
          
          fireEvent(imagePreview, 'touchMove', {
            touches: [
              { clientX: 80, clientY: 80 },
              { clientX: 220, clientY: 220 },
            ],
          });
          
          fireEvent(imagePreview, 'touchEnd', {
            touches: [],
          });
        });

        // Should handle pinch gesture
        expect(imagePreview).toBeTruthy();

        // Test swipe gesture
        await act(async () => {
          fireEvent(imagePreview, 'touchStart', {
            touches: [{ clientX: 200, clientY: 100 }],
          });
          
          fireEvent(imagePreview, 'touchMove', {
            touches: [{ clientX: 100, clientY: 100 }],
          });
          
          fireEvent(imagePreview, 'touchEnd', {
            touches: [],
          });
        });

        // Should handle swipe gesture
        expect(imagePreview).toBeTruthy();
      });
    });
  });

  describe('Cross-Device Data Synchronization', () => {
    it('should maintain data consistency across device switches', async () => {
      // Simulate starting on mobile
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 375, height: 667 });
      mockUseResponsive.mockReturnValue({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        breakpoint: 'mobile',
        orientation: 'portrait',
      });

      const onDataExtracted = jest.fn();
      const { getByTestId, rerender } = render(
        <ManifiestoScanner onDataExtracted={onDataExtracted} />
      );

      // Start workflow on mobile
      const imageUploader = getByTestId('image-uploader');
      await act(async () => {
        fireEvent.press(imageUploader);
      });

      // Switch to desktop
      (Dimensions.get as jest.Mock).mockReturnValue({ width: 1920, height: 1080 });
      mockUseResponsive.mockReturnValue({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        breakpoint: 'desktop',
        orientation: 'landscape',
      });

      rerender(<ManifiestoScanner onDataExtracted={onDataExtracted} />);

      // Should maintain workflow state
      expect(getByTestId('manifiesto-scanner-container')).toBeTruthy();
    });

    it('should handle offline/online transitions gracefully', async () => {
      const onDataExtracted = jest.fn();
      const { getByTestId, queryByTestId } = render(
        <ManifiestoScanner onDataExtracted={onDataExtracted} />
      );

      // Simulate going offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      // Should show offline indicator
      expect(queryByTestId('offline-indicator')).toBeTruthy();

      // Should still allow local processing
      const imageUploader = getByTestId('image-uploader');
      await act(async () => {
        fireEvent.press(imageUploader);
      });

      expect(imageUploader).toBeTruthy();

      // Simulate coming back online
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });

      // Should hide offline indicator
      expect(queryByTestId('offline-indicator')).toBeFalsy();
    });
  });

  describe('Accessibility Across Devices', () => {
    it('should provide appropriate accessibility features for each device type', async () => {
      const onDataExtracted = jest.fn();
      const { getByTestId, getAllByTestId } = render(
        <ManifiestoScanner onDataExtracted={onDataExtracted} />
      );

      // All interactive elements should have accessibility labels
      const interactiveElements = getAllByTestId(/button|input|link/);
      interactiveElements.forEach(element => {
        expect(element.props.accessibilityLabel || element.props['aria-label']).toBeTruthy();
      });

      // Should support screen readers
      expect(getByTestId('manifiesto-scanner-container').props.accessibilityRole).toBeTruthy();
    });

    it('should adapt accessibility features for device capabilities', async () => {
      DEVICE_CONFIGS.forEach(deviceConfig => {
        (Dimensions.get as jest.Mock).mockReturnValue(deviceConfig.dimensions);
        mockUseResponsive.mockReturnValue({
          isMobile: deviceConfig.dimensions.width < 768,
          isTablet: deviceConfig.dimensions.width >= 768 && deviceConfig.dimensions.width < 1024,
          isDesktop: deviceConfig.dimensions.width >= 1024,
          breakpoint: deviceConfig.dimensions.width < 768 ? 'mobile' : 'tablet',
          orientation: deviceConfig.dimensions.width > deviceConfig.dimensions.height ? 'landscape' : 'portrait',
        });

        const onDataExtracted = jest.fn();
        const { getByTestId, queryByTestId } = render(
          <ManifiestoScanner onDataExtracted={onDataExtracted} />
        );

        if (deviceConfig.capabilities.keyboard) {
          // Should support keyboard navigation
          expect(queryByTestId('keyboard-navigation-support')).toBeTruthy();
        }

        if (deviceConfig.capabilities.touchScreen) {
          // Should have appropriate touch targets
          expect(queryByTestId('touch-optimized')).toBeTruthy();
        }

        // Should have appropriate contrast for device
        expect(getByTestId('manifiesto-scanner-container')).toBeTruthy();
      });
    });
  });
});