/**
 * Debounced Validation Hook
 * Provides debounced validation for form fields to improve performance
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ManifiestoData, ValidationRule } from '../types/manifiesto';
import { validateField, validateManifiestoData } from '../utils/manifiesto/validation';

interface DebouncedValidationOptions {
  debounceMs?: number;
  validateOnMount?: boolean;
  validateOnChange?: boolean;
  immediate?: boolean;
}

interface ValidationState {
  isValidating: boolean;
  errors: { [key: string]: string };
  isValid: boolean;
  hasValidated: boolean;
}

interface DebouncedValidationResult extends ValidationState {
  validateField: (field: keyof ManifiestoData, value: any) => void;
  validateAll: () => void;
  clearErrors: () => void;
  clearFieldError: (field: keyof ManifiestoData) => void;
  debouncedValidateField: (field: keyof ManifiestoData, value: any) => void;
}

/**
 * Hook for debounced field validation
 */
export const useDebouncedValidation = (
  data: Partial<ManifiestoData>,
  validationRules: ValidationRule[],
  options: DebouncedValidationOptions = {}
): DebouncedValidationResult => {
  const {
    debounceMs = 300,
    validateOnMount = false,
    validateOnChange = true,
    immediate = false,
  } = options;

  const [state, setState] = useState<ValidationState>({
    isValidating: false,
    errors: {},
    isValid: true,
    hasValidated: false,
  });

  const debounceTimers = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const validationQueue = useRef<Set<string>>(new Set());

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(clearTimeout);
    };
  }, []);

  // Validate single field immediately
  const validateFieldImmediate = useCallback((field: keyof ManifiestoData, value: any) => {
    const rule = validationRules.find(r => r.field === field);
    if (!rule) return;

    const error = validateField(field, value, rule);
    
    setState(prev => ({
      ...prev,
      errors: {
        ...prev.errors,
        [field]: error || '',
      },
      hasValidated: true,
    }));

    return !error;
  }, [validationRules]);

  // Debounced field validation
  const debouncedValidateField = useCallback((field: keyof ManifiestoData, value: any) => {
    // Clear existing timer for this field
    if (debounceTimers.current[field]) {
      clearTimeout(debounceTimers.current[field]);
    }

    // Add to validation queue
    validationQueue.current.add(field);

    // Set validation state
    setState(prev => ({
      ...prev,
      isValidating: true,
    }));

    // Create new debounced timer
    debounceTimers.current[field] = setTimeout(() => {
      validateFieldImmediate(field, value);
      validationQueue.current.delete(field);

      // Update validation state if queue is empty
      if (validationQueue.current.size === 0) {
        setState(prev => ({
          ...prev,
          isValidating: false,
        }));
      }
    }, debounceMs);
  }, [debounceMs, validateFieldImmediate]);

  // Validate field (immediate or debounced based on options)
  const validateFieldWrapper = useCallback((field: keyof ManifiestoData, value: any) => {
    if (immediate) {
      return validateFieldImmediate(field, value);
    } else {
      debouncedValidateField(field, value);
    }
  }, [immediate, validateFieldImmediate, debouncedValidateField]);

  // Validate all fields
  const validateAll = useCallback(() => {
    setState(prev => ({ ...prev, isValidating: true }));

    // Clear all pending timers
    Object.values(debounceTimers.current).forEach(clearTimeout);
    debounceTimers.current = {};
    validationQueue.current.clear();

    // Validate all data
    const errors = validateManifiestoData(data, validationRules);
    const isValid = Object.keys(errors).length === 0;

    setState({
      isValidating: false,
      errors,
      isValid,
      hasValidated: true,
    });

    return isValid;
  }, [data, validationRules]);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setState(prev => ({
      ...prev,
      errors: {},
      isValid: true,
    }));
  }, []);

  // Clear specific field error
  const clearFieldError = useCallback((field: keyof ManifiestoData) => {
    setState(prev => ({
      ...prev,
      errors: {
        ...prev.errors,
        [field]: '',
      },
    }));
  }, []);

  // Auto-validate on data changes
  useEffect(() => {
    if (!validateOnChange || !state.hasValidated) return;

    const timer = setTimeout(() => {
      validateAll();
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [data, validateOnChange, validateAll, debounceMs, state.hasValidated]);

  // Validate on mount if requested
  useEffect(() => {
    if (validateOnMount) {
      validateAll();
    }
  }, [validateOnMount, validateAll]);

  // Update isValid state when errors change
  useEffect(() => {
    const hasErrors = Object.values(state.errors).some(error => error && error.length > 0);
    setState(prev => ({
      ...prev,
      isValid: !hasErrors,
    }));
  }, [state.errors]);

  return {
    ...state,
    validateField: validateFieldWrapper,
    validateAll,
    clearErrors,
    clearFieldError,
    debouncedValidateField,
  };
};

/**
 * Hook for debounced search/filter functionality
 */
export const useDebouncedSearch = <T>(
  searchTerm: string,
  searchFunction: (term: string) => T[] | Promise<T[]>,
  debounceMs: number = 300
) => {
  const [results, setResults] = useState<T[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setError(null);

    const timer = setTimeout(async () => {
      try {
        const searchResults = await searchFunction(searchTerm);
        setResults(searchResults);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchTerm, searchFunction, debounceMs]);

  return { results, isSearching, error };
};

/**
 * Hook for debounced value updates
 */
export const useDebouncedValue = <T>(value: T, delay: number = 300) => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook for debounced callback execution
 */
export const useDebouncedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): T => {
  const callbackRef = useRef(callback);
  const timerRef = useRef<NodeJS.Timeout>();

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const debouncedCallback = useCallback((...args: Parameters<T>) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }, [delay]) as T;

  return debouncedCallback;
};