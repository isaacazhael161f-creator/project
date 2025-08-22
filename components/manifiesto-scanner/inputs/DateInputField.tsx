/**
 * DateInputField Component
 * Custom date input with validation and date picker functionality
 */

import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ViewStyle, TouchableOpacity, Platform } from 'react-native';

interface DateInputFieldProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  error?: string;
  isEdited?: boolean;
  required?: boolean;
  style?: ViewStyle;
}

export const DateInputField: React.FC<DateInputFieldProps> = ({
  label,
  value,
  onValueChange,
  error,
  isEdited = false,
  required = false,
  style
}) => {
  const [inputValue, setInputValue] = useState(value);

  const formatDateInput = (text: string): string => {
    // Remove all non-numeric characters
    const numbers = text.replace(/\D/g, '');
    
    // Format as DD/MM/YYYY
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    } else {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
    }
  };

  const handleTextChange = (text: string) => {
    const formatted = formatDateInput(text);
    setInputValue(formatted);
    onValueChange(formatted);
  };

  const validateDate = (dateString: string): boolean => {
    const regex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = dateString.match(regex);
    
    if (!match) return false;
    
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);
    
    // Basic validation
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    if (year < 1900 || year > 2100) return false;
    
    // More specific validation for days in month
    const daysInMonth = new Date(year, month, 0).getDate();
    return day <= daysInMonth;
  };

  const setToday = () => {
    const today = new Date();
    const formatted = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
    setInputValue(formatted);
    onValueChange(formatted);
  };

  const isValidDate = value ? validateDate(value) : true;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
        
        <TouchableOpacity style={styles.todayButton} onPress={setToday}>
          <Text style={styles.todayButtonText}>Hoy</Text>
        </TouchableOpacity>
      </View>
      
      <TextInput
        style={[
          styles.input,
          isEdited && styles.editedInput,
          (error || !isValidDate) && styles.errorInput
        ]}
        value={inputValue}
        onChangeText={handleTextChange}
        placeholder="DD/MM/YYYY"
        placeholderTextColor="#999"
        keyboardType="numeric"
        maxLength={10}
      />
      
      {isEdited && (
        <View style={styles.editedIndicator}>
          <Text style={styles.editedText}>Editado</Text>
        </View>
      )}
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
      
      {!isValidDate && value && (
        <Text style={styles.errorText}>Fecha inválida</Text>
      )}
      
      <Text style={styles.helperText}>Formato: DD/MM/YYYY</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  required: {
    color: '#e74c3c',
  },
  todayButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  todayButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
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
  helperText: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
});