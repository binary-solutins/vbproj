import AsyncStorage from '@react-native-async-storage/async-storage';
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
  Platform,
  Alert,
} from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import Feather from 'react-native-vector-icons/Feather';

const { width, height } = Dimensions.get('window');



const API_BASE_URL = 'https://d3s-backend-hwbxccckgcdbdgfr.centralindia-01.azurewebsites.net/api';
const HOSPITAL_ID = 5; 

// Responsive dimensions
const isTablet = width >= 768;
const isSmallScreen = width < 380;

const responsiveSize = {
  // Font sizes
  headerTitle: isTablet ? 34 : isSmallScreen ? 26 : 30,
  headerSubtitle: isTablet ? 18 : isSmallScreen ? 14 : 16,
  chartTitle: isTablet ? 20 : isSmallScreen ? 16 : 18,
  chartSubtitle: isTablet ? 16 : isSmallScreen ? 12 : 14,
  statValue: isTablet ? 36 : isSmallScreen ? 28 : 32,
  statTitle: isTablet ? 18 : isSmallScreen ? 14 : 16,
  quickStatValue: isTablet ? 28 : isSmallScreen ? 20 : 24,
  
  // Spacing
  containerPadding: isTablet ? 30 : isSmallScreen ? 15 : 20,
  cardPadding: isTablet ? 25 : isSmallScreen ? 15 : 20,
  marginBottom: isTablet ? 30 : isSmallScreen ? 15 : 20,
  
  // Chart dimensions
  chartWidth: width - (isTablet ? 80 : isSmallScreen ? 40 : 60),
  chartHeight: isTablet ? 260 : isSmallScreen ? 180 : 220,
};

// API Service
class DashboardAPI {
  static async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          // Add authorization header if needed
          // 'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  static async getDashboardData(hospitalId) {
    return this.request(`/analytics/${hospitalId}`);
  }

  static async getPatientTrends(hospitalId, period = 'monthly') {
    return this.request(`/analytics/${hospitalId}/patient-trends?period=${period}`);
  }

  static async getReportTrends(hospitalId, period = 'monthly') {
    return this.request(`/analytics/${hospitalId}/report-trends?period=${period}`);  
  }

  static async getDoctorAnalytics(hospitalId) {
    return this.request(`/analytics/${hospitalId}/doctor-analytics`);
  }

  static async getQuickStats(hospitalId) {
    return this.request(`/analytics/${hospitalId}/quick-stats`);
  }

  static async getRecentActivities(hospitalId, limit = 10) {
    return this.request(`/analytics/${hospitalId}/recent-activities?limit=${limit}`);
  }
}

