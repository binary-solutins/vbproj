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
} from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import Feather from 'react-native-vector-icons/Feather';

const { width, height } = Dimensions.get('window');

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

export default function Analytics() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [loading, setLoading] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('patients');

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const backgroundAnim = useRef(new Animated.Value(0)).current;
  const cardAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0)
  ]).current;

  // Enhanced sample data
  const analyticsData = {
    patients: {
      total: 1248,
      thisMonth: 156,
      growth: 12.5,
      chartData: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          data: [45, 67, 89, 123, 145, 156],
          color: () => '#E91E63',
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
          color: () => '#2196F3',
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
          color: () => '#4CAF50',
          strokeWidth: 3
        }]
      }
    }
  };

  const departmentData = [
    { name: 'Oncology', population: 28, color: '#E91E63', legendFontColor: '#333', legendFontSize: responsiveSize.chartSubtitle - 2 },
    { name: 'Radiology', population: 24, color: '#2196F3', legendFontColor: '#333', legendFontSize: responsiveSize.chartSubtitle - 2 },
    { name: 'Pathology', population: 20, color: '#4CAF50', legendFontColor: '#333', legendFontSize: responsiveSize.chartSubtitle - 2 },
    { name: 'Surgery', population: 16, color: '#FF9800', legendFontColor: '#333', legendFontSize: responsiveSize.chartSubtitle - 2 },
    { name: 'Others', population: 12, color: '#9C27B0', legendFontColor: '#333', legendFontSize: responsiveSize.chartSubtitle - 2 },
  ];

  const weeklyData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      data: [45, 67, 89, 78, 92, 56, 34],
      color: () => '#E91E63',
    }]
  };

  useEffect(() => {
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
  }, []);

  const backgroundInterpolate = backgroundAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#fce4ec', '#f8f9fa']
  });

  const StatCard = ({ title, value, subtitle, growth, icon, color, onPress, isSelected, index }) => (
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
            <Text style={styles.growthText}>{Math.abs(growth)}%</Text>
          </View>
        </View>
        <Text style={styles.statValue}>{value.toLocaleString()}</Text>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statSubtitle}>{subtitle}</Text>
      </TouchableOpacity>
    </Animated.View>
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
              value={analyticsData.patients.total}
              subtitle={`+${analyticsData.patients.thisMonth} this ${selectedPeriod}`}
              growth={analyticsData.patients.growth}
              icon="users"
              color="#E91E63"
              isSelected={selectedMetric === 'patients'}
              onPress={() => setSelectedMetric('patients')}
              index={0}
            />
            <StatCard
              title="Medical Professionals"
              value={analyticsData.doctors.total}
              subtitle={`+${analyticsData.doctors.thisMonth} this ${selectedPeriod}`}
              growth={analyticsData.doctors.growth}
              icon="user-plus"
              color="#2196F3"
              isSelected={selectedMetric === 'doctors'}
              onPress={() => setSelectedMetric('doctors')}
              index={1}
            />
            <StatCard
              title="Analysis Reports"
              value={analyticsData.reports.total}
              subtitle={`+${analyticsData.reports.thisMonth} this ${selectedPeriod}`}
              growth={analyticsData.reports.growth}
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
              <Text style={styles.chartSubtitle}>6-month performance overview</Text>
            </View>
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#E91E63" />
                <Text style={styles.loadingText}>Loading analytics...</Text>
              </View>
            ) : (
              <LineChart
                data={currentData.chartData}
                width={responsiveSize.chartWidth}
                height={responsiveSize.chartHeight}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => currentData.chartData.datasets[0].color(),
                  labelColor: (opacity = 1) => '#666666',
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: isSmallScreen ? '4' : '6',
                    strokeWidth: '2',
                    stroke: currentData.chartData.datasets[0].color()
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
              <Text style={styles.chartTitle}>Department Analysis</Text>
              <Text style={styles.chartSubtitle}>Patient distribution across medical departments</Text>
            </View>
            
            <PieChart
              data={departmentData}
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
              <Text style={styles.chartSubtitle}>Daily patient consultations this week</Text>
            </View>
            
            <BarChart
              data={weeklyData}
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
                <Text style={[styles.quickStatValue, { color: '#E91E63' }]}>96.8%</Text>
                <Text style={styles.quickStatLabel}>Detection Accuracy</Text>
              </View>
              <View style={[styles.quickStat, { backgroundColor: '#2196F308' }]}>
                <Text style={[styles.quickStatValue, { color: '#2196F3' }]}>94.2%</Text>
                <Text style={styles.quickStatLabel}>Patient Satisfaction</Text>
              </View>
              <View style={[styles.quickStat, { backgroundColor: '#4CAF5008' }]}>
                <Text style={[styles.quickStatValue, { color: '#4CAF50' }]}>8.5 min</Text>
                <Text style={styles.quickStatLabel}>Avg. Analysis Time</Text>
              </View>
              <View style={[styles.quickStat, { backgroundColor: '#FF980008' }]}>
                <Text style={[styles.quickStatValue, { color: '#FF9800' }]}>99.1%</Text>
                <Text style={styles.quickStatLabel}>System Reliability</Text>
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
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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