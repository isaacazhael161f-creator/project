/**
 * Example usage of ManifiestoScanner component
 * Demonstrates the complete workflow integration
 */

import React, { useState } from 'react';
import { View, StyleSheet, Text, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ManifiestoScanner from './ManifiestoScanner';
import { ManifiestoData } from '../../types/manifiesto';

interface ProcessedManifiesto {
  id: string;
  data: ManifiestoData;
  processedAt: Date;
}

const ManifiestoScannerExample: React.FC = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [processedManifiestos, setProcessedManifiestos] = useState<ProcessedManifiesto[]>([]);

  const handleDataExtracted = (data: ManifiestoData) => {
    const processed: ProcessedManifiesto = {
      id: `manifest_${Date.now()}`,
      data,
      processedAt: new Date()
    };

    setProcessedManifiestos(prev => [processed, ...prev]);
    setShowScanner(false);

    Alert.alert(
      'Manifiesto Procesado',
      `Vuelo ${data.numeroVuelo || 'N/A'} procesado exitosamente`,
      [
        {
          text: 'Ver Detalles',
          onPress: () => showManifiestoDetails(processed)
        },
        {
          text: 'Procesar Otro',
          onPress: () => setShowScanner(true)
        },
        { text: 'OK' }
      ]
    );
  };

  const showManifiestoDetails = (manifiesto: ProcessedManifiesto) => {
    const { data } = manifiesto;
    const details = [
      `Vuelo: ${data.numeroVuelo || 'N/A'}`,
      `Fecha: ${data.fecha || 'N/A'}`,
      `Transportista: ${data.transportista || 'N/A'}`,
      `Ruta: ${data.origenVuelo || 'N/A'} → ${data.destinoVuelo || 'N/A'}`,
      `Pasajeros: ${data.pasajeros?.total || 0}`,
      `Carga: ${data.carga?.total || 0} kg`,
      data.editado ? 'Editado manualmente: Sí' : 'Editado manualmente: No'
    ].join('\n');

    Alert.alert('Detalles del Manifiesto', details);
  };

  const startNewScan = () => {
    setShowScanner(true);
  };

  const renderManifiestoList = () => (
    <ScrollView style={styles.listContainer}>
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Manifiestos Procesados</Text>
        <Text style={styles.listSubtitle}>
          {processedManifiestos.length} manifiestos procesados
        </Text>
      </View>

      {processedManifiestos.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="document-outline" size={64} color="#ccc" />
          <Text style={styles.emptyStateText}>
            No hay manifiestos procesados
          </Text>
          <Text style={styles.emptyStateSubtext}>
            Toca el botón "Escanear Manifiesto" para comenzar
          </Text>
        </View>
      ) : (
        processedManifiestos.map((manifiesto) => (
          <TouchableOpacity
            key={manifiesto.id}
            style={styles.manifestoItem}
            onPress={() => showManifiestoDetails(manifiesto)}
          >
            <View style={styles.manifestoHeader}>
              <View style={styles.manifestoInfo}>
                <Text style={styles.manifestoFlight}>
                  {manifiesto.data.numeroVuelo || 'Vuelo N/A'}
                </Text>
                <Text style={styles.manifestoDate}>
                  {manifiesto.data.fecha || 'Fecha N/A'}
                </Text>
              </View>
              
              <View style={styles.manifestoStats}>
                <View style={styles.statItem}>
                  <Ionicons name="people" size={16} color="#666" />
                  <Text style={styles.statText}>
                    {manifiesto.data.pasajeros?.total || 0}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="cube" size={16} color="#666" />
                  <Text style={styles.statText}>
                    {manifiesto.data.carga?.total || 0}kg
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.manifestoDetails}>
              <Text style={styles.manifestoRoute}>
                {manifiesto.data.origenVuelo || 'N/A'} → {manifiesto.data.destinoVuelo || 'N/A'}
              </Text>
              <Text style={styles.manifestoAirline}>
                {manifiesto.data.transportista || 'Transportista N/A'}
              </Text>
            </View>

            <View style={styles.manifestoFooter}>
              <Text style={styles.processedTime}>
                Procesado: {manifiesto.processedAt.toLocaleString()}
              </Text>
              {manifiesto.data.editado && (
                <View style={styles.editedBadge}>
                  <Text style={styles.editedBadgeText}>Editado</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );

  if (showScanner) {
    return (
      <View style={styles.container}>
        <View style={styles.scannerHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setShowScanner(false)}
            testID="back-button"
          >
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
        
        <ManifiestoScanner onDataExtracted={handleDataExtracted} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Escáner de Manifiestos</Text>
        <Text style={styles.subtitle}>
          Procesa manifiestos de salida automáticamente
        </Text>
      </View>

      <TouchableOpacity 
        style={styles.scanButton} 
        onPress={startNewScan}
        testID="scan-button"
      >
        <Ionicons name="scan" size={24} color="white" />
        <Text style={styles.scanButtonText}>Escanear Manifiesto</Text>
      </TouchableOpacity>

      {renderManifiestoList()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  
  // Header styles
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },

  // Scanner header styles
  scannerHeader: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 8,
    fontWeight: '500',
  },

  // Scan button styles
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },

  // List styles
  listContainer: {
    flex: 1,
  },
  listHeader: {
    padding: 20,
    paddingBottom: 16,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  listSubtitle: {
    fontSize: 14,
    color: '#666',
  },

  // Empty state styles
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#999',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Manifiesto item styles
  manifestoItem: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  manifestoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  manifestoInfo: {
    flex: 1,
  },
  manifestoFlight: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  manifestoDate: {
    fontSize: 14,
    color: '#666',
  },
  manifestoStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  manifestoDetails: {
    marginBottom: 12,
  },
  manifestoRoute: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
    fontWeight: '500',
  },
  manifestoAirline: {
    fontSize: 14,
    color: '#666',
  },
  manifestoFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  processedTime: {
    fontSize: 12,
    color: '#999',
  },
  editedBadge: {
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  editedBadgeText: {
    fontSize: 10,
    color: '#856404',
    fontWeight: '500',
  },
});

export default ManifiestoScannerExample;