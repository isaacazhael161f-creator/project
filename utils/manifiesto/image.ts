/**
 * Image processing utilities for manifiesto scanner
 * Handles image manipulation, compression, and validation
 */

// Supported image formats
export const SUPPORTED_IMAGE_FORMATS = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp'
];

// Image size limits
export const IMAGE_CONSTRAINTS = {
  maxWidth: 2048,
  maxHeight: 2048,
  maxFileSize: 5 * 1024 * 1024, // 5MB
  quality: 0.8
};

/**
 * Validate image file
 */
export const validateImageFile = (file: File): string[] => {
  const errors: string[] = [];
  
  // Check file type
  if (!SUPPORTED_IMAGE_FORMATS.includes(file.type)) {
    errors.push(`Formato no soportado. Use: ${SUPPORTED_IMAGE_FORMATS.join(', ')}`);
  }
  
  // Check file size
  if (file.size > IMAGE_CONSTRAINTS.maxFileSize) {
    const maxSizeMB = IMAGE_CONSTRAINTS.maxFileSize / (1024 * 1024);
    errors.push(`El archivo es demasiado grande. Máximo: ${maxSizeMB}MB`);
  }
  
  return errors;
};

/**
 * Convert file to base64 data URL
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsDataURL(file);
  });
};

/**
 * Resize image to fit constraints while maintaining aspect ratio
 */
export const resizeImage = (
  imageData: string,
  maxWidth: number = IMAGE_CONSTRAINTS.maxWidth,
  maxHeight: number = IMAGE_CONSTRAINTS.maxHeight,
  quality: number = IMAGE_CONSTRAINTS.quality
): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      const { width, height } = calculateNewDimensions(
        img.width,
        img.height,
        maxWidth,
        maxHeight
      );
      
      // Set canvas size
      canvas.width = width;
      canvas.height = height;
      
      // Draw resized image
      ctx?.drawImage(img, 0, 0, width, height);
      
      // Convert to base64 with compression
      const resizedData = canvas.toDataURL('image/jpeg', quality);
      resolve(resizedData);
    };
    
    img.src = imageData;
  });
};

/**
 * Calculate new dimensions maintaining aspect ratio
 */
const calculateNewDimensions = (
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } => {
  let { width, height } = { width: originalWidth, height: originalHeight };
  
  // Check if resizing is needed
  if (width <= maxWidth && height <= maxHeight) {
    return { width, height };
  }
  
  // Calculate scaling factor
  const widthRatio = maxWidth / width;
  const heightRatio = maxHeight / height;
  const scalingFactor = Math.min(widthRatio, heightRatio);
  
  return {
    width: Math.round(width * scalingFactor),
    height: Math.round(height * scalingFactor)
  };
};

/**
 * Enhance image contrast for better OCR results
 */
export const enhanceImageForOCR = (imageData: string): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw original image
      ctx?.drawImage(img, 0, 0);
      
      if (ctx) {
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Apply contrast enhancement and convert to grayscale
        for (let i = 0; i < data.length; i += 4) {
          // Convert to grayscale
          const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
          
          // Apply contrast enhancement
          const enhanced = Math.min(255, Math.max(0, (gray - 128) * 1.5 + 128));
          
          data[i] = enhanced;     // Red
          data[i + 1] = enhanced; // Green
          data[i + 2] = enhanced; // Blue
          // Alpha channel (data[i + 3]) remains unchanged
        }
        
        // Put enhanced image data back
        ctx.putImageData(imageData, 0, 0);
      }
      
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    
    img.src = imageData;
  });
};

/**
 * Rotate image by specified degrees
 */
export const rotateImage = (imageData: string, degrees: number): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      const radians = (degrees * Math.PI) / 180;
      
      // Calculate new canvas dimensions after rotation
      const cos = Math.abs(Math.cos(radians));
      const sin = Math.abs(Math.sin(radians));
      const newWidth = img.width * cos + img.height * sin;
      const newHeight = img.width * sin + img.height * cos;
      
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      if (ctx) {
        // Move to center and rotate
        ctx.translate(newWidth / 2, newHeight / 2);
        ctx.rotate(radians);
        
        // Draw image centered
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
      }
      
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    
    img.src = imageData;
  });
};

/**
 * Crop image to specified rectangle
 */
export const cropImage = (
  imageData: string,
  x: number,
  y: number,
  width: number,
  height: number
): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = width;
      canvas.height = height;
      
      // Draw cropped portion
      ctx?.drawImage(img, x, y, width, height, 0, 0, width, height);
      
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    
    img.src = imageData;
  });
};

/**
 * Get image dimensions from base64 data
 */
export const getImageDimensions = (imageData: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = imageData;
  });
};

/**
 * Compress image to reduce file size
 */
export const compressImage = (
  imageData: string,
  quality: number = 0.7,
  maxWidth?: number,
  maxHeight?: number
): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      let { width, height } = img;
      
      // Resize if max dimensions provided
      if (maxWidth && maxHeight) {
        const dimensions = calculateNewDimensions(width, height, maxWidth, maxHeight);
        width = dimensions.width;
        height = dimensions.height;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    
    img.src = imageData;
  });
};