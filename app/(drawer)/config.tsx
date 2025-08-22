import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ConfigScreen() {
  const [notifications, setNotifications] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [dataUsage, setDataUsage] = useState(true);
  const [crashReports, setCrashReports] = useState(true);

  const handleResetSettings = () => {
    Alert.alert(
      'Restablecer Configuración',
      '¿Está seguro de restablecer todas las configuraciones a los valores por defecto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Restablecer', 
          style: 'destructive',
          onPress: () => {
            setNotifications(true);
            setAutoSync(true);
            setDarkMode(false);
            setDataUsage(true);
            setCrashReports(true);
            Alert.alert('Éxito', 'Configuración restablecida');
          }
        }
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Limpiar Caché',
      'Esto eliminará los datos temporales y puede mejorar el rendimiento.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Limpiar', 
          onPress: () => {
            Alert.alert('Éxito', 'Caché limpiado correctamente');
          }
        }
      ]
    );
  };

  const ConfigSection = ({ title, children }: any) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>
        {children}
      </View>
    </View>
  );

  const ConfigItem = ({ icon, title, description, value, onValueChange, type = 'switch' }: any) => (
    <View style={styles.configItem}>
      <View style={styles.configItemLeft}>
        <Ionicons name={icon} size={24} color="#1E40AF" />
        <View style={styles.configItemContent}>
          <Text style={styles.configItemTitle}>{title}</Text>
          {description && (
            <Text style={styles.configItemDescription}>{description}</Text>
          )}
        </View>
      </View>
      {type === 'switch' ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: "#D1D5DB", true: "#BFDBFE" }}
          thumbColor={value ? "#1E40AF" : "#F3F4F6"}
        />
      ) : (
        <TouchableOpacity onPress={onValueChange}>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <ConfigSection title="Notificaciones">
          <ConfigItem
            icon="notifications-outline"
            title="Notificaciones Push"
            description="Recibir alertas importantes en tiempo real"
            value={notifications}
            onValueChange={setNotifications}
          />
          <ConfigItem
            icon="time-outline"
            title="Recordatorios de Slots"
            description="Alertas 30 minutos antes del horario programado"
            value={true}
            onValueChange={() => {}}
          />
          <ConfigItem
            icon="warning-outline"
            title="Alertas de Retrasos"
            description="Notificar cambios en horarios de vuelos"
            value={true}
            onValueChange={() => {}}
          />
        </ConfigSection>

        <ConfigSection title="Sincronización">
          <ConfigItem
            icon="sync-outline"
            title="Sincronización Automática"
            description="Actualizar datos cada 15 minutos"
            value={autoSync}
            onValueChange={setAutoSync}
          />
          <ConfigItem
            icon="wifi-outline"
            title="Solo WiFi"
            description="Sincronizar únicamente con conexión WiFi"
            value={false}
            onValueChange={() => {}}
          />
          <ConfigItem
            icon="cloud-outline"
            title="Respaldo en la Nube"
            description="Guardar datos automáticamente en servidor"
            value={true}
            onValueChange={() => {}}
          />
        </ConfigSection>

        <ConfigSection title="Interfaz">
          <ConfigItem
            icon="moon-outline"
            title="Modo Oscuro"
            description="Usar tema oscuro para la aplicación"
            value={darkMode}
            onValueChange={setDarkMode}
          />
          <ConfigItem
            icon="language-outline"
            title="Idioma"
            description="Español (México)"
            type="button"
            onValueChange={() => Alert.alert('Configuración', 'Funcionalidad en desarrollo')}
          />
          <ConfigItem
            icon="resize-outline"
            title="Tamaño de Fuente"
            description="Mediano"
            type="button"
            onValueChange={() => Alert.alert('Configuración', 'Funcionalidad en desarrollo')}
          />
        </ConfigSection>

        <ConfigSection title="Privacidad y Datos">
          <ConfigItem
            icon="analytics-outline"
            title="Análisis de Uso"
            description="Ayudar a mejorar la aplicación"
            value={dataUsage}
            onValueChange={setDataUsage}
          />
          <ConfigItem
            icon="bug-outline"
            title="Reportes de Errores"
            description="Enviar informes automáticos de fallos"
            value={crashReports}
            onValueChange={setCrashReports}
          />
          <ConfigItem
            icon="shield-checkmark-outline"
            title="Política de Privacidad"
            type="button"
            onValueChange={() => Alert.alert('Política de Privacidad', 'Ver documento completo')}
          />
        </ConfigSection>

        <ConfigSection title="Almacenamiento">
          <ConfigItem
            icon="folder-outline"
            title="Datos Locales"
            description="2.3 MB utilizados"
            type="button"
            onValueChange={() => Alert.alert('Almacenamiento', 'Detalles de uso')}
          />
          <ConfigItem
            icon="trash-outline"
            title="Limpiar Caché"
            description="Eliminar archivos temporales"
            type="button"
            onValueChange={handleClearCache}
          />
          <ConfigItem
            icon="download-outline"
            title="Datos sin Conexión"
            description="Descargar para uso offline"
            value={true}
            onValueChange={() => {}}
          />
        </ConfigSection>

        <ConfigSection title="Sistema">
          <ConfigItem
            icon="information-circle-outline"
            title="Versión de la App"
            description="1.0.0 (Build 2024.1)"
            type="button"
            onValueChange={() => Alert.alert('Información', 'AIFA SlotMaster Pro v1.0.0')}
          />
          <ConfigItem
            icon="help-circle-outline"
            title="Centro de Ayuda"
            type="button"
            onValueChange={() => Alert.alert('Ayuda', 'Abrir centro de soporte')}
          />
          <ConfigItem
            icon="mail-outline"
            title="Contactar Soporte"
            description="soporte@aifa.gob.mx"
            type="button"
            onValueChange={() => Alert.alert('Soporte', 'Abrir cliente de correo')}
          />
        </ConfigSection>

        <View style={styles.dangerZone}>
          <Text style={styles.dangerZoneTitle}>Zona Peligrosa</Text>
          <View style={styles.dangerZoneCard}>
            <TouchableOpacity style={styles.dangerButton} onPress={handleResetSettings}>
              <Ionicons name="refresh-outline" size={20} color="#EF4444" />
              <Text style={styles.dangerButtonText}>Restablecer Configuración</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.dangerButton}>
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
              <Text style={styles.dangerButtonText}>Cerrar Sesión Remota</Text>
            </TouchableOpacity>
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
    marginBottom: 12,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  configItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  configItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  configItemContent: {
    marginLeft: 16,
    flex: 1,
  },
  configItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  configItemDescription: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  dangerZone: {
    marginTop: 24,
  },
  dangerZoneTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: 12,
  },
  dangerZoneCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FEE2E2',
    gap: 12,
  },
  dangerButtonText: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '500',
  },
});