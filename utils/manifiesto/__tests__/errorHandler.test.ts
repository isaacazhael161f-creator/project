/**
 * Tests for the error handling system
 */

// Mock __DEV__ for tests
(global as any).__DEV__ = false;

import {
  ErrorType,
  ErrorSeverity,
  RecoveryStrategy,
  createManifiestoError,
  classifyError,
  handleError,
  withErrorHandling,
  errorLogger,
  getErrorStatistics
} from '../errorHandler';

// Mock the notification store
jest.mock('../../../stores/notificationStore', () => ({
  useNotificationStore: {
    getState: () => ({
      addNotification: jest.fn()
    })
  }
}));

describe('Error Handler', () => {
  beforeEach(() => {
    errorLogger.clearLogs();
    jest.clearAllMocks();
  });

  describe('createManifiestoError', () => {
    it('should create a structured error with all required fields', () => {
      const error = createManifiestoError(
        ErrorType.IMAGE_LOAD_FAILED,
        'Test error message',
        { component: 'TestComponent' }
      );

      expect(error).toMatchObject({
        type: ErrorType.IMAGE_LOAD_FAILED,
        severity: ErrorSeverity.MEDIUM,
        message: 'Test error message',
        userMessage: 'No se pudo cargar la imagen. Verifica que el archivo sea válido.',
        context: { component: 'TestComponent' },
        recoveryStrategy: RecoveryStrategy.USER_ACTION,
        retryCount: 0,
        maxRetries: 2
      });

      expect(error.id).toBeDefined();
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('should handle Error objects as original error', () => {
      const originalError = new Error('Original error');
      const error = createManifiestoError(
        ErrorType.OCR_PROCESSING_FAILED,
        originalError
      );

      expect(error.message).toBe('Original error');
      expect(error.originalError).toBe(originalError);
    });

    it('should handle string messages', () => {
      const error = createManifiestoError(
        ErrorType.PARSING_FAILED,
        'String error message'
      );

      expect(error.message).toBe('String error message');
      expect(error.originalError).toBeUndefined();
    });
  });

  describe('classifyError', () => {
    it('should classify image loading errors', () => {
      const error = new Error('Failed to load image');
      const classified = classifyError(error);

      expect(classified.type).toBe(ErrorType.IMAGE_LOAD_FAILED);
      expect(classified.severity).toBe(ErrorSeverity.MEDIUM);
    });

    it('should classify OCR timeout errors', () => {
      const error = new Error('Tesseract timeout occurred');
      const classified = classifyError(error);

      expect(classified.type).toBe(ErrorType.OCR_PROCESSING_TIMEOUT);
    });

    it('should classify storage quota errors', () => {
      const error = new Error('QuotaExceededError: storage quota exceeded');
      const classified = classifyError(error);

      expect(classified.type).toBe(ErrorType.STORAGE_QUOTA_EXCEEDED);
    });

    it('should classify network errors', () => {
      const error = new Error('Network connection failed');
      const classified = classifyError(error);

      expect(classified.type).toBe(ErrorType.NETWORK_ERROR);
    });

    it('should default to unknown error for unrecognized errors', () => {
      const error = new Error('Some random error');
      const classified = classifyError(error);

      expect(classified.type).toBe(ErrorType.UNKNOWN_ERROR);
      expect(classified.severity).toBe(ErrorSeverity.MEDIUM);
    });

    it('should handle string errors', () => {
      const classified = classifyError('String error message');

      expect(classified.type).toBe(ErrorType.UNKNOWN_ERROR);
      expect(classified.message).toBe('String error message');
    });

    it('should include context in classified error', () => {
      const error = new Error('Test error');
      const context = { component: 'TestComponent', operation: 'test' };
      const classified = classifyError(error, context);

      expect(classified.context).toEqual(context);
    });
  });

  describe('handleError', () => {
    it('should log errors to errorLogger', async () => {
      const error = createManifiestoError(ErrorType.IMAGE_LOAD_FAILED, 'Test error');
      
      await handleError(error);

      const logs = errorLogger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0]).toEqual(error);
    });

    it('should execute retry strategy when available', async () => {
      const error = createManifiestoError(ErrorType.OCR_PROCESSING_FAILED, 'Test error');
      const retryAction = jest.fn().mockResolvedValue(undefined);

      const result = await handleError(error, { retry: retryAction });

      expect(retryAction).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should execute fallback strategy when available', async () => {
      const error = createManifiestoError(ErrorType.IMAGE_TOO_LARGE, 'Test error');
      const fallbackAction = jest.fn().mockResolvedValue(undefined);

      const result = await handleError(error, { fallback: fallbackAction });

      expect(fallbackAction).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should not retry beyond max retries', async () => {
      const error = createManifiestoError(ErrorType.OCR_PROCESSING_FAILED, 'Test error');
      error.retryCount = 2; // Already at max retries
      const retryAction = jest.fn().mockResolvedValue(undefined);

      const result = await handleError(error, { retry: retryAction });

      expect(retryAction).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('should return false for user action strategy', async () => {
      const error = createManifiestoError(ErrorType.IMAGE_FORMAT_UNSUPPORTED, 'Test error');

      const result = await handleError(error);

      expect(result).toBe(false);
    });

    it('should handle recovery action failures', async () => {
      const error = createManifiestoError(ErrorType.OCR_PROCESSING_FAILED, 'Test error');
      const retryAction = jest.fn().mockRejectedValue(new Error('Recovery failed'));

      const result = await handleError(error, { retry: retryAction });

      expect(retryAction).toHaveBeenCalled();
      expect(result).toBe(false);
      
      // Should log the recovery error
      const logs = errorLogger.getLogs();
      expect(logs.length).toBeGreaterThan(1);
    });
  });

  describe('withErrorHandling', () => {
    it('should wrap function and handle errors', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('Test error'));
      const wrappedOperation = withErrorHandling(
        mockOperation,
        { component: 'TestComponent' }
      );

      const result = await wrappedOperation('arg1', 'arg2');

      expect(mockOperation).toHaveBeenCalledWith('arg1', 'arg2');
      expect(result).toBeNull();
      
      // Should log the error
      const logs = errorLogger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].context?.component).toBe('TestComponent');
    });

    it('should return result when operation succeeds', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success');
      const wrappedOperation = withErrorHandling(
        mockOperation,
        { component: 'TestComponent' }
      );

      const result = await wrappedOperation('arg1');

      expect(result).toBe('success');
      expect(errorLogger.getLogs()).toHaveLength(0);
    });

    it('should retry operation when recovery strategy is retry', async () => {
      let callCount = 0;
      const mockOperation = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error('OCR processing failed');
        }
        return 'success';
      });

      const retryAction = jest.fn().mockResolvedValue(undefined);
      const wrappedOperation = withErrorHandling(
        mockOperation,
        { component: 'TestComponent' },
        { retry: retryAction }
      );

      const result = await wrappedOperation();

      expect(mockOperation).toHaveBeenCalledTimes(2);
      expect(retryAction).toHaveBeenCalled();
      expect(result).toBe('success');
    });

    it('should throw ManifiestoError when recovery fails', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('Test error'));
      const wrappedOperation = withErrorHandling(
        mockOperation,
        { component: 'TestComponent' }
      );

      await expect(wrappedOperation()).rejects.toMatchObject({
        type: ErrorType.UNKNOWN_ERROR,
        message: 'Test error'
      });
    });
  });

  describe('errorLogger', () => {
    it('should log errors and maintain order', () => {
      const error1 = createManifiestoError(ErrorType.IMAGE_LOAD_FAILED, 'Error 1');
      const error2 = createManifiestoError(ErrorType.OCR_PROCESSING_FAILED, 'Error 2');

      errorLogger.log(error1);
      errorLogger.log(error2);

      const logs = errorLogger.getLogs();
      expect(logs).toHaveLength(2);
      expect(logs[0]).toBe(error2); // Most recent first
      expect(logs[1]).toBe(error1);
    });

    it('should filter logs by type', () => {
      const error1 = createManifiestoError(ErrorType.IMAGE_LOAD_FAILED, 'Error 1');
      const error2 = createManifiestoError(ErrorType.OCR_PROCESSING_FAILED, 'Error 2');
      const error3 = createManifiestoError(ErrorType.IMAGE_LOAD_FAILED, 'Error 3');

      errorLogger.log(error1);
      errorLogger.log(error2);
      errorLogger.log(error3);

      const imageErrors = errorLogger.getLogsByType(ErrorType.IMAGE_LOAD_FAILED);
      expect(imageErrors).toHaveLength(2);
      expect(imageErrors[0]).toBe(error3);
      expect(imageErrors[1]).toBe(error1);
    });

    it('should filter logs by severity', () => {
      const error1 = createManifiestoError(ErrorType.IMAGE_LOAD_FAILED, 'Error 1'); // MEDIUM
      const error2 = createManifiestoError(ErrorType.OCR_LOW_CONFIDENCE, 'Error 2'); // LOW
      const error3 = createManifiestoError(ErrorType.SYSTEM_ERROR, 'Error 3'); // HIGH

      errorLogger.log(error1);
      errorLogger.log(error2);
      errorLogger.log(error3);

      const mediumErrors = errorLogger.getLogsBySeverity(ErrorSeverity.MEDIUM);
      expect(mediumErrors).toHaveLength(1);
      expect(mediumErrors[0]).toBe(error1);
    });

    it('should limit log count to maximum', () => {
      // Create more than max logs
      for (let i = 0; i < 150; i++) {
        const error = createManifiestoError(ErrorType.UNKNOWN_ERROR, `Error ${i}`);
        errorLogger.log(error);
      }

      const logs = errorLogger.getLogs();
      expect(logs.length).toBeLessThanOrEqual(100);
    });

    it('should clear logs', () => {
      const error = createManifiestoError(ErrorType.IMAGE_LOAD_FAILED, 'Error');
      errorLogger.log(error);

      expect(errorLogger.getLogs()).toHaveLength(1);

      errorLogger.clearLogs();

      expect(errorLogger.getLogs()).toHaveLength(0);
    });

    it('should export logs as JSON', () => {
      const error = createManifiestoError(ErrorType.IMAGE_LOAD_FAILED, 'Error');
      errorLogger.log(error);

      const exported = errorLogger.exportLogs();
      const parsed = JSON.parse(exported);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(1);
      expect(parsed[0]).toMatchObject({
        type: ErrorType.IMAGE_LOAD_FAILED,
        message: 'Error'
      });
    });
  });

  describe('getErrorStatistics', () => {
    beforeEach(() => {
      errorLogger.clearLogs();
    });

    it('should return correct statistics', () => {
      const error1 = createManifiestoError(ErrorType.IMAGE_LOAD_FAILED, 'Error 1');
      const error2 = createManifiestoError(ErrorType.IMAGE_LOAD_FAILED, 'Error 2');
      const error3 = createManifiestoError(ErrorType.OCR_PROCESSING_FAILED, 'Error 3');

      errorLogger.log(error1);
      errorLogger.log(error2);
      errorLogger.log(error3);

      const stats = getErrorStatistics();

      expect(stats.totalErrors).toBe(3);
      expect(stats.errorsByType[ErrorType.IMAGE_LOAD_FAILED]).toBe(2);
      expect(stats.errorsByType[ErrorType.OCR_PROCESSING_FAILED]).toBe(1);
      expect(stats.errorsBySeverity[ErrorSeverity.MEDIUM]).toBe(3);
      expect(stats.recentErrors).toHaveLength(3);
    });

    it('should limit recent errors to 10', () => {
      // Create 15 errors
      for (let i = 0; i < 15; i++) {
        const error = createManifiestoError(ErrorType.UNKNOWN_ERROR, `Error ${i}`);
        errorLogger.log(error);
      }

      const stats = getErrorStatistics();

      expect(stats.totalErrors).toBe(15);
      expect(stats.recentErrors).toHaveLength(10);
    });

    it('should return empty statistics when no errors', () => {
      const stats = getErrorStatistics();

      expect(stats.totalErrors).toBe(0);
      expect(stats.errorsByType).toEqual({});
      expect(stats.errorsBySeverity).toEqual({});
      expect(stats.recentErrors).toHaveLength(0);
    });
  });

  describe('Error Configuration', () => {
    it('should have correct configuration for image errors', () => {
      const error = createManifiestoError(ErrorType.IMAGE_FORMAT_UNSUPPORTED, 'Test');
      
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.recoveryStrategy).toBe(RecoveryStrategy.USER_ACTION);
      expect(error.maxRetries).toBe(0);
      expect(error.userMessage).toContain('Formato de imagen no soportado');
    });

    it('should have correct configuration for OCR errors', () => {
      const error = createManifiestoError(ErrorType.OCR_PROCESSING_TIMEOUT, 'Test');
      
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.recoveryStrategy).toBe(RecoveryStrategy.FALLBACK);
      expect(error.maxRetries).toBe(2);
      expect(error.userMessage).toContain('procesamiento está tardando mucho');
    });

    it('should have correct configuration for storage errors', () => {
      const error = createManifiestoError(ErrorType.STORAGE_QUOTA_EXCEEDED, 'Test');
      
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.recoveryStrategy).toBe(RecoveryStrategy.USER_ACTION);
      expect(error.maxRetries).toBe(0);
      expect(error.userMessage).toContain('Espacio de almacenamiento lleno');
    });

    it('should have correct configuration for validation errors', () => {
      const error = createManifiestoError(ErrorType.VALIDATION_REQUIRED_FIELD_MISSING, 'Test');
      
      expect(error.severity).toBe(ErrorSeverity.LOW);
      expect(error.recoveryStrategy).toBe(RecoveryStrategy.USER_ACTION);
      expect(error.maxRetries).toBe(0);
      expect(error.userMessage).toContain('Faltan campos obligatorios');
    });
  });
});