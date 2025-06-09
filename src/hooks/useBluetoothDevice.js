import {useState, useEffect, useCallback} from 'react';
import {Platform, PermissionsAndroid, Alert} from 'react-native';
import RNBluetoothClassic from 'react-native-bluetooth-classic';

// Constants
const DEVICE_NAME = /^BR-SCAN-\d+$/;
const DEVICE_PASSWORD = '1234';

const useBluetoothClassicDevice = () => {
  const [bluetoothConnected, setBluetoothConnected] = useState(false);
  const [scanningBluetooth, setScanningBluetooth] = useState(false);
  const [bluetoothDevice, setBluetoothDevice] = useState(null);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [permissionChecked, setPermissionChecked] = useState(false);

  const checkBluetoothPermissions = useCallback(async () => {
    if (permissionChecked && permissionsGranted) {
      return true;
    }

    if (permissionChecked && !permissionsGranted) {
      return false;
    }

    if (Platform.OS === 'android') {
      try {
        const permissions = [
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          ...(Platform.Version >= 31
            ? [
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
              ]
            : []),
        ];

        await new Promise(resolve => setTimeout(resolve, 100));

        const granted = await PermissionsAndroid.requestMultiple(permissions);

        const allGranted = Object.values(granted).every(
          status => status === PermissionsAndroid.RESULTS.GRANTED,
        );

        setPermissionChecked(true);
        setPermissionsGranted(allGranted);

        if (!allGranted) {
          Alert.alert(
            'Bluetooth Permissions Required',
            'Bluetooth permissions are required to connect to the device.',
            [{text: 'OK'}],
          );
          return false;
        } else {
          return true;
        }
      } catch (error) {
        console.error('Error requesting Bluetooth permissions:', error);
        setPermissionChecked(true);
        setPermissionsGranted(false);
        return false;
      }
    } else {
      setPermissionChecked(true);
      setPermissionsGranted(true);
      return true;
    }
  }, [permissionChecked, permissionsGranted]);

  const enableBluetooth = useCallback(async () => {
    try {
      const enabled = await RNBluetoothClassic.requestBluetoothEnabled();
      return enabled;
    } catch (error) {
      console.error('Error enabling Bluetooth:', error);
      return false;
    }
  }, []);

  const connectToBluetoothDevice = async () => {
    try {
      const permissionsGranted = await checkBluetoothPermissions();
      if (!permissionsGranted) {
        Alert.alert(
          'Permission Required',
          'Bluetooth permissions are required to connect to the device.',
          [{text: 'OK'}],
        );
        return null;
      }

      const isEnabled = await RNBluetoothClassic.isBluetoothEnabled();
      if (!isEnabled) {
        const enabled = await enableBluetooth();
        if (!enabled) {
          return null;
        }
      }

      setScanningBluetooth(true);

      let devices = await RNBluetoothClassic.getBondedDevices();
      let targetDevice = devices.find(device => DEVICE_NAME.test(device.name));

      if (!targetDevice) {
        Alert.alert(
          'Device Not Paired',
          `Please pair a BR-SCAN device in your phone's Bluetooth settings (name should be like BR-SCAN-###), then try connecting again.`,
          [{text: 'OK'}],
        );
        setScanningBluetooth(false);
        return null;
      }

      if (bluetoothDevice && bluetoothConnected) {
        await disconnectFromDevice();
      }

      const connectedDevice = await RNBluetoothClassic.connectToDevice(
        targetDevice.id,
        {
          connectorType: 'rfcomm',
          delimiter: '\r',
          charset: 'utf-8',
        },
      );

      if (connectedDevice.isConnected()) {
        await new Promise(resolve => setTimeout(resolve, 1000));

        await connectedDevice.write(DEVICE_PASSWORD);

        setBluetoothDevice(connectedDevice);
        setBluetoothConnected(true);

        Alert.alert(
          'Success',
          `Device Successfully Connected to ${targetDevice.name}`,
        );
        return connectedDevice;
      } else {
        throw new Error('Failed to connect');
      }
    } catch (error) {
      console.error('Bluetooth connection error:', error);
      Alert.alert(
        'Connection Failed',
        error.message || 'Failed to connect to the device',
      );
      return null;
    } finally {
      setScanningBluetooth(false);
    }
  };

  const disconnectFromDevice = useCallback(async () => {
    if (bluetoothDevice) {
      if (bluetoothDevice._dataSubscription) {
        bluetoothDevice._dataSubscription.remove();
      }

      if (bluetoothDevice._screenDataSubscription) {
        bluetoothDevice._screenDataSubscription.remove();
      }

      if (bluetoothConnected) {
        await bluetoothDevice.disconnect();
      }

      setBluetoothConnected(false);
      setBluetoothDevice(null);
    }
  }, [bluetoothDevice, bluetoothConnected]);

  const initBluetooth = useCallback(async () => {
    try {
      const permissionsGranted = await checkBluetoothPermissions();

      if (!permissionsGranted) {
        return;
      }

      const isEnabled = await RNBluetoothClassic.isBluetoothEnabled();

      if (isEnabled) {
        const devices = await RNBluetoothClassic.getBondedDevices();

        const targetDevice = devices.find(device =>
          DEVICE_NAME.test(device.name),
        );
        if (targetDevice) {
          setBluetoothDevice(targetDevice);
        }
      }

      const disconnectSubscription = RNBluetoothClassic.onDeviceDisconnected(
        event => {
          setBluetoothConnected(false);
          setBluetoothDevice(prev => {
            if (prev && prev._dataSubscription) {
              prev._dataSubscription.remove();
            }
            return null;
          });
        },
      );
    } catch (error) {
      console.error('Error initializing Bluetooth:', error);
      Alert.alert(
        'Bluetooth Error',
        'Failed to initialize Bluetooth: ' + error.message,
      );
    }
  }, [checkBluetoothPermissions]);

  useEffect(() => {
    initBluetooth();

    return () => {
      disconnectFromDevice();
    };
  }, [disconnectFromDevice, initBluetooth]);

  return {
    bluetoothConnected,
    scanningBluetooth,
    bluetoothDevice,
    connectToBluetoothDevice,
    disconnectFromDevice,
  };
};

export default useBluetoothClassicDevice;
