/**
 * Unit tests for ManifiestoScanner component
 * Tests the main component functionality and workflow integration
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ManifiestoScanner from '../ManifiestoScanner';

// Mock the store
const mockStore = {
  processingState: {
    currentStep: 'image_upload',
    completedSteps: new Set(),
    canNavigateToStep: jest.fn().mockReturnValue(true),
    progress: 0
  },
  imageData: null,
  extractedText: null,
  parsedData: null,
  finalData: null,
  isProcessing: false,
  error: null,
  startNewSession: jest.fn(),
  setImageData: jest.fn(),
  setExtractedText: jest.fn(),
  setParsedData: jest.fn(),
  setFinalData: jest.fn(),
  navigateToStep: jest.fn(),
  completeStep: jest.fn(),
  setProcessing: jest.fn(),
  setError: jest.fn(),
  saveSession: jest.fn().mockResolvedValue(undefined),
  resetWorkflow: jest.fn()
};

jest.mock('../../../stores/manifiestoScannerStore', () => ({
  useManifiestoScannerStore: () => mockStore,
  ScannerStep: {
    IMAGE_UPLOAD: 'image_upload',
    OCR_PROCESSING: 'ocr_processing',
    DATA_PARSING: 'data_parsing',
    DATA_EDITING: 'data_editing',
    REVIEW_SAVE: 'review_save'
  }
}));

// Mock components
jest.mock('../ImageUploader', () => {
  const { View, Text, TouchableOpacity } = require('react-native');
  return function MockImageUploader({ onImageSelected }: any) {
    return (
      <View testID="image-uploader">
        <TouchableOpacity
          testID="upload-button"
          onPress={() => onImageSelected('mock-image-data')}
        >
          <Text>Upload Image</Text>
        </TouchableOpacity>
      </View>
    );
  };
});

jest.mock('../OCRProcessor', () => {
  const { View, Text, TouchableOpacity } = require('react-native');
  return function MockOCRProcessor({ onTextExtracted }: any) {
    return (
      <View testID="ocr-processor">
        <TouchableOpacity
          testID="process-button"
          onPress={() => onTextExtracted('mock extracted text')}
        >
          <Text>Process OCR</Text>
        </TouchableOpacity>
      </View>
    );
  };
});

jest.mock('../DataEditor', () => {
  const { View, Text, TouchableOpacity } = require('react-native');
  return function MockDataEditor({ onDataChanged }: any) {
    const mockData = {
      fecha: '2024-01-15',
      numeroVuelo: 'AM123',
      transportista: 'Aeroméxico',
      editado: false,
      fechaProcesamiento: new Date()
    };
    
    return (
      <View testID="data-editor">
        <TouchableOpacity
          testID="edit-button"
          onPress={() => onDataChanged(mockData)}
        >
          <Text>Edit Data</Text>
        </TouchableOpacity>
      </View>
    );
  };
});

jest.mock('../ScannerNavigation', () => {
  const { View, Text } = require('react-native');
  return {
    ScannerNavigation: function MockScannerNavigation() {
      return (
        <View testID="scanner-navigation">
          <Text>Navigation</Text>
        </View>
      );
    }
  };
});

// Mock utilities
jest.mock('../../../utils/manifiesto/parser', () => ({
  parseManifiestoText: jest.fn().mockResolvedValue({
    fecha: '2024-01-15',
    numeroVuelo: 'AM123',
    transportista: 'Aeroméxico'
  })
}));

jest.mock('../../../utils/manifiesto/validation', () => ({
  getValidationRules: jest.fn().mockReturnValue([])
}));

jest.mock('../../../utils/manifiesto/storage', () => ({
  saveManifiestoData: jest.fn().mockResolvedValue(true)
}));

// Mock hooks
jest.mock('../../../hooks/useResponsive', () => ({
  useResponsive: () => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true
  }),
  useResponsiveSpacing: () => ({
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32
  })
}));

describe('ManifiestoScanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly with initial state', () => {
    const mockOnDataExtracted = jest.fn();
    
    const { getByTestId } = render(
      <ManifiestoScanner onDataExtracted={mockOnDataExtracted} />
    );

    expect(getByTestId('scanner-navigation')).toBeTruthy();
    expect(getByTestId('image-uploader')).toBeTruthy();
  });

  it('should initialize new session on mount', () => {
    const mockOnDataExtracted = jest.fn();
    
    render(<ManifiestoScanner onDataExtracted={mockOnDataExtracted} />);

    expect(mockStore.startNewSession).toHaveBeenCalledTimes(1);
  });

  it('should handle image selection', async () => {
    const mockOnDataExtracted = jest.fn();
    
    const { getByTestId } = render(
      <ManifiestoScanner onDataExtracted={mockOnDataExtracted} />
    );

    const uploadButton = getByTestId('upload-button');
    fireEvent.press(uploadButton);

    await waitFor(() => {
      expect(mockStore.setImageData).toHaveBeenCalledWith('mock-image-data');
      expect(mockStore.completeStep).toHaveBeenCalledWith('image_upload');
      expect(mockStore.navigateToStep).toHaveBeenCalledWith('ocr_processing');
    });
  });

  it('should render OCR processor when in OCR step', () => {
    const ocrMockStore = {
      ...mockStore,
      processingState: {
        ...mockStore.processingState,
        currentStep: 'ocr_processing'
      },
      imageData: 'mock-image-data'
    };

    jest.doMock('../../../stores/manifiestoScannerStore', () => ({
      useManifiestoScannerStore: () => ocrMockStore,
      ScannerStep: {
        IMAGE_UPLOAD: 'image_upload',
        OCR_PROCESSING: 'ocr_processing',
        DATA_PARSING: 'data_parsing',
        DATA_EDITING: 'data_editing',
        REVIEW_SAVE: 'review_save'
      }
    }));

    const mockOnDataExtracted = jest.fn();
    
    const { getByTestId } = render(
      <ManifiestoScanner onDataExtracted={mockOnDataExtracted} />
    );

    expect(getByTestId('ocr-processor')).toBeTruthy();
  });

  it('should render data editor when in editing step', () => {
    const editingMockStore = {
      ...mockStore,
      processingState: {
        ...mockStore.processingState,
        currentStep: 'data_editing'
      },
      parsedData: { fecha: '2024-01-15', numeroVuelo: 'AM123' }
    };

    jest.doMock('../../../stores/manifiestoScannerStore', () => ({
      useManifiestoScannerStore: () => editingMockStore,
      ScannerStep: {
        IMAGE_UPLOAD: 'image_upload',
        OCR_PROCESSING: 'ocr_processing',
        DATA_PARSING: 'data_parsing',
        DATA_EDITING: 'data_editing',
        REVIEW_SAVE: 'review_save'
      }
    }));

    const mockOnDataExtracted = jest.fn();
    
    const { getByTestId } = render(
      <ManifiestoScanner onDataExtracted={mockOnDataExtracted} />
    );

    expect(getByTestId('data-editor')).toBeTruthy();
  });

  it('should display error when present', () => {
    const errorMockStore = {
      ...mockStore,
      error: 'Test error message'
    };

    jest.doMock('../../../stores/manifiestoScannerStore', () => ({
      useManifiestoScannerStore: () => errorMockStore,
      ScannerStep: {
        IMAGE_UPLOAD: 'image_upload',
        OCR_PROCESSING: 'ocr_processing',
        DATA_PARSING: 'data_parsing',
        DATA_EDITING: 'data_editing',
        REVIEW_SAVE: 'review_save'
      }
    }));

    const mockOnDataExtracted = jest.fn();
    
    const { getByText } = render(
      <ManifiestoScanner onDataExtracted={mockOnDataExtracted} />
    );

    expect(getByText('Test error message')).toBeTruthy();
  });

  it('should handle error dismissal', () => {
    const errorMockStore = {
      ...mockStore,
      error: 'Test error message'
    };

    jest.doMock('../../../stores/manifiestoScannerStore', () => ({
      useManifiestoScannerStore: () => errorMockStore,
      ScannerStep: {
        IMAGE_UPLOAD: 'image_upload',
        OCR_PROCESSING: 'ocr_processing',
        DATA_PARSING: 'data_parsing',
        DATA_EDITING: 'data_editing',
        REVIEW_SAVE: 'review_save'
      }
    }));

    const mockOnDataExtracted = jest.fn();
    
    const { getByText } = render(
      <ManifiestoScanner onDataExtracted={mockOnDataExtracted} />
    );

    const closeButton = getByText('Cerrar');
    fireEvent.press(closeButton);
    
    expect(mockStore.setError).toHaveBeenCalledWith(null);
  });
});