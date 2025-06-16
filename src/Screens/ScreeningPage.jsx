import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  ScrollView,
  Alert,
  StatusBar,
  StyleSheet,
  AppState,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {authAPI} from '../api/axios';
import ScreeningHeader from '../components/screening/ScreeningHeader';
import SelectionSection from '../components/screening/SelectionSection';
import DeviceConnectionSection from '../components/screening/DeviceConnectionSection';
import InformationSection from '../components/screening/InformationSection';
import ProgressSection from '../components/screening/ProgressSection';
import ActionButtons from '../components/screening/ActionButtons';
import CameraView from '../components/screening/CameraView';
import UploadStatusModal from '../components/screening/UploadStatusModal';
import LoadingOverlay from '../components/common/LoadingOverlay';

import useScreeningCapture from '../hooks/useScreeningCapture';
import useReportGeneration from '../hooks/useReportGeneration';
import {SCREENING_STEPS} from '../constants/screeningConstants';
import useBluetoothClassicDevice from '../hooks/useBluetoothDevice';

const BreastScreeningScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);

  // Reference to camera component to trigger capture
  const cameraRef = useRef(null);
  const captureTimeoutRef = useRef(null);
  const isCapturingRef = useRef(false);

  const {
    bluetoothEnabled,
    bluetoothConnected,
    scanningBluetooth,
    bluetoothDevice,
    devicePaired,
    permissionsGranted,
    pairedDevices,
    connectToBluetoothDevice,
    refreshPairedDevices,
    scanForDevices,
  } = useBluetoothClassicDevice();

  const {
    currentStep,
    cameraVisible,
    capturedImages,
    processingCapture,
    setCameraVisible,
    startScreening,
    handleCapture,
    resetCapture,
  } = useScreeningCapture(selectedDoctor, selectedPatient);

  const {
    reportUrl,
    generatingReport,
    uploadStatus,
    uploadProgress,
    uploadError,
    setUploadStatus,
    generateAndUploadReport,
  } = useReportGeneration(capturedImages, selectedDoctor, selectedPatient);

  // Handle app state changes to refresh paired devices
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground, refresh paired devices
        if (permissionsGranted) {
          setTimeout(() => {
            scanForDevices();
          }, 1000);
        }
      }
      setAppState(nextAppState);
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      if (subscription?.remove) {
        subscription.remove();
      }
    };
  }, [appState, permissionsGranted, scanForDevices]);

  // Refresh paired devices when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (permissionsGranted) {
        scanForDevices();
      }
    }, [permissionsGranted, scanForDevices])
  );

  useEffect(() => {
    loadData();

    return () => {
      // Cleanup timeout if component unmounts
      if (captureTimeoutRef.current) {
        clearTimeout(captureTimeoutRef.current);
      }
    };
  }, []);

  // Handle automatic report generation when all images are captured
  useEffect(() => {
    const handleReportGeneration = async () => {
      // Check if all images have been captured and report hasn't been generated yet
      if (
        capturedImages &&
        Object.keys(capturedImages).length === SCREENING_STEPS.length &&
        !reportGenerated &&
        !generatingReport &&
        selectedDoctor &&
        selectedPatient
      ) {
        setReportGenerated(true);

        try {
          await generateAndUploadReport();
        } catch (error) {
          setReportGenerated(false); // Reset flag on error to allow retry
          Alert.alert(
            'Report Generation Failed',
            'Failed to generate report: ' +
              error.message +
              '\n\nYou can try again using the "Generate Report" button.',
            [{text: 'OK'}],
          );
        }
      }
    };

    handleReportGeneration();
  }, [
    capturedImages,
    selectedDoctor,
    selectedPatient,
    reportGenerated,
    generatingReport,
    generateAndUploadReport,
  ]);

  // Enhanced capture button handler - matches working version logic
  const handleDeviceCaptureButton = useCallback(() => {
    console.log('🚀 === DEVICE CAPTURE BUTTON PRESSED ===');
    console.log('🔍 Camera visible:', cameraVisible);
    console.log('🔍 Processing capture:', processingCapture);
    console.log('🔍 Camera ref available:', !!cameraRef.current);
    console.log('🔍 Is capturing:', isCapturingRef.current);

    // Prevent multiple rapid captures
    if (isCapturingRef.current || processingCapture) {
      console.log('❌ Capture blocked - already in progress');
      return;
    }

    // Check if we're in camera mode
    if (!cameraVisible) {
      console.log('❌ Capture blocked - camera not visible');
      return;
    }

    // Check camera ref
    if (!cameraRef.current) {
      console.log('❌ Capture blocked - camera ref not available');
      return;
    }

    try {
      isCapturingRef.current = true;
      console.log('📸 Triggering camera capture...');
      
      // Use the working version's approach - directly call takePicture
      const cameraInstance = cameraRef.current;
      
      if (typeof cameraInstance.takePicture === 'function') {
        console.log('📸 Using takePicture method');
        cameraInstance.takePicture();
      } else {
        console.log('📸 Fallback: calling handleCapture directly');
        handleCapture();
      }

      console.log('🟢 Capture method called successfully');

    } catch (error) {
      console.error('❌ Error in camera capture:', error);
    } finally {
      // Reset capturing flag after delay
      setTimeout(() => {
        isCapturingRef.current = false;
        console.log('🔄 Capture flag reset');
      }, 2000);
    }
  }, [cameraVisible, processingCapture, handleCapture]);

  // Setup Bluetooth button listener - simplified version that matches working code
  const setupBluetoothButtonListener = useCallback(() => {
    console.log('🔵 Setting up Bluetooth data listener...');
    
    if (!bluetoothDevice || !bluetoothConnected) {
      console.log('❌ Device not ready for data listener');
      return;
    }

    // Clean up any existing subscription first
    if (bluetoothDevice._screenDataSubscription) {
      console.log('🔵 Removing existing data subscription...');
      bluetoothDevice._screenDataSubscription.remove();
      bluetoothDevice._screenDataSubscription = null;
    }

    try {
      console.log('🔵 Creating new data subscription...');
      
      const dataSubscription = bluetoothDevice.onDataReceived(data => {
        try {
          console.log('📡 Raw Bluetooth data received:', data);
          
          // Handle different data formats - simplified approach from working version
          let dataStr = '';
          if (data) {
            if (typeof data === 'string') {
              dataStr = data;
            } else if (data.data) {
              dataStr = data.data.toString ? data.data.toString() : data.data;
            } else {
              dataStr = data.toString ? data.toString() : '';
            }
          }

          console.log('📡 Processed data string:', JSON.stringify(dataStr));
          
          // Clean the data
          const cleanData = dataStr.trim();
          
          if (cleanData.length === 0) {
            console.log('⚠️ Empty data received, ignoring...');
            return;
          }

          // Use the working version's trigger detection logic
          const shouldCapture = 
            cleanData.includes('CAPTURE') || 
            cleanData === '1' || 
            cleanData.trim() !== '';

          console.log('🔍 Should capture:', shouldCapture, 'Data:', cleanData);

          if (shouldCapture) {
            console.log('🟢 Capture trigger detected:', cleanData);
            
            // Use setTimeout like in the working version
            setTimeout(() => {
              handleDeviceCaptureButton();
            }, 0);
          }
        } catch (error) {
          console.error('❌ Error processing Bluetooth data:', error);
        }
      });

      // Store subscription for cleanup
      bluetoothDevice._screenDataSubscription = dataSubscription;
      console.log('🟢 Bluetooth data listener setup complete');

    } catch (error) {
      console.error('❌ Error setting up Bluetooth data subscription:', error);
    }
  }, [bluetoothDevice, bluetoothConnected, handleDeviceCaptureButton]);

  // Set up data listener for the Bluetooth device capture button - matches working version
  useEffect(() => {
    console.log('🔵 Bluetooth listener effect triggered...');
    console.log('🔵 Bluetooth connected:', bluetoothConnected);
    console.log('🔵 Bluetooth device available:', !!bluetoothDevice);
    
    if (bluetoothDevice && bluetoothConnected) {
      // Add a longer delay like in working version for device stability
      const timeoutId = setTimeout(() => {
        console.log('🔵 Setting up Bluetooth listener after delay...');
        setupBluetoothButtonListener();
      }, 2000);

      return () => {
        clearTimeout(timeoutId);
        if (bluetoothDevice && bluetoothDevice._screenDataSubscription) {
          console.log('🔵 Cleaning up Bluetooth data subscription...');
          bluetoothDevice._screenDataSubscription.remove();
          bluetoothDevice._screenDataSubscription = null;
        }
      };
    }
  }, [bluetoothDevice, bluetoothConnected, setupBluetoothButtonListener]);

  const loadData = async () => {
    try {
      setLoading(true);

      const userData = JSON.parse(await AsyncStorage.getItem('userData'));

      if (!userData || !userData.id) {
        Alert.alert('Error', 'User data not found. Please log in again.');
        return;
      }

      // Load doctors and patients with error handling
      try {
        const doctorsResponse = await authAPI.get(
          `/doctors/hospital/${userData.id}`,
        );
        setDoctors(doctorsResponse?.data?.doctors || []);
      } catch (error) {
        console.error('Error loading doctors:', error);
        setDoctors([]);
      }

      try {
        const patientsResponse = await authAPI.get(
          `/patients/hospital/${userData.id}`,
        );
        setPatients(patientsResponse?.data || []);
      } catch (error) {
        console.error('Error loading patients:', error);
        setPatients([]);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualReportGeneration = async () => {
    if (Object.keys(capturedImages).length !== SCREENING_STEPS.length) {
      Alert.alert(
        'Error',
        'Please capture all 6 images before generating report.',
      );
      return;
    }

    try {
      await generateAndUploadReport();
    } catch (error) {
      Alert.alert('Error', 'Failed to generate report: ' + error.message);
    }
  };

  const handleStartNewScreening = () => {
    // Reset all states for new screening
    resetCapture();
    setReportGenerated(false);
    setUploadStatus('idle');
    isCapturingRef.current = false;
    
    if (captureTimeoutRef.current) {
      clearTimeout(captureTimeoutRef.current);
    }
  };

  const handleConnectBluetooth = async () => {
    try {
      await connectToBluetoothDevice();
    } catch (error) {
      console.error('Connection error:', error);
      Alert.alert(
        'Connection Error',
        'Failed to connect to Bluetooth device. Please try again.',
      );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#DB2777" />

      <ScreeningHeader navigation={navigation} />

      <UploadStatusModal
        status={uploadStatus}
        progress={uploadProgress}
        error={uploadError}
        setStatus={setUploadStatus}
        onRetry={handleManualReportGeneration}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}>
        <SelectionSection
          doctors={doctors}
          patients={patients}
          selectedDoctor={selectedDoctor}
          selectedPatient={selectedPatient}
          setSelectedDoctor={setSelectedDoctor}
          setSelectedPatient={setSelectedPatient}
        />

        <DeviceConnectionSection
          connected={bluetoothConnected}
          scanning={scanningBluetooth}
          paired={devicePaired}
          onConnect={handleConnectBluetooth}
          onRefresh={scanForDevices}
        />

        <ActionButtons
          canStart={selectedDoctor && selectedPatient && !reportGenerated}
          isGenerating={generatingReport}
          hasReport={reportUrl !== null}
          onStart={startScreening}
          onGenerateReport={handleManualReportGeneration}
          onStartNew={handleStartNewScreening}
          capturedImagesCount={Object.keys(capturedImages).length}
          reportGenerated={reportGenerated}
        />

        <InformationSection />

        {Object.keys(capturedImages).length > 0 && (
          <ProgressSection capturedImages={capturedImages} />
        )}
      </ScrollView>

      {cameraVisible && (
        <CameraView
          ref={cameraRef}
          currentStep={currentStep}
          processing={processingCapture}
          onCapture={handleCapture}
          onClose={() => setCameraVisible(false)}
          bluetoothConnected={bluetoothConnected}
        />
      )}

      {loading && <LoadingOverlay message="Loading..." />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
});

export default BreastScreeningScreen;