import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

const ActionButtons = ({
  canStart,
  isGenerating,
  hasReport,
  onStart,
  onGenerateReport,
  onStartNew,
  capturedImagesCount,
  reportGenerated
}) => {
  const allImagesCaptured = capturedImagesCount === 6;
  
  return (
    <View style={styles.container}>
      {!reportGenerated ? (
        <>
          {capturedImagesCount === 0 ? (
            // Show start button when no images captured
            <TouchableOpacity
              style={[styles.button, styles.primaryButton, !canStart && styles.disabledButton]}
              onPress={onStart}
              disabled={!canStart}
            >
              <View style={styles.buttonContent}>
                <Feather name="camera" size={20} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.primaryButtonText}>Start Screening</Text>
              </View>
            </TouchableOpacity>
          ) : (
            // Show progress and action buttons when images are being captured
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>Screening Progress</Text>
                <Text style={styles.progressText}>{capturedImagesCount}/6 Images Captured</Text>
              </View>
              
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${(capturedImagesCount / 6) * 100}%` }
                  ]} 
                />
              </View>

              {allImagesCaptured && (
                <View style={styles.actionButtonsContainer}>
                  {isGenerating ? (
                    <View style={styles.generatingContainer}>
                      <ActivityIndicator size="small" color="#DB2777" style={styles.loadingIcon} />
                      <Text style={styles.generatingText}>Generating Report...</Text>
                    </View>
                  ) : (
                    <>
                      <TouchableOpacity
                        style={[styles.button, styles.secondaryButton]}
                        onPress={onGenerateReport}
                      >
                        <View style={styles.buttonContent}>
                          <Feather name="file-text" size={18} color="#DB2777" style={styles.buttonIcon} />
                          <Text style={styles.secondaryButtonText}>Generate Report</Text>
                        </View>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.button, styles.outlineButton]}
                        onPress={onStartNew}
                      >
                        <View style={styles.buttonContent}>
                          <Feather name="refresh-cw" size={18} color="#6B7280" style={styles.buttonIcon} />
                          <Text style={styles.outlineButtonText}>Start New</Text>
                        </View>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}

              {!allImagesCaptured && (
                <TouchableOpacity
                  style={[styles.button, styles.outlineButton]}
                  onPress={onStartNew}
                >
                  <View style={styles.buttonContent}>
                    <Feather name="refresh-cw" size={18} color="#6B7280" style={styles.buttonIcon} />
                    <Text style={styles.outlineButtonText}>Start Over</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          )}
        </>
      ) : (
        // Show completion state when report is generated
        <View style={styles.completionContainer}>
          <View style={styles.successIcon}>
            <Feather name="check-circle" size={32} color="#10B981" />
          </View>
          <Text style={styles.successTitle}>Screening Complete!</Text>
          <Text style={styles.successText}>
            Report has been generated and is now available in the patient's reports section.
          </Text>
          
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={onStartNew}
          >
            <View style={styles.buttonContent}>
              <Feather name="plus" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.primaryButtonText}>Start New Screening</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    marginBottom: 16,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButton: {
    backgroundColor: '#DB2777',
  },
  secondaryButton: {
    backgroundColor: '#FDF2F8',
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  outlineButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  disabledButton: {
    backgroundColor: '#E5E7EB',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#DB2777',
    fontSize: 16,
    fontWeight: '600',
  },
  outlineButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  progressHeader: {
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#6B7280',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#DB2777',
    borderRadius: 4,
  },
  actionButtonsContainer: {
    gap: 8,
  },
  generatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  loadingIcon: {
    marginRight: 12,
  },
  generatingText: {
    fontSize: 16,
    color: '#DB2777',
    fontWeight: '600',
  },
  completionContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 8,
    textAlign: 'center',
  },
  successText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
});

export default ActionButtons;