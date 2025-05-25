import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  StatusBar,
  Alert,
  Dimensions,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  Linking
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../api/axios';
import RecentActivity from '../components/common/RecentActivity';


const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState(null);
  const navigation = useNavigation();

  // Load user data from AsyncStorage and fetch patients/doctors count
  useEffect(() => {
    const loadData = async () => {
      try {
        // Get user data
        const userDataString = await AsyncStorage.getItem('userData');
        if (userDataString) {
          const parsedUserData = JSON.parse(userDataString);
          setUserData(parsedUserData);
          
          if (!parsedUserData || !parsedUserData.id) {
            console.error('Invalid user data');
            return;
          }
          
          // Fetch doctors and patients data
          try {
            const doctorsResponse = await authAPI.get(`/doctors/hospital/${parsedUserData.id}`);
            setDoctors(doctorsResponse?.data || []);
            
            const patientsResponse = await authAPI.get(`/patients/hospital/${parsedUserData.id}`);
            setPatients(patientsResponse?.data || []);
            
            // Fetch recent reports
            fetchReports(parsedUserData.id);
          } catch (apiError) {
            console.error('API Error:', apiError);
            Alert.alert('Error', 'Failed to load doctors and patients data');
          }
        } else {
          const tokenString = await AsyncStorage.getItem('authToken');
          if (tokenString) {
            // API call would go here if needed
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const fetchReports = async (hospitalId) => {
    if (!hospitalId) return;
    
    setReportsLoading(true);
    setReportsError(null);
    
    try {
      const response = await authAPI.get(`/reports/hospital/${hospitalId}?page=1&pageSize=5`);
      if (response && response.data && response.data.reports) {
        setReports(response.data.reports);
      } else {
        setReports([]);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      setReportsError('Failed to load reports');
    } finally {
      setReportsLoading(false);
    }
  };

  const handleViewAllReports = () => {
    if (userData && userData.id) {
      // Retry loading reports or navigate to reports page
      fetchReports(userData.id);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#db2777" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              await authAPI.logout();
              // Clear token and navigate to login
              await AsyncStorage.removeItem('userToken');
              await AsyncStorage.removeItem('userData');
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout properly');
            }
          }
        }
      ]
    );
  };

  // Get hospital name or use a default
  const hospitalName = userData?.name || 'Hospital';
  // Handle long hospital names gracefully
  const displayName = hospitalName.length > 20
    ? hospitalName.substring(0, 18) + '...'
    : hospitalName;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#db2777" />

        {/* Improved Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>Welcome,</Text>
              <Text style={styles.hospitalName} numberOfLines={1}>{displayName}</Text>
            </View>

            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => navigation.navigate('EditHospital')}
            >
              <View style={styles.profileImageContainer}>
                {userData?.imageUrl ? (
                  <Image
                    source={{ uri: userData.imageUrl }}
                    style={styles.profileImage}
                  />
                ) : (
                  <Text style={styles.profileInitial}>
                    {hospitalName ? hospitalName.charAt(0).toUpperCase() : "H"}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Banner Card */}
          <View style={styles.bannerCard}>
            <View style={styles.bannerContent}>
              <View style={styles.bannerTextContainer}>
                <Text style={styles.bannerTitle}>D3S Healthcare</Text>
                <Text style={styles.bannerSubtitle}>
                  Beating breast cancer, one survivor at a time.
                </Text>
                <TouchableOpacity
                  style={styles.bannerButton}
                  onPress={() => Linking.openURL('https://www.d3shealthcare.com/breastcancer')}
                >
                  <Text style={styles.bannerButtonText}>Learn More</Text>
                </TouchableOpacity>

              </View>
              <Image
                source={require('../assets/heros.png')}
                style={styles.bannerImage}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Statistics Cards - Updated to show dynamic counts */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={[styles.statIconBg, { backgroundColor: '#e6f7ff' }]}>
                <Icon name="users" size={20} color="#0891b2" />
              </View>
              <View style={styles.statTextContainer}>
                <Text style={styles.statValue}>{patients.length}</Text>
                <Text style={styles.statLabel}>Patients</Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconBg, { backgroundColor: '#fef3c7' }]}>
                <Icon name="user-check" size={20} color="#d97706" />
              </View>
              <View style={styles.statTextContainer}>
                <Text style={styles.statValue}>{doctors.length}</Text>
                <Text style={styles.statLabel}>Examiners</Text>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>

            <View style={styles.menuContainer}>
              {/* Patients List */}
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('PatientList')}
              >
                <View style={styles.menuItemLeft}>
                  <View style={[styles.menuIcon, { backgroundColor: '#e6f7ff' }]}>
                    <Icon name="users" size={20} color="#0891b2" />
                  </View>
                  <View style={styles.menuTextContainer}>
                    <Text style={styles.menuItemTitle}>Patients</Text>
                    <Text style={styles.menuItemSubtitle}>
                      View all patient records and information
                    </Text>
                  </View>
                </View>
                <Icon name="chevron-right" size={20} color="#9ca3af" />
              </TouchableOpacity>

              {/* Screening Page */}
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('BreastScreeningScreen')}
              >
                <View style={styles.menuItemLeft}>
                  <View style={[styles.menuIcon, { backgroundColor: '#fff2f6' }]}>
                    <Image
                      source={require('../assets/clipboard-heart.png')}
                      style={styles.menuIconImage}
                    />
                  </View>
                  <View style={styles.menuTextContainer}>
                    <Text style={styles.menuItemTitle}>Screening Page</Text>
                    <Text style={styles.menuItemSubtitle}>
                      Manage and conduct breast cancer screenings
                    </Text>
                  </View>
                </View>
                <Icon name="chevron-right" size={20} color="#9ca3af" />
              </TouchableOpacity>

              {/* Hospital Details */}
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('EditHospital')}
              >
                <View style={styles.menuItemLeft}>
                  <View style={[styles.menuIcon, { backgroundColor: '#e6fffa' }]}>
                    <Image
                      source={require('../assets/hospital.png')}
                      style={styles.menuIconImage}
                    />
                  </View>
                  <View style={styles.menuTextContainer}>
                    <Text style={styles.menuItemTitle}>Hospital Details</Text>
                    <Text style={styles.menuItemSubtitle}>
                      View and edit your hospital information
                    </Text>
                  </View>
                </View>
                <Icon name="chevron-right" size={20} color="#9ca3af" />
              </TouchableOpacity>

              {/* Examiner's Details */}
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('DoctorList')}
              >
                <View style={styles.menuItemLeft}>
                  <View style={[styles.menuIcon, { backgroundColor: '#fffde7' }]}>
                    <Image
                      source={require('../assets/doctor.png')}
                      style={styles.menuIconImage}
                    />
                  </View>
                  <View style={styles.menuTextContainer}>
                    <Text style={styles.menuItemTitle}>Examiner's Details</Text>
                    <Text style={styles.menuItemSubtitle}>
                      Manage your hospital's examiners
                    </Text>
                  </View>
                </View>
                <Icon name="chevron-right" size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Recent Activity Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <TouchableOpacity onPress={handleViewAllReports}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            <RecentActivity 
              reports={reports}
              loading={reportsLoading}
              error={reportsError}
              onViewAll={handleViewAllReports}
            />
          </View>

          {/* Space for Bottom Navigation */}
          <View style={styles.footerSpace} />
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={styles.bottomNavigation}>
          <TouchableOpacity style={styles.navItem}>
            <Icon name="home" size={24} color="#db2777" />
            <Text style={[styles.navText, styles.activeNavText]}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate('PatientList')}
          >
            <Icon name="users" size={24} color="#9ca3af" />
            <Text style={styles.navText}>Patients</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate('AddDoctor')}
          >
            <View style={styles.fabContainer}>
              <Icon name="plus" size={24} color="#fff" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate('Analytics')}
          >
            <Icon name="clipboard" size={24} color="#9ca3af" />
            <Text style={styles.navText}>Analytics</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={handleLogout}
          >
            <Icon name="log-out" size={24} color="#9ca3af" />
            <Text style={styles.navText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    fontFamily: 'Poppins-Medium',
    color: '#db2777',
    marginTop: 12,
  },
  // Improved header styling for better responsiveness
  header: {
    backgroundColor: '#db2777',
    margin: width * 0.015, // Responsive margin based on screen width
    padding: width * 0.05, // Responsive padding
    borderRadius: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    zIndex: 999,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeContainer: {
    flex: 1,
    paddingRight: 10,
  },
  welcomeText: {
    fontFamily: 'Poppins-Regular',
    fontSize: Math.max(12, width * 0.035), // Responsive font size with minimum
    color: 'rgba(255, 255, 255, 0.9)',
  },
  hospitalName: {
    fontFamily: 'Poppins-Bold', // Using bold for better emphasis
    fontSize: Math.max(16, width * 0.045), // Responsive font size with minimum
    color: '#fff',
    marginTop: 3,
    fontWeight: '700',
  },
  profileButton: {
    padding: 2,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  profileImageContainer: {
    width: Math.max(40, width * 0.1), // Responsive size with minimum
    height: Math.max(40, width * 0.1), // Responsive size with minimum
    borderRadius: Math.max(20, width * 0.05), // Half of the width/height
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: Math.max(20, width * 0.05), // Half of the width/height
  },
  profileInitial: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: Math.max(16, width * 0.04), // Responsive font size with minimum
    color: '#fff',
  },
  scrollView: {
    flex: 1,
    marginTop: -20,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  bannerCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    marginTop: 30,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  bannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  bannerTextContainer: {
    flex: 1,
    paddingRight: 10,
  },
  bannerTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#db2777',
    marginBottom: 5,
  },
  bannerSubtitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: '#1f2937',
    lineHeight: 26,
    marginBottom: 15,
  },
  bannerButton: {
    backgroundColor: '#db2777',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 50,
    alignSelf: 'flex-start',
  },
  bannerButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#fff',
  },
  bannerImage: {
    width: 100,
    height: 120,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#4b5563',
    marginLeft: 10,
    paddingVertical: 0,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 12,
    width: (width - 60) / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  statIconBg: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  statIconImage: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  statTextContainer: {
    flex: 1,
  },
  statValue: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#1f2937',
  },
  statLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: '#6b7280',
  },
  sectionContainer: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#1f2937',
  },
  viewAllText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#db2777',
  },
  menuContainer: {
    marginTop: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuIconImage: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
  },
  menuTextContainer: {
    flex: 1,
  },
  menuItemTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#1f2937',
  },
  menuItemSubtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
  },
  footerSpace: {
    height: 75,
  },
  bottomNavigation: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 10,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 5,
  },
  navText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  activeNavText: {
    color: '#db2777',
  },
  fabContainer: {
    backgroundColor: '#db2777',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#db2777',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
});