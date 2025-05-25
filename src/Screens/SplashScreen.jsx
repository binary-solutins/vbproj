import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  Dimensions, 
  Image,
  StatusBar,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const COLORS = {
  primary: '#FF5CAD',    
  secondary: '#FF80B0',   
  tertiary: '#FFB6D0', 
  accent: '#FF3399',        
  background: '#ffffff',   
  text: '#333333',          
  lightText: '#888888', 
};

const SplashScreen = ({ navigation }) => {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const logoAnim = useRef(new Animated.Value(0)).current;
  
  // Doctor circles animations
  const centralDoctorScale = useRef(new Animated.Value(0.5)).current;
  const centralDoctorOpacity = useRef(new Animated.Value(0)).current;
  
  // Outer doctor circles
  const circle1Anim = useRef(new Animated.Value(0)).current;
  const circle2Anim = useRef(new Animated.Value(0)).current;
  const circle3Anim = useRef(new Animated.Value(0)).current;
  const circle4Anim = useRef(new Animated.Value(0)).current;
  const circle5Anim = useRef(new Animated.Value(0)).current;
  const circle6Anim = useRef(new Animated.Value(0)).current;
  
  // Ring animations
  const ring1Scale = useRef(new Animated.Value(0.2)).current;
  const ring1Opacity = useRef(new Animated.Value(0)).current;
  const ring2Scale = useRef(new Animated.Value(0.2)).current;
  const ring2Opacity = useRef(new Animated.Value(0)).current;
  const ring3Scale = useRef(new Animated.Value(0.2)).current;
  const ring3Opacity = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    const checkUserToken = async () => {
      const token = await AsyncStorage.getItem('userToken');

      setTimeout(() => {
        if (token) {
          navigation.navigate('Home');
        } else {
          navigation.navigate('Login');
        }
      }, 3500);
    };

    checkUserToken();
  }, []);
  // Decoration dots
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;
  const dot4Anim = useRef(new Animated.Value(0)).current;

  // Bottom pagination
  const paginationAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Stage 1: Logo and title animations
    Animated.parallel([
      Animated.timing(logoAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    ]).start();

    // Stage 2: Central circles and rings
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(ring1Scale, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(ring1Opacity, {
          toValue: 0.6,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(centralDoctorScale, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(centralDoctorOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    }, 500);

    // Stage 3: Outer rings
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(ring2Scale, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(ring2Opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ]).start();
    }, 800);

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(ring3Scale, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(ring3Opacity, {
          toValue: 0.2,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }, 1000);

    // Stage 4: Outer doctor circles with staggered timing
    const circleAnimations = [
      { anim: circle1Anim, delay: 1200 },
      { anim: circle2Anim, delay: 1300 },
      { anim: circle3Anim, delay: 1400 },
      { anim: circle4Anim, delay: 1500 },
      { anim: circle5Anim, delay: 1600 },
      { anim: circle6Anim, delay: 1700 },
    ];

    circleAnimations.forEach(({ anim, delay }) => {
      setTimeout(() => {
        Animated.spring(anim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }).start();
      }, delay);
    });

    // Stage 5: Decoration dots with staggered timing
    const dotAnimations = [
      { anim: dot1Anim, delay: 1800 },
      { anim: dot2Anim, delay: 1900 },
      { anim: dot3Anim, delay: 2000 },
      { anim: dot4Anim, delay: 2100 },
    ];

    dotAnimations.forEach(({ anim, delay }) => {
      setTimeout(() => {
        Animated.spring(anim, {
          toValue: 1,
          friction: 3,
          useNativeDriver: true,
        }).start();
      }, delay);
    });

    // Stage 6: Bottom pagination
    setTimeout(() => {
      Animated.timing(paginationAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 2200);

    // Auto navigate to Home screen after 3.5 seconds
   

  }, []);

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* Logo and tagline */}
      <Animated.View style={[
        styles.header, 
        { 
          opacity: logoAnim,
          transform: [{ translateY: logoAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [-20, 0]
          })}] 
        }
      ]}>
        <View style={styles.logoContainer}>
        <Image 
            source={require('../assets/logo.png')} 
            style={styles.logo}
          />
          <Text style={styles.tagline}>Early detection saves lives</Text>
        </View>
      </Animated.View>

      {/* Main content */}
      <Animated.View style={[
        styles.content,
        { 
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }]
        }
      ]}>
       <Text style={styles.title}>
  Take Control of Your Health{'\n'}with Early Detection
</Text>
<Text style={styles.subtitle}>
  Our smart device makes breast cancer screening{'\n'}
  simple, non-invasive, and accessible anytime, anywhere.
