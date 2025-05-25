import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  StatusBar,
  Animated,
  Platform,
  SafeAreaView,
  useWindowDimensions,
  PermissionsAndroid,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { authAPI } from '../api/axios';
import Pdf from 'react-native-pdf';
import RNFetchBlob from 'rn-fetch-blob';
import moment from 'moment';
import Share from 'react-native-share';

export default function PatientReports() {
  const navigation = useNavigation();
  const route = useRoute();
  const { patientId, patientName } = route.params || {};
  const [localPdfPath, setLocalPdfPath] = useState(null);
  
  const { width, height } = useWindowDimensions();
  
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isPdfVisible, setIsPdfVisible] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [sharingId, setSharingId] = useState(null);
  const [pdfLoadError, setPdfLoadError] = useState(null);
  const [initialReportLoaded, setInitialReportLoaded] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const pdfSlideAnim = useRef(new Animated.Value(height)).current;

  useFocusEffect(
    React.useCallback(() => {
      fetchPatientReports();
      return () => {
        setSelectedReport(null);
        setIsPdfVisible(false);
        cleanupCachedFiles();
      };
    }, [patientId])
  );

  useEffect(() => {
    if (route.params?.localPdfPath && route.params?.report && !initialReportLoaded) {
      setReports(prev => [route.params.report, ...prev]);
      setLocalPdfPath(route.params.localPdfPath);
      setSelectedReport(route.params.report);
      setIsPdfVisible(true);
      setInitialReportLoaded(true);
      
      Animated.timing(pdfSlideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [route.params]);

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
    ]).start();
  }, []);

  const requestStoragePermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const androidVersion = Platform.Version;
        
        // Android 13+ (API level 33+) uses different permissions
        if (androidVersion >= 33) {
          const permissions = [
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          ];
  
          const granted = await PermissionsAndroid.requestMultiple(permissions);
          return Object.values(granted).every(result => 
            result === PermissionsAndroid.RESULTS.GRANTED
          );
        } else if (androidVersion >= 30) {
          // Android 11+ (API level 30+)
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        } else {
          // Android 10 and below
          const permissions = [
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          ];
  
          const granted = await PermissionsAndroid.requestMultiple(permissions);
          return (
            granted['android.permission.READ_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED &&
            granted['android.permission.WRITE_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED
          );
        }
      }
      return true;
    } catch (err) {
      console.warn('Permission error:', err);
      return false;
    }
  };

  const cleanupCachedFiles = async () => {
    try {
      const { fs } = RNFetchBlob;
      const cacheDir = fs.dirs.CacheDir;
      
      const exists = await fs.exists(cacheDir);
      if (!exists) return;
      
      const files = await fs.ls(cacheDir);
      console.log('Cleaning up cached files:', files);
      
      for (const file of files) {
        if (file.endsWith('.pdf')) {
          try {
            const filePath = `${cacheDir}/${file}`;
            const fileExists = await fs.exists(filePath);
            if (fileExists) {
              await fs.unlink(filePath);
              console.log('Cleaned up file:', file);
            }
          } catch (fileError) {
            console.log('Error cleaning individual file:', file, fileError);
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up cache:', error);
    }
  };

  const fetchPatientReports = async () => {
    if (!patientId) {
      console.log('No patient ID provided');
      Alert.alert('Error', 'Patient ID is required');
      navigation.goBack();
      return;
    }
    
    try {
      setLoading(true);
      console.log('Fetching reports for patient:', patientId);
      const response = await authAPI.post(`/reports/patient/${patientId}`);
      console.log('Reports fetched:', response.data);
      
      if (response.data) {
        setPatient(response.data.patient);
        setReports(response.data.reports || []);
      }
    } catch (error) {
      console.error('Error fetching patient reports:', error);
      Alert.alert('Error', 'Failed to fetch patient reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getAuthHeader = async () => {
    try {
      // Replace this with your actual auth token retrieval logic
      // const token = await AsyncStorage.getItem('authToken');
      // return token ? `Bearer ${token}` : '';
      return ''; // Return empty for now - you need to implement this
    } catch (error) {
      console.error('Error getting auth header:', error);
      return '';
    }
  };

// In downloadFileForSharing function:
const downloadFileForSharing = async (report) => {
  try {
    const { fs, android } = RNFetchBlob;
    const fileName = (report.fileName || `report_${report.id}.pdf`).replace(/[^a-zA-Z0-9._-]/g, '_');

    let filePath;
    if (Platform.OS === 'android') {
      // Use external public directory
      const dirs = fs.dirs;
      filePath = `${dirs.DownloadDir}/${fileName}`;

      // Check if directory exists before creating
      try {
        const dirExists = await fs.exists(dirs.DownloadDir);
        if (!dirExists) {
          await fs.mkdir(dirs.DownloadDir);
        }
      } catch (dirError) {
        if (dirError.message.includes('already exists')) {
          // Suppress "already exists" error
        } else {
          throw dirError;
        }
      }
    } else {
      filePath = `${fs.dirs.DocumentDir}/${fileName}`;
    }

    // Handle existing file
    try {
      if (await fs.exists(filePath)) {
        await fs.unlink(filePath);
      }
    } catch (unlinkError) {
      console.log('File cleanup error:', unlinkError);
    }

    const configOptions = Platform.select({
      android: {
        addAndroidDownloads: {
          useDownloadManager: true,
          notification: true,
          path: filePath,
          description: 'Medical Report',
          mime: 'application/pdf',
          mediaScannable: true,
        }
      },
      ios: { fileCache: false }
    });

    const response = await RNFetchBlob.config(configOptions)
      .fetch('GET', report.fileUrl, {
        'Cache-Control': 'no-store',
        Authorization: await getAuthHeader(),
      });

    if (Platform.OS === 'android') {
      return response.path();
    }

    return filePath;
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
};

const handleShare = async (report) => {
  try {
    const filePath = await downloadFileForSharing(report);
    
    const shareOptions = {
      title: 'Share Report',
      url: Platform.OS === 'android' ? `file://${filePath}` : filePath,
      type: 'application/pdf',
      failOnCancel: false,
    };

    const Share = await import('react-native-share').then(m => m.default);
    await Share.open(shareOptions);
  } catch (error) {
    console.error('Sharing failed:', error);
    if (!error.message.includes('User cancelled')) {
      Alert.alert(
        'Sharing Error', 
        'Could not share file directly. The report has been saved to your Downloads folder.',
        [{ text: 'OK' }]
      );
    }
  }
};

// In handleAndroidFallback:
const handleAndroidFallback = async (contentUri) => {
  try {
    // Try to open with system viewer
    await RNFetchBlob.android.actionViewIntent(contentUri, 'application/pdf');
  } catch (error) {
    // Show file location guidance
    Alert.alert(
      'File Saved',
      `The report has been saved to your Downloads folder. ` +
      `You can find it in your device's file manager.`,
      [{ text: 'OK' }]
    );
  }
};
  
 
const shareToWhatsAppDirect = async (report) => {
  try {
    setSharingId(report.id);

    // 1. Generate unique filename with timestamp
    const timestamp = Date.now();
    const fileName = `MedicalReport_${timestamp}.pdf`;
    const filePath = `${RNFetchBlob.fs.dirs.DownloadDir}/${fileName}`;

    // 2. Download file directly to Downloads directory
    const configOptions = Platform.select({
      android: {
        addAndroidDownloads: {
          useDownloadManager: true,
          notification: true,
          path: filePath,
          description: 'Medical Report',
          mime: 'application/pdf',
          mediaScannable: true,
          title: fileName,
        }
      },
      ios: { 
        fileCache: false,
        path: filePath
      }
    });

    const response = await RNFetchBlob.config(configOptions)
      .fetch('GET', report.fileUrl, {
        'Cache-Control': 'no-store',
        Authorization: await getAuthHeader(),
      });

    // 3. Get proper URI for Android
    let fileUri = filePath;
    if (Platform.OS === 'android') {
      // Use content URI for Android 10+ compatibility
      fileUri = `content://${filePath}`;
    } else {
      fileUri = `file://${filePath}`;
    }

    // 4. Prepare WhatsApp share options
    const shareOptions = {
      title: 'Share Medical Report',
      message: 'Here is the medical report', // Optional message
      url: fileUri,
      type: 'application/pdf',
      social: Share.Social.WHATSAPP,
      filename: fileName,
      failOnCancel: false,
    };

    // 5. Attempt direct WhatsApp share
    try {
      const result = await Share.shareSingle(shareOptions);
      console.log('WhatsApp share successful:', result);
    } catch (whatsappError) {
      if (whatsappError.message.includes('not installed')) {
        // Fallback to general share with instructions
        Alert.alert(
          'WhatsApp Not Found',
          'Would you like to install WhatsApp or share through another app?',
          [
            {text: 'Cancel', style: 'cancel'},
            {
              text: 'Other Apps',
              onPress: () => Share.open(shareOptions)
            },
            {
              text: 'Install WhatsApp',
              onPress: () => {
                if (Platform.OS === 'android') {
                  Linking.openURL('market://details?id=com.whatsapp');
                } else {
                  Linking.openURL('itms-apps://itunes.apple.com/app/id310633997');
                }
              }
            }
          ]
        );
      } else {
        throw whatsappError;
      }
    }

  } catch (error) {
    console.error('Sharing failed:', error);
    
    // Handle different error scenarios
    let errorMessage = 'Failed to share report. ';
    if (error.message.includes('permission')) {
      errorMessage += 'Please check storage permissions.';
    } else if (error.message.includes('network')) {
      errorMessage += 'Please check your internet connection.';
    } else {
      errorMessage += 'The file has been saved to Downloads.';
    }

    Alert.alert(
      'Sharing Error',
      errorMessage,
      [
        {text: 'OK', onPress: () => console.log('Error acknowledged')},
        {
          text: 'Open File',
          onPress: () => FileViewer.open(filePath, {showOpenWithDialog: true})
        }
      ]
    );
  } finally {
    setSharingId(null);
  }
};

  const handleDownload = async (report) => {
    try {
      setDownloadingId(report.id);
      console.log('Starting download for report:', report.id);
      
      // Request permission for Android
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        Alert.alert('Permission Required', 'Storage permission is required to download files');
        return;
      }
      
      const { config, fs } = RNFetchBlob;
      let downloadDir = fs.dirs.DownloadDir;
      
      if (Platform.OS === 'ios') {
        downloadDir = fs.dirs.DocumentDir;
      }
      
      const fileName = report.fileName || `report_${report.id}.pdf`;
      const filePath = `${downloadDir}/${fileName}`;
      
      console.log('Downloading to:', filePath);
      
      // Check if file already exists and create unique name if needed
      let finalFilePath = filePath;
      let counter = 1;
      while (await fs.exists(finalFilePath)) {
        const nameWithoutExt = fileName.replace('.pdf', '');
        finalFilePath = `${downloadDir}/${nameWithoutExt}_${counter}.pdf`;
        counter++;
      }
      
      const downloadConfig = {
        fileCache: true,
        trusty: true,
        path: finalFilePath,
      };
      
      // Add Android download manager configuration
      if (Platform.OS === 'android') {
        downloadConfig.addAndroidDownloads = {
          useDownloadManager: true,
          notification: true,
          path: finalFilePath,
          description: 'Downloading medical report',
          mime: 'application/pdf',
          mediaScannable: true,
        };
      }
      
      const response = await config(downloadConfig).fetch('GET', report.fileUrl, {
        'Cache-Control': 'no-store',
        Authorization: await getAuthHeader(),
      });
      
      console.log('Download completed:', response.path());
      
      // Verify file was downloaded successfully
      const fileExists = await fs.exists(response.path());
      if (!fileExists) {
        throw new Error('File download failed - file not found after download');
      }
      
      if (Platform.OS === 'ios') {
        // For iOS, open the document
        try {
          await RNFetchBlob.ios.openDocument(response.path());
        } catch (openError) {
          console.log('Could not open document, but download was successful');
          Alert.alert('Success', `Report downloaded successfully to Documents folder`);
        }
      } else {
        Alert.alert('Success', `Report downloaded successfully to Downloads folder`);
      }
      
    } catch (error) {
      console.error('Error downloading report:', error);
      let errorMessage = 'Failed to download report. Please try again.';
      
      if (error.message?.includes('Network')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.message?.includes('permission')) {
        errorMessage = 'Permission denied. Please allow storage access.';
      }
      
      Alert.alert('Download Error', errorMessage);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleViewPdf = async (report) => {
    try {
      setPdfLoading(true);
      setPdfLoadError(null);
      
      // If we already have this report loaded locally, use it
      if (report.localPath) {
        setLocalPdfPath(report.localPath);
        setSelectedReport(report);
        setIsPdfVisible(true);
        setPdfLoading(false);
        
        Animated.timing(pdfSlideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
        return;
      }
      
      // Download the PDF for viewing
      console.log('Downloading PDF for viewing:', report.id);
      
      const { config, fs } = RNFetchBlob;
      const fileName = report.fileName || `report_${report.id}.pdf`;
      const filePath = `${fs.dirs.CacheDir}/${fileName}`;
      
      // Check if file already exists in cache
      const fileExists = await fs.exists(filePath);
      if (fileExists) {
        console.log('Using cached PDF file:', filePath);
        setLocalPdfPath(filePath);
        setSelectedReport(report);
        setIsPdfVisible(true);
        setPdfLoading(false);
        
        Animated.timing(pdfSlideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
        return;
      }
      
      console.log('Downloading PDF to cache:', filePath);
      
      const response = await config({
        fileCache: true,
        trusty: true,
        path: filePath,
      }).fetch('GET', report.fileUrl, {
        'Cache-Control': 'no-store',
        Authorization: await getAuthHeader(),
      });
      
      console.log('PDF downloaded for viewing:', response.path());
      
      // Verify file was downloaded
      const downloadedFileExists = await fs.exists(response.path());
      if (!downloadedFileExists) {
        throw new Error('Failed to download PDF file');
      }
      
      setLocalPdfPath(response.path());
      setSelectedReport(report);
      setIsPdfVisible(true);
      
      Animated.timing(pdfSlideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
    } catch (error) {
      console.error('Error viewing PDF:', error);
      setPdfLoadError(error.message || 'Failed to load PDF');
      Alert.alert('Error', 'Failed to load PDF. Please try again or download the file.');
    } finally {
      setPdfLoading(false);
    }
  };

  const closePdfViewer = () => {
    Animated.timing(pdfSlideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsPdfVisible(false);
      setSelectedReport(null);
      setLocalPdfPath(null);
      setPdfLoadError(null);
      setPdfLoading(false);
    });
  };

  const formatDate = (dateString) => {
    return moment(dateString).format('MMM DD, YYYY • h:mm A');
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const getReportTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'lab':
        return 'clipboard';
      case 'radiology':
        return 'activity'; 
      case 'prescription':
        return 'file-text';
      case 'discharge':
        return 'home';
      default:
        return 'file';
    }
  };
  
  const renderReportItem = ({ item }) => {
    const isDownloading = downloadingId === item.id;
    const isSharing = sharingId === item.id;
    const isCurrentlyViewing = selectedReport?.id === item.id && isPdfVisible;
    
    return (
      <Animated.View 
        style={[
          styles.reportCard,
          { 
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }]
          },
          isCurrentlyViewing && styles.reportCardActive
        ]}
      >
        <TouchableOpacity 
          style={styles.reportContent}
          onPress={() => handleViewPdf(item)}
          activeOpacity={0.8}
          disabled={pdfLoading && selectedReport?.id === item.id}
        >
          <View style={styles.reportIconContainer}>
            <Feather name={getReportTypeIcon(item.reportType)} size={24} color="#ff4a93" />
          </View>
          
          <View style={styles.reportDetails}>
            <Text style={styles.reportTitle} numberOfLines={1}>
              {item.title}
            </Text>
            
            <Text style={styles.reportDescription} numberOfLines={2}>
              {item.description || 'No description available'}
            </Text>
            
            <View style={styles.reportMetadata}>
              <Text style={styles.reportTimestamp}>
                {formatDate(item.uploadedAt)}
              </Text>
              
              <Text style={styles.reportSize}>
                {formatFileSize(item.fileSize)}
              </Text>
            </View>
          </View>
          
          {pdfLoading && selectedReport?.id === item.id && (
            <View style={styles.reportLoadingIndicator}>
              <ActivityIndicator size="small" color="#ff4a93" />
            </View>
          )}
        </TouchableOpacity>
        
        <View style={styles.reportActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDownload(item)}
            disabled={isDownloading || pdfLoading}
          >
            {isDownloading ? (
              <ActivityIndicator size="small" color="#ff4a93" />
            ) : (
              <Feather name="download" size={18} color="#ff4a93" />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleShare(item)}
            disabled={isSharing || pdfLoading}
          >
            {isSharing ? (
              <ActivityIndicator size="small" color="#64748B" />
            ) : (
              <Feather name="share-2" size={18} color="#64748B" />
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  const renderEmptyList = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Feather name="file-text" size={64} color="#f2d1e0" />
        <Text style={styles.emptyTitle}>No Reports Found</Text>
        <Text style={styles.emptyText}>
          There are no medical reports available for this patient yet.
        </Text>
      </View>
    );
  };

  const renderPdfError = () => {
    return (
      <View style={styles.pdfErrorContainer}>
        <Feather name="alert-circle" size={64} color="#ff4a93" />
        <Text style={styles.pdfErrorTitle}>Unable to Load PDF</Text>
        <Text style={styles.pdfErrorText}>
          {pdfLoadError || "There was an error loading the PDF. Please try downloading the file instead."}
        </Text>
        <TouchableOpacity 
          style={styles.pdfErrorButton}
          onPress={() => selectedReport && handleDownload(selectedReport)}
        >
          <Feather name="download" size={18} color="#fff" style={{marginRight: 8}} />
          <Text style={styles.pdfErrorButtonText}>Download File</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#ff4a93" />
      
      <View style={styles.container}>
        <View style={[styles.header, {paddingTop: statusBarHeight + 10}]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            disabled={loading}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
          >
            <Feather name="chevron-left" size={26} color="#fff" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Patient Reports</Text>
          
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={fetchPatientReports}
            disabled={loading}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
          >
            <Feather name="refresh-cw" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
        
        {patient && (
          <View style={styles.patientInfoContainer}>
            <View style={styles.patientAvatarContainer}>
              <Text style={styles.patientAvatar}>
                {`${patient.firstName?.[0] || ''}${patient.lastName?.[0] || ''}`}
              </Text>
            </View>
            <View style={styles.patientDetails}>
              <Text style={styles.patientName}>
                {`${patient.firstName || ''} ${patient.lastName || ''}`}
              </Text>
              <Text style={styles.reportsCount}>
                {reports.length} {reports.length === 1 ? 'Report' : 'Reports'}
              </Text>
            </View>
          </View>
        )}
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ff4a93" />
            <Text style={styles.loadingText}>Loading reports...</Text>
          </View>
        ) : (
          <FlatList
            data={reports}
            renderItem={renderReportItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.reportsList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyList}
          />
        )}
        
        {isPdfVisible && selectedReport && (
          <Animated.View 
            style={[
              styles.pdfContainer,
              {
                transform: [{ translateY: pdfSlideAnim }]
              }
            ]}
          >
            <View style={[styles.pdfHeader, {paddingTop: statusBarHeight > 0 ? statusBarHeight + 8 : 16}]}>
              <TouchableOpacity 
                style={styles.pdfCloseButton}
                onPress={closePdfViewer}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
              >
                <Feather name="x" size={24} color="#333" />
              </TouchableOpacity>
              <Text style={styles.pdfTitle} numberOfLines={1}>
                {selectedReport.title}
              </Text>
              <View style={styles.pdfActions}>
                <TouchableOpacity
                  style={styles.pdfActionButton}
                  onPress={() => handleDownload(selectedReport)}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                  disabled={downloadingId === selectedReport.id}
                >
                  {downloadingId === selectedReport.id ? (
                    <ActivityIndicator size="small" color="#333" />
                  ) : (
                    <Feather name="download" size={20} color="#333" />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.pdfActionButton}
                  onPress={() => handleShare(selectedReport)}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                  disabled={sharingId === selectedReport.id}
                >
                  {sharingId === selectedReport.id ? (
                    <ActivityIndicator size="small" color="#333" />
                  ) : (
                    <Feather name="share-2" size={20} color="#333" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.pdfViewerContainer}>
              {pdfLoadError ? (
                renderPdfError()
              ) : pdfLoading ? (
                <View style={styles.pdfLoadingContainer}>
                  <ActivityIndicator size="large" color="#ff4a93" />
                  <Text style={styles.pdfLoadingText}>Loading PDF...</Text>
                </View>
              ) : (
                <Pdf
                  source={{ uri: localPdfPath, cache: true }}
                  style={styles.pdfViewer}
                  onLoadComplete={(numberOfPages, filePath) => {
                    console.log(`PDF loaded: ${numberOfPages} pages`);
                    setPdfLoading(false);
                  }}
                  onError={(error) => {
                    console.error('Error loading PDF:', error);
                    setPdfLoadError(error.message || 'Failed to load PDF');
                    setPdfLoading(false);
                  }}
                  onLoadProgress={(percent) => {
                    console.log(`Loading PDF: ${percent * 100}%`);
                  }}
                  enablePaging={true}
                  enableRTL={false}
                  fitPolicy={0}
                  minScale={0.5}
                  maxScale={3.0}
                  spacing={0}
                  enableDoubleTapZoom={true}
                />
              )}
            </View>
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ff4a93',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff0f5',
  },
  header: {
    backgroundColor: '#ff4a93',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
    elevation: 4,
    shadowColor: '#e05c97',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    zIndex: 10,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  refreshButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f2d1e0',
    marginBottom: 8,
  },
  patientAvatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ff4a93',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  patientAvatar: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  patientDetails: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  reportsCount: {
    fontSize: 14,
    color: '#64748B',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#ff4a93',
  },
  reportsList: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  reportCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#e05c97',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  reportContent: {
    flexDirection: 'row',
    padding: 16,
  },
  reportIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#fff0f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  reportDetails: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  reportDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  reportMetadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportTimestamp: {
    fontSize: 12,
    color: '#94A3B8',
  },
  reportSize: {
    fontSize: 12,
    color: '#94A3B8',
  },
  reportActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f2d1e0',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },
  pdfContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#fff',
    zIndex: 10,
  },
  pdfHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f2d1e0',
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#e05c97',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  pdfCloseButton: {
    padding: 8,
  },
  pdfTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 16,
  },
  pdfActions: {
    flexDirection: 'row',
  },
  pdfActionButton: {
    padding: 8,
    marginLeft: 16,
  },
  pdfViewerContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  pdfViewer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  pdfErrorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  pdfErrorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  pdfErrorText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  pdfErrorButton: {
    flexDirection: 'row',
    backgroundColor: '#ff4a93',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfErrorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});