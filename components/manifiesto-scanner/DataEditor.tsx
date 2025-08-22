/**
 * DataEditor Component
 * Provides an editable interface for manifiesto data with real-time validation
 * and visual highlighting of edited fields
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { ManifiestoData, DataEditorProps, ValidationRule } from '../../types/manifiesto';
import { validateManifiestoData, validateField, sanitizeFieldValue } from '../../utils/manifiesto/validation';
import { useResponsive, useResponsiveFontSize, useResponsiveSpacing, useResponsiveGrid } from '../../hooks/useResponsive';
import { useDebouncedValidation } from '../../hooks/useDebouncedValidation';

// Import custom input components
import { TextInputField } from './inputs/TextInputField';
import { NumberInputField } from './inputs/NumberInputField';
import { DateInputField } from './inputs/DateInputField';
import { TimeInputField } from './inputs/TimeInputField';
import { SelectInputField } from './inputs/SelectInputField';

interface DataEditorState {
  data: Partial<ManifiestoData>;
  editedFields: Set<keyof ManifiestoData>;
  validationErrors: { [key: string]: string };
  isValidating: boolean;
}

export const DataEditor: React.FC<DataEditorProps> = ({
  data: initialData,
  onDataChanged,
  validationRules
}) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const fontSize = useResponsiveFontSize();
  const spacing = useResponsiveSpacing();
  const { getGridStyles, columns } = useResponsiveGrid();
  
  const [state, setState] = useState<DataEditorState>({
    data: initialData,
    editedFields: new Set(),
    validationErrors: {},
    isValidating: false
  });

  // Use debounced validation hook
  const {
    errors: debouncedErrors,
    isValidating: isDebouncedValidating,
    validateField: validateFieldDebounced,
    validateAll,
  } = useDebouncedValidation(state.data, validationRules, {
    debounceMs: 300,
    validateOnChange: true,
  });

  // Update state with debounced validation results
  useEffect(() => {
    setState(prev => ({
      ...prev,
      validationErrors: debouncedErrors,
      isValidating: isDebouncedValidating,
    }));
  }, [debouncedErrors, isDebouncedValidating]);

  // Handle field value changes with debounced validation
  const handleFieldChange = useCallback((field: keyof ManifiestoData, value: any) => {
    const sanitizedValue = typeof value === 'string' ? sanitizeFieldValue(field, value) : value;
    
    setState(prev => ({
      ...prev,
      data: { ...prev.data, [field]: sanitizedValue },
      editedFields: new Set([...prev.editedFields, field])
    }));

    // Trigger debounced validation for this field
    validateFieldDebounced(field, sanitizedValue);
  }, [validateFieldDebounced]);

  // Handle nested object changes (passengers, cargo)
  const handleNestedFieldChange = useCallback((
    parentField: 'pasajeros' | 'carga',
    childField: string,
    value: number
  ) => {
    setState(prev => {
      const parentData = prev.data[parentField] || {};
      const updatedParentData = { ...parentData, [childField]: value };
      
      // Auto-calculate totals
      if (parentField === 'pasajeros') {
        const passengerData = updatedParentData as any;
        passengerData.total = (passengerData.nacional || 0) + 
                             (passengerData.internacional || 0) + 
                             (passengerData.diplomaticos || 0) + 
                             (passengerData.enComision || 0) + 
                             (passengerData.infantes || 0) + 
                             (passengerData.transitos || 0) + 
                             (passengerData.conexiones || 0) + 
                             (passengerData.otrosExentos || 0);
      } else if (parentField === 'carga') {
        const cargoData = updatedParentData as any;
        cargoData.total = (cargoData.equipaje || 0) + 
                         (cargoData.carga || 0) + 
                         (cargoData.correo || 0);
      }
      
      return {
        ...prev,
        data: { ...prev.data, [parentField]: updatedParentData },
        editedFields: new Set([...prev.editedFields, parentField])
      };
    });
  }, []);

  // Notify parent component of changes
  useEffect(() => {
    if (Object.keys(state.validationErrors).length === 0 && state.data) {
      const completeData = {
        ...state.data,
        editado: state.editedFields.size > 0,
        fechaProcesamiento: state.data.fechaProcesamiento || new Date()
      } as ManifiestoData;
      
      onDataChanged(completeData);
    }
  }, [state.data, state.validationErrors, state.editedFields, onDataChanged]);

  const isFieldEdited = (field: keyof ManifiestoData): boolean => {
    return state.editedFields.has(field);
  };

  const getFieldError = (field: string): string | undefined => {
    return state.validationErrors[field];
  };

  const responsiveStyles = {
    container: {
      ...styles.container,
      padding: spacing.md,
    },
    title: {
      ...styles.title,
      fontSize: fontSize.title,
      marginBottom: spacing.lg,
    },
    section: {
      ...styles.section,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    sectionTitle: {
      ...styles.sectionTitle,
      fontSize: fontSize.xl,
      marginBottom: spacing.md,
      paddingBottom: spacing.sm,
    },
  };

  const gridStyles = getGridStyles();

  return (
    <ScrollView style={responsiveStyles.container} showsVerticalScrollIndicator={false}>
      <View style={gridStyles.container}>
        <Text style={responsiveStyles.title}>Datos del Manifiesto</Text>
      
        {/* Flight Information Section */}
        <View style={responsiveStyles.section}>
          <Text style={responsiveStyles.sectionTitle}>Información del Vuelo</Text>
          
          <View style={isMobile ? styles.singleColumn : styles.multiColumn}>
        
        <DateInputField
          label="Fecha"
          value={state.data.fecha || ''}
          onValueChange={(value) => handleFieldChange('fecha', value)}
          error={getFieldError('fecha')}
          isEdited={isFieldEdited('fecha')}
          required
        />
        
        <TextInputField
          label="Folio"
          value={state.data.folio || ''}
          onValueChange={(value) => handleFieldChange('folio', value)}
          error={getFieldError('folio')}
          isEdited={isFieldEdited('folio')}
          required
          placeholder="Ej: ABC123"
        />
        
        <SelectInputField
          label="Aeropuerto de Salida"
          value={state.data.aeropuertoSalida || ''}
          onValueChange={(value) => handleFieldChange('aeropuertoSalida', value)}
          error={getFieldError('aeropuertoSalida')}
          isEdited={isFieldEdited('aeropuertoSalida')}
          options={[
            { label: 'MEX - Ciudad de México', value: 'MEX' },
            { label: 'GDL - Guadalajara', value: 'GDL' },
            { label: 'MTY - Monterrey', value: 'MTY' },
            { label: 'CUN - Cancún', value: 'CUN' },
            { label: 'TIJ - Tijuana', value: 'TIJ' }
          ]}
        />
        
        <SelectInputField
          label="Tipo de Vuelo"
          value={state.data.tipoVuelo || ''}
          onValueChange={(value) => handleFieldChange('tipoVuelo', value)}
          error={getFieldError('tipoVuelo')}
          isEdited={isFieldEdited('tipoVuelo')}
          options={[
            { label: 'Nacional', value: 'Nacional' },
            { label: 'Internacional', value: 'Internacional' },
            { label: 'Charter', value: 'Charter' },
            { label: 'Carga', value: 'Carga' },
            { label: 'Privado', value: 'Privado' },
            { label: 'Gubernamental', value: 'Gubernamental' }
          ]}
        />
          </View>
        </View>

        {/* Aircraft Information Section */}
        <View style={responsiveStyles.section}>
        <Text style={styles.sectionTitle}>Información de Aeronave</Text>
        
        <TextInputField
          label="Transportista"
          value={state.data.transportista || ''}
          onValueChange={(value) => handleFieldChange('transportista', value)}
          error={getFieldError('transportista')}
          isEdited={isFieldEdited('transportista')}
          required
          placeholder="Ej: Aeroméxico"
        />
        
        <SelectInputField
          label="Equipo"
          value={state.data.equipo || ''}
          onValueChange={(value) => handleFieldChange('equipo', value)}
          error={getFieldError('equipo')}
          isEdited={isFieldEdited('equipo')}
          options={[
            { label: 'B737 - Boeing 737', value: 'B737' },
            { label: 'B738 - Boeing 737-800', value: 'B738' },
            { label: 'A320 - Airbus A320', value: 'A320' },
            { label: 'A321 - Airbus A321', value: 'A321' },
            { label: 'E190 - Embraer 190', value: 'E190' }
          ]}
        />
        
        <TextInputField
          label="Matrícula"
          value={state.data.matricula || ''}
          onValueChange={(value) => handleFieldChange('matricula', value)}
          error={getFieldError('matricula')}
          isEdited={isFieldEdited('matricula')}
          placeholder="Ej: XA-ABC"
        />
        
        <TextInputField
          label="Número de Vuelo"
          value={state.data.numeroVuelo || ''}
          onValueChange={(value) => handleFieldChange('numeroVuelo', value)}
          error={getFieldError('numeroVuelo')}
          isEdited={isFieldEdited('numeroVuelo')}
          required
          placeholder="Ej: AM123"
        />
      </View>

      {/* Pilot Information Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información del Piloto</Text>
        
        <TextInputField
          label="Piloto al Mando"
          value={state.data.pilotoAlMando || ''}
          onValueChange={(value) => handleFieldChange('pilotoAlMando', value)}
          error={getFieldError('pilotoAlMando')}
          isEdited={isFieldEdited('pilotoAlMando')}
          placeholder="Nombre completo del piloto"
        />
        
        <TextInputField
          label="Número de Licencia"
          value={state.data.numeroLicencia || ''}
          onValueChange={(value) => handleFieldChange('numeroLicencia', value)}
          error={getFieldError('numeroLicencia')}
          isEdited={isFieldEdited('numeroLicencia')}
          placeholder="Número de licencia del piloto"
        />
        
        <NumberInputField
          label="Tripulación"
          value={state.data.tripulacion || 0}
          onValueChange={(value) => handleFieldChange('tripulacion', value)}
          error={getFieldError('tripulacion')}
          isEdited={isFieldEdited('tripulacion')}
          min={0}
          max={20}
        />
      </View>

      {/* Operations Movement Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Movimiento de Operaciones</Text>
        
        <TextInputField
          label="Origen del Vuelo"
          value={state.data.origenVuelo || ''}
          onValueChange={(value) => handleFieldChange('origenVuelo', value)}
          error={getFieldError('origenVuelo')}
          isEdited={isFieldEdited('origenVuelo')}
          placeholder="Código IATA (3 letras)"
          maxLength={3}
        />
        
        <TextInputField
          label="Próxima Escala"
          value={state.data.proximaEscala || ''}
          onValueChange={(value) => handleFieldChange('proximaEscala', value)}
          error={getFieldError('proximaEscala')}
          isEdited={isFieldEdited('proximaEscala')}
          placeholder="Código IATA (3 letras)"
          maxLength={3}
        />
        
        <TextInputField
          label="Destino del Vuelo"
          value={state.data.destinoVuelo || ''}
          onValueChange={(value) => handleFieldChange('destinoVuelo', value)}
          error={getFieldError('destinoVuelo')}
          isEdited={isFieldEdited('destinoVuelo')}
          placeholder="Código IATA (3 letras)"
          maxLength={3}
        />
        
        <TimeInputField
          label="Hora Slot Asignado"
          value={state.data.horaSlotAsignado || ''}
          onValueChange={(value) => handleFieldChange('horaSlotAsignado', value)}
          error={getFieldError('horaSlotAsignado')}
          isEdited={isFieldEdited('horaSlotAsignado')}
        />
        
        <TimeInputField
          label="Hora Slot Coordinado"
          value={state.data.horaSlotCoordinado || ''}
          onValueChange={(value) => handleFieldChange('horaSlotCoordinado', value)}
          error={getFieldError('horaSlotCoordinado')}
          isEdited={isFieldEdited('horaSlotCoordinado')}
        />
        
        <TimeInputField
          label="Hora Término Pernocta"
          value={state.data.horaTerminoPernocta || ''}
          onValueChange={(value) => handleFieldChange('horaTerminoPernocta', value)}
          error={getFieldError('horaTerminoPernocta')}
          isEdited={isFieldEdited('horaTerminoPernocta')}
        />
        
        <TimeInputField
          label="Hora Inicio Maniobras"
          value={state.data.horaInicioManiobras || ''}
          onValueChange={(value) => handleFieldChange('horaInicioManiobras', value)}
          error={getFieldError('horaInicioManiobras')}
          isEdited={isFieldEdited('horaInicioManiobras')}
        />
        
        <TimeInputField
          label="Hora Salida Posición"
          value={state.data.horaSalidaPosicion || ''}
          onValueChange={(value) => handleFieldChange('horaSalidaPosicion', value)}
          error={getFieldError('horaSalidaPosicion')}
          isEdited={isFieldEdited('horaSalidaPosicion')}
        />
      </View>

      {/* Delay Cause Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Causa de Demora</Text>
        
        <TextInputField
          label="Causa de Demora"
          value={state.data.causaDemora || ''}
          onValueChange={(value) => handleFieldChange('causaDemora', value)}
          error={getFieldError('causaDemora')}
          isEdited={isFieldEdited('causaDemora')}
          placeholder="Descripción de la causa"
          multiline
        />
        
        <SelectInputField
          label="Código de Causa"
          value={state.data.codigoCausa || ''}
          onValueChange={(value) => handleFieldChange('codigoCausa', value)}
          error={getFieldError('codigoCausa')}
          isEdited={isFieldEdited('codigoCausa')}
          options={[
            { label: 'NONE - Sin demora', value: 'NONE' },
            { label: 'WX01 - Condiciones meteorológicas', value: 'WX01' },
            { label: 'TC01 - Falla técnica', value: 'TC01' },
            { label: 'OP01 - Congestión de tráfico', value: 'OP01' },
            { label: 'PS01 - Problema de pasajero', value: 'PS01' },
            { label: 'AP01 - Problema de aeropuerto', value: 'AP01' }
          ]}
        />
      </View>

      {/* Passenger Information Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información de Pasajeros</Text>
        
        <NumberInputField
          label="Nacional"
          value={state.data.pasajeros?.nacional || 0}
          onValueChange={(value) => handleNestedFieldChange('pasajeros', 'nacional', value)}
          error={getFieldError('pasajeros.nacional')}
          isEdited={isFieldEdited('pasajeros')}
          min={0}
        />
        
        <NumberInputField
          label="Internacional"
          value={state.data.pasajeros?.internacional || 0}
          onValueChange={(value) => handleNestedFieldChange('pasajeros', 'internacional', value)}
          error={getFieldError('pasajeros.internacional')}
          isEdited={isFieldEdited('pasajeros')}
          min={0}
        />
        
        <NumberInputField
          label="Diplomáticos"
          value={state.data.pasajeros?.diplomaticos || 0}
          onValueChange={(value) => handleNestedFieldChange('pasajeros', 'diplomaticos', value)}
          error={getFieldError('pasajeros.diplomaticos')}
          isEdited={isFieldEdited('pasajeros')}
          min={0}
        />
        
        <NumberInputField
          label="En Comisión"
          value={state.data.pasajeros?.enComision || 0}
          onValueChange={(value) => handleNestedFieldChange('pasajeros', 'enComision', value)}
          error={getFieldError('pasajeros.enComision')}
          isEdited={isFieldEdited('pasajeros')}
          min={0}
        />
        
        <NumberInputField
          label="Infantes"
          value={state.data.pasajeros?.infantes || 0}
          onValueChange={(value) => handleNestedFieldChange('pasajeros', 'infantes', value)}
          error={getFieldError('pasajeros.infantes')}
          isEdited={isFieldEdited('pasajeros')}
          min={0}
        />
        
        <NumberInputField
          label="Tránsitos"
          value={state.data.pasajeros?.transitos || 0}
          onValueChange={(value) => handleNestedFieldChange('pasajeros', 'transitos', value)}
          error={getFieldError('pasajeros.transitos')}
          isEdited={isFieldEdited('pasajeros')}
          min={0}
        />
        
        <NumberInputField
          label="Conexiones"
          value={state.data.pasajeros?.conexiones || 0}
          onValueChange={(value) => handleNestedFieldChange('pasajeros', 'conexiones', value)}
          error={getFieldError('pasajeros.conexiones')}
          isEdited={isFieldEdited('pasajeros')}
          min={0}
        />
        
        <NumberInputField
          label="Otros Exentos"
          value={state.data.pasajeros?.otrosExentos || 0}
          onValueChange={(value) => handleNestedFieldChange('pasajeros', 'otrosExentos', value)}
          error={getFieldError('pasajeros.otrosExentos')}
          isEdited={isFieldEdited('pasajeros')}
          min={0}
        />
        
        <NumberInputField
          label="Total Pasajeros"
          value={state.data.pasajeros?.total || 0}
          onValueChange={() => {}} // Read-only, calculated automatically
          error={getFieldError('pasajeros.total')}
          isEdited={isFieldEdited('pasajeros')}
          readOnly
          style={styles.calculatedField}
        />
      </View>

      {/* Cargo Information Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información de Carga (kg)</Text>
        
        <NumberInputField
          label="Equipaje"
          value={state.data.carga?.equipaje || 0}
          onValueChange={(value) => handleNestedFieldChange('carga', 'equipaje', value)}
          error={getFieldError('carga.equipaje')}
          isEdited={isFieldEdited('carga')}
          min={0}
          step={0.1}
        />
        
        <NumberInputField
          label="Carga"
          value={state.data.carga?.carga || 0}
          onValueChange={(value) => handleNestedFieldChange('carga', 'carga', value)}
          error={getFieldError('carga.carga')}
          isEdited={isFieldEdited('carga')}
          min={0}
          step={0.1}
        />
        
        <NumberInputField
          label="Correo"
          value={state.data.carga?.correo || 0}
          onValueChange={(value) => handleNestedFieldChange('carga', 'correo', value)}
          error={getFieldError('carga.correo')}
          isEdited={isFieldEdited('carga')}
          min={0}
          step={0.1}
        />
        
        <NumberInputField
          label="Total Carga"
          value={state.data.carga?.total || 0}
          onValueChange={() => {}} // Read-only, calculated automatically
          error={getFieldError('carga.total')}
          isEdited={isFieldEdited('carga')}
          readOnly
          step={0.1}
          style={styles.calculatedField}
        />
      </View>

      {/* Validation Summary */}
      {Object.keys(state.validationErrors).length > 0 && (
        <View style={styles.validationSummary}>
          <Text style={styles.validationTitle}>Errores de Validación:</Text>
          {Object.entries(state.validationErrors).map(([field, error]) => (
            <Text key={field} style={styles.validationError}>
              • {error}
            </Text>
          ))}
        </View>
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
  title: {
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontWeight: '600',
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  singleColumn: {
    flexDirection: 'column',
  },
  multiColumn: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldContainerHalf: {
    width: '48%',
    marginBottom: 16,
  },
  calculatedField: {
    backgroundColor: '#f8f8f8',
  },
  validationSummary: {
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  validationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 8,
  },
  validationError: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 4,
  },
});