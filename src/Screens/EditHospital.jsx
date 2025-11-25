import React, {useState, useEffect, useRef, useMemo, useCallback} from 'react';
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
  FlatList,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {
  Camera,
  ChevronLeft,
  ChevronDown,
  Upload,
  X,
  Search,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {launchImageLibrary} from 'react-native-image-picker';
import {authAPI} from '../api/axios';

const {width, height} = Dimensions.get('window');

// Debounce hook for search optimization
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Memoized search input component
const SearchInput = React.memo(
  ({value, onChangeText, placeholder, onClear}) => (
    <View style={styles.searchContainer}>
      <View style={styles.searchInputContainer}>
        <Search size={18} color="#b99aa8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={placeholder}
          placeholderTextColor="#b99aa8"
          value={value}
          onChangeText={onChangeText}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          blurOnSubmit={false}
        />
        {value.length > 0 && (
          <TouchableOpacity
            onPress={onClear}
            style={styles.clearSearchButton}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <X size={16} color="#b99aa8" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  ),
);

// Memoized list item component
const LocationItem = React.memo(({item, onPress}) => (
  <TouchableOpacity
    style={styles.modalItem}
    onPress={() => onPress(item)}
    activeOpacity={0.7}>
    <Text style={styles.modalItemText}>{item.name}</Text>
  </TouchableOpacity>
));

// Memoized empty component
const EmptyComponent = React.memo(({title}) => (
  <View style={styles.noResultsContainer}>
    <Search size={48} color="#d1d5db" />
    <Text style={styles.noResultsText}>No {title.toLowerCase()} found</Text>
    <Text style={styles.noResultsSubtext}>Try adjusting your search terms</Text>
  </View>
));

// Optimized Location Modal Component
const LocationModal = React.memo(
  ({visible, onClose, title, data, onSelect, searchType}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    const modalFadeAnim = useRef(new Animated.Value(0)).current;
    const modalSlideAnim = useRef(new Animated.Value(300)).current;

    // Filtered data with debounced search
    const filteredData = useMemo(() => {
      if (!debouncedSearchQuery.trim()) return data;
      const lowercaseQuery = debouncedSearchQuery.toLowerCase();
      return data.filter(item =>
        item.name.toLowerCase().includes(lowercaseQuery),
      );
    }, [data, debouncedSearchQuery]);

    // Animation handlers
    const showModal = useCallback(() => {
      modalFadeAnim.setValue(0);
      modalSlideAnim.setValue(300);

      Animated.parallel([
        Animated.timing(modalFadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(modalSlideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }, [modalFadeAnim, modalSlideAnim]);

    const hideModal = useCallback(
      callback => {
        Animated.parallel([
          Animated.timing(modalFadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(modalSlideAnim, {
            toValue: 300,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setSearchQuery('');
          callback?.();
        });
      },
      [modalFadeAnim, modalSlideAnim],
    );

    // Handle modal visibility
    useEffect(() => {
      if (visible) {
        showModal();
      }
    }, [visible, showModal]);

    // Handlers
    const handleClose = useCallback(() => {
      hideModal(onClose);
    }, [hideModal, onClose]);

    const handleItemPress = useCallback(
      item => {
        onSelect(item);
        hideModal(onClose);
      },
      [onSelect, hideModal, onClose],
    );

    const clearSearch = useCallback(() => {
      setSearchQuery('');
    }, []);

    // FlatList optimization
    const keyExtractor = useCallback(item => item.id.toString(), []);

    const renderItem = useCallback(
      ({item}) => <LocationItem item={item} onPress={handleItemPress} />,
      [handleItemPress],
    );

    const getItemLayout = useCallback(
      (data, index) => ({
        length: 50,
        offset: 50 * index,
        index,
      }),
      [],
    );

    const renderEmptyComponent = useCallback(
      () => <EmptyComponent title={title} />,
      [title],
    );

    if (!visible) return null;

    return (
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={handleClose}
        statusBarTranslucent>
        <Animated.View style={[styles.modalOverlay, {opacity: modalFadeAnim}]}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={handleClose}
          />

          <Animated.View
            style={[
              styles.modalContent,
              {transform: [{translateY: modalSlideAnim}]},
            ]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{title}</Text>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.modalCloseButton}>
                <X size={22} color="#666" />
              </TouchableOpacity>
            </View>

            <SearchInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={`Search ${title.toLowerCase()}...`}
              onClear={clearSearch}
            />

            <FlatList
              data={filteredData}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              style={styles.modalList}
              contentContainerStyle={styles.modalListContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              removeClippedSubviews={true}
              maxToRenderPerBatch={15}
              windowSize={10}
              initialNumToRender={10}
              getItemLayout={getItemLayout}
              ListEmptyComponent={renderEmptyComponent}
            />
          </Animated.View>
        </Animated.View>
      </Modal>
    );
  },
);

export default function EditHospital() {
  const navigation = useNavigation();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hospitalData, setHospitalData] = useState(null);
  const [newImage, setNewImage] = useState(null);
  const [inputFocused, setInputFocused] = useState(null);

  // Location data and modals
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showStateModal, setShowStateModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const backgroundAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
  }, [loadHospitalData, fetchCountries, fadeAnim, slideUpAnim, backgroundAnim]);

  // Location effects
  useEffect(() => {
    if (selectedCountry?.id) {
      fetchStates(selectedCountry.id);
      setSelectedState(null);
      setSelectedCity(null);
    } else {
      setStates([]);
      setSelectedState(null);
      setSelectedCity(null);
    }
  }, [selectedCountry, fetchStates]);

  useEffect(() => {
    if (selectedState?.id) {
      fetchCities(selectedState.id);
      setSelectedCity(null);
    } else {
      setCities([]);
      setSelectedCity(null);
    }
  }, [selectedState, fetchCities]);

  const backgroundInterpolate = backgroundAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#ffe6f0', '#fff0f5'],
  });

  const loadHospitalData = useCallback(async () => {
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
  }, [countries]);

  const fetchCountries = useCallback(async () => {
    try {
      const response = await authAPI.get('/countries');
      if (response.data?.data) {
        setCountries(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching countries:', error);
      showAlert('Error', 'Failed to load countries');
    }
  }, []);

  const fetchStates = useCallback(async countryId => {
    try {
      const response = await authAPI.get(`/countries/${countryId}/states`);
      if (response.data?.data) {
        setStates(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching states:', error);
      showAlert('Error', 'Failed to load states');
    }
  }, []);

  const fetchCities = useCallback(async stateId => {
    try {
      const response = await authAPI.get(`/states/${stateId}/cities`);
      if (response.data?.data) {
        setCities(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
      showAlert('Error', 'Failed to load cities');
    }
  }, []);

  const handleImagePick = async () => {
    if (!isEditing) return;

    // For web compatibility, you might want to implement a file input
    if (Platform.OS === 'web') {
      // Web file input implementation
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = e => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = event => {
            setNewImage({uri: event.target.result});
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      // Your original image picker logic for mobile
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
    }
  };

  const showAlert = (title, message) => {
    Alert.alert(title, message, [{text: 'OK', style: 'default'}]);
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

      console.log('newImage ==========> ', newImage);

      // Add image if changed
      if (newImage) {
        formData.append('image', {
          uri: newImage.uri,
          name: newImage.name || 'image.jpg',
          type: newImage.type || 'image/jpeg',
        });
      }

      const response = await authAPI.put(
        `/hospitals/${hospitalData.id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      if (response.data) {
        await AsyncStorage.setItem(
          'userData',
          JSON.stringify(response.data.hospital),
        );
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

  const getInputStyle = fieldName => [
    styles.inputContainer,
    inputFocused === fieldName && styles.inputFocused,
    !isEditing && styles.disabledInput,
  ];

  // Modal handlers
  const openCountryModal = useCallback(() => setShowCountryModal(true), []);
  const closeCountryModal = useCallback(() => setShowCountryModal(false), []);
  const openStateModal = useCallback(() => {
    if (selectedCountry && isEditing) setShowStateModal(true);
  }, [selectedCountry, isEditing]);
  const closeStateModal = useCallback(() => setShowStateModal(false), []);
  const openCityModal = useCallback(() => {
    if (selectedState && isEditing) setShowCityModal(true);
  }, [selectedState, isEditing]);
  const closeCityModal = useCallback(() => setShowCityModal(false), []);

  // Selection handlers
  const handleCountrySelect = useCallback(country => {
    setSelectedCountry(country);
    setSelectedState(null);
    setSelectedCity(null);
  }, []);

  const handleStateSelect = useCallback(state => {
    setSelectedState(state);
    setSelectedCity(null);
  }, []);

  const handleCitySelect = useCallback(city => {
    setSelectedCity(city);
  }, []);

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
        style={[styles.container, {backgroundColor: backgroundInterpolate}]}>
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
                    {text: 'Cancel', style: 'cancel'},
                    {
                      text: 'Discard',
                      style: 'destructive',
                      onPress: () => {
                        setIsEditing(false);
                        loadHospitalData();
                        navigation.goBack();
                      },
                    },
                  ],
                );
              } else {
                navigation.goBack();
              }
            }}>
            <ChevronLeft size={26} color="#fff" />
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
            disabled={saving}>
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
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            <Animated.View
              style={[
                styles.cardContainer,
                {
                  opacity: fadeAnim,
                  transform: [{translateY: slideUpAnim}],
                },
              ]}>
              <View style={styles.imageSection}>
                <TouchableOpacity
                  style={styles.imageContainer}
                  onPress={handleImagePick}
                  disabled={!isEditing}>
                  {newImage ? (
                    <Image
                      source={{uri: newImage.uri}}
                      style={styles.profileImage}
                    />
                  ) : hospitalData.imageUrl ? (
                    <Image
                      source={{uri: hospitalData.imageUrl}}
                      style={styles.profileImage}
                    />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Camera size={36} color="#e75a97" />
                    </View>
                  )}
                  {isEditing && (
                    <View style={styles.uploadOverlay}>
                      <Upload size={20} color="#fff" />
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
                      value={hospitalData.name || ''}
                      onChangeText={text =>
                        setHospitalData({...hospitalData, name: text})
                      }
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
                      value={hospitalData.email || ''}
                      onChangeText={text =>
                        setHospitalData({...hospitalData, email: text})
                      }
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
                      value={hospitalData.phone || ''}
                      onChangeText={text =>
                        setHospitalData({...hospitalData, phone: text})
                      }
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
                    style={[getInputStyle('country'), styles.dropdownInput]}
                    onPress={openCountryModal}
                    disabled={!isEditing}>
                    <Text
                      style={[
                        styles.dropdownText,
                        !selectedCountry && styles.placeholderText,
                      ]}>
                      {selectedCountry?.name || 'Select Country'}
                    </Text>
                    <ChevronDown size={20} color="#b99aa8" />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>State</Text>
                  <TouchableOpacity
                    style={[
                      getInputStyle('state'),
                      styles.dropdownInput,
                      (!selectedCountry || !isEditing) &&
                        styles.disabledDropdown,
                    ]}
                    onPress={openStateModal}
                    disabled={!isEditing || !selectedCountry}>
                    <Text
                      style={[
                        styles.dropdownText,
                        !selectedState && styles.placeholderText,
                      ]}>
                      {selectedState?.name || 'Select State'}
                    </Text>
                    <ChevronDown size={20} color="#b99aa8" />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>City</Text>
                  <TouchableOpacity
                    style={[
                      getInputStyle('city'),
                      styles.dropdownInput,
                      (!selectedState || !isEditing) && styles.disabledDropdown,
                    ]}
                    onPress={openCityModal}
                    disabled={!isEditing || !selectedState}>
                    <Text
                      style={[
                        styles.dropdownText,
                        !selectedCity && styles.placeholderText,
                      ]}>
                      {selectedCity?.name || 'Select City'}
                    </Text>
                    <ChevronDown size={20} color="#b99aa8" />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Address</Text>
                  <View
                    style={[
                      getInputStyle('address'),
                      styles.textAreaContainer,
                    ]}>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={hospitalData.address || ''}
                      onChangeText={text =>
                        setHospitalData({...hospitalData, address: text})
                      }
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
          onClose={closeCountryModal}
          title="Select Country"
          data={countries}
          onSelect={handleCountrySelect}
          searchType="country"
        />

        <LocationModal
          visible={showStateModal}
          onClose={closeStateModal}
          title="Select State"
          data={states}
          onSelect={handleStateSelect}
          searchType="state"
        />

        <LocationModal
          visible={showCityModal}
          onClose={closeCityModal}
          title="Select City"
          data={cities}
          onSelect={handleCitySelect}
          searchType="city"
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
    fontWeight: '500',
  },
  header: {
    backgroundColor: '#ff4a93',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 10,
    paddingBottom: 15,
    paddingHorizontal: width < 350 ? 12 : 20,
    minHeight: Platform.OS === 'android' ? 80 : 60,
    elevation: 4,
    shadowColor: '#e05c97',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  headerTitle: {
    fontSize: width < 350 ? 16 : 18,
    color: '#fff',
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: width < 350 ? 12 : 16,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 20,
    minWidth: width < 350 ? 60 : 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontSize: width < 350 ? 12 : 14,
    fontWeight: '600',
  },
  backButton: {
    padding: width < 350 ? 4 : 8,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
    transform: [{rotate: '45deg'}],
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
    shadowOffset: {width: 0, height: 4},
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
    color: '#333',
  },
  inputFocused: {
    borderColor: '#ff4a93',
    backgroundColor: '#fffbfd',
    shadowColor: '#ff4a93',
    shadowOffset: {width: 0, height: 0},
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
  modalBackdrop: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -4},
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
    fontWeight: '600',
    color: '#333',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalList: {
    paddingHorizontal: 16,
    maxHeight: height * 0.45,
  },
  modalListContent: {
    paddingBottom: 10,
  },
  modalItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f9f0f5',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f2d1e0',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f0f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#f2d1e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  clearSearchButton: {
    padding: 4,
    marginLeft: 8,
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noResultsText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
    marginTop: 12,
    textAlign: 'center',
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
});
