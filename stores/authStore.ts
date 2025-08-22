import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'operator' | 'supervisor';
  department: string;
  lastLogin?: Date;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  biometricEnabled: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  resetPassword: (email: string) => Promise<boolean>;
  enableBiometric: () => void;
  disableBiometric: () => void;
  updateProfile: (data: Partial<User>) => void;
}

// Mock users para demostración
const mockUsers = [
  {
    id: '1',
    name: 'Carlos Mendoza',
    email: 'carlos.mendoza@aifa.gob.mx',
    username: 'admin',
    password: 'admin123',
    role: 'admin' as const,
    department: 'Operaciones'
  },
  {
    id: '2', 
    name: 'Ana García',
    email: 'ana.garcia@aifa.gob.mx',
    username: 'operator',
    password: 'operator123',
    role: 'operator' as const,
    department: 'Control de Tráfico'
  }
];

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      biometricEnabled: false,

      login: async (username: string, password: string) => {
        set({ isLoading: true });
        
        try {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Simular llamada API
          
          const user = mockUsers.find(u => u.username === username && u.password === password);
          
          if (user) {
            const { password: _, username: __, ...userData } = user;
            set({ 
              user: { ...userData, lastLogin: new Date() },
              isAuthenticated: true,
              isLoading: false 
            });
            return true;
          } else {
            set({ isLoading: false });
            return false;
          }
        } catch (error) {
          set({ isLoading: false });
          return false;
        }
      },

      logout: () => {
        set({ 
          user: null, 
          isAuthenticated: false,
          biometricEnabled: false 
        });
      },

      resetPassword: async (email: string) => {
        await new Promise(resolve => setTimeout(resolve, 1500));
        return mockUsers.some(u => u.email === email);
      },

      enableBiometric: () => {
        set({ biometricEnabled: true });
      },

      disableBiometric: () => {
        set({ biometricEnabled: false });
      },

      updateProfile: (data: Partial<User>) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...data } });
        }
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated,
        biometricEnabled: state.biometricEnabled 
      }),
    }
  )
);