/**
 * Responsive Navigation Component
 * Provides adaptive navigation between sections based on device type
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive, useResponsiveNavigation, useResponsiveFontSize, useResponsiveSpacing } from '../../hooks/useResponsive';

export interface NavigationStep {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  completed?: boolean;
  active?: boolean;
}

export interface ResponsiveNavigationProps {
  steps: NavigationStep[];
  currentStepId: string;
  onStepPress: (stepId: string) => void;
  showProgress?: boolean;
}

const ResponsiveNavigation: React.FC<ResponsiveNavigationProps> = ({
  steps,
  currentStepId,
  onStepPress,
  showProgress = true,
}) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const { navigationConfig, navigationHeight, sidebarWidth } = useResponsiveNavigation();
  const fontSize = useResponsiveFontSize();
  const spacing = useResponsiveSpacing();
  
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const currentStepIndex = steps.findIndex(step => step.id === currentStepId);
  const progress = showProgress ? ((currentStepIndex + 1) / steps.length) * 100 : 0;

  // Mobile Tab Navigation
  const renderMobileNavigation = () => (
    <View style={styles.mobileContainer}>
      {/* Progress Bar */}
      {showProgress && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>
      )}
      
      {/* Current Step Header */}
      <View style={styles.mobileHeader}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setShowMobileMenu(true)}
        >
          <Ionicons name="menu" size={24} color="#007AFF" />
        </TouchableOpacity>
        
        <View style={styles.currentStepInfo}>
          <Text style={[styles.stepCounter, { fontSize: fontSize.sm }]}>
            Paso {currentStepIndex + 1} de {steps.length}
          </Text>
          <Text style={[styles.currentStepTitle, { fontSize: fontSize.lg }]}>
            {steps[currentStepIndex]?.title}
          </Text>
        </View>
        
        <View style={styles.menuButton} />
      </View>

      {/* Mobile Menu Modal */}
      <Modal
        visible={showMobileMenu}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMobileMenu(false)}
      >
        <View style={styles.mobileMenuContainer}>
          <View style={styles.mobileMenuHeader}>
            <Text style={[styles.mobileMenuTitle, { fontSize: fontSize.xl }]}>
              Pasos del Proceso
            </Text>
            <TouchableOpacity
              onPress={() => setShowMobileMenu(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.mobileMenuContent}>
            {steps.map((step, index) => (
              <TouchableOpacity
                key={step.id}
                style={[
                  styles.mobileMenuItem,
                  step.id === currentStepId && styles.mobileMenuItemActive,
                ]}
                onPress={() => {
                  onStepPress(step.id);
                  setShowMobileMenu(false);
                }}
              >
                <View style={styles.mobileMenuItemIcon}>
                  <Ionicons
                    name={step.completed ? 'checkmark-circle' : step.icon}
                    size={24}
                    color={
                      step.completed
                        ? '#34C759'
                        : step.id === currentStepId
                        ? '#007AFF'
                        : '#666'
                    }
                  />
                </View>
                <View style={styles.mobileMenuItemContent}>
                  <Text style={[
                    styles.mobileMenuItemTitle,
                    { fontSize: fontSize.md },
                    step.id === currentStepId && styles.mobileMenuItemTitleActive,
                  ]}>
                    {step.title}
                  </Text>
                  <Text style={[styles.mobileMenuItemStep, { fontSize: fontSize.sm }]}>
                    Paso {index + 1}
                  </Text>
                </View>
                {step.id === currentStepId && (
                  <Ionicons name="chevron-forward" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );

  // Tablet/Desktop Sidebar Navigation
  const renderSidebarNavigation = () => (
    <View style={[styles.sidebarContainer, { width: sidebarWidth }]}>
      <View style={styles.sidebarHeader}>
        <Text style={[styles.sidebarTitle, { fontSize: fontSize.xl }]}>
          Escáner de Manifiestos
        </Text>
        {showProgress && (
          <View style={styles.sidebarProgress}>
            <Text style={[styles.progressText, { fontSize: fontSize.sm }]}>
              Progreso: {Math.round(progress)}%
            </Text>
            <View style={styles.sidebarProgressBar}>
              <View style={[styles.progressBar, { width: `${progress}%` }]} />
            </View>
          </View>
        )}
      </View>
      
      <ScrollView style={styles.sidebarContent}>
        {steps.map((step, index) => (
          <TouchableOpacity
            key={step.id}
            style={[
              styles.sidebarItem,
              step.id === currentStepId && styles.sidebarItemActive,
            ]}
            onPress={() => onStepPress(step.id)}
          >
            <View style={styles.sidebarItemIcon}>
              <Ionicons
                name={step.completed ? 'checkmark-circle' : step.icon}
                size={20}
                color={
                  step.completed
                    ? '#34C759'
                    : step.id === currentStepId
                    ? '#007AFF'
                    : '#666'
                }
              />
            </View>
            <View style={styles.sidebarItemContent}>
              <Text style={[
                styles.sidebarItemTitle,
                { fontSize: fontSize.md },
                step.id === currentStepId && styles.sidebarItemTitleActive,
              ]}>
                {step.title}
              </Text>
              <Text style={[styles.sidebarItemStep, { fontSize: fontSize.xs }]}>
                Paso {index + 1}
              </Text>
            </View>
            {step.completed && (
              <View style={styles.completedBadge}>
                <Ionicons name="checkmark" size={12} color="white" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // Breadcrumbs for tablet/desktop
  const renderBreadcrumbs = () => {
    if (!navigationConfig.showBreadcrumbs) return null;

    return (
      <View style={styles.breadcrumbsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.breadcrumbsContent}
        >
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <TouchableOpacity
                style={[
                  styles.breadcrumbItem,
                  step.id === currentStepId && styles.breadcrumbItemActive,
                ]}
                onPress={() => onStepPress(step.id)}
              >
                <Ionicons
                  name={step.completed ? 'checkmark-circle' : step.icon}
                  size={16}
                  color={
                    step.completed
                      ? '#34C759'
                      : step.id === currentStepId
                      ? '#007AFF'
                      : '#666'
                  }
                />
                <Text style={[
                  styles.breadcrumbText,
                  { fontSize: fontSize.sm },
                  step.id === currentStepId && styles.breadcrumbTextActive,
                ]}>
                  {step.title}
                </Text>
              </TouchableOpacity>
              {index < steps.length - 1 && (
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color="#ccc"
                  style={styles.breadcrumbSeparator}
                />
              )}
            </React.Fragment>
          ))}
        </ScrollView>
      </View>
    );
  };

  if (isMobile) {
    return renderMobileNavigation();
  }

  return (
    <View style={styles.desktopContainer}>
      {renderSidebarNavigation()}
      <View style={styles.mainContent}>
        {renderBreadcrumbs()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Mobile styles
  mobileContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  progressContainer: {
    height: 3,
    backgroundColor: '#f0f0f0',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  mobileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 60,
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentStepInfo: {
    flex: 1,
    alignItems: 'center',
  },
  stepCounter: {
    color: '#666',
    marginBottom: 2,
  },
  currentStepTitle: {
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },

  // Mobile menu styles
  mobileMenuContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  mobileMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  mobileMenuTitle: {
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  mobileMenuContent: {
    flex: 1,
  },
  mobileMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  mobileMenuItemActive: {
    backgroundColor: '#f8f9ff',
  },
  mobileMenuItemIcon: {
    marginRight: 16,
  },
  mobileMenuItemContent: {
    flex: 1,
  },
  mobileMenuItemTitle: {
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  mobileMenuItemTitleActive: {
    color: '#007AFF',
  },
  mobileMenuItemStep: {
    color: '#666',
  },

  // Sidebar styles
  sidebarContainer: {
    backgroundColor: 'white',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    height: '100%',
  },
  sidebarHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sidebarTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  sidebarProgress: {
    marginTop: 8,
  },
  progressText: {
    color: '#666',
    marginBottom: 8,
  },
  sidebarProgressBar: {
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
  },
  sidebarContent: {
    flex: 1,
    paddingVertical: 8,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 8,
    borderRadius: 8,
  },
  sidebarItemActive: {
    backgroundColor: '#f8f9ff',
  },
  sidebarItemIcon: {
    marginRight: 12,
  },
  sidebarItemContent: {
    flex: 1,
  },
  sidebarItemTitle: {
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  sidebarItemTitleActive: {
    color: '#007AFF',
  },
  sidebarItemStep: {
    color: '#666',
  },
  completedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Desktop container
  desktopContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  mainContent: {
    flex: 1,
  },

  // Breadcrumbs styles
  breadcrumbsContainer: {
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 12,
  },
  breadcrumbsContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  breadcrumbItemActive: {
    backgroundColor: '#e3f2fd',
  },
  breadcrumbText: {
    marginLeft: 6,
    color: '#666',
  },
  breadcrumbTextActive: {
    color: '#007AFF',
    fontWeight: '500',
  },
  breadcrumbSeparator: {
    marginHorizontal: 8,
  },
});

export default ResponsiveNavigation;