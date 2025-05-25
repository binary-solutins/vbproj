import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
  Animated,
  Dimensions,
  Easing,
  StatusBar,
  KeyboardAvoidingView,
  Keyboard,
  SafeAreaView,
  Image,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient'; 
import Feather from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../api/axios';

const { width, height } = Dimensions.get('window');
const HEADER_HEIGHT = 110;
const CARD_MARGIN = 10;
const CARD_WIDTH = width - (CARD_MARGIN * 4);

export default function DoctorList() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const searchWidth = useRef(new Animated.Value(width - 32)).current;
  const fabAnim = useRef(new Animated.Value(1)).current;
  const loadingAnim = useRef(new Animated.Value(0)).current;
  const loadingRotation = useRef(new Animated.Value(0)).current;
  const listItemAnim = useRef({}).current;
  
  // References
  const listRef = useRef(null);
  
  useEffect(() => {
    loadDoctors();
    StatusBar.setBarStyle('dark-content');
    
    startLoadingAnimation();
    
    return () => {
      StatusBar.setBarStyle('default');
    };
  }, []);
  
  useEffect(() => {
    filterDoctors();
  }, [searchQuery, doctors, activeFilter]);
  
  const startLoadingAnimation = () => {
    Animated.loop(
      Animated.timing(loadingRotation, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
    
    Animated.sequence([
      Animated.timing(loadingAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.delay(1000)
    ]).start();
  };
  
  const filterDoctors = () => {
    let filtered = [...doctors];
    
    // Filter by search
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(
        doctor => 
          doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doctor.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doctor.designation.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredDoctors(filtered);
  };
  
  const loadDoctors = async () => {
    try {
      setLoading(true);
      const userData = JSON.parse(await AsyncStorage.getItem('userData') || '{}');
      
      if (!userData.id) {
        setDoctors([]);
        setLoading(false);
        return;
      }
      
      const response = await authAPI.get(`/doctors/hospital/${userData.id}`);
      const doctorData = response?.data || [];
      
      // Initialize animation values for each doctor
      doctorData.forEach((doctor, index) => {
        listItemAnim[doctor.id] = new Animated.Value(0);
        
        // Staggered animation for list items
        Animated.timing(listItemAnim[doctor.id], {
          toValue: 1,
          duration: 400,
          delay: index * 50,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }).start();
      });
      
      setDoctors(doctorData);
      setFilteredDoctors(doctorData);
    } catch (error) {
      console.error('Error loading doctors:', error);
      Alert.alert('Error', 'Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDoctors();
    setRefreshing(false);
  };
  
  const handleDelete = (doctorId) => {
    Alert.alert(
      'Delete Doctor',
      'Are you sure you want to delete this doctor?',
      [
        { 
          text: 'Cancel', 
          style: 'cancel' 
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Start the delete animation
              Animated.sequence([
                Animated.timing(listItemAnim[doctorId], {
                  toValue: 0,
                  duration: 300,
                  useNativeDriver: true,
                }),
                Animated.timing(fabAnim, {
                  toValue: 0.8,
                  duration: 100,
                  useNativeDriver: true,
                }),
                Animated.timing(fabAnim, {
                  toValue: 1,
                  duration: 200,
                  useNativeDriver: true,
                })
              ]).start();
              
              await authAPI.delete(`/doctors/${doctorId}`);
              
              const updatedDoctors = doctors.filter(d => d.id !== doctorId);
              setDoctors(updatedDoctors);
              setFilteredDoctors(updatedDoctors);
              
              // Show success notification
              Alert.alert('Success', 'Doctor deleted successfully');
            } catch (error) {
              console.error('Error deleting doctor:', error);
              Alert.alert('Error', 'Failed to delete doctor');
            }
          },
        },
      ]
    );
  };
  
  const handleSearchFocus = (focused) => {
    setSearchFocused(focused);
    
    Animated.timing(searchWidth, {
      toValue: focused ? width - 80 : width - 32,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };
  
  const handleAddPress = () => {
    // Animate FAB press
    Animated.sequence([
      Animated.timing(fabAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fabAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      navigation.navigate('AddDoctor');
    });
  };
  
  const clearSearch = () => {
    setSearchQuery('');
  };
  
  const handleEditDoctor = (doctorId) => {
    navigation.navigate('EditDoctor', { doctorId });
  };
  
  // Animation interpolations
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [HEADER_HEIGHT, 80],
    extrapolate: 'clamp',
  });
  
  const titleScale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.85],
    extrapolate: 'clamp',
  });
  
  const titleTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -5],
    extrapolate: 'clamp',
  });
  
  const subtitleOpacity = scrollY.interpolate({
    inputRange: [0, 50, 100],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });
  
  const rotateInterpolation = loadingRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  
  // Render functions
  const renderDoctorCard = ({ item, index }) => {
    // Generate gradient colors based on specialization
    const specializationHash = item.specialization.split('').reduce(
      (sum, char) => sum + char.charCodeAt(0), 0
    );
    
    // Different gradient based on specialization type
    const startColor = specializationHash % 3 === 0 
      ? '#6366F1' // Indigo
      : specializationHash % 3 === 1
        ? '#db2777' // Pink
        : '#0891b2'; // Cyan
        
    const endColor = specializationHash % 3 === 0
      ? '#818CF8' // Light Indigo
      : specializationHash % 3 === 1
        ? '#ec4899' // Light Pink
        : '#06b6d4'; // Light Cyan
    
    // Animation value for this specific item
    const itemAnimation = listItemAnim[item.id] || new Animated.Value(1);
    
    // Get doctor initials
    const nameParts = item.name.split(' ');
    const initials = (nameParts[0]?.charAt(0) || '') + (nameParts[1]?.charAt(0) || '');
    
    return (
      <Animated.View
        style={[
          styles.doctorCardContainer,
          {
            opacity: itemAnimation,
            transform: [
              { 
                scale: itemAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1]
                })
              },
              {
                translateY: itemAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0]
                })
              }
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.doctorCard}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[startColor, endColor]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cardBorderLeft}
          />
          
          <View style={styles.cardLeft}>
            <View
              style={[
                styles.initialCircle,
                { backgroundColor: `${startColor}15` }
              ]}
            >
              <Text style={[styles.initialText, { color: startColor }]}>
                {initials}
              </Text>
            </View>
          </View>
          
          <View style={styles.cardMiddle}>
            <Text style={styles.doctorName}>{item.name}</Text>
            <Text style={styles.doctorSpecialization}>{item.specialization}</Text>
            <View style={styles.doctorDetails}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Designation:</Text>
                <Text style={styles.detailValue}>{item.designation || 'N/A'}</Text>
              </View>
              {item.experience && (
                <>
                  <View style={styles.detailDivider} />
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Experience:</Text>
                    <Text style={styles.detailValue}>{item.experience} years</Text>
                  </View>
                </>
              )}
            </View>
          </View>
          
          <View style={styles.cardRight}>
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.editButton]}
                onPress={() => handleEditDoctor(item.id)}
              >
                <Feather name="edit-2" size={16} color="#6366F1" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDelete(item.id)}
              >
                <Feather name="trash-2" size={16} color="#db2777" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };
  
  const renderEmptyList = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Animated.View style={{
          opacity: loadingAnim,
          transform: [{ scale: loadingAnim }]
        }}>
          <Feather name="users" size={60} color="#E2E8F0" />
        </Animated.View>
        <Text style={styles.emptyTitle}>
          {searchQuery ? "No matching doctors" : "No doctors yet"}
        </Text>
        <Text style={styles.emptyDescription}>
          {searchQuery 
            ? "Try adjusting your search criteria"
            : "Add your first doctor to get started"
          }
        </Text>
        {!searchQuery && (
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => navigation.navigate('AddDoctor')}
          >
            <LinearGradient
              colors={['#db2777', '#ec4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.emptyButtonGradient}
            >
              <Feather name="user-plus" size={18} color="#FFFFFF" />
              <Text style={styles.emptyButtonText}>Add New Doctor</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    );
  };
  
  // Loading view
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Animated.View 
            style={{
              transform: [{ rotate: rotateInterpolation }]
            }}
          >
            <ActivityIndicator size="large" color="#db2777" />
          </Animated.View>
          <Text style={styles.loadingText}>Loading doctors...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : null}
        style={styles.container}
      >
        {/* Header section */}
        <Animated.View style={[
          styles.headerContainer,
          {
            height: headerHeight,
          }
        ]}>
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
             
              <Animated.Text 
                style={[
                  styles.headerTitle,
                  {
                    transform: [
                      { scale: titleScale },
                      { translateY: titleTranslateY }
                    ]
                  }
                ]}
              >
                Doctors
              </Animated.Text>
            </View>
            
            <Animated.Text 
              style={[
                styles.headerSubtitle,
                { opacity: subtitleOpacity }
              ]}
            >
              {doctors.length} {doctors.length === 1 ? 'Doctor' : 'Doctors'} Registered
            </Animated.Text>
          </View>
        </Animated.View>
        
        {/* Search section */}
        <View style={styles.searchContainer}>
          <Animated.View style={[
            styles.searchInputContainer,
            { width: searchWidth }
          ]}>
            <Feather name="search" size={18} color="#94A3B8" style={{ marginRight: 10 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search doctors..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => handleSearchFocus(true)}
              onBlur={() => handleSearchFocus(false)}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                <Feather name="x" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </Animated.View>
          
          {searchFocused && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                Keyboard.dismiss();
                handleSearchFocus(false);
                clearSearch();
              }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Doctor list */}
        <FlatList
          ref={listRef}
          data={filteredDoctors}
          renderItem={renderDoctorCard}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={renderEmptyList}
        />
        
        {/* Add doctor FAB */}
        <Animated.View 
          style={[
            styles.fabContainer,
            {
              transform: [
                { scale: fabAnim },
              ]
            }
          ]}
        >
          <TouchableOpacity
            style={styles.fab}
            onPress={handleAddPress}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#db2777', '#ec4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.fabGradient}
            >
              <Feather name="user-plus" size={22} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    width: '100%',
    backgroundColor: '#FF4A93',
    paddingTop: Platform.OS === 'ios' ? 0 : 10,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#db2777',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerSubtitle: {
    fontSize: 15,
    fontFamily: 'Poppins-Regular',
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#db2777',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(219, 39, 119, 0.1)',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    fontFamily: 'Poppins-Regular',
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
  cancelButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  cancelText: {
    color: '#db2777',
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  doctorCardContainer: {
    marginBottom: 14,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    shadowColor: '#db2777',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 74, 147, 0.08)',
    overflow: 'hidden',
  },
  cardBorderLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  doctorCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 18,
  },
  cardLeft: {
    marginRight: 16,
  },
  initialCircle: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 74, 147, 0.12)',
  },
  initialText: {
    color: '#FF4A93',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    fontWeight: '600',
  },
  cardMiddle: {
    flex: 1,
    justifyContent: 'center',
  },
  doctorName: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  doctorSpecialization: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#64748B',
    marginBottom: 6,
  },
  doctorDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
    marginRight: 4,
  },
  detailValue: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    fontWeight: '500',
    color: '#374151',
  },
  detailDivider: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 8,
  },
  cardRight: {
    justifyContent: 'center',
    marginLeft: 10,
  },
  actionButtons: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
    borderWidth: 1,
  },
  editButton: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  deleteButton: {
    backgroundColor: 'rgba(219, 39, 119, 0.1)',
    borderColor: 'rgba(219, 39, 119, 0.2)',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 20,
    marginBottom: 6,
  },
  emptyDescription: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    overflow: 'hidden',
    borderRadius: 16,
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
  },
  emptyButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    fontWeight: '500',
    color: '#FFFFFF',
    marginLeft: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: '#db2777',
    marginTop: 16,
  },
  fabContainer: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    shadowColor: '#db2777',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fab: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});