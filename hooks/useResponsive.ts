/**
 * useResponsive Hook
 * Provides responsive utilities and device information for React components
 */

import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';
import {
  getDeviceType,
  getScreenDimensions,
  isMobile,
  isTablet,
  isDesktop,
  isTouchDevice,
  getLayoutConfig,
  getGridConfig,
  getButtonSize,
  getModalSize,
  getNavigationConfig,
  getImageSize,
  getResponsiveSpacing,
  getResponsiveFontSize,
  createResponsiveStyles,
  DeviceType,
  ResponsiveLayoutConfig,
  GridConfig,
  NavigationConfig,
} from '../utils/manifiesto/responsive';

export interface ResponsiveInfo {
  deviceType: DeviceType;
  screenWidth: number;
  screenHeight: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  layoutConfig: ReturnType<typeof getLayoutConfig>;
  gridConfig: GridConfig;
  buttonSize: ReturnType<typeof getButtonSize>;
  modalSize: ReturnType<typeof getModalSize>;
  navigationConfig: NavigationConfig;
}

export const useResponsive = (layoutConfig?: ResponsiveLayoutConfig): ResponsiveInfo => {
  const [responsiveInfo, setResponsiveInfo] = useState<ResponsiveInfo>(() => {
    const { width, height } = getScreenDimensions();
    const deviceType = getDeviceType();
    
    return {
      deviceType,
      screenWidth: width,
      screenHeight: height,
      isMobile: deviceType === 'mobile',
      isTablet: deviceType === 'tablet',
      isDesktop: deviceType === 'desktop',
      isTouchDevice: isTouchDevice(),
      layoutConfig: getLayoutConfig(layoutConfig),
      gridConfig: getGridConfig(),
      buttonSize: getButtonSize(),
      modalSize: getModalSize(),
      navigationConfig: getNavigationConfig(),
    };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      const deviceType = getDeviceType();
      
      setResponsiveInfo({
        deviceType,
        screenWidth: window.width,
        screenHeight: window.height,
        isMobile: deviceType === 'mobile',
        isTablet: deviceType === 'tablet',
        isDesktop: deviceType === 'desktop',
        isTouchDevice: isTouchDevice(),
        layoutConfig: getLayoutConfig(layoutConfig),
        gridConfig: getGridConfig(),
        buttonSize: getButtonSize(),
        modalSize: getModalSize(),
        navigationConfig: getNavigationConfig(),
      });
    });

    return () => subscription?.remove();
  }, [layoutConfig]);

  return responsiveInfo;
};

// Hook for responsive spacing
export const useResponsiveSpacing = () => {
  const { deviceType } = useResponsive();
  
  return {
    spacing: (mobile: number, tablet?: number, desktop?: number) =>
      getResponsiveSpacing(mobile, tablet, desktop),
    
    // Common spacing values
    xs: getResponsiveSpacing(4, 6, 8),
    sm: getResponsiveSpacing(8, 12, 16),
    md: getResponsiveSpacing(16, 24, 32),
    lg: getResponsiveSpacing(24, 32, 48),
    xl: getResponsiveSpacing(32, 48, 64),
  };
};

// Hook for responsive font sizes
export const useResponsiveFontSize = () => {
  const { deviceType } = useResponsive();
  
  return {
    fontSize: (mobile: number, tablet?: number, desktop?: number) =>
      getResponsiveFontSize(mobile, tablet, desktop),
    
    // Common font sizes
    xs: getResponsiveFontSize(10, 11, 12),
    sm: getResponsiveFontSize(12, 14, 16),
    md: getResponsiveFontSize(14, 16, 18),
    lg: getResponsiveFontSize(16, 18, 20),
    xl: getResponsiveFontSize(18, 20, 24),
    xxl: getResponsiveFontSize(20, 24, 28),
    title: getResponsiveFontSize(24, 28, 32),
  };
};

// Hook for responsive styles
export const useResponsiveStyles = <T extends Record<string, any>>(
  mobileStyles: T,
  tabletStyles?: Partial<T>,
  desktopStyles?: Partial<T>
): T => {
  const { deviceType } = useResponsive();
  
  return createResponsiveStyles(mobileStyles, tabletStyles, desktopStyles);
};

// Hook for responsive image sizing
export const useResponsiveImage = (aspectRatio?: number) => {
  const { screenWidth, deviceType } = useResponsive();
  
  return getImageSize(aspectRatio);
};

// Hook for responsive grid layout
export const useResponsiveGrid = () => {
  const { gridConfig, deviceType } = useResponsive();
  
  const getItemWidth = (itemsPerRow?: number) => {
    const columns = itemsPerRow || gridConfig.columns;
    const totalGap = (columns - 1) * gridConfig.gap;
    return (gridConfig.maxWidth! - totalGap) / columns;
  };
  
  const getGridStyles = () => ({
    container: {
      maxWidth: gridConfig.maxWidth,
      alignSelf: 'center' as const,
    },
    row: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      marginHorizontal: -gridConfig.gap / 2,
    },
    item: {
      paddingHorizontal: gridConfig.gap / 2,
      marginBottom: gridConfig.gap,
    },
  });
  
  return {
    ...gridConfig,
    getItemWidth,
    getGridStyles,
  };
};

// Hook for responsive navigation
export const useResponsiveNavigation = () => {
  const { navigationConfig, deviceType } = useResponsive();
  
  const getNavigationHeight = () => {
    switch (deviceType) {
      case 'mobile':
        return 60; // Tab bar height
      case 'tablet':
        return 80; // Drawer header height
      case 'desktop':
        return 64; // Sidebar header height
      default:
        return 60;
    }
  };
  
  const getSidebarWidth = () => {
    switch (deviceType) {
      case 'tablet':
        return 280;
      case 'desktop':
        return 320;
      default:
        return 0;
    }
  };
  
  return {
    ...navigationConfig,
    navigationHeight: getNavigationHeight(),
    sidebarWidth: getSidebarWidth(),
  };
};

export default useResponsive;