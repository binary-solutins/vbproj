import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  StatusBar,
  Easing,
  Keyboard,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { authAPI } from '../api/axios';

const { width, height } = Dimensions.get('window');

export default function EditPatient() {
  const navigation = useNavigation();
  const route = useRoute();
  const { patientId } = route.params || {};
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [inputFocused, setInputFocused] = useState(null);
  const scrollViewRef = useRef(null);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const backgroundAnim = useRef(new Animated.Value(0)).current;
  const formAnimation = useRef(new Animated.Value(0)).current;
  const saveButtonScale = useRef(new Animated.Value(1)).current;
  const inputRefs = useRef({});
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    weight: '',
    height: '',
    contact: '',
    gender: '',
    address: '',
    adharNumber: '',
    email: '',
  });

  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    age: '',
    contact: '',
    gender: '',
  });

  // Form sections configuration
  const formSections = [
    {
      title: 'Personal Information',
      icon: <Feather name="user" size={20} color="#ff4a93" />,
      fields: ['firstName', 'lastName', 'age', 'gender'],
    },
    {
      title: 'Physical Attributes',
      icon: <Feather name="heart" size={20} color="#ff4a93" />,
      fields: ['weight', 'height'],
    },
    {
      title: 'Contact Information',
      icon: <Feather name="phone" size={20} color="#ff4a93" />,
      fields: ['contact', 'email', 'address'],
    },
    {
      title: 'Identification',
      icon: <Feather name="credit-card" size={20} color="#ff4a93" />,
      fields: ['adharNumber'],
    },
  ];

  // Load patient data
  useEffect(() => {
    if (patientId) {
      loadPatientData();
    } else {
      Alert.alert('Error', 'Patient ID is missing.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    }
  }, [patientId]);

  // Start animations when component mounts
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
  }, []);

  const backgroundInterpolate = backgroundAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#ffe6f0', '#fff0f5']
  });

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const loadPatientData = async () => {
    try {
      setLoading(true);
      const response = await authAPI.get(`/patients/${patientId}`);
      console.log('Patient data:', response.data);
      const patient = response.data;
      
      setFormData({
        ...patient,
        age: patient?.age?.toString() || '',
        weight: patient?.weight?.toString() || '',
        height: patient?.height?.toString() || '',
      });
    } catch (error) {
      console.error('Error loading patient data:', error);
      Alert.alert('Error', 'Failed to load patient data', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Validate the form
  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
      isValid = false;
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
      isValid = false;
    }

    if (!formData.age || isNaN(formData.age)) {
      newErrors.age = 'Valid age is required';
      isValid = false;
    } else if (parseInt(formData.age) <= 0 || parseInt(formData.age) > 120) {
      newErrors.age = 'Age must be between 1 and 120';
      isValid = false;
    }

    if (!formData.contact.trim()) {
      newErrors.contact = 'Contact number is required';
      isValid = false;
    } else if (!/^\d{10}$/.test(formData.contact.trim())) {
      newErrors.contact = 'Enter a valid 10-digit number';
      isValid = false;
    }

    if (!formData.gender.trim()) {
      newErrors.gender = 'Gender is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      // Find the first section with errors and navigate to it
      for (let i = 0; i < formSections.length; i++) {
        const section = formSections[i];
        const hasError = section.fields.some(field => errors[field]);
        if (hasError) {
          navigateToSection(i);
          return;
        }
      }
      return;
    }

    Animated.sequence([
      Animated.timing(saveButtonScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(saveButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      setSaving(true);
      const updateData = {
        ...formData,
        age: parseInt(formData.age),
        weight: formData.weight ? parseFloat(formData.weight) : null,
        height: formData.height ? parseFloat(formData.height) : null,
      };

      await authAPI.put(`/patients/${patientId}`, updateData);
      
      // Show success animation
      Alert.alert(
        'Success',
        'Patient updated successfully',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error updating patient:', error);
      Alert.alert('Error', 'Failed to update patient. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Navigation between form sections
  const navigateToSection = (index) => {
    if (index >= 0 && index < formSections.length) {
      setActiveSection(index);
      Animated.timing(formAnimation, {
        toValue: index,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }).start();
      
      // Scroll to the section
      scrollViewRef.current?.scrollTo({
        y: index * 150, 
        animated: true,
      });
    }
  };

  // Handle next section
  const handleNextSection = () => {
    if (activeSection < formSections.length - 1) {
      navigateToSection(activeSection + 1);
    } else {
      handleSubmit();
    }
  };

  // Handle previous section
  const handlePrevSection = () => {
    if (activeSection > 0) {
      navigateToSection(activeSection - 1);
    }
  };

  // Handle input change with validation
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getInputStyle = (fieldName) => {
    return [
      styles.inputContainer,
      inputFocused === fieldName && styles.inputFocused,
      errors[fieldName] && styles.inputError
    ];
  };

  // Toggle gender selection
  const handleGenderSelect = (gender) => {
    setFormData(prev => ({ ...prev, gender }));
    if (errors.gender) {
      setErrors(prev => ({ ...prev, gender: '' }));
    }
  };

  // Custom input component with animation
  const renderInput = (label, field, placeholder, required = false, keyboardType = 'default', multiline = false) => {
    const inputError = errors[field];
    
    if (field === 'gender') {
      return (
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            {label} {required && <Text style={styles.required}>*</Text>}
          </Text>
          <View style={styles.genderContainer}>
            {['Male', 'Female', 'Other'].map((gender) => (
              <TouchableOpacity
                key={gender}
                style={[
                  styles.genderOption,
                  formData.gender === gender && styles.genderOptionSelected,
                ]}
                onPress={() => handleGenderSelect(gender)}
              >
                <Text
                  style={[
                    styles.genderText,
                    formData.gender === gender && styles.genderTextSelected,
                  ]}
                >
                  {gender}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {inputError && (
            <Text style={styles.errorText}>{inputError}</Text>
          )}
        </View>
      );
    }
    
    return (
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>
          {label} {required && <Text style={styles.required}>*</Text>}
        </Text>
        <View style={getInputStyle(field)}>
          <TextInput
            ref={ref => inputRefs.current[field] = ref}
            style={[
              styles.input,
              multiline && styles.textArea,
            ]}
            value={formData[field]}
            onChangeText={(text) => handleInputChange(field, text)}
            placeholder={placeholder}
            placeholderTextColor="#b99aa8"
            keyboardType={keyboardType}
            multiline={multiline}
            numberOfLines={multiline ? 3 : 1}
            onFocus={() => setInputFocused(field)}
            onBlur={() => setInputFocused(null)}
            returnKeyType={multiline ? "default" : "next"}
            blurOnSubmit={multiline}
            onSubmitEditing={() => {
              // Find next input to focus
              const fields = formSections.flatMap(section => section.fields);
              const currentIndex = fields.findIndex(f => f === field);
              if (currentIndex < fields.length - 1) {
                const nextField = fields[currentIndex + 1];
                if (nextField !== 'gender') {
                  inputRefs.current[nextField]?.focus();
                }
              }
            }}
          />
        </View>
        {inputError && (
          <Text style={styles.errorText}>{inputError}</Text>
        )}
      </View>
    );
  };

  // Render current form section
  const renderFormSection = (section, index) => {
    const isActive = index === activeSection;
    
    return (
      <Animated.View 
        style={[
          styles.formSection,
          {
            opacity: formAnimation.interpolate({
              inputRange: [index - 1, index, index + 1],
              outputRange: [0.7, 1, 0.7],
              extrapolate: 'clamp',
            }),
            transform: [
              {
                scale: formAnimation.interpolate({
                  inputRange: [index - 1, index, index + 1],
                  outputRange: [0.95, 1, 0.95],
                  extrapolate: 'clamp',
                }),
              },
            ],
          },
        ]}
        key={section.title}
      >
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            {section.icon}
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
          <View style={styles.sectionProgress}>
            <Text style={styles.progressText}>{index + 1}/{formSections.length}</Text>
          </View>
        </View>

        <View style={styles.formFields}>
          {section.fields.map(field => {
            const fieldConfig = {
              firstName: { label: 'First Name', placeholder: 'Enter first name', required: true },
              lastName: { label: 'Last Name', placeholder: 'Enter last name', required: true },
              age: { label: 'Age', placeholder: 'Enter age', required: true, keyboardType: 'numeric' },
              gender: { label: 'Gender', placeholder: 'Select gender', required: true },
              weight: { label: 'Weight (kg)', placeholder: 'Enter weight', keyboardType: 'numeric' },
              height: { label: 'Height (cm)', placeholder: 'Enter height', keyboardType: 'numeric' },
              contact: { label: 'Contact Number', placeholder: 'Enter 10-digit number', required: true, keyboardType: 'phone-pad' },
              email: { label: 'Email', placeholder: 'Enter email address', keyboardType: 'email-address' },
              address: { label: 'Address', placeholder: 'Enter full address', multiline: true },
              adharNumber: { label: 'Aadhar Number', placeholder: 'Enter Aadhar number' },
            }[field];
            
            return renderInput(
              fieldConfig.label,
              field,
              fieldConfig.placeholder,
              fieldConfig.required,
              fieldConfig.keyboardType,
              fieldConfig.multiline
            );
          })}
        </View>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff4a93" />
        <Text style={styles.loadingText}>Loading patient data...</Text>
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
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            disabled={saving}
          >
            <Feather name="chevron-left" size={26} color="#fff" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Edit Patient</Text>
          
          <Animated.View 
            style={[
              { transform: [{ scale: saveButtonScale }] }
            ]}
          >
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSubmit}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
        
        {/* Decorative elements */}
        <View style={styles.decorContainer}>
          <View style={[styles.decorItem, styles.decorHeart]} />
          <View style={[styles.decorItem, styles.decorStar]} />
          <View style={[styles.decorItem, styles.decorCircle]} />
          <View style={[styles.decorItem, styles.decorSquare]} />
          <View style={[styles.decorItem, styles.decorTriangle]} />
          <View style={[styles.decorItem, styles.decorPlus]} />
        </View>

        {/* Form content */}
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
          <ScrollView 
            ref={scrollViewRef}
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollViewContent}
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
              {formSections.map(renderFormSection)}
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Navigation buttons */}
        {!keyboardVisible && (
          <View style={styles.navigationButtons}>
            <TouchableOpacity
              style={[styles.navButton, styles.prevButton, activeSection === 0 && styles.disabledButton]}
              onPress={handlePrevSection}
              disabled={activeSection === 0}
            >
              <Text style={[styles.prevButtonText, activeSection === 0 && styles.disabledButtonText]}>
                Previous
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.navButton, styles.nextButton]}
              onPress={handleNextSection}
            >
              <Text style={styles.nextButtonText}>
                {activeSection === formSections.length - 1 ? 'Save' : 'Next'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    color: '#fff',
    fontFamily: 'Poppins-SemiBold',
    fontWeight: '600',
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    fontWeight: '600',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  cardContainer: {
    backgroundColor: 'transparent',
    marginBottom: 70,
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
  formSection: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#e05c97',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginLeft: 10,
    fontFamily: 'Poppins-Medium',
  },
  sectionProgress: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    fontFamily: 'Poppins-Regular',
  },
  formFields: {
    marginTop: 8,
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
  required: {
    color: '#ff4a93',
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
  inputError: {
    borderColor: '#ffb3b3',
    backgroundColor: '#fff5f5',
  },
  errorText: {
    color: '#ff4a93',
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Poppins-Regular',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#f2d1e0',
    borderRadius: 8,
    backgroundColor: '#fcfcff',
    marginHorizontal: 4,
    alignItems: 'center',
  },
  genderOptionSelected: {
    borderColor: '#ff4a93',
    backgroundColor: '#fff0f5',
  },
  genderText: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Poppins-Regular',
  },
  genderTextSelected: {
    color: '#ff4a93',
    fontWeight: '600',
    fontFamily: 'Poppins-Medium',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: '#f2d1e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  navButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  prevButton: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#f2d1e0',
  },
  prevButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0F172A',
    fontFamily: 'Poppins-Medium',
  },
  nextButton: {
    backgroundColor: '#ff4a93',
    shadowColor: '#ff4a93',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  nextButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    fontFamily: 'Poppins-Medium',
  },
  disabledButton: {
    backgroundColor: '#F8FAFC',
    borderColor: '#F1F5F9',
  },
  disabledButtonText: {
    color: '#CBD5E1',
  },
});