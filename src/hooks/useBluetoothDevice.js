import { useState, useEffect, useRef } from 'react';
import { Alert, Platform, PermissionsAndroid, AppState } from 'react-native';
import RNBluetoothClassic from 'react-native-bluetooth-classic';

// Constants
const DEVICE_NAME = /^"BR-SCAN-\d+"$/;
const DEVICE_PASSWORD = '1234';
const CONNECTION_TIMEOUT = 15000; // 15 seconds
const RECONNECT_DELAY = 2000; // 2 seconds

const useBluetoothClassicDevice = () => {
  const [bluetoothEnabled, setBluetoothEnabled] = useState(false);
  const [bluetoothConnected, setBluetoothConnected] = useState(false);
  const [bluetoothDevice, setBluetoothDevice] = useState(null);
  const [scanningBluetooth, setScanningBluetooth] = useState(false);
  const [pairedDevices, setPairedDevices] = useState([]);
  
  // Refs for cleanup and state management
  const isComponentMounted = useRef(true);
  const connectionTimeoutRef = useRef(null);
  const subscriptionsRef = useRef([]);
  const currentDeviceRef = useRef(null);

  // Utility function to safely update state only if component is mounted
  const safeSetState = (setter, value) => {
    if (isComponentMounted.current) {
      setter(value);
    }
  };

  // Clear all timeouts and subscriptions
  const clearTimeoutsAndSubscriptions = () => {
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    
    subscriptionsRef.current.forEach(subscription => {
      try {
        if (subscription && typeof subscription.remove === 'function') {
          subscription.remove();
        }
      } catch (error) {
        console.warn('Error removing subscription:', error);
      }
    });
    subscriptionsRef.current = [];
  };

  useEffect(() => {
    isComponentMounted.current = true;
    
    // Initialize Bluetooth with proper error handling
    const initBluetooth = async () => {
      try {
        // Check permissions first
        const permissionsGranted = await checkBluetoothPermissions();
        if (!permissionsGranted) {
          console.warn('Bluetooth permissions not granted');
          return;
        }
        
        // Check if Bluetooth is available
        const isAvailable = await RNBluetoothClassic.isBluetoothAvailable();
        if (!isAvailable) {
          console.warn('Bluetooth is not available on this device');
          return;
        }
        
        // Check if Bluetooth is enabled
        const isEnabled = await RNBluetoothClassic.isBluetoothEnabled();
        safeSetState(setBluetoothEnabled, isEnabled);
        
        if (isEnabled) {
          await loadPairedDevices();
        }
        
        // Set up connection status listener with error handling
        try {
          const disconnectSubscription = RNBluetoothClassic.onDeviceDisconnected(
            (event) => {
              if (!isComponentMounted.current) return;
              
              console.log('Bluetooth connection was lost', event);
              safeSetState(setBluetoothConnected, false);
              
              // Clean up device reference
              if (currentDeviceRef.current) {
                cleanupDeviceSubscriptions(currentDeviceRef.current);
                currentDeviceRef.current = null;
              }
              safeSetState(setBluetoothDevice, null);
            }
          );
          
          subscriptionsRef.current.push(disconnectSubscription);
        } catch (error) {
          console.warn('Could not set up disconnect listener:', error);
        }
        
        // Set up app state listener for cleanup
        const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
          if (nextAppState === 'background' || nextAppState === 'inactive') {
            // Optionally disconnect when app goes to background
            // disconnectFromDevice();
          }
        });
        
        subscriptionsRef.current.push(appStateSubscription);
        
      } catch (error) {
        console.error('Error initializing Bluetooth:', error);
      }
    };
    
    initBluetooth();
    
    // Cleanup when component unmounts
    return () => {
      isComponentMounted.current = false;
      clearTimeoutsAndSubscriptions();
      
      // Disconnect from device
      if (currentDeviceRef.current) {
        disconnectFromDevice().catch(error => {
          console.warn('Error during cleanup disconnect:', error);
        });
      }
    };
  }, []);

  const checkBluetoothPermissions = async () => {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      ];

      // Add Android 12+ specific permissions
      if (Platform.Version >= 31) {
        permissions.push(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN
        );
      }

      // Check which permissions are already granted
      const checkResults = await PermissionsAndroid.requestMultiple(permissions);
      
      const allGranted = Object.values(checkResults).every(
        status => status === PermissionsAndroid.RESULTS.GRANTED
      );

      if (!allGranted) {
        const deniedPermissions = Object.entries(checkResults)
          .filter(([, status]) => status !== PermissionsAndroid.RESULTS.GRANTED)
          .map(([permission]) => permission);
        
        console.warn('Denied permissions:', deniedPermissions);
        
        Alert.alert(
          'Bluetooth Permissions Required',
          'Bluetooth permissions are required to connect to the device. Please grant all permissions in your device settings.',
          [{ text: 'OK' }]
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting Bluetooth permissions:', error);
      return false;
    }
  };

  const loadPairedDevices = async () => {
    try {
      const devices = await RNBluetoothClassic.getBondedDevices();
      safeSetState(setPairedDevices, devices);
      
      // Check if our target device is already paired
      const targetDevice = devices.find(device => 
        device && device.name && DEVICE_NAME.test(device.name)
      );
      
      if (targetDevice && !bluetoothDevice) {
        safeSetState(setBluetoothDevice, targetDevice);
        currentDeviceRef.current = targetDevice;
      }
    } catch (error) {
      console.error('Error loading paired devices:', error);
      safeSetState(setPairedDevices, []);
    }
  };

  const enableBluetooth = async () => {
    try {
      const isAvailable = await RNBluetoothClassic.isBluetoothAvailable();
      if (!isAvailable) {
        Alert.alert('Bluetooth Not Available', 'Bluetooth is not available on this device');
        return false;
      }

      // Check if already enabled
      const isEnabled = await RNBluetoothClassic.isBluetoothEnabled();
      if (isEnabled) {
        safeSetState(setBluetoothEnabled, true);
        await loadPairedDevices();
        return true;
      }

      // Request to enable Bluetooth
      await RNBluetoothClassic.requestBluetoothEnabled();
      
      // Wait a moment for Bluetooth to fully enable
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const isNowEnabled = await RNBluetoothClassic.isBluetoothEnabled();
      safeSetState(setBluetoothEnabled, isNowEnabled);
      
      if (isNowEnabled) {
        await loadPairedDevices();
      }
      
      return isNowEnabled;
    } catch (error) {
      console.error('Error enabling Bluetooth:', error);
      Alert.alert('Bluetooth Error', 'Failed to enable Bluetooth. Please enable it manually in your device settings.');
      return false;
    }
  };

  const cleanupDeviceSubscriptions = (device) => {
    if (!device) return;
    
    try {
      // Clean up known subscriptions
      ['_dataSubscription', '_screenDataSubscription', '_connectionSubscription'].forEach(subName => {
        if (device[subName] && typeof device[subName].remove === 'function') {
          device[subName].remove();
          device[subName] = null;
        }
      });
    } catch (error) {
      console.warn('Error cleaning up device subscriptions:', error);
    }
  };

  const connectToBluetoothDevice = async () => {
    if (!isComponentMounted.current) return null;
    
    try {
      // Check permissions first
      const permissionsGranted = await checkBluetoothPermissions();
      if (!permissionsGranted) {
        return null;
      }

      // Check if Bluetooth is enabled
      if (!bluetoothEnabled) {
        const enabled = await enableBluetooth();
        if (!enabled) return null;
      }

      safeSetState(setScanningBluetooth, true);

      // Get fresh list of paired devices
      await loadPairedDevices();
      const devices = await RNBluetoothClassic.getBondedDevices();
      const targetDevice = devices.find(device => 
        device && device.name && DEVICE_NAME.test(device.name)
      );

      if (!targetDevice) {
        Alert.alert(
          'Device Not Paired',
          'Please pair a BR-SCAN device in your phone\'s Bluetooth settings (name should be like BR-SCAN-###), then try connecting again.',
          [{ text: 'OK' }]
        );
        return null;
      }

      console.log('Attempting to connect to:', targetDevice.id);

      // Disconnect any existing connection first
      if (currentDeviceRef.current && bluetoothConnected) {
        await disconnectFromDevice();
        // Wait a moment before reconnecting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Set up connection timeout
      const connectionPromise = new Promise(async (resolve, reject) => {
        connectionTimeoutRef.current = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, CONNECTION_TIMEOUT);

        try {
          // Connect to the device
          const connectedDevice = await RNBluetoothClassic.connectToDevice(targetDevice.id, {
            connectorType: 'rfcomm',
            delimiter: '\r',
            charset: 'utf-8'
          });

          // Clear timeout on successful connection
          if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
          }

          resolve(connectedDevice);
        } catch (error) {
          if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
          }
          reject(error);
        }
      });

      const connectedDevice = await connectionPromise;

      if (!isComponentMounted.current) {
        // Component unmounted during connection
        try {
          await connectedDevice.disconnect();
        } catch (e) {
          console.warn('Error disconnecting during unmount:', e);
        }
        return null;
      }

      console.log('Connection established:', connectedDevice.isConnected());

      if (connectedDevice.isConnected()) {
        // Wait a moment for the connection to stabilize
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Send password to authenticate if needed
        try {
          const writeResult = await connectedDevice.write(DEVICE_PASSWORD);
          console.log('Password sent result:', writeResult);
        } catch (writeError) {
          console.warn('Error sending password:', writeError);
          // Continue anyway, some devices might not need password
        }

        // Update state only if component is still mounted
        if (isComponentMounted.current) {
          currentDeviceRef.current = connectedDevice;
          safeSetState(setBluetoothDevice, connectedDevice);
          safeSetState(setBluetoothConnected, true);

          Alert.alert('Success', `Device Successfully Connected to ${targetDevice.name}`);
          return connectedDevice;
        } else {
          // Component unmounted, disconnect
          await connectedDevice.disconnect();
          return null;
        }
      } else {
        throw new Error('Failed to establish connection');
      }
    } catch (error) {
      console.error('Bluetooth connection error:', error);
      
      let errorMessage = 'Failed to connect to the device';
      if (error.message.includes('timeout')) {
        errorMessage = 'Connection timed out. Please make sure the device is nearby and try again.';
      } else if (error.message.includes('permission')) {
        errorMessage = 'Permission denied. Please check Bluetooth permissions.';
      }
      
      Alert.alert('Connection Failed', errorMessage);
      return null;
    } finally {
      // Clear timeout if it exists
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      safeSetState(setScanningBluetooth, false);
    }
  };

  const disconnectFromDevice = async () => {
    try {
      const deviceToDisconnect = currentDeviceRef.current || bluetoothDevice;
      
      if (deviceToDisconnect) {
        // Clean up any subscriptions first
        cleanupDeviceSubscriptions(deviceToDisconnect);

        // Only attempt to disconnect if it's connected
        try {
          if (deviceToDisconnect.isConnected && deviceToDisconnect.isConnected()) {
            await deviceToDisconnect.disconnect();
            console.log('Device disconnected successfully');
          }
        } catch (disconnectError) {
          console.warn('Error during disconnect:', disconnectError);
          // Continue with cleanup even if disconnect fails
        }

        // Clear device references
        currentDeviceRef.current = null;
      }

      // Always clean up state
      safeSetState(setBluetoothConnected, false);
      safeSetState(setBluetoothDevice, null);
      
    } catch (error) {
      console.error('Error in disconnectFromDevice:', error);
      // Even if there's an error, we want to clean up our state
      currentDeviceRef.current = null;
      safeSetState(setBluetoothConnected, false);
      safeSetState(setBluetoothDevice, null);
    }
  };

  const scanForDevices = async () => {
    if (!isComponentMounted.current) return [];
    
    try {
      safeSetState(setScanningBluetooth, true);

      // Check permissions first
      const permissionsGranted = await checkBluetoothPermissions();
      if (!permissionsGranted) {
        return [];
      }

      // Check if Bluetooth is enabled first
      if (!bluetoothEnabled) {
        const enabled = await enableBluetooth();
        if (!enabled) return [];
      }

      const devices = await RNBluetoothClassic.getBondedDevices();
      console.log('Paired devices:', devices);
      
      if (isComponentMounted.current) {
        safeSetState(setPairedDevices, devices);
      }

      return devices;
    } catch (error) {
      console.error('Error scanning for Bluetooth devices:', error);
      return [];
    } finally {
      safeSetState(setScanningBluetooth, false);
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