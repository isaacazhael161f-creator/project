/**
 * Tests for ResponsiveNavigation component
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import ResponsiveNavigation, { NavigationStep } from '../ResponsiveNavigation';

// Mock the responsive hook
jest.mock('../../../hooks/useResponsive', () => ({
  useResponsive: jest.fn(() => ({
    isMobile: true,
    isTablet: false,
    isDesktop: false,
  })),
  useResponsiveNavigation: jest.fn(() => ({
    navigationConfig: {
      showTabBar: true,
      showSidebar: false,
      showBreadcrumbs: false,
      navigationStyle: 'tabs',
    },
    navigationHeight: 60,
    sidebarWidth: 0,
  })),
  useResponsiveFontSize: jest.fn(() => ({
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
  })),
  useResponsiveSpacing: jest.fn(() => ({
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  })),
}));

const mockSteps: NavigationStep[] = [
  {
    id: 'upload',
    title: 'Cargar Imagen',
    icon: 'camera',
    completed: true,
  },
  {
    id: 'ocr',
    title: 'Extraer Texto',
    icon: 'scan',
    completed: false,
    active: true,
  },
  {
    id: 'edit',
    title: 'Editar Datos',
    icon: 'create',
    completed: false,
  },
];

describe('ResponsiveNavigation', () => {
  const mockOnStepPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Mobile Navigation', () => {
    it('should render mobile navigation correctly', () => {
      const { getByText, getByTestId } = render(
        <ResponsiveNavigation
          steps={mockSteps}
          currentStepId="ocr"
          onStepPress={mockOnStepPress}
          showProgress={true}
        />
      );

      // Should show current step info
      expect(getByText('Paso 2 de 3')).toBeTruthy();
      expect(getByText('Extraer Texto')).toBeTruthy();
    });

    it('should show progress bar when enabled', () => {
      const { getByTestId } = render(
        <ResponsiveNavigation
          steps={mockSteps}
          currentStepId="ocr"
          onStepPress={mockOnStepPress}
          showProgress={true}
        />
      );

      // Progress should be 66.67% (step 2 of 3)
      const progressBar = getByTestId('progress-bar');
      expect(progressBar.props.style).toEqual(
        expect.objectContaining({ width: '66.66666666666666%' })
      );
    });

    it('should open mobile menu when menu button is pressed', async () => {
      const { getByTestId, getByText } = render(
        <ResponsiveNavigation
          steps={mockSteps}
          currentStepId="ocr"
          onStepPress={mockOnStepPress}
        />
      );

      const menuButton = getByTestId('menu-button');
      fireEvent.press(menuButton);

      await waitFor(() => {
        expect(getByText('Pasos del Proceso')).toBeTruthy();
      });
    });

    it('should call onStepPress when step is selected from menu', async () => {
      const { getByTestId, getByText } = render(
        <ResponsiveNavigation
          steps={mockSteps}
          currentStepId="ocr"
          onStepPress={mockOnStepPress}
        />
      );

      // Open menu
      const menuButton = getByTestId('menu-button');
      fireEvent.press(menuButton);

      await waitFor(() => {
        const uploadStep = getByText('Cargar Imagen');
        fireEvent.press(uploadStep);
      });

      expect(mockOnStepPress).toHaveBeenCalledWith('upload');
    });
  });

  describe('Tablet/Desktop Navigation', () => {
    beforeEach(() => {
      const { useResponsive, useResponsiveNavigation } = require('../../../hooks/useResponsive');
      useResponsive.mockReturnValue({
        isMobile: false,
        isTablet: true,
        isDesktop: false,
      });
      useResponsiveNavigation.mockReturnValue({
        navigationConfig: {
          showTabBar: false,
          showSidebar: true,
          showBreadcrumbs: true,
          navigationStyle: 'drawer',
        },
        navigationHeight: 80,
        sidebarWidth: 280,
      });
    });

    it('should render sidebar navigation for tablet/desktop', () => {
      const { getByText } = render(
        <ResponsiveNavigation
          steps={mockSteps}
          currentStepId="ocr"
          onStepPress={mockOnStepPress}
        />
      );

      expect(getByText('Escáner de Manifiestos')).toBeTruthy();
      expect(getByText('Progreso: 67%')).toBeTruthy();
    });

    it('should render breadcrumbs when enabled', () => {
      const { getByText } = render(
        <ResponsiveNavigation
          steps={mockSteps}
          currentStepId="ocr"
          onStepPress={mockOnStepPress}
        />
      );

      // All steps should be visible in breadcrumbs
      expect(getByText('Cargar Imagen')).toBeTruthy();
      expect(getByText('Extraer Texto')).toBeTruthy();
      expect(getByText('Editar Datos')).toBeTruthy();
    });

    it('should call onStepPress when sidebar item is pressed', () => {
      const { getByText } = render(
        <ResponsiveNavigation
          steps={mockSteps}
          currentStepId="ocr"
          onStepPress={mockOnStepPress}
        />
      );

      const uploadStep = getByText('Cargar Imagen');
      fireEvent.press(uploadStep);

      expect(mockOnStepPress).toHaveBeenCalledWith('upload');
    });

    it('should show completed badge for completed steps', () => {
      const { getByTestId } = render(
        <ResponsiveNavigation
          steps={mockSteps}
          currentStepId="ocr"
          onStepPress={mockOnStepPress}
        />
      );

      // First step should have completed badge
      const completedBadge = getByTestId('completed-badge-upload');
      expect(completedBadge).toBeTruthy();
    });
  });

  describe('Progress Calculation', () => {
    it('should calculate progress correctly', () => {
      const { getByTestId } = render(
        <ResponsiveNavigation
          steps={mockSteps}
          currentStepId="upload"
          onStepPress={mockOnStepPress}
          showProgress={true}
        />
      );

      // Step 1 of 3 = 33.33%
      const progressBar = getByTestId('progress-bar');
      expect(progressBar.props.style).toEqual(
        expect.objectContaining({ width: '33.333333333333336%' })
      );
    });

    it('should handle last step progress', () => {
      const { getByTestId } = render(
        <ResponsiveNavigation
          steps={mockSteps}
          currentStepId="edit"
          onStepPress={mockOnStepPress}
          showProgress={true}
        />
      );

      // Step 3 of 3 = 100%
      const progressBar = getByTestId('progress-bar');
      expect(progressBar.props.style).toEqual(
        expect.objectContaining({ width: '100%' })
      );
    });

    it('should not show progress when disabled', () => {
      const { queryByTestId } = render(
        <ResponsiveNavigation
          steps={mockSteps}
          currentStepId="ocr"
          onStepPress={mockOnStepPress}
          showProgress={false}
        />
      );

      expect(queryByTestId('progress-bar')).toBeNull();
    });
  });

  describe('Step States', () => {
    it('should show correct icons for different step states', () => {
      const { getByTestId } = render(
        <ResponsiveNavigation
          steps={mockSteps}
          currentStepId="ocr"
          onStepPress={mockOnStepPress}
        />
      );

      // Completed step should show checkmark
      const completedIcon = getByTestId('step-icon-upload');
      expect(completedIcon.props.name).toBe('checkmark-circle');

      // Active step should show original icon
      const activeIcon = getByTestId('step-icon-ocr');
      expect(activeIcon.props.name).toBe('scan');

      // Inactive step should show original icon
      const inactiveIcon = getByTestId('step-icon-edit');
      expect(inactiveIcon.props.name).toBe('create');
    });

    it('should apply correct colors for different step states', () => {
      const { getByTestId } = render(
        <ResponsiveNavigation
          steps={mockSteps}
          currentStepId="ocr"
          onStepPress={mockOnStepPress}
        />
      );

      // Completed step should be green
      const completedIcon = getByTestId('step-icon-upload');
      expect(completedIcon.props.color).toBe('#34C759');

      // Active step should be blue
      const activeIcon = getByTestId('step-icon-ocr');
      expect(activeIcon.props.color).toBe('#007AFF');

      // Inactive step should be gray
      const inactiveIcon = getByTestId('step-icon-edit');
      expect(inactiveIcon.props.color).toBe('#666');
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', () => {
      const { getByLabelText } = render(
        <ResponsiveNavigation
          steps={mockSteps}
          currentStepId="ocr"
          onStepPress={mockOnStepPress}
        />
      );

      expect(getByLabelText('Abrir menú de navegación')).toBeTruthy();
    });

    it('should support keyboard navigation', () => {
      const { getByText } = render(
        <ResponsiveNavigation
          steps={mockSteps}
          currentStepId="ocr"
          onStepPress={mockOnStepPress}
        />
      );

      const stepButton = getByText('Cargar Imagen');
      
      // Should be focusable
      expect(stepButton.props.accessible).toBe(true);
    });
  });
});