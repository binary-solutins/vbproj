import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { SCREENING_STEPS } from '../../constants/screeningConstants';

const ProgressSection = ({ capturedImages }) => {
  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Captured Images</Text>
      
      <View style={styles.progressContainer}>
        {SCREENING_STEPS.map((step, index) => {
          const isCaptured = capturedImages[index] !== undefined;
          return (
            <View key={index} style={styles.progressItem}>
              <View
                style={[
                  styles.progressIndicator,
                  isCaptured && styles.progressIndicatorCompleted
                ]}
              >
                {isCaptured ? (
                  <Feather name="check" size={16} color="#fff" />
                ) : (
                  <Text style={styles.progressIndicatorText}>{index + 1}</Text>
                )}
              </View>
              <Text style={styles.progressText}>
                {step.side.charAt(0).toUpperCase() + step.side.slice(1)} {step.position}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressIndicatorCompleted: {
    backgroundColor: '#059669',
  },
  progressIndicatorText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default ProgressSection;