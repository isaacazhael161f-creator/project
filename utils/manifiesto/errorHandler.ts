/**
 * Centralized error handling system for Manifiesto Scanner
 * Provides error classification, recovery strategies, and user-friendly notifications
 */

import { useNotificationStore } from '../../stores/notificationStore';

// Error types for classification
export enum ErrorType {
  // Image processing errors
  IMAGE_LOAD_FAILED = 'IMAGE_LOAD_FAILED',
  IMAGE_FORMAT_UNSUPPORTED = 'IMAGE_FORMAT_UNSUPPORTED',
  IMAGE_TOO_LARGE = 'IMAGE_TOO_LARGE',
  IMAGE_CORRUPTED = 'IMAGE_CORRUPTED',
  
  // OCR processing errors
  OCR_INITIALIZATION_FAILED = 'OCR_INITIALIZATION_FAILED',
  OCR_PROCESSING_TIMEOUT = 'OCR_PROCESSING_TIMEOUT',
  OCR_PROCESSING_FAILED = 'OCR_PROCESSING_FAILED',
  OCR_LOW_CONFIDENCE = 'OCR_LOW_CONFIDENCE',
  
  // Parsing errors
  PARSING_FAILED = 'PARSING_FAILED',
  PARSING_NO_DATA_FOUND = 'PARSING_NO_DATA_FOUND',
  PARSING_INVALID_FORMAT = 'PARSING_INVALID_FORMAT',
  
  // Storage errors
  STORAGE_QUOTA_EXCEEDED = 'STORAGE_QUOTA_EXCEEDED',
  STORAGE_ACCESS_DENIED = 'STORAGE_ACCESS_DENIED',
  STORAGE_CORRUPTION = 'STORAGE_CORRUPTION',
  STORAGE_SAVE_FAILED = 'STORAGE_SAVE_FAILED',
  
  // Validation errors
  VALIDATION_REQUIRED_FIELD_MISSING = 'VALIDATION_REQUIRED_FIELD_MISSING',
  VALIDATION_INVALID_FORMAT = 'VALIDATION_INVALID_FORMAT',
  VALIDATION_DATA_INCONSISTENT = 'VALIDATION_DATA_INCONSISTENT',
  
  // Export errors
  EXPORT_GENERATION_FAILED = 'EXPORT_GENERATION_FAILED',
  EXPORT_DOWNLOAD_FAILED = 'EXPORT_DOWNLOAD_FAILED',
  
  // Network/System errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',        // Warning, user can continue
  MEDIUM = 'medium',  // Error, but recoverable
  HIGH = 'high',      // Critical error, blocks workflow
  CRITICAL = 'critical' // System failure
}

// Recovery strategy types
export enum RecoveryStrategy {
  RETRY = 'retry',
  FALLBACK = 'fallback',
  USER_ACTION = 'user_action',
  SKIP = 'skip',
  ABORT = 'abort'
}

// Structured error interface
export interface ManifiestoError {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  details?: any;
  timestamp: Date;
  context?: {
    component?: string;
    operation?: string;
    data?: any;
  };
  recoveryStrategy: RecoveryStrategy;
  retryCount?: number;
  maxRetries?: number;
  originalError?: Error;
}

// Recovery action interface
export interface RecoveryAction {
  type: RecoveryStrategy;
  label: string;
  action: () => Promise<void> | void;
  autoExecute?: boolean;
  delay?: number;
}

