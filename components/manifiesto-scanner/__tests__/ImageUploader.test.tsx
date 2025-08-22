/**
 * Unit tests for ImageUploader component
 * Tests file validation, format checking, and component behavior
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Camera } from 'expo-camera';
import ImageUploader from '../ImageUploader';

// Mock dependencies
jest.mock('expo-camera');
jest.mock('expo-document-picker');
jest.mock('expo-file-system');
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

const mockCamera = Camera as jest.Mocked<typeof Camera>;
const mockDocumentPicker = DocumentPicker as jest.Mocked<typeof DocumentPicker>;
const mockFileSystem = FileSystem as jest.Mocked<typeof FileSystem>;
const mockAlert = Alert.alert as jest.MockedFunction<typeof Alert.alert>;

describe('ImageUploader', () => {
  const mockOnImageSelected = jest.fn();
  const defaultProps = {
    onImageSelected: mockOnImageSelected,
    supportedFormats: ['image/jpeg', 'image/png', 'image/webp'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCamera.requestCameraPermissionsAsync.mockResolvedValue({ status: 'granted' });
  });

  describe('Rendering', () => {
    it('should render selection buttons initially', () => {
      const { getByText } = render(<ImageUploader {...defaultProps} />);
      
      expect(getByText('Seleccionar Imagen del Manifiesto')).toBeTruthy();
      expect(getByText('Tomar Foto')).toBeTruthy();
      expect(getByText('Seleccionar de Galería')).toBeTruthy();
    });

    it('should display supported formats information', () => {
      const { getByText } = render(<ImageUploader {...defaultProps} />);
      
      expect(getByText('Formatos soportados: image/jpeg, image/png, image/webp')).toBeTruthy();
      expect(getByText('Tamaño máximo: 10MB')).toBeTruthy();
    });
  });

  describe('File Format Validation', () => {
    it('should accept supported image formats', async () => {
      const supportedFormats = ['image/jpeg', 'image/png', 'image/webp'];
      
      mockDocumentPicker.getDocumentAsync.mockResolvedValue({
        canceled: false,
        assets: [{
          uri: 'file://test-image.jpg',
          mimeType: 'image/jpeg',
          name: 'test-image.jpg',
          size: 1024 * 1024, // 1MB
        }],
      });

      mockFileSystem.getInfoAsync.mockResolvedValue({
        exists: true,
        size: 1024 * 1024,
        isDirectory: false,
        modificationTime: Date.now(),
        uri: 'file://test-image.jpg',
      });

      mockFileSystem.readAsStringAsync.mockResolvedValue('base64encodedstring');

      const { getByText } = render(
        <ImageUploader 
          onImageSelected={mockOnImageSelected}
          supportedFormats={supportedFormats}
        />
      );

      fireEvent.press(getByText('Seleccionar de Galería'));

      await waitFor(() => {
        expect(mockDocumentPicker.getDocumentAsync).toHaveBeenCalled();
      });

      // Should not show format error
      expect(mockAlert).not.toHaveBeenCalledWith(
        'Formato no soportado',
        expect.any(String)
      );
    });

    it('should reject unsupported image formats', async () => {
      mockDocumentPicker.getDocumentAsync.mockResolvedValue({
        canceled: false,
        assets: [{
          uri: 'file://test-image.gif',
          mimeType: 'image/gif',
          name: 'test-image.gif',
          size: 1024 * 1024,
        }],
      });

      mockFileSystem.getInfoAsync.mockResolvedValue({
        exists: true,
        size: 1024 * 1024,
        isDirectory: false,
        modificationTime: Date.now(),
        uri: 'file://test-image.gif',
      });

      const { getByText } = render(<ImageUploader {...defaultProps} />);

      fireEvent.press(getByText('Seleccionar de Galería'));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Formato no soportado',
          'Los formatos soportados son: image/jpeg, image/png, image/webp'
        );
      });
    });

    it('should handle case-insensitive format validation', async () => {
      mockDocumentPicker.getDocumentAsync.mockResolvedValue({
        canceled: false,
        assets: [{
          uri: 'file://test-image.jpg',
          mimeType: 'IMAGE/JPEG', // Uppercase
          name: 'test-image.jpg',
          size: 1024 * 1024,
        }],
      });

      mockFileSystem.getInfoAsync.mockResolvedValue({
        exists: true,
        size: 1024 * 1024,
        isDirectory: false,
        modificationTime: Date.now(),
        uri: 'file://test-image.jpg',
      });

      mockFileSystem.readAsStringAsync.mockResolvedValue('base64encodedstring');

      const { getByText } = render(<ImageUploader {...defaultProps} />);

      fireEvent.press(getByText('Seleccionar de Galería'));

      await waitFor(() => {
        expect(mockDocumentPicker.getDocumentAsync).toHaveBeenCalled();
      });

      // Should not show format error for uppercase MIME type
      expect(mockAlert).not.toHaveBeenCalledWith(
        'Formato no soportado',
        expect.any(String)
      );
    });
  });

  describe('File Size Validation', () => {
    it('should accept files within size limit', async () => {
      const validSize = 5 * 1024 * 1024; // 5MB (within 10MB limit)

      mockDocumentPicker.getDocumentAsync.mockResolvedValue({
        canceled: false,
        assets: [{
          uri: 'file://test-image.jpg',
          mimeType: 'image/jpeg',
          name: 'test-image.jpg',
          size: validSize,
        }],
      });

      mockFileSystem.getInfoAsync.mockResolvedValue({
        exists: true,
        size: validSize,
        isDirectory: false,
        modificationTime: Date.now(),
        uri: 'file://test-image.jpg',
      });

      mockFileSystem.readAsStringAsync.mockResolvedValue('base64encodedstring');

      const { getByText } = render(<ImageUploader {...defaultProps} />);

      fireEvent.press(getByText('Seleccionar de Galería'));

      await waitFor(() => {
        expect(mockDocumentPicker.getDocumentAsync).toHaveBeenCalled();
      });

      // Should not show size error
      expect(mockAlert).not.toHaveBeenCalledWith(
        'Archivo muy grande',
        expect.any(String)
      );
    });

    it('should reject files exceeding size limit', async () => {
      const oversizedFile = 15 * 1024 * 1024; // 15MB (exceeds 10MB limit)

      mockDocumentPicker.getDocumentAsync.mockResolvedValue({
        canceled: false,
        assets: [{
          uri: 'file://large-image.jpg',
          mimeType: 'image/jpeg',
          name: 'large-image.jpg',
          size: oversizedFile,
        }],
      });

      mockFileSystem.getInfoAsync.mockResolvedValue({
        exists: true,
        size: oversizedFile,
        isDirectory: false,
        modificationTime: Date.now(),
        uri: 'file://large-image.jpg',
      });

      const { getByText } = render(<ImageUploader {...defaultProps} />);

      fireEvent.press(getByText('Seleccionar de Galería'));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Archivo muy grande',
          'El archivo debe ser menor a 10MB'
        );
      });
    });

    it('should handle edge case of exactly maximum file size', async () => {
      const maxSize = 10 * 1024 * 1024; // Exactly 10MB

      mockDocumentPicker.getDocumentAsync.mockResolvedValue({
        canceled: false,
        assets: [{
          uri: 'file://max-size-image.jpg',
          mimeType: 'image/jpeg',
          name: 'max-size-image.jpg',
          size: maxSize,
        }],
      });

      mockFileSystem.getInfoAsync.mockResolvedValue({
        exists: true,
        size: maxSize,
        isDirectory: false,
        modificationTime: Date.now(),
        uri: 'file://max-size-image.jpg',
      });

      mockFileSystem.readAsStringAsync.mockResolvedValue('base64encodedstring');

      const { getByText } = render(<ImageUploader {...defaultProps} />);

      fireEvent.press(getByText('Seleccionar de Galería'));

      await waitFor(() => {
        expect(mockDocumentPicker.getDocumentAsync).toHaveBeenCalled();
      });

      // Should accept exactly maximum size
      expect(mockAlert).not.toHaveBeenCalledWith(
        'Archivo muy grande',
        expect.any(String)
      );
    });
  });

  describe('Image Processing', () => {
    it('should convert valid image to base64 and call onImageSelected', async () => {
      const mockBase64 = 'mockbase64string';
      
      mockDocumentPicker.getDocumentAsync.mockResolvedValue({
        canceled: false,
        assets: [{
          uri: 'file://test-image.jpg',
          mimeType: 'image/jpeg',
          name: 'test-image.jpg',
          size: 1024 * 1024,
        }],
      });

      mockFileSystem.getInfoAsync.mockResolvedValue({
        exists: true,
        size: 1024 * 1024,
        isDirectory: false,
        modificationTime: Date.now(),
        uri: 'file://test-image.jpg',
      });

      mockFileSystem.readAsStringAsync.mockResolvedValue(mockBase64);

      const { getByText } = render(<ImageUploader {...defaultProps} />);

      fireEvent.press(getByText('Seleccionar de Galería'));

      await waitFor(() => {
        expect(mockOnImageSelected).toHaveBeenCalledWith(
          `data:image/jpeg;base64,${mockBase64}`
        );
      });
    });

    it('should handle file system errors gracefully', async () => {
      mockDocumentPicker.getDocumentAsync.mockResolvedValue({
        canceled: false,
        assets: [{
          uri: 'file://corrupted-image.jpg',
          mimeType: 'image/jpeg',
          name: 'corrupted-image.jpg',
          size: 1024 * 1024,
        }],
      });

      mockFileSystem.getInfoAsync.mockRejectedValue(new Error('File system error'));

      const { getByText } = render(<ImageUploader {...defaultProps} />);

      fireEvent.press(getByText('Seleccionar de Galería'));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Error',
          'No se pudo procesar la imagen. Por favor, intenta con otra imagen.'
        );
      });
    });

    it('should handle base64 conversion errors', async () => {
      mockDocumentPicker.getDocumentAsync.mockResolvedValue({
        canceled: false,
        assets: [{
          uri: 'file://test-image.jpg',
          mimeType: 'image/jpeg',
          name: 'test-image.jpg',
          size: 1024 * 1024,
        }],
      });

      mockFileSystem.getInfoAsync.mockResolvedValue({
        exists: true,
        size: 1024 * 1024,
        isDirectory: false,
        modificationTime: Date.now(),
        uri: 'file://test-image.jpg',
      });

      mockFileSystem.readAsStringAsync.mockRejectedValue(new Error('Base64 conversion failed'));

      const { getByText } = render(<ImageUploader {...defaultProps} />);

      fireEvent.press(getByText('Seleccionar de Galería'));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Error',
          'No se pudo procesar la imagen. Por favor, intenta con otra imagen.'
        );
      });
    });
  });

  describe('Camera Functionality', () => {
    it('should request camera permissions when opening camera', async () => {
      const { getByText } = render(<ImageUploader {...defaultProps} />);

      fireEvent.press(getByText('Tomar Foto'));

      await waitFor(() => {
        expect(mockCamera.requestCameraPermissionsAsync).toHaveBeenCalled();
      });
    });

    it('should show permission error when camera access is denied', async () => {
      mockCamera.requestCameraPermissionsAsync.mockResolvedValue({ status: 'denied' });

      const { getByText } = render(<ImageUploader {...defaultProps} />);

      fireEvent.press(getByText('Tomar Foto'));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Permisos requeridos',
          'Se necesitan permisos de cámara para tomar fotos'
        );
      });
    });
  });

  describe('Image Preview', () => {
    it('should show image preview after successful image selection', async () => {
      mockDocumentPicker.getDocumentAsync.mockResolvedValue({
        canceled: false,
        assets: [{
          uri: 'file://test-image.jpg',
          mimeType: 'image/jpeg',
          name: 'test-image.jpg',
          size: 1024 * 1024,
        }],
      });

      mockFileSystem.getInfoAsync.mockResolvedValue({
        exists: true,
        size: 1024 * 1024,
        isDirectory: false,
        modificationTime: Date.now(),
        uri: 'file://test-image.jpg',
      });

      mockFileSystem.readAsStringAsync.mockResolvedValue('base64string');

      // Mock Image.getSize for getting image dimensions
      const mockGetSize = jest.fn((uri, success) => {
        success(800, 600); // Mock dimensions
      });
      
      // Mock the Image component's getSize method
      jest.doMock('react-native', () => ({
        ...jest.requireActual('react-native'),
        Image: {
          ...jest.requireActual('react-native').Image,
          getSize: mockGetSize,
        },
      }));

      const { getByText, rerender } = render(<ImageUploader {...defaultProps} />);

      fireEvent.press(getByText('Seleccionar de Galería'));

      await waitFor(() => {
        expect(mockOnImageSelected).toHaveBeenCalled();
      });

      // Re-render to show the preview
      rerender(<ImageUploader {...defaultProps} />);

      // Should show preview actions
      await waitFor(() => {
        expect(getByText('Eliminar')).toBeTruthy();
        expect(getByText('Recortar')).toBeTruthy();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle document picker cancellation gracefully', async () => {
      mockDocumentPicker.getDocumentAsync.mockResolvedValue({
        canceled: true,
        assets: null,
      });

      const { getByText } = render(<ImageUploader {...defaultProps} />);

      fireEvent.press(getByText('Seleccionar de Galería'));

      await waitFor(() => {
        expect(mockDocumentPicker.getDocumentAsync).toHaveBeenCalled();
      });

      // Should not call onImageSelected or show errors
      expect(mockOnImageSelected).not.toHaveBeenCalled();
      expect(mockAlert).not.toHaveBeenCalled();
    });

    it('should handle document picker errors', async () => {
      mockDocumentPicker.getDocumentAsync.mockRejectedValue(new Error('Document picker error'));

      const { getByText } = render(<ImageUploader {...defaultProps} />);

      fireEvent.press(getByText('Seleccionar de Galería'));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Error',
          'No se pudo seleccionar la imagen'
        );
      });
    });

    it('should handle non-existent files', async () => {
      mockDocumentPicker.getDocumentAsync.mockResolvedValue({
        canceled: false,
        assets: [{
          uri: 'file://non-existent.jpg',
          mimeType: 'image/jpeg',
          name: 'non-existent.jpg',
          size: 1024 * 1024,
        }],
      });

      mockFileSystem.getInfoAsync.mockResolvedValue({
        exists: false,
        size: 0,
        isDirectory: false,
        modificationTime: 0,
        uri: 'file://non-existent.jpg',
      });

      const { getByText } = render(<ImageUploader {...defaultProps} />);

      fireEvent.press(getByText('Seleccionar de Galería'));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Error',
          'No se pudo procesar la imagen. Por favor, intenta con otra imagen.'
        );
      });
    });
  });

  describe('Custom Supported Formats', () => {
    it('should use custom supported formats when provided', () => {
      const customFormats = ['image/jpeg', 'image/png'];
      
      const { getByText } = render(
        <ImageUploader 
          onImageSelected={mockOnImageSelected}
          supportedFormats={customFormats}
        />
      );

      expect(getByText('Formatos soportados: image/jpeg, image/png')).toBeTruthy();
    });

    it('should use default formats when none provided', () => {
      const { getByText } = render(
        <ImageUploader onImageSelected={mockOnImageSelected} supportedFormats={[]} />
      );

      // Should fall back to default formats
      expect(getByText(/Formatos soportados:/)).toBeTruthy();
    });
  });
});