export default function Analytics() {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('patients');
  const [dashboardData, setDashboardData] = useState(null);
  const [patientTrends, setPatientTrends] = useState(null);
  const [reportTrends, setReportTrends] = useState(null);
  const [doctorAnalytics, setDoctorAnalytics] = useState(null);
  const [quickStats, setQuickStats] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const backgroundAnim = useRef(new Animated.Value(0)).current;
  const cardAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0)
  ]).current;

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [
        dashboard,
        patientTrendsData,
        reportTrendsData,
        doctorData,
        quickStatsData,
        activitiesData
      ] = await Promise.all([
        DashboardAPI.getDashboardData(HOSPITAL_ID),
        DashboardAPI.getPatientTrends(HOSPITAL_ID, selectedPeriod),
        DashboardAPI.getReportTrends(HOSPITAL_ID, selectedPeriod),
        DashboardAPI.getDoctorAnalytics(HOSPITAL_ID),
        DashboardAPI.getQuickStats(HOSPITAL_ID),
        DashboardAPI.getRecentActivities(HOSPITAL_ID, 10)
      ]);

      setDashboardData(dashboard);
      setPatientTrends(patientTrendsData);
      setReportTrends(reportTrendsData);
      setDoctorAnalytics(doctorData);
      setQuickStats(quickStatsData);
      setRecentActivities(activitiesData.activities || []);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert(
        'Error',
        'Failed to load dashboard data. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh data when period changes
  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod]);

  // Initial animations
  useEffect(() => {
    if (!loading && dashboardData) {
      // Staggered animations for better UX
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(slideUpAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(backgroundAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: false,
        })
      ]).start();

      // Animate cards with delay
      cardAnimations.forEach((anim, index) => {
        Animated.timing(anim, {
          toValue: 1,
          duration: 800,
          delay: index * 200,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [loading, dashboardData]);

  // Handle period change with loading state
  const handlePeriodChange = async (period) => {
    setSelectedPeriod(period);
    setRefreshing(true);
  };

  // Format chart data for trends
  const formatTrendData = (trends, type = 'count') => {
    if (!trends || !trends.trends || !Array.isArray(trends.trends)) {
      return { labels: ['No Data'], datasets: [{ data: [0] }] };
    }
    
    const labels = trends.trends.map(item => {
      if (selectedPeriod === 'weekly') {
        return `W${item.period?.split('-')[1] || '1'}`;
      } else if (selectedPeriod === 'yearly') {
        return item.period || new Date().getFullYear().toString();
      } else {
        if (item.period && item.period.includes('-')) {
          const [year, month] = item.period.split('-');
          const dateObj = new Date(parseInt(year), parseInt(month) - 1);
          return dateObj.toLocaleDateString('en-US', { month: 'short' });
        }
        return 'Unknown';
      }
    });
    
    const data = trends.trends.map(item => {
      const value = item[type] || item.count || 0;
      const numValue = Number(value);
      return isNaN(numValue) ? 0 : numValue;
    });
    
    return {
      labels: labels.length > 0 ? labels : ['No Data'],
      datasets: [{
        data: data.length > 0 ? data : [0],
        color: () => getMetricColor(selectedMetric),
        strokeWidth: 3
      }]
    };
  };

  // Get metric color
  const getMetricColor = (metric) => {
    const colors = {
      patients: '#E91E63',
      doctors: '#2196F3',
      reports: '#4CAF50'
    };
    return colors[metric] || '#E91E63';
  };

  // Format doctor specialization data for pie chart
  const formatDoctorSpecializationData = () => {
    if (!doctorAnalytics || !doctorAnalytics.specializationBreakdown) return [];
    
    const colors = ['#E91E63', '#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#607D8B'];
    
    return doctorAnalytics.specializationBreakdown.map((item, index) => ({
      name: item.specialization,
      population: item.count,
      color: colors[index % colors.length],
      legendFontColor: '#333',
      legendFontSize: responsiveSize.chartSubtitle - 2
    }));
  };

  // Format report type data for weekly chart (mock data for now)
  const formatWeeklyReportData = () => {
    if (!reportTrends || !reportTrends.trends) {
      return {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{ data: [0, 0, 0, 0, 0, 0, 0], color: () => '#E91E63' }]
      };
    }
    
    // For demo purposes, create weekly data from monthly data
    const weekData = [45, 67, 89, 78, 92, 56, 34]; // Mock weekly data
    
    return {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{ data: weekData, color: () => '#E91E63' }]
    };
  };

  const backgroundInterpolate = backgroundAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#fce4ec', '#f8f9fa']
  });

  const StatCard = ({ title, value, subtitle, growth, icon, color, onPress, isSelected, index }) => {
    // Helper function to safely format numbers
    const formatNumber = (num) => {
      // Ensure the value is a valid number
      const numValue = Number(num);
      if (isNaN(numValue)) return '0';
      
      // Use a simple approach for number formatting to avoid locale issues
      if (numValue >= 1000000) {
        return (numValue / 1000000).toFixed(1) + 'M';
      } else if (numValue >= 1000) {
        return (numValue / 1000).toFixed(1) + 'K';
      } else {
        return numValue.toString();
      }
    };
  
    // Helper function to safely format growth percentage
    const formatGrowth = (growthValue) => {
      const numGrowth = Number(growthValue);
      if (isNaN(numGrowth)) return '0.0';
      return Math.abs(numGrowth).toFixed(1);
    };
  
    return (
      <Animated.View
        style={[
          {
            opacity: cardAnimations[index],
            transform: [{
              translateY: cardAnimations[index].interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0]
              })
            }]
          }
        ]}
      >
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
            <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
              <Feather name={icon} size={isTablet ? 24 : 20} color={color} />
            </View>
            <View style={[styles.growthIndicator, growth >= 0 ? styles.positiveGrowth : styles.negativeGrowth]}>
              <Feather name={growth >= 0 ? 'trending-up' : 'trending-down'} size={isSmallScreen ? 10 : 12} color="#fff" />
              <Text style={styles.growthText}>{formatGrowth(growth)}%</Text>
            </View>
          </View>
          <Text style={styles.statValue}>{formatNumber(value)}</Text>
          <Text style={styles.statTitle}>{title}</Text>
          <Text style={styles.statSubtitle}>{subtitle}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };
  

  const PeriodSelector = () => (
    <View style={styles.periodSelector}>
      {['weekly', 'monthly', 'yearly'].map((period) => (
        <TouchableOpacity
          key={period}
          style={[
            styles.periodButton,
            selectedPeriod === period && styles.periodButtonActive
          ]}
          onPress={() => handlePeriodChange(period)}
          disabled={refreshing}
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

  // Show loading screen while fetching initial data
  if (loading && !dashboardData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, styles.loadingScreen]}>
          <ActivityIndicator size="large" color="#E91E63" />
          <Text style={styles.loadingScreenText}>Loading Dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Calculate growth rates from API data
  const calculateGrowth = (current, previous) => {
    const currentNum = Number(current);
    const previousNum = Number(previous);
    
    if (isNaN(currentNum) || isNaN(previousNum) || previousNum === 0) {
      return 0;
    }
    
    return ((currentNum - previousNum) / previousNum) * 100;
  };
  

  const currentTrendData = selectedMetric === 'patients' ? patientTrends :
                          selectedMetric === 'doctors' ? null : // Doctor trends not available in current API
                          reportTrends;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View 
        style={[
          styles.container, 
          { backgroundColor: backgroundInterpolate }
        ]}
      >
        <StatusBar 
          barStyle="dark-content" 
          backgroundColor="#f8f9fa" 
          translucent={Platform.OS === 'android'} 
        />
        
        {/* Enhanced Decorative Header */}
        <View style={styles.decorContainer}>
          <View style={styles.decorGradient} />
          {[...Array(8)].map((_, index) => (
            <View 
              key={index}
              style={[
                styles.decorItem, 
                {
                  top: `${20 + Math.random() * 60}%`,
                  left: `${10 + Math.random() * 80}%`,
                  backgroundColor: ['#E91E63', '#2196F3', '#4CAF50', '#FF9800'][index % 4] + '20',
                  width: 8 + Math.random() * 12,
                  height: 8 + Math.random() * 12,
                  borderRadius: (8 + Math.random() * 12) / 2,
                }
              ]} 
            />
          ))}
        </View>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
       
        >
          {/* Enhanced Header */}
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
            <Text style={styles.headerSubtitle}>Breast Cancer Detection Insights</Text>
            <View style={styles.headerDivider} />
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

          {/* Statistics Cards Grid */}
          <View style={styles.statsGrid}>
  <StatCard
    title="Patients Registered"
    value={dashboardData?.overview?.totalPatients || 0}
    subtitle={`+${dashboardData?.overview?.recentPatients || 0} this week`}
    growth={quickStats?.thisMonth?.patients ? 
      calculateGrowth(quickStats.thisMonth.patients, quickStats.thisWeek?.patients || 0) : 0}
    icon="users"
    color="#E91E63"
    isSelected={selectedMetric === 'patients'}
    onPress={() => setSelectedMetric('patients')}
    index={0}
  />
  <StatCard
    title="Medical Professionals"
    value={dashboardData?.overview?.totalDoctors || 0}
    subtitle={`+${doctorAnalytics?.recentDoctors || 0} this month`}
    growth={doctorAnalytics?.recentDoctors ? 
      calculateGrowth(doctorAnalytics.recentDoctors, 0) : 0}
    icon="user-plus"
    color="#2196F3"
    isSelected={selectedMetric === 'doctors'}
    onPress={() => setSelectedMetric('doctors')}
    index={1}
  />
  <StatCard
    title="Analysis Reports"
    value={dashboardData?.overview?.totalReports || 0}
    subtitle={`+${dashboardData?.overview?.recentReports || 0} this week`}
    growth={quickStats?.thisMonth?.reports ? 
      calculateGrowth(quickStats.thisMonth.reports, quickStats.thisWeek?.reports || 0) : 0}
    icon="file-text"
    color="#4CAF50"
    isSelected={selectedMetric === 'reports'}
    onPress={() => setSelectedMetric('reports')}
    index={2}
  />
</View>

          {/* Main Trend Chart */}
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
                {selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)} Growth Trend
              </Text>
              <Text style={styles.chartSubtitle}>
                {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} performance overview
              </Text>
            </View>
            
            {refreshing ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#E91E63" />
                <Text style={styles.loadingText}>Updating trends...</Text>
              </View>
            ) : (
              <LineChart
                data={formatTrendData(currentTrendData)}
                width={responsiveSize.chartWidth}
                height={responsiveSize.chartHeight}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => getMetricColor(selectedMetric),
                  labelColor: (opacity = 1) => '#666666',
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: isSmallScreen ? '4' : '6',
                    strokeWidth: '2',
                    stroke: getMetricColor(selectedMetric)
                  },
                  propsForBackgroundLines: {
                    strokeWidth: 1,
                    stroke: '#f5f5f5'
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
              <Text style={styles.chartTitle}>Doctor Specialization</Text>
              <Text style={styles.chartSubtitle}>Distribution across medical specializations</Text>
            </View>
            
            {formatDoctorSpecializationData().length > 0 ? (
              <PieChart
                data={formatDoctorSpecializationData()}
                width={responsiveSize.chartWidth}
                height={responsiveSize.chartHeight}
                chartConfig={{
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft={isSmallScreen ? "10" : "15"}
                absolute
                style={styles.chart}
              />
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No specialization data available</Text>
              </View>
            )}
          </Animated.View>

          {/* Weekly Activity Chart */}
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
              <Text style={styles.chartTitle}>Weekly Activity Pattern</Text>
              <Text style={styles.chartSubtitle}>Daily activity distribution</Text>
            </View>
            
            <BarChart
              data={formatWeeklyReportData()}
              width={responsiveSize.chartWidth}
              height={responsiveSize.chartHeight}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => '#E91E63',
                labelColor: (opacity = 1) => '#666666',
                barPercentage: 0.6,
                style: {
                  borderRadius: 16,
                },
              }}
              style={styles.chart}
            />
          </Animated.View>

          {/* Enhanced Quick Stats */}
          <Animated.View 
            style={[
              styles.quickStatsContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideUpAnim }]
              }
            ]}
          >
            <Text style={styles.quickStatsTitle}>Performance Metrics</Text>
            <View style={styles.quickStatsGrid}>
              <View style={[styles.quickStat, { backgroundColor: '#E91E6308' }]}>
                <Text style={[styles.quickStatValue, { color: '#E91E63' }]}>
                  {quickStats?.today?.patients || 0}
                </Text>
                <Text style={styles.quickStatLabel}>Patients Today</Text>
              </View>
              <View style={[styles.quickStat, { backgroundColor: '#2196F308' }]}>
                <Text style={[styles.quickStatValue, { color: '#2196F3' }]}>
                  {quickStats?.thisWeek?.patients || 0}
                </Text>
                <Text style={styles.quickStatLabel}>Patients This Week</Text>
              </View>
              <View style={[styles.quickStat, { backgroundColor: '#4CAF5008' }]}>
                <Text style={[styles.quickStatValue, { color: '#4CAF50' }]}>
                  {quickStats?.today?.reports || 0}
                </Text>
                <Text style={styles.quickStatLabel}>Reports Today</Text>
              </View>
              <View style={[styles.quickStat, { backgroundColor: '#FF980008' }]}>
                <Text style={[styles.quickStatValue, { color: '#FF9800' }]}>
                  {quickStats?.thisMonth?.reports || 0}
                </Text>
                <Text style={styles.quickStatLabel}>Reports This Month</Text>
              </View>
            </View>
          </Animated.View>

          {/* Recent Activities */}
          {recentActivities.length > 0 && (
            <Animated.View 
              style={[
                styles.activitiesContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideUpAnim }]
                }
              ]}
            >
              <Text style={styles.activitiesTitle}>Recent Activities</Text>
              {recentActivities.slice(0, 5).map((activity, index) => (
                <View key={index} style={styles.activityItem}>
                  <View style={[
                    styles.activityIcon,
                    { backgroundColor: activity.type === 'patient_registered' ? '#E91E6315' : '#4CAF5015' }
                  ]}>
                    <Feather 
                      name={activity.type === 'patient_registered' ? 'user-plus' : 'file-text'} 
                      size={16} 
                      color={activity.type === 'patient_registered' ? '#E91E63' : '#4CAF50'} 
                    />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityMessage}>{activity.message}</Text>
                    <Text style={styles.activityTime}>
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              ))}
            </Animated.View>
          )}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingScreen: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingScreenText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#666666',
  },
  decorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.18,
    overflow: 'hidden',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    zIndex: 0,
  },
  decorGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
    backgroundColor: '#E91E63',
    opacity: 0.1,
  },
  decorItem: {
    position: 'absolute',
    opacity: 0.4,
  },
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    paddingTop: height * 0.18 + 20,
    paddingHorizontal: responsiveSize.containerPadding,
    paddingBottom: 40,
  },
  header: {
    marginBottom: responsiveSize.marginBottom + 5,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: responsiveSize.headerTitle,
    fontFamily: 'Poppins-Bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: responsiveSize.headerSubtitle,
    fontFamily: 'Poppins-Regular',
    color: '#666666',
    textAlign: 'center',
    marginBottom: 16,
  },
  headerDivider: {
    width: 60,
    height: 4,
    backgroundColor: '#E91E63',
    borderRadius: 2,
  },
  sectionContainer: {
    marginBottom: responsiveSize.marginBottom,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 6,
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: isSmallScreen ? 10 : 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#E91E63',
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  periodButtonText: {
    fontSize: isSmallScreen ? 13 : 15,
    fontFamily: 'Poppins-Medium',
    color: '#666666',
  },
  periodButtonTextActive: {
    color: '#ffffff',
    fontFamily: 'Poppins-Bold',
  },
  statsGrid: {
    marginBottom: responsiveSize.marginBottom + 5,
    gap: responsiveSize.marginBottom - 5,
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: responsiveSize.cardPadding,
    borderLeftWidth: 5,
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 6,
  },
  statCardSelected: {
    backgroundColor: '#fef7f0',
    shadowOpacity: 0.15,
    elevation: 8,
    transform: [{ scale: 1.02 }],
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: isTablet ? 48 : isSmallScreen ? 36 : 42,
    height: isTablet ? 48 : isSmallScreen ? 36 : 42,
    borderRadius: isTablet ? 24 : isSmallScreen ? 18 : 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  growthIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: isSmallScreen ? 6 : 10,
    paddingVertical: isSmallScreen ? 4 : 6,
    borderRadius: 14,
    gap: 4,
  },
  positiveGrowth: {
    backgroundColor: '#4CAF50',
  },
  negativeGrowth: {
    backgroundColor: '#F44336',
  },
  growthText: {
    color: '#ffffff',
    fontSize: isSmallScreen ? 11 : 13,
    fontFamily: 'Poppins-Bold',
  },
  statValue: {
    fontSize: responsiveSize.statValue,
    fontFamily: 'Poppins-Bold',
    color: '#1a1a1a',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  statTitle: {
    fontSize: responsiveSize.statTitle,
    fontFamily: 'Poppins-Medium',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  statSubtitle: {
    fontSize: isSmallScreen ? 12 : 14,
    fontFamily: 'Poppins-Regular',
    color: '#666666',
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: responsiveSize.cardPadding,
    marginBottom: responsiveSize.marginBottom,
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 6,
  },
  chartHeader: {
    marginBottom: responsiveSize.marginBottom,
  },
  chartTitle: {
    fontSize: responsiveSize.chartTitle,
    fontFamily: 'Poppins-Bold',
    color: '#1a1a1a',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  chartSubtitle: {
    fontSize: responsiveSize.chartSubtitle,
    fontFamily: 'Poppins-Regular',
    color: '#666666',
  },
  chart: {
    borderRadius: 16,
  },
  loadingContainer: {
    height: responsiveSize.chartHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#666666',
  },
  quickStatsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: responsiveSize.cardPadding,
    marginBottom: responsiveSize.marginBottom,
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 6,
  },
  quickStatsTitle: {
    fontSize: responsiveSize.chartTitle,
    fontFamily: 'Poppins-Bold',
    color: '#1a1a1a',
    marginBottom: responsiveSize.marginBottom,
    textAlign: 'center',
  },
  quickStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: isSmallScreen ? 10 : 15,
  },
  quickStat: {
    flex: 1,
    minWidth: isSmallScreen ? '47%' : '45%',
    alignItems: 'center',
    padding: isSmallScreen ? 12 : 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  quickStatValue: {
    fontSize: responsiveSize.quickStatValue,
    fontFamily: 'Poppins-Bold',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  quickStatLabel: {
    fontSize: isSmallScreen ? 11 : 13,
    fontFamily: 'Poppins-Regular',
    color: '#666666',
    textAlign: 'center',
    lineHeight: isSmallScreen ? 16 : 18,
  },
});