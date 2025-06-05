import React from 'react';
import { View, Text, Modal, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

const UploadStatusModal = ({ status, progress, error, setStatus, onRetry }) => {
  if (status === 'idle') return null;
  
  return (
    <Modal
      visible={status !== 'idle'}
      transparent={true}
      animationType="fade"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {status === 'uploading' && (
            <>
              <ActivityIndicator size="large" color="#DB2777" />
              <Text style={styles.modalText}>Generating Report...</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
              <Text style={styles.progressText}>{progress}%</Text>
            </>
          )}
          {status === 'success' && (
            <>
              <Feather name="check-circle" size={50} color="#10B981" />
              <Text style={styles.modalText}>Generated Successfully!</Text>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setStatus('idle')}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </>
          )}
          {status === 'error' && (
            <>
              <Feather name="alert-circle" size={50} color="#EF4444" />
              <Text style={styles.modalText}>Upload Failed</Text>
              <Text style={styles.errorText}>{error}</Text>
              <View style={styles.modalButtonRow}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSecondary]}
                  onPress={() => setStatus('idle')}
                >
                  <Text style={[styles.modalButtonText, styles.modalButtonTextSecondary]}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={onRetry}
                >
                  <Text style={styles.modalButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#DB2777',
  },
  progressText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: '#DB2777',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 8,
  },
  modalButtonSecondary: {
    backgroundColor: '#F3F4F6',
    marginRight: 12,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalButtonTextSecondary: {
    color: '#6B7280',
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
});

export default UploadStatusModal;