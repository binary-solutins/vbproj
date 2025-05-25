import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Dimensions,
  Animated,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../api/axios';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function AddDoctor() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [inputFocused, setInputFocused] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    specialization: '',
    designation: '',
    experience: '',
  });
  const [errors, setErrors] = useState({});

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
  }, []);

  const backgroundInterpolate = backgroundAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#ffe6f0', '#fff0f5']
  });

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.specialization.trim()) newErrors.specialization = 'Specialization is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const userData = JSON.parse(await AsyncStorage.getItem('userData'));
      
      const submitData = {
        name: formData.name,
        specialization: formData.specialization,
        designation: formData.designation,
        experience: formData.experience || '',
        hospitalId: userData.id
      };

      await authAPI.post('/doctors', submitData);

      Alert.alert('Success', 'Doctor added successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error adding doctor:', error);
      Alert.alert('Error', 'Failed to add doctor');
    } finally {
      setLoading(false);
    }
  };

  const getInputStyle = (fieldName) => {
    return [
      styles.inputContainer,
      inputFocused === fieldName && styles.inputFocused,
      errors[fieldName] && styles.inputError
    ];
  };

  if (loading && !Object.keys(formData).length) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff4a93" />
        <Text style={styles.loadingText}>Loading...</Text>
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
        
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Feather name="chevron-left" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add New Doctor</Text>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
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
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    Full Name <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={getInputStyle('name')}>
                    <TextInput
                      style={styles.input}
                      value={formData.name}
                      onChangeText={(text) => {
                        setFormData({ ...formData, name: text });
                        if (errors.name) {
                          setErrors({ ...errors, name: null });
                        }
                      }}
                      placeholder="Enter doctor's full name"
                      placeholderTextColor="#b99aa8"
                      onFocus={() => setInputFocused('name')}
                      onBlur={() => setInputFocused(null)}
                    />
                  </View>
                  {errors.name && (
                    <Text style={styles.errorText}>{errors.name}</Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    Specialization <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={getInputStyle('specialization')}>
                    <TextInput
                      style={styles.input}
                      value={formData.specialization}
                      onChangeText={(text) => {
                        setFormData({ ...formData, specialization: text });
                        if (errors.specialization) {
                          setErrors({ ...errors, specialization: null });
                        }
                      }}
                      placeholder="Enter specialization"
                      placeholderTextColor="#b99aa8"
                      onFocus={() => setInputFocused('specialization')}
                      onBlur={() => setInputFocused(null)}
                    />
                  </View>
                  {errors.specialization && (
                    <Text style={styles.errorText}>{errors.specialization}</Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Designation</Text>
                  <View style={getInputStyle('designation')}>
                    <TextInput
                      style={styles.input}
                      value={formData.designation}
                      onChangeText={(text) => setFormData({ ...formData, designation: text })}
                      placeholder="Enter designation (optional)"
                      placeholderTextColor="#b99aa8"
                      onFocus={() => setInputFocused('designation')}
                      onBlur={() => setInputFocused(null)}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Experience</Text>
                  <View style={getInputStyle('experience')}>
                    <TextInput
                      style={styles.input}
                      value={formData.experience}
                      onChangeText={(text) => setFormData({ ...formData, experience: text })}
                      placeholder="Years of experience (optional)"
                      placeholderTextColor="#b99aa8"
                      keyboardType="numeric"
                      onFocus={() => setInputFocused('experience')}
                      onBlur={() => setInputFocused(null)}
                    />
                  </View>
                </View>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
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
    paddingBottom: 15,
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: '#e05c97',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    zIndex: 10,
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
});