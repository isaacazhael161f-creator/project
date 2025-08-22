/**
 * Tests for useAccessibility hook
 */

import { renderHook, act } from '@testing-library/react-hooks';
import { useAccessibility, useKeyboardNavigation, useFocusManagement } from '../useAccessibility';
import { 
  getAccessibilityPreferences, 
  saveAccessibilityPreferences,
  announceToScreenReader 
} from '../../utils/manifiesto/accessibility';

// Mock the accessibility utilities
jest.mock('../../utils/manifiesto/accessibility');

const mockGetAccessibilityPreferences = getAccessibilityPreferences as jest.MockedFunction<typeof getAccessibilityPreferences>;
const mockSaveAccessibilityPreferences = saveAccessibilityPreferences as jest.MockedFunction<typeof saveAccessibilityPreferences>;
const mockAnnounceToScreenReader = announceToScreenReader as jest.MockedFunction<typeof announceToScreenReader>;

// Mock DOM methods
Object.defineProperty(document, 'documentElement', {
  value: {
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
    },
  },
  writable: true,
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('useAccessibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockGetAccessibilityPreferences.mockReturnValue({
      highContrast: false,
      darkMode: false,
      fontSize: 'medium',
      reducedMotion: false,
      screenReader: false,
    });
  });

  it('should initialize with default accessibility options', () => {
    const { result } = renderHook(() => useAccessibility());
    
    expect(result.current.options).toEqual({
      highContrast: false,
      darkMode: false,
      fontSize: 'medium',
      reducedMotion: false,
      screenReader: false,
    });
    
    expect(mockGetAccessibilityPreferences).toHaveBeenCalled();
  });

  it('should update accessibility options', () => {
    const { result } = renderHook(() => useAccessibility());
    
    act(() => {
      result.current.updateOption('highContrast', true);
    });
    
    expect(result.current.options.highContrast).toBe(true);
    expect(mockSaveAccessibilityPreferences).toHaveBeenCalledWith(
      expect.objectContaining({ highContrast: true })
    );
  });

  it('should apply high contrast styles when enabled', () => {
    const { result } = renderHook(() => useAccessibility());
    
    act(() => {
      result.current.updateOption('highContrast', true);
    });
    
    expect(document.documentElement.classList.add).toHaveBeenCalledWith('high-contrast');
  });

  it('should apply dark mode styles when enabled', () => {
    const { result } = renderHook(() => useAccessibility());
    
    act(() => {
      result.current.updateOption('darkMode', true);
    });
    
    expect(document.documentElement.classList.add).toHaveBeenCalledWith('dark-mode');
  });

  it('should apply font size classes', () => {
    const { result } = renderHook(() => useAccessibility());
    
    act(() => {
      result.current.updateOption('fontSize', 'large');
    });
    
    expect(document.documentElement.classList.remove).toHaveBeenCalledWith('font-small', 'font-medium', 'font-large');
    expect(document.documentElement.classList.add).toHaveBeenCalledWith('font-large');
  });

  it('should apply reduced motion styles when enabled', () => {
    const { result } = renderHook(() => useAccessibility());
    
    act(() => {
      result.current.updateOption('reducedMotion', true);
    });
    
    expect(document.documentElement.classList.add).toHaveBeenCalledWith('reduced-motion');
  });

  it('should announce messages to screen reader', () => {
    const { result } = renderHook(() => useAccessibility());
    
    act(() => {
      result.current.announce('Test message', 'assertive');
    });
    
    expect(mockAnnounceToScreenReader).toHaveBeenCalledWith('Test message', 'assertive');
  });

  it('should use polite as default announcement priority', () => {
    const { result } = renderHook(() => useAccessibility());
    
    act(() => {
      result.current.announce('Test message');
    });
    
    expect(mockAnnounceToScreenReader).toHaveBeenCalledWith('Test message', 'polite');
  });
});

describe('useKeyboardNavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.addEventListener = jest.fn();
    document.removeEventListener = jest.fn();
  });

  it('should register keyboard event listeners', () => {
    const shortcuts = {
      'Ctrl+s': {
        description: 'Save',
        action: jest.fn(),
      },
    };
    
    renderHook(() => useKeyboardNavigation(shortcuts));
    
    expect(document.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('should clean up event listeners on unmount', () => {
    const shortcuts = {
      'Ctrl+s': {
        description: 'Save',
        action: jest.fn(),
      },
    };
    
    const { unmount } = renderHook(() => useKeyboardNavigation(shortcuts));
    
    unmount();
    
    expect(document.removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
  });
});

describe('useFocusManagement', () => {
  let mockElement: HTMLElement;
  
  beforeEach(() => {
    mockElement = {
      focus: jest.fn(),
      querySelector: jest.fn(),
    } as any;
    
    Object.defineProperty(document, 'activeElement', {
      value: mockElement,
      writable: true,
    });
  });

  it('should save current focus', () => {
    const { result } = renderHook(() => useFocusManagement());
    
    act(() => {
      result.current.saveFocus();
    });
    
    // Focus should be saved internally
    expect(result.current).toBeDefined();
  });

  it('should restore saved focus', () => {
    const { result } = renderHook(() => useFocusManagement());
    
    act(() => {
      result.current.saveFocus();
    });
    
    act(() => {
      result.current.restoreFocus();
    });
    
    expect(mockElement.focus).toHaveBeenCalled();
  });

  it('should focus first focusable element in container', () => {
    const mockFocusableElement = { focus: jest.fn() } as any;
    const mockContainer = {
      querySelector: jest.fn().mockReturnValue(mockFocusableElement),
    } as any;
    
    const { result } = renderHook(() => useFocusManagement());
    
    act(() => {
      result.current.focusFirst(mockContainer);
    });
    
    expect(mockContainer.querySelector).toHaveBeenCalledWith(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    expect(mockFocusableElement.focus).toHaveBeenCalled();
  });

  it('should handle missing focusable elements gracefully', () => {
    const mockContainer = {
      querySelector: jest.fn().mockReturnValue(null),
    } as any;
    
    const { result } = renderHook(() => useFocusManagement());
    
    expect(() => {
      act(() => {
        result.current.focusFirst(mockContainer);
      });
    }).not.toThrow();
  });
});