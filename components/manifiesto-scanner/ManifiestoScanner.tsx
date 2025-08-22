/**
 * Main Manifiesto Scanner Component
 * Orchestrates the complete workflow with navigation and state management
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, BackHandler, Text, TouchableOpacity, ScrollView } from 'react-native';
import { ManifiestoScannerProps, ManifiestoData, PartialManifiestoData } from '../../types/manifiesto';
import { useManifiestoScannerStore, ScannerStep } from '../../stores/manifiestoScannerStore';
import { useResponsive, useResponsiveSpacing } from '../../hooks/useResponsive';

// Import step components with lazy loading
import { ScannerNavigation } from './ScannerNavigation';
import { 
  LazyImageUploaderWithSkeleton,
  LazyOCRProcessorWithSkeleton,
  LazyDataEditorWithSkeleton,
  preloadComponents
} from './LazyComponents';

// Import utilities
import { parseManifiestoText } from '../../utils/manifiesto/parser';
import { getValidationRules } from '../../utils/manifiesto/validation';
import { saveManifiestoData } from '../../utils/manifiesto/storage';

const ManifiestoScanner: React.FC<ManifiestoScannerProps> = ({ onDataExtracted }) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const spacing = useResponsiveSpacing();
  
  const {
    processingState,
    imageData,
    extractedText,
    parsedData,
    finalData,
    isProcessing,
    error,
    startNewSession,
    setImageData,
    setExtractedText,
    setParsedData,
    setFinalData,
    navigateToStep,
    completeStep,
    setProcessing,
    setError,
    saveSession,
    resetWorkflow
  } = useManifiestoScannerStore();

  const [showExitConfirmation, setShowExitConfirmation] = useState(false);

  // Initialize new session on mount and preload components
  useEffect(() => {
    startNewSession();
    // Preload components for better UX
    preloadComponents();
  }, [startNewSession]);

  // Handle Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, [processingState.currentStep, isProcessing]);

  const handleBackPress = (): boolean => {
    if (isProcessing) {
      Alert.alert(
        'Procesamiento en curso',
        'No se puede salir mientras se está procesando. Por favor espera a que termine.',
        [{ text: 'OK' }]
      );
      return true;
    }

    if (processingState.currentStep === ScannerStep.IMAGE_UPLOAD) {
      handleExitWorkflow();
      return true;
    }

    // Navigate to previous step
    const stepOrder = [
      ScannerStep.IMAGE_UPLOAD,
      ScannerStep.OCR_PROCESSING,
      ScannerStep.DATA_PARSING,
      ScannerStep.DATA_EDITING,
      ScannerStep.REVIEW_SAVE
    ];
    
    const currentIndex = stepOrder.indexOf(processingState.currentStep);
    if (currentIndex > 0) {
      navigateToStep(stepOrder[currentIndex - 1]);
    }
    
    return true;
  };

  const handleExitWorkflow = () => {
    if (processingState.completedSteps.size > 0) {
      Alert.alert(
        'Salir del flujo',
        '¿Estás seguro de que quieres salir? Se perderá el progreso actual.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Salir', 
            style: 'destructive',
            onPress: () => {
              resetWorkflow();
              // Navigate back or close modal depending on implementation
            }
          }
        ]
      );
    } else {
      resetWorkflow();
    }
  };

  // Step 1: Handle image selection
  const handleImageSelected = async (imageDataUrl: string) => {
    try {
      setProcessing(true);
      setError(null);
      
      setImageData(imageDataUrl);
      completeStep(ScannerStep.IMAGE_UPLOAD);
      
      // Auto-navigate to OCR processing
      navigateToStep(ScannerStep.OCR_PROCESSING);
      
    } catch (error) {
      console.error('Error handling image selection:', error);
      setError('Error al procesar la imagen seleccionada');
    } finally {
      setProcessing(false);
    }
  };

  // Step 2: Handle OCR text extraction
  const handleTextExtracted = async (text: string) => {
    try {
      setProcessing(true);
      setError(null);
      
      setExtractedText(text);
      completeStep(ScannerStep.OCR_PROCESSING);
      
      // Auto-navigate to data parsing
      navigateToStep(ScannerStep.DATA_PARSING);
      
      // Parse the extracted text
      await handleDataParsing(text);
      
    } catch (error) {
      console.error('Error handling text extraction:', error);
      setError('Error al extraer texto de la imagen');
    } finally {
      setProcessing(false);
    }
  };

  // Step 3: Handle data parsing
  const handleDataParsing = async (text: string) => {
    try {
      setProcessing(true);
      setError(null);
      
      const parsed = await parseManifiestoText(text);
      setParsedData(parsed);
      completeStep(ScannerStep.DATA_PARSING);
      
      // Auto-navigate to data editing
      navigateToStep(ScannerStep.DATA_EDITING);
      
    } catch (error) {
      console.error('Error parsing manifiesto data:', error);
      setError('Error al analizar los datos del manifiesto');
    } finally {
      setProcessing(false);
    }
  };

  // Step 4: Handle data editing completion
  const handleDataChanged = async (data: ManifiestoData) => {
    try {
      setFinalData(data);
      
      // Mark editing step as complete if data is valid
      if (data && Object.keys(data).length > 0) {
        completeStep(ScannerStep.DATA_EDITING);
      }
      
    } catch (error) {
      console.error('Error handling data changes:', error);
      setError('Error al procesar los cambios de datos');
    }
  };

  // Step 5: Handle final save and completion
  const handleSaveAndComplete = async () => {
    if (!finalData) {
      setError('No hay datos para guardar');
      return;
    }

    try {
      setProcessing(true);
      setError(null);
      
      // Save to local storage
      await saveManifiestoData(finalData);
      
      // Save session
      await saveSession();
      
      completeStep(ScannerStep.REVIEW_SAVE);
      
      // Notify parent component
      onDataExtracted(finalData);
      
      Alert.alert(
        'Manifiesto Guardado',
        'El manifiesto ha sido procesado y guardado exitosamente.',
        [
          {
            text: 'Procesar Otro',
            onPress: () => {
              resetWorkflow();
              startNewSession();
            }
          },
          {
            text: 'Finalizar',
            onPress: () => {
              // Handle completion - could navigate away or close
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('Error saving manifiesto:', error);
      setError('Error al guardar el manifiesto');
    } finally {
      setProcessing(false);
    }
  };

  // Handle OCR progress updates
  const handleOCRProgress = (progress: number) => {
    // Progress is handled by the store automatically
  };

  // Handle OCR errors
  const handleOCRError = (errorMessage: string) => {
    setError(`Error en OCR: ${errorMessage}`);
  };

  // Handle step navigation from navigation component
  const handleStepNavigation = (step: ScannerStep) => {
    if (isProcessing) {
      Alert.alert(
        'Procesamiento en curso',
        'No se puede cambiar de paso mientras se está procesando.',
        [{ text: 'OK' }]
      );
      return;
    }

    navigateToStep(step);
  };

  // Render current step content
  const renderCurrentStep = () => {
    switch (processingState.currentStep) {
      case ScannerStep.IMAGE_UPLOAD:
        return (
          <LazyImageUploaderWithSkeleton
            onImageSelected={handleImageSelected}
            supportedFormats={['jpg', 'jpeg', 'png', 'webp']}
          />
        );

      case ScannerStep.OCR_PROCESSING:
        return (
          <LazyOCRProcessorWithSkeleton
            imageData={imageData || ''}
            onTextExtracted={handleTextExtracted}
            onProgress={handleOCRProgress}
            onError={handleOCRError}
          />
        );

      case ScannerStep.DATA_PARSING:
        // This step is handled automatically, show loading or progress
        return (
          <View style={styles.processingContainer}>
            <Text style={styles.processingText}>
              Analizando datos del manifiesto...
            </Text>
          </View>
        );

      case ScannerStep.DATA_EDITING:
        return (
          <LazyDataEditorWithSkeleton
            data={parsedData || {}}
            onDataChanged={handleDataChanged}
            validationRules={getValidationRules()}
          />
        );

      case ScannerStep.REVIEW_SAVE:
        return (
          <ReviewAndSave
            data={finalData}
            onSave={handleSaveAndComplete}
            onEdit={() => navigateToStep(ScannerStep.DATA_EDITING)}
          />
        );

      default:
        return null;
    }
  };

  const responsiveStyles = {
    container: {
      ...styles.container,
      flexDirection: isMobile ? 'column' : 'row',
    },
    navigationContainer: {
      ...styles.navigationContainer,
      width: isMobile ? '100%' : 300,
      height: isMobile ? 'auto' : '100%',
    },
    contentContainer: {
      ...styles.contentContainer,
      flex: isMobile ? 1 : undefined,
      width: isMobile ? '100%' : 'calc(100% - 300px)',
    },
  };

  return (
    <View style={responsiveStyles.container}>
      {/* Navigation Panel */}
      <View style={responsiveStyles.navigationContainer}>
        <ScannerNavigation
          showFullNavigation={!isMobile}
          onStepPress={handleStepNavigation}
        />
      </View>

      {/* Main Content */}
      <View style={responsiveStyles.contentContainer}>
        {renderCurrentStep()}
      </View>

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.errorDismiss}
            onPress={() => setError(null)}
          >
            <Text style={styles.errorDismissText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// Review and Save Component
interface ReviewAndSaveProps {
  data: ManifiestoData | null;
  onSave: () => void;
  onEdit: () => void;
}

const ReviewAndSave: React.FC<ReviewAndSaveProps> = ({ data, onSave, onEdit }) => {
  if (!data) {
    return (
      <View style={styles.reviewContainer}>
        <Text style={styles.reviewTitle}>No hay datos para revisar</Text>
      </View>
    );
  }

  return (
    <View style={styles.reviewContainer}>
      <Text style={styles.reviewTitle}>Revisar y Guardar</Text>
      
      <ScrollView style={styles.reviewContent}>
        <Text style={styles.reviewSectionTitle}>Resumen del Manifiesto</Text>
        
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Vuelo:</Text>
          <Text style={styles.reviewValue}>{data.numeroVuelo || 'N/A'}</Text>
        </View>
        
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Fecha:</Text>
          <Text style={styles.reviewValue}>{data.fecha || 'N/A'}</Text>
        </View>
        
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Transportista:</Text>
          <Text style={styles.reviewValue}>{data.transportista || 'N/A'}</Text>
        </View>
        
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Ruta:</Text>
          <Text style={styles.reviewValue}>
            {data.origenVuelo || 'N/A'} → {data.destinoVuelo || 'N/A'}
          </Text>
        </View>
        
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Total Pasajeros:</Text>
          <Text style={styles.reviewValue}>{data.pasajeros?.total || 0}</Text>
        </View>
        
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Total Carga:</Text>
          <Text style={styles.reviewValue}>{data.carga?.total || 0} kg</Text>
        </View>
        
        {data.editado && (
          <View style={styles.editedIndicator}>
            <Text style={styles.editedText}>
              ⚠️ Este manifiesto contiene datos editados manualmente
            </Text>
          </View>
        )}
      </ScrollView>
      
      <View style={styles.reviewActions}>
        <TouchableOpacity style={styles.editButton} onPress={onEdit}>
          <Text style={styles.editButtonText}>Editar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.saveButton} onPress={onSave}>
          <Text style={styles.saveButtonText}>Guardar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  navigationContainer: {
    backgroundColor: 'white',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
  },
  contentContainer: {
    flex: 1,
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  processingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    color: 'white',
    fontSize: 14,
    flex: 1,
  },
  errorDismiss: {
    marginLeft: 12,
  },
  errorDismissText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Review and Save styles
  reviewContainer: {
    flex: 1,
    padding: 20,
  },
  reviewTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  reviewContent: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
  },
  reviewSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 8,
  },
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  reviewLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  reviewValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  editedIndicator: {
    backgroundColor: '#FFF3CD',
    borderRadius: 6,
    padding: 12,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  editedText: {
    fontSize: 12,
    color: '#856404',
    fontWeight: '500',
  },
  reviewActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  editButton: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ManifiestoScanner;