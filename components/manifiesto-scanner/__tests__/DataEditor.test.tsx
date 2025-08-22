/**
 * DataEditor Component Tests
 * Tests for the data editing interface with validation and field highlighting
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { DataEditor } from '../DataEditor';
import { ManifiestoData, ValidationRule } from '../../../types/manifiesto';
import { VALIDATION_RULES } from '../../../utils/manifiesto/validation';

// Mock data for testing
const mockManifiestoData: Partial<ManifiestoData> = {
  fecha: '15/12/2024',
  folio: 'ABC123',
  aeropuertoSalida: 'MEX',
  tipoVuelo: 'Nacional',
  transportista: 'Aeroméxico',
  equipo: 'B737',
  matricula: 'XA-ABC',
  numeroVuelo: 'AM123',
  pilotoAlMando: 'Juan Pérez',
  numeroLicencia: 'LIC123',
  tripulacion: 4,
  origenVuelo: 'GDL',
  proximaEscala: 'MTY',
  destinoVuelo: 'CUN',
  horaSlotAsignado: '14:30',
  horaSlotCoordinado: '14:35',
  horaTerminoPernocta: '06:00',
  horaInicioManiobras: '14:00',
  horaSalidaPosicion: '14:45',
  causaDemora: 'Condiciones meteorológicas adversas',
  codigoCausa: 'WX01',
  pasajeros: {
    nacional: 120,
    internacional: 0,
    diplomaticos: 0,
    enComision: 2,
    infantes: 5,
    transitos: 0,
    conexiones: 0,
    otrosExentos: 0,
    total: 127
  },
  carga: {
    equipaje: 2500.5,
    carga: 1200.0,
    correo: 50.0,
    total: 3750.5
  }
};

const mockOnDataChanged = jest.fn();

describe('DataEditor Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all sections correctly', () => {
    const { getByText } = render(
      <DataEditor
        data={mockManifiestoData}
        onDataChanged={mockOnDataChanged}
        validationRules={VALIDATION_RULES}
      />
    );

    // Check section titles
    expect(getByText('Información del Vuelo')).toBeTruthy();
    expect(getByText('Información de Aeronave')).toBeTruthy();
    expect(getByText('Información del Piloto')).toBeTruthy();
    expect(getByText('Movimiento de Operaciones')).toBeTruthy();
    expect(getByText('Causa de Demora')).toBeTruthy();
    expect(getByText('Información de Pasajeros')).toBeTruthy();
    expect(getByText('Información de Carga (kg)')).toBeTruthy();
  });

  it('displays initial data correctly', () => {
    const { getByDisplayValue } = render(
      <DataEditor
        data={mockManifiestoData}
        onDataChanged={mockOnDataChanged}
        validationRules={VALIDATION_RULES}
      />
    );

    expect(getByDisplayValue('15/12/2024')).toBeTruthy();
    expect(getByDisplayValue('ABC123')).toBeTruthy();
    expect(getByDisplayValue('AM123')).toBeTruthy();
    expect(getByDisplayValue('Aeroméxico')).toBeTruthy();
  });

  it('handles text field changes correctly', async () => {
    const { getByDisplayValue } = render(
      <DataEditor
        data={mockManifiestoData}
        onDataChanged={mockOnDataChanged}
        validationRules={VALIDATION_RULES}
      />
    );

    const folioInput = getByDisplayValue('ABC123');
    
    await act(async () => {
      fireEvent.changeText(folioInput, 'XYZ789');
    });

    await waitFor(() => {
      expect(mockOnDataChanged).toHaveBeenCalledWith(
        expect.objectContaining({
          folio: 'XYZ789',
          editado: true
        })
      );
    });
  });

  it('validates required fields', async () => {
    const emptyData: Partial<ManifiestoData> = {};
    
    const { getByText } = render(
      <DataEditor
        data={emptyData}
        onDataChanged={mockOnDataChanged}
        validationRules={VALIDATION_RULES}
      />
    );

    await waitFor(() => {
      expect(getByText('Errores de Validación:')).toBeTruthy();
    });
  });

  it('shows field validation errors', async () => {
    const invalidData: Partial<ManifiestoData> = {
      fecha: '32/13/2024', // Invalid date
      numeroVuelo: '123', // Invalid flight number format
    };

    const { getByText } = render(
      <DataEditor
        data={invalidData}
        onDataChanged={mockOnDataChanged}
        validationRules={VALIDATION_RULES}
      />
    );

    await waitFor(() => {
      expect(getByText(/fecha debe tener el formato/)).toBeTruthy();
      expect(getByText(/número de vuelo debe tener el formato/)).toBeTruthy();
    });
  });

  it('handles passenger data changes and auto-calculates total', async () => {
    const { getByDisplayValue } = render(
      <DataEditor
        data={mockManifiestoData}
        onDataChanged={mockOnDataChanged}
        validationRules={VALIDATION_RULES}
      />
    );

    const nacionalInput = getByDisplayValue('120');
    
    await act(async () => {
      fireEvent.changeText(nacionalInput, '130');
    });

    await waitFor(() => {
      expect(mockOnDataChanged).toHaveBeenCalledWith(
        expect.objectContaining({
          pasajeros: expect.objectContaining({
            nacional: 130,
            total: 137 // Should auto-calculate: 130 + 0 + 0 + 2 + 5 + 0 + 0 + 0
          }),
          editado: true
        })
      );
    });
  });

  it('handles cargo data changes and auto-calculates total', async () => {
    const { getByDisplayValue } = render(
      <DataEditor
        data={mockManifiestoData}
        onDataChanged={mockOnDataChanged}
        validationRules={VALIDATION_RULES}
      />
    );

    const equipajeInput = getByDisplayValue('2500.5');
    
    await act(async () => {
      fireEvent.changeText(equipajeInput, '2600.5');
    });

    await waitFor(() => {
      expect(mockOnDataChanged).toHaveBeenCalledWith(
        expect.objectContaining({
          carga: expect.objectContaining({
            equipaje: 2600.5,
            total: 3850.5 // Should auto-calculate: 2600.5 + 1200.0 + 50.0
          }),
          editado: true
        })
      );
    });
  });

  it('highlights edited fields visually', async () => {
    const { getByDisplayValue, getByText } = render(
      <DataEditor
        data={mockManifiestoData}
        onDataChanged={mockOnDataChanged}
        validationRules={VALIDATION_RULES}
      />
    );

    const folioInput = getByDisplayValue('ABC123');
    
    await act(async () => {
      fireEvent.changeText(folioInput, 'EDITED123');
    });

    await waitFor(() => {
      expect(getByText('Editado')).toBeTruthy();
    });
  });

  it('validates passenger data totals', async () => {
    const invalidPassengerData: Partial<ManifiestoData> = {
      pasajeros: {
        nacional: 100,
        internacional: 50,
        diplomaticos: 0,
        enComision: 0,
        infantes: 0,
        transitos: 0,
        conexiones: 0,
        otrosExentos: 0,
        total: 200 // Incorrect total (should be 150)
      }
    };

    const { getByText } = render(
      <DataEditor
        data={invalidPassengerData}
        onDataChanged={mockOnDataChanged}
        validationRules={VALIDATION_RULES}
      />
    );

    await waitFor(() => {
      expect(getByText(/total de pasajeros no coincide/)).toBeTruthy();
    });
  });

  it('validates cargo data totals', async () => {
    const invalidCargoData: Partial<ManifiestoData> = {
      carga: {
        equipaje: 1000,
        carga: 500,
        correo: 100,
        total: 2000 // Incorrect total (should be 1600)
      }
    };

    const { getByText } = render(
      <DataEditor
        data={invalidCargoData}
        onDataChanged={mockOnDataChanged}
        validationRules={VALIDATION_RULES}
      />
    );

    await waitFor(() => {
      expect(getByText(/total de carga no coincide/)).toBeTruthy();
    });
  });

  it('sanitizes input values correctly', async () => {
    const { getByDisplayValue } = render(
      <DataEditor
        data={{ numeroVuelo: '' }}
        onDataChanged={mockOnDataChanged}
        validationRules={VALIDATION_RULES}
      />
    );

    const flightNumberInput = getByDisplayValue('');
    
    await act(async () => {
      fireEvent.changeText(flightNumberInput, 'am 123'); // lowercase with space
    });

    await waitFor(() => {
      expect(mockOnDataChanged).toHaveBeenCalledWith(
        expect.objectContaining({
          numeroVuelo: 'AM123' // Should be sanitized to uppercase without spaces
        })
      );
    });
  });

  it('handles real-time validation with debouncing', async () => {
    jest.useFakeTimers();
    
    const { getByDisplayValue } = render(
      <DataEditor
        data={{ fecha: '' }}
        onDataChanged={mockOnDataChanged}
        validationRules={VALIDATION_RULES}
      />
    );

    const dateInput = getByDisplayValue('');
    
    await act(async () => {
      fireEvent.changeText(dateInput, '32/13/2024');
    });

    // Fast forward timers to trigger debounced validation
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(mockOnDataChanged).toHaveBeenCalled();
    });

    jest.useRealTimers();
  });

  it('shows validation summary when there are errors', async () => {
    const invalidData: Partial<ManifiestoData> = {
      fecha: 'invalid-date',
      numeroVuelo: 'invalid-flight',
    };

    const { getByText } = render(
      <DataEditor
        data={invalidData}
        onDataChanged={mockOnDataChanged}
        validationRules={VALIDATION_RULES}
      />
    );

    await waitFor(() => {
      expect(getByText('Errores de Validación:')).toBeTruthy();
    });
  });

  it('handles custom validation rules', async () => {
    const customRules: ValidationRule[] = [
      {
        field: 'transportista',
        required: true,
        customValidator: (value) => value && value.length >= 3,
        errorMessage: 'El transportista debe tener al menos 3 caracteres'
      }
    ];

    const { getByText } = render(
      <DataEditor
        data={{ transportista: 'AB' }}
        onDataChanged={mockOnDataChanged}
        validationRules={customRules}
      />
    );

    await waitFor(() => {
      expect(getByText('El transportista debe tener al menos 3 caracteres')).toBeTruthy();
    });
  });

  it('marks data as edited when fields are modified', async () => {
    const { getByDisplayValue } = render(
      <DataEditor
        data={mockManifiestoData}
        onDataChanged={mockOnDataChanged}
        validationRules={VALIDATION_RULES}
      />
    );

    const folioInput = getByDisplayValue('ABC123');
    
    await act(async () => {
      fireEvent.changeText(folioInput, 'MODIFIED123');
    });

    await waitFor(() => {
      expect(mockOnDataChanged).toHaveBeenCalledWith(
        expect.objectContaining({
          editado: true
        })
      );
    });
  });

  it('preserves fechaProcesamiento when updating data', async () => {
    const dataWithDate = {
      ...mockManifiestoData,
      fechaProcesamiento: new Date('2024-12-15T10:00:00Z')
    };

    const { getByDisplayValue } = render(
      <DataEditor
        data={dataWithDate}
        onDataChanged={mockOnDataChanged}
        validationRules={VALIDATION_RULES}
      />
    );

    const folioInput = getByDisplayValue('ABC123');
    
    await act(async () => {
      fireEvent.changeText(folioInput, 'UPDATED123');
    });

    await waitFor(() => {
      expect(mockOnDataChanged).toHaveBeenCalledWith(
        expect.objectContaining({
          fechaProcesamiento: dataWithDate.fechaProcesamiento
        })
      );
    });
  });
});