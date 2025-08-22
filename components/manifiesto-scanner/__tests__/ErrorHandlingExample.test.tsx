/**
 * Tests for ErrorHandlingExample component
 */

// Mock __DEV__ for tests
(global as any).__DEV__ = false;

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ErrorHandlingExample from '../ErrorHandlingExample';

// Mock the error handler hooks
jest.mock('../../../hooks/useErrorHandler', () => ({
  useImageErrorHandler: () => ({
    hasError: false,
    error: null,
    isRecovering: false,
    reportTypedError: jest.fn(),
    executeWithErrorHandling: jest.fn().mockResolvedValue('Success'),
    retry: jest.fn(),
    clearError: jest.fn()
  }),
  useOCRErrorHandler: () => ({
    hasError: false,
    error: null,
    isRecovering: false,
    reportTypedError: jest.fn(),
    executeWithErrorHandling: jest.fn().mockResolvedValue('Success'),
    retry: jest.fn(),
    clearError: jest.fn()
  }),
  useParsingErrorHandler: () => ({
    hasError: false,
    error: null,
    isRecovering: false,
    reportTypedError: jest.fn(),
    executeWithErrorHandling: jest.fn().mockResolvedValue('Success'),
    retry: jest.fn(),
    clearError: jest.fn()
  })
}));

// Mock Alert
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Alert: {
      alert: jest.fn()
    }
  };
});

describe('ErrorHandlingExample', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all demo sections', () => {
    const { getByText } = render(<ErrorHandlingExample />);

    expect(getByText('Error Handling Demo')).toBeTruthy();
    expect(getByText('Error Reporting')).toBeTruthy();
    expect(getByText('Error Recovery')).toBeTruthy();
    expect(getByText('Error Boundary Test')).toBeTruthy();
    expect(getByText('Error Status:')).toBeTruthy();
  });

  it('should render all demo buttons', () => {
    const { getByText } = render(<ErrorHandlingExample />);

    expect(getByText('Simulate Image Error')).toBeTruthy();
    expect(getByText('Simulate OCR Error')).toBeTruthy();
    expect(getByText('Simulate Parsing Error')).toBeTruthy();
    expect(getByText('Successful Operation')).toBeTruthy();
    expect(getByText('Retryable Operation')).toBeTruthy();
    expect(getByText('Throw Component Error')).toBeTruthy();
  });

  it('should handle successful operation', async () => {
    const { getByText } = render(<ErrorHandlingExample />);

    fireEvent.press(getByText('Successful Operation'));

    await waitFor(() => {
      expect(getByText('Result:')).toBeTruthy();
      expect(getByText('Success')).toBeTruthy();
    });
  });

  it('should handle retryable operation', async () => {
    const { getByText } = render(<ErrorHandlingExample />);

    fireEvent.press(getByText('Retryable Operation'));

    await waitFor(() => {
      expect(getByText('Result:')).toBeTruthy();
      expect(getByText('Success')).toBeTruthy();
    });
  });

  it('should handle button presses without crashing', () => {
    const { getByText } = render(<ErrorHandlingExample />);

    // Test all error simulation buttons
    fireEvent.press(getByText('Simulate Image Error'));
    fireEvent.press(getByText('Simulate OCR Error'));
    fireEvent.press(getByText('Simulate Parsing Error'));

    // Should not crash
    expect(getByText('Error Handling Demo')).toBeTruthy();
  });

  it('should handle component error with error boundary', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { getByText } = render(<ErrorHandlingExample />);

    // This should trigger the error boundary
    expect(() => {
      fireEvent.press(getByText('Throw Component Error'));
    }).not.toThrow();

    consoleSpy.mockRestore();
  });
});

describe('ErrorHandlingExample with errors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display error status when errors are present', () => {
    // Mock error handlers to return error state
    jest.doMock('../../../hooks/useErrorHandler', () => ({
      useImageErrorHandler: () => ({
        hasError: true,
        error: {
          userMessage: 'Test image error message',
          type: 'IMAGE_LOAD_FAILED'
        },
        isRecovering: false,
        reportTypedError: jest.fn(),
        executeWithErrorHandling: jest.fn(),
        retry: jest.fn(),
        clearError: jest.fn()
      }),
      useOCRErrorHandler: () => ({
        hasError: false,
        error: null,
        isRecovering: false,
        reportTypedError: jest.fn(),
        executeWithErrorHandling: jest.fn(),
        retry: jest.fn(),
        clearError: jest.fn()
      }),
      useParsingErrorHandler: () => ({
        hasError: false,
        error: null,
        isRecovering: false,
        reportTypedError: jest.fn(),
        executeWithErrorHandling: jest.fn(),
        retry: jest.fn(),
        clearError: jest.fn()
      })
    }));

    // Re-require the component to get the new mocks
    const ErrorHandlingExampleWithError = require('../ErrorHandlingExample').default;
    const { getByText } = render(<ErrorHandlingExampleWithError />);

    expect(getByText('Image Error:')).toBeTruthy();
    expect(getByText('Test image error message')).toBeTruthy();
    expect(getByText('Retry')).toBeTruthy();
  });
});