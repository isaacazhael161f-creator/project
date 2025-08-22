/**
 * OCR utilities for the Manifiesto Scanner
 * Provides functions for image preprocessing and OCR configuration
 */

import Tesseract from 'tesseract.js';
import { 
  ErrorType, 
  createManifiestoError, 
  withErrorHandling 
} from './errorHandler';

// Configuración optimizada para manifiestos mexicanos
export const OCR_CONFIG = {
  // Idiomas: español e inglés para códigos de aeropuertos
  languages: 'spa+eng',
  
  // Opciones de Tesseract optimizadas para documentos
  options: {
    // Caracteres permitidos (incluye acentos españoles)
    tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÁÉÍÓÚáéíóúÑñ0123456789:/-.,()° ',
    
    // Modo de segmentación de página automático
    tessedit_pageseg_mode: Tesseract.PSM.AUTO,
    
    // Preservar espacios entre palabras
    preserve_interword_spaces: '1',
    
    // Configuración adicional para mejorar precisión
    tessedit_do_invert: '0',
    tessedit_create_hocr: '1',
  }
};

// Configuración de timeouts
export const OCR_TIMEOUTS = {
  default: 30000, // 30 segundos
  large: 60000,   // 60 segundos para imágenes grandes
  small: 15000    // 15 segundos para imágenes pequeñas
};

// Configuración de preprocesamiento
export const PREPROCESSING_CONFIG = {
  maxWidth: 2000,
  maxHeight: 2000,
  contrast: 1.5,
  brightness: 1.1,
  enableGrayscale: true,
  enableContrast: true,
  enableBrightness: false,
  enableNoise: false
};

/**
 * Interfaz para configuración de OCR personalizada
 */
export interface OCROptions {
  languages?: string;
  timeout?: number;
  preprocessing?: Partial<typeof PREPROCESSING_CONFIG>;
  tesseractOptions?: Record<string, string>;
}

/**
 * Resultado del procesamiento OCR
 */
export interface OCRResult {
  text: string;
  confidence: number;
  processingTime: number;
  wordCount: number;
  lineCount: number;
}

/**
 * Información de progreso del OCR
 */
export interface OCRProgress {
  status: 'initializing' | 'loading' | 'recognizing' | 'completed' | 'error';
  progress: number;
  message: string;
}

/**
 * Preprocesa una imagen para mejorar la precisión del OCR
 * @param imageDataUrl - URL de datos de la imagen en base64
 * @param config - Configuración de preprocesamiento
 * @returns Promise con la imagen preprocesada
 */
export const preprocessImage = async (
  imageDataUrl: string,
  config: Partial<typeof PREPROCESSING_CONFIG> = {}
): Promise<string> => {
  const finalConfig = { ...PREPROCESSING_CONFIG, ...config };

  return new Promise((resolve, reject) => {
    try {
      // Verificar si estamos en un entorno web
      if (typeof document === 'undefined') {
        // En React Native, devolver la imagen original
        resolve(imageDataUrl);
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
          // Calcular dimensiones optimizadas
          let { width, height } = img;
          
          if (width > finalConfig.maxWidth || height > finalConfig.maxHeight) {
            const ratio = Math.min(
              finalConfig.maxWidth / width,
              finalConfig.maxHeight / height
            );
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          canvas.width = width;
          canvas.height = height;

          if (!ctx) {
            reject(new Error('No se pudo crear contexto de canvas'));
            return;
          }

          // Dibujar imagen redimensionada
          ctx.drawImage(img, 0, 0, width, height);

          // Aplicar filtros de preprocesamiento
          if (finalConfig.enableGrayscale || finalConfig.enableContrast || finalConfig.enableBrightness) {
            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
              let r = data[i];
              let g = data[i + 1];
              let b = data[i + 2];

              // Convertir a escala de grises si está habilitado
              if (finalConfig.enableGrayscale) {
                const gray = r * 0.299 + g * 0.587 + b * 0.114;
                r = g = b = gray;
              }

              // Ajustar contraste si está habilitado
              if (finalConfig.enableContrast) {
                const factor = (259 * (finalConfig.contrast + 255)) / (255 * (259 - finalConfig.contrast));
                r = Math.min(255, Math.max(0, factor * (r - 128) + 128));
                g = Math.min(255, Math.max(0, factor * (g - 128) + 128));
                b = Math.min(255, Math.max(0, factor * (b - 128) + 128));
              }

              // Ajustar brillo si está habilitado
              if (finalConfig.enableBrightness) {
                r = Math.min(255, Math.max(0, r * finalConfig.brightness));
                g = Math.min(255, Math.max(0, g * finalConfig.brightness));
                b = Math.min(255, Math.max(0, b * finalConfig.brightness));
              }

              data[i] = r;
              data[i + 1] = g;
              data[i + 2] = b;
              // Alpha permanece igual
            }

            ctx.putImageData(imageData, 0, 0);
          }

          // Devolver imagen procesada como data URL
          resolve(canvas.toDataURL('image/png', 0.9));
        } catch (error) {
          reject(new Error(`Error en preprocesamiento: ${error}`));
        }
      };

      img.onerror = () => reject(new Error('Error al cargar imagen para preprocesamiento'));
      img.src = imageDataUrl;
    } catch (error) {
      reject(new Error(`Error inicializando preprocesamiento: ${error}`));
    }
  });
};

