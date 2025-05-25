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
  
  // Check for token when app starts
  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        setUserToken(token);
      } catch (error) {
        console.error('Failed to get token:', error);
      } finally {
        // After checking, we're no longer loading
        setIsLoading(false);
      }
    };
    
    checkToken();
  }, []);
  
  // Show splash screen while checking token
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
        <Stack.Screen name="PDFViewer" component={PDFViewer} options={{headerShown: false}} />
        <Stack.Screen name="PatientReports" component={PatientReports} />
        <Stack.Screen name="Analytics" component={Analytics} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}