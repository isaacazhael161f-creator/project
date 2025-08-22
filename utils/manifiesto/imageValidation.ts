/**
 * Image validation utilities for the Manifiesto Scanner
 * Provides functions for validating image formats, sizes, and processing
 */

// Configuration constants
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const DEFAULT_SUPPORTED_FORMATS = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp'
];

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  errorCode?: string;
}

/**
 * Validates if a file format is supported
 * @param mimeType - The MIME type of the file
 * @param supportedFormats - Array of supported MIME types
 * @returns ValidationResult indicating if format is valid
 */
export const validateFileFormat = (
  mimeType: string,
  supportedFormats: string[] = DEFAULT_SUPPORTED_FORMATS
): ValidationResult => {
  if (!mimeType) {
    return {
      isValid: false,
      error: 'Tipo de archivo no especificado',
      errorCode: 'MISSING_MIME_TYPE'
    };
  }

  const normalizedMimeType = mimeType.toLowerCase().trim();
  const normalizedSupportedFormats = supportedFormats.map(format => 
    format.toLowerCase().trim()
  );

  if (!normalizedSupportedFormats.includes(normalizedMimeType)) {
    return {
      isValid: false,
      error: `Formato no soportado. Los formatos soportados son: ${supportedFormats.join(', ')}`,
      errorCode: 'UNSUPPORTED_FORMAT'
    };
  }

  return { isValid: true };
};

/**
 * Validates if a file size is within acceptable limits
 * @param fileSize - Size of the file in bytes
 * @param maxSize - Maximum allowed size in bytes
 * @returns ValidationResult indicating if size is valid
 */
export const validateFileSize = (
  fileSize: number,
  maxSize: number = MAX_FILE_SIZE
): ValidationResult => {
  if (fileSize < 0) {
    return {
      isValid: false,
      error: 'Tamaño de archivo inválido',
      errorCode: 'INVALID_FILE_SIZE'
    };
  }

  if (fileSize === 0) {
    return {
      isValid: false,
      error: 'El archivo está vacío',
      errorCode: 'EMPTY_FILE'
    };
  }

  if (fileSize > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    return {
      isValid: false,
      error: `El archivo es demasiado grande. Tamaño máximo permitido: ${maxSizeMB}MB`,
      errorCode: 'FILE_TOO_LARGE'
    };
  }

  return { isValid: true };
};

/**
 * Validates image dimensions
 * @param width - Image width in pixels
 * @param height - Image height in pixels
 * @param minWidth - Minimum required width (default: 100)
 * @param minHeight - Minimum required height (default: 100)
 * @param maxWidth - Maximum allowed width (default: 4000)
 * @param maxHeight - Maximum allowed height (default: 4000)
 * @returns ValidationResult indicating if dimensions are valid
 */
export const validateImageDimensions = (
  width: number,
  height: number,
  minWidth: number = 100,
  minHeight: number = 100,
  maxWidth: number = 4000,
  maxHeight: number = 4000
): ValidationResult => {
  if (width <= 0 || height <= 0) {
    return {
      isValid: false,
      error: 'Dimensiones de imagen inválidas',
      errorCode: 'INVALID_DIMENSIONS'
    };
  }

  if (width < minWidth || height < minHeight) {
    return {
      isValid: false,
      error: `La imagen es demasiado pequeña. Dimensiones mínimas: ${minWidth}x${minHeight}px`,
      errorCode: 'IMAGE_TOO_SMALL'
    };
  }

  if (width > maxWidth || height > maxHeight) {
    return {
      isValid: false,
      error: `La imagen es demasiado grande. Dimensiones máximas: ${maxWidth}x${maxHeight}px`,
      errorCode: 'IMAGE_TOO_LARGE'
    };
  }

  return { isValid: true };
};

/**
 * Validates image aspect ratio for document scanning
 * @param width - Image width in pixels
 * @param height - Image height in pixels
 * @param minRatio - Minimum aspect ratio (default: 0.5 for portrait documents)
 * @param maxRatio - Maximum aspect ratio (default: 2.0 for landscape documents)
 * @returns ValidationResult indicating if aspect ratio is suitable
 */
export const validateImageAspectRatio = (
  width: number,
  height: number,
  minRatio: number = 0.5,
  maxRatio: number = 2.0
): ValidationResult => {
  if (width <= 0 || height <= 0) {
    return {
      isValid: false,
      error: 'Dimensiones de imagen inválidas para calcular proporción',
      errorCode: 'INVALID_DIMENSIONS_FOR_RATIO'
    };
  }

  const aspectRatio = width / height;

  if (aspectRatio < minRatio || aspectRatio > maxRatio) {
    return {
      isValid: false,
      error: 'La proporción de la imagen no es adecuada para documentos. Asegúrate de que la imagen esté bien encuadrada.',
      errorCode: 'INVALID_ASPECT_RATIO'
    };
  }

  return { isValid: true };
};

