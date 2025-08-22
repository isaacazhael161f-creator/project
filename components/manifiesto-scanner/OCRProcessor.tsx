/**
 * OCR Processor Component
 * Handles text extraction using Tesseract.js with preprocessing and progress tracking
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  ActivityIndicator, 
  TouchableOpacity,
  Alert,
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Tesseract from 'tesseract.js';
import { OCRProcessorProps } from '../../types/manifiesto';
import { useResponsive, useResponsiveFontSize, useResponsiveSpacing } from '../../hooks/useResponsive';

// Configuración de OCR optimizada para manifiestos
const OCR_CONFIG = {
  lang: 'spa+eng', // Español e inglés
  options: {
    tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789:/-.,() ',
    tessedit_pageseg_mode: Tesseract.PSM.AUTO,
    preserve_interword_spaces: '1',
  }
};

// Timeout para operaciones OCR (30 segundos)
const OCR_TIMEOUT = 30000;

interface OCRStatus {
  status: 'idle' | 'preprocessing' | 'recognizing' | 'completed' | 'error' | 'cancelled';
  progress: number;
  message: string;
}

const OCRProcessor: React.FC<OCRProcessorProps> = ({ 
  imageData, 
  onTextExtracted, 
  onProgress, 
  onError 
}) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const fontSize = useResponsiveFontSize();
  const spacing = useResponsiveSpacing();
  
  const [ocrStatus, setOCRStatus] = useState<OCRStatus>({
    status: 'idle',
    progress: 0,
    message: 'Listo para procesar'
  });
  
  const [extractedText, setExtractedText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const workerRef = useRef<Tesseract.Worker | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Limpiar recursos al desmontar
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Preprocesar imagen para mejorar OCR
  const preprocessImage = async (imageDataUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
          // Configurar canvas con dimensiones optimizadas
          const maxWidth = 2000;
          const maxHeight = 2000;
          let { width, height } = img;

          // Redimensionar si es necesario
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width *= ratio;
            height *= ratio;
          }

          canvas.width = width;
          canvas.height = height;

          if (!ctx) {
            reject(new Error('No se pudo crear contexto de canvas'));
            return;
          }

          // Dibujar imagen original
          ctx.drawImage(img, 0, 0, width, height);

          // Aplicar filtros para mejorar OCR
          const imageData = ctx.getImageData(0, 0, width, height);
          const data = imageData.data;

          // Aumentar contraste y convertir a escala de grises
          for (let i = 0; i < data.length; i += 4) {
            // Convertir a escala de grises
            const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            
            // Aumentar contraste
            const contrast = 1.5;
            const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
            const enhancedGray = Math.min(255, Math.max(0, factor * (gray - 128) + 128));

            data[i] = enhancedGray;     // R
            data[i + 1] = enhancedGray; // G
            data[i + 2] = enhancedGray; // B
            // Alpha permanece igual
          }

          ctx.putImageData(imageData, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        };

        img.onerror = () => reject(new Error('Error al cargar imagen para preprocesamiento'));
        img.src = imageDataUrl;
      } catch (error) {
        reject(error);
      }
    });
  };

  // Actualizar estado y notificar progreso
  const updateStatus = (status: OCRStatus['status'], progress: number, message: string) => {
    const newStatus = { status, progress, message };
    setOCRStatus(newStatus);
    onProgress(progress);
  };

  // Procesar imagen con OCR
  const processImage = async () => {
    if (!imageData || isProcessing) return;

    setIsProcessing(true);
    updateStatus('preprocessing', 10, 'Preparando imagen...');

    try {
      // Preprocesar imagen
      const preprocessedImage = Platform.OS === 'web' 
        ? await preprocessImage(imageData)
        : imageData;

      updateStatus('recognizing', 20, 'Inicializando OCR...');

      // Crear worker de Tesseract
      const worker = await Tesseract.createWorker();

      workerRef.current = worker;

      // Configurar timeout
      const timeout = setTimeout(() => {
        if (worker) {
          worker.terminate();
          updateStatus('error', 0, 'Tiempo de espera agotado');
          onError('El procesamiento OCR tardó demasiado tiempo');
          setIsProcessing(false);
        }
      }, OCR_TIMEOUT);
      timeoutRef.current = timeout as any;

      // Cargar idiomas y configurar opciones
      await worker.loadLanguage(OCR_CONFIG.lang);
      await worker.initialize(OCR_CONFIG.lang);
      await worker.setParameters(OCR_CONFIG.options);

      updateStatus('recognizing', 90, 'Extrayendo texto...');

      // Reconocer texto
      const { data: { text, confidence } } = await worker.recognize(preprocessedImage);

      // Limpiar timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current as any);
        timeoutRef.current = null;
      }

      // Terminar worker
      await worker.terminate();
      workerRef.current = null;

      // Limpiar y procesar texto extraído
      const cleanedText = text
        .replace(/\n\s*\n/g, '\n') // Eliminar líneas vacías múltiples
        .replace(/\s+/g, ' ') // Normalizar espacios
        .trim();

      setExtractedText(cleanedText);
      updateStatus('completed', 100, `Texto extraído (Confianza: ${Math.round(confidence)}%)`);
      
      // Notificar texto extraído
      onTextExtracted(cleanedText);

    } catch (error) {
      console.error('Error en OCR:', error);
      
      // Limpiar recursos
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current as any);
        timeoutRef.current = null;
      }
      
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }

      const errorMessage = error instanceof Error ? error.message : 'Error desconocido en OCR';
      updateStatus('error', 0, `Error: ${errorMessage}`);
      onError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // Cancelar procesamiento
  const cancelProcessing = async () => {
    if (!isProcessing) return;

    try {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current as any);
        timeoutRef.current = null;
      }

      if (workerRef.current) {
        await workerRef.current.terminate();
        workerRef.current = null;
      }

      updateStatus('cancelled', 0, 'Procesamiento cancelado');
      setIsProcessing(false);
    } catch (error) {
      console.error('Error al cancelar OCR:', error);
    }
  };

  // Reiniciar procesamiento
  const resetProcessor = () => {
    setExtractedText('');
    updateStatus('idle', 0, 'Listo para procesar');
  };

  // Renderizar indicador de progreso
  const renderProgressIndicator = () => {
    if (ocrStatus.status === 'idle') return null;

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Procesando OCR</Text>
          {isProcessing && (
            <TouchableOpacity onPress={cancelProcessing} style={styles.cancelButton}>
              <Ionicons name="close-circle" size={24} color="#FF3B30" />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.progressBarContainer}>
          <View 
            style={[styles.progressBar, { width: `${ocrStatus.progress}%` }]} 
          />
        </View>
        
        <Text style={styles.progressMessage}>{ocrStatus.message}</Text>
        
        {isProcessing && (
          <ActivityIndicator 
            size="large" 
            color="#007AFF" 
            style={styles.activityIndicator}
          />
        )}
      </View>
    );
  };

  // Renderizar controles
  const renderControls = () => (
    <View style={styles.controlsContainer}>
      {!isProcessing && ocrStatus.status === 'idle' && (
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]}
          onPress={processImage}
          disabled={!imageData}
        >
          <Ionicons name="scan" size={20} color="white" />
          <Text style={styles.primaryButtonText}>Iniciar OCR</Text>
        </TouchableOpacity>
      )}

      {ocrStatus.status === 'completed' && (
        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]}
          onPress={resetProcessor}
        >
          <Ionicons name="refresh" size={20} color="#007AFF" />
          <Text style={styles.secondaryButtonText}>Procesar de nuevo</Text>
        </TouchableOpacity>
      )}

      {ocrStatus.status === 'error' && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error en el procesamiento OCR</Text>
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]}
            onPress={processImage}
          >
            <Ionicons name="refresh" size={20} color="white" />
            <Text style={styles.primaryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // Renderizar texto extraído (preview)
  const renderExtractedText = () => {
    if (!extractedText || ocrStatus.status !== 'completed') return null;

    return (
      <View style={styles.textPreviewContainer}>
        <Text style={styles.textPreviewTitle}>Texto Extraído:</Text>
        <View style={styles.textPreview}>
          <Text style={styles.extractedText} numberOfLines={10}>
            {extractedText}
          </Text>
        </View>
        <Text style={styles.textPreviewNote}>
          El texto será procesado automáticamente para extraer los datos del manifiesto
        </Text>
      </View>
    );
  };

  const responsiveStyles = {
    container: {
      ...styles.container,
      padding: spacing.md,
    },
    title: {
      ...styles.title,
      fontSize: fontSize.xl,
      marginLeft: spacing.sm,
    },
    progressContainer: {
      ...styles.progressContainer,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    progressTitle: {
      ...styles.progressTitle,
      fontSize: fontSize.lg,
    },
    progressMessage: {
      ...styles.progressMessage,
      fontSize: fontSize.md,
    },
  };

  return (
    <View style={responsiveStyles.container}>
      <View style={styles.header}>
        <Ionicons name="document-text" size={isMobile ? 24 : 28} color="#007AFF" />
        <Text style={responsiveStyles.title}>Reconocimiento de Texto (OCR)</Text>
      </View>

      {renderProgressIndicator()}
      {renderControls()}
      {renderExtractedText()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },

  // Estilos de progreso
  progressContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  
  cancelButton: {
    padding: 5,
  },
  
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    marginBottom: 10,
    overflow: 'hidden',
  },
  
  progressBar: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  
  progressMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  
  activityIndicator: {
    marginTop: 15,
  },

  // Estilos de controles
  controlsContainer: {
    marginBottom: 20,
  },
  
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
  },
  
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  // Estilos de error
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
  },

  // Estilos de texto extraído
  textPreviewContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  
  textPreviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  
  textPreview: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    maxHeight: 200,
  },
  
  extractedText: {
    fontSize: 12,
    color: '#333',
    lineHeight: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  
  textPreviewNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default OCRProcessor;