import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import GuestScreen from '../screens/guest/GuestScreen';
import GuestSignInPromptScreen from '../screens/guest/GuestSignInPromptScreen';

const Stack = createNativeStackNavigator();

const GuestNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="GuestHome" component={GuestScreen} />
    <Stack.Screen
      name="GuestSignInPrompt"
      component={GuestSignInPromptScreen}
      options={{ presentation: 'modal' }}
    />
  </Stack.Navigator>
);

export default GuestNavigator;
