/**
 * Tests for accessibility utilities
 */

import {
  ariaLabels,
  createKeyboardHandler,
  defaultKeyboardShortcuts,
  getAccessibilityPreferences,
  saveAccessibilityPreferences,
  announceToScreenReader,
  focusManagement,
  AccessibilityOptions,
} from '../accessibility';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: query.includes('dark'),
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock document methods
Object.defineProperty(document, 'body', {
  value: {
    appendChild: jest.fn(),
    removeChild: jest.fn(),
  },
  writable: true,
});

describe('Accessibility Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ariaLabels', () => {
    it('should provide comprehensive ARIA labels', () => {
      expect(ariaLabels.navigation).toBe('Navegación principal del escáner de manifiestos');
      expect(ariaLabels.imageUpload).toBe('Cargar imagen del manifiesto');
      expect(ariaLabels.dataEditor).toBe('Editor de datos del manifiesto');
      expect(ariaLabels.exportButton).toBe('Exportar datos procesados');
    });

    it('should have labels for all major components', () => {
      const expectedKeys = [
        'navigation', 'breadcrumbs', 'progressIndicator',
        'imageUpload', 'imagePreview', 'cameraButton', 'galleryButton',
        'ocrProgress', 'ocrResult', 'processingStatus',
        'dataEditor', 'editableField', 'requiredField', 'validationError',
        'exportButton', 'exportFormat', 'downloadLink'
      ];

      expectedKeys.forEach(key => {
        expect(ariaLabels).toHaveProperty(key);
        expect(typeof ariaLabels[key as keyof typeof ariaLabels]).toBe('string');
        expect(ariaLabels[key as keyof typeof ariaLabels].length).toBeGreaterThan(0);
      });
    });
  });

  describe('createKeyboardHandler', () => {
    it('should create a keyboard event handler', () => {
      const mockAction = jest.fn();
      const shortcuts = {
        'Ctrl+s': {
          description: 'Save',
          action: mockAction,
        },
      };

      const handler = createKeyboardHandler(shortcuts);
      expect(typeof handler).toBe('function');
    });

    it('should handle keyboard events correctly', () => {
      const mockAction = jest.fn();
      const shortcuts = {
        'Ctrl+s': {
          description: 'Save',
          action: mockAction,
        },
      };

      const handler = createKeyboardHandler(shortcuts);
      const mockEvent = {
        ctrlKey: true,
        altKey: false,
        shiftKey: false,
        key: 's',
        preventDefault: jest.fn(),
      } as any;

      handler(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockAction).toHaveBeenCalled();
    });

    it('should handle complex key combinations', () => {
      const mockAction = jest.fn();
      const shortcuts = {
        'Ctrl+Shift+Alt+z': {
          description: 'Complex shortcut',
          action: mockAction,
        },
      };

      const handler = createKeyboardHandler(shortcuts);
      const mockEvent = {
        ctrlKey: true,
        altKey: true,
        shiftKey: true,
        key: 'z',
        preventDefault: jest.fn(),
      } as any;

      handler(mockEvent);

      expect(mockAction).toHaveBeenCalled();
    });

    it('should ignore unregistered shortcuts', () => {
      const mockAction = jest.fn();
      const shortcuts = {
        'Ctrl+s': {
          description: 'Save',
          action: mockAction,
        },
      };

      const handler = createKeyboardHandler(shortcuts);
      const mockEvent = {
        ctrlKey: true,
        altKey: false,
        shiftKey: false,
        key: 'x',
        preventDefault: jest.fn(),
      } as any;

      handler(mockEvent);

      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
      expect(mockAction).not.toHaveBeenCalled();
    });
  });

  describe('defaultKeyboardShortcuts', () => {
    it('should provide default shortcuts', () => {
      expect(defaultKeyboardShortcuts).toHaveProperty('Ctrl+u');
      expect(defaultKeyboardShortcuts).toHaveProperty('Ctrl+s');
      expect(defaultKeyboardShortcuts).toHaveProperty('Ctrl+e');
      expect(defaultKeyboardShortcuts).toHaveProperty('Escape');
      expect(defaultKeyboardShortcuts).toHaveProperty('Tab');
      expect(defaultKeyboardShortcuts).toHaveProperty('Shift+Tab');
    });

    it('should have descriptions for all shortcuts', () => {
      Object.values(defaultKeyboardShortcuts).forEach(shortcut => {
        expect(shortcut).toHaveProperty('description');
        expect(shortcut).toHaveProperty('action');
        expect(typeof shortcut.description).toBe('string');
        expect(typeof shortcut.action).toBe('function');
      });
    });
  });

  describe('getAccessibilityPreferences', () => {
    it('should return default preferences when none are stored', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const preferences = getAccessibilityPreferences();

      expect(preferences).toEqual({
        highContrast: false,
        darkMode: false,
        fontSize: 'medium',
        reducedMotion: false,
        screenReader: false,
      });
    });

    it('should merge stored preferences with defaults', () => {
      const storedPreferences = {
        highContrast: true,
        fontSize: 'large',
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedPreferences));

      const preferences = getAccessibilityPreferences();

      expect(preferences).toEqual({
        highContrast: true,
        darkMode: false,
        fontSize: 'large',
        reducedMotion: false,
        screenReader: false,
      });
    });

    it('should detect system dark mode preference', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      // Mock matchMedia to return true for dark mode
      (window.matchMedia as jest.Mock).mockImplementation(query => ({
        matches: query.includes('dark'),
        media: query,
      }));

      const preferences = getAccessibilityPreferences();

      expect(preferences.darkMode).toBe(true);
    });

    it('should detect system reduced motion preference', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      // Mock matchMedia to return true for reduced motion
      (window.matchMedia as jest.Mock).mockImplementation(query => ({
        matches: query.includes('reduce'),
        media: query,
      }));

      const preferences = getAccessibilityPreferences();

      expect(preferences.reducedMotion).toBe(true);
    });
  });

  describe('saveAccessibilityPreferences', () => {
    it('should save preferences to localStorage', () => {
      const preferences: AccessibilityOptions = {
        highContrast: true,
        darkMode: true,
        fontSize: 'large',
        reducedMotion: false,
        screenReader: true,
      };

      saveAccessibilityPreferences(preferences);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'accessibility-preferences',
        JSON.stringify(preferences)
      );
    });
  });

  describe('announceToScreenReader', () => {
    it('should create announcement element with polite priority', () => {
      const mockElement = {
        setAttribute: jest.fn(),
        textContent: '',
        className: '',
      };
      
      jest.spyOn(document, 'createElement').mockReturnValue(mockElement as any);

      announceToScreenReader('Test message');

      expect(document.createElement).toHaveBeenCalledWith('div');
      expect(mockElement.setAttribute).toHaveBeenCalledWith('aria-live', 'polite');
      expect(mockElement.setAttribute).toHaveBeenCalledWith('aria-atomic', 'true');
      expect(mockElement.className).toBe('sr-only');
      expect(mockElement.textContent).toBe('Test message');
      expect(document.body.appendChild).toHaveBeenCalledWith(mockElement);
    });

    it('should create announcement element with assertive priority', () => {
      const mockElement = {
        setAttribute: jest.fn(),
        textContent: '',
        className: '',
      };
      
      jest.spyOn(document, 'createElement').mockReturnValue(mockElement as any);

      announceToScreenReader('Urgent message', 'assertive');

      expect(mockElement.setAttribute).toHaveBeenCalledWith('aria-live', 'assertive');
    });

    it('should remove announcement element after timeout', (done) => {
      const mockElement = {
        setAttribute: jest.fn(),
        textContent: '',
        className: '',
      };
      
      jest.spyOn(document, 'createElement').mockReturnValue(mockElement as any);

      announceToScreenReader('Test message');

      setTimeout(() => {
        expect(document.body.removeChild).toHaveBeenCalledWith(mockElement);
        done();
      }, 1100);
    });
  });

  describe('focusManagement', () => {
    let mockContainer: HTMLElement;
    let mockFocusableElements: HTMLElement[];

    beforeEach(() => {
      mockFocusableElements = [
        { focus: jest.fn() } as any,
        { focus: jest.fn() } as any,
        { focus: jest.fn() } as any,
      ];

      mockContainer = {
        querySelectorAll: jest.fn().mockReturnValue(mockFocusableElements),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      } as any;

      Object.defineProperty(document, 'activeElement', {
        value: mockFocusableElements[0],
        writable: true,
      });
    });

    describe('trapFocus', () => {
      it('should focus first element initially', () => {
        focusManagement.trapFocus(mockContainer);

        expect(mockFocusableElements[0].focus).toHaveBeenCalled();
      });

      it('should add keydown event listener', () => {
        focusManagement.trapFocus(mockContainer);

        expect(mockContainer.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
      });

      it('should return cleanup function', () => {
        const cleanup = focusManagement.trapFocus(mockContainer);

        expect(typeof cleanup).toBe('function');

        cleanup();

        expect(mockContainer.removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
      });

      it('should handle Tab key navigation forward', () => {
        focusManagement.trapFocus(mockContainer);

        const keydownHandler = (mockContainer.addEventListener as jest.Mock).mock.calls[0][1];
        
        // Simulate Tab key on last element
        document.activeElement = mockFocusableElements[2];
        const mockEvent = {
          key: 'Tab',
          shiftKey: false,
          preventDefault: jest.fn(),
        };

        keydownHandler(mockEvent);

        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(mockFocusableElements[0].focus).toHaveBeenCalled();
      });

      it('should handle Shift+Tab key navigation backward', () => {
        focusManagement.trapFocus(mockContainer);

        const keydownHandler = (mockContainer.addEventListener as jest.Mock).mock.calls[0][1];
        
        // Simulate Shift+Tab key on first element
        document.activeElement = mockFocusableElements[0];
        const mockEvent = {
          key: 'Tab',
          shiftKey: true,
          preventDefault: jest.fn(),
        };

        keydownHandler(mockEvent);

        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(mockFocusableElements[2].focus).toHaveBeenCalled();
      });
    });

    describe('restoreFocus', () => {
      it('should restore focus to previous element', () => {
        const mockPreviousElement = { focus: jest.fn() } as any;

        focusManagement.restoreFocus(mockPreviousElement);

        expect(mockPreviousElement.focus).toHaveBeenCalled();
      });

      it('should handle null previous element gracefully', () => {
        expect(() => {
          focusManagement.restoreFocus(null);
        }).not.toThrow();
      });
    });
  });
});