import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Slot {
  id: string;
  flightNumber: string;
  airline: string;
  origin: string;
  destination: string;
  scheduledTime: string;
  actualTime?: string;
  aircraft: string;
  gate?: string;
  status: 'active' | 'delayed' | 'cancelled' | 'scheduled' | 'completed';
  slotType: 'arrival' | 'departure';
  createdAt: Date;
  updatedAt: Date;
}

export interface SlotStats {
  todayFlights: number;
  onTimePercentage: number;
  delayedFlights: number;
  cancelledFlights: number;
  totalSlots: number;
  availableSlots: number;
}

interface SlotsState {
  slots: Slot[];
  stats: SlotStats;
  isLoading: boolean;
  lastSync: Date | null;
  offlineChanges: string[];
  
  fetchSlots: () => Promise<void>;
  fetchStats: () => Promise<void>;
  createReserva: (data: Omit<Slot, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateReserva: (id: string, data: Partial<Slot>) => Promise<void>;
  deleteReserva: (id: string) => Promise<void>;
  importExcelData: (data: any[]) => Promise<void>;
  syncOfflineChanges: () => Promise<void>;
  getSlotsByDate: (date: Date) => Slot[];
  getSlotsByStatus: (status: string) => Slot[];
}

// Mock data para demostración
const generateMockSlots = (): Slot[] => {
  const airlines = ['Aeroméxico', 'Volaris', 'Viva Aerobus', 'Interjet', 'TAR', 'Magnicharters'];
  const destinations = ['CUN', 'GDL', 'MTY', 'TIJ', 'MZT', 'PVR', 'BJX', 'SLP'];
  const aircraft = ['B737-800', 'A320', 'E190', 'B737-700', 'A321'];
  const statuses: Slot['status'][] = ['active', 'delayed', 'scheduled', 'completed'];
  
  return Array.from({ length: 50 }, (_, i) => {
    const hour = 6 + Math.floor(Math.random() * 16);
    const minute = Math.floor(Math.random() * 4) * 15;
    
    return {
      id: `slot_${i + 1}`,
      flightNumber: `${['AM', 'VB', 'Y4', 'I7', 'YQ', 'UX'][Math.floor(Math.random() * 6)]}${(100 + i).toString()}`,
      airline: airlines[Math.floor(Math.random() * airlines.length)],
      origin: Math.random() > 0.5 ? 'AIFA' : destinations[Math.floor(Math.random() * destinations.length)],
      destination: Math.random() > 0.5 ? destinations[Math.floor(Math.random() * destinations.length)] : 'AIFA',
      scheduledTime: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
      actualTime: Math.random() > 0.7 ? `${hour.toString().padStart(2, '0')}:${(minute + Math.floor(Math.random() * 30)).toString().padStart(2, '0')}` : undefined,
      aircraft: aircraft[Math.floor(Math.random() * aircraft.length)],
      gate: `G${Math.floor(Math.random() * 20) + 1}`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      slotType: Math.random() > 0.5 ? 'arrival' : 'departure',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  });
};

export const useSlotsStore = create<SlotsState>()(
  persist(
    (set, get) => ({
      slots: [],
      stats: {
        todayFlights: 0,
        onTimePercentage: 0,
        delayedFlights: 0,
        cancelledFlights: 0,
        totalSlots: 0,
        availableSlots: 0
      },
      isLoading: false,
      lastSync: null,
      offlineChanges: [],

      fetchSlots: async () => {
        set({ isLoading: true });
        try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          const mockSlots = generateMockSlots();
          set({ 
            slots: mockSlots, 
            isLoading: false,
            lastSync: new Date()
          });
        } catch (error) {
          set({ isLoading: false });
        }
      },

      fetchStats: async () => {
        const { slots } = get();
        const today = new Date().toDateString();
        const todaySlots = slots.filter(slot => 
          new Date(slot.createdAt).toDateString() === today
        );

        const stats = {
          todayFlights: todaySlots.length,
          onTimePercentage: Math.round((todaySlots.filter(s => s.status === 'active' || s.status === 'completed').length / todaySlots.length) * 100) || 0,
          delayedFlights: todaySlots.filter(s => s.status === 'delayed').length,
          cancelledFlights: todaySlots.filter(s => s.status === 'cancelled').length,
          totalSlots: slots.length,
          availableSlots: Math.max(0, 100 - slots.filter(s => s.status !== 'cancelled').length)
        };

        set({ stats });
      },

      createReserva: async (data) => {
        const newSlot: Slot = {
          ...data,
          id: `slot_${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        set(state => ({
          slots: [...state.slots, newSlot],
          offlineChanges: [...state.offlineChanges, `create_${newSlot.id}`]
        }));

        get().fetchStats();
      },

      updateReserva: async (id, data) => {
        set(state => ({
          slots: state.slots.map(slot =>
            slot.id === id ? { ...slot, ...data, updatedAt: new Date() } : slot
          ),
          offlineChanges: [...state.offlineChanges, `update_${id}`]
        }));

        get().fetchStats();
      },

      deleteReserva: async (id) => {
        set(state => ({
          slots: state.slots.filter(slot => slot.id !== id),
          offlineChanges: [...state.offlineChanges, `delete_${id}`]
        }));

        get().fetchStats();
      },

      importExcelData: async (data) => {
        set({ isLoading: true });
        
        try {
          const importedSlots: Slot[] = data.map((row, index) => ({
            id: `imported_${Date.now()}_${index}`,
            flightNumber: row['Vuelo'] || row['Flight'] || '',
            airline: row['Aerolínea'] || row['Airline'] || '',
            origin: row['Origen'] || row['Origin'] || '',
            destination: row['Destino'] || row['Destination'] || '',
            scheduledTime: row['Hora'] || row['Time'] || '',
            aircraft: row['Aeronave'] || row['Aircraft'] || '',
            gate: row['Puerta'] || row['Gate'] || '',
            status: 'scheduled',
            slotType: row['Tipo'] === 'Llegada' || row['Type'] === 'Arrival' ? 'arrival' : 'departure',
            createdAt: new Date(),
            updatedAt: new Date()
          }));

          set(state => ({
            slots: [...state.slots, ...importedSlots],
            isLoading: false,
            lastSync: new Date()
          }));

          get().fetchStats();
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      syncOfflineChanges: async () => {
        const { offlineChanges } = get();
        if (offlineChanges.length === 0) return;

        try {
          await new Promise(resolve => setTimeout(resolve, 2000));
          set({ 
            offlineChanges: [],
            lastSync: new Date()
          });
        } catch (error) {
          console.error('Error syncing offline changes:', error);
        }
      },

      getSlotsByDate: (date: Date) => {
        const { slots } = get();
        return slots.filter(slot => 
          new Date(slot.createdAt).toDateString() === date.toDateString()
        );
      },

      getSlotsByStatus: (status: string) => {
        const { slots } = get();
        return slots.filter(slot => slot.status === status);
      }
    }),
    {
      name: 'slots-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        slots: state.slots,
        lastSync: state.lastSync 
      }),
    }
  )
);