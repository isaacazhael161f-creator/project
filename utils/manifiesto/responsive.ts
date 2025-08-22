/**
 * Responsive Design Utilities
 * Provides breakpoints, device detection, and responsive styling helpers
 */

import { Dimensions, Platform } from 'react-native';

// Breakpoints configuration
export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1200,
} as const;

// Get current screen dimensions
export const getScreenDimensions = () => {
  const { width, height } = Dimensions.get('window');
  return { width, height };
};

// Device type detection
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export const getDeviceType = (): DeviceType => {
  const { width } = getScreenDimensions();
  
  if (width <= BREAKPOINTS.mobile) {
    return 'mobile';
  } else if (width <= BREAKPOINTS.tablet) {
    return 'tablet';
  } else {
    return 'desktop';
  }
};

// Check if device is mobile
export const isMobile = (): boolean => {
  return getDeviceType() === 'mobile';
};

// Check if device is tablet
export const isTablet = (): boolean => {
  return getDeviceType() === 'tablet';
};

// Check if device is desktop
export const isDesktop = (): boolean => {
  return getDeviceType() === 'desktop';
};

// Check if device supports touch
export const isTouchDevice = (): boolean => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }
    return false; // Assume no touch in test environment
  }
  return Platform.OS === 'ios' || Platform.OS === 'android';
};

// Responsive spacing
export const getResponsiveSpacing = (mobile: number, tablet?: number, desktop?: number) => {
  const deviceType = getDeviceType();
  
  switch (deviceType) {
    case 'mobile':
      return mobile;
    case 'tablet':
      return tablet || mobile * 1.5;
    case 'desktop':
      return desktop || tablet || mobile * 2;
    default:
      return mobile;
  }
};

// Responsive font sizes
export const getResponsiveFontSize = (mobile: number, tablet?: number, desktop?: number) => {
  const deviceType = getDeviceType();
  
  switch (deviceType) {
    case 'mobile':
      return mobile;
    case 'tablet':
      return tablet || mobile * 1.2;
    case 'desktop':
      return desktop || tablet || mobile * 1.4;
    default:
      return mobile;
  }
};

// Responsive layout configurations
export interface ResponsiveLayoutConfig {
  mobile: {
    columns: number;
    spacing: number;
    fontSize: number;
  };
  tablet: {
    columns: number;
    spacing: number;
    fontSize: number;
  };
  desktop: {
    columns: number;
    spacing: number;
    fontSize: number;
  };
}

export const DEFAULT_LAYOUT_CONFIG: ResponsiveLayoutConfig = {
  mobile: {
    columns: 1,
    spacing: 16,
    fontSize: 14,
  },
  tablet: {
    columns: 2,
    spacing: 24,
    fontSize: 16,
  },
  desktop: {
    columns: 3,
    spacing: 32,
    fontSize: 18,
  },
};

// Get layout configuration for current device
export const getLayoutConfig = (config: ResponsiveLayoutConfig = DEFAULT_LAYOUT_CONFIG) => {
  const deviceType = getDeviceType();
  return config[deviceType];
};

// Responsive grid system
export interface GridConfig {
  columns: number;
  gap: number;
  maxWidth?: number;
}

export const getGridConfig = (): GridConfig => {
  const deviceType = getDeviceType();
  const { width } = getScreenDimensions();
  
  switch (deviceType) {
    case 'mobile':
      return {
        columns: 1,
        gap: 16,
        maxWidth: width - 32,
      };
    case 'tablet':
      return {
        columns: 2,
        gap: 24,
        maxWidth: Math.min(width - 48, 800),
      };
    case 'desktop':
      return {
        columns: 3,
        gap: 32,
        maxWidth: Math.min(width - 64, 1200),
      };
    default:
      return {
        columns: 1,
        gap: 16,
        maxWidth: width - 32,
      };
  }
};

// Touch-optimized sizes
export const getTouchOptimizedSize = (baseSize: number): number => {
  if (isTouchDevice()) {
    return Math.max(baseSize, 44); // Minimum 44pt touch target
  }
  return baseSize;
};

