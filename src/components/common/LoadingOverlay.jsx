import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

const LoadingOverlay = ({ message = 'Loading...' }) => {
  return (
    <View style={styles.loadingOverlay}>
      <ActivityIndicator size="large" color="#DB2777" />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  }
});

export default LoadingOverlay;