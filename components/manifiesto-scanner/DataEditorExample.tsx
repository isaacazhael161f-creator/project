/**
 * DataEditor Usage Example
 * Demonstrates how to use the DataEditor component
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { DataEditor } from './DataEditor';
import { ManifiestoData } from '../../types/manifiesto';
import { VALIDATION_RULES } from '../../utils/manifiesto/validation';

// Example initial data (could come from OCR processing)
const exampleManifiestoData: Partial<ManifiestoData> = {
  fecha: '15/12/2024',
  folio: 'MX001234',
  aeropuertoSalida: 'MEX',
  tipoVuelo: 'Nacional',
  transportista: 'Aeroméxico',
  equipo: 'B737',
  matricula: 'XA-AMX',
  numeroVuelo: 'AM123',
  pilotoAlMando: 'Juan Carlos Pérez',
  numeroLicencia: 'LIC123456',
  tripulacion: 4,
  origenVuelo: 'GDL',
  proximaEscala: '',
  destinoVuelo: 'CUN',
  horaSlotAsignado: '14:30',
  horaSlotCoordinado: '14:35',
  horaTerminoPernocta: '',
  horaInicioManiobras: '14:00',
  horaSalidaPosicion: '14:45',
  causaDemora: '',
  codigoCausa: 'NONE',
  pasajeros: {
    nacional: 120,
    internacional: 0,
    diplomaticos: 0,
    enComision: 2,
    infantes: 8,
    transitos: 0,
    conexiones: 0,
    otrosExentos: 0,
    total: 130 // Will be auto-calculated
  },
  carga: {
    equipaje: 2500.5,
    carga: 1200.0,
    correo: 50.0,
    total: 3750.5 // Will be auto-calculated
  }
};

export const DataEditorExample: React.FC = () => {
  const [manifiestoData, setManifiestoData] = useState<Partial<ManifiestoData>>(exampleManifiestoData);
  const [isValid, setIsValid] = useState(false);

  const handleDataChanged = (updatedData: ManifiestoData) => {
    setManifiestoData(updatedData);
    
    // Check if data is valid (no validation errors)
    const hasErrors = Object.keys(updatedData).length === 0;
    setIsValid(!hasErrors);
    
    console.log('Data updated:', updatedData);
    console.log('Is edited:', updatedData.editado);
  };

  const handleSave = () => {
    if (isValid) {
      Alert.alert(
        'Datos Guardados',
        'Los datos del manifiesto han sido guardados correctamente.',
        [{ text: 'OK' }]
      );
      
      // Here you would typically save to storage or send to server
      console.log('Saving manifiesto data:', manifiestoData);
    } else {
      Alert.alert(
        'Datos Incompletos',
        'Por favor complete todos los campos requeridos antes de guardar.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Editor de Manifiesto</Text>
        <Text style={styles.subtitle}>
          Complete y verifique los datos extraídos del manifiesto
        </Text>
      </View>

      <DataEditor
        data={manifiestoData}
        onDataChanged={handleDataChanged}
        validationRules={VALIDATION_RULES}
      />

      <View style={styles.footer}>
        <Text style={styles.statusText}>
          Estado: {isValid ? '✅ Válido' : '⚠️ Requiere correcciones'}
        </Text>
        
        {manifiestoData.editado && (
          <Text style={styles.editedText}>
            📝 Datos editados manualmente
          </Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  footer: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  editedText: {
    fontSize: 14,
    color: '#3498db',
    fontStyle: 'italic',
  },
});