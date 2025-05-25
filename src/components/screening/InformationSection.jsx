import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

const InformationSection = () => {
  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Screening Information</Text>
      
      <View style={styles.screeningInfoContainer}>
        <View style={styles.infoItem}>
          <Feather name="camera" size={20} color="#64748B" style={styles.infoIcon} />
          <Text style={styles.infoText}>
            6 images will be captured (3 for each breast)
          </Text>
        </View>
        
        <View style={styles.infoItem}>
          <Feather name="help-circle" size={20} color="#64748B" style={styles.infoIcon} />
          <Text style={styles.infoText}>
            Follow on-screen instructions during the capture process
          </Text>
        </View>
        
        <View style={styles.infoItem}>
          <Feather name="file-text" size={20} color="#64748B" style={styles.infoIcon} />
          <Text style={styles.infoText}>
            A PDF report will be generated and uploaded after all images are captured
          </Text>
        </View>
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
  screeningInfoContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoIcon: {
    marginRight: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
  },
});

export default InformationSection;