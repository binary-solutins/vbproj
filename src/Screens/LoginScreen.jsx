import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Animated,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  SafeAreaView,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { authAPI } from '../api/axios';
import Feather from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const [memberId, setMemberId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inputFocused, setInputFocused] = useState(null);
  const navigation = useNavigation();
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const backgroundAnim = useRef(new Animated.Value(0)).current;
  const logoAnim = useRef(new Animated.Value(0)).current;
  const errorShakeAnim = useRef(new Animated.Value(0)).current;
  
  // References
  const memberIdInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  
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
      Animated.timing(logoAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    ]).start();
  }, []);
  
  const validateMemberId = (id) => {
    return id.trim().length > 0;
  };

  const shakeAnimation = () => {
    errorShakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(errorShakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(errorShakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(errorShakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(errorShakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(errorShakeAnim, { toValue: 0, duration: 50, useNativeDriver: true })
    ]).start();
  };

  const handleLogin = async () => {
    Keyboard.dismiss();
    
    if (!memberId || !password) {
      setError('Please enter both member ID and password');
      shakeAnimation();
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await authAPI.login(memberId, password);
      // Handle successful login
      console.log('Login successful', response.data);
      navigation.navigate('Home'); 
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.response) {
        if (error.response.status === 401) {
          setError('Invalid credentials. Please check your ID and password.');
        } else {
          setError(error.response.data?.message || 'An error occurred. Please try again.');
        }
      } else {
        setError('Network error. Please check your connection and try again.');
      }
      
      shakeAnimation();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
          // User is already logged in, navigate to Home
          navigation.replace('Home');
        }
      } catch (error) {
        console.error('Error checking token:', error);
      }
    };

    checkToken();
  }, []);

  
  const focusPasswordInput = () => {
    passwordInputRef.current?.focus();
  };

  const backgroundInterpolate = backgroundAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#ffe6f0', '#fff0f5']
  });
  
  const getInputStyle = (fieldName) => {
    return [
      styles.inputContainer,
      inputFocused === fieldName && styles.inputFocused,
      (fieldName === 'memberId' && memberId) || (fieldName === 'password' && password) 
        ? styles.inputWithText 
        : null
    ];
  };

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
            <View style={styles.inner}>
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
               
                <Image
  source={require('../assets/biglogo.jpg')}
  style={styles.logo}
/>

              </Animated.View>
              
              {/* Card container */}
              <Animated.View 
                style={[
                  styles.cardContainer,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideUpAnim }]
                  }
                ]}
              >
                <View style={styles.headerSection}>
                  <Text style={styles.loginHeader}>Login</Text>
                </View>
                
                {/* Error Message Display - FIXED */}
                {error ? (
                  <Animated.View 
                    style={[
                      styles.errorContainer,
                      { transform: [{ translateX: errorShakeAnim }] }
                    ]}
                  >
                    <Feather name="alert-circle" size={16} color="#fff" style={styles.errorIcon} />
                    <Text style={styles.errorText}>{error}</Text>
                  </Animated.View>
                ) : null}
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Member ID</Text>
                  <View style={getInputStyle('memberId')}>
                    <TextInput
                      ref={memberIdInputRef}
                      style={styles.input}
                      placeholder="Enter your member ID"
                      placeholderTextColor="#b99aa8"
                      value={memberId}
                      onChangeText={setMemberId}
                      autoCapitalize="none"
                      returnKeyType="next"
                      onSubmitEditing={focusPasswordInput}
                      onFocus={() => setInputFocused('memberId')}
                      onBlur={() => setInputFocused(null)}
                    />
                    {memberId ? (
                      <View style={styles.validationIndicator}>
                        <View style={[
                          styles.validationDot,
                          validateMemberId(memberId) ? styles.validDot : styles.invalidDot
                        ]} />
                      </View>
                    ) : null}
                  </View>
                </View>
                
                <View style={styles.inputGroup}>
                  <View style={styles.passwordHeader}>
                    <Text style={styles.inputLabel}>Password</Text>
                    <TouchableOpacity
                      style={styles.forgotPassword}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={getInputStyle('password')}>
                    <TextInput
                      ref={passwordInputRef}
                      style={styles.input}
                      placeholder="Enter your password"
                      placeholderTextColor="#b99aa8"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      returnKeyType="done"
                      onSubmitEditing={handleLogin}
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
                  style={[styles.loginButton, loading && styles.buttonDisabled]}
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.9}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.buttonText}>Log in</Text>
                  )}
                </TouchableOpacity>
                
                <View style={styles.footer}>
                  <Text style={styles.footerText}>Don't have an account? </Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('signup')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.createAccountText}>Create an account</Text>
                  </TouchableOpacity>
                </View>
                
              </Animated.View>
              <Image
  source={{
    uri: 'https://static.wixstatic.com/media/048d7e_644b43b18e8347d6b2b4c65943725115~mv2.png/v1/fill/w_554,h_166,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/D3S%20Healthcare%20Logo.png',
  }}
  style={styles.logo}
/>
            </View>

           
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
  inner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
    zIndex: 10,
  },
 
  logo: {
    width: 200,
    height: 100,
    marginBottom: 8,
    objectFit: 'contain',
    borderRadius: 50,
  
  },
 
  heartBeatLine: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    top: 54,
    height: 10,
  },
  lineSegment: {
    width: 12,
    height: 2,
    backgroundColor: '#ff5c98',
  },
  peakUp: {
    width: 12,
    height: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#ff5c98',
    borderLeftWidth: 1,
    borderLeftColor: 'transparent',
    borderRightWidth: 1,
    borderRightColor: 'transparent',
    transform: [{ rotate: '180deg' }],
  },
  peakDown: {
    width: 12,
    height: 10,
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
    height: height * 0.3,
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
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#e05c97',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  headerSection: {
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  loginHeader: {
    fontSize: 26,
    fontFamily: 'Poppins-Bold',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
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
  inputGroup: {
    marginBottom: 20,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Poppins-Regular',
    color: '#333',
  },
  validationIndicator: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  validationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  validDot: {
    backgroundColor: '#4caf50',
  },
  invalidDot: {
    backgroundColor: '#ff5a7f',
  },
  eyeIcon: {
    padding: 6,
  },
  forgotPassword: {
    paddingVertical: 2,
  },
  forgotPasswordText: {
    color: '#ff4a93',
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
  },
  loginButton: {
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
  createAccountText: {
    color: '#ff4a93',
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    fontWeight: '600',
  },
});