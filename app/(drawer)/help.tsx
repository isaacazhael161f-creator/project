import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HelpScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const faqData = [
    {
      id: 1,
      question: '¿Cómo puedo crear una nueva reserva de slot?',
      answer: 'Para crear una nueva reserva, navega a la sección "Gestión de Reservas" desde el menú lateral, toca el botón "+" en la esquina superior derecha y completa todos los campos requeridos como número de vuelo, aerolínea, origen, destino y hora programada.'
    },
    {
      id: 2,
      question: '¿Cómo importo datos desde un archivo Excel?',
      answer: 'Ve a la sección "Sincronización de Datos" y selecciona "Importar desde Excel". El archivo debe contener las columnas: Vuelo, Aerolínea, Origen, Destino, Hora, Aeronave y Tipo. Asegúrate de que los datos estén correctamente formateados antes de la importación.'
    },
    {
      id: 3,
      question: '¿Qué hago si la aplicación no sincroniza?',
      answer: 'Primero verifica tu conexión a internet. Si el problema persiste, ve a Configuración > Sincronización y verifica que la sincronización automática esté habilitada. También puedes forzar una sincronización manual desde la sección "Sincronización de Datos".'
    },
    {
      id: 4,
      question: '¿Cómo cambio mi contraseña?',
      answer: 'Ve a tu Perfil de Usuario, selecciona "Configuración de Seguridad" y toca "Cambiar Contraseña". Necesitarás ingresar tu contraseña actual y la nueva contraseña dos veces para confirmar.'
    },
    {
      id: 5,
      question: '¿Puedo usar la app sin conexión a internet?',
      answer: 'Sí, la aplicación funciona en modo offline. Los cambios se guardan localmente y se sincronizarán automáticamente cuando recuperes la conexión a internet.'
    },
    {
      id: 6,
      question: '¿Cómo genero reportes?',
      answer: 'En la sección "Reportes y Estadísticas" puedes generar diferentes tipos de reportes. Selecciona el período deseado y usa el botón "Exportar" para generar reportes en formato PDF o Excel.'
    }
  ];

  const contactOptions = [
    {
      id: 1,
      title: 'Correo Electrónico',
      description: 'soporte@aifa.gob.mx',
      icon: 'mail-outline',
      action: () => Linking.openURL('mailto:soporte@aifa.gob.mx')
    },
    {
      id: 2,
      title: 'Teléfono de Soporte',
      description: '+52 55 1234 5678',
      icon: 'call-outline',
      action: () => Linking.openURL('tel:+525512345678')
    },
    {
      id: 3,
      title: 'Mesa de Ayuda',
      description: 'Ext. 2580 (Interno)',
      icon: 'headset-outline',
      action: () => Alert.alert('Mesa de Ayuda', 'Contactar extensión 2580')
    },
    {
      id: 4,
      title: 'Chat en Vivo',
      description: 'Lun-Vie 8:00-18:00',
      icon: 'chatbubble-outline',
      action: () => Alert.alert('Chat', 'Función en desarrollo')
    }
  ];

  const quickGuides = [
    {
      title: 'Primeros Pasos',
      description: 'Configuración inicial y navegación básica',
      icon: 'play-circle-outline'
    },
    {
      title: 'Gestión de Slots',
      description: 'Crear, editar y eliminar reservas',
      icon: 'calendar-outline'
    },
    {
      title: 'Importación de Datos',
      description: 'Cómo importar archivos Excel',
      icon: 'document-text-outline'
    },
    {
      title: 'Reportes y Análisis',
      description: 'Generar y exportar reportes',
      icon: 'bar-chart-outline'
    }
  ];

  const filteredFAQ = faqData.filter(item =>
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFAQ = (id: number) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Búsqueda */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={20} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar en la ayuda..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#64748B"
            />
          </View>
        </View>

        {/* Guías rápidas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Guías Rápidas</Text>
          <View style={styles.guidesGrid}>
            {quickGuides.map((guide, index) => (
              <TouchableOpacity key={index} style={styles.guideCard}>
                <Ionicons name={guide.icon as any} size={32} color="#1E40AF" />
                <Text style={styles.guideTitle}>{guide.title}</Text>
                <Text style={styles.guideDescription}>{guide.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Preguntas frecuentes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preguntas Frecuentes</Text>
          <View style={styles.faqContainer}>
            {filteredFAQ.map((faq) => (
              <View key={faq.id} style={styles.faqCard}>
                <TouchableOpacity
                  style={styles.faqQuestion}
                  onPress={() => toggleFAQ(faq.id)}
                >
                  <Text style={styles.faqQuestionText}>{faq.question}</Text>
                  <Ionicons
                    name={expandedFAQ === faq.id ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#64748B"
                  />
                </TouchableOpacity>
                {expandedFAQ === faq.id && (
                  <View style={styles.faqAnswer}>
                    <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Opciones de contacto */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contacto y Soporte</Text>
          <View style={styles.contactGrid}>
            {contactOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.contactCard}
                onPress={option.action}
              >
                <View style={styles.contactIcon}>
                  <Ionicons name={option.icon as any} size={24} color="#1E40AF" />
                </View>
                <Text style={styles.contactTitle}>{option.title}</Text>
                <Text style={styles.contactDescription}>{option.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recursos adicionales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recursos Adicionales</Text>
          <View style={styles.resourcesCard}>
            <TouchableOpacity style={styles.resourceItem}>
              <Ionicons name="document-text-outline" size={24} color="#1E40AF" />
              <View style={styles.resourceContent}>
                <Text style={styles.resourceTitle}>Manual de Usuario</Text>
                <Text style={styles.resourceDescription}>Guía completa en PDF</Text>
              </View>
              <Ionicons name="download-outline" size={20} color="#64748B" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.resourceItem}>
              <Ionicons name="videocam-outline" size={24} color="#1E40AF" />
              <View style={styles.resourceContent}>
                <Text style={styles.resourceTitle}>Tutoriales en Video</Text>
                <Text style={styles.resourceDescription}>Aprende paso a paso</Text>
              </View>
              <Ionicons name="open-outline" size={20} color="#64748B" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.resourceItem}>
              <Ionicons name="globe-outline" size={24} color="#1E40AF" />
              <View style={styles.resourceContent}>
                <Text style={styles.resourceTitle}>Portal Web AIFA</Text>
                <Text style={styles.resourceDescription}>Información oficial</Text>
              </View>
              <Ionicons name="open-outline" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Enviar comentarios */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Enviar Comentarios</Text>
          <View style={styles.feedbackCard}>
            <Text style={styles.feedbackTitle}>¿Tienes sugerencias?</Text>
            <Text style={styles.feedbackDescription}>
              Ayúdanos a mejorar AIFA SlotMaster Pro enviando tus comentarios y sugerencias.
            </Text>
            <TouchableOpacity style={styles.feedbackButton}>
              <Ionicons name="chatbubble-outline" size={20} color="#FFFFFF" />
              <Text style={styles.feedbackButtonText}>Enviar Comentarios</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Información de la aplicación */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoTitle}>AIFA SlotMaster Pro</Text>
          <Text style={styles.appInfoVersion}>Versión 1.0.0 (2024.1)</Text>
          <Text style={styles.appInfoCopyright}>
            © 2024 Aeropuerto Internacional Felipe Ángeles
          </Text>
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
  content: {
    padding: 20,
  },
  searchContainer: {
    marginBottom: 24,
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  guidesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  guideCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  guideTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  guideDescription: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },
  faqContainer: {
    gap: 8,
  },
  faqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  faqQuestionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  faqAnswerText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  contactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  contactCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  contactIcon: {
    marginBottom: 8,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  contactDescription: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },
  resourcesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  resourceContent: {
    flex: 1,
    marginLeft: 12,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  resourceDescription: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  feedbackCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  feedbackDescription: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  feedbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E40AF',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  feedbackButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  appInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  appInfoVersion: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  appInfoCopyright: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});