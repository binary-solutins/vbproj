import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Optional icon

const { width } = Dimensions.get('window');

const CustomAlert = ({ visible, title, message, onClose }) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View style={styles.alertBox}>
          <Ionicons name="heart-circle" size={48} color="#e91e63" style={styles.icon} />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <TouchableOpacity onPress={onClose} style={styles.button}>
            <Text style={styles.buttonText}>Got It</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBox: {
    width: width * 0.8,
    backgroundColor: '#fff0f5',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#e91e63',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 2 },
  },
  icon: {
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#e91e63',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#333',
    marginBottom: 25,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#e91e63',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default CustomAlert;
