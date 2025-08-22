/**
 * React hook for error handling in Manifiesto Scanner components
 * Provides error state management and recovery actions
 */

import { useState, useCallback, useRef } from 'react';
import { 
  ManifiestoError, 
  ErrorType, 
  RecoveryStrategy,
  handleError,
  classifyError,
  createManifiestoError,
  withErrorHandling
} from '../utils/manifiesto/errorHandler';

export interface UseErrorHandlerOptions {
  component?: string;
  onError?: (error: ManifiestoError) => void;
  onRecovery?: (error: ManifiestoError) => void;
  autoRetry?: boolean;
  maxRetries?: number;
}

export interface ErrorHandlerState {
  error: ManifiestoError | null;
  isRecovering: boolean;
  hasError: boolean;
  retryCount: number;
}

export interface ErrorHandlerActions {
  clearError: () => void;
  reportError: (error: Error | string, context?: any) => void;
  reportTypedError: (type: ErrorType, message?: string, context?: any) => void;
  retry: () => Promise<void>;
  withErrorBoundary: <T extends any[], R>(
    operation: (...args: T) => Promise<R>,
    operationName?: string
  ) => (...args: T) => Promise<R | null>;
}

/**
 * Hook for handling errors in Manifiesto Scanner components
 */
export const useErrorHandler = (options: UseErrorHandlerOptions = {}): [
  ErrorHandlerState,
  ErrorHandlerActions
] => {
  const [state, setState] = useState<ErrorHandlerState>({
    error: null,
    isRecovering: false,
    hasError: false,
    retryCount: 0
  });

  const lastOperationRef = useRef<(() => Promise<void>) | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const clearError = useCallback(() => {
    setState({
      error: null,
      isRecovering: false,
      hasError: false,
      retryCount: 0
    });
    lastOperationRef.current = null;
  }, []);

  const reportError = useCallback((error: Error | string, context?: any) => {
    const manifiestoError = classifyError(error, {
      component: optionsRef.current.component,
      ...context
    });

    setState(prev => ({
      ...prev,
      error: manifiestoError,
      hasError: true,
      isRecovering: false
    }));

    optionsRef.current.onError?.(manifiestoError);

    // Handle the error with recovery strategies
    handleError(manifiestoError, {
      retry: async () => {
        if (lastOperationRef.current) {
          setState(prev => ({ ...prev, isRecovering: true }));
          try {
            await lastOperationRef.current();
            setState(prev => ({ 
              ...prev, 
              isRecovering: false,
              retryCount: prev.retryCount + 1 
            }));
            optionsRef.current.onRecovery?.(manifiestoError);
          } catch (retryError) {
            setState(prev => ({ ...prev, isRecovering: false }));
            throw retryError;
          }
        }
      }
    });
  }, []);

  const reportTypedError = useCallback((
    type: ErrorType, 
    message?: string, 
    context?: any
  ) => {
    const manifiestoError = createManifiestoError(type, message, {
      component: optionsRef.current.component,
      ...context
    });

    setState(prev => ({
      ...prev,
      error: manifiestoError,
      hasError: true,
      isRecovering: false
    }));

    optionsRef.current.onError?.(manifiestoError);

    handleError(manifiestoError);
  }, []);

  const retry = useCallback(async () => {
    if (!state.error || !lastOperationRef.current) {
      return;
    }

    setState(prev => ({ ...prev, isRecovering: true }));

    try {
      await lastOperationRef.current();
      setState(prev => ({ 
        ...prev, 
        isRecovering: false,
        error: null,
        hasError: false,
        retryCount: prev.retryCount + 1 
      }));
      optionsRef.current.onRecovery?.(state.error);
    } catch (error) {
      setState(prev => ({ ...prev, isRecovering: false }));
      reportError(error as Error, { operation: 'manual_retry' });
    }
  }, [state.error, reportError]);

  const withErrorBoundary = useCallback(<T extends any[], R>(
    operation: (...args: T) => Promise<R>,
    operationName?: string
  ) => {
    return async (...args: T): Promise<R | null> => {
      // Store the operation for potential retry
      lastOperationRef.current = () => operation(...args) as Promise<void>;

      try {
        const result = await operation(...args);
        
        // Clear error if operation succeeds
        if (state.hasError) {
          clearError();
        }
        
        return result;
      } catch (error) {
        reportError(error as Error, { 
          operation: operationName,
          arguments: args 
        });
        return null;
      }
    };
  }, [state.hasError, clearError, reportError]);

  return [
    state,
    {
      clearError,
      reportError,
      reportTypedError,
      retry,
      withErrorBoundary
    }
  ];
};

/**
 * Hook for handling specific operation errors with automatic retry
 */
export const useOperationErrorHandler = (
  operationName: string,
  options: UseErrorHandlerOptions = {}
) => {
  const [errorState, errorActions] = useErrorHandler({
    ...options,
    component: options.component || operationName
  });

  const executeWithErrorHandling = useCallback(async <T>(
    operation: () => Promise<T>,
    context?: any
  ): Promise<T | null> => {
    return errorActions.withErrorBoundary(operation, operationName)(context);
  }, [errorActions, operationName]);

  return {
    ...errorState,
    ...errorActions,
    executeWithErrorHandling
  };
};

/**
 * Hook for handling image processing errors specifically
 */
export const useImageErrorHandler = () => {
  return useOperationErrorHandler('image_processing', {
    component: 'ImageUploader'
  });
};

/**
 * Hook for handling OCR processing errors specifically
 */
export const useOCRErrorHandler = () => {
  return useOperationErrorHandler('ocr_processing', {
    component: 'OCRProcessor'
  });
};

/**
 * Hook for handling parsing errors specifically
 */
export const useParsingErrorHandler = () => {
  return useOperationErrorHandler('parsing', {
    component: 'ManifiestoParser'
  });
};

/**
 * Hook for handling storage errors specifically
 */
export const useStorageErrorHandler = () => {
  return useOperationErrorHandler('storage', {
    component: 'StorageManager'
  });
};

/**
 * Hook for handling validation errors specifically
 */
export const useValidationErrorHandler = () => {
  return useOperationErrorHandler('validation', {
    component: 'DataEditor'
  });
};

/**
 * Hook for handling export errors specifically
 */
export const useExportErrorHandler = () => {
  return useOperationErrorHandler('export', {
    component: 'ExportManager'
  });
};