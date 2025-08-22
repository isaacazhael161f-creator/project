import { create } from 'zustand';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  timestamp: Date;
  read: boolean;
  data?: any;
}

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  permissionGranted: boolean;
  
  requestPermissions: () => Promise<boolean>;
  scheduleNotification: (title: string, body: string, data?: any) => Promise<void>;
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  permissionGranted: false,

  requestPermissions: async () => {
    if (Platform.OS === 'web') {
      set({ permissionGranted: true });
      return true;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    const granted = finalStatus === 'granted';
    set({ permissionGranted: granted });
    return granted;
  },

  scheduleNotification: async (title: string, body: string, data?: any) => {
    const { permissionGranted } = get();
    if (!permissionGranted) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: true,
      },
      trigger: null, // Send immediately
    });
  },

  addNotification: (notification) => {
    const newNotification: AppNotification = {
      ...notification,
      id: `notif_${Date.now()}`,
      timestamp: new Date(),
    };

    set(state => ({
      notifications: [newNotification, ...state.notifications],
      unreadCount: state.unreadCount + (notification.read ? 0 : 1)
    }));
  },

  markAsRead: (id: string) => {
    set(state => ({
      notifications: state.notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1)
    }));
  },

  markAllAsRead: () => {
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, read: true })),
      unreadCount: 0
    }));
  },

  clearNotifications: () => {
    set({ notifications: [], unreadCount: 0 });
  }
}));