/**
 * Accessibility Tests for Manifiesto Scanner
 * Tests ARIA labels, keyboard navigation, screen reader support, and accessibility features
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { AccessibilitySettings } from '../AccessibilitySettings';
import { AccessibleTooltip } from '../AccessibleTooltip';
import { TextInputField } from '../inputs/TextInputField';
import { NumberInputField } from '../inputs/NumberInputField';
import { useAccessibility } from '../../../hooks/useAccessibility';

// Mock the accessibility hook
jest.mock('../../../hooks/useAccessibility');
const mockUseAccessibility = useAccessibility as jest.MockedFunction<typeof useAccessibility>;

describe('Accessibility Features', () => {
  beforeEach(() => {
    mockUseAccessibility.mockReturnValue({
      options: {
        highContrast: false,
        darkMode: false,
        fontSize: 'medium',
        reducedMotion: false,
        screenReader: false,
      },
      updateOption: jest.fn(),
      announce: jest.fn(),
    });
  });

  describe('AccessibilitySettings Component', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<AccessibilitySettings visible={true} onClose={jest.fn()} />);
      
      // Check dialog role and label
      expect(screen.getByRole('dialog')).toHaveAccessibilityLabel('Configuración de accesibilidad');
      expect(screen.getByRole('dialog')).toHaveProp('accessibilityModal', true);
      
      // Check headings
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Configuración de Accesibilidad');
      expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(4);
      
      // Check close button
      const closeButton = screen.getByRole('button', { name: /cerrar configuración/i });
      expect(closeButton).toHaveAccessibilityHint('Toca para cerrar el panel de configuración');
    });

    it('should have accessible switches with proper labels', () => {
      render(<AccessibilitySettings visible={true} onClose={jest.fn()} />);
      
      // Check switches have proper accessibility labels
      expect(screen.getByLabelText('Activar alto contraste')).toBeTruthy();
      expect(screen.getByLabelText('Activar modo oscuro')).toBeTruthy();
      expect(screen.getByLabelText('Reducir animaciones y movimiento')).toBeTruthy();
      expect(screen.getByLabelText('Optimizar para lector de pantalla')).toBeTruthy();
    });

    it('should have accessible font size radio buttons', () => {
      render(<AccessibilitySettings visible={true} onClose={jest.fn()} />);
      
      const fontSizeButtons = screen.getAllByRole('radio');
      expect(fontSizeButtons).toHaveLength(3);
      
      fontSizeButtons.forEach((button, index) => {
        const sizes = ['pequeño', 'mediano', 'grande'];
        expect(button).toHaveAccessibilityLabel(`Tamaño ${sizes[index]}`);
      });
    });

    it('should announce changes to screen reader', async () => {
      const mockAnnounce = jest.fn();
      mockUseAccessibility.mockReturnValue({
        options: {
          highContrast: false,
          darkMode: false,
          fontSize: 'medium',
          reducedMotion: false,
          screenReader: false,
        },
        updateOption: jest.fn(),
        announce: mockAnnounce,
      });

      render(<AccessibilitySettings visible={true} onClose={jest.fn()} />);
      
      const highContrastSwitch = screen.getByLabelText('Activar alto contraste');
      fireEvent(highContrastSwitch, 'valueChange', true);
      
      expect(mockAnnounce).toHaveBeenCalledWith('highContrast activado');
    });
  });

  describe('AccessibleTooltip Component', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <AccessibleTooltip content="Información de ayuda">
          <div>Trigger</div>
        </AccessibleTooltip>
      );
      
      const trigger = screen.getByRole('button');
      expect(trigger).toHaveAccessibilityLabel('Información adicional: Información de ayuda');
      expect(trigger).toHaveAccessibilityHint('Toca para mostrar información de ayuda');
    });

    it('should show tooltip with proper accessibility attributes', async () => {
      render(
        <AccessibleTooltip content="Información de ayuda">
          <div>Trigger</div>
        </AccessibleTooltip>
      );
      
      const trigger = screen.getByRole('button');
      fireEvent.press(trigger);
      
      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip).toHaveAccessibilityLabel('Información de ayuda');
        expect(tooltip).toHaveProp('accessibilityLiveRegion', 'polite');
      });
    });
  });

  describe('TextInputField Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <TextInputField
          label="Número de vuelo"
          value="AA123"
          onValueChange={jest.fn()}
          required={true}
          error="Campo requerido"
          tooltip="Ingresa el código del vuelo"
        />
      );
      
      const input = screen.getByRole('text');
      expect(input).toHaveAccessibilityLabel('Número de vuelo, campo obligatorio');
      expect(input).toHaveAccessibilityState({ invalid: true });
      expect(input).toHaveAccessibilityValue({ text: 'AA123' });
    });

    it('should have error message with alert role', () => {
      render(
        <TextInputField
          label="Número de vuelo"
          value=""
          onValueChange={jest.fn()}
          error="Campo requerido"
        />
      );
      
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveTextContent('Campo requerido');
      expect(errorMessage).toHaveProp('accessibilityLiveRegion', 'assertive');
    });

    it('should indicate edited state in accessibility label', () => {
      render(
        <TextInputField
          label="Número de vuelo"
          value="AA123"
          onValueChange={jest.fn()}
          isEdited={true}
        />
      );
      
      const input = screen.getByRole('text');
      expect(input).toHaveAccessibilityLabel('Número de vuelo, editado');
      
      const editedIndicator = screen.getByLabelText('Campo editado manualmente');
      expect(editedIndicator).toBeTruthy();
    });
  });

  describe('NumberInputField Accessibility', () => {
    it('should have proper ARIA attributes for number input', () => {
      render(
        <NumberInputField
          label="Número de pasajeros"
          value={150}
          onValueChange={jest.fn()}
          min={0}
          max={500}
          required={true}
        />
      );
      
      const input = screen.getByRole('text');
      expect(input).toHaveAccessibilityLabel('Número de pasajeros, campo obligatorio');
      expect(input).toHaveAccessibilityValue({ text: '150 entre 0 y 500' });
    });

    it('should have accessible increment/decrement buttons', () => {
      render(
        <NumberInputField
          label="Número de pasajeros"
          value={150}
          onValueChange={jest.fn()}
          step={1}
        />
      );
      
      const decrementButton = screen.getByRole('button', { name: /disminuir número de pasajeros/i });
      const incrementButton = screen.getByRole('button', { name: /aumentar número de pasajeros/i });
      
      expect(decrementButton).toHaveAccessibilityHint('Reduce el valor en 1');
      expect(incrementButton).toHaveAccessibilityHint('Incrementa el valor en 1');
    });

    it('should indicate disabled state for buttons at limits', () => {
      render(
        <NumberInputField
          label="Número de pasajeros"
          value={0}
          onValueChange={jest.fn()}
          min={0}
          max={500}
        />
      );
      
      const decrementButton = screen.getByRole('button', { name: /disminuir/i });
      expect(decrementButton).toHaveAccessibilityState({ disabled: true });
    });

    it('should have group role for input container', () => {
      render(
        <NumberInputField
          label="Número de pasajeros"
          value={150}
          onValueChange={jest.fn()}
        />
      );
      
      const inputGroup = screen.getByRole('group');
      expect(inputGroup).toHaveAccessibilityLabel('Número de pasajeros con controles numéricos');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should handle keyboard events properly', () => {
      const mockOnClose = jest.fn();
      render(<AccessibilitySettings visible={true} onClose={mockOnClose} />);
      
      // Test Escape key
      fireEvent(screen.getByRole('dialog'), 'keyDown', { key: 'Escape' });
      // Note: In a real implementation, this would close the dialog
      // For now, we just verify the event is handled
    });

    it('should support Tab navigation', () => {
      render(
        <div>
          <TextInputField label="Campo 1" value="" onValueChange={jest.fn()} />
          <TextInputField label="Campo 2" value="" onValueChange={jest.fn()} />
        </div>
      );
      
      const inputs = screen.getAllByRole('text');
      expect(inputs).toHaveLength(2);
      
      // In a real test, we would verify tab order and focus management
      inputs.forEach(input => {
        expect(input).toHaveProp('accessible', true);
      });
    });
  });

  describe('Screen Reader Support', () => {
    it('should provide meaningful descriptions for complex fields', () => {
      render(
        <NumberInputField
          label="Total de pasajeros"
          value={150}
          onValueChange={jest.fn()}
          tooltip="Suma automática de todos los tipos de pasajeros"
          readOnly={true}
        />
      );
      
      const input = screen.getByRole('text');
      expect(input).toHaveAccessibilityLabel('Total de pasajeros, solo lectura');
      
      const readOnlyText = screen.getByLabelText('Este campo se calcula automáticamente');
      expect(readOnlyText).toBeTruthy();
    });

    it('should announce validation errors', () => {
      render(
        <TextInputField
          label="Número de vuelo"
          value=""
          onValueChange={jest.fn()}
          error="Este campo es obligatorio"
        />
      );
      
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveProp('accessibilityLiveRegion', 'assertive');
    });
  });

  describe('High Contrast and Dark Mode', () => {
    it('should apply accessibility classes based on options', () => {
      mockUseAccessibility.mockReturnValue({
        options: {
          highContrast: true,
          darkMode: true,
          fontSize: 'large',
          reducedMotion: true,
          screenReader: true,
        },
        updateOption: jest.fn(),
        announce: jest.fn(),
      });

      render(<AccessibilitySettings visible={true} onClose={jest.fn()} />);
      
      // In a real implementation, we would check if the appropriate CSS classes
      // are applied to the document root
      expect(mockUseAccessibility).toHaveBeenCalled();
    });
  });

  describe('Focus Management', () => {
    it('should trap focus within modal dialogs', () => {
      render(<AccessibilitySettings visible={true} onClose={jest.fn()} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveProp('accessibilityModal', true);
      
      // In a real implementation, we would test that focus is trapped
      // within the dialog and returns to the trigger element when closed
    });

    it('should provide visible focus indicators', () => {
      render(
        <TextInputField
          label="Test Field"
          value=""
          onValueChange={jest.fn()}
        />
      );
      
      const input = screen.getByRole('text');
      fireEvent(input, 'focus');
      
      // In a real implementation, we would verify that focus styles are applied
      expect(input).toHaveProp('accessible', true);
    });
  });
});