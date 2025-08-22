/**
 * Utilidades de accesibilidad para el escáner de manifiestos
 */

export interface AriaLabels {
  // Navegación
  navigation: string;
  breadcrumbs: string;
  progressIndicator: string;
  
  // Carga de imagen
  imageUpload: string;
  imagePreview: string;
  cameraButton: string;
  galleryButton: string;
  
  // OCR y procesamiento
  ocrProgress: string;
  ocrResult: string;
  processingStatus: string;
  
  // Editor de datos
  dataEditor: string;
  editableField: string;
  requiredField: string;
  validationError: string;
  
  // Exportación
  exportButton: string;
  exportFormat: string;
  downloadLink: string;
}

export const ariaLabels: AriaLabels = {
  // Navegación
  navigation: 'Navegación principal del escáner de manifiestos',
  breadcrumbs: 'Ruta de navegación actual',
  progressIndicator: 'Progreso del procesamiento del manifiesto',
  
  // Carga de imagen
  imageUpload: 'Cargar imagen del manifiesto',
  imagePreview: 'Vista previa de la imagen cargada',
  cameraButton: 'Tomar foto con la cámara',
  galleryButton: 'Seleccionar imagen de la galería',
  
  // OCR y procesamiento
  ocrProgress: 'Progreso del reconocimiento óptico de caracteres',
  ocrResult: 'Resultado del texto extraído',
  processingStatus: 'Estado del procesamiento',
  
  // Editor de datos
  dataEditor: 'Editor de datos del manifiesto',
  editableField: 'Campo editable',
  requiredField: 'Campo obligatorio',
  validationError: 'Error de validación',
  
  // Exportación
  exportButton: 'Exportar datos procesados',
  exportFormat: 'Formato de exportación',
  downloadLink: 'Descargar archivo exportado'
};

export interface KeyboardShortcuts {
  [key: string]: {
    description: string;
    action: () => void;
  };
}

export const createKeyboardHandler = (shortcuts: KeyboardShortcuts) => {
  return (event: KeyboardEvent) => {
    const key = `${event.ctrlKey ? 'Ctrl+' : ''}${event.altKey ? 'Alt+' : ''}${event.shiftKey ? 'Shift+' : ''}${event.key}`;
    
    if (shortcuts[key]) {
      event.preventDefault();
      shortcuts[key].action();
    }
  };
};

export const defaultKeyboardShortcuts = {
  'Ctrl+u': {
    description: 'Cargar nueva imagen',
    action: () => console.log('Upload shortcut')
  },
  'Ctrl+s': {
    description: 'Guardar datos actuales',
    action: () => console.log('Save shortcut')
  },
  'Ctrl+e': {
    description: 'Exportar datos',
    action: () => console.log('Export shortcut')
  },
  'Escape': {
    description: 'Cancelar operación actual',
    action: () => console.log('Cancel shortcut')
  },
  'Tab': {
    description: 'Navegar al siguiente campo',
    action: () => console.log('Tab navigation')
  },
  'Shift+Tab': {
    description: 'Navegar al campo anterior',
    action: () => console.log('Shift+Tab navigation')
  }
};

export interface AccessibilityOptions {
  highContrast: boolean;
  darkMode: boolean;
  fontSize: 'small' | 'medium' | 'large';
  reducedMotion: boolean;
  screenReader: boolean;
}

export const getAccessibilityPreferences = (): AccessibilityOptions => {
  const stored = localStorage.getItem('accessibility-preferences');
  const defaults: AccessibilityOptions = {
    highContrast: false,
    darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
    fontSize: 'medium',
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    screenReader: false
  };
  
  return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
};

export const saveAccessibilityPreferences = (options: AccessibilityOptions) => {
  localStorage.setItem('accessibility-preferences', JSON.stringify(options));
};

export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

export const focusManagement = {
  trapFocus: (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  },

  restoreFocus: (previousElement: HTMLElement | null) => {
    if (previousElement) {
      previousElement.focus();
    }
  }
};