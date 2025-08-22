/**
 * Tests for useErrorHandler hook
 */

import { renderHook, act } from '@testing-library/react-native';
import {
  useErrorHandler,
  useOperationErrorHandler,
  useImageErrorHandler,
  useOCRErrorHandler
} from '../useErrorHandler';
import { ErrorType } from '../../utils/manifiesto/errorHandler';

// Mock the error handler utilities
jest.mock('../../utils/manifiesto/errorHandler', () => ({
  ...jest.requireActual('../../utils/manifiesto/errorHandler'),
  handleError: jest.fn().mockResolvedValue(true),
  classifyError: jest.fn().mockReturnValue({
    id: 'test-error-id',
    type: 'UNKNOWN_ERROR',
    severity: 'medium',
    message: 'Test error',
    userMessage: 'Test user message',
    timestamp: new Date(),
    recoveryStrategy: 'retry',
    retryCount: 0,
    maxRetries: 2
  })
}));

describe('useErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('basic functionality', () => {
    it('should initialize with no error state', () => {
      const { result } = renderHook(() => useErrorHandler());
      const [state] = result.current;

      expect(state.error).toBeNull();
      expect(state.hasError).toBe(false);
      expect(state.isRecovering).toBe(false);
      expect(state.retryCount).toBe(0);
    });

    it('should report errors and update state', () => {
      const { result } = renderHook(() => useErrorHandler());
      const [, actions] = result.current;

      act(() => {
        actions.reportError(new Error('Test error'));
      });

      const [state] = result.current;
      expect(state.hasError).toBe(true);
      expect(state.error).toBeTruthy();
      expect(state.error?.message).toBe('Test error');
    });

    it('should report typed errors', () => {
      const { result } = renderHook(() => useErrorHandler());
      const [, actions] = result.current;

      act(() => {
        actions.reportTypedError(ErrorType.IMAGE_LOAD_FAILED, 'Custom message');
      });

      const [state] = result.current;
      expect(state.hasError).toBe(true);
      expect(state.error?.type).toBe(ErrorType.IMAGE_LOAD_FAILED);
    });

    it('should clear errors', () => {
      const { result } = renderHook(() => useErrorHandler());
      const [, actions] = result.current;

      // First report an error
      act(() => {
        actions.reportError(new Error('Test error'));
      });

      expect(result.current[0].hasError).toBe(true);

      // Then clear it
      act(() => {
        actions.clearError();
      });

      const [state] = result.current;
      expect(state.hasError).toBe(false);
      expect(state.error).toBeNull();
      expect(state.retryCount).toBe(0);
    });
  });

  describe('withErrorBoundary', () => {
    it('should catch and handle errors from wrapped operations', async () => {
      const { result } = renderHook(() => useErrorHandler());
      const [, actions] = result.current;

      const failingOperation = jest.fn().mockRejectedValue(new Error('Operation failed'));
      const wrappedOperation = actions.withErrorBoundary(failingOperation, 'test-operation');

      let operationResult;
      await act(async () => {
        operationResult = await wrappedOperation('arg1', 'arg2');
      });

      expect(failingOperation).toHaveBeenCalledWith('arg1', 'arg2');
      expect(operationResult).toBeNull();
      expect(result.current[0].hasError).toBe(true);
    });

    it('should return result when operation succeeds', async () => {
      const { result } = renderHook(() => useErrorHandler());
      const [, actions] = result.current;

      const successfulOperation = jest.fn().mockResolvedValue('success');
      const wrappedOperation = actions.withErrorBoundary(successfulOperation);

      let operationResult;
      await act(async () => {
        operationResult = await wrappedOperation();
      });

      expect(operationResult).toBe('success');
      expect(result.current[0].hasError).toBe(false);
    });

    it('should clear existing errors when operation succeeds', async () => {
      const { result } = renderHook(() => useErrorHandler());
      const [, actions] = result.current;

      // First report an error
      act(() => {
        actions.reportError(new Error('Previous error'));
      });

      expect(result.current[0].hasError).toBe(true);

      // Then run a successful operation
      const successfulOperation = jest.fn().mockResolvedValue('success');
      const wrappedOperation = actions.withErrorBoundary(successfulOperation);

      await act(async () => {
        await wrappedOperation();
      });

      expect(result.current[0].hasError).toBe(false);
    });
  });

  describe('retry functionality', () => {
    it('should retry last operation', async () => {
      const { result } = renderHook(() => useErrorHandler());
      const [, actions] = result.current;

      let callCount = 0;
      const retryableOperation = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error('First attempt failed');
        }
        return 'success';
      });

      const wrappedOperation = actions.withErrorBoundary(retryableOperation);

      // First call should fail
      await act(async () => {
        await wrappedOperation('test-arg');
      });

      expect(result.current[0].hasError).toBe(true);
      expect(callCount).toBe(1);

      // Retry should succeed
      await act(async () => {
        await actions.retry();
      });

      expect(result.current[0].hasError).toBe(false);
      expect(callCount).toBe(2);
      expect(retryableOperation).toHaveBeenCalledWith('test-arg');
    });

    it('should handle retry failures', async () => {
      const { result } = renderHook(() => useErrorHandler());
      const [, actions] = result.current;

      const alwaysFailingOperation = jest.fn().mockRejectedValue(new Error('Always fails'));
      const wrappedOperation = actions.withErrorBoundary(alwaysFailingOperation);

      // First call should fail
      await act(async () => {
        await wrappedOperation();
      });

      expect(result.current[0].hasError).toBe(true);

      // Retry should also fail
      await act(async () => {
        await actions.retry();
      });

      expect(result.current[0].hasError).toBe(true);
      expect(alwaysFailingOperation).toHaveBeenCalledTimes(2);
    });

    it('should not retry if no previous operation', async () => {
      const { result } = renderHook(() => useErrorHandler());
      const [, actions] = result.current;

      await act(async () => {
        await actions.retry();
      });

      // Should not change state
      expect(result.current[0].hasError).toBe(false);
    });
  });

  describe('options and callbacks', () => {
    it('should call onError callback when error occurs', () => {
      const onError = jest.fn();
      const { result } = renderHook(() => useErrorHandler({ onError }));
      const [, actions] = result.current;

      act(() => {
        actions.reportError(new Error('Test error'));
      });

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test error'
        })
      );
    });

    it('should call onRecovery callback when recovery succeeds', async () => {
      const onRecovery = jest.fn();
      const { result } = renderHook(() => useErrorHandler({ onRecovery }));
      const [, actions] = result.current;

      let callCount = 0;
      const retryableOperation = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error('First attempt failed');
        }
        return 'success';
      });

      const wrappedOperation = actions.withErrorBoundary(retryableOperation);

      // First call should fail
      await act(async () => {
        await wrappedOperation();
      });

      // Retry should succeed and call onRecovery
      await act(async () => {
        await actions.retry();
      });

      expect(onRecovery).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'First attempt failed'
        })
      );
    });

    it('should include component name in error context', () => {
      const { result } = renderHook(() => 
        useErrorHandler({ component: 'TestComponent' })
      );
      const [, actions] = result.current;

      act(() => {
        actions.reportError(new Error('Test error'));
      });

      const [state] = result.current;
      expect(state.error?.context?.component).toBe('TestComponent');
    });
  });
});

