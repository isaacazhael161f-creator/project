import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSlotsStore } from '@/stores/slotsStore';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedView, setSelectedView] = useState<'stats' | 'table'>('table');
  const { user } = useAuthStore();
  const { slots, stats, fetchSlots, fetchStats, isLoading } = useSlotsStore();
  const { notifications, unreadCount, markAsRead } = useNotificationStore();

  useEffect(() => {
    // Only load data if we have slots (meaning Excel has been imported)
    if (slots.length > 0) {
      loadData();
    }
  }, []);

  const loadData = async () => {
    await Promise.all([fetchSlots(), fetchStats()]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const exportToExcel = async () => {
    try {
      const csvContent = [
        'Vuelo,Aerolínea,Origen,Destino,Hora Programada,Hora Real,Estado',
        ...slots.map(slot => 
          `${slot.flightNumber},${slot.airline},${slot.origin},${slot.destination},${slot.scheduledTime},${slot.actualTime || ''},${slot.status}`
        )
      ].join('\n');
      
      const fileUri = FileSystem.documentDirectory + 'slots_export.csv';
      await FileSystem.writeAsStringAsync(fileUri, csvContent);
      await Sharing.shareAsync(fileUri);
    } catch (error) {
      Alert.alert('Error', 'No se pudo exportar el archivo');
    }
  };

  const exportToPDF = async () => {
    Alert.alert('Exportar PDF', 'Funcionalidad de exportación PDF en desarrollo');
  };

  const StatCard = ({ icon, title, value, color, trend }: any) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Ionicons name={icon} size={24} color={color} />
        <View style={styles.trendContainer}>
          <Ionicons 
            name={trend > 0 ? "trending-up" : trend < 0 ? "trending-down" : "remove"} 
            size={16} 
            color={trend > 0 ? "#10B981" : trend < 0 ? "#EF4444" : "#64748B"} 
          />
          <Text style={[styles.trendText, { 
            color: trend > 0 ? "#10B981" : trend < 0 ? "#EF4444" : "#64748B" 
          }]}>
            {Math.abs(trend)}%
          </Text>
        </View>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  const renderSlotRow = ({ item: slot }: any) => (
    <View style={styles.tableRow}>
      <Text style={[styles.tableCell, styles.flightCell]}>{slot.flightNumber}</Text>
      <Text style={[styles.tableCell, styles.airlineCell]}>{slot.airline}</Text>
      <Text style={[styles.tableCell, styles.routeCell]}>{slot.origin}-{slot.destination}</Text>
      <Text style={[styles.tableCell, styles.timeCell]}>{slot.scheduledTime}</Text>
      <View style={[styles.tableCell, styles.statusCell]}>
        <View style={[styles.statusBadge, { 
          backgroundColor: slot.status === 'active' ? '#10B981' : 
                          slot.status === 'delayed' ? '#F59E0B' : 
                          slot.status === 'cancelled' ? '#EF4444' : '#64748B' 
        }]}>
          <Text style={styles.statusText}>
            {slot.status === 'active' ? 'Activo' :
             slot.status === 'delayed' ? 'Retrasado' :
             slot.status === 'cancelled' ? 'Cancelado' : 'Programado'}
          </Text>
        </View>
      </View>
    </View>
  );

  const NotificationItem = ({ notification }: any) => (
    <TouchableOpacity 
      style={[styles.notificationItem, !notification.read && styles.notificationUnread]}
      onPress={() => markAsRead(notification.id)}
    >
      <View style={[styles.notificationIcon, {
        backgroundColor: notification.type === 'error' ? '#EF4444' :
                         notification.type === 'warning' ? '#F59E0B' :
                         notification.type === 'success' ? '#10B981' : '#1E40AF'
      }]}>
        <Ionicons 
          name={
            notification.type === 'error' ? 'alert-circle' :
            notification.type === 'warning' ? 'warning' :
            notification.type === 'success' ? 'checkmark-circle' : 'information-circle'
          } 
          size={20} 
          color="#FFFFFF" 
        />
      </View>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{notification.title}</Text>
        <Text style={styles.notificationMessage}>{notification.message}</Text>
        <Text style={styles.notificationTime}>
          {new Date(notification.timestamp).toLocaleTimeString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Show import message if no data
  if (slots.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="document-outline" size={80} color="#64748B" />
          <Text style={styles.emptyTitle}>No hay datos de vuelos</Text>
          <Text style={styles.emptyMessage}>
            Importa un archivo Excel desde la sección de Sincronización para comenzar
          </Text>
          <TouchableOpacity 
            style={styles.importButton}
            onPress={() => router.push('/(drawer)/sync')}
          >
            <Ionicons name="cloud-upload-outline" size={24} color="#FFFFFF" />
            <Text style={styles.importButtonText}>Importar Excel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>Bienvenido de vuelta</Text>
          <Text style={styles.userName}>{user?.name || 'Usuario AIFA'}</Text>
          <Text style={styles.timestamp}>
            Última actualización: {new Date().toLocaleString('es-MX')}
          </Text>
        </View>

        {/* Toggle between views */}
        <View style={styles.viewToggle}>
          <TouchableOpacity 
            style={[styles.toggleButton, selectedView === 'table' && styles.toggleButtonActive]}
            onPress={() => setSelectedView('table')}
          >
            <Ionicons name="list-outline" size={20} color={selectedView === 'table' ? '#FFFFFF' : '#64748B'} />
            <Text style={[styles.toggleText, selectedView === 'table' && styles.toggleTextActive]}>
              Tabla de Vuelos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleButton, selectedView === 'stats' && styles.toggleButtonActive]}
            onPress={() => setSelectedView('stats')}
          >
            <Ionicons name="stats-chart-outline" size={20} color={selectedView === 'stats' ? '#FFFFFF' : '#64748B'} />
            <Text style={[styles.toggleText, selectedView === 'stats' && styles.toggleTextActive]}>
              Estadísticas
            </Text>
          </TouchableOpacity>
        </View>

        {selectedView === 'table' ? (
          /* Tabla de vuelos */
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Vuelos Programados ({slots.length})</Text>
              <View style={styles.exportButtons}>
                <TouchableOpacity style={styles.exportButton} onPress={exportToExcel}>
                  <Ionicons name="document-outline" size={16} color="#10B981" />
                  <Text style={styles.exportButtonText}>Excel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.exportButton} onPress={exportToPDF}>
                  <Ionicons name="document-text-outline" size={16} color="#EF4444" />
                  <Text style={styles.exportButtonText}>PDF</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.tableContainer}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.flightCell]}>Vuelo</Text>
                <Text style={[styles.tableHeaderCell, styles.airlineCell]}>Aerolínea</Text>
                <Text style={[styles.tableHeaderCell, styles.routeCell]}>Ruta</Text>
                <Text style={[styles.tableHeaderCell, styles.timeCell]}>Hora</Text>
                <Text style={[styles.tableHeaderCell, styles.statusCell]}>Estado</Text>
              </View>
              
              {/* Table Data */}
              <FlatList
                data={slots}
                renderItem={renderSlotRow}
                keyExtractor={(item, index) => index.toString()}
                style={styles.tableData}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </View>
        ) : (
          /* Estadísticas */
          <View style={styles.statsContainer}>
            <StatCard
              icon="airplane-outline"
              title="Vuelos Hoy"
              value={stats.todayFlights}
              color="#1E40AF"
              trend={5.2}
            />
            <StatCard
              icon="time-outline"
              title="En Tiempo"
              value={`${stats.onTimePercentage}%`}
              color="#10B981"
              trend={2.1}
            />
            <StatCard
              icon="warning-outline"
              title="Retrasados"
              value={stats.delayedFlights}
              color="#F59E0B"
              trend={-1.5}
            />
            <StatCard
              icon="close-circle-outline"
              title="Cancelados"
              value={stats.cancelledFlights}
              color="#EF4444"
              trend={-0.8}
            />
          </View>
        )}

        {/* Notificaciones */}
        {notifications.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Notificaciones</Text>
              {unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>
            <View style={styles.notificationsList}>
              {notifications.slice(0, 3).map((notification) => (
                <NotificationItem key={notification.id} notification={notification} />
              ))}
            </View>
          </View>
        )}

        {/* Acciones rápidas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/(drawer)/reservas')}
            >
              <Ionicons name="add-circle-outline" size={32} color="#1E40AF" />
              <Text style={styles.actionText}>Nueva Reserva</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/(drawer)/calendar')}
            >
              <Ionicons name="calendar-outline" size={32} color="#1E40AF" />
              <Text style={styles.actionText}>Ver Calendario</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/(drawer)/sync')}
            >
              <Ionicons name="document-text-outline" size={32} color="#1E40AF" />
              <Text style={styles.actionText}>Importar Excel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/(drawer)/reportes')}
            >
              <Ionicons name="bar-chart-outline" size={32} color="#1E40AF" />
              <Text style={styles.actionText}>Reportes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 20,
    marginBottom: 12,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  importButton: {
    backgroundColor: '#1E40AF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  importButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  welcomeContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  welcomeText: {
    fontSize: 14,
    color: '#64748B',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 2,
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#1E40AF',
  },
  toggleText: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 8,
    fontWeight: '500',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: (width - 60) / 2,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: '#64748B',
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
  viewAllText: {
    color: '#1E40AF',
    fontSize: 14,
    fontWeight: '500',
  },
  exportButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  exportButtonText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
    color: '#1F2937',
  },
  tableContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tableHeaderCell: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    textAlign: 'center',
  },
  tableData: {
    maxHeight: 400,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tableCell: {
    fontSize: 12,
    color: '#1F2937',
    textAlign: 'center',
  },
  flightCell: {
    flex: 1.2,
    fontWeight: '600',
  },
  airlineCell: {
    flex: 1.5,
  },
  routeCell: {
    flex: 1.8,
  },
  timeCell: {
    flex: 1.2,
  },
  statusCell: {
    flex: 1.3,
    alignItems: 'center',
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  notificationsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  notificationUnread: {
    backgroundColor: '#FEF3C7',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: (width - 60) / 2,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionText: {
    fontSize: 12,
    color: '#1F2937',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
});