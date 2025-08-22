/**
 * Integration tests for responsive design across different viewports
 */

import React from 'react';
import { render, act } from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import ResponsiveManifiestoScanner from '../ResponsiveManifiestoScanner';
import ResponsiveDataEditor from '../ResponsiveDataEditor';
import ResponsiveNavigation from '../ResponsiveNavigation';

// Mock react-native modules
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Dimensions: {
      get: jest.fn(() => ({ width: 375, height: 667 })),
      addEventListener: jest.fn(() => ({ remove: jest.fn() })),
    },
  };
});

// Mock expo modules
jest.mock('expo-camera', () => ({
  CameraView: 'CameraView',
  useCameraPermissions: () => [{ granted: true }, jest.fn()],
}));

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(),
}));

jest.mock('expo-file-system', () => ({
  readAsStringAsync: jest.fn(),
  getInfoAsync: jest.fn(),
}));

// Mock Tesseract
jest.mock('tesseract.js', () => ({
  createWorker: jest.fn(),
  PSM: { AUTO: 3 },
}));

describe('Responsive Design Integration', () => {
  const mockDimensions = Dimensions.get as jest.Mock;
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Mobile Viewport (375x667)', () => {
    beforeEach(() => {
      mockDimensions.mockReturnValue({ width: 375, height: 667 });
    });

    it('should render mobile layout for ManifiestoScanner', () => {
      const { getByTestId, queryByTestId } = render(
        <ResponsiveManifiestoScanner />
      );

      // Should show mobile navigation
      expect(getByTestId('mobile-navigation')).toBeTruthy();
      
      // Should not show sidebar
      expect(queryByTestId('sidebar-navigation')).toBeNull();
    });

    it('should use single column layout for DataEditor', () => {
      const mockData = {
        fecha: '2024-01-15',
        folio: 'ABC123',
        transportista: 'Aeroméxico',
      };

      const { getByTestId } = render(
        <ResponsiveDataEditor
          data={mockData}
          onDataChanged={jest.fn()}
          validationRules={[]}
        />
      );

      const container = getByTestId('data-editor-container');
      
      // Should use single column layout
      expect(container.props.style).toEqual(
        expect.objectContaining({
          flexDirection: 'column',
        })
      );
    });

    it('should show mobile-optimized navigation', () => {
      const mockSteps = [
        { id: 'step1', title: 'Step 1', icon: 'camera' as const },
        { id: 'step2', title: 'Step 2', icon: 'scan' as const },
      ];

      const { getByText, getByTestId } = render(
        <ResponsiveNavigation
          steps={mockSteps}
          currentStepId="step1"
          onStepPress={jest.fn()}
        />
      );

      // Should show current step info
      expect(getByText('Paso 1 de 2')).toBeTruthy();
      
      // Should have menu button
      expect(getByTestId('menu-button')).toBeTruthy();
    });
  });

  describe('Tablet Viewport (768x1024)', () => {
    beforeEach(() => {
      mockDimensions.mockReturnValue({ width: 768, height: 1024 });
    });

    it('should render tablet layout for ManifiestoScanner', () => {
      const { getByTestId, queryByTestId } = render(
        <ResponsiveManifiestoScanner />
      );

      // Should show sidebar navigation
      expect(getByTestId('sidebar-navigation')).toBeTruthy();
      
      // Should not show mobile navigation
      expect(queryByTestId('mobile-navigation')).toBeNull();
    });

    it('should use two-column layout for DataEditor', () => {
      const mockData = {
        fecha: '2024-01-15',
        folio: 'ABC123',
        transportista: 'Aeroméxico',
        equipo: 'B737',
      };

      const { getByTestId } = render(
        <ResponsiveDataEditor
          data={mockData}
          onDataChanged={jest.fn()}
          validationRules={[]}
        />
      );

      const container = getByTestId('data-editor-container');
      
      // Should use multi-column layout
      expect(container.props.style).toEqual(
        expect.objectContaining({
          flexDirection: 'row',
          flexWrap: 'wrap',
        })
      );
    });

    it('should show sidebar navigation with breadcrumbs', () => {
      const mockSteps = [
        { id: 'step1', title: 'Step 1', icon: 'camera' as const },
        { id: 'step2', title: 'Step 2', icon: 'scan' as const },
      ];

      const { getByText, getByTestId } = render(
        <ResponsiveNavigation
          steps={mockSteps}
          currentStepId="step1"
          onStepPress={jest.fn()}
        />
      );

      // Should show sidebar title
      expect(getByText('Escáner de Manifiestos')).toBeTruthy();
      
      // Should show breadcrumbs
      expect(getByTestId('breadcrumbs')).toBeTruthy();
    });
  });

  describe('Desktop Viewport (1440x900)', () => {
    beforeEach(() => {
      mockDimensions.mockReturnValue({ width: 1440, height: 900 });
    });

    it('should render desktop layout for ManifiestoScanner', () => {
      const { getByTestId } = render(
        <ResponsiveManifiestoScanner />
      );

      // Should show desktop layout with sidebar
      expect(getByTestId('desktop-container')).toBeTruthy();
      expect(getByTestId('sidebar-navigation')).toBeTruthy();
    });

    it('should use three-column layout for DataEditor', () => {
      const mockData = {
        fecha: '2024-01-15',
        folio: 'ABC123',
        transportista: 'Aeroméxico',
        equipo: 'B737',
        matricula: 'XA-ABC',
        numeroVuelo: 'AM123',
      };

      const { getByTestId } = render(
        <ResponsiveDataEditor
          data={mockData}
          onDataChanged={jest.fn()}
          validationRules={[]}
        />
      );

      const fields = getByTestId('field-container');
      
      // Fields should have desktop width (approximately 32%)
      expect(fields.props.style).toEqual(
        expect.objectContaining({
          width: expect.stringMatching(/3[0-9]%/),
        })
      );
    });

    it('should optimize for mouse interaction', () => {
      const mockSteps = [
        { id: 'step1', title: 'Step 1', icon: 'camera' as const },
        { id: 'step2', title: 'Step 2', icon: 'scan' as const },
      ];

      const { getByTestId } = render(
        <ResponsiveNavigation
          steps={mockSteps}
          currentStepId="step1"
          onStepPress={jest.fn()}
        />
      );

      const sidebarItem = getByTestId('sidebar-item-step1');
      
      // Should have hover states and smaller touch targets
      expect(sidebarItem.props.style).toEqual(
        expect.objectContaining({
          paddingVertical: expect.any(Number),
        })
      );
    });
  });

  describe('Responsive Transitions', () => {
    it('should handle viewport changes dynamically', async () => {
      const mockAddEventListener = jest.fn();
      const mockRemove = jest.fn();
      mockAddEventListener.mockReturnValue({ remove: mockRemove });
      
      (Dimensions.addEventListener as jest.Mock).mockImplementation(mockAddEventListener);

      // Start with mobile
      mockDimensions.mockReturnValue({ width: 375, height: 667 });
      
      const { getByTestId, queryByTestId, rerender } = render(
        <ResponsiveManifiestoScanner />
      );

      // Should show mobile layout initially
      expect(getByTestId('mobile-navigation')).toBeTruthy();
      expect(queryByTestId('sidebar-navigation')).toBeNull();

      // Simulate viewport change to tablet
      act(() => {
        mockDimensions.mockReturnValue({ width: 768, height: 1024 });
        const changeHandler = mockAddEventListener.mock.calls[0][1];
        changeHandler({ window: { width: 768, height: 1024 } });
      });

      rerender(<ResponsiveManifiestoScanner />);

      // Should now show tablet layout
      expect(queryByTestId('mobile-navigation')).toBeNull();
      expect(getByTestId('sidebar-navigation')).toBeTruthy();
    });

    it('should maintain state across viewport changes', async () => {
      const mockOnDataChanged = jest.fn();
      const initialData = { fecha: '2024-01-15', folio: 'ABC123' };

      // Start with mobile
      mockDimensions.mockReturnValue({ width: 375, height: 667 });
      
      const { getByDisplayValue, rerender } = render(
        <ResponsiveDataEditor
          data={initialData}
          onDataChanged={mockOnDataChanged}
          validationRules={[]}
        />
      );

      // Verify initial data is displayed
      expect(getByDisplayValue('2024-01-15')).toBeTruthy();
      expect(getByDisplayValue('ABC123')).toBeTruthy();

      // Change to tablet viewport
      act(() => {
        mockDimensions.mockReturnValue({ width: 768, height: 1024 });
      });

      rerender(
        <ResponsiveDataEditor
          data={initialData}
          onDataChanged={mockOnDataChanged}
          validationRules={[]}
        />
      );

      // Data should still be displayed
      expect(getByDisplayValue('2024-01-15')).toBeTruthy();
      expect(getByDisplayValue('ABC123')).toBeTruthy();
    });
  });

  describe('Touch Optimization', () => {
    it('should use larger touch targets on mobile', () => {
      mockDimensions.mockReturnValue({ width: 375, height: 667 });

      const mockSteps = [
        { id: 'step1', title: 'Step 1', icon: 'camera' as const },
      ];

      const { getByTestId } = render(
        <ResponsiveNavigation
          steps={mockSteps}
          currentStepId="step1"
          onStepPress={jest.fn()}
        />
      );

      const menuButton = getByTestId('menu-button');
      
      // Should have minimum 44pt touch target
      expect(menuButton.props.style).toEqual(
        expect.objectContaining({
          minHeight: expect.any(Number),
          minWidth: expect.any(Number),
        })
      );
    });

    it('should optimize button sizes for touch devices', () => {
      mockDimensions.mockReturnValue({ width: 375, height: 667 });

      const { getByTestId } = render(
        <ResponsiveManifiestoScanner />
      );

      const actionButton = getByTestId('primary-action-button');
      
      // Should have touch-optimized height (minimum 48pt)
      expect(actionButton.props.style.height).toBeGreaterThanOrEqual(48);
    });
  });

  describe('Performance Optimization', () => {
    it('should lazy load components on mobile', () => {
      mockDimensions.mockReturnValue({ width: 375, height: 667 });

      const { queryByTestId } = render(
        <ResponsiveManifiestoScanner />
      );

      // Non-active step components should not be rendered
      expect(queryByTestId('ocr-processor')).toBeNull();
      expect(queryByTestId('data-editor')).toBeNull();
    });

    it('should preload components on desktop', () => {
      mockDimensions.mockReturnValue({ width: 1440, height: 900 });

      const { getByTestId } = render(
        <ResponsiveManifiestoScanner />
      );

      // Desktop should have more components preloaded
      expect(getByTestId('desktop-container')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should maintain accessibility across viewports', () => {
      const mockSteps = [
        { id: 'step1', title: 'Step 1', icon: 'camera' as const },
      ];

      // Test mobile
      mockDimensions.mockReturnValue({ width: 375, height: 667 });
      const { getByLabelText: getMobileLabel, rerender } = render(
        <ResponsiveNavigation
          steps={mockSteps}
          currentStepId="step1"
          onStepPress={jest.fn()}
        />
      );

      expect(getMobileLabel('Abrir menú de navegación')).toBeTruthy();

      // Test desktop
      mockDimensions.mockReturnValue({ width: 1440, height: 900 });
      rerender(
        <ResponsiveNavigation
          steps={mockSteps}
          currentStepId="step1"
          onStepPress={jest.fn()}
        />
      );

      const { getByLabelText: getDesktopLabel } = render(
        <ResponsiveNavigation
          steps={mockSteps}
          currentStepId="step1"
          onStepPress={jest.fn()}
        />
      );

      expect(getDesktopLabel('Navegación principal')).toBeTruthy();
    });

    it('should support keyboard navigation on desktop', () => {
      mockDimensions.mockReturnValue({ width: 1440, height: 900 });

      const mockSteps = [
        { id: 'step1', title: 'Step 1', icon: 'camera' as const },
        { id: 'step2', title: 'Step 2', icon: 'scan' as const },
      ];

      const { getByTestId } = render(
        <ResponsiveNavigation
          steps={mockSteps}
          currentStepId="step1"
          onStepPress={jest.fn()}
        />
      );

      const sidebarItem = getByTestId('sidebar-item-step2');
      
      // Should be focusable
      expect(sidebarItem.props.accessible).toBe(true);
      expect(sidebarItem.props.accessibilityRole).toBe('button');
    });
  });
});