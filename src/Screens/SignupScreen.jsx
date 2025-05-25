import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
  Animated,
  Dimensions,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  SafeAreaView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import * as ImagePicker from 'react-native-image-picker'; 
import { authAPI } from '../api/axios';

const { width, height } = Dimensions.get('window');

export default function SignupScreen() {
  const navigation = useNavigation();
  
  // Animation refs - define all refs at the top
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const backgroundAnim = useRef(new Animated.Value(0)).current;
  const logoAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  
  // Input refs for focus management
  const emailInputRef = useRef(null);
  const phoneInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  
  // Form data state
  const [formData, setFormData] = useState({
    hospitalName: '',
    email: '',
    phone: '',
    password: '',
    hospitalImage: null
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inputFocused, setInputFocused] = useState(null);

  useEffect(() => {
    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(backgroundAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: false,
      }),
      Animated.timing(logoAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    ]).start();
  }, [fadeAnim, slideAnim, backgroundAnim, logoAnim]);

  const validateForm = () => {
    if (!formData.hospitalName.trim()) {
      setError('Hospital name is required');
      return false;
    }
    
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return false;
    }
    
    if (formData.phone.length < 10) {
      setError('Please enter a valid phone number');
      return false;
    }
    
    if (!formData.password.trim()) {
      setError('Password is required');
      return false;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    
    return true;
  };

  const pickImage = () => {
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 800,
      maxWidth: 800,
    };
  
    // Make sure to use the correct method from ImagePicker
    ImagePicker.launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorMessage);
        Alert.alert('Error', 'Failed to select image');
      } else if (response.assets && response.assets[0]) {
        setFormData({ ...formData, hospitalImage: response.assets[0] });
      }
    });
  };

  const shakeAnimation = () => {
    // Reset the animation value before starting new animation
    shakeAnim.setValue(0);
    
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true })
    ]).start();
    
    return shakeAnim;
  };
  
  const handleSignup = async () => {
    Keyboard.dismiss();
    
    if (!validateForm()) {
      shakeAnimation();
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Create FormData object for multipart/form-data
      const apiFormData = new FormData();
      apiFormData.append('name', formData.hospitalName);
      apiFormData.append('email', formData.email);
      apiFormData.append('phone', formData.phone);
      apiFormData.append('password', formData.password);
      
      if (formData.hospitalImage) {
        // Ensure proper file extension
        const fileNameParts = formData.hospitalImage.fileName?.split('.') || ['image', 'jpg'];
        const extension = fileNameParts.length > 1 ? fileNameParts.pop() : 'jpg';
        const name = `hospital_image_${Date.now()}.${extension}`;
        
        // Create proper file object for the image
        apiFormData.append('image', {
          uri: Platform.OS === 'android' ? formData.hospitalImage.uri : formData.hospitalImage.uri.replace('file://', ''),
          type: formData.hospitalImage.type || `image/${extension}`,
          name: name
        });
      }
      
      console.log('Sending signup request with FormData');
      
      // Use a config object to explicitly set the Content-Type header
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };
      
      try {
        // Call the API directly instead of using authAPI.signup
        const response = await authAPI.post('/hospitals/signup', apiFormData, config);
        
        console.log('Signup successful:', response.data);
        Alert.alert(
          'Registration Successful',
          'We have sent a verification code to your email',
          [{ text: 'OK', onPress: () => navigation.navigate('OTP', { email: formData.email }) }]
        );
      } catch (apiError) {
        console.log('API Error:', apiError);
        
        // Check for specific error types
        if (apiError.message === 'Network Error' || apiError.response?.data?.isNetworkError) {
          setError('Network connection error. Please check your internet connection.');
        } else {
          // Display the error message from the server or a default message
          const errorMsg = apiError.response?.data?.message || 'An error occurred during registration';
          setError(errorMsg);
        }
        shakeAnimation();
      }
    } catch (error) {
      console.log('Signup error details:', error);
      setError('An unexpected error occurred');
      shakeAnimation();
    } finally {
      setLoading(false);
    }
  };
  
  const getInputStyle = (fieldName) => {
    return [
      styles.inputContainer,
      inputFocused === fieldName && styles.inputFocused,
      (fieldName === 'hospitalName' && formData.hospitalName) || 
      (fieldName === 'email' && formData.email) ||
      (fieldName === 'phone' && formData.phone) ||
      (fieldName === 'password' && formData.password)
        ? styles.inputWithText 
        : null
    ];
  };

  const backgroundInterpolate = backgroundAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#ffe6f0', '#fff0f5']
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View 
        style={[
          styles.container, 
          { backgroundColor: backgroundInterpolate }
        ]}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#fff0f5" />
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Decorative elements */}
              <View style={styles.decorContainer}>
                <View style={[styles.decorItem, styles.decorHeart]} />
                <View style={[styles.decorItem, styles.decorStar]} />
                <View style={[styles.decorItem, styles.decorCircle]} />
                <View style={[styles.decorItem, styles.decorSquare]} />
                <View style={[styles.decorItem, styles.decorTriangle]} />
                <View style={[styles.decorItem, styles.decorPlus]} />
              </View>
              
              {/* Medical Logo Image */}
              <Animated.View 
                style={[
                  styles.logoContainer,
                  {
                    opacity: logoAnim,
                    transform: [
                      { translateY: logoAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0]
                        })
                      }
                    ]
                  }
                ]}
              >
                <View style={styles.logoFrame}>
                  <View style={styles.logoInner}>
                    <View style={styles.medicalCross}>
                      <View style={styles.crossVertical} />
                      <View style={styles.crossHorizontal} />
                    </View>
                    <View style={styles.heartBeatLine}>
                      <View style={styles.lineSegment} />
                      <View style={styles.peakUp} />
                      <View style={styles.peakDown} />
                      <View style={styles.peakUp} />
                      <View style={styles.lineSegment} />
                    </View>
                </View>  
                </View>
              </Animated.View>

              
              
              {/* Card container */}
              <Animated.View 
                style={[
                  styles.cardContainer,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }]
                  }
                ]}
              >
                <View style={styles.headerSection}>
                  <Text style={styles.signupHeader}>Create Account</Text>
                  <Text style={styles.subtitle}>Join D3S-Healthcare network</Text>
                </View>
                
                {error ? (
                  <Animated.View 
                    style={[
                      styles.errorContainer,
                      { transform: [{ translateX: shakeAnim }] }
                    ]}
                  >
                    <Feather name="alert-circle" size={16} color="#fff" style={styles.errorIcon} />
                    <Text style={styles.errorText}>{error}</Text>
                  </Animated.View>
                ) : null}
                
                {/* Hospital Image Upload */}
                <View style={styles.imageUploadContainer}>
                  <TouchableOpacity 
                    style={styles.imageUpload} 
                    onPress={pickImage}
                    activeOpacity={0.8}
                  >
                    {formData.hospitalImage ? (
                      <Image 
                        source={{ uri: formData.hospitalImage.uri }} 
                        style={styles.previewImage} 
                      />
                    ) : (
                      <LinearGradient
                        colors={['#ffe6f0', '#ffb3d9']}
                        style={styles.uploadPlaceholder}
                      >
                        <Feather name="camera" size={28} color="#ff4a93" />
                        <Text style={styles.uploadText}>Upload Hospital Image</Text>
                      </LinearGradient>
                    )}
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Hospital Name</Text>
                  <View style={getInputStyle('hospitalName')}>
                    <Feather name="home" size={18} color="#e75a97" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter hospital name"
                      placeholderTextColor="#b99aa8"
                      value={formData.hospitalName}
                      onChangeText={(text) => setFormData({ ...formData, hospitalName: text })}
                      returnKeyType="next"
                      onSubmitEditing={() => emailInputRef.current?.focus()}
                      onFocus={() => setInputFocused('hospitalName')}
                      onBlur={() => setInputFocused(null)}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <View style={getInputStyle('email')}>
                    <Feather name="mail" size={18} color="#e75a97" style={styles.inputIcon} />
                    <TextInput
                      ref={emailInputRef}
                      style={styles.input}
                      placeholder="your.email@example.com"
                      placeholderTextColor="#b99aa8"
                      value={formData.email}
                      onChangeText={(text) => setFormData({ ...formData, email: text })}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      returnKeyType="next"
                      onSubmitEditing={() => phoneInputRef.current?.focus()}
                      onFocus={() => setInputFocused('email')}
                      onBlur={() => setInputFocused(null)}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Phone Number</Text>
                  <View style={getInputStyle('phone')}>
                    <Feather name="phone" size={18} color="#e75a97" style={styles.inputIcon} />
                    <TextInput
                      ref={phoneInputRef}
                      style={styles.input}
                      placeholder="Enter phone number"
                      placeholderTextColor="#b99aa8"
                      value={formData.phone}
                      onChangeText={(text) => setFormData({ ...formData, phone: text })}
                      keyboardType="phone-pad"
                      returnKeyType="next"
                      maxLength={15}
                      onSubmitEditing={() => passwordInputRef.current?.focus()}
                      onFocus={() => setInputFocused('phone')}
                      onBlur={() => setInputFocused(null)}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={getInputStyle('password')}>
                    <Feather name="lock" size={18} color="#e75a97" style={styles.inputIcon} />
                    <TextInput
                      ref={passwordInputRef}
                      style={styles.input}
                      placeholder="Create a password"
                      placeholderTextColor="#b99aa8"
                      value={formData.password}
                      onChangeText={(text) => setFormData({ ...formData, password: text })}
                      secureTextEntry={!showPassword}
                      returnKeyType="done"
                      onFocus={() => setInputFocused('password')}
                      onBlur={() => setInputFocused(null)}
                    />
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() => setShowPassword(!showPassword)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      {showPassword ? (
                        <Feather name="eye-off" size={18} color="#e75a97" />
                      ) : (
                        <Feather name="eye" size={18} color="#e75a97" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.signupButton, loading && styles.buttonDisabled]}
                  onPress={handleSignup}
                  disabled={loading}
                  activeOpacity={0.9}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.buttonText}>Create Account</Text>
                  )}
                </TouchableOpacity>
                
                <View style={styles.footer}>
                  <Text style={styles.footerText}>Already have an account? </Text>
                  <TouchableOpacity 
                    onPress={() => navigation.navigate('Login')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.loginText}>Sign In</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff0f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff0f5',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  logo: {
    width: 100,
    height: 70,
    objectFit: 'contain',
  },
  scrollContent: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 50,
    marginBottom:20,
    zIndex: 10,
  },
  logoFrame: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#e05c97',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  logoInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ffebf3',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  medicalCross: {
    position: 'absolute',
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  crossVertical: {
    width: 6,
    height: 28,
    backgroundColor: '#ff5c98',
    borderRadius: 3,
  },
  crossHorizontal: {
    position: 'absolute',
    width: 28,
    height: 6,
    backgroundColor: '#ff5c98',
    borderRadius: 3,
  },
  heartBeatLine: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    top: 44,
    height: 8,
  },
  lineSegment: {
    width: 10,
    height: 2,
    backgroundColor: '#ff5c98',
  },
  peakUp: {
    width: 10,
    height: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#ff5c98',
    borderLeftWidth: 1,
    borderLeftColor: 'transparent',
    borderRightWidth: 1,
    borderRightColor: 'transparent',
    transform: [{ rotate: '180deg' }],
  },
  peakDown: {
    width: 10,
    height: 8,
    borderTopWidth: 2,
    borderTopColor: '#ff5c98',
    borderLeftWidth: 1,
    borderLeftColor: 'transparent',
    borderRightWidth: 1,
    borderRightColor: 'transparent',
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
  cardContainer: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#e05c97',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 30,
  },
  headerSection: {
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  signupHeader: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff5a7f',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorIcon: {
    marginRight: 8,
  },
  errorText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    flex: 1,
  },
  imageUploadContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  imageUpload: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    backgroundColor: '#ffebf3',
    shadowColor: '#e05c97',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  uploadPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    marginTop: 10,
    fontSize: 13,
    color: '#e75a97',
    fontWeight: '500',
    textAlign: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#444',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f2d1e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    backgroundColor: '#fcfcff',
  },
  inputWithText: {
    borderColor: '#e0b7c7',
    backgroundColor: '#fffafb',
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
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Poppins-Regular',
    color: '#333',
  },
  eyeIcon: {
    padding: 6,
  },
  signupButton: {
    height: 54,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ff4a93',
    marginTop: 12,
    marginBottom: 20,
    shadowColor: '#e05c97',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  footerText: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  loginText: {
    color: '#ff4a93',
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    fontWeight: '600',
  },
});