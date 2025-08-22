/**
 * TimeInputField Component Tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TimeInputField } from '../../inputs/TimeInputField';

describe('TimeInputField Component', () => {
  const mockOnValueChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with basic props', () => {
    const { getByText, getByDisplayValue } = render(
      <TimeInputField
        label="Test Time"
        value="14:30"
        onValueChange={mockOnValueChange}
      />
    );

    expect(getByText('Test Time')).toBeTruthy();
    expect(getByDisplayValue('14:30')).toBeTruthy();
  });

  it('shows required indicator when required', () => {
    const { getByText } = render(
      <TimeInputField
        label="Required Time"
        value=""
        onValueChange={mockOnValueChange}
        required
      />
    );

    expect(getByText('*')).toBeTruthy();
  });

  it('formats time input correctly', () => {
    const { getByDisplayValue } = render(
      <TimeInputField
        label="Test Time"
        value=""
        onValueChange={mockOnValueChange}
      />
    );

    const input = getByDisplayValue('');
    
    // Test partial input formatting
    fireEvent.changeText(input, '14');
    expect(mockOnValueChange).toHaveBeenCalledWith('14');

    fireEvent.changeText(input, '1430');
    expect(mockOnValueChange).toHaveBeenCalledWith('14:30');
  });

  it('handles "Ahora" button correctly', () => {
    const { getByText } = render(
      <TimeInputField
        label="Test Time"
        value=""
        onValueChange={mockOnValueChange}
      />
    );

    const nowButton = getByText('Ahora');
    fireEvent.press(nowButton);

    // Should call onValueChange with current time in HH:MM format
    expect(mockOnValueChange).toHaveBeenCalledWith(
      expect.stringMatching(/^\d{2}:\d{2}$/)
    );
  });

  it('handles +15m button correctly', () => {
    const { getByText } = render(
      <TimeInputField
        label="Test Time"
        value="14:30"
        onValueChange={mockOnValueChange}
      />
    );

    const plusButton = getByText('+15m');
    fireEvent.press(plusButton);

    expect(mockOnValueChange).toHaveBeenCalledWith('14:45');
  });

  it('handles -15m button correctly', () => {
    const { getByText } = render(
      <TimeInputField
        label="Test Time"
        value="14:30"
        onValueChange={mockOnValueChange}
      />
    );

    const minusButton = getByText('-15m');
    fireEvent.press(minusButton);

    expect(mockOnValueChange).toHaveBeenCalledWith('14:15');
  });

  it('handles time overflow correctly', () => {
    const { getByText } = render(
      <TimeInputField
        label="Test Time"
        value="23:50"
        onValueChange={mockOnValueChange}
      />
    );

    const plusButton = getByText('+15m');
    fireEvent.press(plusButton);

    // Should wrap to next day
    expect(mockOnValueChange).toHaveBeenCalledWith('00:05');
  });

  it('handles time underflow correctly', () => {
    const { getByText } = render(
      <TimeInputField
        label="Test Time"
        value="00:10"
        onValueChange={mockOnValueChange}
      />
    );

    const minusButton = getByText('-15m');
    fireEvent.press(minusButton);

    // Should wrap to previous day
    expect(mockOnValueChange).toHaveBeenCalledWith('23:55');
  });

  it('validates time format correctly', () => {
    const { getByText, queryByText, rerender } = render(
      <TimeInputField
        label="Test Time"
        value="25:70"
        onValueChange={mockOnValueChange}
      />
    );

    expect(getByText('Hora inválida (formato 24h)')).toBeTruthy();

    // Test valid time
    rerender(
      <TimeInputField
        label="Test Time"
        value="14:30"
        onValueChange={mockOnValueChange}
      />
    );

    expect(queryByText('Hora inválida (formato 24h)')).toBeNull();
  });

  it('shows error message when provided', () => {
    const { getByText } = render(
      <TimeInputField
        label="Time with Error"
        value=""
        onValueChange={mockOnValueChange}
        error="Time is required"
      />
    );

    expect(getByText('Time is required')).toBeTruthy();
  });

  it('shows edited indicator when field is edited', () => {
    const { getByText } = render(
      <TimeInputField
        label="Edited Time"
        value="14:30"
        onValueChange={mockOnValueChange}
        isEdited
      />
    );

    expect(getByText('Editado')).toBeTruthy();
  });

  it('shows helper text', () => {
    const { getByText } = render(
      <TimeInputField
        label="Test Time"
        value=""
        onValueChange={mockOnValueChange}
      />
    );

    expect(getByText('Formato 24 horas: HH:MM')).toBeTruthy();
  });

  it('validates specific time scenarios', () => {
    const testCases = [
      { input: '00:00', valid: true },
      { input: '23:59', valid: true },
      { input: '12:30', valid: true },
      { input: '24:00', valid: false },
      { input: '12:60', valid: false },
      { input: '25:30', valid: false },
      { input: '12:70', valid: false },
      { input: '1:30', valid: false }, // Should be 01:30
    ];

    testCases.forEach(({ input, valid }) => {
      const { queryByText } = render(
        <TimeInputField
          label="Test Time"
          value={input}
          onValueChange={mockOnValueChange}
        />
      );

      if (valid) {
        expect(queryByText('Hora inválida (formato 24h)')).toBeNull();
      } else {
        expect(queryByText('Hora inválida (formato 24h)')).toBeTruthy();
      }
    });
  });

  it('does not modify time when invalid for +/- buttons', () => {
    const { getByText } = render(
      <TimeInputField
        label="Test Time"
        value="invalid"
        onValueChange={mockOnValueChange}
      />
    );

    const plusButton = getByText('+15m');
    fireEvent.press(plusButton);

    // Should not call onValueChange for invalid time
    expect(mockOnValueChange).not.toHaveBeenCalled();
  });

  it('applies correct styles for different states', () => {
    const { getByDisplayValue, rerender } = render(
      <TimeInputField
        label="Test Time"
        value="14:30"
        onValueChange={mockOnValueChange}
      />
    );

    let input = getByDisplayValue('14:30');
    expect(input.props.style).toEqual(expect.arrayContaining([
      expect.objectContaining({ borderColor: '#ddd' })
    ]));

    // Test edited state
    rerender(
      <TimeInputField
        label="Test Time"
        value="14:30"
        onValueChange={mockOnValueChange}
        isEdited
      />
    );

    input = getByDisplayValue('14:30');
    expect(input.props.style).toEqual(expect.arrayContaining([
      expect.objectContaining({ borderColor: '#3498db' })
    ]));

    // Test error state
    rerender(
      <TimeInputField
        label="Test Time"
        value="25:70"
        onValueChange={mockOnValueChange}
      />
    );

    input = getByDisplayValue('25:70');
    expect(input.props.style).toEqual(expect.arrayContaining([
      expect.objectContaining({ borderColor: '#e74c3c' })
    ]));
  });

  it('sets correct input properties', () => {
    const { getByDisplayValue } = render(
      <TimeInputField
        label="Test Time"
        value=""
        onValueChange={mockOnValueChange}
      />
    );

    const input = getByDisplayValue('');
    expect(input.props.placeholder).toBe('HH:MM');
    expect(input.props.keyboardType).toBe('numeric');
    expect(input.props.maxLength).toBe(5);
  });

  it('removes non-numeric characters during formatting', () => {
    const { getByDisplayValue } = render(
      <TimeInputField
        label="Test Time"
        value=""
        onValueChange={mockOnValueChange}
      />
    );

    const input = getByDisplayValue('');
    fireEvent.changeText(input, '1a4b:3c0d');

    // Should format as 14:30 (removing letters)
    expect(mockOnValueChange).toHaveBeenCalledWith('14:30');
  });
});