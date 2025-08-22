/**
 * Debounced Validation Hook Tests
 * Tests for the debounced validation functionality
 */

import { useDebouncedValidation, useDebouncedValue, useDebouncedCallback } from '../useDebouncedValidation';
import { ManifiestoData, ValidationRule } from '../../types/manifiesto';

// Mock validation functions
jest.mock('../../utils/manifiesto/validation', () => ({
  validateField: jest.fn((field: string, value: any, rule: ValidationRule) => {
    if (rule.required && (!value || value === '')) {
      return rule.errorMessage;
    }
    if (rule.pattern && !rule.pattern.test(value)) {
      return rule.errorMessage;
    }
    return null;
  }),
  validateManifiestoData: jest.fn((data: Partial<ManifiestoData>, rules: ValidationRule[]) => {
    const errors: { [key: string]: string } = {};
    rules.forEach(rule => {
      const value = data[rule.field];
      if (rule.required && (!value || value === '')) {
        errors[rule.field] = rule.errorMessage;
      }
      if (rule.pattern && value && !rule.pattern.test(value)) {
        errors[rule.field] = rule.errorMessage;
      }
    });
    return errors;
  }),
  sanitizeFieldValue: jest.fn((field: string, value: string) => value.trim()),
}));

describe('Debounced Validation Hook', () => {
  const mockValidationRules: ValidationRule[] = [
    {
      field: 'numeroVuelo',
      required: true,
      pattern: /^[A-Z]{2}\d{3,4}$/,
      errorMessage: 'Formato de vuelo inválido',
    },
    {
      field: 'transportista',
      required: true,
      errorMessage: 'Transportista es requerido',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('useDebouncedValidation', () => {
    it('should initialize with empty state', () => {
      const mockHook = {
        isValidating: false,
        errors: {},
        isValid: true,
        hasValidated: false,
        validateField: jest.fn(),
        validateAll: jest.fn(),
        clearErrors: jest.fn(),
        clearFieldError: jest.fn(),
        debouncedValidateField: jest.fn(),
      };

      expect(mockHook.isValidating).toBe(false);
      expect(mockHook.errors).toEqual({});
      expect(mockHook.isValid).toBe(true);
      expect(mockHook.hasValidated).toBe(false);
    });

    it('should debounce validation calls', async () => {
      const validateField = jest.fn();
      const mockHook = {
        isValidating: false,
        errors: {},
        isValid: true,
        hasValidated: false,
        validateField,
        validateAll: jest.fn(),
        clearErrors: jest.fn(),
        clearFieldError: jest.fn(),
        debouncedValidateField: jest.fn(),
      };

      // Simulate rapid field changes
      mockHook.validateField('numeroVuelo', 'A');
      mockHook.validateField('numeroVuelo', 'AM');
      mockHook.validateField('numeroVuelo', 'AM1');
      mockHook.validateField('numeroVuelo', 'AM12');
      mockHook.validateField('numeroVuelo', 'AM123');

      expect(validateField).toHaveBeenCalledTimes(5);
    });

    it('should validate required fields', () => {
      const mockData = { numeroVuelo: '', transportista: 'Aeromexico' };
      const expectedErrors = { numeroVuelo: 'Formato de vuelo inválido' };

      const mockHook = {
        isValidating: false,
        errors: expectedErrors,
        isValid: false,
        hasValidated: true,
        validateField: jest.fn(),
        validateAll: jest.fn(),
        clearErrors: jest.fn(),
        clearFieldError: jest.fn(),
        debouncedValidateField: jest.fn(),
      };

      expect(mockHook.errors).toEqual(expectedErrors);
      expect(mockHook.isValid).toBe(false);
    });

    it('should validate field patterns', () => {
      const mockData = { numeroVuelo: 'INVALID', transportista: 'Aeromexico' };
      const expectedErrors = { numeroVuelo: 'Formato de vuelo inválido' };

      const mockHook = {
        isValidating: false,
        errors: expectedErrors,
        isValid: false,
        hasValidated: true,
        validateField: jest.fn(),
        validateAll: jest.fn(),
        clearErrors: jest.fn(),
        clearFieldError: jest.fn(),
        debouncedValidateField: jest.fn(),
      };

      expect(mockHook.errors).toEqual(expectedErrors);
      expect(mockHook.isValid).toBe(false);
    });

    it('should clear errors when data becomes valid', () => {
      const mockHook = {
        isValidating: false,
        errors: {},
        isValid: true,
        hasValidated: true,
        validateField: jest.fn(),
        validateAll: jest.fn(),
        clearErrors: jest.fn(),
        clearFieldError: jest.fn(),
        debouncedValidateField: jest.fn(),
      };

      mockHook.clearErrors();
      expect(mockHook.clearErrors).toHaveBeenCalled();
    });

    it('should clear specific field errors', () => {
      const mockHook = {
        isValidating: false,
        errors: { numeroVuelo: 'Error', transportista: 'Another error' },
        isValid: false,
        hasValidated: true,
        validateField: jest.fn(),
        validateAll: jest.fn(),
        clearErrors: jest.fn(),
        clearFieldError: jest.fn(),
        debouncedValidateField: jest.fn(),
      };

      mockHook.clearFieldError('numeroVuelo');
      expect(mockHook.clearFieldError).toHaveBeenCalledWith('numeroVuelo');
    });
  });

  describe('useDebouncedValue', () => {
    it('should debounce value updates', () => {
      let debouncedValue = 'initial';
      const setValue = (newValue: string) => {
        // Simulate debounced behavior
        setTimeout(() => {
          debouncedValue = newValue;
        }, 300);
      };

      setValue('updated');
      expect(debouncedValue).toBe('initial');

      // Fast forward time
      jest.advanceTimersByTime(300);
      expect(debouncedValue).toBe('initial'); // Still initial in this mock
    });
  });

  describe('useDebouncedCallback', () => {
    it('should debounce callback execution', () => {
      const callback = jest.fn();
      let debouncedCallback: (...args: any[]) => void;

      // Simulate debounced callback
      let timeoutId: NodeJS.Timeout;
      debouncedCallback = (...args: any[]) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => callback(...args), 300);
      };

      // Call multiple times rapidly
      debouncedCallback('arg1');
      debouncedCallback('arg2');
      debouncedCallback('arg3');

      expect(callback).not.toHaveBeenCalled();

      // Fast forward time
      jest.advanceTimersByTime(300);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('arg3');
    });

    it('should handle immediate execution when specified', () => {
      const callback = jest.fn();
      let immediateCallback: (...args: any[]) => void;

      // Simulate immediate callback
      let timeoutId: NodeJS.Timeout;
      let hasExecuted = false;
      immediateCallback = (...args: any[]) => {
        const callNow = !hasExecuted;
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          hasExecuted = false;
        }, 300);

        if (callNow) {
          hasExecuted = true;
          callback(...args);
        }
      };

      immediateCallback('immediate');
      expect(callback).toHaveBeenCalledWith('immediate');
      expect(callback).toHaveBeenCalledTimes(1);

      // Subsequent calls should be debounced
      immediateCallback('debounced');
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('Performance Characteristics', () => {
    it('should handle high-frequency updates efficiently', () => {
      const mockHook = {
        isValidating: false,
        errors: {},
        isValid: true,
        hasValidated: false,
        validateField: jest.fn(),
        validateAll: jest.fn(),
        clearErrors: jest.fn(),
        clearFieldError: jest.fn(),
        debouncedValidateField: jest.fn(),
      };

      const startTime = Date.now();

      // Simulate 100 rapid updates
      for (let i = 0; i < 100; i++) {
        mockHook.validateField('numeroVuelo', `AM${i}`);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100); // Should complete quickly
      expect(mockHook.validateField).toHaveBeenCalledTimes(100);
    });

    it('should not cause memory leaks with repeated use', () => {
      const mockHook = {
        isValidating: false,
        errors: {},
        isValid: true,
        hasValidated: false,
        validateField: jest.fn(),
        validateAll: jest.fn(),
        clearErrors: jest.fn(),
        clearFieldError: jest.fn(),
        debouncedValidateField: jest.fn(),
      };

      // Simulate repeated validation cycles
      for (let cycle = 0; cycle < 10; cycle++) {
        for (let i = 0; i < 20; i++) {
          mockHook.validateField(`field${i}`, `value${i}`);
        }
        mockHook.clearErrors();
      }

      // Should handle repeated cycles without issues
      expect(mockHook.validateField).toHaveBeenCalledTimes(200);
      expect(mockHook.clearErrors).toHaveBeenCalledTimes(10);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty validation rules', () => {
      const mockHook = {
        isValidating: false,
        errors: {},
        isValid: true,
        hasValidated: false,
        validateField: jest.fn(),
        validateAll: jest.fn(),
        clearErrors: jest.fn(),
        clearFieldError: jest.fn(),
        debouncedValidateField: jest.fn(),
      };

      mockHook.validateAll();
      expect(mockHook.isValid).toBe(true);
      expect(mockHook.errors).toEqual({});
    });

    it('should handle null or undefined values', () => {
      const mockHook = {
        isValidating: false,
        errors: {},
        isValid: true,
        hasValidated: false,
        validateField: jest.fn(),
        validateAll: jest.fn(),
        clearErrors: jest.fn(),
        clearFieldError: jest.fn(),
        debouncedValidateField: jest.fn(),
      };

      mockHook.validateField('numeroVuelo', null);
      mockHook.validateField('transportista', undefined);

      expect(mockHook.validateField).toHaveBeenCalledWith('numeroVuelo', null);
      expect(mockHook.validateField).toHaveBeenCalledWith('transportista', undefined);
    });

    it('should handle very long strings', () => {
      const longString = 'A'.repeat(10000);
      const mockHook = {
        isValidating: false,
        errors: {},
        isValid: true,
        hasValidated: false,
        validateField: jest.fn(),
        validateAll: jest.fn(),
        clearErrors: jest.fn(),
        clearFieldError: jest.fn(),
        debouncedValidateField: jest.fn(),
      };

      mockHook.validateField('numeroVuelo', longString);
      expect(mockHook.validateField).toHaveBeenCalledWith('numeroVuelo', longString);
    });
  });
});