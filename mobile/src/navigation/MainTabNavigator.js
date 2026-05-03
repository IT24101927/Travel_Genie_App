import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import TripListScreen from '../screens/trips/TripListScreen';
import TripDetailsScreen from '../screens/trips/TripDetailsScreen';
import TripFormScreen from '../screens/trips/TripFormScreen';

import PlaceListScreen from '../screens/places/PlaceListScreen';
import PlaceDetailsScreen from '../screens/places/PlaceDetailsScreen';

import HotelListScreen from '../screens/hotels/HotelListScreen';
import HotelDetailsScreen from '../screens/hotels/HotelDetailsScreen';

import TransportListScreen from '../screens/transport/TransportListScreen';
import AddTransportScreen from '../screens/transport/AddTransportScreen';
import EditTransportScreen from '../screens/transport/EditTransportScreen';

import NotificationListScreen from '../screens/notifications/NotificationListScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import ChangePasswordScreen from '../screens/profile/ChangePasswordScreen';
import ExpenseStackNavigator from './ExpenseStackNavigator';
import colors from '../constants/colors';

const Tab = createBottomTabNavigator();
const TripStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const PlaceStack = createNativeStackNavigator();
const HotelStack = createNativeStackNavigator();
const TransportStack = createNativeStackNavigator();

const defaultStackOptions = {
  headerStyle: {
    backgroundColor: colors.background
  },
  headerTintColor: colors.primary,
  headerTitleStyle: {
    fontWeight: '800',
    color: colors.textPrimary
  },
  headerShadowVisible: false
};

const TripStackNavigator = () => (
  <TripStack.Navigator screenOptions={defaultStackOptions}>
    <TripStack.Screen name="TripList" component={TripListScreen} options={{ title: 'My Trips' }} />
    <TripStack.Screen name="TripDetails" component={TripDetailsScreen} options={{ title: 'Trip Details' }} />
    <TripStack.Screen name="TripForm" component={TripFormScreen} options={{ title: 'Trip Form' }} />
  </TripStack.Navigator>
);

const PlaceStackNavigator = () => (
  <PlaceStack.Navigator screenOptions={defaultStackOptions}>
    <PlaceStack.Screen name="PlaceList" component={PlaceListScreen} options={{ headerShown: false }} />
    <PlaceStack.Screen name="PlaceDetails" component={PlaceDetailsScreen} options={{ title: 'Place Details' }} />
  </PlaceStack.Navigator>
);

const HotelStackNavigator = () => (
  <HotelStack.Navigator screenOptions={defaultStackOptions}>
    <HotelStack.Screen name="HotelList" component={HotelListScreen} options={{ headerShown: false }} />
    <HotelStack.Screen name="HotelDetails" component={HotelDetailsScreen} options={{ title: 'Hotel Details' }} />
  </HotelStack.Navigator>
);

const TransportStackNavigator = () => (
  <TransportStack.Navigator screenOptions={defaultStackOptions}>
    <TransportStack.Screen name="TransportList" component={TransportListScreen} options={{ headerShown: false }} />
    <TransportStack.Screen name="AddTransport" component={AddTransportScreen} options={{ title: 'Add Transport' }} />
    <TransportStack.Screen name="EditTransport" component={EditTransportScreen} options={{ title: 'Edit Transport' }} />
  </TransportStack.Navigator>
);

const ProfileStackNavigator = () => (
  <ProfileStack.Navigator screenOptions={defaultStackOptions}>
    <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} options={{ title: 'Profile' }} />
    <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} />
    <ProfileStack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: 'Change Password' }} />
  </ProfileStack.Navigator>
);

const getTabBarIcon = (routeName, focused, color, size) => {
  const icons = {
    Trips:     focused ? 'airplane'       : 'airplane-outline',
    Expenses:  focused ? 'wallet'          : 'wallet-outline',
    Places:    focused ? 'map'             : 'map-outline',
    Hotels:    focused ? 'bed'             : 'bed-outline',
    Transport: focused ? 'bus'             : 'bus-outline',
    Alerts:    focused ? 'notifications'   : 'notifications-outline',
    Profile:   focused ? 'person'          : 'person-outline'
  };
  return <Ionicons name={icons[routeName] || 'ellipse-outline'} size={size} color={color} />;
};

const MainTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) =>
        getTabBarIcon(route.name, focused, color, size),
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textSecondary,
      headerShown: false,
      tabBarStyle: {
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        height: 60,
        paddingBottom: 8,
        paddingTop: 8
      },
      tabBarLabelStyle: {
        fontSize: 10,
        fontWeight: '600'
      }
    })}
  >
    <Tab.Screen name="Trips"     component={TripStackNavigator} />
    <Tab.Screen name="Expenses"  component={ExpenseStackNavigator} />
    <Tab.Screen name="Transport" component={TransportStackNavigator} />
    <Tab.Screen name="Places"    component={PlaceStackNavigator} />
    <Tab.Screen name="Hotels"    component={HotelStackNavigator} />
    <Tab.Screen name="Alerts"    component={NotificationListScreen} />
    <Tab.Screen name="Profile"   component={ProfileStackNavigator} />
  </Tab.Navigator>
);

export default MainTabNavigator;
