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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSlotsStore, Slot } from '@/stores/slotsStore';
import { useAuthStore } from '@/stores/authStore';

export default function ReservasScreen() {
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSlot, setEditingSlot] = useState<Slot | null>(null);
  const [formData, setFormData] = useState({
    flightNumber: '',
    airline: '',
    origin: '',
    destination: '',
    scheduledTime: '',
    aircraft: '',
    gate: '',
    slotType: 'departure' as 'arrival' | 'departure',
    status: 'scheduled' as Slot['status'],
  });

  const { slots, fetchSlots, createReserva, updateReserva, deleteReserva, isLoading } = useSlotsStore();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchSlots();
  }, []);

  const resetForm = () => {
    setFormData({
      flightNumber: '',
      airline: '',
      origin: '',
      destination: '',
      scheduledTime: '',
      aircraft: '',
      gate: '',
      slotType: 'departure',
      status: 'scheduled',
    });
    setEditingSlot(null);
  };

  const filteredSlots = slots.filter(slot => {
    const matchesSearch = slot.flightNumber.toLowerCase().includes(searchText.toLowerCase()) ||
                         slot.airline.toLowerCase().includes(searchText.toLowerCase());
    const matchesFilter = filterType === 'all' || slot.status === filterType;
    return matchesSearch && matchesFilter;
  });

  const handleSaveReserva = async () => {
    if (!formData.flightNumber || !formData.airline || !formData.origin || 
        !formData.destination || !formData.scheduledTime) {
      Alert.alert('Error', 'Por favor complete todos los campos obligatorios');
      return;
    }

    try {
      if (editingSlot) {
        await updateReserva(editingSlot.id, formData);
        Alert.alert('Éxito', 'Reserva actualizada exitosamente');
      } else {
        await createReserva(formData);
        Alert.alert('Éxito', 'Reserva creada exitosamente');
      }
      
      setModalVisible(false);
      resetForm();
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la reserva');
    }
  };

  const handleEditSlot = (slot: Slot) => {
    setEditingSlot(slot);
    setFormData({
      flightNumber: slot.flightNumber,
      airline: slot.airline,
      origin: slot.origin,
      destination: slot.destination,
      scheduledTime: slot.scheduledTime,
      aircraft: slot.aircraft,
      gate: slot.gate || '',
      slotType: slot.slotType,
      status: slot.status,
    });
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

  const ReservaCard = ({ item }: { item: Slot }) => (
    <View style={styles.reservaCard}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.flightNumber}>{item.flightNumber}</Text>
          <Text style={styles.airline}>{item.airline}</Text>
        </View>
        <View style={styles.cardActions}>
          {user?.role === 'admin' && (
            <>
              <TouchableOpacity onPress={() => handleEditSlot(item)}>
                <Ionicons name="create-outline" size={20} color="#1E40AF" />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => handleDeleteSlot(item.id)}
                style={styles.deleteButton}
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
      
      <View style={styles.cardContent}>
        <View style={styles.routeContainer}>
          <Text style={styles.routeText}>{item.origin}</Text>
          <Ionicons 
            name={item.slotType === 'arrival' ? "arrow-down" : "arrow-up"} 
            size={16} 
            color="#64748B" 
          />
          <Text style={styles.routeText}>{item.destination}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={14} color="#64748B" />
          <Text style={styles.infoText}>{item.scheduledTime}</Text>
          {item.actualTime && (
            <Text style={styles.actualTime}>→ {item.actualTime}</Text>
          )}
        </View>
        
        <View style={styles.infoRow}>
          <Ionicons name="airplane" size={14} color="#64748B" />
          <Text style={styles.infoText}>{item.aircraft}</Text>
        </View>

        {item.gate && (
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={14} color="#64748B" />
            <Text style={styles.infoText}>Puerta {item.gate}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.cardFooter}>
        <View style={[styles.statusBadge, { 
          backgroundColor: item.status === 'active' ? '#10B981' : 
                          item.status === 'delayed' ? '#F59E0B' : 
                          item.status === 'cancelled' ? '#EF4444' : '#64748B' 
        }]}>
          <Text style={styles.statusText}>
            {item.status === 'active' ? 'Activo' :
             item.status === 'delayed' ? 'Retrasado' :
             item.status === 'cancelled' ? 'Cancelado' : 
             item.status === 'completed' ? 'Completado' : 'Programado'}
          </Text>
        </View>
        
        <Text style={styles.slotTypeText}>
          {item.slotType === 'arrival' ? 'Llegada' : 'Salida'}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setModalVisible(true);
          }}
          disabled={user?.role !== 'admin'}
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
        <FilterButton type="all" label="Todos" isActive={filterType === 'all'} />
        <FilterButton type="active" label="Activos" isActive={filterType === 'active'} />
        <FilterButton type="scheduled" label="Programados" isActive={filterType === 'scheduled'} />
        <FilterButton type="delayed" label="Retrasados" isActive={filterType === 'delayed'} />
        <FilterButton type="cancelled" label="Cancelados" isActive={filterType === 'cancelled'} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E40AF" />
          <Text style={styles.loadingText}>Cargando reservas...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredSlots}
          renderItem={({ item }) => <ReservaCard item={item} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="airplane-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>No hay reservas disponibles</Text>
            </View>
          }
        />
      )}

      {/* Modal para crear/editar reserva */}
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
                {editingSlot ? 'Editar Reserva' : 'Nueva Reserva'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <TextInput
                style={styles.modalInput}
                placeholder="Número de vuelo *"
                value={formData.flightNumber}
                onChangeText={(text) => setFormData({...formData, flightNumber: text})}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Aerolínea *"
                value={formData.airline}
                onChangeText={(text) => setFormData({...formData, airline: text})}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Origen *"
                value={formData.origin}
                onChangeText={(text) => setFormData({...formData, origin: text})}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Destino *"
                value={formData.destination}
                onChangeText={(text) => setFormData({...formData, destination: text})}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Hora programada (HH:MM) *"
                value={formData.scheduledTime}
                onChangeText={(text) => setFormData({...formData, scheduledTime: text})}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Aeronave"
                value={formData.aircraft}
                onChangeText={(text) => setFormData({...formData, aircraft: text})}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Puerta"
                value={formData.gate}
                onChangeText={(text) => setFormData({...formData, gate: text})}
              />

              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Tipo de Slot:</Text>
                <View style={styles.pickerButtons}>
                  <TouchableOpacity
                    style={[
                      styles.pickerButton,
                      formData.slotType === 'departure' && styles.pickerButtonActive
                    ]}
                    onPress={() => setFormData({...formData, slotType: 'departure'})}
                  >
                    <Text style={[
                      styles.pickerButtonText,
                      formData.slotType === 'departure' && styles.pickerButtonTextActive
                    ]}>Salida</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.pickerButton,
                      formData.slotType === 'arrival' && styles.pickerButtonActive
                    ]}
                    onPress={() => setFormData({...formData, slotType: 'arrival'})}
                  >
                    <Text style={[
                      styles.pickerButtonText,
                      formData.slotType === 'arrival' && styles.pickerButtonTextActive
                    ]}>Llegada</Text>
                  </TouchableOpacity>
                </View>
              </View>
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
                onPress={handleSaveReserva}
              >
                <Text style={styles.modalButtonPrimaryText}>
                  {editingSlot ? 'Actualizar' : 'Crear'}
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
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
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
    paddingBottom: 16,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonActive: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  filterButtonText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 12,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 16,
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
  actualTime: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  slotTypeText: {
    fontSize: 12,
    color: '#64748B',
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
    maxHeight: '60%',
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
  pickerContainer: {
    marginTop: 8,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 8,
  },
  pickerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  pickerButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  pickerButtonActive: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  pickerButtonText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  pickerButtonTextActive: {
    color: '#FFFFFF',
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