describe('useOperationErrorHandler', () => {
  it('should provide executeWithErrorHandling method', () => {
    const { result } = renderHook(() => 
      useOperationErrorHandler('test-operation')
    );

    expect(result.current.executeWithErrorHandling).toBeDefined();
    expect(typeof result.current.executeWithErrorHandling).toBe('function');
  });

  it('should execute operations with error handling', async () => {
    const { result } = renderHook(() => 
      useOperationErrorHandler('test-operation')
    );

    const operation = jest.fn().mockResolvedValue('success');

    let operationResult;
    await act(async () => {
      operationResult = await result.current.executeWithErrorHandling(operation);
    });

    expect(operation).toHaveBeenCalled();
    expect(operationResult).toBe('success');
  });

  it('should handle operation failures', async () => {
    const { result } = renderHook(() => 
      useOperationErrorHandler('test-operation')
    );

    const operation = jest.fn().mockRejectedValue(new Error('Operation failed'));

    let operationResult;
    await act(async () => {
      operationResult = await result.current.executeWithErrorHandling(operation);
    });

    expect(operationResult).toBeNull();
    expect(result.current.hasError).toBe(true);
  });
});

describe('specialized error handlers', () => {
  it('should create image error handler with correct component', () => {
    const { result } = renderHook(() => useImageErrorHandler());

    act(() => {
      result.current.reportError(new Error('Image error'));
    });

    expect(result.current.error?.context?.component).toBe('ImageUploader');
  });

  it('should create OCR error handler with correct component', () => {
    const { result } = renderHook(() => useOCRErrorHandler());

    act(() => {
      result.current.reportError(new Error('OCR error'));
    });

    expect(result.current.error?.context?.component).toBe('OCRProcessor');
  });

  it('should provide all standard error handler functionality', () => {
    const { result } = renderHook(() => useImageErrorHandler());

    expect(result.current.clearError).toBeDefined();
    expect(result.current.reportError).toBeDefined();
    expect(result.current.reportTypedError).toBeDefined();
    expect(result.current.retry).toBeDefined();
    expect(result.current.withErrorBoundary).toBeDefined();
    expect(result.current.executeWithErrorHandling).toBeDefined();
  });
});