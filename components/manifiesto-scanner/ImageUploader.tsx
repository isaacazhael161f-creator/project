/**
 * Image Uploader Component
 * Handles image selection from camera or gallery with validation and preview
 */

import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Platform,
  Dimensions,
  TouchableOpacity,
  Text,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { ImageUploaderProps } from '../../types/manifiesto';
import { useResponsive, useResponsiveFontSize, useResponsiveSpacing, useResponsiveImage } from '../../hooks/useResponsive';
import { 
  validateImageFile, 
  validateImageForOCR,
  formatFileSize,
  MAX_FILE_SIZE,
  DEFAULT_SUPPORTED_FORMATS,
  ImageFileInfo 
} from '../../utils/manifiesto/imageValidation';
import { compressForOCR, compressForStorage } from '../../utils/manifiesto/imageCompression';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ImageData {
  uri: string;
  base64: string;
  width: number;
  height: number;
  fileSize: number;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  onImageSelected, 
  supportedFormats = DEFAULT_SUPPORTED_FORMATS 
}) => {
  const { isMobile, isTablet, isDesktop, isTouchDevice } = useResponsive();
  const fontSize = useResponsiveFontSize();
  const spacing = useResponsiveSpacing();
  const imageSize = useResponsiveImage(16/9);
  
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cropMode, setCropMode] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  // Validar archivo usando las utilidades
  const validateFile = (fileInfo: ImageFileInfo): { isValid: boolean; error?: string } => {
    const validation = validateImageFile(fileInfo, {
      supportedFormats,
      maxFileSize: MAX_FILE_SIZE
    });
    
    if (!validation.isValid) {
      return { isValid: false, error: validation.error };
    }

    // Validación adicional para OCR si tenemos dimensiones
    if (fileInfo.width && fileInfo.height) {
      const ocrValidation = validateImageForOCR(fileInfo.width, fileInfo.height, fileInfo.size);
      if (!ocrValidation.isValid) {
        // Para OCR, mostramos una advertencia pero no bloqueamos
        console.warn('OCR Warning:', ocrValidation.error);
      }
    }

    return { isValid: true };
  };

  // Convertir imagen a base64
  const convertToBase64 = async (uri: string): Promise<string> => {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return `data:image/jpeg;base64,${base64}`;
    } catch (error) {
      throw new Error('Error al convertir imagen a base64');
    }
  };

  // Obtener información de la imagen
  const getImageInfo = async (uri: string): Promise<{ width: number; height: number; size: number }> => {
    try {
      const info = await FileSystem.getInfoAsync(uri);
      if (!info.exists) {
        throw new Error('El archivo no existe');
      }

      // Para obtener dimensiones, usamos Image.getSize en web o FileSystem en móvil
      return new Promise((resolve, reject) => {
        if (Platform.OS === 'web') {
          const img = new window.Image();
          img.onload = () => {
            resolve({
              width: img.width,
              height: img.height,
              size: info.size || 0,
            });
          };
          img.onerror = () => reject(new Error('Error al cargar imagen'));
          img.src = uri;
        } else {
          Image.getSize(
            uri,
            (width, height) => {
              resolve({
                width,
                height,
                size: info.size || 0,
              });
            },
            (error) => reject(error)
          );
        }
      });
    } catch (error) {
      throw new Error('Error al obtener información de la imagen');
    }
  };

  // Procesar imagen seleccionada
  const processSelectedImage = async (uri: string, mimeType?: string) => {
    setIsProcessing(true);
    
    try {
      // Obtener información de la imagen
      const imageInfo = await getImageInfo(uri);

      // Crear objeto de información del archivo para validación
      const fileInfo: ImageFileInfo = {
        mimeType: mimeType || 'image/jpeg',
        size: imageInfo.size,
        width: imageInfo.width,
        height: imageInfo.height,
      };

      // Validar archivo usando las utilidades
      const validation = validateFile(fileInfo);
      if (!validation.isValid) {
        Alert.alert('Error de validación', validation.error || 'Archivo no válido');
        return;
      }

      // Convertir a base64
      const base64Data = await convertToBase64(uri);

      // Comprimir imagen para OCR (mejor calidad)
      const ocrCompressed = await compressForOCR(base64Data, {
        maxWidth: 2000,
        maxHeight: 2000,
      });

      // Comprimir imagen para almacenamiento (menor tamaño)
      const storageCompressed = await compressForStorage(base64Data, {
        maxWidth: 1200,
        maxHeight: 1200,
      });

      const processedImageData: ImageData = {
        uri,
        base64: storageCompressed.compressedDataUrl, // Use compressed version for storage
        width: ocrCompressed.dimensions.width,
        height: ocrCompressed.dimensions.height,
        fileSize: storageCompressed.compressedSize,
      };

      setImageData(processedImageData);
      
      // Notificar al componente padre con imagen optimizada para OCR
      onImageSelected(ocrCompressed.compressedDataUrl);

    } catch (error) {
      console.error('Error procesando imagen:', error);
      Alert.alert(
        'Error',
        'No se pudo procesar la imagen. Por favor, intenta con otra imagen.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Tomar foto con cámara
  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        setIsProcessing(true);
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
          skipProcessing: false,
        });
        
        setShowCamera(false);
        await processSelectedImage(photo.uri, 'image/jpeg');
      } catch (error) {
        console.error('Error tomando foto:', error);
        Alert.alert('Error', 'No se pudo tomar la foto');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  // Seleccionar imagen de galería
  const pickImageFromGallery = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        await processSelectedImage(asset.uri, asset.mimeType);
      }
    } catch (error) {
      console.error('Error seleccionando imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  // Abrir cámara
  const openCamera = async () => {
    const hasPermissionGranted = permission?.granted || await requestPermission();
    
    if (!hasPermissionGranted) {
      Alert.alert(
        'Permisos requeridos',
        'Se necesitan permisos de cámara para tomar fotos'
      );
      return;
    }

    setShowCamera(true);
  };

  // Limpiar imagen seleccionada
  const clearImage = () => {
    setImageData(null);
    setCropMode(false);
  };

  // Renderizar vista de cámara
  const renderCameraView = () => (
    <View style={styles.cameraContainer}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
      >
        <View style={styles.cameraOverlay}>
          <View style={styles.cameraControls}>
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={() => setShowCamera(false)}
            >
              <Ionicons name="close" size={30} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.captureButton}
              onPress={takePicture}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="white" />
              ) : (
                <View style={styles.captureButtonInner} />
              )}
            </TouchableOpacity>
            
            <View style={styles.cameraButton} />
          </View>
        </View>
      </CameraView>
    </View>
  );

  // Renderizar preview de imagen
  const renderImagePreview = () => {
    if (!imageData) return null;

    return (
      <View style={styles.previewContainer}>
        <ScrollView 
          style={styles.previewScroll}
          contentContainerStyle={styles.previewContent}
          maximumZoomScale={3}
          minimumZoomScale={1}
        >
          <Image
            source={{ uri: imageData.uri }}
            style={styles.previewImage}
            resizeMode="contain"
          />
        </ScrollView>
        
        <View style={styles.previewInfo}>
          <Text style={[styles.infoText, { fontSize: fontSize.sm }]}>
            Dimensiones: {imageData.width} x {imageData.height}
          </Text>
          <Text style={[styles.infoText, { fontSize: fontSize.sm }]}>
            Tamaño: {formatFileSize(imageData.fileSize)}
          </Text>
        </View>

        <View style={styles.previewActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={clearImage}
          >
            <Ionicons name="trash-outline" size={20} color="#666" />
            <Text style={styles.secondaryButtonText}>Eliminar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={() => setCropMode(!cropMode)}
          >
            <Ionicons name="crop-outline" size={20} color="white" />
            <Text style={styles.primaryButtonText}>
              {cropMode ? 'Finalizar' : 'Recortar'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Get responsive styles
  const responsiveStyles = {
    container: {
      ...styles.container,
      padding: spacing.md,
    },
    title: {
      ...styles.title,
      fontSize: fontSize.title,
      marginBottom: spacing.sm,
    },
    subtitle: {
      ...styles.subtitle,
      fontSize: fontSize.md,
      marginBottom: spacing.xl,
    },
    buttonContainer: {
      ...styles.buttonContainer,
      flexDirection: isMobile ? 'column' : 'row',
      alignItems: 'center',
      gap: spacing.lg,
    },
    selectionButton: {
      ...styles.selectionButton,
      width: isMobile ? '80%' : screenWidth * 0.3,
      height: isTouchDevice ? 120 : 100,
      marginBottom: isMobile ? spacing.md : 0,
    },
    buttonText: {
      ...styles.buttonText,
      fontSize: fontSize.md,
    },
  };

  // Renderizar botones de selección
  const renderSelectionButtons = () => (
    <View style={styles.selectionContainer}>
      <Text style={responsiveStyles.title}>Seleccionar Imagen del Manifiesto</Text>
      <Text style={responsiveStyles.subtitle}>
        Toma una foto o selecciona una imagen de tu galería
      </Text>

      <View style={responsiveStyles.buttonContainer}>
        <TouchableOpacity
          style={[responsiveStyles.selectionButton, styles.cameraButtonStyle]}
          onPress={openCamera}
          disabled={isProcessing}
        >
          <Ionicons name="camera" size={isMobile ? 40 : 32} color="white" />
          <Text style={responsiveStyles.buttonText}>Tomar Foto</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[responsiveStyles.selectionButton, styles.galleryButton]}
          onPress={pickImageFromGallery}
          disabled={isProcessing}
        >
          <Ionicons name="images" size={isMobile ? 40 : 32} color="white" />
          <Text style={responsiveStyles.buttonText}>Seleccionar de Galería</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formatInfo}>
        <Text style={[styles.formatText, { fontSize: fontSize.sm }]}>
          Formatos soportados: {supportedFormats.join(', ')}
        </Text>
        <Text style={[styles.formatText, { fontSize: fontSize.sm }]}>
          Tamaño máximo: {MAX_FILE_SIZE / (1024 * 1024)}MB
        </Text>
      </View>

      {isProcessing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.processingText}>Procesando imagen...</Text>
        </View>
      )}
    </View>
  );

  if (showCamera) {
    return renderCameraView();
  }

  return (
    <View style={styles.container}>
      {imageData ? renderImagePreview() : renderSelectionButtons()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  
  // Estilos de selección
  selectionContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 30,
  },
  selectionButton: {
    width: screenWidth * 0.4,
    height: 120,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cameraButtonStyle: {
    backgroundColor: '#007AFF',
  },
  galleryButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  formatInfo: {
    alignItems: 'center',
  },
  formatText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  
  // Estilos de cámara
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: 50,
  },
  cameraButton: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  
  // Estilos de preview
  previewContainer: {
    flex: 1,
  },
  previewScroll: {
    flex: 1,
  },
  previewContent: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: screenHeight * 0.6,
  },
  previewImage: {
    width: screenWidth - 40,
    height: screenHeight * 0.5,
  },
  previewInfo: {
    padding: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  previewActions: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: 'white',
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  // Estilos de procesamiento
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
});

export default ImageUploader;