// Error configuration for each error type
const ERROR_CONFIG: Record<ErrorType, {
  severity: ErrorSeverity;
  userMessage: string;
  recoveryStrategy: RecoveryStrategy;
  maxRetries: number;
  retryDelay: number;
}> = {
  // Image errors
  [ErrorType.IMAGE_LOAD_FAILED]: {
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'No se pudo cargar la imagen. Verifica que el archivo sea válido.',
    recoveryStrategy: RecoveryStrategy.USER_ACTION,
    maxRetries: 2,
    retryDelay: 1000
  },
  [ErrorType.IMAGE_FORMAT_UNSUPPORTED]: {
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'Formato de imagen no soportado. Usa JPG, PNG o WebP.',
    recoveryStrategy: RecoveryStrategy.USER_ACTION,
    maxRetries: 0,
    retryDelay: 0
  },
  [ErrorType.IMAGE_TOO_LARGE]: {
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'La imagen es demasiado grande. Usa una imagen menor a 10MB.',
    recoveryStrategy: RecoveryStrategy.FALLBACK,
    maxRetries: 1,
    retryDelay: 0
  },
  [ErrorType.IMAGE_CORRUPTED]: {
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'La imagen está corrupta o dañada. Intenta con otra imagen.',
    recoveryStrategy: RecoveryStrategy.USER_ACTION,
    maxRetries: 0,
    retryDelay: 0
  },
  
  // OCR errors
  [ErrorType.OCR_INITIALIZATION_FAILED]: {
    severity: ErrorSeverity.HIGH,
    userMessage: 'Error inicializando el motor de reconocimiento de texto.',
    recoveryStrategy: RecoveryStrategy.RETRY,
    maxRetries: 3,
    retryDelay: 2000
  },
  [ErrorType.OCR_PROCESSING_TIMEOUT]: {
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'El procesamiento está tardando mucho. Intenta con una imagen más pequeña.',
    recoveryStrategy: RecoveryStrategy.FALLBACK,
    maxRetries: 2,
    retryDelay: 5000
  },
  [ErrorType.OCR_PROCESSING_FAILED]: {
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'No se pudo procesar la imagen. Verifica que contenga texto legible.',
    recoveryStrategy: RecoveryStrategy.RETRY,
    maxRetries: 2,
    retryDelay: 3000
  },
  [ErrorType.OCR_LOW_CONFIDENCE]: {
    severity: ErrorSeverity.LOW,
    userMessage: 'La calidad del texto reconocido es baja. Revisa los datos extraídos.',
    recoveryStrategy: RecoveryStrategy.USER_ACTION,
    maxRetries: 0,
    retryDelay: 0
  },
  
  // Parsing errors
  [ErrorType.PARSING_FAILED]: {
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'Error procesando el texto extraído.',
    recoveryStrategy: RecoveryStrategy.FALLBACK,
    maxRetries: 1,
    retryDelay: 1000
  },
  [ErrorType.PARSING_NO_DATA_FOUND]: {
    severity: ErrorSeverity.LOW,
    userMessage: 'No se encontraron datos del manifiesto en el texto.',
    recoveryStrategy: RecoveryStrategy.USER_ACTION,
    maxRetries: 0,
    retryDelay: 0
  },
  [ErrorType.PARSING_INVALID_FORMAT]: {
    severity: ErrorSeverity.LOW,
    userMessage: 'El formato del documento no es reconocido como un manifiesto.',
    recoveryStrategy: RecoveryStrategy.USER_ACTION,
    maxRetries: 0,
    retryDelay: 0
  },
  
  // Storage errors
  [ErrorType.STORAGE_QUOTA_EXCEEDED]: {
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'Espacio de almacenamiento lleno. Elimina datos antiguos.',
    recoveryStrategy: RecoveryStrategy.USER_ACTION,
    maxRetries: 0,
    retryDelay: 0
  },
  [ErrorType.STORAGE_ACCESS_DENIED]: {
    severity: ErrorSeverity.HIGH,
    userMessage: 'No se puede acceder al almacenamiento local.',
    recoveryStrategy: RecoveryStrategy.SKIP,
    maxRetries: 1,
    retryDelay: 1000
  },
  [ErrorType.STORAGE_CORRUPTION]: {
    severity: ErrorSeverity.HIGH,
    userMessage: 'Los datos almacenados están corruptos.',
    recoveryStrategy: RecoveryStrategy.USER_ACTION,
    maxRetries: 0,
    retryDelay: 0
  },
  [ErrorType.STORAGE_SAVE_FAILED]: {
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'Error guardando los datos.',
    recoveryStrategy: RecoveryStrategy.RETRY,
    maxRetries: 3,
    retryDelay: 2000
  },
  
  // Validation errors
  [ErrorType.VALIDATION_REQUIRED_FIELD_MISSING]: {
    severity: ErrorSeverity.LOW,
    userMessage: 'Faltan campos obligatorios. Completa la información requerida.',
    recoveryStrategy: RecoveryStrategy.USER_ACTION,
    maxRetries: 0,
    retryDelay: 0
  },
  [ErrorType.VALIDATION_INVALID_FORMAT]: {
    severity: ErrorSeverity.LOW,
    userMessage: 'Algunos campos tienen formato incorrecto.',
    recoveryStrategy: RecoveryStrategy.USER_ACTION,
    maxRetries: 0,
    retryDelay: 0
  },
  [ErrorType.VALIDATION_DATA_INCONSISTENT]: {
    severity: ErrorSeverity.LOW,
    userMessage: 'Los datos contienen inconsistencias.',
    recoveryStrategy: RecoveryStrategy.USER_ACTION,
    maxRetries: 0,
    retryDelay: 0
  },
  
  // Export errors
  [ErrorType.EXPORT_GENERATION_FAILED]: {
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'Error generando el archivo de exportación.',
    recoveryStrategy: RecoveryStrategy.RETRY,
    maxRetries: 2,
    retryDelay: 1000
  },
  [ErrorType.EXPORT_DOWNLOAD_FAILED]: {
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'Error descargando el archivo.',
    recoveryStrategy: RecoveryStrategy.RETRY,
    maxRetries: 2,
    retryDelay: 1000
  },
  
  // System errors
  [ErrorType.NETWORK_ERROR]: {
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'Error de conexión. Verifica tu conexión a internet.',
    recoveryStrategy: RecoveryStrategy.RETRY,
    maxRetries: 3,
    retryDelay: 5000
  },
  [ErrorType.PERMISSION_DENIED]: {
    severity: ErrorSeverity.HIGH,
    userMessage: 'Permisos insuficientes para realizar la operación.',
    recoveryStrategy: RecoveryStrategy.USER_ACTION,
    maxRetries: 0,
    retryDelay: 0
  },
  [ErrorType.SYSTEM_ERROR]: {
    severity: ErrorSeverity.HIGH,
    userMessage: 'Error del sistema. Intenta recargar la aplicación.',
    recoveryStrategy: RecoveryStrategy.USER_ACTION,
    maxRetries: 1,
    retryDelay: 2000
  },
  [ErrorType.UNKNOWN_ERROR]: {
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'Error inesperado. Intenta nuevamente.',
    recoveryStrategy: RecoveryStrategy.RETRY,
    maxRetries: 2,
    retryDelay: 2000
  }
};

