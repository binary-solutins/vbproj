import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

const DeviceConnectionSection = ({ connected, scanning, onConnect, deviceName = "BR-Scan" }) => {
  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Device Connection</Text>

      <TouchableOpacity
        style={[
          styles.bluetoothButton,
          connected && styles.bluetoothButtonConnected
        ]}
        onPress={onConnect}
        disabled={connected || scanning}
      >
        <Feather
          name={connected ? "bluetooth" : "bluetooth-off"}
          size={24}
          color={connected ? "#fff" : "#6B7280"}
        />
        <Text
          style={[
            styles.bluetoothButtonText,
            connected && styles.bluetoothButtonTextConnected
          ]}
        >
          {scanning
            ? "Scanning..."
            : connected
            ? `Connected to ${deviceName}`
            : `Connect to ${deviceName} Device`}
        </Text>
        {scanning && <ActivityIndicator color="#DB2777" style={{ marginLeft: 10 }} />}
      </TouchableOpacity>

      <Text style={styles.bluetoothNote}>
        {connected 
          ? "Device connected. The capture button is now active."
          : "Connect to the BR-Scan device to use the remote capture button"}
      </Text>
      
      {!connected && (
        <Text style={styles.bluetoothInstructions}>
          Note: If connecting for the first time, please pair the device in your phone's Bluetooth settings first with password 1234.
        </Text>
      )}
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
  bluetoothButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginBottom: 12,
  },
  bluetoothButtonConnected: {
    backgroundColor: '#059669',
  },
  bluetoothButtonText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 8,
  },
  bluetoothButtonTextConnected: {
    color: '#fff',
  },
  bluetoothNote: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  bluetoothInstructions: {
    fontSize: 12,
    color: '#DB2777',
    textAlign: 'center',
    fontStyle: 'italic',
  }
});

export default DeviceConnectionSection;