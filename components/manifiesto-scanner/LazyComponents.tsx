/**
 * Lazy Loading Components
 * Implements lazy loading for heavy components to improve initial load performance
 */

import React, { Suspense, lazy } from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonLoader } from './SkeletonLoader';

// Lazy load heavy components
const LazyOCRProcessor = lazy(() => import('./OCRProcessor'));
const LazyDataEditor = lazy(() => import('./DataEditor').then(module => ({ default: module.DataEditor })));
const LazyImageUploader = lazy(() => import('./ImageUploader'));

// Skeleton components for loading states
const OCRProcessorSkeleton = () => (
  <SkeletonLoader
    type="ocr-processor"
    height={400}
    showProgress
    showButtons
  />
);

const DataEditorSkeleton = () => (
  <SkeletonLoader
    type="data-editor"
    height={600}
    showSections={6}
    showFields={20}
  />
);

const ImageUploaderSkeleton = () => (
  <SkeletonLoader
    type="image-uploader"
    height={300}
    showUploadArea
  />
);

// Lazy wrapped components with error boundaries
export const LazyOCRProcessorWithSkeleton: React.FC<any> = (props) => (
  <Suspense fallback={<OCRProcessorSkeleton />}>
    <LazyOCRProcessor {...props} />
  </Suspense>
);

export const LazyDataEditorWithSkeleton: React.FC<any> = (props) => (
  <Suspense fallback={<DataEditorSkeleton />}>
    <LazyDataEditor {...props} />
  </Suspense>
);

export const LazyImageUploaderWithSkeleton: React.FC<any> = (props) => (
  <Suspense fallback={<ImageUploaderSkeleton />}>
    <LazyImageUploader {...props} />
  </Suspense>
);

// Preload components for better UX
export const preloadComponents = () => {
  // Preload components when user is likely to need them
  LazyOCRProcessor;
  LazyDataEditor;
  LazyImageUploader;
};

// Component visibility tracker for lazy loading
export const useComponentVisibility = (threshold = 0.1) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const ref = React.useRef<View>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef as any);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef as any);
      }
    };
  }, [threshold]);

  return { ref, isVisible };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});