/**
 * Error logging utility
 */
class ErrorLogger {
  private logs: ManifiestoError[] = [];
  private maxLogs = 100;

  log(error: ManifiestoError): void {
    this.logs.unshift(error);
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Log to console in development
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.group(`🚨 ManifiestoError [${error.severity.toUpperCase()}]`);
      console.log('Type:', error.type);
      console.log('Message:', error.message);
      console.log('User Message:', error.userMessage);
      console.log('Context:', error.context);
      console.log('Details:', error.details);
      if (error.originalError) {
        console.log('Original Error:', error.originalError);
      }
      console.groupEnd();
    }

    // In production, you might want to send to analytics service
    // Analytics.logError(error);
  }

  getLogs(): ManifiestoError[] {
    return [...this.logs];
  }

  getLogsByType(type: ErrorType): ManifiestoError[] {
    return this.logs.filter(log => log.type === type);
  }

  getLogsBySeverity(severity: ErrorSeverity): ManifiestoError[] {
    return this.logs.filter(log => log.severity === severity);
  }

  clearLogs(): void {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Global error logger instance
export const errorLogger = new ErrorLogger();

/**
 * Creates a structured error from a raw error
 */
export const createManifiestoError = (
  type: ErrorType,
  originalError?: Error | string,
  context?: ManifiestoError['context'],
  details?: any
): ManifiestoError => {
  const config = ERROR_CONFIG[type];
  const errorMessage = typeof originalError === 'string' 
    ? originalError 
    : originalError?.message || 'Unknown error';

  return {
    id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    severity: config.severity,
    message: errorMessage,
    userMessage: config.userMessage,
    details,
    timestamp: new Date(),
    context,
    recoveryStrategy: config.recoveryStrategy,
    retryCount: 0,
    maxRetries: config.maxRetries,
    originalError: typeof originalError === 'object' ? originalError : undefined
  };
};

/**
 * Classifies an unknown error into a ManifiestoError
 */
export const classifyError = (
  error: Error | string,
  context?: ManifiestoError['context']
): ManifiestoError => {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorStack = typeof error === 'object' ? error.stack : undefined;

  // Image-related errors
  if (errorMessage.includes('Failed to load image') || 
      errorMessage.includes('Image load error')) {
    return createManifiestoError(ErrorType.IMAGE_LOAD_FAILED, error, context);
  }

  if (errorMessage.includes('Unsupported image format') ||
      errorMessage.includes('Invalid image type')) {
    return createManifiestoError(ErrorType.IMAGE_FORMAT_UNSUPPORTED, error, context);
  }

  if (errorMessage.includes('Image too large') ||
      errorMessage.includes('File size exceeded')) {
    return createManifiestoError(ErrorType.IMAGE_TOO_LARGE, error, context);
  }

  // OCR-related errors
  if (errorMessage.includes('Tesseract') || 
      errorMessage.includes('OCR') ||
      errorMessage.includes('Worker')) {
    if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
      return createManifiestoError(ErrorType.OCR_PROCESSING_TIMEOUT, error, context);
    }
    if (errorMessage.includes('initialize') || errorMessage.includes('init')) {
      return createManifiestoError(ErrorType.OCR_INITIALIZATION_FAILED, error, context);
    }
    return createManifiestoError(ErrorType.OCR_PROCESSING_FAILED, error, context);
  }

  // Storage-related errors
  if (errorMessage.includes('QuotaExceededError') ||
      errorMessage.includes('storage quota')) {
    return createManifiestoError(ErrorType.STORAGE_QUOTA_EXCEEDED, error, context);
  }

  if (errorMessage.includes('IndexedDB') ||
      errorMessage.includes('storage') ||
      errorMessage.includes('database')) {
    return createManifiestoError(ErrorType.STORAGE_SAVE_FAILED, error, context);
  }

  // Network errors
  if (errorMessage.includes('Network') ||
      errorMessage.includes('fetch') ||
      errorMessage.includes('connection')) {
    return createManifiestoError(ErrorType.NETWORK_ERROR, error, context);
  }

  // Permission errors
  if (errorMessage.includes('Permission') ||
      errorMessage.includes('Access denied') ||
      errorMessage.includes('Unauthorized')) {
    return createManifiestoError(ErrorType.PERMISSION_DENIED, error, context);
  }

  // Default to unknown error
  return createManifiestoError(ErrorType.UNKNOWN_ERROR, error, context);
};

