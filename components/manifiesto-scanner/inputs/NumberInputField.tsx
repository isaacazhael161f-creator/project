/**
 * NumberInputField Component
 * Custom number input with validation, min/max constraints, edit highlighting, and accessibility features
 */

import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { AccessibleTooltip } from '../AccessibleTooltip';

interface NumberInputFieldProps {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  error?: string;
  isEdited?: boolean;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  readOnly?: boolean;
  style?: ViewStyle;
  tooltip?: string;
  accessibilityHint?: string;
}

export const NumberInputField: React.FC<NumberInputFieldProps> = ({
  label,
  value,
  onValueChange,
  error,
  isEdited = false,
  required = false,
  min,
  max,
  step = 1,
  readOnly = false,
  style,
  tooltip,
  accessibilityHint
}) => {
  const [inputValue, setInputValue] = useState(value.toString());
  const inputId = `number-input-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const errorId = `error-${inputId}`;

  const handleTextChange = (text: string) => {
    setInputValue(text);
    
    // Allow empty string for user to clear the field
    if (text === '') {
      onValueChange(0);
      return;
    }
    
    // Parse the number
    const numValue = step < 1 ? parseFloat(text) : parseInt(text, 10);
    
    if (!isNaN(numValue)) {
      // Apply min/max constraints
      let constrainedValue = numValue;
      if (min !== undefined && constrainedValue < min) {
        constrainedValue = min;
      }
      if (max !== undefined && constrainedValue > max) {
        constrainedValue = max;
      }
      
      onValueChange(constrainedValue);
    }
  };

  const handleBlur = () => {
    // Ensure the input shows the actual value after blur
    setInputValue(value.toString());
  };

  const increment = () => {
    if (readOnly) return;
    const newValue = value + step;
    if (max === undefined || newValue <= max) {
      onValueChange(newValue);
      setInputValue(newValue.toString());
    }
  };

  const decrement = () => {
    if (readOnly) return;
    const newValue = value - step;
    if (min === undefined || newValue >= min) {
      onValueChange(newValue);
      setInputValue(newValue.toString());
    }
  };

  const labelComponent = (
    <Text style={styles.label}>
      {label}
      {required && <Text style={styles.required}> *</Text>}
      {min !== undefined && max !== undefined && (
        <Text style={styles.range}> ({min} - {max})</Text>
      )}
    </Text>
  );

  return (
    <View style={[styles.container, style]}>
      {tooltip ? (
        <AccessibleTooltip content={tooltip}>
          {labelComponent}
        </AccessibleTooltip>
      ) : (
        labelComponent
      )}
      
      <View 
        style={styles.inputContainer}
        accessibilityRole="group"
        accessibilityLabel={`${label} con controles numéricos`}
      >
        {!readOnly && (
          <TouchableOpacity
            style={[styles.button, styles.decrementButton]}
            onPress={decrement}
            disabled={min !== undefined && value <= min}
            accessibilityRole="button"
            accessibilityLabel={`Disminuir ${label}`}
            accessibilityHint={`Reduce el valor en ${step}`}
            accessibilityState={{
              disabled: min !== undefined && value <= min
            }}
          >
            <Text style={styles.buttonText}>-</Text>
          </TouchableOpacity>
        )}
        
        <TextInput
          style={[
            styles.input,
            readOnly && styles.readOnlyInput,
            isEdited && styles.editedInput,
            error && styles.errorInput,
            !readOnly && styles.inputWithButtons
          ]}
          value={inputValue}
          onChangeText={handleTextChange}
          onBlur={handleBlur}
          keyboardType={step < 1 ? 'decimal-pad' : 'numeric'}
          editable={!readOnly}
          selectTextOnFocus={!readOnly}
          accessible={true}
          accessibilityLabel={`${label}${required ? ', campo obligatorio' : ''}${isEdited ? ', editado' : ''}${readOnly ? ', solo lectura' : ''}`}
          accessibilityHint={accessibilityHint || `Ingresa un número para ${label.toLowerCase()}`}
          accessibilityRole="text"
          accessibilityState={{
            disabled: readOnly,
            invalid: !!error,
          }}
          accessibilityValue={{
            text: `${value}${min !== undefined && max !== undefined ? ` entre ${min} y ${max}` : ''}`
          }}
          accessibilityDescribedBy={error ? errorId : undefined}
        />
        
        {!readOnly && (
          <TouchableOpacity
            style={[styles.button, styles.incrementButton]}
            onPress={increment}
            disabled={max !== undefined && value >= max}
            accessibilityRole="button"
            accessibilityLabel={`Aumentar ${label}`}
            accessibilityHint={`Incrementa el valor en ${step}`}
            accessibilityState={{
              disabled: max !== undefined && value >= max
            }}
          >
            <Text style={styles.buttonText}>+</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {isEdited && (
        <View 
          style={styles.editedIndicator}
          accessibilityLabel="Campo editado manualmente"
          accessible={true}
        >
          <Text style={styles.editedText}>Editado</Text>
        </View>
      )}
      
      {error && (
        <Text 
          style={styles.errorText}
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive"
          nativeID={errorId}
        >
          {error}
        </Text>
      )}
      
      {readOnly && (
        <Text 
          style={styles.readOnlyText}
          accessibilityLabel="Este campo se calcula automáticamente"
        >
          Calculado automáticamente
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#e74c3c',
  },
  range: {
    color: '#666',
    fontSize: 14,
    fontWeight: 'normal',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    minHeight: 48,
    textAlign: 'center',
  },
  inputWithButtons: {
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderRadius: 0,
  },
  readOnlyInput: {
    backgroundColor: '#f8f8f8',
    color: '#666',
  },
  editedInput: {
    borderColor: '#3498db',
    backgroundColor: '#f8f9ff',
  },
  errorInput: {
    borderColor: '#e74c3c',
    backgroundColor: '#fff5f5',
  },
  button: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  decrementButton: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    borderRightWidth: 0,
  },
  incrementButton: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    borderLeftWidth: 0,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  editedIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#3498db',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    transform: [{ translateY: -8 }, { translateX: 8 }],
  },
  editedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 14,
    marginTop: 4,
  },
  readOnlyText: {
    color: '#666',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
});