/**
 * Comprehensive validation for image files
 * @param file - File information object
 * @param options - Validation options
 * @returns ValidationResult with comprehensive validation
 */
export interface ImageFileInfo {
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
}

export interface ValidationOptions {
  supportedFormats?: string[];
  maxFileSize?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  validateAspectRatio?: boolean;
  minAspectRatio?: number;
  maxAspectRatio?: number;
}

export const validateImageFile = (
  file: ImageFileInfo,
  options: ValidationOptions = {}
): ValidationResult => {
  const {
    supportedFormats = DEFAULT_SUPPORTED_FORMATS,
    maxFileSize = MAX_FILE_SIZE,
    minWidth = 100,
    minHeight = 100,
    maxWidth = 4000,
    maxHeight = 4000,
    validateAspectRatio = false,
    minAspectRatio = 0.5,
    maxAspectRatio = 2.0
  } = options;

  // Validate format
  const formatValidation = validateFileFormat(file.mimeType, supportedFormats);
  if (!formatValidation.isValid) {
    return formatValidation;
  }

  // Validate size
  const sizeValidation = validateFileSize(file.size, maxFileSize);
  if (!sizeValidation.isValid) {
    return sizeValidation;
  }

  // Validate dimensions if provided
  if (file.width !== undefined && file.height !== undefined) {
    const dimensionsValidation = validateImageDimensions(
      file.width,
      file.height,
      minWidth,
      minHeight,
      maxWidth,
      maxHeight
    );
    if (!dimensionsValidation.isValid) {
      return dimensionsValidation;
    }

    // Validate aspect ratio if requested
    if (validateAspectRatio) {
      const aspectRatioValidation = validateImageAspectRatio(
        file.width,
        file.height,
        minAspectRatio,
        maxAspectRatio
      );
      if (!aspectRatioValidation.isValid) {
        return aspectRatioValidation;
      }
    }
  }

  return { isValid: true };
};

/**
 * Formats file size for display
 * @param bytes - File size in bytes
 * @returns Formatted string with appropriate unit
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Checks if a MIME type represents an image
 * @param mimeType - The MIME type to check
 * @returns boolean indicating if it's an image type
 */
export const isImageMimeType = (mimeType: string): boolean => {
  return mimeType.toLowerCase().startsWith('image/');
};

/**
 * Gets the file extension from a MIME type
 * @param mimeType - The MIME type
 * @returns File extension or empty string if unknown
 */
export const getFileExtensionFromMimeType = (mimeType: string): string => {
  const mimeToExtension: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/bmp': 'bmp',
    'image/tiff': 'tiff',
    'image/svg+xml': 'svg'
  };

  return mimeToExtension[mimeType.toLowerCase()] || '';
};

/**
 * Validates if an image is suitable for OCR processing
 * @param width - Image width
 * @param height - Image height
 * @param fileSize - File size in bytes
 * @returns ValidationResult for OCR suitability
 */
export const validateImageForOCR = (
  width: number,
  height: number,
  fileSize: number
): ValidationResult => {
  // Minimum resolution for decent OCR results
  const minOCRWidth = 300;
  const minOCRHeight = 200;
  
  // Maximum size to avoid performance issues
  const maxOCRFileSize = 15 * 1024 * 1024; // 15MB

  if (width < minOCRWidth || height < minOCRHeight) {
    return {
      isValid: false,
      error: `Para mejores resultados de OCR, la imagen debe tener al menos ${minOCRWidth}x${minOCRHeight} píxeles`,
      errorCode: 'LOW_RESOLUTION_FOR_OCR'
    };
  }

  if (fileSize > maxOCRFileSize) {
    return {
      isValid: false,
      error: 'La imagen es demasiado grande para procesamiento OCR eficiente',
      errorCode: 'TOO_LARGE_FOR_OCR'
    };
  }

  // Check if image is extremely wide or tall (might be difficult for OCR)
  const aspectRatio = width / height;
  if (aspectRatio > 5 || aspectRatio < 0.2) {
    return {
      isValid: false,
      error: 'La proporción de la imagen puede dificultar el reconocimiento de texto. Intenta recortar la imagen.',
      errorCode: 'EXTREME_ASPECT_RATIO'
    };
  }

  return { isValid: true };
};