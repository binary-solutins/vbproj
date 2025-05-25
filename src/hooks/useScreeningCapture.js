import { useState, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { SCREENING_STEPS } from '../constants/screeningConstants';

const useScreeningCapture = (selectedDoctor, selectedPatient) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [capturedImages, setCapturedImages] = useState({});
  const [cameraVisible, setCameraVisible] = useState(false);
  const [processingCapture, setProcessingCapture] = useState(false);
  // Add a camera ref to expose to parent components
  const cameraRef = useRef(null);

  const handleCapture = useCallback(async (imageData) => {
    if (processingCapture) return;

    try {
      setProcessingCapture(true);

      // Save image to state
      const step = SCREENING_STEPS[currentStep];
      setCapturedImages(prev => ({
        ...prev,
        [currentStep]: {
          uri: imageData.uri,
          base64: imageData.base64,
          side: step.side,
          position: step.position
        }
      }));

      // Move to next step or finish
      if (currentStep < SCREENING_STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        // All images captured, close camera view
        setCameraVisible(false);
      }
    } catch (error) {
      console.error('Error processing capture:', error);
      Alert.alert('Error', 'Failed to process captured image');
    } finally {
      setProcessingCapture(false);
    }
  }, [currentStep, processingCapture]);

  const startScreening = useCallback(() => {
    if (!selectedDoctor) {
      Alert.alert('Error', 'Please select a doctor');
      return;
    }

    if (!selectedPatient) {
      Alert.alert('Error', 'Please select a patient');
      return;
    }

    // Reset captured images
    setCapturedImages({});
    setCurrentStep(0);
    setCameraVisible(true);
  }, [selectedDoctor, selectedPatient]);

  const resetCapture = useCallback(() => {
    setCapturedImages({});
    setCurrentStep(0);
  }, []);

  // Expose trigger method for the remote button
  const triggerCapture = useCallback(() => {
    if (cameraRef.current && cameraVisible && !processingCapture) {
      cameraRef.current.takePicture();
    }
  }, [cameraVisible, processingCapture]);

  return {
    currentStep,
    cameraVisible,
    capturedImages,
    processingCapture,
    setCameraVisible,
    startScreening,
    handleCapture,
    resetCapture,
    triggerCapture,
    cameraRef
  };
};

export default useScreeningCapture;