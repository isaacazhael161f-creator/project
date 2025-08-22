/**
 * NumberInputField Component Tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NumberInputField } from '../../inputs/NumberInputField';

describe('NumberInputField Component', () => {
  const mockOnValueChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with basic props', () => {
    const { getByText, getByDisplayValue } = render(
      <NumberInputField
        label="Test Number"
        value={42}
        onValueChange={mockOnValueChange}
      />
    );

    expect(getByText('Test Number')).toBeTruthy();
    expect(getByDisplayValue('42')).toBeTruthy();
  });

  it('shows min/max range in label when provided', () => {
    const { getByText } = render(
      <NumberInputField
        label="Limited Number"
        value={5}
        onValueChange={mockOnValueChange}
        min={0}
        max={10}
      />
    );

    expect(getByText('(0 - 10)')).toBeTruthy();
  });

  it('handles increment button correctly', () => {
    const { getByText } = render(
      <NumberInputField
        label="Test Number"
        value={5}
        onValueChange={mockOnValueChange}
      />
    );

    const incrementButton = getByText('+');
    fireEvent.press(incrementButton);

    expect(mockOnValueChange).toHaveBeenCalledWith(6);
  });

  it('handles decrement button correctly', () => {
    const { getByText } = render(
      <NumberInputField
        label="Test Number"
        value={5}
        onValueChange={mockOnValueChange}
      />
    );

    const decrementButton = getByText('-');
    fireEvent.press(decrementButton);

    expect(mockOnValueChange).toHaveBeenCalledWith(4);
  });

  it('respects min constraint on decrement', () => {
    const { getByText } = render(
      <NumberInputField
        label="Test Number"
        value={0}
        onValueChange={mockOnValueChange}
        min={0}
      />
    );

    const decrementButton = getByText('-');
    fireEvent.press(decrementButton);

    expect(mockOnValueChange).not.toHaveBeenCalled();
  });

  it('respects max constraint on increment', () => {
    const { getByText } = render(
      <NumberInputField
        label="Test Number"
        value={10}
        onValueChange={mockOnValueChange}
        max={10}
      />
    );

    const incrementButton = getByText('+');
    fireEvent.press(incrementButton);

    expect(mockOnValueChange).not.toHaveBeenCalled();
  });

  it('handles text input correctly', () => {
    const { getByDisplayValue } = render(
      <NumberInputField
        label="Test Number"
        value={5}
        onValueChange={mockOnValueChange}
      />
    );

    const input = getByDisplayValue('5');
    fireEvent.changeText(input, '15');

    expect(mockOnValueChange).toHaveBeenCalledWith(15);
  });

  it('handles decimal numbers with step', () => {
    const { getByDisplayValue, getByText } = render(
      <NumberInputField
        label="Decimal Number"
        value={5.5}
        onValueChange={mockOnValueChange}
        step={0.1}
      />
    );

    const input = getByDisplayValue('5.5');
    fireEvent.changeText(input, '6.7');

    expect(mockOnValueChange).toHaveBeenCalledWith(6.7);

    // Test increment with decimal step
    const incrementButton = getByText('+');
    fireEvent.press(incrementButton);

    expect(mockOnValueChange).toHaveBeenCalledWith(5.6);
  });

  it('handles empty input correctly', () => {
    const { getByDisplayValue } = render(
      <NumberInputField
        label="Test Number"
        value={5}
        onValueChange={mockOnValueChange}
      />
    );

    const input = getByDisplayValue('5');
    fireEvent.changeText(input, '');

    expect(mockOnValueChange).toHaveBeenCalledWith(0);
  });

  it('applies min/max constraints on text input', () => {
    const { getByDisplayValue } = render(
      <NumberInputField
        label="Constrained Number"
        value={5}
        onValueChange={mockOnValueChange}
        min={0}
        max={10}
      />
    );

    const input = getByDisplayValue('5');
    
    // Test value above max
    fireEvent.changeText(input, '15');
    expect(mockOnValueChange).toHaveBeenCalledWith(10);

    // Test value below min
    fireEvent.changeText(input, '-5');
    expect(mockOnValueChange).toHaveBeenCalledWith(0);
  });

  it('shows read-only state correctly', () => {
    const { getByText, queryByText } = render(
      <NumberInputField
        label="Read Only Number"
        value={42}
        onValueChange={mockOnValueChange}
        readOnly
      />
    );

    expect(getByText('Calculado automáticamente')).toBeTruthy();
    expect(queryByText('+')).toBeNull();
    expect(queryByText('-')).toBeNull();
  });

  it('shows edited indicator when field is edited', () => {
    const { getByText } = render(
      <NumberInputField
        label="Edited Number"
        value={42}
        onValueChange={mockOnValueChange}
        isEdited
      />
    );

    expect(getByText('Editado')).toBeTruthy();
  });

  it('displays error message when provided', () => {
    const { getByText } = render(
      <NumberInputField
        label="Number with Error"
        value={42}
        onValueChange={mockOnValueChange}
        error="Invalid number"
      />
    );

    expect(getByText('Invalid number')).toBeTruthy();
  });

  it('resets input value on blur', () => {
    const { getByDisplayValue } = render(
      <NumberInputField
        label="Test Number"
        value={42}
        onValueChange={mockOnValueChange}
      />
    );

    const input = getByDisplayValue('42');
    fireEvent.changeText(input, 'invalid');
    fireEvent(input, 'blur');

    // Should reset to the actual value
    expect(getByDisplayValue('42')).toBeTruthy();
  });

  it('uses correct keyboard type based on step', () => {
    const { getByDisplayValue, rerender } = render(
      <NumberInputField
        label="Integer Number"
        value={42}
        onValueChange={mockOnValueChange}
        step={1}
      />
    );

    let input = getByDisplayValue('42');
    expect(input.props.keyboardType).toBe('numeric');

    rerender(
      <NumberInputField
        label="Decimal Number"
        value={42.5}
        onValueChange={mockOnValueChange}
        step={0.1}
      />
    );

    input = getByDisplayValue('42.5');
    expect(input.props.keyboardType).toBe('decimal-pad');
  });
});