import { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

export default function IndexScreen() {
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAuthenticated && user) {
        router.replace('/(drawer)/dashboard');
      } else {
        router.replace('/(auth)/login');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, user]);

  return (
    <View style={styles.container}>
      <Image 
        source={{ uri: 'https://images.pexels.com/photos/62623/wing-plane-flying-airplane-62623.jpeg' }} 
        style={styles.logo}
      />
      <Text style={styles.title}>AIFA SlotMaster Pro</Text>
      <Text style={styles.subtitle}>Sistema de Gestión de Slots</Text>
      <Text style={styles.version}>Aeropuerto Internacional Felipe Ángeles</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E40AF',
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#BFDBFE',
    marginBottom: 24,
    textAlign: 'center',
  },
  version: {
    fontSize: 12,
    color: '#93C5FD',
    textAlign: 'center',
  },
});