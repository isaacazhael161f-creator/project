import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { useSlotsStore } from '@/stores/slotsStore';

const screenWidth = Dimensions.get('window').width;

export default function ReportesScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const { stats } = useSlotsStore();

  const chartConfig = {
    backgroundColor: '#1E40AF',
    backgroundGradientFrom: '#1E40AF',
    backgroundGradientTo: '#3B82F6',
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.7,
    decimalPlaces: 0,
  };

  // Mock data para gráficos
  const flightData = {
    labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    datasets: [
      {
        data: [45, 52, 48, 61, 58, 42, 38],
        color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
        strokeWidth: 3,
      }
    ]
  };

  const delayData = {
    labels: ['0-15min', '15-30min', '30-60min', '+60min'],
    datasets: [{
      data: [65, 25, 8, 2]
    }]
  };

  const airlineData = [
    { name: 'Aeroméxico', flights: 45, color: '#1E40AF', legendFontColor: '#1F2937', legendFontSize: 12 },
    { name: 'Volaris', flights: 38, color: '#10B981', legendFontColor: '#1F2937', legendFontSize: 12 },
    { name: 'Viva Aerobus', flights: 32, color: '#F59E0B', legendFontColor: '#1F2937', legendFontSize: 12 },
    { name: 'Interjet', flights: 25, color: '#EF4444', legendFontColor: '#1F2937', legendFontSize: 12 },
  ];

  const PeriodSelector = () => (
    <View style={styles.periodSelector}>
      {[
        { key: 'week', label: 'Semana' },
        { key: 'month', label: 'Mes' },
        { key: 'year', label: 'Año' }
      ].map((period) => (
        <TouchableOpacity
          key={period.key}
          style={[styles.periodButton, selectedPeriod === period.key && styles.periodButtonActive]}
          onPress={() => setSelectedPeriod(period.key)}
        >
          <Text style={[styles.periodButtonText, selectedPeriod === period.key && styles.periodButtonTextActive]}>
            {period.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const StatCard = ({ title, value, icon, color, change }: any) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Ionicons name={icon} size={24} color={color} />
        <View style={styles.changeContainer}>
          <Ionicons 
            name={change > 0 ? "trending-up" : "trending-down"} 
            size={16} 
            color={change > 0 ? "#10B981" : "#EF4444"} 
          />
          <Text style={[styles.changeText, { color: change > 0 ? "#10B981" : "#EF4444" }]}>
            {Math.abs(change)}%
          </Text>
        </View>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.exportButton}>
          <Ionicons name="download-outline" size={20} color="#1E40AF" />
          <Text style={styles.exportButtonText}>Exportar PDF</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <PeriodSelector />

        <View style={styles.statsGrid}>
          <StatCard
            title="Total Vuelos"
            value={stats.todayFlights}
            icon="airplane-outline"
            color="#1E40AF"
            change={5.2}
          />
          <StatCard
            title="Puntualidad"
            value={`${stats.onTimePercentage}%`}
            icon="checkmark-circle-outline"
            color="#10B981"
            change={2.1}
          />
          <StatCard
            title="Ocupación"
            value="76%"
            icon="people-outline"
            color="#F59E0B"
            change={-1.3}
          />
          <StatCard
            title="Cancelaciones"
            value={stats.cancelledFlights}
            icon="close-circle-outline"
            color="#EF4444"
            change={-0.8}
          />
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Vuelos por Día</Text>
          <LineChart
            data={flightData}
            width={screenWidth - 80}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Distribución de Retrasos</Text>
          <BarChart
            data={delayData}
            width={screenWidth - 80}
            height={220}
            chartConfig={chartConfig}
            style={styles.chart}
            yAxisLabel=""
            yAxisSuffix=""
            showValuesOnTopOfBars
          />
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Vuelos por Aerolínea</Text>
          <PieChart
            data={airlineData}
            width={screenWidth - 80}
            height={220}
            chartConfig={chartConfig}
            accessor="flights"
            backgroundColor="transparent"
            paddingLeft="15"
            style={styles.chart}
          />
        </View>

        <View style={styles.detailedStats}>
          <Text style={styles.sectionTitle}>Estadísticas Detalladas</Text>
          
          <View style={styles.detailCard}>
            <Text style={styles.detailTitle}>Performance por Hora</Text>
            <View style={styles.hourlyStats}>
              {Array.from({ length: 6 }, (_, i) => {
                const hour = (6 + i * 3).toString().padStart(2, '0');
                const flights = Math.floor(Math.random() * 15) + 5;
                return (
                  <View key={i} style={styles.hourlyStatItem}>
                    <Text style={styles.hourlyTime}>{hour}:00</Text>
                    <View style={styles.hourlyBar}>
                      <View style={[styles.hourlyBarFill, { width: `${(flights / 20) * 100}%` }]} />
                    </View>
                    <Text style={styles.hourlyValue}>{flights}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.detailCard}>
            <Text style={styles.detailTitle}>Top Rutas</Text>
            {[
              { route: 'AIFA - CUN', flights: 45, percentage: 13.2 },
              { route: 'AIFA - GDL', flights: 38, percentage: 11.1 },
              { route: 'AIFA - MTY', flights: 32, percentage: 9.4 },
              { route: 'AIFA - TIJ', flights: 28, percentage: 8.2 },
            ].map((item, index) => (
              <View key={index} style={styles.routeItem}>
                <View style={styles.routeInfo}>
                  <Text style={styles.routeText}>{item.route}</Text>
                  <Text style={styles.routeFlights}>{item.flights} vuelos</Text>
                </View>
                <Text style={styles.routePercentage}>{item.percentage}%</Text>
              </View>
            ))}
          </View>

          <View style={styles.detailCard}>
            <Text style={styles.detailTitle}>Indicadores Clave de Rendimiento</Text>
            <View style={styles.kpiContainer}>
              <View style={styles.kpiItem}>
                <Text style={styles.kpiLabel}>Tiempo Promedio de Retraso</Text>
                <Text style={styles.kpiValue}>12 min</Text>
                <Text style={styles.kpiChange}>-3% vs mes anterior</Text>
              </View>
              
              <View style={styles.kpiItem}>
                <Text style={styles.kpiLabel}>Slots Utilizados</Text>
                <Text style={styles.kpiValue}>87%</Text>
                <Text style={styles.kpiChange}>+5% vs mes anterior</Text>
              </View>
              
              <View style={styles.kpiItem}>
                <Text style={styles.kpiLabel}>Satisfacción Aerolíneas</Text>
                <Text style={styles.kpiValue}>4.2/5</Text>
                <Text style={styles.kpiChange}>+0.3 vs mes anterior</Text>
              </View>
            </View>
          </View>

          <View style={styles.detailCard}>
            <Text style={styles.detailTitle}>Alertas y Notificaciones</Text>
            <View style={styles.alertsList}>
              <View style={styles.alertItem}>
                <View style={[styles.alertIcon, { backgroundColor: '#F59E0B' }]}>
                  <Ionicons name="warning" size={16} color="#FFFFFF" />
                </View>
                <View style={styles.alertContent}>
                  <Text style={styles.alertTitle}>Retraso promedio aumentó 15%</Text>
                  <Text style={styles.alertDescription}>En las últimas 24 horas</Text>
                </View>
              </View>
              
              <View style={styles.alertItem}>
                <View style={[styles.alertIcon, { backgroundColor: '#10B981' }]}>
                  <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                </View>
                <View style={styles.alertContent}>
                  <Text style={styles.alertTitle}>Meta de puntualidad alcanzada</Text>
                  <Text style={styles.alertDescription}>{stats.onTimePercentage}% de vuelos a tiempo</Text>
                </View>
              </View>
              
              <View style={styles.alertItem}>
                <View style={[styles.alertIcon, { backgroundColor: '#EF4444' }]}>
                  <Ionicons name="alert-circle" size={16} color="#FFFFFF" />
                </View>
                <View style={styles.alertContent}>
                  <Text style={styles.alertTitle}>Capacidad próxima al límite</Text>
                  <Text style={styles.alertDescription}>Revisar disponibilidad para mañana</Text>
                </View>
              </View>
            </View>
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
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E40AF',
  },
  exportButtonText: {
    color: '#1E40AF',
    fontWeight: '500',
    marginLeft: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#1E40AF',
  },
  periodButtonText: {
    color: '#64748B',
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: '48%',
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
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
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
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  chart: {
    borderRadius: 8,
    alignSelf: 'center',
  },
  detailedStats: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  hourlyStats: {
    gap: 12,
  },
  hourlyStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hourlyTime: {
    width: 50,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  hourlyBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
  },
  hourlyBarFill: {
    height: '100%',
    backgroundColor: '#1E40AF',
    borderRadius: 4,
  },
  hourlyValue: {
    width: 30,
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
    textAlign: 'right',
  },
  routeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  routeInfo: {},
  routeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  routeFlights: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  routePercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  kpiContainer: {
    gap: 16,
  },
  kpiItem: {
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  kpiLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  kpiChange: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  alertsList: {
    gap: 12,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  alertIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  alertDescription: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
});