import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create auth context
export const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [userData, setUserData] = useState(null);

  // Check for stored token on app start
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        // Load token and user data from storage
        const token = await AsyncStorage.getItem('userToken');
        const storedUserData = await AsyncStorage.getItem('userData');
        
        if (token) {
          setUserToken(token);
          if (storedUserData) {
            setUserData(JSON.parse(storedUserData));
          }
        }
      } catch (error) {
        console.error('Error loading auth data:', error);
      } finally {
        // Regardless of outcome, we're no longer loading
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  // Auth functions to expose via context
  const authContext = {
    signIn: async (token, user) => {
      try {
        setUserToken(token);
        setUserData(user);
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('userData', JSON.stringify(user));
      } catch (error) {
        console.error('Sign in error:', error);
      }
    },
    signOut: async () => {
      try {
        setUserToken(null);
        setUserData(null);
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userData');
      } catch (error) {
        console.error('Sign out error:', error);
      }
    },
    userData,
    userToken,
    isLoading,
  };

  return (
    <AuthContext.Provider value={authContext}>
      {children}
    </AuthContext.Provider>
  );
};