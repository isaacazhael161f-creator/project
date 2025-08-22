/**
 * Example component demonstrating export functionality
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { 
  exportManifiestos, 
  createDefaultExportOptions,
  getAvailableCSVFields,
  validateExportOptions
} from '../../utils/manifiesto/export';
import { ExportFormat, StoredManifiesto, ExportOptions } from '../../types/manifiesto';

interface ExportExampleProps {
  manifiestos: StoredManifiesto[];
}

export const ExportExample: React.FC<ExportExampleProps> = ({ manifiestos }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: ExportFormat) => {
    try {
      setIsExporting(true);
      
      // Create export options with custom CSV settings
      const options: ExportOptions = {
        ...createDefaultExportOptions(format),
        csvOptions: {
          delimiter: ',',
          includeHeaders: true,
          dateFormat: 'DD/MM/YYYY',
          numberFormat: 'integer',
          // Only include essential fields for demo
          customFields: [
            'fecha', 'folio', 'transportista', 'numeroVuelo',
            'origenVuelo', 'destinoVuelo', 'totalPasajeros', 'totalCarga'
          ]
        }
      };

      // Validate options
      const errors = validateExportOptions(options);
      if (errors.length > 0) {
        Alert.alert('Error de Validación', errors.join('\n'));
        return;
      }

      // Export data
      await exportManifiestos(manifiestos, options);
      
      Alert.alert(
        'Exportación Exitosa', 
        `Se han exportado ${manifiestos.length} manifiestos en formato ${format.toUpperCase()}`
      );
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert(
        'Error de Exportación', 
        error instanceof Error ? error.message : 'Error desconocido'
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleCustomCSVExport = async () => {
    try {
      setIsExporting(true);
      
      // Example of custom CSV export with specific fields
      const options: ExportOptions = {
        format: ExportFormat.CSV,
        includeMetadata: false,
        csvOptions: {
          delimiter: ';', // Use semicolon for European Excel compatibility
          includeHeaders: true,
          dateFormat: 'DD/MM/YYYY',
          numberFormat: 'integer',
          customFields: ['fecha', 'numeroVuelo', 'transportista', 'totalPasajeros'],
          excludeFields: ['imagenOriginal'] // Exclude large image data
        }
      };

      await exportManifiestos(manifiestos, options);
      
      Alert.alert(
        'Exportación Personalizada Exitosa', 
        'CSV exportado con configuración personalizada'
      );
    } catch (error) {
      console.error('Custom export error:', error);
      Alert.alert('Error', 'Error en exportación personalizada');
    } finally {
      setIsExporting(false);
    }
  };

  const showAvailableFields = () => {
    const fields = getAvailableCSVFields();
    const fieldList = fields.map(f => `${f.key}: ${f.label}`).join('\n');
    Alert.alert('Campos Disponibles para CSV', fieldList);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Exportar Manifiestos</Text>
      <Text style={styles.subtitle}>
        {manifiestos.length} manifiestos disponibles para exportar
      </Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.csvButton]}
          onPress={() => handleExport(ExportFormat.CSV)}
          disabled={isExporting || manifiestos.length === 0}
        >
          <Text style={styles.buttonText}>Exportar CSV</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.jsonButton]}
          onPress={() => handleExport(ExportFormat.JSON)}
          disabled={isExporting || manifiestos.length === 0}
        >
          <Text style={styles.buttonText}>Exportar JSON</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.customButton]}
          onPress={handleCustomCSVExport}
          disabled={isExporting || manifiestos.length === 0}
        >
          <Text style={styles.buttonText}>CSV Personalizado</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.infoButton]}
          onPress={showAvailableFields}
        >
          <Text style={styles.buttonText}>Ver Campos</Text>
        </TouchableOpacity>
      </View>

      {isExporting && (
        <Text style={styles.loadingText}>Exportando...</Text>
      )}

      {manifiestos.length === 0 && (
        <Text style={styles.emptyText}>
          No hay manifiestos para exportar
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    margin: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  button: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 5,
    marginBottom: 10,
    minWidth: '45%',
    alignItems: 'center',
  },
  csvButton: {
    backgroundColor: '#4CAF50',
  },
  jsonButton: {
    backgroundColor: '#2196F3',
  },
  customButton: {
    backgroundColor: '#FF9800',
  },
  infoButton: {
    backgroundColor: '#9C27B0',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginTop: 10,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    marginTop: 10,
  },
});

export default ExportExample;