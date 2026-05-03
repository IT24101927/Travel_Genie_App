import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import RootNavigator from './src/navigation/RootNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { TripProvider } from './src/context/TripContext';
import { ExpenseProvider } from './src/context/ExpenseContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <TripProvider>
          <ExpenseProvider>
            <NavigationContainer>
              <StatusBar style="dark" />
              <RootNavigator />
            </NavigationContainer>
          </ExpenseProvider>
        </TripProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