/**
 * Handles an error with appropriate recovery strategy
 */
export const handleError = async (
  error: ManifiestoError,
  recoveryActions?: Partial<Record<RecoveryStrategy, () => Promise<void> | void>>
): Promise<boolean> => {
  // Log the error
  errorLogger.log(error);

  // Show user notification
  const notificationStore = useNotificationStore.getState();
  notificationStore.addNotification({
    title: getErrorTitle(error.type),
    message: error.userMessage,
    type: getNotificationType(error.severity),
    read: false,
    data: { errorId: error.id, errorType: error.type }
  });

  // Execute recovery strategy
  try {
    switch (error.recoveryStrategy) {
      case RecoveryStrategy.RETRY:
        if (error.retryCount! < error.maxRetries! && recoveryActions?.retry) {
          error.retryCount = (error.retryCount || 0) + 1;
          
          // Wait before retry
          const config = ERROR_CONFIG[error.type];
          if (config.retryDelay > 0) {
            await new Promise(resolve => setTimeout(resolve, config.retryDelay));
          }
          
          await recoveryActions.retry();
          return true;
        }
        break;

      case RecoveryStrategy.FALLBACK:
        if (recoveryActions?.fallback) {
          await recoveryActions.fallback();
          return true;
        }
        break;

      case RecoveryStrategy.SKIP:
        if (recoveryActions?.skip) {
          await recoveryActions.skip();
          return true;
        }
        break;

      case RecoveryStrategy.USER_ACTION:
        // User needs to take action, return false to indicate manual intervention needed
        return false;

      case RecoveryStrategy.ABORT:
        // Critical error, abort operation
        return false;
    }
  } catch (recoveryError) {
    // Recovery failed, log the recovery error
    const recoveryManifiestoError = classifyError(
      recoveryError as Error,
      { ...error.context, operation: 'error_recovery' }
    );
    errorLogger.log(recoveryManifiestoError);
  }

  return false;
};

/**
 * Gets appropriate error title for notifications
 */
const getErrorTitle = (errorType: ErrorType): string => {
  const titles: Partial<Record<ErrorType, string>> = {
    [ErrorType.IMAGE_LOAD_FAILED]: 'Error de Imagen',
    [ErrorType.IMAGE_FORMAT_UNSUPPORTED]: 'Formato No Soportado',
    [ErrorType.IMAGE_TOO_LARGE]: 'Imagen Muy Grande',
    [ErrorType.OCR_INITIALIZATION_FAILED]: 'Error de Inicialización',
    [ErrorType.OCR_PROCESSING_TIMEOUT]: 'Procesamiento Lento',
    [ErrorType.OCR_PROCESSING_FAILED]: 'Error de Procesamiento',
    [ErrorType.PARSING_FAILED]: 'Error de Análisis',
    [ErrorType.STORAGE_QUOTA_EXCEEDED]: 'Almacenamiento Lleno',
    [ErrorType.STORAGE_SAVE_FAILED]: 'Error de Guardado',
    [ErrorType.VALIDATION_REQUIRED_FIELD_MISSING]: 'Campos Faltantes',
    [ErrorType.EXPORT_GENERATION_FAILED]: 'Error de Exportación',
    [ErrorType.NETWORK_ERROR]: 'Error de Conexión',
    [ErrorType.SYSTEM_ERROR]: 'Error del Sistema'
  };

  return titles[errorType] || 'Error';
};

/**
 * Maps error severity to notification type
 */
const getNotificationType = (severity: ErrorSeverity): 'info' | 'warning' | 'success' | 'error' => {
  switch (severity) {
    case ErrorSeverity.LOW:
      return 'warning';
    case ErrorSeverity.MEDIUM:
      return 'error';
    case ErrorSeverity.HIGH:
    case ErrorSeverity.CRITICAL:
      return 'error';
    default:
      return 'error';
  }
};

/**
 * Utility function to wrap async operations with error handling
 */
export const withErrorHandling = <T extends any[], R>(
  operation: (...args: T) => Promise<R>,
  context: ManifiestoError['context'],
  recoveryActions?: Partial<Record<RecoveryStrategy, () => Promise<void> | void>>
) => {
  return async (...args: T): Promise<R | null> => {
    try {
      return await operation(...args);
    } catch (error) {
      const manifiestoError = classifyError(error as Error, context);
      const recovered = await handleError(manifiestoError, recoveryActions);
      
      if (!recovered) {
        throw manifiestoError;
      }
      
      // If recovered, try the operation again (for retry strategy)
      if (manifiestoError.recoveryStrategy === RecoveryStrategy.RETRY) {
        try {
          return await operation(...args);
        } catch (retryError) {
          const retryManifiestoError = classifyError(retryError as Error, context);
          await handleError(retryManifiestoError);
          throw retryManifiestoError;
        }
      }
      
      return null;
    }
  };
};

/**
 * Gets error statistics for debugging
 */
export const getErrorStatistics = (): {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  recentErrors: ManifiestoError[];
} => {
  const logs = errorLogger.getLogs();
  
  const errorsByType: Record<string, number> = {};
  const errorsBySeverity: Record<string, number> = {};
  
  logs.forEach(error => {
    errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
    errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1;
  });
  
  return {
    totalErrors: logs.length,
    errorsByType,
    errorsBySeverity,
    recentErrors: logs.slice(0, 10)
  };
};