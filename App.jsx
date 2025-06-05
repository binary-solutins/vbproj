import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import screens
import LoginScreen from './src/Screens/LoginScreen';
import SignupScreen from './src/Screens/SignupScreen';
import HomeScreen from './src/Screens/HomeScreen';
import SplashScreen from './src/Screens/SplashScreen';
import DoctorList from './src/Screens/DoctorList';
import AddDoctor from './src/Screens/AddDoctor';
import EditDoctor from './src/Screens/EditDoctor';
import PatientList from './src/Screens/PatientList';
import AddPatient from './src/Screens/AddPatient';
import EditPatient from './src/Screens/EditPatient';
import PDFViewer from './src/Screens/Report';
import BreastScreeningScreen from './src/Screens/ScreeningPage';
import VerifyOTPScreen from './src/Screens/OTPScreen';
import EditHospital from './src/Screens/EditHospital';
import PatientReports from './src/Screens/PatientReport';
import Analytics from './src/Screens/Analytics';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);

  useEffect(() => {
    const loadApp = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        setUserToken(token);
        // Wait 7 seconds before proceeding
        setTimeout(() => {
          setIsLoading(false);
        }, 5000);
      } catch (error) {
        console.error('Failed to get token:', error);
        setIsLoading(false); // Fallback in case of error
      }
    };

    loadApp();
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={userToken ? "Home" : "Login"}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="signup" component={SignupScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="DoctorList" component={DoctorList} />
        <Stack.Screen name="AddDoctor" component={AddDoctor} />
        <Stack.Screen name="EditDoctor" component={EditDoctor} />
        <Stack.Screen name="PatientList" component={PatientList} />
        <Stack.Screen name="AddPatient" component={AddPatient} />
        <Stack.Screen name="PatientDetails" component={EditPatient} />
        <Stack.Screen name="BreastScreeningScreen" component={BreastScreeningScreen} />
        <Stack.Screen name="OTP" component={VerifyOTPScreen} />
        <Stack.Screen name="EditHospital" component={EditHospital} />
        <Stack.Screen name="PDFViewer" component={PDFViewer} options={{ headerShown: false }} />
        <Stack.Screen name="PatientReports" component={PatientReports} />
        <Stack.Screen name="Analytics" component={Analytics} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
