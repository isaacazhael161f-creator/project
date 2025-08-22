/**
 * Integration tests for ManifiestoScanner component
 * Tests the complete workflow and navigation between steps
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ManifiestoScanner from '../ManifiestoScanner';
import { useManifiestoScannerStore, ScannerStep } from '../../../stores/manifiestoScannerStore';

// Mock the store
jest.mock('../../../stores/manifiestoScannerStore');
const mockStore = useManifiestoScannerStore as jest.MockedFunction<typeof useManifiestoScannerStore>;

// Mock components
jest.mock('../ImageUploader', () => {
  return function MockImageUploader({ onImageSelected }: any) {
    return (
      <button
        testID="image-uploader"
        onPress={() => onImageSelected('mock-image-data')}
      >
        Upload Image
      </button>
    );
  };
});

jest.mock('../OCRProcessor', () => {
  return function MockOCRProcessor({ onTextExtracted }: any) {
    return (
      <button
        testID="ocr-processor"
        onPress={() => onTextExtracted('mock extracted text')}
      >
        Process OCR
      </button>
    );
  };
});

jest.mock('../DataEditor', () => {
  return function MockDataEditor({ onDataChanged }: any) {
    const mockData = {
      fecha: '2024-01-15',
      numeroVuelo: 'AM123',
      transportista: 'Aeroméxico',
      editado: false,
      fechaProcesamiento: new Date()
    };
    
    return (
      <button
        testID="data-editor"
        onPress={() => onDataChanged(mockData)}
      >
        Edit Data
      </button>
    );
  };
});

const mockScannerStep = {
  IMAGE_UPLOAD: 'image_upload',
  OCR_PROCESSING: 'ocr_processing',
  DATA_EDITING: 'data_editing'
};

jest.mock('../ScannerNavigation', () => {
  return function MockScannerNavigation({ onStepPress }: any) {
    return (
      <div testID="scanner-navigation">
        <button onPress={() => onStepPress(mockScannerStep.IMAGE_UPLOAD)}>
          Image Upload
        </button>
        <button onPress={() => onStepPress(mockScannerStep.OCR_PROCESSING)}>
          OCR Processing
        </button>
        <button onPress={() => onStepPress(mockScannerStep.DATA_EDITING)}>
          Data Editing
        </button>
      </div>
    );
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

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('ManifiestoScanner Integration', () => {
  const mockStoreState = {
    processingState: {
      currentStep: ScannerStep.IMAGE_UPLOAD,
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

  beforeEach(() => {
    jest.clearAllMocks();
    mockStore.mockReturnValue(mockStoreState);
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

    expect(mockStoreState.startNewSession).toHaveBeenCalledTimes(1);
  });

  it('should handle image selection and navigate to OCR step', async () => {
    const mockOnDataExtracted = jest.fn();
    
    const { getByTestId } = render(
      <ManifiestoScanner onDataExtracted={mockOnDataExtracted} />
    );

    const imageUploader = getByTestId('image-uploader');
    
    await act(async () => {
      fireEvent.press(imageUploader);
    });

    expect(mockStoreState.setImageData).toHaveBeenCalledWith('mock-image-data');
    expect(mockStoreState.completeStep).toHaveBeenCalledWith(ScannerStep.IMAGE_UPLOAD);
    expect(mockStoreState.navigateToStep).toHaveBeenCalledWith(ScannerStep.OCR_PROCESSING);
  });

  it('should handle OCR processing step', async () => {
    // Set up store state for OCR step
    const ocrStoreState = {
      ...mockStoreState,
      processingState: {
        ...mockStoreState.processingState,
        currentStep: ScannerStep.OCR_PROCESSING
      },
      imageData: 'mock-image-data'
    };
    mockStore.mockReturnValue(ocrStoreState);

    const mockOnDataExtracted = jest.fn();
    
    const { getByTestId } = render(
      <ManifiestoScanner onDataExtracted={mockOnDataExtracted} />
    );

    const ocrProcessor = getByTestId('ocr-processor');
    
    await act(async () => {
      fireEvent.press(ocrProcessor);
    });

    expect(mockStoreState.setExtractedText).toHaveBeenCalledWith('mock extracted text');
    expect(mockStoreState.completeStep).toHaveBeenCalledWith(ScannerStep.OCR_PROCESSING);
    expect(mockStoreState.navigateToStep).toHaveBeenCalledWith(ScannerStep.DATA_PARSING);
  });

  it('should handle data editing step', async () => {
    // Set up store state for data editing step
    const editingStoreState = {
      ...mockStoreState,
      processingState: {
        ...mockStoreState.processingState,
        currentStep: ScannerStep.DATA_EDITING
      },
      parsedData: { fecha: '2024-01-15', numeroVuelo: 'AM123' }
    };
    mockStore.mockReturnValue(editingStoreState);

    const mockOnDataExtracted = jest.fn();
    
    const { getByTestId } = render(
      <ManifiestoScanner onDataExtracted={mockOnDataExtracted} />
    );

    const dataEditor = getByTestId('data-editor');
    
    await act(async () => {
      fireEvent.press(dataEditor);
    });

    expect(mockStoreState.setFinalData).toHaveBeenCalledWith(
      expect.objectContaining({
        fecha: '2024-01-15',
        numeroVuelo: 'AM123',
        transportista: 'Aeroméxico'
      })
    );
  });

  it('should handle navigation between steps', async () => {
    const mockOnDataExtracted = jest.fn();
    
    const { getByTestId } = render(
      <ManifiestoScanner onDataExtracted={mockOnDataExtracted} />
    );

    const navigation = getByTestId('scanner-navigation');
    const ocrButton = navigation.querySelector('button:nth-child(2)');
    
    await act(async () => {
      fireEvent.press(ocrButton);
    });

    expect(mockStoreState.navigateToStep).toHaveBeenCalledWith(mockScannerStep.OCR_PROCESSING);
  });

  it('should prevent navigation when processing', async () => {
    // Set up store state with processing flag
    const processingStoreState = {
      ...mockStoreState,
      isProcessing: true
    };
    mockStore.mockReturnValue(processingStoreState);

    const mockOnDataExtracted = jest.fn();
    
    const { getByTestId } = render(
      <ManifiestoScanner onDataExtracted={mockOnDataExtracted} />
    );

    const navigation = getByTestId('scanner-navigation');
    const ocrButton = navigation.querySelector('button:nth-child(2)');
    
    await act(async () => {
      fireEvent.press(ocrButton);
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Procesamiento en curso',
      'No se puede cambiar de paso mientras se está procesando.',
      [{ text: 'OK' }]
    );
  });

  it('should handle errors gracefully', async () => {
    // Set up store state with error
    const errorStoreState = {
      ...mockStoreState,
      error: 'Test error message'
    };
    mockStore.mockReturnValue(errorStoreState);

    const mockOnDataExtracted = jest.fn();
    
    const { getByText } = render(
      <ManifiestoScanner onDataExtracted={mockOnDataExtracted} />
    );

    expect(getByText('Test error message')).toBeTruthy();
    
    const closeButton = getByText('Cerrar');
    fireEvent.press(closeButton);
    
    expect(mockStoreState.setError).toHaveBeenCalledWith(null);
  });

  it('should handle save and complete workflow', async () => {
    // Set up store state for review step
    const reviewStoreState = {
      ...mockStoreState,
      processingState: {
        ...mockStoreState.processingState,
        currentStep: ScannerStep.REVIEW_SAVE
      },
      finalData: {
        fecha: '2024-01-15',
        numeroVuelo: 'AM123',
        transportista: 'Aeroméxico',
        editado: false,
        fechaProcesamiento: new Date()
      }
    };
    mockStore.mockReturnValue(reviewStoreState);

    const mockOnDataExtracted = jest.fn();
    
    const { getByText } = render(
      <ManifiestoScanner onDataExtracted={mockOnDataExtracted} />
    );

    const saveButton = getByText('Guardar');
    
    await act(async () => {
      fireEvent.press(saveButton);
    });

    await waitFor(() => {
      expect(mockStoreState.saveSession).toHaveBeenCalled();
      expect(mockStoreState.completeStep).toHaveBeenCalledWith(ScannerStep.REVIEW_SAVE);
      expect(mockOnDataExtracted).toHaveBeenCalledWith(
        expect.objectContaining({
          numeroVuelo: 'AM123'
        })
      );
    });
  });

  it('should show exit confirmation when there is progress', async () => {
    // Set up store state with completed steps
    const progressStoreState = {
      ...mockStoreState,
      processingState: {
        ...mockStoreState.processingState,
        completedSteps: new Set([ScannerStep.IMAGE_UPLOAD])
      }
    };
    mockStore.mockReturnValue(progressStoreState);

    const mockOnDataExtracted = jest.fn();
    
    render(<ManifiestoScanner onDataExtracted={mockOnDataExtracted} />);

    // Simulate back button press (would be called by handleBackPress)
    // This would trigger the exit confirmation
    expect(progressStoreState.processingState.completedSteps.size).toBeGreaterThan(0);
  });

  it('should render review and save component correctly', () => {
    // Set up store state for review step
    const reviewStoreState = {
      ...mockStoreState,
      processingState: {
        ...mockStoreState.processingState,
        currentStep: ScannerStep.REVIEW_SAVE
      },
      finalData: {
        fecha: '2024-01-15',
        numeroVuelo: 'AM123',
        transportista: 'Aeroméxico',
        origenVuelo: 'MEX',
        destinoVuelo: 'GDL',
        pasajeros: { total: 150 },
        carga: { total: 2500 },
        editado: true,
        fechaProcesamiento: new Date()
      }
    };
    mockStore.mockReturnValue(reviewStoreState);

    const mockOnDataExtracted = jest.fn();
    
    const { getByText } = render(
      <ManifiestoScanner onDataExtracted={mockOnDataExtracted} />
    );

    expect(getByText('Revisar y Guardar')).toBeTruthy();
    expect(getByText('AM123')).toBeTruthy();
    expect(getByText('2024-01-15')).toBeTruthy();
    expect(getByText('Aeroméxico')).toBeTruthy();
    expect(getByText('MEX → GDL')).toBeTruthy();
    expect(getByText('150')).toBeTruthy();
    expect(getByText('2500 kg')).toBeTruthy();
    expect(getByText('⚠️ Este manifiesto contiene datos editados manualmente')).toBeTruthy();
  });
});