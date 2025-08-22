/**
 * Example component demonstrating error handling integration
 * Shows how to use error boundaries and error handlers in practice
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { ErrorBoundary, withErrorBoundary } from './ErrorBoundary';
import { useImageErrorHandler, useOCRErrorHandler, useParsingErrorHandler } from '../../hooks/useErrorHandler';
import { processImageWithOCR } from '../../utils/manifiesto/ocr';
import { parseManifiestoText } from '../../utils/manifiesto/parser';
import { ErrorType } from '../../utils/manifiesto/errorHandler';

// Component that demonstrates different error scenarios
const ErrorDemoComponent: React.FC = () => {
  const [result, setResult] = useState<string>('');
  const imageErrorHandler = useImageErrorHandler();
  const ocrErrorHandler = useOCRErrorHandler();
  const parsingErrorHandler = useParsingErrorHandler();

  const simulateImageError = () => {
    imageErrorHandler.reportTypedError(
      ErrorType.IMAGE_LOAD_FAILED,
      'Simulated image loading error'
    );
  };

  const simulateOCRError = () => {
    ocrErrorHandler.reportTypedError(
      ErrorType.OCR_PROCESSING_FAILED,
      'Simulated OCR processing error'
    );
  };

  const simulateParsingError = () => {
    parsingErrorHandler.reportTypedError(
      ErrorType.PARSING_NO_DATA_FOUND,
      'Simulated parsing error'
    );
  };

  const simulateSuccessfulOperation = async () => {
    const operation = async () => {
      // Simulate a successful operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      return 'Operation completed successfully!';
    };

    const result = await imageErrorHandler.executeWithErrorHandling(operation);
    setResult(result || 'Operation failed');
  };

  const simulateRetryableOperation = async () => {
    let attemptCount = 0;
    
    const retryableOperation = async () => {
      attemptCount++;
      if (attemptCount < 3) {
        throw new Error(`Attempt ${attemptCount} failed`);
      }
      return `Success after ${attemptCount} attempts!`;
    };

    const result = await ocrErrorHandler.executeWithErrorHandling(retryableOperation);
    setResult(result || 'All retry attempts failed');
  };

  const throwComponentError = () => {
    throw new Error('Component error for testing error boundary');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Error Handling Demo</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Error Reporting</Text>
        
        <TouchableOpacity style={styles.button} onPress={simulateImageError}>
          <Text style={styles.buttonText}>Simulate Image Error</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={simulateOCRError}>
          <Text style={styles.buttonText}>Simulate OCR Error</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={simulateParsingError}>
          <Text style={styles.buttonText}>Simulate Parsing Error</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Error Recovery</Text>
        
        <TouchableOpacity style={styles.button} onPress={simulateSuccessfulOperation}>
          <Text style={styles.buttonText}>Successful Operation</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={simulateRetryableOperation}>
          <Text style={styles.buttonText}>Retryable Operation</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Error Boundary Test</Text>
        
        <TouchableOpacity style={styles.button} onPress={throwComponentError}>
          <Text style={styles.buttonText}>Throw Component Error</Text>
        </TouchableOpacity>
      </View>

      {result && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Result:</Text>
          <Text style={styles.resultText}>{result}</Text>
        </View>
      )}

      {/* Error Status Display */}
      <View style={styles.errorStatus}>
        <Text style={styles.errorStatusTitle}>Error Status:</Text>
        
        {imageErrorHandler.hasError && (
          <View style={styles.errorItem}>
            <Text style={styles.errorType}>Image Error:</Text>
            <Text style={styles.errorMessage}>{imageErrorHandler.error?.userMessage}</Text>
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={imageErrorHandler.retry}
              disabled={imageErrorHandler.isRecovering}
            >
              <Text style={styles.retryButtonText}>
                {imageErrorHandler.isRecovering ? 'Retrying...' : 'Retry'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {ocrErrorHandler.hasError && (
          <View style={styles.errorItem}>
            <Text style={styles.errorType}>OCR Error:</Text>
            <Text style={styles.errorMessage}>{ocrErrorHandler.error?.userMessage}</Text>
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={ocrErrorHandler.retry}
              disabled={ocrErrorHandler.isRecovering}
            >
              <Text style={styles.retryButtonText}>
                {ocrErrorHandler.isRecovering ? 'Retrying...' : 'Retry'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {parsingErrorHandler.hasError && (
          <View style={styles.errorItem}>
            <Text style={styles.errorType}>Parsing Error:</Text>
            <Text style={styles.errorMessage}>{parsingErrorHandler.error?.userMessage}</Text>
            <TouchableOpacity 
              style={styles.clearButton} 
              onPress={parsingErrorHandler.clearError}
            >
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

// Wrap the component with error boundary
const ErrorHandlingExample = withErrorBoundary(ErrorDemoComponent, {
  component: 'ErrorHandlingExample',
  onError: (error, errorInfo) => {
    console.log('Error caught by boundary:', error);
    Alert.alert(
      'Error Boundary',
      `Component error: ${error.userMessage}`,
      [{ text: 'OK' }]
    );
  }
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333'
  },
  section: {
    marginBottom: 20,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333'
  },
  button: {
    backgroundColor: '#1976d2',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    alignItems: 'center'
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500'
  },
  resultContainer: {
    backgroundColor: '#e8f5e8',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2e7d32',
    marginBottom: 5
  },
  resultText: {
    fontSize: 14,
    color: '#2e7d32'
  },
  errorStatus: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  errorStatusTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333'
  },
  errorItem: {
    backgroundColor: '#ffebee',
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#d32f2f'
  },
  errorType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#d32f2f',
    marginBottom: 4
  },
  errorMessage: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8
  },
  retryButton: {
    backgroundColor: '#ff9800',
    padding: 6,
    borderRadius: 4,
    alignItems: 'center',
    alignSelf: 'flex-start'
  },
  retryButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500'
  },
  clearButton: {
    backgroundColor: '#757575',
    padding: 6,
    borderRadius: 4,
    alignItems: 'center',
    alignSelf: 'flex-start'
  },
  clearButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500'
  }
});

export default ErrorHandlingExample;