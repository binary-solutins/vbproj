import { Animated, Easing } from 'react-native';

/**
 * Collection of utility functions for handling animations properly
 * with correct driver separation
 */

/**
 * Creates a shadow animation that ensures JS driver is used
 * @param {Animated.Value} value - Animated value to drive shadow opacity
 * @param {number} toValue - Target value
 * @param {number} duration - Animation duration in ms
 * @returns {Animated.CompositeAnimation} - Animation that can be started/stopped
 */
export const createShadowAnimation = (value, toValue, duration = 300) => {
  return Animated.timing(value, {
    toValue,
    duration,
    useNativeDriver: false, // Must be false for shadow properties
    easing: Easing.inOut(Easing.ease)
  });
};

/**
 * Creates a transform/opacity animation that uses native driver
 * @param {Animated.Value} value - Animated value to drive the animation
 * @param {number} toValue - Target value
 * @param {number} duration - Animation duration in ms
 * @param {Easing} easing - Easing function to use
 * @returns {Animated.CompositeAnimation} - Animation that can be started/stopped
 */
export const createTransformAnimation = (value, toValue, duration = 300, easing = Easing.inOut(Easing.ease)) => {
  return Animated.timing(value, {
    toValue,
    duration,
    useNativeDriver: true, // Use native driver for performance
    easing
  });
};

/**
 * Creates a shake animation sequence using the native driver
 * @param {Animated.Value} translateX - Animated value to drive horizontal translation
 * @param {number} intensity - Shake intensity (distance in pixels)
 * @param {number} duration - Duration of each shake step
 * @returns {Animated.CompositeAnimation} - Animation that can be started
 */
export const createShakeAnimation = (translateX, intensity = 6, duration = 50) => {
  return Animated.sequence([
    Animated.timing(translateX, {
      toValue: -intensity,
      duration,
      useNativeDriver: true,
    }),
    Animated.timing(translateX, {
      toValue: intensity,
      duration,
      useNativeDriver: true,
    }),
    Animated.timing(translateX, {
      toValue: -intensity,
      duration,
      useNativeDriver: true,
    }),
    Animated.timing(translateX, {
      toValue: intensity,
      duration,
      useNativeDriver: true,
    }),
    Animated.timing(translateX, {
      toValue: 0,
      duration,
      useNativeDriver: true,
    }),
  ]);
};

/**
 * Creates a layout animation that must use JS driver
 * @param {Animated.Value} value - Animated value to drive height/width
 * @param {number} toValue - Target value
 * @param {number} duration - Animation duration in ms
 * @returns {Animated.CompositeAnimation} - Animation that can be started/stopped
 */
export const createLayoutAnimation = (value, toValue, duration = 300) => {
  return Animated.timing(value, {
    toValue,
    duration,
    useNativeDriver: false, // Must be false for layout properties
    easing: Easing.inOut(Easing.cubic)
  });
};

/**
 * Creates a repeating wave animation using the native driver
 * @param {Animated.Value} value - Animated value to drive the wave
 * @param {number} duration - Time for one complete cycle
 * @returns {Animated.CompositeAnimation} - Animation that can be started
 */
export const createWaveAnimation = (value, duration = 10000) => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(value, {
        toValue: 1,
        duration: duration / 2,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.sin)
      }),
      Animated.timing(value, {
        toValue: 0,
        duration: duration / 2,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.sin)
      }),
    ])
  );
};