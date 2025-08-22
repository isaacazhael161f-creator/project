/**
 * Simple Accessibility Settings Tests
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { AccessibilitySettings } from '../AccessibilitySettings';
import { useAccessibility } from '../../../hooks/useAccessibility';

// Mock the accessibility hook
jest.mock('../../../hooks/useAccessibility');
const mockUseAccessibility = useAccessibility as jest.MockedFunction<typeof useAccessibility>;

describe('AccessibilitySettings - Simple Tests', () => {
  const mockUpdateOption = jest.fn();
  const mockAnnounce = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAccessibility.mockReturnValue({
      options: {
        highContrast: false,
        darkMode: false,
        fontSize: 'medium',
        reducedMotion: false,
        screenReader: false,
      },
      updateOption: mockUpdateOption,
      announce: mockAnnounce,
    });
  });

  it('should render when visible', () => {
    render(<AccessibilitySettings visible={true} onClose={jest.fn()} />);
    
    expect(screen.getByText('Configuración de Accesibilidad')).toBeTruthy();
  });

  it('should not render when not visible', () => {
    render(<AccessibilitySettings visible={false} onClose={jest.fn()} />);
    
    expect(screen.queryByText('Configuración de Accesibilidad')).toBeNull();
  });

  it('should have proper accessibility attributes', () => {
    render(<AccessibilitySettings visible={true} onClose={jest.fn()} />);
    
    // Check for dialog role
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeTruthy();
    expect(dialog).toHaveProp('accessibilityLabel', 'Configuración de accesibilidad');
    expect(dialog).toHaveProp('accessibilityModal', true);
  });

  it('should call onClose when close button is pressed', () => {
    const mockOnClose = jest.fn();
    render(<AccessibilitySettings visible={true} onClose={mockOnClose} />);
    
    const closeButton = screen.getByRole('button', { name: /cerrar/i });
    fireEvent.press(closeButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should have switches with proper labels', () => {
    render(<AccessibilitySettings visible={true} onClose={jest.fn()} />);
    
    expect(screen.getByLabelText('Activar alto contraste')).toBeTruthy();
    expect(screen.getByLabelText('Activar modo oscuro')).toBeTruthy();
    expect(screen.getByLabelText('Reducir animaciones y movimiento')).toBeTruthy();
    expect(screen.getByLabelText('Optimizar para lector de pantalla')).toBeTruthy();
  });

  it('should update options when switches are toggled', () => {
    render(<AccessibilitySettings visible={true} onClose={jest.fn()} />);
    
    const highContrastSwitch = screen.getByLabelText('Activar alto contraste');
    fireEvent(highContrastSwitch, 'valueChange', true);
    
    expect(mockUpdateOption).toHaveBeenCalledWith('highContrast', true);
    expect(mockAnnounce).toHaveBeenCalledWith('highContrast activado');
  });

  it('should have font size radio buttons', () => {
    render(<AccessibilitySettings visible={true} onClose={jest.fn()} />);
    
    const radioButtons = screen.getAllByRole('radio');
    expect(radioButtons).toHaveLength(3);
  });

  it('should update font size when radio button is pressed', () => {
    render(<AccessibilitySettings visible={true} onClose={jest.fn()} />);
    
    const largeButton = screen.getByLabelText('Tamaño grande');
    fireEvent.press(largeButton);
    
    expect(mockUpdateOption).toHaveBeenCalledWith('fontSize', 'large');
    expect(mockAnnounce).toHaveBeenCalledWith('Tamaño de fuente cambiado a large');
  });
});