/**
 * Limpia y normaliza el texto extraído por OCR
 * @param rawText - Texto crudo del OCR
 * @returns Texto limpio y normalizado
 */
export const cleanOCRText = (rawText: string): string => {
  return rawText
    // Eliminar caracteres de control
    .replace(/[\x00-\x1F\x7F]/g, '')
    // Normalizar espacios múltiples pero preservar saltos de línea
    .replace(/[ \t]+/g, ' ')
    // Eliminar líneas vacías múltiples (3 o más se convierten en 2)
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    // Corregir caracteres comunes mal reconocidos
    .replace(/\|/g, 'I')
    .replace(/[O0]/g, (match, offset, string) => {
      // Contexto para decidir si es 0 u O
      const before = string[offset - 1];
      const after = string[offset + 1];
      if (/\d/.test(before) || /\d/.test(after)) {
        return '0';
      }
      return 'O';
    })
    // Limpiar espacios al inicio y final
    .trim();
};

/**
 * Calcula el timeout apropiado basado en el tamaño de la imagen
 * @param imageSize - Tamaño de la imagen en bytes
 * @returns Timeout en milisegundos
 */
export const calculateTimeout = (imageSize: number): number => {
  const sizeInMB = imageSize / (1024 * 1024);
  
  if (sizeInMB < 1) {
    return OCR_TIMEOUTS.small;
  } else if (sizeInMB > 5) {
    return OCR_TIMEOUTS.large;
  } else {
    return OCR_TIMEOUTS.default;
  }
};

/**
 * Valida si una imagen es adecuada para OCR
 * @param imageDataUrl - URL de datos de la imagen
 * @returns Promise con resultado de validación
 */
export const validateImageForOCR = async (imageDataUrl: string): Promise<{
  isValid: boolean;
  warnings: string[];
  recommendations: string[];
}> => {
  return new Promise((resolve) => {
    const warnings: string[] = [];
    const recommendations: string[] = [];

    try {
      if (typeof document === 'undefined') {
        // En React Native, asumir que es válida
        resolve({ isValid: true, warnings, recommendations });
        return;
      }

      const img = new Image();
      
      img.onload = () => {
        const { width, height } = img;
        const aspectRatio = width / height;

        // Verificar resolución mínima
        if (width < 300 || height < 200) {
          warnings.push('La resolución de la imagen es baja, esto puede afectar la precisión del OCR');
          recommendations.push('Usa una imagen de al menos 300x200 píxeles');
        }

        // Verificar resolución muy alta
        if (width > 4000 || height > 4000) {
          warnings.push('La imagen es muy grande, el procesamiento puede ser lento');
          recommendations.push('Considera redimensionar la imagen a un máximo de 2000x2000 píxeles');
        }

        // Verificar aspect ratio extremo
        if (aspectRatio > 5 || aspectRatio < 0.2) {
          warnings.push('La proporción de la imagen es extrema, esto puede dificultar el OCR');
          recommendations.push('Recorta la imagen para enfocar solo el documento');
        }

        // Verificar si es muy pequeña para texto
        if (width * height < 100000) { // menos de ~316x316
          warnings.push('La imagen puede ser demasiado pequeña para contener texto legible');
          recommendations.push('Usa una imagen más grande o con mayor resolución');
        }

        resolve({
          isValid: warnings.length === 0,
          warnings,
          recommendations
        });
      };

      img.onerror = () => {
        resolve({
          isValid: false,
          warnings: ['No se pudo cargar la imagen'],
          recommendations: ['Verifica que la imagen sea válida']
        });
      };

      img.src = imageDataUrl;
    } catch (error) {
      resolve({
        isValid: false,
        warnings: ['Error al validar la imagen'],
        recommendations: ['Intenta con otra imagen']
      });
    }
  });
};

