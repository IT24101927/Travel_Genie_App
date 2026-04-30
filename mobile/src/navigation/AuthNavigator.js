import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import StartScreen from '../screens/auth/StartScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ForgotPasswordVerifyCodeScreen from '../screens/auth/ForgotPasswordVerifyCodeScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';
import RegisterStep1Screen from '../screens/auth/RegisterStep1Screen';
import RegisterStep2VerifyScreen from '../screens/auth/RegisterStep2VerifyScreen';
import RegisterStep3PreferencesScreen from '../screens/auth/RegisterStep3PreferencesScreen';
import AdminLoginScreen from '../screens/admin/AdminLoginScreen';

const Stack = createNativeStackNavigator();

const AuthNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Start">
      <Stack.Screen name="Start" component={StartScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ForgotPasswordVerifyCode" component={ForgotPasswordVerifyCodeScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="Register" component={RegisterStep1Screen} />
      <Stack.Screen name="RegisterStep2" component={RegisterStep2VerifyScreen} />
      <Stack.Screen name="RegisterStep3" component={RegisterStep3PreferencesScreen} />
      <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
