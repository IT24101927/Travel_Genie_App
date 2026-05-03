import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';
import AdminUserFormScreen from '../screens/admin/AdminUserFormScreen';
import AdminResourceListScreen from '../screens/admin/AdminResourceListScreen';
import AdminDistrictsScreen from '../screens/admin/AdminDistrictsScreen';
import AdminDistrictFormScreen from '../screens/admin/AdminDistrictFormScreen';
import AdminPlacesScreen from '../screens/admin/AdminPlacesScreen';
import AdminPlaceFormScreen from '../screens/admin/AdminPlaceFormScreen';
import AdminHotelsScreen from '../screens/admin/AdminHotelsScreen';
import AdminHotelFormScreen from '../screens/admin/AdminHotelFormScreen';

const Stack = createNativeStackNavigator();

const AdminNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="AdminDashboard">
      <Stack.Screen name="AdminDashboard"     component={AdminDashboardScreen} />
      <Stack.Screen name="AdminUsers"         component={AdminUsersScreen} />
      <Stack.Screen name="AdminUserForm"      component={AdminUserFormScreen} />
      <Stack.Screen name="AdminResource"      component={AdminResourceListScreen} />
      <Stack.Screen name="AdminDistricts"     component={AdminDistrictsScreen} />
      <Stack.Screen name="AdminDistrictForm"  component={AdminDistrictFormScreen} />
      <Stack.Screen name="AdminPlaces"        component={AdminPlacesScreen} />
      <Stack.Screen name="AdminPlaceForm"     component={AdminPlaceFormScreen} />
      <Stack.Screen name="AdminHotels"        component={AdminHotelsScreen} />
      <Stack.Screen name="AdminHotelForm"     component={AdminHotelFormScreen} />
    </Stack.Navigator>
  );
};

export default AdminNavigator;
