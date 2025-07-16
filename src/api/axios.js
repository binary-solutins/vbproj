import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Alert, Platform} from 'react-native';
import NetInfo from '@react-native-community/netinfo';

// Change this to your actual server IP address or domain
// Use 10.0.2.2 for Android Emulator connecting to localhost
// Use actual IP for physical devices on same network
//const API_BASE_URL = 'http://10.0.2.2:3000/api'; // For Android emulator
// const API_BASE_URL = 'http://localhost:3000/api'; // For iOS simulator

//const API_BASE_URL = 'http://192.168.0.26:3000/api'; // For physical device
 const API_BASE_URL = 'https://d3s-backend-hwbxccckgcdbdgfr.centralindia-01.azurewebsites.net/api'; // For production

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased timeout for large file uploads
  headers: {
    'Content-Type': 'application/json',
  },
});

// Check network before making requests
const checkNetworkBeforeRequest = async () => {
  const netInfo = await NetInfo.fetch();
  if (!netInfo.isConnected) {
    throw new Error('No internet connection available');
  }
  return true;
};

axiosInstance.interceptors.request.use(
  async config => {
    try {
      // Check network connectivity first
      await checkNetworkBeforeRequest();

      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // For multipart/form-data requests, let the browser set the content type with boundary
      if (config.data instanceof FormData) {
        config.headers['Content-Type'] = 'multipart/form-data';
      }

      console.log(
        `${config.method.toUpperCase()} Request to: ${config.baseURL}${
          config.url
        }`,
      );
      return config;
    } catch (error) {
      console.error('Request interceptor error:', error.message);
      return Promise.reject(error);
    }
  },
  error => {
    console.error('Request error:', error.message);
    return Promise.reject(error);
  },
);

// Response interceptor for better error handling
axiosInstance.interceptors.response.use(
  response => {
    console.log(
      `Response from ${response.config.url}: Status ${response.status}`,
    );
    return response;
  },
  error => {
    console.error('API Error:', error);

    // Handle different types of errors
    if (
      !error.response ||
      error.message === 'Network Error' ||
      error.code === 'ERR_NETWORK' ||
      error.message.includes('timeout') ||
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('ENOTFOUND')
    ) {
      // Format the network error in a consistent way
      const customError = {
        response: {
          status: 0,
          data: {
            message:
              'Cannot connect to server. Please check your network connection.',
            isNetworkError: true,
          },
        },
      };

      // Show alert for network errors if not on web
      if (Platform.OS !== 'web') {
        Alert.alert(
          'Connection Error',
          'Cannot connect to server. Please check your network connection and try again.',
        );
      }

      return Promise.reject(customError);
    }

    // For 401 errors, provide a clear message
    if (error.response && error.response.status === 401) {
      // If this is not from login page, might be token expiration
      if (!error.config.url.includes('login')) {
        AsyncStorage.removeItem('userToken');
        AsyncStorage.removeItem('userData');
      }

      // Ensure there's a user-friendly message
      if (!error.response.data || !error.response.data.message) {
        error.response.data = error.response.data || {};
        error.response.data.message = 'Invalid credentials or session expired.';
      }
    }

    // Ensure all errors have a message property for consistent UI handling
    if (
      error.response &&
      (!error.response.data || !error.response.data.message)
    ) {
      error.response.data = error.response.data || {};
      error.response.data.message =
        'An unexpected error occurred. Please try again.';
    }

    return Promise.reject(error);
  },
);

export const authAPI = {
  login: async (email, password) => {
    try {
      const response = await axiosInstance.post('/hospitals/login', {
        email,
        password,
      });
      if (response.data?.token) {
        await AsyncStorage.setItem('userToken', response.data.token);
        await AsyncStorage.setItem(
          'userData',
          JSON.stringify(response.data.hospital),
        );
      }
      return response;
    } catch (error) {
      console.error('Login error:', error);

      // Ensure the error is properly formatted before letting component handle it
      if (!error.response) {
        throw {
          response: {
            status: 0,
            data: {message: 'Network error. Please check your connection.'},
          },
        };
      }

      throw error;
    }
  },

  signup: async payload => {
    try {
      // For FormData, we need to set the right content type
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };

      const response = await axiosInstance.post(
        '/hospitals/signup',
        payload,
        config,
      );
      return response;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  get: async url => {
    try {
      return await axiosInstance.get(url);
    } catch (error) {
      console.error(`GET ${url} error:`, error);
      throw error;
    }
  },

  post: async (url, data, config) => {
    try {
      return await axiosInstance.post(url, data, config);
    } catch (error) {
      console.error(`POST ${url} error:`, error);
      throw error;
    }
  },

  put: async (url, data, config) => {
    try {
      return await axiosInstance.put(url, data, config);
    } catch (error) {
      console.error(`PUT ${url} error:`, error);
      throw error;
    }
  },

  delete: async (url, config) => {
    try {
      return await axiosInstance.delete(url, config);
    } catch (error) {
      console.error(`DELETE ${url} error:`, error);
      throw error;
    }
  },
};

export default axiosInstance;
