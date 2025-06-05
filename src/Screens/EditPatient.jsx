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
  StatusBar,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { authAPI } from '../api/axios';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function EditPatient() {
  const navigation = useNavigation();
  const route = useRoute();
  const { patientId } = route.params || {};
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    weight: '',
    height: '',
    contact: '',
    gender: 'Female', // Default to Female to match AddPatient
    address: '',
    adharNumber: '',
    email: '',
  });

  const [errors, setErrors] = useState({});
  const [focusedField, setFocusedField] = useState(null);

  useEffect(() => {
    if (patientId) {
      loadPatientData();
    } else {
      Alert.alert('Error', 'Patient ID is missing.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    }
  }, [patientId]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadPatientData = async () => {
    try {
      setLoading(true);
      const response = await authAPI.get(`/patients/${patientId}`);
      const patient = response.data;
      
      setFormData({
        firstName: patient?.firstName || '',
        lastName: patient?.lastName || '',
        age: patient?.age?.toString() || '',
        weight: patient?.weight?.toString() || '',
        height: patient?.height?.toString() || '',
        contact: patient?.contact || '',
        gender: patient?.gender || 'Female',
        address: patient?.address || '',
        adharNumber: patient?.adharNumber || '',
        email: patient?.email || '',
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

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  const validateAadhar = (aadhar) => {
    const aadharRegex = /^\d{12}$/;
    return aadharRegex.test(aadhar.replace(/\s/g, ''));
  };

  const validateAge = (age) => {
    const ageNum = parseInt(age);
    return !isNaN(ageNum) && ageNum > 0 && ageNum <= 120;
  };

  const validateWeight = (weight) => {
    if (!weight) return true;
    const weightNum = parseFloat(weight);
    return !isNaN(weightNum) && weightNum > 0 && weightNum <= 500;
  };

  const validateHeight = (height) => {
    if (!height) return true;
    const heightNum = parseFloat(height);
    return !isNaN(heightNum) && heightNum > 0 && heightNum <= 300;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }

    if (!formData.age) {
      newErrors.age = 'Age is required';
    } else if (!validateAge(formData.age)) {
      newErrors.age = 'Please enter a valid age (1-120)';
    }

    if (!formData.contact.trim()) {
      newErrors.contact = 'Contact number is required';
    } else if (!validatePhone(formData.contact.trim())) {
      newErrors.contact = 'Please enter a valid 10-digit mobile number';
    }

    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.adharNumber && !validateAadhar(formData.adharNumber)) {
      newErrors.adharNumber = 'Aadhar number must be 12 digits';
    }

    if (formData.weight && !validateWeight(formData.weight)) {
      newErrors.weight = 'Please enter a valid weight';
    }

    if (formData.height && !validateHeight(formData.height)) {
      newErrors.height = 'Please enter a valid height';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please correct the highlighted errors and try again.');
      return;
    }

    try {
      setSaving(true);
      
      const submitData = {
        ...formData,
        age: parseInt(formData.age),
        weight: formData.weight ? parseFloat(formData.weight) : null,
        height: formData.height ? parseFloat(formData.height) : null,
        adharNumber: formData.adharNumber.replace(/\s/g, ''),
      };

      await authAPI.put(`/patients/${patientId}`, submitData);
      
      Alert.alert(
        'Success',
        'Patient updated successfully!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error updating patient:', error);
      Alert.alert('Error', 'Failed to update patient. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatAadhar = (text) => {
    const cleaned = text.replace(/\D/g, '');
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
    return formatted.substring(0, 14);
  };

  const renderInputField = ({
    label,
    field,
    placeholder,
    required = false,
    keyboardType = 'default',
    multiline = false,
    icon,
    formatter = null,
    maxLength = null,
  }) => {
    const hasError = !!errors[field];
    const isFocused = focusedField === field;
    
    return (
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>
          {label} {required && <Text style={styles.required}>*</Text>}
        </Text>
        <View style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          hasError && styles.inputError,
          multiline && styles.textAreaContainer,
        ]}>
          <View style={styles.iconContainer}>
            <Feather 
              name={icon} 
              size={18} 
              color={hasError ? '#dc3545' : isFocused ? '#ff4a93' : '#6c757d'} 
            />
          </View>
          <TextInput
            style={[styles.input, multiline && styles.textArea]}
            value={formData[field]}
            onChangeText={(text) => {
              const formattedText = formatter ? formatter(text) : text;
              handleInputChange(field, formattedText);
            }}
            placeholder={placeholder}
            placeholderTextColor="#adb5bd"
            keyboardType={keyboardType}
            multiline={multiline}
            numberOfLines={multiline ? 4 : 1}
            textAlignVertical={multiline ? "top" : "center"}
            onFocus={() => setFocusedField(field)}
            onBlur={() => setFocusedField(null)}
            maxLength={maxLength}
          />
        </View>
        {hasError && (
          <View style={styles.errorContainer}>
            <Feather name="alert-circle" size={14} color="#dc3545" />
            <Text style={styles.errorText}>{errors[field]}</Text>
          </View>
        )}
      </View>
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
    <View style={styles.container}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#007bff" 
        translucent={false}
      />
      
      {/* Professional Header with Safe Area */}
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
            disabled={saving}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Edit Patient</Text>
          </View>
          
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleSubmit}
            disabled={saving}
            activeOpacity={0.7}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Feather name="check" size={22} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingContainer}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View 
            style={[styles.formCard, { opacity: fadeAnim }]}
          >
            {/* Personal Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Personal Information</Text>
              
              {renderInputField({
                label: 'First Name',
                field: 'firstName',
                placeholder: 'Enter first name',
                required: true,
                icon: 'user',
              })}

              {renderInputField({
                label: 'Last Name',
                field: 'lastName',
                placeholder: 'Enter last name',
                required: true,
                icon: 'user',
              })}

              {renderInputField({
                label: 'Age',
                field: 'age',
                placeholder: 'Enter age',
                required: true,
                keyboardType: 'numeric',
                icon: 'calendar',
                maxLength: 3,
              })}

              {/* Gender - Fixed to Female */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Gender <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.genderContainer}>
                  <View style={styles.genderDisplay}>
                    <Feather name="user" size={18} color="#FF4A93" />
                    <Text style={styles.genderText}>Female</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Physical Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Physical Information</Text>
              
              {renderInputField({
                label: 'Weight (kg)',
                field: 'weight',
                placeholder: 'Enter weight (optional)',
                keyboardType: 'numeric',
                icon: 'trending-up',
              })}

              {renderInputField({
                label: 'Height (cm)',
                field: 'height',
                placeholder: 'Enter height (optional)',
                keyboardType: 'numeric',
                icon: 'bar-chart-2',
              })}
            </View>

            {/* Contact Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact Information</Text>
              
              {renderInputField({
                label: 'Mobile Number',
                field: 'contact',
                placeholder: 'Enter 10-digit mobile number',
                required: true,
                keyboardType: 'phone-pad',
                icon: 'phone',
                maxLength: 10,
              })}

              {renderInputField({
                label: 'Email Address',
                field: 'email',
                placeholder: 'Enter email address (optional)',
                keyboardType: 'email-address',
                icon: 'mail',
              })}

              {renderInputField({
                label: 'Address',
                field: 'address',
                placeholder: 'Enter complete address (optional)',
                multiline: true,
                icon: 'map-pin',
              })}
            </View>

            {/* Identification */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Identification</Text>
              
              {renderInputField({
                label: 'Aadhar Number',
                field: 'adharNumber',
                placeholder: 'Enter 12-digit Aadhar number (optional)',
                keyboardType: 'numeric',
                icon: 'credit-card',
                formatter: formatAadhar,
                maxLength: 14,
              })}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, saving && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={saving}
              activeOpacity={0.7}
            >
              <View style={styles.submitButtonContent}>
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Feather name="edit" size={18} color="#fff" />
                    <Text style={styles.submitButtonText}>Update Patient</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#ff4a93',
  },
  headerSafeArea: {
    backgroundColor: '#ff4a93',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  header: {
    backgroundColor: '#ff4a93',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Math.max(16, screenWidth * 0.04),
    paddingVertical: Math.max(12, screenHeight * 0.015),
    minHeight: Math.max(56, screenHeight * 0.07),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerButton: {
    padding: Math.max(8, screenWidth * 0.02),
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    minWidth: Math.max(40, screenWidth * 0.1),
    minHeight: Math.max(40, screenWidth * 0.1),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: Math.max(18, screenWidth * 0.045),
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Math.max(16, screenWidth * 0.04),
    paddingBottom: Math.max(32, screenHeight * 0.04),
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: Math.max(20, screenWidth * 0.05),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: Math.max(16, screenHeight * 0.02),
  },
  section: {
    marginBottom: Math.max(24, screenHeight * 0.03),
  },
  sectionTitle: {
    fontSize: Math.max(16, screenWidth * 0.045),
    fontWeight: '600',
    color: '#212529',
    marginBottom: Math.max(16, screenHeight * 0.02),
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  inputGroup: {
    marginBottom: Math.max(16, screenHeight * 0.02),
  },
  inputLabel: {
    fontSize: Math.max(14, screenWidth * 0.035),
    fontWeight: '500',
    color: '#495057',
    marginBottom: 6,
  },
  required: {
    color: '#dc3545',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    paddingHorizontal: 4,
    minHeight: Math.max(48, screenHeight * 0.06),
  },
  textAreaContainer: {
    alignItems: 'flex-start',
    minHeight: Math.max(100, screenHeight * 0.12),
    paddingVertical: 4,
  },
  iconContainer: {
    padding: Math.max(12, screenWidth * 0.03),
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontSize: Math.max(16, screenWidth * 0.04),
    color: '#212529',
    paddingVertical: Math.max(12, screenHeight * 0.015),
    paddingRight: 12,
  },
  textArea: {
    textAlignVertical: 'top',
    minHeight: Math.max(80, screenHeight * 0.1),
  },
  inputFocused: {
    borderColor: '#ff4a93',
    shadowColor: '#ff4a93',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  inputError: {
    borderColor: '#dc3545',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  errorText: {
    fontSize: Math.max(12, screenWidth * 0.03),
    color: '#dc3545',
    marginLeft: 4,
    flex: 1,
    flexWrap: 'wrap',
  },
  genderContainer: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    minHeight: Math.max(48, screenHeight * 0.06),
  },
  genderDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Math.max(16, screenWidth * 0.04),
  },
  genderText: {
    fontSize: Math.max(16, screenWidth * 0.04),
    color: '#495057',
    marginLeft: 12,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#ff4a93',
    borderRadius: 8,
    marginTop: Math.max(16, screenHeight * 0.02),
    shadowColor: '#ff4a93',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    minHeight: Math.max(48, screenHeight * 0.06),
  },
  submitButtonDisabled: {
    backgroundColor: '#6c757d',
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Math.max(14, screenHeight * 0.018),
    paddingHorizontal: Math.max(24, screenWidth * 0.06),
  },
  submitButtonText: {
    fontSize: Math.max(16, screenWidth * 0.04),
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
});