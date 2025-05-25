import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, Alert, StatusBar, StyleSheet, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../api/axios';
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
import { SCREENING_STEPS } from '../constants/screeningConstants';
import useBluetoothClassicDevice from '../hooks/useBluetoothDevice';

const BreastScreeningScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [reportGenerated, setReportGenerated] = useState(false);
  
  // Reference to camera component to trigger capture
  const cameraRef = useRef(null);

  const {
    scanForDevices,
    bluetoothConnected,
    scanningBluetooth,
    bluetoothDevice,
    connectToBluetoothDevice
  } = useBluetoothClassicDevice();
  
  // Scan for devices when the component mounts
  useEffect(() => {
    scanForDevices();
  }, []);

  const {
    currentStep,
    cameraVisible,
    capturedImages,
    processingCapture,
    setCameraVisible,
    startScreening,
    handleCapture,
    resetCapture
  } = useScreeningCapture(selectedDoctor, selectedPatient);

  const {
    reportUrl,
    generatingReport,
    uploadStatus,
    uploadProgress,
    uploadError,
    setUploadStatus,
    generateAndUploadReport
  } = useReportGeneration(capturedImages, selectedDoctor, selectedPatient);

  useEffect(() => {
    loadData();
    
    return () => {
      // Cleanup happens in the useBluetoothClassicDevice hook
    };
  }, []);

  // Handle automatic report generation when all images are captured
  useEffect(() => {
    const handleReportGeneration = async () => {
      // Check if all images have been captured and report hasn't been generated yet
      if (capturedImages && 
          Object.keys(capturedImages).length === SCREENING_STEPS.length && 
          !reportGenerated && 
          !generatingReport &&
          selectedDoctor && 
          selectedPatient) {
        
        console.log('[Auto Report Generation] All images captured, generating report...');
        setReportGenerated(true);
        
        try {
          await generateAndUploadReport();
          console.log('[Auto Report Generation] Report generated successfully');
        } catch (error) {
          console.error('[Auto Report Generation] Error:', error);
          setReportGenerated(false); // Reset flag on error to allow retry
          Alert.alert(
            'Report Generation Failed', 
            'Failed to generate report: ' + error.message + '\n\nYou can try again using the "Generate Report" button.',
            [{ text: 'OK' }]
          );
        }
      }
    };

    handleReportGeneration();
  }, [capturedImages, selectedDoctor, selectedPatient, reportGenerated, generatingReport]);
  
  // Set up data listener for the Bluetooth device capture button
  useEffect(() => {
    if (bluetoothDevice && bluetoothConnected) {
      setupBluetoothButtonListener();
    }
    
    // Cleanup function
    return () => {
      if (bluetoothDevice && bluetoothDevice._screenDataSubscription) {
        bluetoothDevice._screenDataSubscription.remove();
      }
    };
  }, [bluetoothDevice, bluetoothConnected, cameraVisible, processingCapture]);

  // Handler for device capture button press
  const handleDeviceCaptureButton = () => {
    console.log('Device button press handler triggered');
    
    // First, check if we're in camera mode and if the camera ref is valid
    if (cameraVisible && cameraRef.current) {
      console.log('Taking picture via camera ref');
      cameraRef.current.takePicture();
    } 
  };

  const setupBluetoothButtonListener = () => {
    if (!bluetoothDevice) return;
    
    // Clean up any existing subscription first
    if (bluetoothDevice._screenDataSubscription) {
      bluetoothDevice._screenDataSubscription.remove();
    }
    
    // Set up new data subscription
    const dataSubscription = bluetoothDevice.onDataReceived(data => {
      console.log('Data received from device:', data);
      
      // Check if the data indicates a button press
      // The exact format depends on your device's output
      const dataStr = data.data ? data.data.toString() : '';
      
      if (dataStr.includes('CAPTURE') || dataStr === '1' || dataStr.trim() !== '') {
        console.log('Capture button pressed on device!');
        // Use setTimeout to ensure this runs on the next JS event loop cycle
        // This helps avoid potential race conditions with component rendering
        setTimeout(() => {
          handleDeviceCaptureButton();
        }, 0);
      }
    });
    
    // Store subscription for cleanup
    bluetoothDevice._screenDataSubscription = dataSubscription;
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const userData = JSON.parse(await AsyncStorage.getItem('userData'));
      
      if (!userData || !userData.id) {
        Alert.alert('Error', 'User data not found. Please log in again.');
        // Navigate to login if needed
        return;
      }

      // Adjust these endpoints to match your actual API routes
      const doctorsResponse = await authAPI.get(`/doctors/hospital/${userData.id}`);
      setDoctors(doctorsResponse?.data || []);

      const patientsResponse = await authAPI.get(`/patients/hospital/${userData.id}`);
      setPatients(patientsResponse?.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load doctors and patients data');
    } finally {
      setLoading(false);
    }
  };

  const handleManualReportGeneration = async () => {
    if (Object.keys(capturedImages).length !== SCREENING_STEPS.length) {
      Alert.alert('Error', 'Please capture all 6 images before generating report.');
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

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
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
          onConnect={connectToBluetoothDevice}
        />

        <InformationSection />

        {Object.keys(capturedImages).length > 0 && (
          <ProgressSection 
            capturedImages={capturedImages} 
          />
        )}

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