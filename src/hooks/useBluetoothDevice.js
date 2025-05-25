import { useState, useEffect } from 'react';
import { Alert, Platform, PermissionsAndroid } from 'react-native';
import RNBluetoothClassic from 'react-native-bluetooth-classic';

// Constants
const DEVICE_NAME = /^"BR-SCAN-\d+"$/;
const DEVICE_PASSWORD = '1234';


const useBluetoothClassicDevice = () => {
  const [bluetoothEnabled, setBluetoothEnabled] = useState(false);
  const [bluetoothConnected, setBluetoothConnected] = useState(false);
  const [bluetoothDevice, setBluetoothDevice] = useState(null);
  const [scanningBluetooth, setScanningBluetooth] = useState(false);
  const [pairedDevices, setPairedDevices] = useState([]);

  useEffect(() => {
    // Initialize Bluetooth
    const initBluetooth = async () => {
      try {
        await checkBluetoothPermissions();
        
        // Check if Bluetooth is enabled
        const isEnabled = await RNBluetoothClassic.isBluetoothEnabled();
        setBluetoothEnabled(isEnabled);
        
        if (isEnabled) {
          // Get list of bonded/paired devices
          const devices = await RNBluetoothClassic.getBondedDevices();
          setPairedDevices(devices);
          
          // Check if our device is already paired
          const targetDevice = devices.find(device => /^BR-SCAN-\d+$/i.test(device.name));
          if (targetDevice) {
            setBluetoothDevice(targetDevice);
          }
        }
        
        // Set up connection status listener
        const disconnectSubscription = RNBluetoothClassic.onDeviceDisconnected(
          (event) => {
            console.log('Bluetooth connection was lost', event);
            setBluetoothConnected(false);
            setBluetoothDevice(prev => {
              // Clean up subscription if it exists
              if (prev && prev._dataSubscription) {
                prev._dataSubscription.remove();
              }
              return null;
            });
          }
        );
        
        return () => {
          // Clean up subscription
          disconnectSubscription.remove();
        };
      } catch (error) {
        console.error('Error initializing Bluetooth:', error);
      }
    };
    
    initBluetooth();
    
    // Cleanup when component unmounts
    return () => {
      disconnectFromDevice();
    };
  }, []);

  const checkBluetoothPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const permissions = [
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          // For Android 12+ (API level 31+)
          ...(Platform.Version >= 31 ? [
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN
          ] : [])
        ];
        
        const granted = await PermissionsAndroid.requestMultiple(permissions);
        
        const allGranted = Object.values(granted).every(
          status => status === PermissionsAndroid.RESULTS.GRANTED
        );
        
        if (!allGranted) {
          Alert.alert(
            'Bluetooth Permissions Required',
            'Bluetooth permissions are required to connect to the device.',
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        console.error('Error requesting Bluetooth permissions:', error);
      }
    }
  };

  const enableBluetooth = async () => {
    try {
      // This will prompt the user to enable Bluetooth if it's not enabled
      await RNBluetoothClassic.requestBluetoothEnabled();
      setBluetoothEnabled(true);
      
      // Get paired devices after enabling
      const devices = await RNBluetoothClassic.getBondedDevices();
      setPairedDevices(devices);
      
      return true;
    } catch (error) {
      console.error('Error enabling Bluetooth:', error);
      Alert.alert('Bluetooth Error', 'Failed to enable Bluetooth');
      return false;
    }
  };

  const connectToBluetoothDevice = async () => {
    try {
      // Check if Bluetooth is enabled
      if (!bluetoothEnabled) {
        const enabled = await enableBluetooth();
        if (!enabled) return;
      }
      
      setScanningBluetooth(true);
      
      // Check if the device is already paired
      let devices = await RNBluetoothClassic.getBondedDevices();
      setPairedDevices(devices);
      let targetDevice = devices.find(device => DEVICE_NAME.test(device.name));

      if (!targetDevice) {
        Alert.alert(
          'Device Not Paired',
          `Please pair a BR-SCAN device in your phone's Bluetooth settings (name should be like BR-SCAN-###), then try connecting again.`,
          [{ text: 'OK' }]
        );
        setScanningBluetooth(false);
        return;
      }
      
      console.log('Attempting to connect to:', targetDevice.id);
      
      // Disconnect any existing connection first
      if (bluetoothDevice && bluetoothConnected) {
        await disconnectFromDevice();
      }
      
      // Connect to the device
      const connectedDevice = await RNBluetoothClassic.connectToDevice(targetDevice.id, {
        connectorType: 'rfcomm',
        delimiter: '\r',
        charset: 'utf-8'
      });
      
      console.log('Connection established:', connectedDevice.isConnected());
      
      if (connectedDevice.isConnected()) {
        // Wait a moment for the connection to stabilize
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Send password to authenticate if needed
        const writeResult = await connectedDevice.write(DEVICE_PASSWORD);
        console.log('Password sent result:', writeResult);
        
        setBluetoothDevice(connectedDevice);
        setBluetoothConnected(true);
        
        Alert.alert('Success', `Device Successfully Connected to ${targetDevice.name}`);
        return connectedDevice;
      } else {
        throw new Error('Failed to connect');
      }
    } catch (error) {
      console.error('Bluetooth connection error:', error);
      Alert.alert('Connection Failed', error.message || 'Failed to connect to the device');
      return null;
    } finally {
      setScanningBluetooth(false);
    }
  };

  const disconnectFromDevice = async () => {
    try {
      if (bluetoothDevice) {
        // Clean up any subscriptions
        if (bluetoothDevice._dataSubscription) {
          bluetoothDevice._dataSubscription.remove();
        }
        
        if (bluetoothDevice._screenDataSubscription) {
          bluetoothDevice._screenDataSubscription.remove();  
        }
        
        // Only attempt to disconnect if it's connected
        if (bluetoothConnected) {
          await bluetoothDevice.disconnect();
          console.log('Device disconnected successfully');
        }
        
        setBluetoothConnected(false);
        setBluetoothDevice(null);
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
      // Even if there's an error, we want to clean up our state
      setBluetoothConnected(false);
      setBluetoothDevice(null);
    }
  };

  const scanForDevices = async () => {
    try {
      setScanningBluetooth(true);
      
      // Check if Bluetooth is enabled first
      if (!bluetoothEnabled) {
        const enabled = await enableBluetooth();
        if (!enabled) return [];
      }
      
      const devices = await RNBluetoothClassic.getBondedDevices();
      console.log('Paired devices:', devices);
      setPairedDevices(devices);
      
      return devices;
    } catch (error) {
      console.error('Error scanning for Bluetooth devices:', error);
      return [];
    } finally {
      setScanningBluetooth(false);
    }
  };

  return {
    bluetoothEnabled,
    bluetoothConnected,
    scanningBluetooth,
    bluetoothDevice,
    pairedDevices,
    connectToBluetoothDevice,
    disconnectFromDevice,
    enableBluetooth,
    scanForDevices
  };
};

export default useBluetoothClassicDevice;