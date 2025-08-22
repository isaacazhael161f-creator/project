import { useState, useEffect, useCallback } from 'react';
import { 
  AccessibilityOptions, 
  getAccessibilityPreferences, 
  saveAccessibilityPreferences,
  announceToScreenReader,
  createKeyboardHandler,
  KeyboardShortcuts
} from '../utils/manifiesto/accessibility';

export const useAccessibility = () => {
  const [options, setOptions] = useState<AccessibilityOptions>(getAccessibilityPreferences);

  useEffect(() => {
    saveAccessibilityPreferences(options);
    
    // Aplicar estilos de accesibilidad al documento
    const root = document.documentElement;
    
    if (options.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    if (options.darkMode) {
      root.classList.add('dark-mode');
    } else {
      root.classList.remove('dark-mode');
    }
    
    root.classList.remove('font-small', 'font-medium', 'font-large');
    root.classList.add(`font-${options.fontSize}`);
    
    if (options.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }
  }, [options]);

  const updateOption = useCallback(<K extends keyof AccessibilityOptions>(
    key: K, 
    value: AccessibilityOptions[K]
  ) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  }, []);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    announceToScreenReader(message, priority);
  }, []);

  return {
    options,
    updateOption,
    announce
  };
};

export const useKeyboardNavigation = (shortcuts: KeyboardShortcuts) => {
  useEffect(() => {
    const handler = createKeyboardHandler(shortcuts);
    document.addEventListener('keydown', handler);
    
    return () => {
      document.removeEventListener('keydown', handler);
    };
  }, [shortcuts]);
};

export const useFocusManagement = () => {
  const [focusedElement, setFocusedElement] = useState<HTMLElement | null>(null);

  const saveFocus = useCallback(() => {
    setFocusedElement(document.activeElement as HTMLElement);
  }, []);

  const restoreFocus = useCallback(() => {
    if (focusedElement) {
      focusedElement.focus();
      setFocusedElement(null);
    }
  }, [focusedElement]);

  const focusFirst = useCallback((container: HTMLElement) => {
    const focusableElement = container.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as HTMLElement;
    
    if (focusableElement) {
      focusableElement.focus();
    }
  }, []);

  return {
    saveFocus,
    restoreFocus,
    focusFirst
  };
};