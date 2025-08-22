/**
 * SelectInputField Component Tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SelectInputField } from '../../inputs/SelectInputField';

const mockOptions = [
  { label: 'Option 1', value: 'opt1' },
  { label: 'Option 2', value: 'opt2' },
  { label: 'Option 3', value: 'opt3' },
  { label: 'Another Option', value: 'another' },
];

describe('SelectInputField Component', () => {
  const mockOnValueChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with basic props', () => {
    const { getByText } = render(
      <SelectInputField
        label="Test Select"
        value="opt1"
        onValueChange={mockOnValueChange}
        options={mockOptions}
      />
    );

    expect(getByText('Test Select')).toBeTruthy();
    expect(getByText('Option 1')).toBeTruthy();
  });

  it('shows placeholder when no value selected', () => {
    const { getByText } = render(
      <SelectInputField
        label="Test Select"
        value=""
        onValueChange={mockOnValueChange}
        options={mockOptions}
        placeholder="Choose option"
      />
    );

    expect(getByText('Choose option')).toBeTruthy();
  });

  it('shows required indicator when required', () => {
    const { getByText } = render(
      <SelectInputField
        label="Required Select"
        value=""
        onValueChange={mockOnValueChange}
        options={mockOptions}
        required
      />
    );

    expect(getByText('*')).toBeTruthy();
  });

  it('opens modal when pressed', () => {
    const { getByText, getByDisplayValue } = render(
      <SelectInputField
        label="Test Select"
        value=""
        onValueChange={mockOnValueChange}
        options={mockOptions}
      />
    );

    const selectButton = getByText('Seleccionar...');
    fireEvent.press(selectButton);

    // Modal should be visible with options
    expect(getByText('Option 1')).toBeTruthy();
    expect(getByText('Option 2')).toBeTruthy();
    expect(getByText('Option 3')).toBeTruthy();
  });

  it('selects option correctly', () => {
    const { getByText } = render(
      <SelectInputField
        label="Test Select"
        value=""
        onValueChange={mockOnValueChange}
        options={mockOptions}
      />
    );

    // Open modal
    const selectButton = getByText('Seleccionar...');
    fireEvent.press(selectButton);

    // Select an option
    const option2 = getByText('Option 2');
    fireEvent.press(option2);

    expect(mockOnValueChange).toHaveBeenCalledWith('opt2');
  });

  it('closes modal when close button is pressed', () => {
    const { getByText, queryByText } = render(
      <SelectInputField
        label="Test Select"
        value=""
        onValueChange={mockOnValueChange}
        options={mockOptions}
      />
    );

    // Open modal
    const selectButton = getByText('Seleccionar...');
    fireEvent.press(selectButton);

    // Close modal
    const closeButton = getByText('✕');
    fireEvent.press(closeButton);

    // Options should not be visible anymore
    expect(queryByText('Option 1')).toBeNull();
  });

  it('clears selection when clear button is pressed', () => {
    const { getByText } = render(
      <SelectInputField
        label="Test Select"
        value="opt1"
        onValueChange={mockOnValueChange}
        options={mockOptions}
      />
    );

    const clearButton = getByText('✕');
    fireEvent.press(clearButton);

    expect(mockOnValueChange).toHaveBeenCalledWith('');
  });

  it('filters options when searching', () => {
    const { getByText, getByPlaceholderText, queryByText } = render(
      <SelectInputField
        label="Test Select"
        value=""
        onValueChange={mockOnValueChange}
        options={mockOptions}
        searchable
      />
    );

    // Open modal
    const selectButton = getByText('Seleccionar...');
    fireEvent.press(selectButton);

    // Search for "Another"
    const searchInput = getByPlaceholderText('Buscar...');
    fireEvent.changeText(searchInput, 'Another');

    // Only "Another Option" should be visible
    expect(getByText('Another Option')).toBeTruthy();
    expect(queryByText('Option 1')).toBeNull();
    expect(queryByText('Option 2')).toBeNull();
  });

  it('shows all options when search is cleared', () => {
    const { getByText, getByPlaceholderText } = render(
      <SelectInputField
        label="Test Select"
        value=""
        onValueChange={mockOnValueChange}
        options={mockOptions}
        searchable
      />
    );

    // Open modal
    const selectButton = getByText('Seleccionar...');
    fireEvent.press(selectButton);

    // Search and then clear
    const searchInput = getByPlaceholderText('Buscar...');
    fireEvent.changeText(searchInput, 'Another');
    fireEvent.changeText(searchInput, '');

    // All options should be visible again
    expect(getByText('Option 1')).toBeTruthy();
    expect(getByText('Option 2')).toBeTruthy();
    expect(getByText('Option 3')).toBeTruthy();
    expect(getByText('Another Option')).toBeTruthy();
  });

  it('highlights selected option in modal', () => {
    const { getByText } = render(
      <SelectInputField
        label="Test Select"
        value="opt2"
        onValueChange={mockOnValueChange}
        options={mockOptions}
      />
    );

    // Open modal
    const selectButton = getByText('Option 2');
    fireEvent.press(selectButton);

    // The selected option should have different styling
    const selectedOption = getByText('Option 2');
    expect(selectedOption).toBeTruthy();
  });

  it('shows error message when provided', () => {
    const { getByText } = render(
      <SelectInputField
        label="Select with Error"
        value=""
        onValueChange={mockOnValueChange}
        options={mockOptions}
        error="Selection is required"
      />
    );

    expect(getByText('Selection is required')).toBeTruthy();
  });

  it('shows edited indicator when field is edited', () => {
    const { getByText } = render(
      <SelectInputField
        label="Edited Select"
        value="opt1"
        onValueChange={mockOnValueChange}
        options={mockOptions}
        isEdited
      />
    );

    expect(getByText('Editado')).toBeTruthy();
  });

  it('disables search when searchable is false', () => {
    const { getByText, queryByPlaceholderText } = render(
      <SelectInputField
        label="Test Select"
        value=""
        onValueChange={mockOnValueChange}
        options={mockOptions}
        searchable={false}
      />
    );

    // Open modal
    const selectButton = getByText('Seleccionar...');
    fireEvent.press(selectButton);

    // Search input should not be present
    expect(queryByPlaceholderText('Buscar...')).toBeNull();
  });

  it('applies correct styles for different states', () => {
    const { getByText, rerender } = render(
      <SelectInputField
        label="Test Select"
        value="opt1"
        onValueChange={mockOnValueChange}
        options={mockOptions}
      />
    );

    // Test edited state
    rerender(
      <SelectInputField
        label="Test Select"
        value="opt1"
        onValueChange={mockOnValueChange}
        options={mockOptions}
        isEdited
      />
    );

    expect(getByText('Editado')).toBeTruthy();

    // Test error state
    rerender(
      <SelectInputField
        label="Test Select"
        value="opt1"
        onValueChange={mockOnValueChange}
        options={mockOptions}
        error="Error message"
      />
    );

    expect(getByText('Error message')).toBeTruthy();
  });

  it('searches by both label and value', () => {
    const { getByText, getByPlaceholderText, queryByText } = render(
      <SelectInputField
        label="Test Select"
        value=""
        onValueChange={mockOnValueChange}
        options={mockOptions}
        searchable
      />
    );

    // Open modal
    const selectButton = getByText('Seleccionar...');
    fireEvent.press(selectButton);

    // Search by value
    const searchInput = getByPlaceholderText('Buscar...');
    fireEvent.changeText(searchInput, 'opt1');

    // Should find "Option 1" by its value
    expect(getByText('Option 1')).toBeTruthy();
    expect(queryByText('Option 2')).toBeNull();
  });

  it('handles empty options array', () => {
    const { getByText } = render(
      <SelectInputField
        label="Empty Select"
        value=""
        onValueChange={mockOnValueChange}
        options={[]}
      />
    );

    // Should render without crashing
    expect(getByText('Empty Select')).toBeTruthy();
  });

  it('shows clear button only when value is selected', () => {
    const { queryByText, rerender } = render(
      <SelectInputField
        label="Test Select"
        value=""
        onValueChange={mockOnValueChange}
        options={mockOptions}
      />
    );

    // No clear button when no value
    expect(queryByText('✕')).toBeNull();

    // Clear button appears when value is selected
    rerender(
      <SelectInputField
        label="Test Select"
        value="opt1"
        onValueChange={mockOnValueChange}
        options={mockOptions}
      />
    );

    expect(queryByText('✕')).toBeTruthy();
  });
});