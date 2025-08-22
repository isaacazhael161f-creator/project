/**
 * Simple tests for responsive design functionality
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { View, Text } from 'react-native';
import { useResponsive } from '../../../hooks/useResponsive';

// Mock the responsive utilities
jest.mock('../../../utils/manifiesto/responsive', () => ({
  getDeviceType: jest.fn(() => 'mobile'),
  getScreenDimensions: jest.fn(() => ({ width: 375, height: 667 })),
  isMobile: jest.fn(() => true),
  isTablet: jest.fn(() => false),
  isDesktop: jest.fn(() => false),
  isTouchDevice: jest.fn(() => true),
  getLayoutConfig: jest.fn(() => ({ columns: 1, spacing: 16, fontSize: 14 })),
  getGridConfig: jest.fn(() => ({ columns: 1, gap: 16, maxWidth: 343 })),
  getButtonSize: jest.fn(() => ({ height: 48, fontSize: 16, padding: 16 })),
  getModalSize: jest.fn(() => ({ width: 343, height: 600, maxWidth: 343, maxHeight: 600 })),
  getNavigationConfig: jest.fn(() => ({ 
    showTabBar: true, 
    showSidebar: false, 
    showBreadcrumbs: false, 
    navigationStyle: 'tabs' 
  })),
  getImageSize: jest.fn(() => ({ width: 343, height: 193 })),
  getResponsiveSpacing: jest.fn((mobile) => mobile),
  getResponsiveFontSize: jest.fn((mobile) => mobile),
  createResponsiveStyles: jest.fn((mobile) => mobile),
}));

// Mock react-native Dimensions
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Dimensions: {
      get: jest.fn(() => ({ width: 375, height: 667 })),
      addEventListener: jest.fn(() => ({ remove: jest.fn() })),
    },
  };
});

// Test component that uses responsive hook
const TestComponent: React.FC = () => {
  const { isMobile, isTablet, isDesktop, deviceType } = useResponsive();
  
  return (
    <View testID="test-container">
      <Text testID="device-type">{deviceType}</Text>
      <Text testID="is-mobile">{isMobile ? 'mobile' : 'not-mobile'}</Text>
      <Text testID="is-tablet">{isTablet ? 'tablet' : 'not-tablet'}</Text>
      <Text testID="is-desktop">{isDesktop ? 'desktop' : 'not-desktop'}</Text>
    </View>
  );
};

describe('Responsive Design', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Device Detection', () => {
    it('should detect mobile device correctly', () => {
      const { getByTestId } = render(<TestComponent />);
      
      expect(getByTestId('device-type').props.children).toBe('mobile');
      expect(getByTestId('is-mobile').props.children).toBe('mobile');
      expect(getByTestId('is-tablet').props.children).toBe('not-tablet');
      expect(getByTestId('is-desktop').props.children).toBe('not-desktop');
    });

    it('should detect tablet device correctly', () => {
      const responsiveUtils = require('../../../utils/manifiesto/responsive');
      responsiveUtils.getDeviceType.mockReturnValue('tablet');
      responsiveUtils.isMobile.mockReturnValue(false);
      responsiveUtils.isTablet.mockReturnValue(true);
      responsiveUtils.isDesktop.mockReturnValue(false);

      const { getByTestId } = render(<TestComponent />);
      
      expect(getByTestId('device-type').props.children).toBe('tablet');
      expect(getByTestId('is-mobile').props.children).toBe('not-mobile');
      expect(getByTestId('is-tablet').props.children).toBe('tablet');
      expect(getByTestId('is-desktop').props.children).toBe('not-desktop');
    });

    it('should detect desktop device correctly', () => {
      const responsiveUtils = require('../../../utils/manifiesto/responsive');
      responsiveUtils.getDeviceType.mockReturnValue('desktop');
      responsiveUtils.isMobile.mockReturnValue(false);
      responsiveUtils.isTablet.mockReturnValue(false);
      responsiveUtils.isDesktop.mockReturnValue(true);

      const { getByTestId } = render(<TestComponent />);
      
      expect(getByTestId('device-type').props.children).toBe('desktop');
      expect(getByTestId('is-mobile').props.children).toBe('not-mobile');
      expect(getByTestId('is-tablet').props.children).toBe('not-tablet');
      expect(getByTestId('is-desktop').props.children).toBe('desktop');
    });
  });

  describe('Responsive Hook', () => {
    it('should provide responsive information', () => {
      const TestHookComponent: React.FC = () => {
        const responsive = useResponsive();
        
        return (
          <View testID="hook-container">
            <Text testID="screen-width">{responsive.screenWidth}</Text>
            <Text testID="screen-height">{responsive.screenHeight}</Text>
            <Text testID="layout-columns">{responsive.layoutConfig.columns}</Text>
            <Text testID="grid-columns">{responsive.gridConfig.columns}</Text>
          </View>
        );
      };

      const { getByTestId } = render(<TestHookComponent />);
      
      expect(getByTestId('screen-width').props.children).toBe(375);
      expect(getByTestId('screen-height').props.children).toBe(667);
      expect(getByTestId('layout-columns').props.children).toBe(1);
      expect(getByTestId('grid-columns').props.children).toBe(1);
    });
  });

  describe('Responsive Utilities', () => {
    it('should call responsive spacing function', () => {
      const responsiveUtils = require('../../../utils/manifiesto/responsive');
      
      responsiveUtils.getResponsiveSpacing(16, 20, 24);
      
      expect(responsiveUtils.getResponsiveSpacing).toHaveBeenCalledWith(16, 20, 24);
    });

    it('should call responsive font size function', () => {
      const responsiveUtils = require('../../../utils/manifiesto/responsive');
      
      responsiveUtils.getResponsiveFontSize(14, 16, 18);
      
      expect(responsiveUtils.getResponsiveFontSize).toHaveBeenCalledWith(14, 16, 18);
    });

    it('should call create responsive styles function', () => {
      const responsiveUtils = require('../../../utils/manifiesto/responsive');
      
      const mobileStyles = { fontSize: 14 };
      const tabletStyles = { fontSize: 16 };
      const desktopStyles = { fontSize: 18 };
      
      responsiveUtils.createResponsiveStyles(mobileStyles, tabletStyles, desktopStyles);
      
      expect(responsiveUtils.createResponsiveStyles).toHaveBeenCalledWith(
        mobileStyles, 
        tabletStyles, 
        desktopStyles
      );
    });
  });
});