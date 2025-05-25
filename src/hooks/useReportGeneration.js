import { useState, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import RNFetchBlob from 'rn-fetch-blob';

const useReportGeneration = (capturedImages, selectedDoctor, selectedPatient) => {
  const navigation = useNavigation();
  const [generatingReport, setGeneratingReport] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [reportUrl, setReportUrl] = useState(null);
  const [localPdfPath, setLocalPdfPath] = useState(null);

  const generateAndUploadReport = async () => {
    try {
      console.log('[Report Generation] Starting process...');
      setGeneratingReport(true);
      setUploadStatus('uploading');
      setUploadProgress(0);
      setUploadError('');

      if (!selectedDoctor || !selectedPatient || Object.keys(capturedImages).length !== 6) {
        console.error('[Report Generation] Missing doctor, patient, or images');
        throw new Error('Missing required information for report generation');
      }

      console.log('[Report Generation] Preparing FormData...');
      const formData = new FormData();
      formData.append('patientId', selectedPatient.id);
      formData.append('doctorId', selectedDoctor.id);
      formData.append('hospitalId', selectedPatient.hospitalId);
      formData.append('title', 'Breast Cancer Screening Report');
      formData.append('description', 'Breast cancer screening with 6 images');

      // Attach images
      Object.entries({
        leftTopImage: capturedImages[0],
        leftCenterImage: capturedImages[1],
        leftBottomImage: capturedImages[2],
        rightTopImage: capturedImages[3],
        rightCenterImage: capturedImages[4],
        rightBottomImage: capturedImages[5],
      }).forEach(([key, image], index) => {
        console.log(`[FormData] Appending image ${key}:`, image.uri);
        formData.append(key, {
          uri: image.uri,
          type: 'image/jpeg',
          name: `${key}.jpg`
        });
      });

      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        console.error('[Auth] No token found in AsyncStorage');
        throw new Error('Authentication token missing');
      }

      console.log('[Report Generation] Sending API request...');
      const response = await axios.post(
        'https://d3s-backend-dva9.onrender.com/api/reports/breast-cancer',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`[Upload Progress] ${progress}%`);
            setUploadProgress(Math.min(progress, 100));
          },
        }
      );

      setUploadProgress(100);
      setUploadStatus('success');

      const fileUrl = response.data?.report?.fileUrl;
      console.log('[Report Generation] Report uploaded successfully. File URL:', fileUrl);

      if (fileUrl) {
        setReportUrl(fileUrl);
        
        // Download PDF and navigate to PatientReports
        await downloadAndNavigateToReports(response.data.report);
      }

      return fileUrl;
    } catch (error) {
      console.error('[Report Generation Error]', {
        message: error.message,
        response: error.response?.data,
        stack: error.stack,
      });
      setUploadStatus('error');
      setUploadError(error.response?.data?.message || 'Failed to generate report');
      throw error;
    } finally {
      setGeneratingReport(false);
      console.log('[Report Generation] Process ended.');
    }
  };

  const downloadAndNavigateToReports = async (report) => {
    try {
      console.log('[PDF Download] Starting download for report:', report.id);
      
      const { config, fs } = RNFetchBlob;
      const fileName = report.fileName || `report_${Date.now()}.pdf`;
      const filePath = `${fs.dirs.CacheDir}/${fileName}`;

      console.log('[PDF Download] Downloading to:', filePath);
      
      const response = await config({
        fileCache: true,
        path: filePath,
      }).fetch('GET', report.fileUrl);

      const localPath = response.path();
      console.log('[PDF Download] Downloaded successfully to:', localPath);

      // Create enhanced report object with localPath
      const enhancedReport = {
        ...report,
        id: report.id || Date.now().toString(),
        localPath: localPath,
        uploadedAt: report.createdAt || new Date().toISOString(),
        fileName: fileName,
        fileSize: report.fileSize || 0,
        title: report.title || 'Breast Cancer Screening Report',
        description: report.description || 'Breast cancer screening with 6 images',
        reportType: 'screening'
      };

      setLocalPdfPath(localPath);

      // Use setTimeout to ensure navigation happens after state updates
      setTimeout(() => {
        console.log('[Navigation] Navigating to PatientReports with params:', {
          patientId: selectedPatient.id,
          patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
          report: enhancedReport,
          localPdfPath: localPath,
          fromReportGeneration: true
        });

        navigation.navigate('PatientReports', {
          patientId: selectedPatient.id,
          patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
          report: enhancedReport,
          localPdfPath: localPath,
          fromReportGeneration: true
        });
      }, 500); // Small delay to ensure modal closes first

    } catch (error) {
      console.error('[PDF Download Error]', error);
      
      // If download fails, still navigate but without local PDF
      const enhancedReport = {
        ...report,
        id: report.id || Date.now().toString(),
        uploadedAt: report.createdAt || new Date().toISOString(),
        fileName: report.fileName || 'report.pdf',
        fileSize: report.fileSize || 0,
        title: report.title || 'Breast Cancer Screening Report',
        description: report.description || 'Breast cancer screening with 6 images',
        reportType: 'screening'
      };

      setTimeout(() => {
        navigation.navigate('PatientReports', {
          patientId: selectedPatient.id,
          patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
          report: enhancedReport,
          fromReportGeneration: true
        });
      }, 500);

      Alert.alert(
        'Download Warning',
        'Report generated successfully but failed to download locally. You can download it from the reports list.',
        [{ text: 'OK' }]
      );
    }
  };

  return {
    reportUrl,
    localPdfPath,
    generatingReport,
    uploadStatus,
    uploadProgress,
    uploadError,
    setUploadStatus,
    generateAndUploadReport
  };
};

export default useReportGeneration;