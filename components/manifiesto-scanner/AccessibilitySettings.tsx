import React from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet } from 'react-native';
import { useAccessibility } from '../../hooks/useAccessibility';
import { AccessibilityOptions } from '../../utils/manifiesto/accessibility';

interface AccessibilitySettingsProps {
  visible: boolean;
  onClose: () => void;
}

export const AccessibilitySettings: React.FC<AccessibilitySettingsProps> = ({
  visible,
  onClose
}) => {
  const { options, updateOption, announce } = useAccessibility();

  if (!visible) return null;

  const handleToggle = (key: keyof AccessibilityOptions, value: boolean) => {
    updateOption(key, value);
    announce(`${key} ${value ? 'activado' : 'desactivado'}`);
  };

  const handleFontSizeChange = (size: 'small' | 'medium' | 'large') => {
    updateOption('fontSize', size);
    announce(`Tamaño de fuente cambiado a ${size}`);
  };

  return (
    <View 
      style={styles.overlay}
      accessibilityRole="dialog"
      accessibilityLabel="Configuración de accesibilidad"
      accessibilityModal={true}
    >
      <View style={styles.modal}>
        <View style={styles.header}>
          <Text 
            style={styles.title}
            accessibilityRole="heading"
            accessibilityLevel={1}
          >
            Configuración de Accesibilidad
          </Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            accessibilityRole="button"
            accessibilityLabel="Cerrar configuración de accesibilidad"
            accessibilityHint="Toca para cerrar el panel de configuración"
          >
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <Text 
              style={styles.sectionTitle}
              accessibilityRole="heading"
              accessibilityLevel={2}
            >
              Contraste y Tema
            </Text>
            
            <View style={styles.option}>
              <Text style={styles.optionLabel}>Alto Contraste</Text>
              <Switch
                value={options.highContrast}
                onValueChange={(value) => handleToggle('highContrast', value)}
                accessibilityLabel="Activar alto contraste"
                accessibilityHint="Mejora la visibilidad con colores de alto contraste"
              />
            </View>

            <View style={styles.option}>
              <Text style={styles.optionLabel}>Modo Oscuro</Text>
              <Switch
                value={options.darkMode}
                onValueChange={(value) => handleToggle('darkMode', value)}
                accessibilityLabel="Activar modo oscuro"
                accessibilityHint="Cambia a un tema oscuro para reducir el brillo"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text 
              style={styles.sectionTitle}
              accessibilityRole="heading"
              accessibilityLevel={2}
            >
              Tamaño de Fuente
            </Text>
            
            <View style={styles.fontSizeOptions}>
              {(['small', 'medium', 'large'] as const).map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.fontSizeButton,
                    options.fontSize === size && styles.fontSizeButtonActive
                  ]}
                  onPress={() => handleFontSizeChange(size)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: options.fontSize === size }}
                  accessibilityLabel={`Tamaño ${size === 'small' ? 'pequeño' : size === 'medium' ? 'mediano' : 'grande'}`}
                >
                  <Text style={[
                    styles.fontSizeButtonText,
                    options.fontSize === size && styles.fontSizeButtonTextActive
                  ]}>
                    {size === 'small' ? 'A' : size === 'medium' ? 'A' : 'A'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text 
              style={styles.sectionTitle}
              accessibilityRole="heading"
              accessibilityLevel={2}
            >
              Movimiento y Animaciones
            </Text>
            
            <View style={styles.option}>
              <Text style={styles.optionLabel}>Reducir Movimiento</Text>
              <Switch
                value={options.reducedMotion}
                onValueChange={(value) => handleToggle('reducedMotion', value)}
                accessibilityLabel="Reducir animaciones y movimiento"
                accessibilityHint="Minimiza las animaciones para reducir mareos"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text 
              style={styles.sectionTitle}
              accessibilityRole="heading"
              accessibilityLevel={2}
            >
              Lector de Pantalla
            </Text>
            
            <View style={styles.option}>
              <Text style={styles.optionLabel}>Optimizar para Lector de Pantalla</Text>
              <Switch
                value={options.screenReader}
                onValueChange={(value) => handleToggle('screenReader', value)}
                accessibilityLabel="Optimizar para lector de pantalla"
                accessibilityHint="Mejora la experiencia con lectores de pantalla"
              />
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Guardar configuración"
            accessibilityHint="Guarda los cambios y cierra el panel"
          >
            <Text style={styles.saveButtonText}>Guardar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    maxWidth: 400,
    width: '90%',
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  optionLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  fontSizeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  fontSizeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
  },
  fontSizeButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  fontSizeButtonText: {
    fontSize: 16,
    color: '#666',
  },
  fontSizeButtonTextActive: {
    color: 'white',
  },
  footer: {
    marginTop: 20,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});