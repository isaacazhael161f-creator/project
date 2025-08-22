/**
 * Accessible Manifiesto Scanner Component
 * Enhanced version with comprehensive accessibility features
 */

import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Alert, BackHandler, Text, TouchableOpacity, ScrollView } from 'react-native';
import { ManifiestoScannerProps, ManifiestoData, PartialManifiestoData } from '../../types/manifiesto';
import { useManifiestoScannerStore, ScannerStep } from '../../stores/manifiestoScannerStore';
import { useResponsive, useResponsiveSpacing } from '../../hooks/useResponsive';
import { useAccessibility, useKeyboardNavigation, useFocusManagement } from '../../hooks/useAccessibility';
import { ariaLabels, defaultKeyboardShortcuts } from '../../utils/manifiesto/accessibility';
import { injectAccessibilityStyles } from '../../utils/manifiesto/accessibilityStyles';

// Import components
import { ScannerNavigation } from './ScannerNavigation';
import { AccessibilitySettings } from './AccessibilitySettings';
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

const AccessibleManifiestoScanner: React.FC<ManifiestoScannerProps> = ({ onDataExtracted }) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const spacing = useResponsiveSpacing();
  const { options, announce } = useAccessibility();
  const { saveFocus, restoreFocus, focusFirst } = useFocusManagement();
  
  const [showAccessibilitySettings, setShowAccessibilitySettings] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const mainContentRef = useRef<View>(null);
  
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

  // Keyboard shortcuts with accessibility announcements
  const keyboardShortcuts = {
    ...defaultKeyboardShortcuts,
    'Ctrl+u': {
      description: 'Cargar nueva imagen',
      action: () => {
        if (processingState.currentStep === ScannerStep.IMAGE_UPLOAD) {
          announce('Activando carga de imagen', 'polite');
          // Focus on upload button or trigger upload
        }
      }
    },
    'Ctrl+s': {
      description: 'Guardar datos actuales',
      action: () => {
        if (finalData) {
          handleSaveData();
          announce('Guardando datos del manifiesto', 'assertive');
        }
      }
    },
    'Ctrl+e': {
      description: 'Exportar datos',
      action: () => {
        if (finalData) {
          announce('Iniciando exportación de datos', 'polite');
          // Trigger export functionality
        }
      }
    },
    'Alt+a': {
      description: 'Abrir configuración de accesibilidad',
      action: () => {
        setShowAccessibilitySettings(true);
        announce('Abriendo configuración de accesibilidad', 'polite');
      }
    },
    'Escape': {
      description: 'Cancelar operación actual o cerrar modal',
      action: () => {
        if (showAccessibilitySettings) {
          setShowAccessibilitySettings(false);
          announce('Cerrando configuración de accesibilidad', 'polite');
        } else if (isProcessing) {
          announce('No se puede cancelar durante el procesamiento', 'assertive');
        }
      }
    }
  };

  useKeyboardNavigation(keyboardShortcuts);

  // Initialize accessibility features
  useEffect(() => {
    injectAccessibilityStyles();
    startNewSession();
    preloadComponents();
    
    // Announce initial state
    announce('Escáner de manifiestos iniciado. Use Alt+A para configuración de accesibilidad', 'polite');
  }, [startNewSession, announce]);

  // Handle Android back button with accessibility
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
      announce('No se puede salir durante el procesamiento', 'assertive');
      return true;
    }

    if (processingState.currentStep === ScannerStep.IMAGE_UPLOAD) {
      handleExitWorkflow();
      return true;
    }

    // Navigate to previous step with announcement
    const stepOrder = [
      ScannerStep.IMAGE_UPLOAD,
      ScannerStep.OCR_PROCESSING,
      ScannerStep.DATA_PARSING,
      ScannerStep.DATA_EDITING,
      ScannerStep.REVIEW_SAVE
    ];
    
    const currentIndex = stepOrder.indexOf(processingState.currentStep);
    if (currentIndex > 0) {
      const previousStep = stepOrder[currentIndex - 1];
      navigateToStep(previousStep);
      announce(`Navegando al paso anterior: ${getStepName(previousStep)}`, 'polite');
    }
    
    return true;
  };

  const getStepName = (step: ScannerStep): string => {
    const stepNames = {
      [ScannerStep.IMAGE_UPLOAD]: 'Carga de imagen',
      [ScannerStep.OCR_PROCESSING]: 'Procesamiento OCR',
      [ScannerStep.DATA_PARSING]: 'Análisis de datos',
      [ScannerStep.DATA_EDITING]: 'Edición de datos',
      [ScannerStep.REVIEW_SAVE]: 'Revisión y guardado'
    };
    return stepNames[step] || 'Paso desconocido';
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
              announce('Flujo de trabajo reiniciado', 'assertive');
            }
          }
        ]
      );
    } else {
      resetWorkflow();
      announce('Saliendo del escáner de manifiestos', 'polite');
    }
  };

  // Step handlers with accessibility announcements
  const handleImageSelected = async (imageDataUrl: string) => {
    try {
      setProcessing(true);
      setError(null);
      announce('Procesando imagen seleccionada', 'polite');
      
      setImageData(imageDataUrl);
      completeStep(ScannerStep.IMAGE_UPLOAD);
      
      navigateToStep(ScannerStep.OCR_PROCESSING);
      announce('Imagen cargada correctamente. Iniciando reconocimiento de texto', 'assertive');
      
    } catch (error) {
      console.error('Error handling image selection:', error);
      const errorMessage = 'Error al procesar la imagen seleccionada';
      setError(errorMessage);
      announce(errorMessage, 'assertive');
    } finally {
      setProcessing(false);
    }
  };

  const handleTextExtracted = async (text: string) => {
    try {
      setProcessing(true);
      setError(null);
      announce('Texto extraído correctamente. Analizando datos del manifiesto', 'polite');
      
      setExtractedText(text);
      completeStep(ScannerStep.OCR_PROCESSING);
      
      navigateToStep(ScannerStep.DATA_PARSING);
      
      // Parse the extracted text
      const parsed = await parseManifiestoText(text);
      setParsedData(parsed);
      completeStep(ScannerStep.DATA_PARSING);
      
      navigateToStep(ScannerStep.DATA_EDITING);
      announce('Datos del manifiesto analizados. Puede revisar y editar los campos', 'assertive');
      
    } catch (error) {
      console.error('Error parsing text:', error);
      const errorMessage = 'Error al analizar el texto extraído';
      setError(errorMessage);
      announce(errorMessage, 'assertive');
    } finally {
      setProcessing(false);
    }
  };

  const handleDataEdited = async (editedData: ManifiestoData) => {
    try {
      setProcessing(true);
      setError(null);
      
      setFinalData(editedData);
      completeStep(ScannerStep.DATA_EDITING);
      
      navigateToStep(ScannerStep.REVIEW_SAVE);
      announce('Datos editados guardados. Revisando información final', 'polite');
      
    } catch (error) {
      console.error('Error handling edited data:', error);
      const errorMessage = 'Error al procesar los datos editados';
      setError(errorMessage);
      announce(errorMessage, 'assertive');
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveData = async () => {
    if (!finalData) return;
    
    try {
      setProcessing(true);
      setError(null);
      announce('Guardando datos del manifiesto', 'polite');
      
      await saveManifiestoData(finalData);
      await saveSession();
      
      if (onDataExtracted) {
        onDataExtracted(finalData);
      }
      
      announce('Manifiesto procesado y guardado correctamente', 'assertive');
      
      // Reset for next scan
      setTimeout(() => {
        resetWorkflow();
        announce('Listo para procesar un nuevo manifiesto', 'polite');
      }, 2000);
      
    } catch (error) {
      console.error('Error saving data:', error);
      const errorMessage = 'Error al guardar los datos del manifiesto';
      setError(errorMessage);
      announce(errorMessage, 'assertive');
    } finally {
      setProcessing(false);
    }
  };

  const handleAccessibilitySettingsOpen = () => {
    saveFocus();
    setShowAccessibilitySettings(true);
    announce('Abriendo configuración de accesibilidad', 'polite');
  };

  const handleAccessibilitySettingsClose = () => {
    setShowAccessibilitySettings(false);
    restoreFocus();
    announce('Configuración de accesibilidad cerrada', 'polite');
  };

  const renderCurrentStep = () => {
    switch (processingState.currentStep) {
      case ScannerStep.IMAGE_UPLOAD:
        return (
          <LazyImageUploaderWithSkeleton
            onImageSelected={handleImageSelected}
            isProcessing={isProcessing}
            error={error}
            accessibilityLabel={ariaLabels.imageUpload}
            accessibilityHint="Selecciona una imagen del manifiesto para procesar"
          />
        );
        
      case ScannerStep.OCR_PROCESSING:
        return (
          <LazyOCRProcessorWithSkeleton
            imageData={imageData!}
            onTextExtracted={handleTextExtracted}
            onError={(error) => {
              setError(error);
              announce(`Error en OCR: ${error}`, 'assertive');
            }}
            accessibilityLabel={ariaLabels.ocrProgress}
            accessibilityHint="Procesando imagen para extraer texto"
          />
        );
        
      case ScannerStep.DATA_EDITING:
      case ScannerStep.REVIEW_SAVE:
        return (
          <LazyDataEditorWithSkeleton
            data={parsedData || {}}
            onDataChanged={handleDataEdited}
            validationRules={getValidationRules()}
            isReadOnly={processingState.currentStep === ScannerStep.REVIEW_SAVE}
            onSave={processingState.currentStep === ScannerStep.REVIEW_SAVE ? handleSaveData : undefined}
            accessibilityLabel={ariaLabels.dataEditor}
            accessibilityHint={
              processingState.currentStep === ScannerStep.DATA_EDITING
                ? "Revisa y edita los datos extraídos del manifiesto"
                : "Revisa los datos finales antes de guardar"
            }
          />
        );
        
      default:
        return (
          <View style={styles.centerContent}>
            <Text 
              style={styles.statusText}
              accessibilityRole="text"
              accessibilityLabel="Procesando datos del manifiesto"
            >
              Procesando...
            </Text>
          </View>
        );
    }
  };

  return (
    <View 
      style={styles.container}
      accessibilityRole="main"
      accessibilityLabel={ariaLabels.navigation}
    >
      {/* Skip link for keyboard users */}
      <TouchableOpacity
        style={styles.skipLink}
        onPress={() => {
          if (mainContentRef.current) {
            focusFirst(mainContentRef.current as any);
          }
        }}
        accessibilityLabel="Saltar a contenido principal"
        accessibilityRole="button"
      >
        <Text style={styles.skipLinkText}>Saltar a contenido principal</Text>
      </TouchableOpacity>

      {/* Accessibility settings button */}
      <TouchableOpacity
        style={styles.accessibilityButton}
        onPress={handleAccessibilitySettingsOpen}
        accessibilityLabel="Configuración de accesibilidad"
        accessibilityHint="Abre las opciones de accesibilidad"
        accessibilityRole="button"
      >
        <Text style={styles.accessibilityButtonText}>♿</Text>
      </TouchableOpacity>

      {/* Navigation */}
      <ScannerNavigation
        currentStep={processingState.currentStep}
        completedSteps={processingState.completedSteps}
        onStepPress={navigateToStep}
        isProcessing={isProcessing}
        accessibilityLabel={ariaLabels.breadcrumbs}
      />

      {/* Main content */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        ref={mainContentRef}
        accessibilityRole="region"
        accessibilityLabel="Contenido principal del escáner"
      >
        {error && (
          <View 
            style={styles.errorContainer}
            accessibilityRole="alert"
            accessibilityLiveRegion="assertive"
          >
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {renderCurrentStep()}
      </ScrollView>

      {/* Accessibility Settings Modal */}
      <AccessibilitySettings
        visible={showAccessibilitySettings}
        onClose={handleAccessibilitySettingsClose}
      />

      {/* Keyboard shortcuts help */}
      {options.screenReader && (
        <View 
          style={styles.keyboardHelp}
          accessibilityRole="region"
          accessibilityLabel="Atajos de teclado disponibles"
        >
          <Text style={styles.keyboardHelpText}>
            Atajos: Ctrl+U (cargar), Ctrl+S (guardar), Ctrl+E (exportar), Alt+A (accesibilidad)
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  skipLink: {
    position: 'absolute',
    top: -40,
    left: 6,
    backgroundColor: '#007AFF',
    color: 'white',
    padding: 8,
    borderRadius: 4,
    zIndex: 1000,
  },
  skipLinkText: {
    color: 'white',
    fontSize: 14,
  },
  accessibilityButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 40,
    height: 40,
    backgroundColor: '#007AFF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  accessibilityButtonText: {
    color: 'white',
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingTop: 60, // Account for accessibility button
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  statusText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    borderColor: '#f44336',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 16,
  },
  keyboardHelp: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 8,
  },
  keyboardHelpText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
  },
});

export { AccessibleManifiestoScanner };