import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import Feather from 'react-native-vector-icons/Feather';

const { width, height } = Dimensions.get('window');

export default function Analytics() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [loading, setLoading] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('patients');

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const backgroundAnim = useRef(new Animated.Value(0)).current;

  // Sample data - replace with real API data
  const analyticsData = {
    patients: {
      total: 1248,
      thisMonth: 156,
      growth: 12.5,
      chartData: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          data: [45, 67, 89, 123, 145, 156],
          color: () => '#ff4a93',
          strokeWidth: 3
        }]
      }
    },
    doctors: {
      total: 43,
      thisMonth: 5,
      growth: 8.3,
      chartData: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          data: [2, 3, 4, 6, 7, 5],
          color: () => '#4a90ff',
          strokeWidth: 3
        }]
      }
    },
    reports: {
      total: 2847,
      thisMonth: 342,
      growth: 15.7,
      chartData: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          data: [178, 234, 289, 298, 315, 342],
          color: () => '#50c878',
          strokeWidth: 3
        }]
      }
    }
  };

  const departmentData = [
    { name: 'Cardiology', population: 25, color: '#ff4a93', legendFontColor: '#333', legendFontSize: 12 },
    { name: 'Neurology', population: 20, color: '#4a90ff', legendFontColor: '#333', legendFontSize: 12 },
    { name: 'Oncology', population: 18, color: '#50c878', legendFontColor: '#333', legendFontSize: 12 },
    { name: 'Pediatrics', population: 15, color: '#ffa500', legendFontColor: '#333', legendFontSize: 12 },
    { name: 'Others', population: 22, color: '#9370db', legendFontColor: '#333', legendFontSize: 12 },
  ];

  const weeklyData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      data: [45, 67, 89, 78, 92, 56, 34],
      color: () => '#ff4a93',
    }]
  };

  useEffect(() => {
    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(backgroundAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: false,
      })
    ]).start();
  }, []);

  const backgroundInterpolate = backgroundAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#ffe6f0', '#fff0f5']
  });

  const StatCard = ({ title, value, subtitle, growth, icon, color, onPress, isSelected }) => (
    <TouchableOpacity
      style={[
        styles.statCard,
        isSelected && styles.statCardSelected,
        { borderLeftColor: color }
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.statCardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <Feather name={icon} size={20} color={color} />
        </View>
        <View style={[styles.growthIndicator, growth >= 0 ? styles.positiveGrowth : styles.negativeGrowth]}>
          <Feather name={growth >= 0 ? 'trending-up' : 'trending-down'} size={12} color="#fff" />
          <Text style={styles.growthText}>{Math.abs(growth)}%</Text>
        </View>
      </View>
      <Text style={styles.statValue}>{value.toLocaleString()}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statSubtitle}>{subtitle}</Text>
    </TouchableOpacity>
  );

  const PeriodSelector = () => (
    <View style={styles.periodSelector}>
      {['week', 'month', 'year'].map((period) => (
        <TouchableOpacity
          key={period}
          style={[
            styles.periodButton,
            selectedPeriod === period && styles.periodButtonActive
          ]}
          onPress={() => setSelectedPeriod(period)}
        >
          <Text style={[
            styles.periodButtonText,
            selectedPeriod === period && styles.periodButtonTextActive
          ]}>
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const currentData = analyticsData[selectedMetric];

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View 
        style={[
          styles.container, 
          { backgroundColor: backgroundInterpolate }
        ]}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#fff0f5" />
        
        {/* Decorative Header */}
        <View style={styles.decorContainer}>
          <View style={[styles.decorItem, styles.decorHeart]} />
          <View style={[styles.decorItem, styles.decorStar]} />
          <View style={[styles.decorItem, styles.decorCircle]} />
          <View style={[styles.decorItem, styles.decorSquare]} />
          <View style={[styles.decorItem, styles.decorTriangle]} />
          <View style={[styles.decorItem, styles.decorPlus]} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <Animated.View 
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideUpAnim }]
              }
            ]}
          >
            <Text style={styles.headerTitle}>Analytics Dashboard</Text>
            <Text style={styles.headerSubtitle}>Healthcare Insights & Metrics</Text>
          </Animated.View>

          {/* Period Selector */}
          <Animated.View 
            style={[
              styles.sectionContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideUpAnim }]
              }
            ]}
          >
            <PeriodSelector />
          </Animated.View>

          {/* Statistics Cards */}
          <Animated.View 
            style={[
              styles.statsGrid,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideUpAnim }]
              }
            ]}
          >
            <StatCard
              title="Patients Registered"
              value={analyticsData.patients.total}
              subtitle={`+${analyticsData.patients.thisMonth} this ${selectedPeriod}`}
              growth={analyticsData.patients.growth}
              icon="users"
              color="#ff4a93"
              isSelected={selectedMetric === 'patients'}
              onPress={() => setSelectedMetric('patients')}
            />
            <StatCard
              title="Doctors Registered"
              value={analyticsData.doctors.total}
              subtitle={`+${analyticsData.doctors.thisMonth} this ${selectedPeriod}`}
              growth={analyticsData.doctors.growth}
              icon="user-plus"
              color="#4a90ff"
              isSelected={selectedMetric === 'doctors'}
              onPress={() => setSelectedMetric('doctors')}
            />
            <StatCard
              title="Reports Generated"
              value={analyticsData.reports.total}
              subtitle={`+${analyticsData.reports.thisMonth} this ${selectedPeriod}`}
              growth={analyticsData.reports.growth}
              icon="file-text"
              color="#50c878"
              isSelected={selectedMetric === 'reports'}
              onPress={() => setSelectedMetric('reports')}
            />
          </Animated.View>

          {/* Main Chart */}
          <Animated.View 
            style={[
              styles.chartContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideUpAnim }]
              }
            ]}
          >
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>
                {selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)} Trend
              </Text>
              <Text style={styles.chartSubtitle}>Last 6 months overview</Text>
            </View>
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ff4a93" />
              </View>
            ) : (
              <LineChart
                data={currentData.chartData}
                width={width - 60}
                height={220}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => currentData.chartData.datasets[0].color(),
                  labelColor: (opacity = 1) => '#666',
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: '6',
                    strokeWidth: '2',
                    stroke: currentData.chartData.datasets[0].color()
                  },
                  propsForBackgroundLines: {
                    strokeWidth: 1,
                    stroke: '#f0f0f0'
                  }
                }}
                bezier
                style={styles.chart}
              />
            )}
          </Animated.View>

          {/* Department Distribution */}
          <Animated.View 
            style={[
              styles.chartContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideUpAnim }]
              }
            ]}
          >
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Department Distribution</Text>
              <Text style={styles.chartSubtitle}>Patient allocation by department</Text>
            </View>
            
            <PieChart
              data={departmentData}
              width={width - 60}
              height={220}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
              style={styles.chart}
            />
          </Animated.View>

          {/* Weekly Activity */}
          <Animated.View 
            style={[
              styles.chartContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideUpAnim }]
              }
            ]}
          >
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Weekly Activity</Text>
              <Text style={styles.chartSubtitle}>Daily patient visits this week</Text>
            </View>
            
            <BarChart
              data={weeklyData}
              width={width - 60}
              height={220}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => '#ff4a93',
                labelColor: (opacity = 1) => '#666',
                barPercentage: 0.7,
                style: {
                  borderRadius: 16,
                },
              }}
              style={styles.chart}
            />
          </Animated.View>

          {/* Quick Stats */}
          <Animated.View 
            style={[
              styles.quickStatsContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideUpAnim }]
              }
            ]}
          >
            <Text style={styles.quickStatsTitle}>Quick Statistics</Text>
            <View style={styles.quickStatsGrid}>
              <View style={styles.quickStat}>
                <Text style={styles.quickStatValue}>94.5%</Text>
                <Text style={styles.quickStatLabel}>Patient Satisfaction</Text>
              </View>
              <View style={styles.quickStat}>
                <Text style={styles.quickStatValue}>87.2%</Text>
                <Text style={styles.quickStatLabel}>Report Accuracy</Text>
              </View>
              <View style={styles.quickStat}>
                <Text style={styles.quickStatValue}>12 min</Text>
                <Text style={styles.quickStatLabel}>Avg. Wait Time</Text>
              </View>
              <View style={styles.quickStat}>
                <Text style={styles.quickStatValue}>98.1%</Text>
                <Text style={styles.quickStatLabel}>System Uptime</Text>
              </View>
            </View>
          </Animated.View>

        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff0f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff0f5',
  },
  decorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.15,
    overflow: 'hidden',
    backgroundColor: '#ffd1e6',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    zIndex: 0,
  },
  decorItem: {
    position: 'absolute',
    opacity: 0.3,
  },
  decorHeart: {
    width: 16,
    height: 16,
    backgroundColor: '#ff7eb9',
    borderRadius: 8,
    transform: [{ rotate: '45deg' }],
    top: '30%',
    left: '20%',
  },
  decorStar: {
    width: 12,
    height: 12,
    backgroundColor: '#ffbee0',
    borderRadius: 6,
    top: '20%',
    right: '30%',
  },
  decorCircle: {
    width: 18,
    height: 18,
    backgroundColor: '#ff80b3',
    borderRadius: 9,
    top: '50%',
    left: '70%',
  },
  decorSquare: {
    width: 10,
    height: 10,
    backgroundColor: '#ff9dcc',
    borderRadius: 2,
    top: '40%',
    right: '20%',
  },
  decorTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 14,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#ffb3d9',
    top: '60%',
    left: '40%',
  },
  decorPlus: {
    width: 14,
    height: 14,
    backgroundColor: '#ffcce6',
    borderRadius: 2,
    top: '25%',
    right: '50%',
  },
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    paddingTop: height * 0.15 + 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  header: {
    marginBottom: 25,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  sectionContainer: {
    marginBottom: 20,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 4,
    shadowColor: '#e05c97',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#ff4a93',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  periodButtonTextActive: {
    color: '#ffffff',
  },
  statsGrid: {
    marginBottom: 25,
    gap: 15,
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    shadowColor: '#e05c97',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statCardSelected: {
    backgroundColor: '#fffbfd',
    shadowOpacity: 0.15,
    elevation: 6,
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  growthIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  positiveGrowth: {
    backgroundColor: '#4caf50',
  },
  negativeGrowth: {
    backgroundColor: '#ff5a7f',
  },
  growthText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#e05c97',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  chartHeader: {
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  chart: {
    borderRadius: 16,
  },
  loadingContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickStatsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#e05c97',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quickStatsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  quickStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  quickStat: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fafbff',
    borderRadius: 12,
  },
  quickStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff4a93',
    marginBottom: 4,
  },
  quickStatLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});