/**
 * Image Compression Utilities
 * Optimizes images for storage and processing while maintaining OCR quality
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp' | 'png';
  maintainAspectRatio?: boolean;
  forStorage?: boolean;
  forOCR?: boolean;
}

export interface CompressionResult {
  compressedDataUrl: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  dimensions: {
    width: number;
    height: number;
  };
}

// Default compression settings
const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.8,
  format: 'jpeg',
  maintainAspectRatio: true,
  forStorage: false,
  forOCR: false,
};

// OCR-optimized settings
const OCR_OPTIONS: CompressionOptions = {
  maxWidth: 2000,
  maxHeight: 2000,
  quality: 0.9,
  format: 'png',
  maintainAspectRatio: true,
  forOCR: true,
};

// Storage-optimized settings
const STORAGE_OPTIONS: CompressionOptions = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 0.7,
  format: 'jpeg',
  maintainAspectRatio: true,
  forStorage: true,
};

/**
 * Compress image with specified options
 */
export const compressImage = async (
  imageDataUrl: string,
  options: CompressionOptions = {}
): Promise<CompressionResult> => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Apply preset options
  if (opts.forOCR) {
    Object.assign(opts, OCR_OPTIONS, options);
  } else if (opts.forStorage) {
    Object.assign(opts, STORAGE_OPTIONS, options);
  }

  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
          const originalSize = getDataUrlSize(imageDataUrl);
          
          // Calculate new dimensions
          const { width: newWidth, height: newHeight } = calculateDimensions(
            img.width,
            img.height,
            opts.maxWidth!,
            opts.maxHeight!,
            opts.maintainAspectRatio!
          );

          canvas.width = newWidth;
          canvas.height = newHeight;

          if (!ctx) {
            throw new Error('Could not get canvas context');
          }

          // Apply image smoothing for better quality
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Draw and compress
          ctx.drawImage(img, 0, 0, newWidth, newHeight);

          // Apply OCR-specific enhancements
          if (opts.forOCR) {
            enhanceForOCR(ctx, newWidth, newHeight);
          }

          // Get compressed data URL
          const mimeType = `image/${opts.format}`;
          const compressedDataUrl = canvas.toDataURL(mimeType, opts.quality);
          const compressedSize = getDataUrlSize(compressedDataUrl);

          resolve({
            compressedDataUrl,
            originalSize,
            compressedSize,
            compressionRatio: originalSize / compressedSize,
            dimensions: {
              width: newWidth,
              height: newHeight,
            },
          });
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageDataUrl;
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Calculate optimal dimensions maintaining aspect ratio
 */
const calculateDimensions = (
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number,
  maintainAspectRatio: boolean
): { width: number; height: number } => {
  if (!maintainAspectRatio) {
    return {
      width: Math.min(originalWidth, maxWidth),
      height: Math.min(originalHeight, maxHeight),
    };
  }

  const aspectRatio = originalWidth / originalHeight;
  
  let newWidth = originalWidth;
  let newHeight = originalHeight;

  // Scale down if necessary
  if (newWidth > maxWidth) {
    newWidth = maxWidth;
    newHeight = newWidth / aspectRatio;
  }

  if (newHeight > maxHeight) {
    newHeight = maxHeight;
    newWidth = newHeight * aspectRatio;
  }

  return {
    width: Math.round(newWidth),
    height: Math.round(newHeight),
  };
};

/**
 * Enhance image for better OCR results
 */
const enhanceForOCR = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Convert to grayscale and enhance contrast
  for (let i = 0; i < data.length; i += 4) {
    // Convert to grayscale using luminance formula
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    
    // Enhance contrast
    const contrast = 1.2;
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
    const enhancedGray = Math.min(255, Math.max(0, factor * (gray - 128) + 128));

    data[i] = enhancedGray;     // R
    data[i + 1] = enhancedGray; // G
    data[i + 2] = enhancedGray; // B
    // Alpha remains unchanged
  }

  ctx.putImageData(imageData, 0, 0);
};

/**
 * Get size of data URL in bytes
 */
const getDataUrlSize = (dataUrl: string): number => {
  // Remove data URL prefix and calculate base64 size
  const base64 = dataUrl.split(',')[1] || '';
  return Math.round((base64.length * 3) / 4);
};

/**
 * Compress image for storage (smaller size, good quality)
 */
export const compressForStorage = async (
  imageDataUrl: string,
  customOptions?: Partial<CompressionOptions>
): Promise<CompressionResult> => {
  return compressImage(imageDataUrl, {
    ...STORAGE_OPTIONS,
    ...customOptions,
    forStorage: true,
  });
};

/**
 * Compress image for OCR processing (larger size, best quality)
 */
export const compressForOCR = async (
  imageDataUrl: string,
  customOptions?: Partial<CompressionOptions>
): Promise<CompressionResult> => {
  return compressImage(imageDataUrl, {
    ...OCR_OPTIONS,
    ...customOptions,
    forOCR: true,
  });
};

/**
 * Progressive compression - try different quality levels until target size is reached
 */
export const progressiveCompress = async (
  imageDataUrl: string,
  targetSizeKB: number,
  options: CompressionOptions = {}
): Promise<CompressionResult> => {
  const qualityLevels = [0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3];
  
  for (const quality of qualityLevels) {
    const result = await compressImage(imageDataUrl, {
      ...options,
      quality,
    });
    
    const sizeKB = result.compressedSize / 1024;
    
    if (sizeKB <= targetSizeKB) {
      return result;
    }
  }
  
  // If still too large, reduce dimensions
  return compressImage(imageDataUrl, {
    ...options,
    maxWidth: Math.floor((options.maxWidth || 1920) * 0.8),
    maxHeight: Math.floor((options.maxHeight || 1920) * 0.8),
    quality: 0.3,
  });
};

/**
 * Batch compress multiple images
 */
export const batchCompress = async (
  images: string[],
  options: CompressionOptions = {}
): Promise<CompressionResult[]> => {
  const results: CompressionResult[] = [];
  
  for (const imageDataUrl of images) {
    try {
      const result = await compressImage(imageDataUrl, options);
      results.push(result);
    } catch (error) {
      console.error('Failed to compress image:', error);
      // Continue with other images
    }
  }
  
  return results;
};

/**
 * Get compression statistics
 */
export const getCompressionStats = (results: CompressionResult[]) => {
  const totalOriginalSize = results.reduce((sum, r) => sum + r.originalSize, 0);
  const totalCompressedSize = results.reduce((sum, r) => sum + r.compressedSize, 0);
  const averageCompressionRatio = results.reduce((sum, r) => sum + r.compressionRatio, 0) / results.length;
  
  return {
    totalOriginalSize,
    totalCompressedSize,
    totalSavings: totalOriginalSize - totalCompressedSize,
    averageCompressionRatio,
    savingsPercentage: ((totalOriginalSize - totalCompressedSize) / totalOriginalSize) * 100,
  };
};