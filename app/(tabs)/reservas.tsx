import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSlotsStore } from '@/stores/slotsStore';
import { useAuthStore } from '@/stores/authStore';
import { router } from 'expo-router';

export default function ReservasScreen() {
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [newReserva, setNewReserva] = useState({
    flightNumber: '',
    airline: '',
    origin: '',
    destination: '',
    scheduledTime: '',
    aircraft: '',
  });

  const { slots, fetchSlots, createReserva, updateReserva, deleteReserva } = useSlotsStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    fetchSlots();
  }, [isAuthenticated]);

  const filteredSlots = slots.filter(slot => {
    const matchesSearch = slot.flightNumber.toLowerCase().includes(searchText.toLowerCase()) ||
                         slot.airline.toLowerCase().includes(searchText.toLowerCase());
    const matchesFilter = filterType === 'all' || slot.status === filterType;
    return matchesSearch && matchesFilter;
  });

  const handleCreateReserva = async () => {
    try {
      await createReserva(newReserva);
      setModalVisible(false);
      setNewReserva({
        flightNumber: '',
        airline: '',
        origin: '',
        destination: '',
        scheduledTime: '',
        aircraft: '',
      });
      Alert.alert('Éxito', 'Reserva creada exitosamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear la reserva');
    }
  };

  const handleEditSlot = (slot: any) => {
    setSelectedSlot(slot);
    setModalVisible(true);
  };

  const handleDeleteSlot = (slotId: string) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Está seguro de eliminar esta reserva?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteReserva(slotId);
              Alert.alert('Éxito', 'Reserva eliminada');
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar la reserva');
            }
          }
        }
      ]
    );
  };

  const FilterButton = ({ type, label, isActive }: any) => (
    <TouchableOpacity
      style={[styles.filterButton, isActive && styles.filterButtonActive]}
      onPress={() => setFilterType(type)}
    >
      <Text style={[styles.filterButtonText, isActive && styles.filterButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const ReservaCard = ({ item }: any) => (
    <View style={styles.reservaCard}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.flightNumber}>{item.flightNumber}</Text>
          <Text style={styles.airline}>{item.airline}</Text>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity onPress={() => handleEditSlot(item)}>
            <Ionicons name="create-outline" size={20} color="#1E40AF" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => handleDeleteSlot(item.id)}
            style={styles.deleteButton}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.cardContent}>
        <View style={styles.routeContainer}>
          <Text style={styles.routeText}>{item.origin}</Text>
          <Ionicons name="airplane-outline" size={16} color="#64748B" />
          <Text style={styles.routeText}>{item.destination}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={14} color="#64748B" />
          <Text style={styles.infoText}>{item.scheduledTime}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Ionicons name="airplane" size={14} color="#64748B" />
          <Text style={styles.infoText}>{item.aircraft || 'No especificado'}</Text>
        </View>
      </View>
      
      <View style={[styles.statusBadge, { 
        backgroundColor: item.status === 'active' ? '#10B981' : 
                        item.status === 'delayed' ? '#F59E0B' : 
                        item.status === 'cancelled' ? '#EF4444' : '#64748B' 
      }]}>
        <Text style={styles.statusText}>
          {item.status === 'active' ? 'Activo' :
           item.status === 'delayed' ? 'Retrasado' :
           item.status === 'cancelled' ? 'Cancelado' : 'Programado'}
        </Text>
      </View>
    </View>
  );

  if (!isAuthenticated) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gestión de Reservas</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar vuelos..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#64748B"
          />
        </View>
      </View>

      <View style={styles.filterContainer}>
        <FilterButton
          type="all"
          label="Todos"
          isActive={filterType === 'all'}
        />
        <FilterButton
          type="active"
          label="Activos"
          isActive={filterType === 'active'}
        />
        <FilterButton
          type="scheduled"
          label="Programados"
          isActive={filterType === 'scheduled'}
        />
        <FilterButton
          type="delayed"
          label="Retrasados"
          isActive={filterType === 'delayed'}
        />
      </View>

      <FlatList
        data={filteredSlots}
        renderItem={({ item }) => <ReservaCard item={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedSlot ? 'Editar Reserva' : 'Nueva Reserva'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <TextInput
                style={styles.modalInput}
                placeholder="Número de vuelo"
                value={newReserva.flightNumber}
                onChangeText={(text) => setNewReserva({...newReserva, flightNumber: text})}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Aerolínea"
                value={newReserva.airline}
                onChangeText={(text) => setNewReserva({...newReserva, airline: text})}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Origen"
                value={newReserva.origin}
                onChangeText={(text) => setNewReserva({...newReserva, origin: text})}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Destino"
                value={newReserva.destination}
                onChangeText={(text) => setNewReserva({...newReserva, destination: text})}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Hora programada (HH:MM)"
                value={newReserva.scheduledTime}
                onChangeText={(text) => setNewReserva({...newReserva, scheduledTime: text})}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Aeronave"
                value={newReserva.aircraft}
                onChangeText={(text) => setNewReserva({...newReserva, aircraft: text})}
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.modalButtonSecondary}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalButtonPrimary}
                onPress={handleCreateReserva}
              >
                <Text style={styles.modalButtonPrimaryText}>
                  {selectedSlot ? 'Actualizar' : 'Crear'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  addButton: {
    backgroundColor: '#1E40AF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonActive: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  reservaCard: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
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
  cardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteButton: {
    marginLeft: 8,
  },
  cardContent: {
    gap: 8,
    marginBottom: 12,
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeText: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#64748B',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalBody: {
    padding: 20,
    gap: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  modalButtonSecondary: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#64748B',
  },
  modalButtonSecondaryText: {
    color: '#64748B',
    fontWeight: '500',
  },
  modalButtonPrimary: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1E40AF',
  },
  modalButtonPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
});