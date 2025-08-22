/**
 * Data validation utilities for manifiesto fields
 * Contains validation rules and helper functions
 */

import { ManifiestoData, ValidationRule } from '../../types/manifiesto';

// Validation rules for manifiesto fields
export const VALIDATION_RULES: ValidationRule[] = [
  {
    field: 'fecha',
    required: true,
    pattern: /^\d{1,2}\/\d{1,2}\/\d{4}$/,
    customValidator: (value: string) => {
      if (!value) return false;
      const regex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
      const match = value.match(regex);
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
    },
    errorMessage: 'La fecha debe tener el formato DD/MM/YYYY y ser válida'
  },
  {
    field: 'folio',
    required: true,
    pattern: /^[A-Z0-9]+$/,
    errorMessage: 'El folio debe contener solo letras mayúsculas y números'
  },
  {
    field: 'numeroVuelo',
    required: true,
    pattern: /^[A-Z]{2,3}\s*\d{3,4}$/,
    errorMessage: 'El número de vuelo debe tener el formato ABC123 o AB1234'
  },
  {
    field: 'transportista',
    required: true,
    errorMessage: 'El transportista es requerido'
  },
  {
    field: 'matricula',
    required: false,
    pattern: /^[A-Z]{1,2}-[A-Z0-9]+$/,
    errorMessage: 'La matrícula debe tener el formato X-ABC123 o XY-ABC123'
  },
  {
    field: 'origenVuelo',
    required: false,
    pattern: /^[A-Z]{3}$/,
    errorMessage: 'El código de origen debe ser de 3 letras mayúsculas'
  },
  {
    field: 'destinoVuelo',
    required: false,
    pattern: /^[A-Z]{3}$/,
    errorMessage: 'El código de destino debe ser de 3 letras mayúsculas'
  }
];

/**
 * Validate a single field value
 */
export const validateField = (
  field: keyof ManifiestoData,
  value: any,
  rules: ValidationRule[] = VALIDATION_RULES
): string | null => {
  const rule = rules.find(r => r.field === field);
  if (!rule) return null;
  
  // Check if required field is empty
  if (rule.required && (!value || value.toString().trim() === '')) {
    return `${field} es requerido`;
  }
  
  // Skip pattern validation if field is empty and not required
  if (!value || value.toString().trim() === '') {
    return null;
  }
  
  // Check pattern if provided
  if (rule.pattern && !rule.pattern.test(value.toString())) {
    return rule.errorMessage;
  }
  
  // Check custom validator if provided
  if (rule.customValidator && !rule.customValidator(value)) {
    return rule.errorMessage;
  }
  
  return null;
};

/**
 * Validate entire manifiesto data object
 */
export const validateManifiestoData = (
  data: Partial<ManifiestoData>,
  rules: ValidationRule[] = VALIDATION_RULES
): { [key: string]: string } => {
  const errors: { [key: string]: string } = {};
  
  for (const rule of rules) {
    const error = validateField(rule.field, data[rule.field], rules);
    if (error) {
      errors[rule.field] = error;
    }
  }
  
  // Additional validation for passenger data
  if (data.pasajeros) {
    const passengerErrors = validatePassengerData(data.pasajeros);
    Object.assign(errors, passengerErrors);
  }
  
  // Additional validation for cargo data
  if (data.carga) {
    const cargoErrors = validateCargoData(data.carga);
    Object.assign(errors, cargoErrors);
  }
  
  return errors;
};

/**
 * Validate passenger data
 */
export const validatePassengerData = (pasajeros: any): { [key: string]: string } => {
  const errors: { [key: string]: string } = {};
  
  // Check if all passenger counts are non-negative numbers
  const fields = ['nacional', 'internacional', 'diplomaticos', 'enComision', 'infantes', 'transitos', 'conexiones', 'otrosExentos'];
  
  for (const field of fields) {
    const value = pasajeros[field];
    if (value !== undefined && (isNaN(value) || value < 0)) {
      errors[`pasajeros.${field}`] = `${field} debe ser un número no negativo`;
    }
  }
  
  // Validate total calculation
  const calculatedTotal = fields.reduce((sum, field) => sum + (pasajeros[field] || 0), 0);
  if (pasajeros.total !== undefined && pasajeros.total !== calculatedTotal) {
    errors['pasajeros.total'] = 'El total de pasajeros no coincide con la suma de las categorías';
  }
  
  return errors;
};

/**
 * Validate cargo data
 */
export const validateCargoData = (carga: any): { [key: string]: string } => {
  const errors: { [key: string]: string } = {};
  
  // Check if all cargo weights are non-negative numbers
  const fields = ['equipaje', 'carga', 'correo'];
  
  for (const field of fields) {
    const value = carga[field];
    if (value !== undefined && (isNaN(value) || value < 0)) {
      errors[`carga.${field}`] = `${field} debe ser un número no negativo`;
    }
  }
  
  // Validate total calculation
  const calculatedTotal = fields.reduce((sum, field) => sum + (carga[field] || 0), 0);
  if (carga.total !== undefined && carga.total !== calculatedTotal) {
    errors['carga.total'] = 'El total de carga no coincide con la suma de las categorías';
  }
  
  return errors;
};

/**
 * Check if manifiesto data is complete (all required fields filled)
 */
export const isManifiestoComplete = (
  data: Partial<ManifiestoData>,
  rules: ValidationRule[] = VALIDATION_RULES
): boolean => {
  const errors = validateManifiestoData(data, rules);
  return Object.keys(errors).length === 0;
};

/**
 * Get list of missing required fields
 */
export const getMissingRequiredFields = (
  data: Partial<ManifiestoData>,
  rules: ValidationRule[] = VALIDATION_RULES
): string[] => {
  const missing: string[] = [];
  
  for (const rule of rules) {
    const fieldValue = data[rule.field];
    if (rule.required && (!fieldValue || fieldValue.toString().trim() === '')) {
      missing.push(rule.field);
    }
  }
  
  return missing;
};

/**
 * Sanitize input value for a specific field
 */
export const sanitizeFieldValue = (field: keyof ManifiestoData, value: string): string => {
  switch (field) {
    case 'numeroVuelo':
      return value.toUpperCase().replace(/\s+/g, '');
    case 'matricula':
      return value.toUpperCase().replace(/\s+/g, '');
    case 'origenVuelo':
    case 'destinoVuelo':
      return value.toUpperCase().trim();
    case 'transportista':
      return value.trim();
    default:
      return value.trim();
  }
};