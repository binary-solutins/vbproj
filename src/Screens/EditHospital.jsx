import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Dimensions,
  Animated,
  SafeAreaView,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { launchImageLibrary } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../api/axios';

const { width, height } = Dimensions.get('window');

export default function EditHospital() {
  const navigation = useNavigation();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hospitalData, setHospitalData] = useState(null);
  const [newImage, setNewImage] = useState(null);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showStateModal, setShowStateModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [inputFocused, setInputFocused] = useState(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const backgroundAnim = useRef(new Animated.Value(0)).current;

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
      }),
    ]).start();

    loadHospitalData();
    fetchCountries();
  }, []);

  useEffect(() => {
    if (selectedCountry?.id) {
      fetchStates(selectedCountry.id);
    } else {
      setStates([]);
      setSelectedState(null);
    }
  }, [selectedCountry]);

  useEffect(() => {
    if (selectedState?.id) {
      fetchCities(selectedState.id);
    } else {
      setCities([]);
      setSelectedCity(null);
    }
  }, [selectedState]);

  const backgroundInterpolate = backgroundAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#ffe6f0', '#fff0f5']
  });

  const loadHospitalData = async () => {
    try {
      setLoading(true);
      const userDataString = await AsyncStorage.getItem('userData');
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        setHospitalData(userData);
        
        // Set initial location selections if data exists
        if (userData.country) {
          const country = countries.find(c => c.name === userData.country);
          if (country) {
            setSelectedCountry(country);
          }
        }
      }
    } catch (error) {
      console.error('Error loading hospital data:', error);
      showAlert('Error', 'Failed to load hospital data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCountries = async () => {
    try {
      const response = await authAPI.get('/countries');
      if (response.data?.data) {
        setCountries(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching countries:', error);
      showAlert('Error', 'Failed to load countries');
    }
  };

  const fetchStates = async (countryId) => {
    try {
      const response = await authAPI.get(`/countries/${countryId}/states`);
      if (response.data?.data) {
        setStates(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching states:', error);
      showAlert('Error', 'Failed to load states');
    }
  };

  const fetchCities = async (stateId) => {
    try {
      const response = await authAPI.get(`/states/${stateId}/cities`);
      if (response.data?.data) {
        setCities(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
      showAlert('Error', 'Failed to load cities');
    }
  };

  const handleImagePick = async () => {
    if (!isEditing) return;

    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: 1,
        includeBase64: false,
      });

      if (!result.didCancel && result.assets && result.assets.length > 0) {
        setNewImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showAlert('Error', 'Failed to pick image');
    }
  };

  const showAlert = (title, message) => {
    Alert.alert(
      title,
      message,
      [{ text: 'OK', style: 'default' }]
    );
  };

  const handleSave = async () => {
    if (!hospitalData?.id) return;

    try {
      setSaving(true);

      const formData = new FormData();
      
      // Add basic hospital data
      formData.append('name', hospitalData.name);
      formData.append('email', hospitalData.email);
      formData.append('phone', hospitalData.phone);
      formData.append('address', hospitalData.address);

      // Add location data
      if (selectedCountry) formData.append('country', selectedCountry.name);
      if (selectedState) formData.append('state', selectedState.name);
      if (selectedCity) formData.append('city', selectedCity.name);

      // Add image if changed
      if (newImage) {
        const imageUri = newImage.uri;
        const filename = imageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('image', {
          uri: imageUri,
          name: filename,
          type,
        });
      }

      const response = await authAPI.put(`/hospitals/${hospitalData.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data) {
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.hospital));
        showAlert('Success', 'Hospital details updated successfully');
        setIsEditing(false);
        loadHospitalData();
      }
    } catch (error) {
      console.error('Error updating hospital:', error);
      showAlert('Error', 'Failed to update hospital details');
    } finally {
      setSaving(false);
    }
  };

  const getInputStyle = (fieldName) => {
    return [
      styles.inputContainer,
      inputFocused === fieldName && styles.inputFocused,
      !isEditing && styles.disabledInput
    ];
  };

  const LocationModal = ({ 
    visible, 
    onClose, 
    title, 
    options, 
    onSelect 
  }) => (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View 
          style={[
            styles.modalContent,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }]
            }
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Feather name="x" size={22} color="#666" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalList}>
            {options.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.modalItem}
                onPress={() => {
                  onSelect(option);
                  onClose();
                }}
              >
                <Text style={styles.modalItemText}>{option.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
  
  if (loading || !hospitalData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff4a93" />
        <Text style={styles.loadingText}>Loading hospital details...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View 
        style={[
          styles.container, 
          { backgroundColor: backgroundInterpolate }
        ]}
      >
        <StatusBar barStyle="light-content" backgroundColor="#ff4a93" />
        
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (isEditing) {
                Alert.alert(
                  'Discard Changes',
                  'Are you sure you want to discard your changes?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Discard',
                      style: 'destructive',
                      onPress: () => {
                        setIsEditing(false);
                        loadHospitalData();
                        navigation.goBack();
                      }
                    },
                  ]
                );
              } else {
                navigation.goBack();
              }
            }}
          >
            <Feather name="chevron-left" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hospital Details</Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              if (isEditing) {
                handleSave();
              } else {
                setIsEditing(true);
              }
            }}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.editButtonText}>
                {isEditing ? 'Save' : 'Edit'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.decorContainer}>
          <View style={[styles.decorItem, styles.decorHeart]} />
          <View style={[styles.decorItem, styles.decorStar]} />
          <View style={[styles.decorItem, styles.decorCircle]} />
          <View style={[styles.decorItem, styles.decorSquare]} />
          <View style={[styles.decorItem, styles.decorTriangle]} />
          <View style={[styles.decorItem, styles.decorPlus]} />
        </View>

        <KeyboardAvoidingView 
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <Animated.View 
              style={[
                styles.cardContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideUpAnim }]
                }
              ]}
            >
              <View style={styles.imageSection}>
                <TouchableOpacity 
                  style={styles.imageContainer}
                  onPress={handleImagePick}
                  disabled={!isEditing}
                >
                  {newImage ? (
                    <Image
                      source={{ uri: newImage.uri }}
                      style={styles.profileImage}
                    />
                  ) : hospitalData.imageUrl ? (
                    <Image
                      source={{ uri: hospitalData.imageUrl }}
                      style={styles.profileImage}
                    />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Feather name="camera" size={36} color="#e75a97" />
                    </View>
                  )}
                  {isEditing && (
                    <View style={styles.uploadOverlay}>
                      <Feather name="upload" size={20} color="#fff" />
                      <Text style={styles.uploadText}>Change Photo</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Hospital Name</Text>
                  <View style={getInputStyle('name')}>
                    <TextInput
                      style={styles.input}
                      value={hospitalData.name}
                      onChangeText={(text) => setHospitalData({ ...hospitalData, name: text })}
                      editable={isEditing}
                      placeholder="Enter hospital name"
                      placeholderTextColor="#b99aa8"
                      onFocus={() => setInputFocused('name')}
                      onBlur={() => setInputFocused(null)}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <View style={getInputStyle('email')}>
                    <TextInput
                      style={styles.input}
                      value={hospitalData.email}
                      onChangeText={(text) => setHospitalData({ ...hospitalData, email: text })}
                      editable={isEditing}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholder="Enter email address"
                      placeholderTextColor="#b99aa8"
                      onFocus={() => setInputFocused('email')}
                      onBlur={() => setInputFocused(null)}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Phone Number</Text>
                  <View style={getInputStyle('phone')}>
                    <TextInput
                      style={styles.input}
                      value={hospitalData.phone}
                      onChangeText={(text) => setHospitalData({ ...hospitalData, phone: text })}
                      editable={isEditing}
                      keyboardType="phone-pad"
                      placeholder="Enter phone number"
                      placeholderTextColor="#b99aa8"
                      onFocus={() => setInputFocused('phone')}
                      onBlur={() => setInputFocused(null)}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Country</Text>
                  <TouchableOpacity
                    style={[
                      getInputStyle('country'),
                      styles.dropdownInput,
                    ]}
                    onPress={() => isEditing && setShowCountryModal(true)}
                    disabled={!isEditing}
                  >
                    <Text style={[
                      styles.dropdownText,
                      !selectedCountry && styles.placeholderText
                    ]}>
                      {selectedCountry?.name || 'Select Country'}
                    </Text>
                    <Feather name="chevron-down" size={20} color="#b99aa8" />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>State</Text>
                  <TouchableOpacity
                    style={[
                      getInputStyle('state'),
                      styles.dropdownInput,
                      (!selectedCountry || !isEditing) && styles.disabledDropdown
                    ]}
                    onPress={() => isEditing && selectedCountry && setShowStateModal(true)}
                    disabled={!isEditing || !selectedCountry}
                  >
                    <Text style={[
                      styles.dropdownText,
                      !selectedState && styles.placeholderText
                    ]}>
                      {selectedState?.name || 'Select State'}
                    </Text>
                    <Feather name="chevron-down" size={20} color="#b99aa8" />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>City</Text>
                  <TouchableOpacity
                    style={[
                      getInputStyle('city'),
                      styles.dropdownInput,
                      (!selectedState || !isEditing) && styles.disabledDropdown
                    ]}
                    onPress={() => isEditing && selectedState && setShowCityModal(true)}
                    disabled={!isEditing || !selectedState}
                  >
                    <Text style={[
                      styles.dropdownText,
                      !selectedCity && styles.placeholderText
                    ]}>
                      {selectedCity?.name || 'Select City'}
                    </Text>
                    <Feather name="chevron-down" size={20} color="#b99aa8" />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Address</Text>
                  <View style={[getInputStyle('address'), styles.textAreaContainer]}>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={hospitalData.address}
                      onChangeText={(text) => setHospitalData({ ...hospitalData, address: text })}
                      editable={isEditing}
                      multiline
                      numberOfLines={3}
                      placeholder="Enter complete address"
                      placeholderTextColor="#b99aa8"
                      onFocus={() => setInputFocused('address')}
                      onBlur={() => setInputFocused(null)}
                      textAlignVertical="top"
                    />
                  </View>
                </View>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>

        <LocationModal
          visible={showCountryModal}
          onClose={() => setShowCountryModal(false)}
          title="Select Country"
          options={countries}
          onSelect={(country) => {
            setSelectedCountry(country);
            setSelectedState(null);
            setSelectedCity(null);
          }}
        />

        <LocationModal
          visible={showStateModal}
          onClose={() => setShowStateModal(false)}
          title="Select State"
          options={states}
          onSelect={(state) => {
            setSelectedState(state);
            setSelectedCity(null);
          }}
        />

        <LocationModal
          visible={showCityModal}
          onClose={() => setShowCityModal(false)}
          title="Select City"
          options={cities}
          onSelect={setSelectedCity}
        />
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ff4a93',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff0f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff0f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#ff4a93',
    fontFamily: 'Poppins-Regular',
  },
  header: {
    backgroundColor: '#ff4a93',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 10,
    paddingBottom: 15,
    paddingHorizontal: 20,
    height: Platform.OS === 'android' ? 80 : 60,
    elevation: 4,
    shadowColor: '#e05c97',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  decorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.2,
    overflow: 'hidden',
    backgroundColor: '#ffd1e6',
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    zIndex: -1,
  },
  decorItem: {
    position: 'absolute',
    opacity: 0.5,
  },
  decorHeart: {
    width: 20,
    height: 20,
    backgroundColor: '#ff7eb9',
    borderRadius: 10,
    transform: [{ rotate: '45deg' }],
    top: '20%',
    left: '30%',
  },
  decorStar: {
    width: 16,
    height: 16,
    backgroundColor: '#ffbee0',
    borderRadius: 8,
    top: '15%',
    right: '25%',
  },
  decorCircle: {
    width: 22,
    height: 22,
    backgroundColor: '#ff80b3',
    borderRadius: 11,
    top: '30%',
    left: '60%',
  },
  decorSquare: {
    width: 14,
    height: 14,
    backgroundColor: '#ff9dcc',
    borderRadius: 2,
    top: '20%',
    right: '40%',
  },
  decorTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 18,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#ffb3d9',
    top: '35%',
    left: '20%',
  },
  decorPlus: {
    width: 18,
    height: 18,
    backgroundColor: '#ffcce6',
    borderRadius: 2,
    top: '10%',
    right: '15%',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    color: '#fff',
    fontFamily: 'Poppins-SemiBold',
    fontWeight: '600',
  },
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    fontWeight: '600',
  },
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  cardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#e05c97',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  imageSection: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  imageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fcfcff',
    borderWidth: 3,
    borderColor: '#ffebf3',
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fcfcff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffebf3',
  },
  uploadOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,74,147,0.8)',
    padding: 10,
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    alignItems: 'center',
  },
  uploadText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 2,
    fontFamily: 'Poppins-Regular',
  },
  form: {
    paddingHorizontal: 5,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#444',
    marginBottom: 8,
    fontFamily: 'Poppins-Medium',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f2d1e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    backgroundColor: '#fcfcff',
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Poppins-Regular',
    color: '#333',
  },
  inputFocused: {
    borderColor: '#ff4a93',
    backgroundColor: '#fffbfd',
    shadowColor: '#ff4a93',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 1,
  },
  disabledInput: {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
    color: '#6b7280',
  },
  textAreaContainer: {
    height: 100,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  dropdownInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    fontSize: 15,
    color: '#333',
    fontFamily: 'Poppins-Regular',
  },
  placeholderText: {
    color: '#b99aa8',
  },
  disabledDropdown: {
    opacity: 0.7,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f2d1e0',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    fontWeight: '600',
    color: '#333',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalList: {
    padding: 16,
    maxHeight: height * 0.5,
  },
  modalItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f9f0f5',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'Poppins-Regular',
  },
});