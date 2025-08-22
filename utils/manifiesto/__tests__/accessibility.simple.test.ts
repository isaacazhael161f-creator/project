/**
 * Simple accessibility utilities tests
 */

import {
  ariaLabels,
  createKeyboardHandler,
  getAccessibilityPreferences,
  saveAccessibilityPreferences,
  AccessibilityOptions,
} from '../accessibility';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    matches: false,
    media: '',
  })),
});

describe('Accessibility Utilities - Simple Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ariaLabels', () => {
    it('should provide ARIA labels for all components', () => {
      expect(ariaLabels.navigation).toBeDefined();
      expect(ariaLabels.imageUpload).toBeDefined();
      expect(ariaLabels.dataEditor).toBeDefined();
      expect(ariaLabels.exportButton).toBeDefined();
      
      // Check that labels are strings
      expect(typeof ariaLabels.navigation).toBe('string');
      expect(typeof ariaLabels.imageUpload).toBe('string');
      expect(typeof ariaLabels.dataEditor).toBe('string');
      expect(typeof ariaLabels.exportButton).toBe('string');
    });
  });

  describe('createKeyboardHandler', () => {
    it('should create a function', () => {
      const shortcuts = {
        'Ctrl+s': {
          description: 'Save',
          action: jest.fn(),
        },
      };

      const handler = createKeyboardHandler(shortcuts);
      expect(typeof handler).toBe('function');
    });

    it('should call action when matching shortcut is pressed', () => {
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
  });

  describe('getAccessibilityPreferences', () => {
    it('should return default preferences when none stored', () => {
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

      expect(preferences.highContrast).toBe(true);
      expect(preferences.fontSize).toBe('large');
      expect(preferences.darkMode).toBe(false); // default value
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
});