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
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { authAPI } from '../api/axios';

const { width, height } = Dimensions.get('window');

export default function EditDoctor() {
  const navigation = useNavigation();
  const route = useRoute();
  const { doctorId } = route.params;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [doctorData, setDoctorData] = useState(null);
  const [errors, setErrors] = useState({});
  const [inputFocused, setInputFocused] = useState(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const backgroundAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadDoctorData();
  }, [doctorId]);

  useEffect(() => {
    if (!loading && doctorData) {
      // Start animations when data is loaded
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
    }
  }, [loading, doctorData]);

  const backgroundInterpolate = backgroundAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#ffe6f0', '#fff0f5']
  });

  const loadDoctorData = async () => {
    try {
      setLoading(true);
      const response = await authAPI.get(`/doctors/${doctorId}`);
      setDoctorData(response.data);
    } catch (error) {
      console.error('Error loading doctor data:', error);
      Alert.alert('Error', 'Failed to load doctor data');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!doctorData.name.trim()) newErrors.name = 'Name is required';
    if (!doctorData.specialization.trim()) newErrors.specialization = 'Specialization is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      const updateData = {
        name: doctorData.name,
        specialization: doctorData.specialization,
        designation: doctorData.designation || '',
        experience: doctorData.experience || '',
      };

      await authAPI.put(`/doctors/${doctorId}`, updateData);

      Alert.alert(
        'Success',
        'Doctor updated successfully',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error updating doctor:', error);
      Alert.alert('Error', 'Failed to update doctor');
    } finally {
      setSaving(false);
    }
  };

  const getInputStyle = (fieldName) => {
    return [
      styles.inputContainer,
      inputFocused === fieldName && styles.inputFocused,
      errors[fieldName] && styles.inputError
    ];
  };

  if (loading || !doctorData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff4a93" />
        <Text style={styles.loadingText}>Loading doctor details...</Text>
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
            onPress={() => navigation.goBack()}
          >
            <Icon name="chevron-left" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Doctor</Text>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
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
                      value={doctorData.name}
                      onChangeText={(text) => {
                        setDoctorData({ ...doctorData, name: text });
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
                      value={doctorData.specialization}
                      onChangeText={(text) => {
                        setDoctorData({ ...doctorData, specialization: text });
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
                      value={doctorData.designation}
                      onChangeText={(text) => setDoctorData({ ...doctorData, designation: text })}
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
                      value={doctorData.experience}
                      onChangeText={(text) => setDoctorData({ ...doctorData, experience: text })}
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
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Poppins-Regular',
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
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Poppins-SemiBold',
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
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Poppins-Medium',
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
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Poppins-Medium',
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
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Poppins-Regular',
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
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Poppins-Regular',
  },
});