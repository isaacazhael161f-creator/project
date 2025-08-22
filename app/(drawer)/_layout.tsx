import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { router } from 'expo-router';

function CustomDrawerContent(props: any) {
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.drawerContainer}>
      <View style={styles.drawerHeader}>
        <Image 
          source={{ uri: 'https://images.pexels.com/photos/62623/wing-plane-flying-airplane-62623.jpeg' }} 
          style={styles.drawerLogo}
        />
        <Text style={styles.drawerTitle}>AIFA SlotMaster Pro</Text>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user?.name || 'Usuario'}</Text>
          <Text style={styles.userRole}>{user?.role === 'admin' ? 'Administrador' : user?.role === 'supervisor' ? 'Supervisor' : 'Operador'}</Text>
        </View>
      </View>

      <View style={styles.drawerContent}>
        {[
          { name: '/(drawer)/dashboard', title: 'Dashboard', icon: 'speedometer-outline' },
          { name: '/(drawer)/reservas', title: 'Gestión de Reservas', icon: 'calendar-outline' },
          { name: '/(drawer)/calendar', title: 'Calendario de Slots', icon: 'calendar' },
          { name: '/(drawer)/reportes', title: 'Reportes y Estadísticas', icon: 'bar-chart-outline' },
          { name: '/(drawer)/profile', title: 'Perfil de Usuario', icon: 'person-outline' },
          { name: '/(drawer)/sync', title: 'Sincronización', icon: 'sync-outline' },
          { name: '/(drawer)/config', title: 'Configuración', icon: 'settings-outline' },
          { name: '/(drawer)/help', title: 'Ayuda y Soporte', icon: 'help-circle-outline' },
        ].map((item) => (
          <TouchableOpacity
            key={item.name}
            style={styles.drawerItem}
            onPress={() => router.push(item.name as any)}
          >
            <View style={styles.drawerItemContent}>
              <Ionicons name={item.icon as any} size={24} color="#64748B" />
              <Text style={styles.drawerItemText}>{item.title}</Text>
              {item.name === '/(drawer)/dashboard' && unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.drawerFooter}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#EF4444" />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function DrawerLayout() {
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        drawerStyle: { width: 300 },
        headerStyle: { backgroundColor: '#1E40AF' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Drawer.Screen 
        name="dashboard" 
        options={{ title: 'Dashboard Principal' }}
      />
      <Drawer.Screen 
        name="reservas" 
        options={{ title: 'Gestión de Reservas' }}
      />
      <Drawer.Screen 
        name="calendar" 
        options={{ title: 'Calendario de Slots' }}
      />
      <Drawer.Screen 
        name="reportes" 
        options={{ title: 'Reportes y Estadísticas' }}
      />
      <Drawer.Screen 
        name="profile" 
        options={{ title: 'Perfil de Usuario' }}
      />
      <Drawer.Screen 
        name="sync" 
        options={{ title: 'Sincronización de Datos' }}
      />
      <Drawer.Screen 
        name="config" 
        options={{ title: 'Configuración' }}
      />
      <Drawer.Screen 
        name="help" 
        options={{ title: 'Ayuda y Soporte' }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  drawerHeader: {
    padding: 20,
    backgroundColor: '#1E40AF',
    alignItems: 'center',
  },
  drawerLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 12,
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  userInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#BFDBFE',
  },
  userRole: {
    fontSize: 12,
    color: '#93C5FD',
  },
  drawerContent: {
    flex: 1,
    paddingTop: 20,
  },
  drawerItem: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  drawerItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  drawerItemText: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 16,
    flex: 1,
  },
  notificationBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  drawerFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    padding: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  logoutText: {
    fontSize: 16,
    color: '#EF4444',
    marginLeft: 16,
    fontWeight: '500',
  },
});