// Responsive button sizes
export const getButtonSize = () => {
  const deviceType = getDeviceType();
  const isTouchEnabled = isTouchDevice();
  
  const baseSizes = {
    mobile: { height: 48, fontSize: 16, padding: 16 },
    tablet: { height: 52, fontSize: 18, padding: 20 },
    desktop: { height: 40, fontSize: 16, padding: 16 },
  };
  
  const size = baseSizes[deviceType];
  
  if (isTouchEnabled && deviceType === 'desktop') {
    // Desktop with touch support (like Surface)
    return {
      height: Math.max(size.height, 44),
      fontSize: size.fontSize,
      padding: size.padding,
    };
  }
  
  return size;
};

// Responsive modal/dialog sizes
export const getModalSize = () => {
  const { width, height } = getScreenDimensions();
  const deviceType = getDeviceType();
  
  switch (deviceType) {
    case 'mobile':
      return {
        width: width - 32,
        height: height * 0.9,
        maxWidth: width - 32,
        maxHeight: height * 0.9,
      };
    case 'tablet':
      return {
        width: Math.min(600, width - 64),
        height: height * 0.8,
        maxWidth: 600,
        maxHeight: height * 0.8,
      };
    case 'desktop':
      return {
        width: Math.min(800, width - 128),
        height: height * 0.7,
        maxWidth: 800,
        maxHeight: height * 0.7,
      };
    default:
      return {
        width: width - 32,
        height: height * 0.9,
        maxWidth: width - 32,
        maxHeight: height * 0.9,
      };
  }
};

// Responsive navigation configuration
export interface NavigationConfig {
  showTabBar: boolean;
  showSidebar: boolean;
  showBreadcrumbs: boolean;
  navigationStyle: 'tabs' | 'drawer' | 'sidebar';
}

export const getNavigationConfig = (): NavigationConfig => {
  const deviceType = getDeviceType();
  
  switch (deviceType) {
    case 'mobile':
      return {
        showTabBar: true,
        showSidebar: false,
        showBreadcrumbs: false,
        navigationStyle: 'tabs',
      };
    case 'tablet':
      return {
        showTabBar: false,
        showSidebar: true,
        showBreadcrumbs: true,
        navigationStyle: 'drawer',
      };
    case 'desktop':
      return {
        showTabBar: false,
        showSidebar: true,
        showBreadcrumbs: true,
        navigationStyle: 'sidebar',
      };
    default:
      return {
        showTabBar: true,
        showSidebar: false,
        showBreadcrumbs: false,
        navigationStyle: 'tabs',
      };
  }
};

// Responsive image sizes
export const getImageSize = (aspectRatio: number = 16/9) => {
  const { width } = getScreenDimensions();
  const deviceType = getDeviceType();
  
  let maxWidth: number;
  
  switch (deviceType) {
    case 'mobile':
      maxWidth = width - 32;
      break;
    case 'tablet':
      maxWidth = Math.min(600, width - 64);
      break;
    case 'desktop':
      maxWidth = Math.min(800, width - 128);
      break;
    default:
      maxWidth = width - 32;
  }
  
  return {
    width: maxWidth,
    height: maxWidth / aspectRatio,
  };
};

// Responsive text scaling
export const getTextScale = (): number => {
  if (Platform.OS === 'web') {
    return 1; // Web handles text scaling via CSS
  }
  
  const deviceType = getDeviceType();
  
  switch (deviceType) {
    case 'mobile':
      return 1;
    case 'tablet':
      return 1.1;
    case 'desktop':
      return 1.2;
    default:
      return 1;
  }
};

// Utility to create responsive styles
export const createResponsiveStyles = <T extends Record<string, any>>(
  mobileStyles: T,
  tabletStyles?: Partial<T>,
  desktopStyles?: Partial<T>
): T => {
  const deviceType = getDeviceType();
  
  switch (deviceType) {
    case 'mobile':
      return mobileStyles;
    case 'tablet':
      return { ...mobileStyles, ...tabletStyles };
    case 'desktop':
      return { ...mobileStyles, ...tabletStyles, ...desktopStyles };
    default:
      return mobileStyles;
  }
};