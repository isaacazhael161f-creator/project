/**
 * TimeInputField Component
 * Custom time input with validation and 24-hour format
 */

import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ViewStyle, TouchableOpacity, Platform } from 'react-native';

interface TimeInputFieldProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  error?: string;
  isEdited?: boolean;
  required?: boolean;
  style?: ViewStyle;
}

export const TimeInputField: React.FC<TimeInputFieldProps> = ({
  label,
  value,
  onValueChange,
  error,
  isEdited = false,
  required = false,
  style
}) => {
  const [inputValue, setInputValue] = useState(value);

  const formatTimeInput = (text: string): string => {
    // Remove all non-numeric characters
    const numbers = text.replace(/\D/g, '');
    
    // Format as HH:MM
    if (numbers.length <= 2) {
      return numbers;
    } else {
      return `${numbers.slice(0, 2)}:${numbers.slice(2, 4)}`;
    }
  };

  const handleTextChange = (text: string) => {
    const formatted = formatTimeInput(text);
    setInputValue(formatted);
    onValueChange(formatted);
  };

  const validateTime = (timeString: string): boolean => {
    const regex = /^(\d{1,2}):(\d{2})$/;
    const match = timeString.match(regex);
    
    if (!match) return false;
    
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    
    return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
  };

  const setCurrentTime = () => {
    const now = new Date();
    const formatted = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    setInputValue(formatted);
    onValueChange(formatted);
  };

  const addMinutes = (minutes: number) => {
    if (!value || !validateTime(value)) return;
    
    const [hours, mins] = value.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    
    // Handle day overflow/underflow
    const normalizedMinutes = ((totalMinutes % (24 * 60)) + (24 * 60)) % (24 * 60);
    const newHours = Math.floor(normalizedMinutes / 60);
    const newMins = normalizedMinutes % 60;
    
    const formatted = `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
    setInputValue(formatted);
    onValueChange(formatted);
  };

  const isValidTime = value ? validateTime(value) : true;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.timeButton} onPress={() => addMinutes(-15)}>
            <Text style={styles.timeButtonText}>-15m</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.timeButton} onPress={() => addMinutes(15)}>
            <Text style={styles.timeButtonText}>+15m</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.timeButton, styles.nowButton]} onPress={setCurrentTime}>
            <Text style={styles.nowButtonText}>Ahora</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <TextInput
        style={[
          styles.input,
          isEdited && styles.editedInput,
          (error || !isValidTime) && styles.errorInput
        ]}
        value={inputValue}
        onChangeText={handleTextChange}
        placeholder="HH:MM"
        placeholderTextColor="#999"
        keyboardType="numeric"
        maxLength={5}
      />
      
      {isEdited && (
        <View style={styles.editedIndicator}>
          <Text style={styles.editedText}>Editado</Text>
        </View>
      )}
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
      
      {!isValidTime && value && (
        <Text style={styles.errorText}>Hora inválida (formato 24h)</Text>
      )}
      
      <Text style={styles.helperText}>Formato 24 horas: HH:MM</Text>
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
    flex: 1,
  },
  required: {
    color: '#e74c3c',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  timeButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  timeButtonText: {
    color: '#333',
    fontSize: 12,
    fontWeight: '500',
  },
  nowButton: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  nowButtonText: {
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
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
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