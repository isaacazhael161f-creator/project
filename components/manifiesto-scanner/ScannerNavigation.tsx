/**
 * Scanner Navigation Component
 * Provides breadcrumbs, progress indicators, and step navigation
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useManifiestoScannerStore, ScannerStep } from '../../stores/manifiestoScannerStore';
import { useResponsive, useResponsiveFontSize, useResponsiveSpacing } from '../../hooks/useResponsive';

const { width: screenWidth } = Dimensions.get('window');

interface StepInfo {
  key: ScannerStep;
  title: string;
  shortTitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}

const STEPS: StepInfo[] = [
  {
    key: ScannerStep.IMAGE_UPLOAD,
    title: 'Cargar Imagen',
    shortTitle: 'Imagen',
    icon: 'camera',
    description: 'Selecciona o toma una foto del manifiesto'
  },
  {
    key: ScannerStep.OCR_PROCESSING,
    title: 'Procesar OCR',
    shortTitle: 'OCR',
    icon: 'scan',
    description: 'Extrae el texto de la imagen'
  },
  {
    key: ScannerStep.DATA_PARSING,
    title: 'Analizar Datos',
    shortTitle: 'Análisis',
    icon: 'analytics',
    description: 'Identifica y organiza la información'
  },
  {
    key: ScannerStep.DATA_EDITING,
    title: 'Editar Datos',
    shortTitle: 'Edición',
    icon: 'create',
    description: 'Revisa y corrige los datos extraídos'
  },
  {
    key: ScannerStep.REVIEW_SAVE,
    title: 'Revisar y Guardar',
    shortTitle: 'Guardar',
    icon: 'checkmark-circle',
    description: 'Confirma y guarda el manifiesto procesado'
  }
];

interface ScannerNavigationProps {
  showFullNavigation?: boolean;
  onStepPress?: (step: ScannerStep) => void;
}

export const ScannerNavigation: React.FC<ScannerNavigationProps> = ({
  showFullNavigation = true,
  onStepPress
}) => {
  const { isMobile, isTablet } = useResponsive();
  const fontSize = useResponsiveFontSize();
  const spacing = useResponsiveSpacing();
  
  const {
    processingState,
    navigateToStep,
    isProcessing
  } = useManifiestoScannerStore();

  const handleStepPress = (step: ScannerStep) => {
    if (isProcessing) return;
    
    if (processingState.canNavigateToStep(step)) {
      navigateToStep(step);
      onStepPress?.(step);
    }
  };

  const getStepStatus = (step: ScannerStep): 'completed' | 'current' | 'available' | 'disabled' => {
    if (processingState.completedSteps.has(step)) return 'completed';
    if (processingState.currentStep === step) return 'current';
    if (processingState.canNavigateToStep(step)) return 'available';
    return 'disabled';
  };

  const getStepStyles = (status: string) => {
    const baseStyle = {
      ...styles.stepButton,
      opacity: isProcessing ? 0.6 : 1
    };

    switch (status) {
      case 'completed':
        return {
          ...baseStyle,
          backgroundColor: '#34C759',
          borderColor: '#34C759'
        };
      case 'current':
        return {
          ...baseStyle,
          backgroundColor: '#007AFF',
          borderColor: '#007AFF'
        };
      case 'available':
        return {
          ...baseStyle,
          backgroundColor: 'white',
          borderColor: '#007AFF'
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: '#f0f0f0',
          borderColor: '#ddd'
        };
    }
  };

  const getTextStyles = (status: string) => {
    switch (status) {
      case 'completed':
      case 'current':
        return { color: 'white' };
      case 'available':
        return { color: '#007AFF' };
      default:
        return { color: '#999' };
    }
  };

  const getIconName = (step: StepInfo, status: string): keyof typeof Ionicons.glyphMap => {
    if (status === 'completed') return 'checkmark';
    if (status === 'current' && isProcessing) return 'hourglass';
    return step.icon;
  };

  // Progress bar component
  const ProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBarBackground}>
        <View 
          style={[
            styles.progressBarFill, 
            { width: `${processingState.progress}%` }
          ]} 
        />
      </View>
      <Text style={[styles.progressText, { fontSize: fontSize.sm }]}>
        {processingState.progress}% completado
      </Text>
    </View>
  );

  // Breadcrumb component for mobile
  const Breadcrumbs = () => {
    const currentStepIndex = STEPS.findIndex(step => step.key === processingState.currentStep);
    
    return (
      <View style={styles.breadcrumbContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.breadcrumbContent}
        >
          {STEPS.map((step, index) => {
            const status = getStepStatus(step.key);
            const isLast = index === STEPS.length - 1;
            
            return (
              <View key={step.key} style={styles.breadcrumbItem}>
                <TouchableOpacity
                  style={[styles.breadcrumbStep, getStepStyles(status)]}
                  onPress={() => handleStepPress(step.key)}
                  disabled={status === 'disabled' || isProcessing}
                >
                  <Ionicons
                    name={getIconName(step, status)}
                    size={16}
                    color={getTextStyles(status).color}
                  />
                  <Text style={[styles.breadcrumbText, getTextStyles(status), { fontSize: fontSize.xs }]}>
                    {step.shortTitle}
                  </Text>
                </TouchableOpacity>
                
                {!isLast && (
                  <Ionicons
                    name="chevron-forward"
                    size={12}
                    color="#ccc"
                    style={styles.breadcrumbArrow}
                  />
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  // Full navigation for tablet/desktop
  const FullNavigation = () => (
    <View style={styles.fullNavigationContainer}>
      {STEPS.map((step, index) => {
        const status = getStepStatus(step.key);
        const isLast = index === STEPS.length - 1;
        
        return (
          <View key={step.key} style={styles.fullNavigationItem}>
            <TouchableOpacity
              style={[styles.fullStepButton, getStepStyles(status)]}
              onPress={() => handleStepPress(step.key)}
              disabled={status === 'disabled' || isProcessing}
            >
              <View style={styles.stepIconContainer}>
                <Ionicons
                  name={getIconName(step, status)}
                  size={24}
                  color={getTextStyles(status).color}
                />
              </View>
              
              <View style={styles.stepTextContainer}>
                <Text style={[styles.stepTitle, getTextStyles(status), { fontSize: fontSize.md }]}>
                  {step.title}
                </Text>
                <Text style={[styles.stepDescription, getTextStyles(status), { fontSize: fontSize.sm }]}>
                  {step.description}
                </Text>
              </View>
            </TouchableOpacity>
            
            {!isLast && (
              <View style={styles.stepConnector}>
                <View style={[
                  styles.connectorLine,
                  { backgroundColor: status === 'completed' ? '#34C759' : '#ddd' }
                ]} />
              </View>
            )}
          </View>
        );
      })}
    </View>
  );

  const responsiveStyles = {
    container: {
      ...styles.container,
      padding: spacing.md,
    }
  };

  return (
    <View style={responsiveStyles.container}>
      <ProgressBar />
      
      {isMobile ? (
        <Breadcrumbs />
      ) : showFullNavigation ? (
        <FullNavigation />
      ) : (
        <Breadcrumbs />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },

  // Progress bar styles
  progressContainer: {
    marginBottom: 16,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 3,
  },
  progressText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 8,
    fontWeight: '500',
  },

  // Breadcrumb styles (mobile)
  breadcrumbContainer: {
    height: 60,
  },
  breadcrumbContent: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breadcrumbStep: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 80,
    justifyContent: 'center',
  },
  breadcrumbText: {
    marginLeft: 4,
    fontWeight: '500',
  },
  breadcrumbArrow: {
    marginHorizontal: 8,
  },

  // Full navigation styles (tablet/desktop)
  fullNavigationContainer: {
    paddingVertical: 8,
  },
  fullNavigationItem: {
    marginBottom: 8,
  },
  fullStepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  stepIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepTextContainer: {
    flex: 1,
  },
  stepTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  stepDescription: {
    opacity: 0.8,
    lineHeight: 18,
  },
  stepConnector: {
    alignItems: 'center',
    height: 16,
  },
  connectorLine: {
    width: 2,
    height: '100%',
  },

  // Common step button styles
  stepButton: {
    borderWidth: 2,
    borderRadius: 8,
  },
});

export default ScannerNavigation;