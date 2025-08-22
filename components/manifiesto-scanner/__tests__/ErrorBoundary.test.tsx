/**
 * Tests for ErrorBoundary component
 */

// Mock __DEV__ for tests
(global as any).__DEV__ = false;

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import { ErrorBoundary, withErrorBoundary, ErrorFallback } from '../ErrorBoundary';
import { ErrorType, createManifiestoError } from '../../../utils/manifiesto/errorHandler';

// Mock the error handler utilities
jest.mock('../../../utils/manifiesto/errorHandler', () => ({
  ...jest.requireActual('../../../utils/manifiesto/errorHandler'),
  errorLogger: {
    log: jest.fn()
  }
}));

// Component that throws an error for testing
const ThrowError: React.FC<{ shouldThrow?: boolean; message?: string }> = ({ 
  shouldThrow = true, 
  message = 'Test error' 
}) => {
  if (shouldThrow) {
    throw new Error(message);
  }
  return <Text>No error</Text>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.error for these tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('error catching', () => {
    it('should render children when no error occurs', () => {
      const { getByText } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(getByText('No error')).toBeTruthy();
    });

    it('should catch errors and show error UI', () => {
      const { getByText } = render(
        <ErrorBoundary>
          <ThrowError message="Component crashed" />
        </ErrorBoundary>
      );

      expect(getByText('¡Oops! Algo salió mal')).toBeTruthy();
      expect(getByText('Error del sistema. Intenta recargar la aplicación.')).toBeTruthy();
    });

    it('should call onError callback when error occurs', () => {
      const onError = jest.fn();
      
      render(
        <ErrorBoundary onError={onError}>
          <ThrowError message="Test error" />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'SYSTEM_ERROR',
          message: 'Test error'
        }),
        expect.objectContaining({
          componentStack: expect.any(String)
        })
      );
    });

    it('should include component name in error context', () => {
      const onError = jest.fn();
      
      render(
        <ErrorBoundary component="TestComponent" onError={onError}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            component: 'TestComponent'
          })
        }),
        expect.any(Object)
      );
    });
  });

  describe('error recovery', () => {
    it('should allow retry and reset error state', () => {
      let shouldThrow = true;
      const TestComponent = () => <ThrowError shouldThrow={shouldThrow} />;

      const { getByText, rerender } = render(
        <ErrorBoundary>
          <TestComponent />
        </ErrorBoundary>
      );

      // Should show error UI
      expect(getByText('¡Oops! Algo salió mal')).toBeTruthy();

      // Change the component to not throw
      shouldThrow = false;

      // Click retry button
      fireEvent.press(getByText('Intentar de nuevo'));

      // Re-render with updated component
      rerender(
        <ErrorBoundary>
          <TestComponent />
        </ErrorBoundary>
      );

      // Should show the component content
      expect(getByText('No error')).toBeTruthy();
    });

    it('should show report error button', () => {
      const { getByText } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(getByText('Reportar error')).toBeTruthy();
    });
  });

  describe('custom fallback', () => {
    it('should use custom fallback when provided', () => {
      const customFallback = (error: any, retry: () => void) => (
        <View>
          <Text>Custom error UI</Text>
          <Text>Error: {error.message}</Text>
        </View>
      );

      const { getByText } = render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError message="Custom error" />
        </ErrorBoundary>
      );

      expect(getByText('Custom error UI')).toBeTruthy();
      expect(getByText('Error: Custom error')).toBeTruthy();
    });

    it('should pass retry function to custom fallback', () => {
      let retryFunction: (() => void) | null = null;
      
      const customFallback = (error: any, retry: () => void) => {
        retryFunction = retry;
        return <Text>Custom fallback</Text>;
      };

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(retryFunction).toBeDefined();
      expect(typeof retryFunction).toBe('function');
    });
  });

  describe('debug information', () => {
    it('should show debug info in development mode', () => {
      // Mock __DEV__ to be true
      (global as any).__DEV__ = true;

      const { getByText } = render(
        <ErrorBoundary component="TestComponent">
          <ThrowError message="Debug error" />
        </ErrorBoundary>
      );

      expect(getByText('Información de depuración:')).toBeTruthy();
      expect(getByText('Tipo: SYSTEM_ERROR')).toBeTruthy();
      expect(getByText('Mensaje: Debug error')).toBeTruthy();
      expect(getByText('Componente: TestComponent')).toBeTruthy();
    });

    it('should not show debug info in production mode', () => {
      // Mock __DEV__ to be false
      (global as any).__DEV__ = false;

      const { queryByText } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(queryByText('Información de depuración:')).toBeNull();
    });
  });
});

describe('withErrorBoundary HOC', () => {
  it('should wrap component with error boundary', () => {
    const TestComponent = () => <Text>Test Component</Text>;
    const WrappedComponent = withErrorBoundary(TestComponent);

    const { getByText } = render(<WrappedComponent />);

    expect(getByText('Test Component')).toBeTruthy();
  });

  it('should catch errors in wrapped component', () => {
    const WrappedComponent = withErrorBoundary(ThrowError);

    const { getByText } = render(<WrappedComponent />);

    expect(getByText('¡Oops! Algo salió mal')).toBeTruthy();
  });

  it('should pass error boundary props', () => {
    const onError = jest.fn();
    const WrappedComponent = withErrorBoundary(ThrowError, { 
      component: 'WrappedTest',
      onError 
    });

    render(<WrappedComponent />);

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        context: expect.objectContaining({
          component: 'WrappedTest'
        })
      }),
      expect.any(Object)
    );
  });

  it('should set correct display name', () => {
    const TestComponent = () => <Text>Test</Text>;
    TestComponent.displayName = 'TestComponent';
    
    const WrappedComponent = withErrorBoundary(TestComponent);

    expect(WrappedComponent.displayName).toBe('withErrorBoundary(TestComponent)');
  });

  it('should handle components without display name', () => {
    const TestComponent = () => <Text>Test</Text>;
    const WrappedComponent = withErrorBoundary(TestComponent);

    expect(WrappedComponent.displayName).toBe('withErrorBoundary(TestComponent)');
  });
});

describe('ErrorFallback', () => {
  const mockError = createManifiestoError(
    ErrorType.IMAGE_LOAD_FAILED,
    'Test error message'
  );

  it('should render error information', () => {
    const retry = jest.fn();
    const { getByText } = render(
      <ErrorFallback error={mockError} retry={retry} />
    );

    expect(getByText('Error')).toBeTruthy();
    expect(getByText(mockError.userMessage)).toBeTruthy();
    expect(getByText('Reintentar')).toBeTruthy();
  });

  it('should call retry function when button is pressed', () => {
    const retry = jest.fn();
    const { getByText } = render(
      <ErrorFallback error={mockError} retry={retry} />
    );

    fireEvent.press(getByText('Reintentar'));

    expect(retry).toHaveBeenCalled();
  });

  it('should show appropriate icon for error type', () => {
    const imageError = createManifiestoError(ErrorType.IMAGE_LOAD_FAILED, 'Image error');
    const ocrError = createManifiestoError(ErrorType.OCR_PROCESSING_FAILED, 'OCR error');
    const storageError = createManifiestoError(ErrorType.STORAGE_QUOTA_EXCEEDED, 'Storage error');

    const { getByText: getByTextImage } = render(
      <ErrorFallback error={imageError} retry={() => {}} />
    );
    const { getByText: getByTextOCR } = render(
      <ErrorFallback error={ocrError} retry={() => {}} />
    );
    const { getByText: getByTextStorage } = render(
      <ErrorFallback error={storageError} retry={() => {}} />
    );

    expect(getByTextImage('🖼️')).toBeTruthy();
    expect(getByTextOCR('🔍')).toBeTruthy();
    expect(getByTextStorage('💾')).toBeTruthy();
  });

  it('should show technical details when showDetails is true and in dev mode', () => {
    (global as any).__DEV__ = true;
    
    const retry = jest.fn();
    const { getByText } = render(
      <ErrorFallback error={mockError} retry={retry} showDetails={true} />
    );

    expect(getByText('Detalles técnicos:')).toBeTruthy();
    expect(getByText(`Tipo: ${mockError.type}`)).toBeTruthy();
    expect(getByText(`ID: ${mockError.id}`)).toBeTruthy();
  });

  it('should not show technical details in production mode', () => {
    (global as any).__DEV__ = false;
    
    const retry = jest.fn();
    const { queryByText } = render(
      <ErrorFallback error={mockError} retry={retry} showDetails={true} />
    );

    expect(queryByText('Detalles técnicos:')).toBeNull();
  });
});