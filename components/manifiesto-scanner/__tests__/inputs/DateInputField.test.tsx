/**
 * DateInputField Component Tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { DateInputField } from '../../inputs/DateInputField';

describe('DateInputField Component', () => {
  const mockOnValueChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with basic props', () => {
    const { getByText, getByDisplayValue } = render(
      <DateInputField
        label="Test Date"
        value="15/12/2024"
        onValueChange={mockOnValueChange}
      />
    );

    expect(getByText('Test Date')).toBeTruthy();
    expect(getByDisplayValue('15/12/2024')).toBeTruthy();
  });

  it('shows required indicator when required', () => {
    const { getByText } = render(
      <DateInputField
        label="Required Date"
        value=""
        onValueChange={mockOnValueChange}
        required
      />
    );

    expect(getByText('*')).toBeTruthy();
  });

  it('formats date input correctly', () => {
    const { getByDisplayValue } = render(
      <DateInputField
        label="Test Date"
        value=""
        onValueChange={mockOnValueChange}
      />
    );

    const input = getByDisplayValue('');
    
    // Test partial input formatting
    fireEvent.changeText(input, '15');
    expect(mockOnValueChange).toHaveBeenCalledWith('15');

    fireEvent.changeText(input, '1512');
    expect(mockOnValueChange).toHaveBeenCalledWith('15/12');

    fireEvent.changeText(input, '15122024');
    expect(mockOnValueChange).toHaveBeenCalledWith('15/12/2024');
  });

  it('handles "Hoy" button correctly', () => {
    const { getByText } = render(
      <DateInputField
        label="Test Date"
        value=""
        onValueChange={mockOnValueChange}
      />
    );

    const todayButton = getByText('Hoy');
    fireEvent.press(todayButton);

    // Should call onValueChange with today's date in DD/MM/YYYY format
    expect(mockOnValueChange).toHaveBeenCalledWith(
      expect.stringMatching(/^\d{2}\/\d{2}\/\d{4}$/)
    );
  });

  it('validates date format correctly', () => {
    const { getByText, queryByText, rerender } = render(
      <DateInputField
        label="Test Date"
        value="32/13/2024"
        onValueChange={mockOnValueChange}
      />
    );

    expect(getByText('Fecha inválida')).toBeTruthy();

    // Test valid date
    rerender(
      <DateInputField
        label="Test Date"
        value="15/12/2024"
        onValueChange={mockOnValueChange}
      />
    );

    expect(queryByText('Fecha inválida')).toBeNull();
  });

  it('shows error message when provided', () => {
    const { getByText } = render(
      <DateInputField
        label="Date with Error"
        value=""
        onValueChange={mockOnValueChange}
        error="Date is required"
      />
    );

    expect(getByText('Date is required')).toBeTruthy();
  });

  it('shows edited indicator when field is edited', () => {
    const { getByText } = render(
      <DateInputField
        label="Edited Date"
        value="15/12/2024"
        onValueChange={mockOnValueChange}
        isEdited
      />
    );

    expect(getByText('Editado')).toBeTruthy();
  });

  it('shows helper text', () => {
    const { getByText } = render(
      <DateInputField
        label="Test Date"
        value=""
        onValueChange={mockOnValueChange}
      />
    );

    expect(getByText('Formato: DD/MM/YYYY')).toBeTruthy();
  });

  it('validates specific date scenarios', () => {
    const testCases = [
      { input: '29/02/2024', valid: true }, // Leap year
      { input: '29/02/2023', valid: false }, // Non-leap year
      { input: '31/04/2024', valid: false }, // April has 30 days
      { input: '31/12/2024', valid: true }, // Valid date
      { input: '00/01/2024', valid: false }, // Invalid day
      { input: '01/13/2024', valid: false }, // Invalid month
      { input: '01/01/1899', valid: false }, // Year too old
      { input: '01/01/2101', valid: false }, // Year too new
    ];

    testCases.forEach(({ input, valid }) => {
      const { queryByText, rerender } = render(
        <DateInputField
          label="Test Date"
          value={input}
          onValueChange={mockOnValueChange}
        />
      );

      if (valid) {
        expect(queryByText('Fecha inválida')).toBeNull();
      } else {
        expect(queryByText('Fecha inválida')).toBeTruthy();
      }
    });
  });

  it('applies correct styles for different states', () => {
    const { getByDisplayValue, rerender } = render(
      <DateInputField
        label="Test Date"
        value="15/12/2024"
        onValueChange={mockOnValueChange}
      />
    );

    let input = getByDisplayValue('15/12/2024');
    expect(input.props.style).toEqual(expect.arrayContaining([
      expect.objectContaining({ borderColor: '#ddd' })
    ]));

    // Test edited state
    rerender(
      <DateInputField
        label="Test Date"
        value="15/12/2024"
        onValueChange={mockOnValueChange}
        isEdited
      />
    );

    input = getByDisplayValue('15/12/2024');
    expect(input.props.style).toEqual(expect.arrayContaining([
      expect.objectContaining({ borderColor: '#3498db' })
    ]));

    // Test error state
    rerender(
      <DateInputField
        label="Test Date"
        value="32/13/2024"
        onValueChange={mockOnValueChange}
      />
    );

    input = getByDisplayValue('32/13/2024');
    expect(input.props.style).toEqual(expect.arrayContaining([
      expect.objectContaining({ borderColor: '#e74c3c' })
    ]));
  });

  it('sets correct input properties', () => {
    const { getByDisplayValue } = render(
      <DateInputField
        label="Test Date"
        value=""
        onValueChange={mockOnValueChange}
      />
    );

    const input = getByDisplayValue('');
    expect(input.props.placeholder).toBe('DD/MM/YYYY');
    expect(input.props.keyboardType).toBe('numeric');
    expect(input.props.maxLength).toBe(10);
  });

  it('removes non-numeric characters during formatting', () => {
    const { getByDisplayValue } = render(
      <DateInputField
        label="Test Date"
        value=""
        onValueChange={mockOnValueChange}
      />
    );

    const input = getByDisplayValue('');
    fireEvent.changeText(input, '1a5b/1c2d/2e0f2g4h');

    // Should format as 15/12/2024 (removing letters)
    expect(mockOnValueChange).toHaveBeenCalledWith('15/12/2024');
  });
});