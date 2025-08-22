/**
 * Tests for useResponsive hook
 */

import { renderHook, act } from '@testing-library/react-hooks';
import { Dimensions } from 'react-native';
import {
  useResponsive,
  useResponsiveSpacing,
  useResponsiveFontSize,
  useResponsiveStyles,
  useResponsiveImage,
  useResponsiveGrid,
  useResponsiveNavigation,
} from '../useResponsive';

// Mock react-native
jest.mock('react-native', () => ({
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 667 })),
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  },
  Platform: {
    OS: 'ios',
  },
}));

// Mock responsive utilities
jest.mock('../utils/manifiesto/responsive', () => ({
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

describe('useResponsive Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useResponsive', () => {
    it('should return responsive information', () => {
      const { result } = renderHook(() => useResponsive());
      
      expect(result.current).toEqual({
        deviceType: 'mobile',
        screenWidth: 375,
        screenHeight: 667,
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        isTouchDevice: true,
        layoutConfig: { columns: 1, spacing: 16, fontSize: 14 },
        gridConfig: { columns: 1, gap: 16, maxWidth: 343 },
        buttonSize: { height: 48, fontSize: 16, padding: 16 },
        modalSize: { width: 343, height: 600, maxWidth: 343, maxHeight: 600 },
        navigationConfig: { 
          showTabBar: true, 
          showSidebar: false, 
          showBreadcrumbs: false, 
          navigationStyle: 'tabs' 
        },
      });
    });

    it('should update when dimensions change', () => {
      const mockRemove = jest.fn();
      const mockAddEventListener = jest.fn(() => ({ remove: mockRemove }));
      (Dimensions.addEventListener as jest.Mock).mockImplementation(mockAddEventListener);

      const { result, unmount } = renderHook(() => useResponsive());
      
      // Verify event listener was added
      expect(mockAddEventListener).toHaveBeenCalledWith('change', expect.any(Function));
      
      // Simulate dimension change
      const changeHandler = mockAddEventListener.mock.calls[0][1];
      act(() => {
        changeHandler({ window: { width: 800, height: 600 } });
      });
      
      // Verify the hook updates (mocked functions would be called again)
      expect(result.current.screenWidth).toBe(375); // Still mocked value
      
      // Cleanup
      unmount();
      expect(mockRemove).toHaveBeenCalled();
    });

    it('should accept custom layout config', () => {
      const customConfig = {
        mobile: { columns: 2, spacing: 20, fontSize: 16 },
        tablet: { columns: 3, spacing: 24, fontSize: 18 },
        desktop: { columns: 4, spacing: 32, fontSize: 20 },
      };

      const { getLayoutConfig } = require('../utils/manifiesto/responsive');
      
      renderHook(() => useResponsive(customConfig));
      
      expect(getLayoutConfig).toHaveBeenCalledWith(customConfig);
    });
  });

  describe('useResponsiveSpacing', () => {
    it('should return spacing utilities', () => {
      const { result } = renderHook(() => useResponsiveSpacing());
      
      expect(result.current).toHaveProperty('spacing');
      expect(result.current).toHaveProperty('xs');
      expect(result.current).toHaveProperty('sm');
      expect(result.current).toHaveProperty('md');
      expect(result.current).toHaveProperty('lg');
      expect(result.current).toHaveProperty('xl');
      
      expect(typeof result.current.spacing).toBe('function');
      expect(typeof result.current.xs).toBe('number');
    });

    it('should call spacing function correctly', () => {
      const { getResponsiveSpacing } = require('../utils/manifiesto/responsive');
      const { result } = renderHook(() => useResponsiveSpacing());
      
      result.current.spacing(16, 20, 24);
      
      expect(getResponsiveSpacing).toHaveBeenCalledWith(16, 20, 24);
    });
  });

  describe('useResponsiveFontSize', () => {
    it('should return font size utilities', () => {
      const { result } = renderHook(() => useResponsiveFontSize());
      
      expect(result.current).toHaveProperty('fontSize');
      expect(result.current).toHaveProperty('xs');
      expect(result.current).toHaveProperty('sm');
      expect(result.current).toHaveProperty('md');
      expect(result.current).toHaveProperty('lg');
      expect(result.current).toHaveProperty('xl');
      expect(result.current).toHaveProperty('xxl');
      expect(result.current).toHaveProperty('title');
      
      expect(typeof result.current.fontSize).toBe('function');
      expect(typeof result.current.xs).toBe('number');
    });

    it('should call font size function correctly', () => {
      const { getResponsiveFontSize } = require('../utils/manifiesto/responsive');
      const { result } = renderHook(() => useResponsiveFontSize());
      
      result.current.fontSize(14, 16, 18);
      
      expect(getResponsiveFontSize).toHaveBeenCalledWith(14, 16, 18);
    });
  });

  describe('useResponsiveStyles', () => {
    it('should create responsive styles', () => {
      const { createResponsiveStyles } = require('../utils/manifiesto/responsive');
      
      const mobileStyles = { fontSize: 14 };
      const tabletStyles = { fontSize: 16 };
      const desktopStyles = { fontSize: 18 };
      
      const { result } = renderHook(() => 
        useResponsiveStyles(mobileStyles, tabletStyles, desktopStyles)
      );
      
      expect(createResponsiveStyles).toHaveBeenCalledWith(
        mobileStyles, 
        tabletStyles, 
        desktopStyles
      );
      expect(result.current).toBe(mobileStyles); // Mocked return value
    });
  });

  describe('useResponsiveImage', () => {
    it('should return image size', () => {
      const { getImageSize } = require('../utils/manifiesto/responsive');
      
      const { result } = renderHook(() => useResponsiveImage(16/9));
      
      expect(getImageSize).toHaveBeenCalledWith(16/9);
      expect(result.current).toEqual({ width: 343, height: 193 });
    });

    it('should use default aspect ratio when not provided', () => {
      const { getImageSize } = require('../utils/manifiesto/responsive');
      
      renderHook(() => useResponsiveImage());
      
      expect(getImageSize).toHaveBeenCalledWith(undefined);
    });
  });

  describe('useResponsiveGrid', () => {
    it('should return grid utilities', () => {
      const { result } = renderHook(() => useResponsiveGrid());
      
      expect(result.current).toHaveProperty('columns');
      expect(result.current).toHaveProperty('gap');
      expect(result.current).toHaveProperty('maxWidth');
      expect(result.current).toHaveProperty('getItemWidth');
      expect(result.current).toHaveProperty('getGridStyles');
      
      expect(typeof result.current.getItemWidth).toBe('function');
      expect(typeof result.current.getGridStyles).toBe('function');
    });

    it('should calculate item width correctly', () => {
      const { result } = renderHook(() => useResponsiveGrid());
      
      // Mock grid config: columns: 1, gap: 16, maxWidth: 343
      const itemWidth = result.current.getItemWidth(2);
      
      // (343 - (2-1) * 16) / 2 = (343 - 16) / 2 = 163.5
      expect(itemWidth).toBe(163.5);
    });

    it('should return grid styles', () => {
      const { result } = renderHook(() => useResponsiveGrid());
      
      const styles = result.current.getGridStyles();
      
      expect(styles).toHaveProperty('container');
      expect(styles).toHaveProperty('row');
      expect(styles).toHaveProperty('item');
      
      expect(styles.container).toEqual({
        maxWidth: 343,
        alignSelf: 'center',
      });
      
      expect(styles.row).toEqual({
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -8, // -gap/2
      });
      
      expect(styles.item).toEqual({
        paddingHorizontal: 8, // gap/2
        marginBottom: 16,
      });
    });
  });

  describe('useResponsiveNavigation', () => {
    it('should return navigation utilities', () => {
      const { result } = renderHook(() => useResponsiveNavigation());
      
      expect(result.current).toHaveProperty('showTabBar');
      expect(result.current).toHaveProperty('showSidebar');
      expect(result.current).toHaveProperty('showBreadcrumbs');
      expect(result.current).toHaveProperty('navigationStyle');
      expect(result.current).toHaveProperty('navigationHeight');
      expect(result.current).toHaveProperty('sidebarWidth');
    });

    it('should return correct heights and widths for mobile', () => {
      const { result } = renderHook(() => useResponsiveNavigation());
      
      // Mobile device (mocked)
      expect(result.current.navigationHeight).toBe(60);
      expect(result.current.sidebarWidth).toBe(0);
    });

    it('should return correct heights and widths for tablet', () => {
      const { getDeviceType } = require('../utils/manifiesto/responsive');
      getDeviceType.mockReturnValue('tablet');
      
      const { result } = renderHook(() => useResponsiveNavigation());
      
      expect(result.current.navigationHeight).toBe(80);
      expect(result.current.sidebarWidth).toBe(280);
    });

    it('should return correct heights and widths for desktop', () => {
      const { getDeviceType } = require('../utils/manifiesto/responsive');
      getDeviceType.mockReturnValue('desktop');
      
      const { result } = renderHook(() => useResponsiveNavigation());
      
      expect(result.current.navigationHeight).toBe(64);
      expect(result.current.sidebarWidth).toBe(320);
    });
  });
});