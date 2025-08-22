/**
 * Responsive Manifiesto Scanner Component
 * Main component that orchestrates the complete scanning workflow with responsive design
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { ManifiestoData } from '../../types/manifiesto';
import { useResponsive, useResponsiveNavigation, useResponsiveSpacing } from '../../hooks/useResponsive';

// Import components
import ResponsiveNavigation, { NavigationStep } from './ResponsiveNavigation';
import ImageUploader from './ImageUploader';
import OCRProcessor from './OCRProcessor';
import ResponsiveDataEditor from './ResponsiveDataEditor';
import { DEFAULT_VALIDATION_RULES } from '../../utils/manifiesto/validation';

export interface ResponsiveManifiestoScannerProps {
  onDataProcessed?: (data: ManifiestoData) => void;
  onStepChanged?: (stepId: string) => void;
}

type ScannerStep = 'upload' | 'ocr' | 'edit' | 'review' | 'complete';

interface ScannerState {
  currentStep: ScannerStep;
  imageData: string | null;
  extractedText: string | null;
  manifiestoData: Partial<ManifiestoData> | null;
  completedSteps: Set<ScannerStep>;
}

const SCANNER_STEPS: NavigationStep[] = [
  {
    id: 'upload',
    title: 'Cargar Imagen',
    icon: 'camera',
  },
  {
    id: 'ocr',
    title: 'Extraer Texto',
    icon: 'scan',
  },
  {
    id: 'edit',
    title: 'Editar Datos',
    icon: 'create',
  },
  {
    id: 'review',
    title: 'Revisar',
    icon: 'checkmark-circle',
  },
  {
    id: 'complete',
    title: 'Completar',
    icon: 'download',
  },
];

const ResponsiveManifiestoScanner: React.FC<ResponsiveManifiestoScannerProps> = ({
  onDataProcessed,
  onStepChanged,
}) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const { navigationConfig, sidebarWidth } = useResponsiveNavigation();
  const spacing = useResponsiveSpacing();

  const [state, setState] = useState<ScannerState>({
    currentStep: 'upload',
    imageData: null,
    extractedText: null,
    manifiestoData: null,
    completedSteps: new Set(),
  });

  // Update navigation steps with completion status
  const navigationSteps = SCANNER_STEPS.map(step => ({
    ...step,
    completed: state.completedSteps.has(step.id as ScannerStep),
    active: step.id === state.currentStep,
  }));

  // Handle step navigation
  const handleStepChange = useCallback((stepId: string) => {
    const step = stepId as ScannerStep;
    
    // Validate step transition
    const stepOrder: ScannerStep[] = ['upload', 'ocr', 'edit', 'review', 'complete'];
    const currentIndex = stepOrder.indexOf(state.currentStep);
    const targetIndex = stepOrder.indexOf(step);
    
    // Allow going back to any completed step or forward to next step
    if (state.completedSteps.has(step) || targetIndex === currentIndex + 1) {
      setState(prev => ({ ...prev, currentStep: step }));
      onStepChanged?.(stepId);
    }
  }, [state.currentStep, state.completedSteps, onStepChanged]);

  // Mark step as completed and move to next
  const completeStep = useCallback((step: ScannerStep, nextStep?: ScannerStep) => {
    setState(prev => ({
      ...prev,
      completedSteps: new Set([...prev.completedSteps, step]),
      currentStep: nextStep || prev.currentStep,
    }));
  }, []);

  // Handle image selection
  const handleImageSelected = useCallback((imageData: string) => {
    setState(prev => ({
      ...prev,
      imageData,
      extractedText: null,
      manifiestoData: null,
    }));
    completeStep('upload', 'ocr');
  }, [completeStep]);

  // Handle OCR completion
  const handleTextExtracted = useCallback((text: string) => {
    setState(prev => ({
      ...prev,
      extractedText: text,
      manifiestoData: {}, // Initialize with empty data for editing
    }));
    completeStep('ocr', 'edit');
  }, [completeStep]);

  // Handle data editing
  const handleDataChanged = useCallback((data: ManifiestoData) => {
    setState(prev => ({
      ...prev,
      manifiestoData: data,
    }));
    
    // Auto-complete edit step when data is valid
    if (data && Object.keys(data).length > 0) {
      completeStep('edit');
    }
  }, [completeStep]);

  // Handle OCR progress
  const handleOCRProgress = useCallback((progress: number) => {
    // Could be used to show progress in navigation
  }, []);

  // Handle OCR error
  const handleOCRError = useCallback((error: string) => {
    console.error('OCR Error:', error);
    // Could show error state in navigation
  }, []);

  // Render current step content
  const renderStepContent = () => {
    switch (state.currentStep) {
      case 'upload':
        return (
          <ImageUploader
            onImageSelected={handleImageSelected}
            supportedFormats={['jpg', 'jpeg', 'png', 'pdf']}
          />
        );

      case 'ocr':
        return (
          <OCRProcessor
            imageData={state.imageData!}
            onTextExtracted={handleTextExtracted}
            onProgress={handleOCRProgress}
            onError={handleOCRError}
          />
        );

      case 'edit':
        return (
          <ResponsiveDataEditor
            data={state.manifiestoData || {}}
            onDataChanged={handleDataChanged}
            validationRules={DEFAULT_VALIDATION_RULES}
          />
        );

      case 'review':
        return (
          <View style={styles.stepContent}>
            {/* Review component would go here */}
          </View>
        );

      case 'complete':
        return (
          <View style={styles.stepContent}>
            {/* Completion/export component would go here */}
          </View>
        );

      default:
        return null;
    }
  };

  // Get responsive layout styles
  const getLayoutStyles = () => {
    if (isMobile) {
      return {
        container: styles.mobileContainer,
        navigation: styles.mobileNavigation,
        content: styles.mobileContent,
      };
    } else {
      return {
        container: styles.desktopContainer,
        navigation: [styles.desktopNavigation, { width: sidebarWidth }],
        content: [styles.desktopContent, { marginLeft: navigationConfig.showSidebar ? sidebarWidth : 0 }],
      };
    }
  };

  const layoutStyles = getLayoutStyles();

  return (
    <SafeAreaView style={[styles.safeArea, layoutStyles.container]}>
      {/* Navigation */}
      <View style={layoutStyles.navigation}>
        <ResponsiveNavigation
          steps={navigationSteps}
          currentStepId={state.currentStep}
          onStepPress={handleStepChange}
          showProgress={true}
        />
      </View>

      {/* Main Content */}
      <View style={layoutStyles.content}>
        {renderStepContent()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  // Mobile layout
  mobileContainer: {
    flex: 1,
  },
  mobileNavigation: {
    // Navigation is handled by ResponsiveNavigation component
  },
  mobileContent: {
    flex: 1,
  },

  // Desktop layout
  desktopContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  desktopNavigation: {
    backgroundColor: 'white',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
  },
  desktopContent: {
    flex: 1,
  },

  // Step content
  stepContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ResponsiveManifiestoScanner;