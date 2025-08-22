/**
 * Error Boundary component for Manifiesto Scanner
 * Catches React errors and provides recovery options
 */

import React, { Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { 
  ManifiestoError, 
  ErrorType, 
  createManifiestoError, 
  errorLogger,
  getErrorStatistics 
} from '../../utils/manifiesto/errorHandler';

interface Props {
  children: ReactNode;
  fallback?: (error: ManifiestoError, retry: () => void) => ReactNode;
  onError?: (error: ManifiestoError, errorInfo: React.ErrorInfo) => void;
  component?: string;
}

interface State {
  hasError: boolean;
  error: ManifiestoError | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Create a ManifiestoError from the React error
    const manifiestoError = createManifiestoError(
      ErrorType.SYSTEM_ERROR,
      error,
      { component: 'ErrorBoundary', operation: 'render' }
    );

    return {
      hasError: true,
      error: manifiestoError
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const manifiestoError = createManifiestoError(
      ErrorType.SYSTEM_ERROR,
      error,
      { 
        component: this.props.component || 'Unknown',
        operation: 'render',
        data: {
          componentStack: errorInfo.componentStack,
          errorBoundary: true
        }
      }
    );

    // Log the error
    errorLogger.log(manifiestoError);

    // Update state with error info
    this.setState({
      errorInfo
    });

    // Call the onError callback if provided
    this.props.onError?.(manifiestoError, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReportError = () => {
    if (this.state.error) {
      const errorReport = {
        error: this.state.error,
        errorInfo: this.state.errorInfo,
        timestamp: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'Unknown'
      };

      // In a real app, you would send this to your error reporting service
      console.log('Error Report:', JSON.stringify(errorReport, null, 2));
      
      // For now, copy to clipboard if available
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2));
        alert('Reporte de error copiado al portapapeles');
      }
    }
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      // Default error UI
      return (
        <View style={styles.container}>
          <View style={styles.errorCard}>
            <Text style={styles.title}>¡Oops! Algo salió mal</Text>
            
            <Text style={styles.message}>
              {this.state.error.userMessage}
            </Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.retryButton]} 
                onPress={this.handleRetry}
              >
                <Text style={styles.buttonText}>Intentar de nuevo</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.button, styles.reportButton]} 
                onPress={this.handleReportError}
              >
                <Text style={styles.buttonText}>Reportar error</Text>
              </TouchableOpacity>
            </View>

            {(typeof __DEV__ !== 'undefined' && __DEV__) && (
              <ScrollView style={styles.debugContainer}>
                <Text style={styles.debugTitle}>Información de depuración:</Text>
                <Text style={styles.debugText}>
                  Tipo: {this.state.error.type}
                </Text>
                <Text style={styles.debugText}>
                  Mensaje: {this.state.error.message}
                </Text>
                <Text style={styles.debugText}>
                  Componente: {this.state.error.context?.component || 'Desconocido'}
                </Text>
                {this.state.errorInfo && (
                  <Text style={styles.debugText}>
                    Stack: {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component to wrap components with error boundary
 */
export const withErrorBoundary = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WithErrorBoundaryComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundaryComponent.displayName = 
    `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithErrorBoundaryComponent;
};

/**
 * Error fallback component for specific error types
 */
export const ErrorFallback: React.FC<{
  error: ManifiestoError;
  retry: () => void;
  showDetails?: boolean;
}> = ({ error, retry, showDetails = false }) => {
  const getErrorIcon = (errorType: ErrorType): string => {
    switch (errorType) {
      case ErrorType.IMAGE_LOAD_FAILED:
      case ErrorType.IMAGE_FORMAT_UNSUPPORTED:
      case ErrorType.IMAGE_TOO_LARGE:
      case ErrorType.IMAGE_CORRUPTED:
        return '🖼️';
      case ErrorType.OCR_INITIALIZATION_FAILED:
      case ErrorType.OCR_PROCESSING_TIMEOUT:
      case ErrorType.OCR_PROCESSING_FAILED:
        return '🔍';
      case ErrorType.PARSING_FAILED:
      case ErrorType.PARSING_NO_DATA_FOUND:
        return '📄';
      case ErrorType.STORAGE_QUOTA_EXCEEDED:
      case ErrorType.STORAGE_SAVE_FAILED:
        return '💾';
      case ErrorType.NETWORK_ERROR:
        return '🌐';
      default:
        return '⚠️';
    }
  };

  return (
    <View style={styles.fallbackContainer}>
      <Text style={styles.errorIcon}>{getErrorIcon(error.type)}</Text>
      <Text style={styles.fallbackTitle}>Error</Text>
      <Text style={styles.fallbackMessage}>{error.userMessage}</Text>
      
      <TouchableOpacity style={styles.retryButton} onPress={retry}>
        <Text style={styles.buttonText}>Reintentar</Text>
      </TouchableOpacity>

      {showDetails && (typeof __DEV__ !== 'undefined' && __DEV__) && (
        <View style={styles.detailsContainer}>
          <Text style={styles.detailsTitle}>Detalles técnicos:</Text>
          <Text style={styles.detailsText}>Tipo: {error.type}</Text>
          <Text style={styles.detailsText}>ID: {error.id}</Text>
          <Text style={styles.detailsText}>
            Timestamp: {error.timestamp.toLocaleString()}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5'
  },
  errorCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    maxWidth: 400,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 16
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  retryButton: {
    backgroundColor: '#1976d2'
  },
  reportButton: {
    backgroundColor: '#757575'
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  debugContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    maxHeight: 200
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333'
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontFamily: 'monospace'
  },
  fallbackContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16
  },
  fallbackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 8
  },
  fallbackMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16
  },
  detailsContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    width: '100%'
  },
  detailsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333'
  },
  detailsText: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
    fontFamily: 'monospace'
  }
});

export default ErrorBoundary;