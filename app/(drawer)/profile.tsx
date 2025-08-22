import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  TextInput,
  Image,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';

export default function ProfileScreen() {
  const { user, updateProfile, enableBiometric, disableBiometric, biometricEnabled } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    department: user?.department || '',
  });

  const handleSave = () => {
    updateProfile(formData);
    setIsEditing(false);
    Alert.alert('Éxito', 'Perfil actualizado correctamente');
  };

  const handleBiometricToggle = (value: boolean) => {
    if (value) {
      enableBiometric();
      Alert.alert('Activado', 'Autenticación biométrica habilitada');
    } else {
      disableBiometric();
      Alert.alert('Desactivado', 'Autenticación biométrica deshabilitada');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image 
          source={{ uri: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg' }} 
          style={styles.profileImage}
        />
        <TouchableOpacity style={styles.changePhotoButton}>
          <Ionicons name="camera" size={20} color="#1E40AF" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Información Personal</Text>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => setIsEditing(!isEditing)}
            >
              <Ionicons name={isEditing ? "close" : "create-outline"} size={20} color="#1E40AF" />
              <Text style={styles.editButtonText}>
                {isEditing ? 'Cancelar' : 'Editar'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Nombre Completo</Text>
              {isEditing ? (
                <TextInput
                  style={styles.infoInput}
                  value={formData.name}
                  onChangeText={(text) => setFormData({...formData, name: text})}
                />
              ) : (
                <Text style={styles.infoValue}>{user?.name}</Text>
              )}
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Correo Electrónico</Text>
              {isEditing ? (
                <TextInput
                  style={styles.infoInput}
                  value={formData.email}
                  onChangeText={(text) => setFormData({...formData, email: text})}
                  keyboardType="email-address"
                />
              ) : (
                <Text style={styles.infoValue}>{user?.email}</Text>
              )}
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Departamento</Text>
              {isEditing ? (
                <TextInput
                  style={styles.infoInput}
                  value={formData.department}
                  onChangeText={(text) => setFormData({...formData, department: text})}
                />
              ) : (
                <Text style={styles.infoValue}>{user?.department}</Text>
              )}
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Rol</Text>
              <Text style={styles.infoValue}>
                {user?.role === 'admin' ? 'Administrador' : 
                 user?.role === 'supervisor' ? 'Supervisor' : 'Operador'}
              </Text>
            </View>

            {user?.lastLogin && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Último Acceso</Text>
                <Text style={styles.infoValue}>
                  {new Date(user.lastLogin).toLocaleString('es-MX')}
                </Text>
              </View>
            )}

            {isEditing && (
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Guardar Cambios</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuración de Seguridad</Text>
          
          <View style={styles.securityCard}>
            <View style={styles.securityItem}>
              <View style={styles.securityItemLeft}>
                <Ionicons name="finger-print" size={24} color="#1E40AF" />
                <View style={styles.securityItemContent}>
                  <Text style={styles.securityItemTitle}>Autenticación Biométrica</Text>
                  <Text style={styles.securityItemDescription}>
                    Usar huella dactilar o reconocimiento facial
                  </Text>
                </View>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={handleBiometricToggle}
                trackColor={{ false: "#D1D5DB", true: "#BFDBFE" }}
                thumbColor={biometricEnabled ? "#1E40AF" : "#F3F4F6"}
              />
            </View>

            <TouchableOpacity style={styles.securityItem}>
              <View style={styles.securityItemLeft}>
                <Ionicons name="key-outline" size={24} color="#1E40AF" />
                <View style={styles.securityItemContent}>
                  <Text style={styles.securityItemTitle}>Cambiar Contraseña</Text>
                  <Text style={styles.securityItemDescription}>
                    Actualizar credenciales de acceso
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <View style={styles.securityItem}>
              <View style={styles.securityItemLeft}>
                <Ionicons name="shield-checkmark-outline" size={24} color="#10B981" />
                <View style={styles.securityItemContent}>
                  <Text style={styles.securityItemTitle}>Sesión Segura</Text>
                  <Text style={styles.securityItemDescription}>
                    Conexión encriptada activa
                  </Text>
                </View>
              </View>
              <View style={styles.securityBadge}>
                <Text style={styles.securityBadgeText}>Activo</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estadísticas de Uso</Text>
          
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={24} color="#1E40AF" />
              <View style={styles.statContent}>
                <Text style={styles.statValue}>142</Text>
                <Text style={styles.statLabel}>Horas de uso</Text>
              </View>
            </View>

            <View style={styles.statItem}>
              <Ionicons name="document-text-outline" size={24} color="#10B981" />
              <View style={styles.statContent}>
                <Text style={styles.statValue}>89</Text>
                <Text style={styles.statLabel}>Reservas creadas</Text>
              </View>
            </View>

            <View style={styles.statItem}>
              <Ionicons name="download-outline" size={24} color="#F59E0B" />
              <View style={styles.statContent}>
                <Text style={styles.statValue}>23</Text>
                <Text style={styles.statLabel}>Reportes generados</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferencias</Text>
          
          <View style={styles.preferencesCard}>
            <View style={styles.preferenceItem}>
              <Text style={styles.preferenceLabel}>Notificaciones Push</Text>
              <Switch
                value={true}
                trackColor={{ false: "#D1D5DB", true: "#BFDBFE" }}
                thumbColor="#1E40AF"
              />
            </View>

            <View style={styles.preferenceItem}>
              <Text style={styles.preferenceLabel}>Sincronización Automática</Text>
              <Switch
                value={true}
                trackColor={{ false: "#D1D5DB", true: "#BFDBFE" }}
                thumbColor="#1E40AF"
              />
            </View>

            <View style={styles.preferenceItem}>
              <Text style={styles.preferenceLabel}>Modo Oscuro</Text>
              <Switch
                value={false}
                trackColor={{ false: "#D1D5DB", true: "#BFDBFE" }}
                thumbColor="#F3F4F6"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.dangerButton}>
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
            <Text style={styles.dangerButtonText}>Eliminar Cuenta</Text>
          </TouchableOpacity>
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
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  changePhotoButton: {
    position: 'absolute',
    bottom: 10,
    right: '35%',
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editButtonText: {
    color: '#1E40AF',
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoItem: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  infoInput: {
    fontSize: 16,
    color: '#1F2937',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 8,
  },
  saveButton: {
    backgroundColor: '#1E40AF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  securityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  securityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  securityItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  securityItemContent: {
    marginLeft: 12,
    flex: 1,
  },
  securityItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  securityItemDescription: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  securityBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  securityBadgeText: {
    color: '#065F46',
    fontSize: 12,
    fontWeight: '500',
  },
  statsCard: {
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
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statContent: {
    marginLeft: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  preferencesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  preferenceLabel: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#EF4444',
    gap: 8,
  },
  dangerButtonText: {
    color: '#EF4444',
    fontWeight: '600',
  },
});