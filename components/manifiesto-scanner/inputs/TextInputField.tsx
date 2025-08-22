/**
 * TextInputField Component
 * Custom text input with validation, error display, edit highlighting, and accessibility features
 */

import React from 'react';
import { View, Text, TextInput, StyleSheet, ViewStyle } from 'react-native';
import { AccessibleTooltip } from '../AccessibleTooltip';

interface TextInputFieldProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  error?: string;
  isEdited?: boolean;
  required?: boolean;
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
  style?: ViewStyle;
  tooltip?: string;
  accessibilityHint?: string;
}

export const TextInputField: React.FC<TextInputFieldProps> = ({
  label,
  value,
  onValueChange,
  error,
  isEdited = false,
  required = false,
  placeholder,
  multiline = false,
  maxLength,
  style,
  tooltip,
  accessibilityHint
}) => {
  const inputId = `input-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const errorId = `error-${inputId}`;
  const countId = `count-${inputId}`;
  
  const labelComponent = (
    <Text style={styles.label}>
      {label}
      {required && <Text style={styles.required}> *</Text>}
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
      
      <TextInput
        style={[
          styles.input,
          multiline && styles.multilineInput,
          isEdited && styles.editedInput,
          error && styles.errorInput
        ]}
        value={value}
        onChangeText={onValueChange}
        placeholder={placeholder}
        placeholderTextColor="#999"
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        maxLength={maxLength}
        autoCapitalize="characters"
        autoCorrect={false}
        accessible={true}
        accessibilityLabel={`${label}${required ? ', campo obligatorio' : ''}${isEdited ? ', editado' : ''}`}
        accessibilityHint={accessibilityHint || `Ingresa ${label.toLowerCase()}`}
        accessibilityRole="text"
        accessibilityState={{
          invalid: !!error,
        }}
        accessibilityValue={{
          text: value || placeholder || ''
        }}
        accessibilityDescribedBy={[
          error ? errorId : undefined,
          maxLength ? countId : undefined
        ].filter(Boolean).join(' ')}
      />
      
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
      
      {maxLength && (
        <Text 
          style={styles.characterCount}
          accessibilityLabel={`${value.length} de ${maxLength} caracteres`}
          nativeID={countId}
        >
          {value.length}/{maxLength}
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
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    minHeight: 48,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  editedInput: {
    borderColor: '#3498db',
    backgroundColor: '#f8f9ff',
  },
  errorInput: {
    borderColor: '#e74c3c',
    backgroundColor: '#fff5f5',
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
  characterCount: {
    color: '#666',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
});