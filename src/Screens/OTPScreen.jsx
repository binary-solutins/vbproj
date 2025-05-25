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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { authAPI } from '../api/axios'; // Make sure this path matches your project structure

const { width, height } = Dimensions.get('window');

export default function VerifyOTPScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { email } = route.params || {};
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(30);
  const [inputFocused, setInputFocused] = useState(null);
  
  // References for input fields
  const inputRefs = useRef([]);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const backgroundAnim = useRef(new Animated.Value(0)).current;
  const logoAnim = useRef(new Animated.Value(0)).current;
  const errorShakeAnim = useRef(new Animated.Value(0)).current;
  const otpAnimations = useRef(otp.map(() => new Animated.Value(0))).current;

  // Check if email is provided
  useEffect(() => {
    if (!email) {
      setError('Email not provided. Please go back to the signup screen.');
    }
  }, [email]);

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
      Animated.timing(logoAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      ...otpAnimations.map((anim, index) => (
        Animated.timing(anim, {
          toValue: 1,
          duration: 600 + (index * 100),
          useNativeDriver: true,
          delay: 300 + (index * 80)
        })
      ))
    ]).start();
  }, []);

  // Timer countdown effect
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleOtpChange = (text, index) => {
    // Only allow digits
    if (/^\d*$/.test(text)) {
      const newOtp = [...otp];
      newOtp[index] = text;
      setOtp(newOtp);

      // Auto-focus next input
      if (text.length === 1 && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (e, index) => {
    // Handle backspace
    if (e.nativeEvent.key === 'Backspace') {
      if (otp[index] === '' && index > 0) {
        // If current input is empty and backspace is pressed, focus previous input
        inputRefs.current[index - 1]?.focus();
      } else if (otp[index] !== '') {
        // If there's a value, just clear it (handled by handleOtpChange)
        return;
      }
    }
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

  const handleVerifyOTP = async () => {
    Keyboard.dismiss();
    
    if (!email) {
      setError('Email not provided. Please go back to the signup screen.');
      shakeAnimation();
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      const otpString = otp.join('');
      
      if (otpString.length !== 6) {
        setError('Please enter all 6 digits of the OTP');
        setLoading(false);
        shakeAnimation();
        return;
      }
      
      // Call your API
      try {
        const response = await authAPI.post('/hospitals/verify-otp', {
          email: email,
          otp: otpString
        });
        
        // Navigate to Home screen on success
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        });
      } catch (apiError) {
        console.error('OTP verification error:', apiError);
        setError(apiError.response?.data?.message || 'Invalid OTP. Please try again.');
        shakeAnimation();
      }
    } catch (error) {
      console.error('Verification process error:', error);
      setError('Something went wrong. Please try again.');
      shakeAnimation();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!email) {
      setError('Email not provided. Please go back to the signup screen.');
      shakeAnimation();
      return;
    }
    
    try {
      setLoading(true);
      // Here you would call your resend OTP API endpoint
      // const response = await authAPI.resendOTP(email);
      
      // For now, just simulate success
      setTimer(30);
      setError('');
      setOtp(['', '', '', '', '', '']);
      
      // Focus first input
      inputRefs.current[0]?.focus();
    } catch (error) {
      setError('Failed to resend OTP. Please try again.');
      shakeAnimation();
    } finally {
      setLoading(false);
    }
  };

  // Format the email for display
  const maskEmail = (email) => {
    if (!email) return '';
    const [username, domain] = email.split('@');
    const maskedUsername = username.charAt(0) + 
                         '*'.repeat(Math.min(username.length - 2, 3)) + 
                         username.charAt(username.length - 1);
    return `${maskedUsername}@${domain}`;
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
              
              {/* Medical Logo */}
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
                <Text style={styles.appNameText}>Br-Scan</Text>
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
                  <Text style={styles.verifyHeader}>Verify OTP</Text>
                  <Text style={styles.subtitle}>
                    Enter the verification code sent to{'\n'}
                    <Text style={styles.emailText}>{maskEmail(email)}</Text>
                  </Text>
                </View>
                
                {/* Error Message Display */}
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
                
                {/* OTP Input Fields */}
                <View style={styles.otpContainer}>
                  {otp.map((digit, index) => (
                    <Animated.View 
                      key={index}
                      style={[
                        styles.otpInputWrapper,
                        {
                          opacity: otpAnimations[index],
                          transform: [
                            { translateY: otpAnimations[index].interpolate({
                                inputRange: [0, 1],
                                outputRange: [20, 0]
                              })
                            }
                          ]
                        }
                      ]}
                    >
                      <TextInput
                        ref={(ref) => (inputRefs.current[index] = ref)}
                        style={[
                          styles.otpInput,
                          inputFocused === `otp-${index}` && styles.otpInputFocused,
                          digit && styles.otpInputWithValue
                        ]}
                        maxLength={1}
                        keyboardType="number-pad"
                        value={digit}
                        onChangeText={(text) => handleOtpChange(text, index)}
                        onKeyPress={(e) => handleKeyPress(e, index)}
                        autoFocus={index === 0}
                        selectTextOnFocus
                        onFocus={() => setInputFocused(`otp-${index}`)}
                        onBlur={() => setInputFocused(null)}
                      />
                    </Animated.View>
                  ))}
                </View>
                
                {/* Verify Button */}
                <TouchableOpacity
                  style={[styles.verifyButton, (loading || otp.some(digit => !digit)) && styles.buttonDisabled]}
                  onPress={handleVerifyOTP}
                  disabled={loading || otp.some(digit => !digit)}
                  activeOpacity={0.9}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.buttonText}>Verify OTP</Text>
                  )}
                </TouchableOpacity>
                
                {/* Resend Option */}
                <View style={styles.footer}>
                  <Text style={styles.footerText}>Didn't receive the code? </Text>
                  {timer > 0 ? (
                    <Text style={styles.timerText}>{`Resend in ${timer}s`}</Text>
                  ) : (
                    <TouchableOpacity 
                      onPress={handleResendOTP} 
                      disabled={loading}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.resendText, loading && styles.textDisabled]}>
                        Resend OTP
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </Animated.View>
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
  logoFrame: {
    width: 100,
    height: 100,
    borderRadius: 50,
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
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffebf3',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  medicalCross: {
    position: 'absolute',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  crossVertical: {
    width: 8,
    height: 36,
    backgroundColor: '#ff5c98',
    borderRadius: 4,
  },
  crossHorizontal: {
    position: 'absolute',
    width: 36,
    height: 8,
    backgroundColor: '#ff5c98',
    borderRadius: 4,
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
  appNameText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e75a97',
    marginTop: 10,
    marginBottom: 10
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
  verifyHeader: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 22,
    marginTop: 8,
  },
  emailText: {
    fontWeight: '600',
    color: '#ff69b4',
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
    flex: 1,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    marginTop: 16,
  },
  otpInputWrapper: {
    margin: 4,
  },
  otpInput: {
    width: 40,
    height: 50,
    borderWidth: 2,
    borderColor: '#f2d1e0',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '600',
    backgroundColor: '#fcfcff',
    color: '#0f172a',
    shadowColor: '#e05c97',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  otpInputFocused: {
    borderColor: '#ff4a93',
    backgroundColor: '#fffbfd',
    shadowColor: '#ff4a93',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  otpInputWithValue: {
    borderColor: '#e75a97',
    backgroundColor: '#fffafb',
  },
  verifyButton: {
    height: 54,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ff4a93',
    marginTop: 8,
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
  },
  timerText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  resendText: {
    color: '#ff4a93',
    fontSize: 14,
    fontWeight: '600',
  },
  textDisabled: {
    opacity: 0.7,
  }
});