import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSlotsStore } from '@/stores/slotsStore';
import { useAuthStore } from '@/stores/authStore';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const { user, isAuthenticated } = useAuthStore();
  const { slots, stats, fetchSlots, fetchStats } = useSlotsStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    loadData();
  }, [isAuthenticated]);

  const loadData = async () => {
    await Promise.all([fetchSlots(), fetchStats()]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
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

  const SlotCard = ({ slot }: any) => (
    <View style={styles.slotCard}>
      <View style={styles.slotHeader}>
        <View style={styles.flightInfo}>
          <Text style={styles.flightNumber}>{slot.flightNumber}</Text>
          <Text style={styles.airline}>{slot.airline}</Text>
        </View>
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
      
      <View style={styles.slotDetails}>
        <View style={styles.timeInfo}>
          <Ionicons name="time-outline" size={16} color="#64748B" />
          <Text style={styles.timeText}>{slot.scheduledTime}</Text>
          {slot.actualTime && slot.actualTime !== slot.scheduledTime && (
            <Text style={styles.actualTime}>→ {slot.actualTime}</Text>
          )}
        </View>
        
        <View style={styles.routeInfo}>
          <Ionicons name="airplane-outline" size={16} color="#64748B" />
          <Text style={styles.routeText}>{slot.origin} → {slot.destination}</Text>
        </View>
      </View>
    </View>
  );

  if (!isAuthenticated) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Bienvenido de vuelta</Text>
          <Text style={styles.userName}>{user?.name || 'Usuario AIFA'}</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color="#1E40AF" />
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationBadgeText}>3</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
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

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Slots Activos</Text>
          <TouchableOpacity onPress={() => router.push('/reservas')}>
            <Text style={styles.viewAllText}>Ver todos</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.slotsContainer}>
          {slots.slice(0, 5).map((slot, index) => (
            <SlotCard key={index} slot={slot} />
          ))}
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/reservas')}
            >
              <Ionicons name="add-circle-outline" size={32} color="#1E40AF" />
              <Text style={styles.actionText}>Nueva Reserva</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/calendar')}
            >
              <Ionicons name="calendar-outline" size={32} color="#1E40AF" />
              <Text style={styles.actionText}>Ver Calendario</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="document-text-outline" size={32} color="#1E40AF" />
              <Text style={styles.actionText}>Importar Excel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/reportes')}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
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
  slotsContainer: {
    marginBottom: 24,
  },
  slotCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  flightInfo: {},
  flightNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  airline: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
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
  slotDetails: {
    gap: 8,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 14,
    color: '#1F2937',
    marginLeft: 8,
  },
  actualTime: {
    fontSize: 14,
    color: '#F59E0B',
    marginLeft: 8,
    fontWeight: '500',
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeText: {
    fontSize: 14,
    color: '#1F2937',
    marginLeft: 8,
  },
  quickActions: {
    marginBottom: 20,
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