</Text>


        {/* Visualization area with doctors */}
        <View style={styles.visualizationContainer}>
          {/* Rings */}
          <Animated.View style={[
            styles.ring, 
            styles.ring3, 
            { 
              opacity: ring3Opacity,
              transform: [{ scale: ring3Scale }] 
            }
          ]} />
          <Animated.View style={[
            styles.ring, 
            styles.ring2, 
            { 
              opacity: ring2Opacity,
              transform: [{ scale: ring2Scale }] 
            }
          ]} />
          <Animated.View style={[
            styles.ring, 
            styles.ring1, 
            { 
              opacity: ring1Opacity,
              transform: [{ scale: ring1Scale }] 
            }
          ]} />

          {/* Central doctor */}
          <Animated.View style={[
            styles.doctorCircle,
            styles.centralDoctor,
            {
              opacity: centralDoctorOpacity,
              transform: [{ scale: centralDoctorScale }]
            }
          ]}>
            <Image 
              source={{ uri: 'https://randomuser.me/api/portraits/women/44.jpg' }}
              style={styles.doctorImage}
            />
          </Animated.View>

          {/* Outer doctors */}
          <Animated.View style={[
            styles.doctorCircle,
            styles.doctor1,
            {
              opacity: circle1Anim,
              transform: [
                { scale: circle1Anim },
                { translateX: circle1Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -80]
                })},
                { translateY: circle1Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -100]
                })}
              ]
            }
          ]}>
            <Image 
              source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }}
              style={styles.doctorImage}
            />
          </Animated.View>

          <Animated.View style={[
            styles.doctorCircle,
            styles.doctor2,
            {
              opacity: circle2Anim,
              transform: [
                { scale: circle2Anim },
                { translateX: circle2Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 100]
                })},
                { translateY: circle2Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -60]
                })}
              ]
            }
          ]}>
            <Image 
              source={{ uri: 'https://randomuser.me/api/portraits/women/68.jpg' }}
              style={styles.doctorImage}
            />
          </Animated.View>

          <Animated.View style={[
            styles.doctorCircle,
            styles.doctor3,
            {
              opacity: circle3Anim,
              transform: [
                { scale: circle3Anim },
                { translateX: circle3Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 120]
                })},
                { translateY: circle3Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 40]
                })}
              ]
            }
          ]}>
            <Image 
              source={{ uri: 'https://randomuser.me/api/portraits/men/45.jpg' }}
              style={styles.doctorImage}
            />
          </Animated.View>

          <Animated.View style={[
            styles.doctorCircle,
            styles.doctor4,
            {
              opacity: circle4Anim,
              transform: [
                { scale: circle4Anim },
                { translateX: circle4Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 80]
                })},
                { translateY: circle4Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 100]
                })}
              ]
            }
          ]}>
            <Image 
              source={{ uri: 'https://randomuser.me/api/portraits/women/22.jpg' }}
              style={styles.doctorImage}
            />
          </Animated.View>

          <Animated.View style={[
            styles.doctorCircle,
            styles.doctor5,
            {
              opacity: circle5Anim,
              transform: [
                { scale: circle5Anim },
                { translateX: circle5Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -100]
                })},
                { translateY: circle5Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 60]
                })}
              ]
            }
          ]}>
            <Image 
              source={{ uri: 'https://randomuser.me/api/portraits/women/90.jpg' }}
              style={styles.doctorImage}
            />
          </Animated.View>

          <Animated.View style={[
            styles.doctorCircle,
            styles.doctor6,
            {
              opacity: circle6Anim,
              transform: [
                { scale: circle6Anim },
                { translateX: circle6Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0]
                })},
                { translateY: circle6Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 130]
                })}
              ]
            }
          ]}>
            <Image 
              source={{ uri: 'https://randomuser.me/api/portraits/men/75.jpg' }}
              style={styles.doctorImage}
            />
          </Animated.View>

          {/* Decoration dots */}
          <Animated.View style={[
            styles.decorationDot,
            styles.pinkDot,
            {
              opacity: dot1Anim,
              transform: [
                { scale: dot1Anim },
                { translateX: -120 },
                { translateY: 20 }
              ]
            }
          ]} />

          <Animated.View style={[
            styles.decorationDot,
            styles.blueDot,
            {
              opacity: dot2Anim,
              transform: [
                { scale: dot2Anim },
                { translateX: 110 },
                { translateY: -90 }
              ]
            }
          ]} />

          <Animated.View style={[
            styles.decorationDot,
            styles.orangeDot,
            {
              opacity: dot3Anim,
              transform: [
                { scale: dot3Anim },
                { translateX: -40 },
                { translateY: -150 }
              ]
            }
          ]} />

          <Animated.View style={[
            styles.decorationDot,
            styles.greenDot,
            {
              opacity: dot4Anim,
              transform: [
                { scale: dot4Anim },
                { translateX: -130 },
                { translateY: -70 }
              ]
            }
          ]} />
        </View>
      </Animated.View>

      {/* Bottom pagination only */}
      <Animated.View style={[
        styles.bottom,
        {
          opacity: paginationAnim,
          transform: [{ translateY: paginationAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0]
          })}]
        }
      ]}>
        <View style={styles.pagination}>
          <View style={[styles.paginationDot, styles.activeDot]} />
          <View style={styles.paginationDot} />
          <View style={styles.paginationDot} />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 70,
    marginBottom: 8,
    objectFit: 'contain',
  },
  tagline: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.primary,
    marginTop: 5,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: COLORS.lightText,
    lineHeight: 20,
    marginBottom: 40,
  },
  visualizationContainer: {
    width: width * 0.8,
    height: width * 0.8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1,
    borderRadius: 1000,
  },
  ring1: {
    width: width * 0.4,
    height: width * 0.4,
    borderColor: COLORS.secondary,
  },
  ring2: {
    width: width * 0.55,
    height: width * 0.55,
    borderColor: COLORS.tertiary,
  },
  ring3: {
    width: width * 0.7,
    height: width * 0.7,
    borderColor: '#FFF0F5', // Very light pink
  },
  doctorCircle: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#fff',
    overflow: 'hidden',
  },
  centralDoctor: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: COLORS.primary,
    zIndex: 10,
  },
  doctorImage: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
  },
  decorationDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  pinkDot: {
    backgroundColor: COLORS.primary,
  },
  blueDot: {
    backgroundColor: COLORS.secondary,
  },
  orangeDot: {
    backgroundColor: COLORS.accent,
  },
  greenDot: {
    backgroundColor: COLORS.tertiary,
  },
  bottom: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    width: '100%',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
    marginRight: 8,
  },
  activeDot: {
    width: 24,
    backgroundColor: COLORS.primary,
  },
});

export default SplashScreen;