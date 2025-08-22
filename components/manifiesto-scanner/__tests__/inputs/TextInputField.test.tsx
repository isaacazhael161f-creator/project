/**
 * TextInputField Component Tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TextInputField } from '../../inputs/TextInputField';

describe('TextInputField Component', () => {
  const mockOnValueChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with basic props', () => {
    const { getByText, getByDisplayValue } = render(
      <TextInputField
        label="Test Label"
        value="test value"
        onValueChange={mockOnValueChange}
      />
    );

    expect(getByText('Test Label')).toBeTruthy();
    expect(getByDisplayValue('test value')).toBeTruthy();
  });

  it('shows required indicator when required', () => {
    const { getByText } = render(
      <TextInputField
        label="Required Field"
        value=""
        onValueChange={mockOnValueChange}
        required
      />
    );

    expect(getByText('*')).toBeTruthy();
  });

  it('displays error message when provided', () => {
    const { getByText } = render(
      <TextInputField
        label="Field with Error"
        value=""
        onValueChange={mockOnValueChange}
        error="This field is required"
      />
    );

    expect(getByText('This field is required')).toBeTruthy();
  });

  it('shows edited indicator when field is edited', () => {
    const { getByText } = render(
      <TextInputField
        label="Edited Field"
        value="edited value"
        onValueChange={mockOnValueChange}
        isEdited
      />
    );

    expect(getByText('Editado')).toBeTruthy();
  });

  it('handles text changes correctly', () => {
    const { getByDisplayValue } = render(
      <TextInputField
        label="Test Field"
        value="initial"
        onValueChange={mockOnValueChange}
      />
    );

    const input = getByDisplayValue('initial');
    fireEvent.changeText(input, 'new value');

    expect(mockOnValueChange).toHaveBeenCalledWith('new value');
  });

  it('shows character count when maxLength is provided', () => {
    const { getByText } = render(
      <TextInputField
        label="Limited Field"
        value="test"
        onValueChange={mockOnValueChange}
        maxLength={10}
      />
    );

    expect(getByText('4/10')).toBeTruthy();
  });

  it('renders as multiline when specified', () => {
    const { getByDisplayValue } = render(
      <TextInputField
        label="Multiline Field"
        value="line 1\nline 2"
        onValueChange={mockOnValueChange}
        multiline
      />
    );

    const input = getByDisplayValue('line 1\nline 2');
    expect(input.props.multiline).toBe(true);
  });

  it('applies correct styles for different states', () => {
    const { getByDisplayValue, rerender } = render(
      <TextInputField
        label="Test Field"
        value="test"
        onValueChange={mockOnValueChange}
      />
    );

    let input = getByDisplayValue('test');
    expect(input.props.style).toEqual(expect.arrayContaining([
      expect.objectContaining({ borderColor: '#ddd' })
    ]));

    // Test edited state
    rerender(
      <TextInputField
        label="Test Field"
        value="test"
        onValueChange={mockOnValueChange}
        isEdited
      />
    );

    input = getByDisplayValue('test');
    expect(input.props.style).toEqual(expect.arrayContaining([
      expect.objectContaining({ borderColor: '#3498db' })
    ]));

    // Test error state
    rerender(
      <TextInputField
        label="Test Field"
        value="test"
        onValueChange={mockOnValueChange}
        error="Error message"
      />
    );

    input = getByDisplayValue('test');
    expect(input.props.style).toEqual(expect.arrayContaining([
      expect.objectContaining({ borderColor: '#e74c3c' })
    ]));
  });

  it('sets correct input properties', () => {
    const { getByDisplayValue } = render(
      <TextInputField
        label="Test Field"
        value="TEST"
        onValueChange={mockOnValueChange}
        placeholder="Enter text"
        maxLength={50}
      />
    );

    const input = getByDisplayValue('TEST');
    expect(input.props.placeholder).toBe('Enter text');
    expect(input.props.maxLength).toBe(50);
    expect(input.props.autoCapitalize).toBe('characters');
    expect(input.props.autoCorrect).toBe(false);
  });
});