/**
 * Crea un worker de Tesseract con configuración optimizada
 * @param options - Opciones de configuración
 * @returns Promise con el worker configurado
 */
export const createOptimizedWorker = async (
  options: OCROptions = {},
  onProgress?: (progress: OCRProgress) => void
): Promise<Tesseract.Worker> => {
  const config = {
    languages: options.languages || OCR_CONFIG.languages,
    tesseractOptions: { ...OCR_CONFIG.options, ...options.tesseractOptions }
  };

  try {
    onProgress?.({
      status: 'initializing',
      progress: 0,
      message: 'Inicializando worker OCR...'
    });

    const worker = await Tesseract.createWorker(config.languages, undefined, {
      logger: (m: any) => {
        if (onProgress) {
          let progress = 0;
          let message = m.status;

          switch (m.status) {
            case 'loading tesseract core':
              progress = Math.round(m.progress * 30);
              message = 'Cargando núcleo de Tesseract...';
              onProgress({ status: 'loading', progress, message });
              break;
            case 'initializing tesseract':
              progress = 30 + Math.round(m.progress * 20);
              message = 'Inicializando Tesseract...';
              onProgress({ status: 'loading', progress, message });
              break;
            case 'loading language traineddata':
              progress = 50 + Math.round(m.progress * 30);
              message = 'Cargando datos de idioma...';
              onProgress({ status: 'loading', progress, message });
              break;
            case 'recognizing text':
              progress = 80 + Math.round(m.progress * 20);
              message = `Reconociendo texto... ${Math.round(m.progress * 100)}%`;
              onProgress({ status: 'recognizing', progress, message });
              break;
          }
        }
      }
    });

    onProgress?.({
      status: 'loading',
      progress: 80,
      message: 'Configurando parámetros...'
    });

    await worker.setParameters(config.tesseractOptions);

    onProgress?.({
      status: 'completed',
      progress: 100,
      message: 'Worker listo para procesar'
    });

    return worker;
  } catch (error) {
    onProgress?.({
      status: 'error',
      progress: 0,
      message: `Error inicializando worker: ${error}`
    });
    
    throw createManifiestoError(
      ErrorType.OCR_INITIALIZATION_FAILED,
      error instanceof Error ? error.message : String(error),
      { operation: 'worker_initialization', config }
    );
  }
};

/**
 * Procesa una imagen con OCR usando configuración optimizada
 * @param imageDataUrl - URL de datos de la imagen
 * @param options - Opciones de configuración
 * @param onProgress - Callback de progreso
 * @returns Promise con el resultado del OCR
 */
