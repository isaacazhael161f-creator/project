/**
 * Skeleton Loader Component
 * Provides skeleton screens during component loading for better UX
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { useResponsive, useResponsiveSpacing } from '../../hooks/useResponsive';

interface SkeletonLoaderProps {
  type: 'ocr-processor' | 'data-editor' | 'image-uploader' | 'generic';
  height?: number;
  width?: number | string;
  showProgress?: boolean;
  showButtons?: boolean;
  showSections?: number;
  showFields?: number;
  showUploadArea?: boolean;
  animated?: boolean;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  type,
  height = 200,
  width = '100%',
  showProgress = false,
  showButtons = false,
  showSections = 0,
  showFields = 0,
  showUploadArea = false,
  animated = true,
}) => {
  const { isMobile, isTablet } = useResponsive();
  const spacing = useResponsiveSpacing();
  const shimmerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) return;

    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnimation, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    shimmer.start();

    return () => shimmer.stop();
  }, [shimmerAnimation, animated]);

  const shimmerStyle = animated ? {
    opacity: shimmerAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.7],
    }),
  } : {};

  const SkeletonBox: React.FC<{
    width: number | string;
    height: number;
    style?: any;
  }> = ({ width, height, style }) => (
    <Animated.View
      style={[
        styles.skeletonBox,
        { width, height },
        shimmerStyle,
        style,
      ]}
    />
  );

  const renderOCRProcessorSkeleton = () => (
    <View style={[styles.container, { height, padding: spacing.md }]}>
      {/* Header */}
      <View style={styles.header}>
        <SkeletonBox width={24} height={24} style={styles.icon} />
        <SkeletonBox width={200} height={20} style={styles.title} />
      </View>

      {/* Progress container */}
      {showProgress && (
        <View style={[styles.progressContainer, { marginBottom: spacing.md }]}>
          <SkeletonBox width="100%" height={16} style={styles.progressTitle} />
          <SkeletonBox width="100%" height={8} style={styles.progressBar} />
          <SkeletonBox width={150} height={14} style={styles.progressMessage} />
        </View>
      )}

      {/* Buttons */}
      {showButtons && (
        <View style={styles.buttonsContainer}>
          <SkeletonBox width={120} height={44} style={styles.button} />
          <SkeletonBox width={140} height={44} style={styles.button} />
        </View>
      )}

      {/* Text preview area */}
      <View style={styles.textPreviewContainer}>
        <SkeletonBox width={120} height={16} style={styles.textPreviewTitle} />
        <View style={styles.textPreview}>
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonBox
              key={i}
              width={`${Math.random() * 40 + 60}%`}
              height={12}
              style={[styles.textLine, { marginBottom: 4 }]}
            />
          ))}
        </View>
      </View>
    </View>
  );

  const renderDataEditorSkeleton = () => (
    <View style={[styles.container, { height, padding: spacing.md }]}>
      {/* Title */}
      <SkeletonBox width={200} height={24} style={styles.editorTitle} />

      {/* Sections */}
      {Array.from({ length: showSections }).map((_, sectionIndex) => (
        <View key={sectionIndex} style={styles.section}>
          <SkeletonBox width={180} height={18} style={styles.sectionTitle} />
          
          {/* Fields in section */}
          <View style={isMobile ? styles.singleColumn : styles.multiColumn}>
            {Array.from({ length: Math.ceil(showFields / showSections) }).map((_, fieldIndex) => (
              <View
                key={fieldIndex}
                style={[
                  styles.fieldContainer,
                  isMobile ? {} : { width: '48%' }
                ]}
              >
                <SkeletonBox width={100} height={14} style={styles.fieldLabel} />
                <SkeletonBox width="100%" height={40} style={styles.fieldInput} />
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );

  const renderImageUploaderSkeleton = () => (
    <View style={[styles.container, { height, padding: spacing.md }]}>
      {/* Header */}
      <View style={styles.header}>
        <SkeletonBox width={24} height={24} style={styles.icon} />
        <SkeletonBox width={180} height={20} style={styles.title} />
      </View>

      {/* Upload area */}
      {showUploadArea && (
        <View style={styles.uploadArea}>
          <SkeletonBox width={64} height={64} style={styles.uploadIcon} />
          <SkeletonBox width={200} height={16} style={styles.uploadText} />
          <SkeletonBox width={160} height={14} style={styles.uploadSubtext} />
          <SkeletonBox width={120} height={40} style={styles.uploadButton} />
        </View>
      )}

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <SkeletonBox width={100} height={36} style={styles.controlButton} />
        <SkeletonBox width={120} height={36} style={styles.controlButton} />
      </View>
    </View>
  );

  const renderGenericSkeleton = () => (
    <View style={[styles.container, { height }]}>
      <SkeletonBox width={width} height={height} />
    </View>
  );

  const renderSkeleton = () => {
    switch (type) {
      case 'ocr-processor':
        return renderOCRProcessorSkeleton();
      case 'data-editor':
        return renderDataEditorSkeleton();
      case 'image-uploader':
        return renderImageUploaderSkeleton();
      default:
        return renderGenericSkeleton();
    }
  };

  return (
    <View style={styles.wrapper}>
      {renderSkeleton()}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    backgroundColor: '#f5f5f5',
  },
  skeletonBox: {
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    borderRadius: 12,
    marginRight: 10,
  },
  title: {
    borderRadius: 4,
  },
  
  // Progress styles
  progressContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
  },
  progressTitle: {
    borderRadius: 4,
    marginBottom: 15,
  },
  progressBar: {
    borderRadius: 4,
    marginBottom: 10,
  },
  progressMessage: {
    borderRadius: 4,
    alignSelf: 'center',
  },
  
  // Button styles
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  button: {
    borderRadius: 8,
  },
  
  // Text preview styles
  textPreviewContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
  },
  textPreviewTitle: {
    borderRadius: 4,
    marginBottom: 10,
  },
  textPreview: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
  },
  textLine: {
    borderRadius: 2,
  },
  
  // Data editor styles
  editorTitle: {
    borderRadius: 4,
    alignSelf: 'center',
    marginBottom: 20,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    borderRadius: 4,
    marginBottom: 16,
  },
  singleColumn: {
    flexDirection: 'column',
  },
  multiColumn: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    borderRadius: 4,
    marginBottom: 8,
  },
  fieldInput: {
    borderRadius: 8,
  },
  
  // Upload area styles
  uploadArea: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  uploadIcon: {
    borderRadius: 32,
    marginBottom: 16,
  },
  uploadText: {
    borderRadius: 4,
    marginBottom: 8,
  },
  uploadSubtext: {
    borderRadius: 4,
    marginBottom: 20,
  },
  uploadButton: {
    borderRadius: 8,
  },
  
  // Controls styles
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  controlButton: {
    borderRadius: 8,
  },
});