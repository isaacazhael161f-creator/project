import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ScrollView,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, addDays, startOfWeek, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewType, setViewType] = useState<'day' | 'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Mock data para slots
  const mockSlots = [
    {
      id: '1',
      flightNumber: 'AM101',
      airline: 'Aeroméxico',
      time: '08:00',
      origin: 'CDMX',
      destination: 'CUN',
      status: 'active'
    },
    {
      id: '2',
      flightNumber: 'VB205',
      airline: 'Volaris',
      time: '10:30',
      origin: 'CDMX',
      destination: 'GDL',
      status: 'delayed'
    },
    {
      id: '3',
      flightNumber: 'Y4302',
      airline: 'Viva Aerobus',
      time: '14:15',
      origin: 'CDMX',
      destination: 'MTY',
      status: 'active'
    }
  ];

  const ViewSelector = () => (
    <View style={styles.viewSelector}>
      <TouchableOpacity
        style={[styles.viewButton, viewType === 'day' && styles.viewButtonActive]}
        onPress={() => setViewType('day')}
      >
        <Text style={[styles.viewButtonText, viewType === 'day' && styles.viewButtonTextActive]}>
          Día
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.viewButton, viewType === 'week' && styles.viewButtonActive]}
        onPress={() => setViewType('week')}
      >
        <Text style={[styles.viewButtonText, viewType === 'week' && styles.viewButtonTextActive]}>
          Semana
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.viewButton, viewType === 'month' && styles.viewButtonActive]}
        onPress={() => setViewType('month')}
      >
        <Text style={[styles.viewButtonText, viewType === 'month' && styles.viewButtonTextActive]}>
          Mes
        </Text>
      </TouchableOpacity>
    </View>
  );

  const WeekView = () => {
    const startOfCurrentWeek = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfCurrentWeek, i));

    return (
      <View style={styles.weekView}>
        <View style={styles.weekHeader}>
          {weekDays.map((day, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayHeader,
                format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') && styles.dayHeaderSelected
              ]}
              onPress={() => setSelectedDate(day)}
            >
              <Text style={[
                styles.dayHeaderText,
                format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') && styles.dayHeaderTextSelected
              ]}>
                {format(day, 'EEE', { locale: es }).toUpperCase()}
              </Text>
              <Text style={[
                styles.dayHeaderNumber,
                format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') && styles.dayHeaderNumberSelected
              ]}>
                {format(day, 'd')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <ScrollView style={styles.timelineContainer}>
          {Array.from({ length: 24 }, (_, hour) => (
            <View key={hour} style={styles.timeSlot}>
              <Text style={styles.timeLabel}>{hour.toString().padStart(2, '0')}:00</Text>
              <View style={styles.timeSlotContent}>
                {mockSlots
                  .filter(slot => parseInt(slot.time.split(':')[0]) === hour)
                  .map(slot => (
                    <View key={slot.id} style={[styles.slotItem, {
                      backgroundColor: slot.status === 'active' ? '#10B981' : '#F59E0B',
                    }]}>
                      <Text style={styles.slotFlightNumber}>{slot.flightNumber}</Text>
                      <Text style={styles.slotRoute}>{slot.origin} → {slot.destination}</Text>
                    </View>
                  ))}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const DayView = () => (
    <View style={styles.dayView}>
      <Text style={styles.dayViewTitle}>
        {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: es })}
      </Text>
      <ScrollView>
        {mockSlots.map(slot => (
          <View key={slot.id} style={styles.daySlotItem}>
            <View style={styles.daySlotTime}>
              <Text style={styles.daySlotTimeText}>{slot.time}</Text>
            </View>
            <View style={styles.daySlotInfo}>
              <Text style={styles.daySlotFlight}>{slot.flightNumber} - {slot.airline}</Text>
              <Text style={styles.daySlotRoute}>{slot.origin} → {slot.destination}</Text>
              <View style={[styles.daySlotStatus, {
                backgroundColor: slot.status === 'active' ? '#10B981' : '#F59E0B',
              }]}>
                <Text style={styles.daySlotStatusText}>
                  {slot.status === 'active' ? 'Activo' : 'Retrasado'}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const MonthView = () => {
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    const calendarDays = [];
    // Empty cells for days before the first day of the month
    for (let i = 0; i < adjustedFirstDay; i++) {
      calendarDays.push(null);
    }
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      calendarDays.push(day);
    }

    const renderCalendarDay = ({ item, index }: any) => {
      if (!item) return <View style={styles.emptyDay} />;
      
      const isToday = new Date().getDate() === item && 
                     new Date().getMonth() === currentDate.getMonth() &&
                     new Date().getFullYear() === currentDate.getFullYear();

      return (
        <TouchableOpacity 
          style={[styles.calendarDay, isToday && styles.calendarDayToday]}
          onPress={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), item))}
        >
          <Text style={[styles.calendarDayText, isToday && styles.calendarDayTextToday]}>
            {item}
          </Text>
          <View style={styles.eventIndicator} />
        </TouchableOpacity>
      );
    };

    return (
      <View style={styles.monthView}>
        <View style={styles.monthHeader}>
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, index) => (
            <Text key={index} style={styles.monthHeaderText}>{day}</Text>
          ))}
        </View>
        <FlatList
          data={calendarDays}
          renderItem={renderCalendarDay}
          numColumns={7}
          scrollEnabled={false}
          style={styles.calendarGrid}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            onPress={() => setCurrentDate(subMonths(currentDate, 1))}
            style={styles.navButton}
          >
            <Ionicons name="chevron-back" size={24} color="#1E40AF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {format(currentDate, 'MMMM yyyy', { locale: es })}
          </Text>
          <TouchableOpacity 
            onPress={() => setCurrentDate(addMonths(currentDate, 1))}
            style={styles.navButton}
          >
            <Ionicons name="chevron-forward" size={24} color="#1E40AF" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity 
          style={styles.todayButton}
          onPress={() => setCurrentDate(new Date())}
        >
          <Text style={styles.todayButtonText}>Hoy</Text>
        </TouchableOpacity>
      </View>

      <ViewSelector />

      <View style={styles.calendarContent}>
        {viewType === 'day' && <DayView />}
        {viewType === 'week' && <WeekView />}
        {viewType === 'month' && <MonthView />}
      </View>
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginHorizontal: 16,
    textTransform: 'capitalize',
  },
  navButton: {
    padding: 8,
  },
  todayButton: {
    backgroundColor: '#1E40AF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  todayButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  viewSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 12,
    padding: 4,
  },
  viewButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewButtonActive: {
    backgroundColor: '#1E40AF',
  },
  viewButtonText: {
    color: '#64748B',
    fontWeight: '500',
  },
  viewButtonTextActive: {
    color: '#FFFFFF',
  },
  calendarContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
  },
  // Week View Styles
  weekView: {
    flex: 1,
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  dayHeaderSelected: {
    backgroundColor: '#1E40AF',
  },
  dayHeaderText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 4,
  },
  dayHeaderTextSelected: {
    color: '#FFFFFF',
  },
  dayHeaderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  dayHeaderNumberSelected: {
    color: '#FFFFFF',
  },
  timelineContainer: {
    flex: 1,
  },
  timeSlot: {
    flexDirection: 'row',
    minHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  timeLabel: {
    width: 60,
    fontSize: 12,
    color: '#64748B',
    textAlign: 'right',
    paddingRight: 12,
    paddingTop: 8,
  },
  timeSlotContent: {
    flex: 1,
    paddingLeft: 12,
    paddingVertical: 4,
  },
  slotItem: {
    padding: 8,
    borderRadius: 6,
    marginVertical: 2,
  },
  slotFlightNumber: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  slotRoute: {
    color: '#FFFFFF',
    fontSize: 10,
    marginTop: 2,
  },
  // Day View Styles
  dayView: {
    flex: 1,
  },
  dayViewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textTransform: 'capitalize',
  },
  daySlotItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  daySlotTime: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySlotTimeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  daySlotInfo: {
    flex: 1,
    paddingLeft: 16,
  },
  daySlotFlight: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  daySlotRoute: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  daySlotStatus: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  daySlotStatusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  // Month View Styles
  monthView: {
    flex: 1,
  },
  monthHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  monthHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  calendarGrid: {
    flex: 1,
  },
  emptyDay: {
    flex: 1,
    height: 50,
    margin: 1,
  },
  calendarDay: {
    flex: 1,
    height: 50,
    margin: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    position: 'relative',
  },
  calendarDayToday: {
    backgroundColor: '#1E40AF',
  },
  calendarDayText: {
    fontSize: 16,
    color: '#1F2937',
  },
  calendarDayTextToday: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  eventIndicator: {
    position: 'absolute',
    bottom: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
});