import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import TripListScreen from '../screens/trips/TripListScreen';
import TripDetailsScreen from '../screens/trips/TripDetailsScreen';
import TripFormScreen from '../screens/trips/TripFormScreen';
import PlaceListScreen from '../screens/places/PlaceListScreen';
import HotelListScreen from '../screens/hotels/HotelListScreen';
import NotificationListScreen from '../screens/notifications/NotificationListScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import ExpenseStackNavigator from './ExpenseStackNavigator';
import colors from '../constants/colors';

const Tab = createBottomTabNavigator();
const TripStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

const defaultStackOptions = {
  headerStyle: {
    backgroundColor: colors.background,
  },
  headerTintColor: colors.primary,
  headerTitleStyle: {
    fontWeight: '800',
    color: colors.textPrimary,
  },
  headerShadowVisible: false,
};

const TripStackNavigator = () => {
  return (
    <TripStack.Navigator screenOptions={defaultStackOptions}>
      <TripStack.Screen name="TripList" component={TripListScreen} options={{ title: 'My Trips' }} />
      <TripStack.Screen name="TripDetails" component={TripDetailsScreen} options={{ title: 'Trip Details' }} />
      <TripStack.Screen name="TripForm" component={TripFormScreen} options={{ title: 'Trip Form' }} />
    </TripStack.Navigator>
  );
};

const ProfileStackNavigator = () => {
  return (
    <ProfileStack.Navigator screenOptions={defaultStackOptions}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} options={{ title: 'Profile' }} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} />
    </ProfileStack.Navigator>
  );
};

const getTabBarIcon = (route, focused, color, size) => {
  let iconName;
  if (route.name === 'Trips') {
    iconName = focused ? 'airplane' : 'airplane-outline';
  } else if (route.name === 'Expenses') {
    iconName = focused ? 'wallet' : 'wallet-outline';
  } else if (route.name === 'Places') {
    iconName = focused ? 'map' : 'map-outline';
  } else if (route.name === 'Hotels') {
    iconName = focused ? 'bed' : 'bed-outline';
  } else if (route.name === 'Alerts') {
    iconName = focused ? 'notifications' : 'notifications-outline';
  } else if (route.name === 'Profile') {
    iconName = focused ? 'person' : 'person-outline';
  }
  return <Ionicons name={iconName} size={size} color={color} />;
};

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => getTabBarIcon(route, focused, color, size),
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
      <Tab.Screen name="Trips" component={TripStackNavigator} />
      <Tab.Screen name="Expenses" component={ExpenseStackNavigator} />
      <Tab.Screen name="Places" component={PlaceListScreen} />
      <Tab.Screen name="Hotels" component={HotelListScreen} />
      <Tab.Screen name="Alerts" component={NotificationListScreen} />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