export const processImageWithOCR = withErrorHandling(
  async (
    imageDataUrl: string,
    options: OCROptions = {},
    onProgress?: (progress: OCRProgress) => void
  ): Promise<OCRResult> => {
    const startTime = Date.now();
    let worker: Tesseract.Worker | null = null;

    try {
      // Validar imagen antes de procesar
      const validation = await validateImageForOCR(imageDataUrl);
      if (!validation.isValid) {
        throw createManifiestoError(
          ErrorType.IMAGE_CORRUPTED,
          `Imagen no válida: ${validation.warnings.join(', ')}`,
          { operation: 'image_validation' }
        );
      }

      // Preprocesar imagen si está configurado
      const preprocessedImage = options.preprocessing 
        ? await preprocessImage(imageDataUrl, options.preprocessing)
        : imageDataUrl;

      // Crear worker optimizado
      worker = await createOptimizedWorker(options, onProgress);

      // Procesar imagen con timeout
      const timeout = options.timeout || calculateTimeout(imageDataUrl.length);
      
      onProgress?.({
        status: 'recognizing',
        progress: 0,
        message: 'Iniciando reconocimiento de texto...'
      });

      const recognitionPromise = worker.recognize(preprocessedImage);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(createManifiestoError(
            ErrorType.OCR_PROCESSING_TIMEOUT,
            `OCR timeout después de ${timeout}ms`,
            { operation: 'ocr_recognition', timeout }
          ));
        }, timeout);
      });

      const { data: { text, confidence } } = await Promise.race([
        recognitionPromise,
        timeoutPromise
      ]);

      // Verificar confianza mínima
      if (confidence < 30) {
        onProgress?.({
          status: 'completed',
          progress: 100,
          message: `Texto reconocido con baja confianza (${confidence.toFixed(1)}%)`
        });
        
        // No lanzar error, pero crear advertencia
        const lowConfidenceError = createManifiestoError(
          ErrorType.OCR_LOW_CONFIDENCE,
          `Confianza baja: ${confidence.toFixed(1)}%`,
          { operation: 'ocr_confidence_check', confidence }
        );
        console.warn('OCR Low Confidence:', lowConfidenceError);
      }

      // Limpiar texto
      const cleanedText = cleanOCRText(text);
      
      // Calcular métricas
      const processingTime = Date.now() - startTime;
      const wordCount = cleanedText.split(/\s+/).filter(word => word.length > 0).length;
      const lineCount = cleanedText.split('\n').length;

      onProgress?.({
        status: 'completed',
        progress: 100,
        message: `Procesamiento completado en ${(processingTime / 1000).toFixed(1)}s`
      });

      return {
        text: cleanedText,
        confidence,
        processingTime,
        wordCount,
        lineCount
      };

    } catch (error) {
      onProgress?.({
        status: 'error',
        progress: 0,
        message: `Error en OCR: ${error}`
      });
      
      // Clasificar y relanzar error
      if (error instanceof Error && error.message.includes('OCR')) {
        throw error; // Ya es un ManifiestoError
      }
      
      throw createManifiestoError(
        ErrorType.OCR_PROCESSING_FAILED,
        error instanceof Error ? error.message : String(error),
        { operation: 'ocr_processing' }
      );
    } finally {
      // Limpiar worker
      if (worker) {
        try {
          await worker.terminate();
        } catch (error) {
          console.warn('Error terminando worker:', error);
        }
      }
    }
  },
  { component: 'OCRProcessor', operation: 'processImageWithOCR' },
  {
    retry: async () => {
      console.log('Reintentando procesamiento OCR...');
    },
    fallback: async () => {
      console.log('Usando configuración de respaldo para OCR...');
    }
  }
);

/**
 * Estima la calidad del texto extraído por OCR
 * @param text - Texto extraído
 * @param confidence - Confianza reportada por Tesseract
 * @returns Puntuación de calidad (0-100)
 */
export const estimateTextQuality = (text: string, confidence: number): number => {
  let qualityScore = confidence;

  // Penalizar texto muy corto
  if (text.length < 50) {
    qualityScore *= 0.8;
  }

  // Penalizar exceso de caracteres especiales
  const specialCharRatio = (text.match(/[^a-zA-Z0-9\s]/g) || []).length / text.length;
  if (specialCharRatio > 0.3) {
    qualityScore *= 0.7;
  }

  // Bonificar presencia de palabras comunes en manifiestos
  const manifestKeywords = [
    'manifiesto', 'vuelo', 'aeropuerto', 'pasajeros', 'carga',
    'fecha', 'hora', 'destino', 'origen', 'equipaje'
  ];
  
  const keywordMatches = manifestKeywords.filter(keyword => 
    text.toLowerCase().includes(keyword)
  ).length;
  
  qualityScore += keywordMatches * 2;

  return Math.min(100, Math.max(0, qualityScore));
};