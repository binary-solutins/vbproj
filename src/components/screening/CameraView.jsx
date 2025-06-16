import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet, 
  Dimensions, 
  SafeAreaView,
  StatusBar,
  Modal,
  Image,
  Alert
} from 'react-native';
import { RNCamera } from 'react-native-camera';
import Feather from 'react-native-vector-icons/Feather';
import ImageCropPicker from 'react-native-image-crop-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height + 40;

// Define step descriptions for the breast screening process
const STEP_DESCRIPTIONS = [
  { title: 'Left Breast - Top View', description: 'Position camera directly above the left breast', icon: 'arrow-up' },
  { title: 'Left Breast - Side View', description: 'Capture the left breast from the outer side', icon: 'arrow-left' },
  { title: 'Left Breast - Bottom View', description: 'Position camera below the left breast', icon: 'arrow-down' },
  { title: 'Right Breast - Top View', description: 'Position camera directly above the right breast', icon: 'arrow-up' },
  { title: 'Right Breast - Side View', description: 'Capture the right breast from the outer side', icon: 'arrow-right' },
  { title: 'Right Breast - Bottom View', description: 'Position camera below the right breast', icon: 'arrow-down' }
];

// Modified to use forwardRef and expose takePicture method
const CameraView = forwardRef(({ currentStep, processing, onCapture, onClose }, ref) => {
  const camera = useRef(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const insets = useSafeAreaInsets();
  
  // State variables for camera features
  const [showControls, setShowControls] = useState(false);
  const [flashMode, setFlashMode] = useState(RNCamera.Constants.FlashMode.auto);
  const [focusCoordinates, setFocusCoordinates] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  
  // Get current step info
  const stepInfo = STEP_DESCRIPTIONS[currentStep] || STEP_DESCRIPTIONS[0];

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    takePicture: handleCapture
  }));

  // Handle countdown for auto-capture
  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      handleCapture();
      setCountdown(null);
    }
  }, [countdown]);

  const startCountdown = () => {
    setShowControls(false);
    setCountdown(3);
  };

  const toggleControls = () => {
    setShowControls(!showControls);
  };

  const cycleFlashMode = () => {
    switch (flashMode) {
      case RNCamera.Constants.FlashMode.off:
        setFlashMode(RNCamera.Constants.FlashMode.on);
        break;
      case RNCamera.Constants.FlashMode.on:
        setFlashMode(RNCamera.Constants.FlashMode.auto);
        break;
      case RNCamera.Constants.FlashMode.auto:
        setFlashMode(RNCamera.Constants.FlashMode.off);
        break;
    }
  };

  const handleFocus = (event) => {
    const { locationX, locationY } = event.nativeEvent;
    
    setFocusCoordinates({
      x: locationX,
      y: locationY
    });
    
    setTimeout(() => {
      setFocusCoordinates(null);
    }, 3000);
  };

  const handleCapture = async () => {
    if (processing) return;
    
    try {
      const options = {
        quality: 0.85,
        base64: true,
        fixOrientation: true,
        forceUpOrientation: true,
      };
      
      const data = await camera.current.takePictureAsync(options);
      
      setCapturedImage(data);
      setShowCropModal(true);
    } catch (error) {
      console.error('Error capturing image:', error);
    }
  };
  
  const handleCropImage = async () => {
    try {
      const cropResult = await ImageCropPicker.openCropper({
        path: capturedImage.uri,
        width: 1000,
        height: 1000,
        cropperCircleOverlay: false,
        freeStyleCropEnabled: true,
        includeBase64: true,
      });
      
      const formattedCroppedImage = {
        uri: cropResult.path,
        width: cropResult.width,
        height: cropResult.height,
        base64: cropResult.data,
        type: 'image/jpeg'
      };
      
      setCroppedImage(formattedCroppedImage);
    } catch (error) {
      console.log('User cancelled cropping', error);
    }
  };
  
  const retakePhoto = () => {
    setCapturedImage(null);
    setCroppedImage(null);
    setShowCropModal(false);
  };
  
  const handleModalClose = () => {
    const finalImage = croppedImage || capturedImage;
    onCapture(finalImage);
    
    setShowCropModal(false);
    setCapturedImage(null);
    setCroppedImage(null);
  };

  const getFlashModeIcon = () => {
    switch (flashMode) {
      case RNCamera.Constants.FlashMode.on:
        return 'zap';
      case RNCamera.Constants.FlashMode.off:
        return 'zap-off';
      case RNCamera.Constants.FlashMode.auto:
        return 'zap';
      default:
        return 'zap';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden translucent backgroundColor="transparent" />
      
      <RNCamera
        ref={camera}
        style={styles.camera}
        type={RNCamera.Constants.Type.back}
        flashMode={flashMode}
        captureAudio={false}
        autoFocus={RNCamera.Constants.AutoFocus.on}
        autoFocusPointOfInterest={
          focusCoordinates ? {
            x: focusCoordinates.x / SCREEN_WIDTH,
            y: focusCoordinates.y / SCREEN_HEIGHT
          } : { x: 0.5, y: 0.5 }
        }
        onTap={handleFocus}
      >
        <View style={styles.overlay}>
          {/* Header */}
          <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
            <Text style={styles.stepText}>Step {currentStep + 1} of 6</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Feather name="x" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          {/* Step instruction panel */}
          <View style={styles.instructionPanel}>
            <Feather name={stepInfo.icon} size={28} color="#DB2777" style={styles.instructionIcon} />
            <View style={styles.instructionTextContainer}>
              <Text style={styles.instructionTitle}>{stepInfo.title}</Text>
              <Text style={styles.instructionDescription}>{stepInfo.description}</Text>
            </View>
          </View>
          
          {/* Manual focus indicator */}
          {focusCoordinates && (
            <View 
              style={[
                styles.focusIndicator, 
                { 
                  top: focusCoordinates.y - 40, 
                  left: focusCoordinates.x - 40 
                }
              ]} 
            />
          )}
          
          {/* Camera guide overlay */}
          <TouchableOpacity 
            style={styles.guideOverlay} 
            activeOpacity={1} 
            onPress={handleFocus}
          >
            <View style={styles.guideCircle} />
            <Text style={styles.touchToFocusText}>Tap anywhere to focus</Text>
          </TouchableOpacity>
          
          {/* Camera controls panel */}
          {showControls && (
            <View style={styles.controlsPanel}>
              <View style={styles.controlGroup}>
                <TouchableOpacity 
                  style={styles.controlButton}
                  onPress={cycleFlashMode}
                >
                  <Feather name={getFlashModeIcon()} size={24} color="#fff" />
                  <Text style={styles.controlText}>
                    {flashMode === RNCamera.Constants.FlashMode.on ? 'On' : 
                     flashMode === RNCamera.Constants.FlashMode.off ? 'Off' : 'Auto'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          {/* Bottom control panel */}
          <View style={[styles.bottomPanel, { paddingBottom: insets.bottom + 20 }]}>
            {processing ? (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="large" color="#DB2777" />
                <Text style={styles.processingText}>Processing...</Text>
              </View>
            ) : (
              <View style={styles.captureContainer}>
                {countdown !== null ? (
                  <View style={styles.countdownContainer}>
                    <Text style={styles.countdownText}>{countdown}</Text>
                  </View>
                ) : (
                  <>
                    <TouchableOpacity 
                      style={styles.timerButton}
                      onPress={startCountdown}
                    >
                      <Feather name="clock" size={24} color="#fff" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.captureButton}
                      onPress={handleCapture}
                    >
                      <View style={styles.captureButtonInner} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.controlsToggleButton}
                      onPress={toggleControls}
                    >
                      <Feather name="sliders" size={24} color="#fff" />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}
          </View>
          
          {/* Step progress indicators */}
          <View style={[styles.stepIndicatorContainer, { bottom: insets.bottom + 100 }]}>
            {STEP_DESCRIPTIONS.map((_, index) => (
              <View 
                key={index} 
                style={[
                  styles.stepIndicator, 
                  currentStep === index ? styles.activeStepIndicator : null
                ]} 
              />
            ))}
          </View>
        </View>
      </RNCamera>
      
      {/* Crop Modal */}
      <Modal
        visible={showCropModal}
        transparent={false}
        animationType="slide"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Image</Text>
            <TouchableOpacity onPress={retakePhoto} style={styles.modalCloseButton}>
              <Feather name="x" size={24} color="#DB2777" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.imagePreviewContainer}>
            <Image 
              source={{ uri: croppedImage ? croppedImage.uri : capturedImage?.uri }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          </View>
          
          <View style={styles.modalActionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleCropImage}
            >
              <Feather name="crop" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Crop</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.primaryButton]}
              onPress={handleModalClose}
            >
              <Feather name="check" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: 'black',
    zIndex: 999, // Increased z-index to ensure it's on top
  },
  camera: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(219, 39, 119, 0.8)',
    zIndex: 1,
  },
  stepText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionPanel: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1,
  },
  instructionIcon: {
    marginRight: 15,
  },
  instructionTextContainer: {
    flex: 1,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  instructionDescription: {
    fontSize: 14,
    color: '#666',
  },
  guideOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: 'rgba(219, 39, 119, 0.7)',
    borderStyle: 'dashed',
  },
  touchToFocusText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  focusIndicator: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#DB2777',
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  controlsPanel: {
    position: 'absolute',
    right: 20,
    top: '50%',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 15,
    borderRadius: 10,
    zIndex: 1,
  },
  controlGroup: {
    marginBottom: 15,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlText: {
    color: '#fff',
    marginLeft: 10,
    fontSize: 14,
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 20,
    zIndex: 1,
  },
  captureContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  processingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  processingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(219, 39, 119, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  captureButtonInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#DB2777',
  },
  timerButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  controlsToggleButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  countdownContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(219, 39, 119, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 40,
    color: '#fff',
    fontWeight: 'bold',
  },
  stepIndicatorContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 1,
  },
  stepIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 5,
  },
  activeStepIndicator: {
    backgroundColor: '#DB2777',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    padding: 5,
  },
  imagePreviewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    maxHeight: SCREEN_HEIGHT - 200,
  },
  modalActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#111',
  },
  actionButton: {
    backgroundColor: '#333',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 100,
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#DB2777',
  },
  actionButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default CameraView;