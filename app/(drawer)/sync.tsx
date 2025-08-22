import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useSlotsStore } from '@/stores/slotsStore';
import { useNotificationStore } from '@/stores/notificationStore';

export default function SyncScreen() {
  const [importing, setImporting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  const { lastSync, offlineChanges, syncOfflineChanges, importExcelData } = useSlotsStore();
  const { addNotification } = useNotificationStore();

  const handleImportExcel = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImporting(true);
        
        // Simular procesamiento de archivo Excel
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Mock data que se importaría del Excel
        const mockExcelData = [
          {
            'Vuelo': 'AM301',
            'Aerolínea': 'Aeroméxico',
            'Origen': 'AIFA',
            'Destino': 'CUN',
            'Hora': '08:15',
            'Aeronave': 'B737-800',
            'Puerta': 'G12',
            'Tipo': 'Salida'
          },
          {
            'Vuelo': 'VB205',
            'Aerolínea': 'Volaris',
            'Origen': 'GDL',
            'Destino': 'AIFA',
            'Hora': '14:30',
            'Aeronave': 'A320',
            'Puerta': 'G8',
            'Tipo': 'Llegada'
          }
        ];

        await importExcelData(mockExcelData);
        
        addNotification({
          title: 'Importación Exitosa',
          message: `Se importaron ${mockExcelData.length} registros desde Excel`,
          type: 'success',
          read: false
        });
        
        setImporting(false);
        Alert.alert('Éxito', 'Datos importados correctamente');
      }
    } catch (error) {
      setImporting(false);
      Alert.alert('Error', 'No se pudo importar el archivo');
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncOfflineChanges();
      
      addNotification({
        title: 'Sincronización Completa',
        message: 'Todos los cambios se han sincronizado con el servidor',
        type: 'success',
        read: false
      });
      
      Alert.alert('Éxito', 'Sincronización completada');
    } catch (error) {
      Alert.alert('Error', 'Error en la sincronización');
    } finally {
      setSyncing(false);
    }
  };

  const handleExportData = () => {
    Alert.alert(
      'Exportar Datos',
      'Seleccione el formato de exportación:',
      [
        { text: 'Excel (.xlsx)', onPress: () => exportToExcel() },
        { text: 'PDF', onPress: () => exportToPDF() },
        { text: 'JSON', onPress: () => exportToJSON() },
        { text: 'Cancelar', style: 'cancel' }
      ]
    );
  };

  const exportToExcel = () => {
    Alert.alert('Éxito', 'Archivo Excel generado y guardado en Descargas');
  };

  const exportToPDF = () => {
    Alert.alert('Éxito', 'Reporte PDF generado y guardado en Descargas');
  };

  const exportToJSON = () => {
    Alert.alert('Éxito', 'Datos JSON exportados y guardados en Descargas');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Estado de sincronización */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estado de Sincronización</Text>
          
          <View style={styles.syncStatusCard}>
            <View style={styles.syncStatusHeader}>
              <View style={styles.syncStatusIcon}>
                <Ionicons 
                  name={lastSync ? "checkmark-circle" : "alert-circle"} 
                  size={24} 
                  color={lastSync ? "#10B981" : "#F59E0B"} 
                />
              </View>
              <View style={styles.syncStatusInfo}>
                <Text style={styles.syncStatusTitle}>
                  {lastSync ? 'Sincronizado' : 'Pendiente de sincronización'}
                </Text>
                <Text style={styles.syncStatusTime}>
                  {lastSync ? 
                    `Última sincronización: ${new Date(lastSync).toLocaleString('es-MX')}` :
                    'Nunca sincronizado'
                  }
                </Text>
              </View>
            </View>

            {offlineChanges.length > 0 && (
              <View style={styles.offlineChanges}>
                <Text style={styles.offlineChangesTitle}>
                  Cambios sin sincronizar: {offlineChanges.length}
                </Text>
                <TouchableOpacity 
                  style={styles.syncButton}
                  onPress={handleSync}
                  disabled={syncing}
                >
                  {syncing ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Ionicons name="sync" size={16} color="#FFFFFF" />
                      <Text style={styles.syncButtonText}>Sincronizar Ahora</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Importación de datos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Importar Datos</Text>
          
          <View style={styles.importCard}>
            <View style={styles.importOption}>
              <View style={styles.importIconContainer}>
                <Ionicons name="document-outline" size={32} color="#10B981" />
              </View>
              <View style={styles.importContent}>
                <Text style={styles.importTitle}>Importar desde Excel</Text>
                <Text style={styles.importDescription}>
                  Importar slots y reservas desde archivos .xlsx o .xls
                </Text>
                <TouchableOpacity 
                  style={styles.importButton}
                  onPress={handleImportExcel}
                  disabled={importing}
                >
                  {importing ? (
                    <ActivityIndicator color="#10B981" size="small" />
                  ) : (
                    <>
                      <Ionicons name="cloud-upload-outline" size={16} color="#10B981" />
                      <Text style={styles.importButtonText}>Seleccionar Archivo</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.importHelp}>
              <Ionicons name="information-circle-outline" size={16} color="#64748B" />
              <Text style={styles.importHelpText}>
                El archivo debe contener las columnas: Vuelo, Aerolínea, Origen, Destino, Hora, Aeronave, Tipo
              </Text>
            </View>
          </View>
        </View>

        {/* Exportación de datos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exportar Datos</Text>
          
          <View style={styles.exportCard}>
            <View style={styles.exportGrid}>
              <TouchableOpacity style={styles.exportOption} onPress={handleExportData}>
                <View style={styles.exportIcon}>
                  <Ionicons name="document-text-outline" size={24} color="#1E40AF" />
                </View>
                <Text style={styles.exportTitle}>Excel</Text>
                <Text style={styles.exportDescription}>Hoja de cálculo</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.exportOption} onPress={handleExportData}>
                <View style={styles.exportIcon}>
                  <Ionicons name="document-outline" size={24} color="#EF4444" />
                </View>
                <Text style={styles.exportTitle}>PDF</Text>
                <Text style={styles.exportDescription}>Reporte imprimible</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.exportOption} onPress={handleExportData}>
                <View style={styles.exportIcon}>
                  <Ionicons name="code-outline" size={24} color="#F59E0B" />
                </View>
                <Text style={styles.exportTitle}>JSON</Text>
                <Text style={styles.exportDescription}>Datos estructurados</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.exportOption} onPress={handleExportData}>
                <View style={styles.exportIcon}>
                  <Ionicons name="mail-outline" size={24} color="#10B981" />
                </View>
                <Text style={styles.exportTitle}>Email</Text>
                <Text style={styles.exportDescription}>Enviar por correo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Configuración de respaldo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Respaldo de Datos</Text>
          
          <View style={styles.backupCard}>
            <View style={styles.backupOption}>
              <View style={styles.backupContent}>
                <Text style={styles.backupTitle}>Respaldo Automático</Text>
                <Text style={styles.backupDescription}>
                  Crear respaldos automáticos cada 24 horas
                </Text>
              </View>
              <TouchableOpacity style={styles.backupButton}>
                <Text style={styles.backupButtonText}>Configurar</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.backupOption}>
              <View style={styles.backupContent}>
                <Text style={styles.backupTitle}>Respaldo Manual</Text>
                <Text style={styles.backupDescription}>
                  Crear un respaldo inmediato de todos los datos
                </Text>
              </View>
              <TouchableOpacity style={styles.backupButton}>
                <Ionicons name="download-outline" size={16} color="#1E40AF" />
                <Text style={styles.backupButtonText}>Crear Respaldo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Historial de sincronización */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historial Reciente</Text>
          
          <View style={styles.historyCard}>
            {[
              { type: 'sync', message: 'Sincronización automática completada', time: '2 horas', status: 'success' },
              { type: 'import', message: 'Importación de 25 registros desde Excel', time: '5 horas', status: 'success' },
              { type: 'export', message: 'Reporte PDF generado', time: '1 día', status: 'success' },
              { type: 'error', message: 'Error de conectividad durante sincronización', time: '2 días', status: 'error' },
            ].map((item, index) => (
              <View key={index} style={styles.historyItem}>
                <View style={[styles.historyIcon, {
                  backgroundColor: item.status === 'success' ? '#D1FAE5' : '#FEE2E2'
                }]}>
                  <Ionicons 
                    name={
                      item.type === 'sync' ? 'sync' :
                      item.type === 'import' ? 'cloud-upload' :
                      item.type === 'export' ? 'cloud-download' : 'alert-circle'
                    }
                    size={16} 
                    color={item.status === 'success' ? '#10B981' : '#EF4444'} 
                  />
                </View>
                <View style={styles.historyContent}>
                  <Text style={styles.historyMessage}>{item.message}</Text>
                  <Text style={styles.historyTime}>Hace {item.time}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  syncStatusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  syncStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncStatusIcon: {
    marginRight: 12,
  },
  syncStatusInfo: {
    flex: 1,
  },
  syncStatusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  syncStatusTime: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  offlineChanges: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  offlineChangesTitle: {
    fontSize: 14,
    color: '#F59E0B',
    marginBottom: 12,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E40AF',
    borderRadius: 8,
    paddingVertical: 10,
    gap: 8,
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  importCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  importOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  importIconContainer: {
    marginRight: 16,
  },
  importContent: {
    flex: 1,
  },
  importTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  importDescription: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#10B981',
    alignSelf: 'flex-start',
    gap: 6,
  },
  importButtonText: {
    color: '#10B981',
    fontWeight: '500',
    fontSize: 12,
  },
  importHelp: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 8,
  },
  importHelpText: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
    flex: 1,
  },
  exportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  exportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  exportOption: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 16,
  },
  exportIcon: {
    marginBottom: 8,
  },
  exportTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  exportDescription: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },
  backupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    gap: 16,
  },
  backupOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backupContent: {
    flex: 1,
    marginRight: 16,
  },
  backupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  backupDescription: {
    fontSize: 12,
    color: '#64748B',
  },
  backupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1E40AF',
    gap: 4,
  },
  backupButtonText: {
    color: '#1E40AF',
    fontWeight: '500',
    fontSize: 12,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyMessage: {
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 2,
  },
  historyTime: {
    fontSize: 11,
    color: '#64748B',
  },
});