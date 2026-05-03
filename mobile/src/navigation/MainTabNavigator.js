import React, { useRef, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Dimensions, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import TripListScreen from '../screens/trips/TripListScreen';
import TripDetailsScreen from '../screens/trips/TripDetailsScreen';
import TripFormScreen from '../screens/trips/TripFormScreen';
import TripPlannerScreen from '../screens/trips/TripPlannerScreen';
import TripPlannerPreferencesScreen from '../screens/trips/TripPlannerPreferencesScreen';
import TripPlannerBudgetScreen from '../screens/trips/TripPlannerBudgetScreen';
import { TripPlannerProvider } from '../context/TripPlannerContext';

import DistrictListScreen from '../screens/places/DistrictListScreen';
import PlaceListScreen from '../screens/places/PlaceListScreen';
import PlaceDetailsScreen from '../screens/places/PlaceDetailsScreen';

import HotelListScreen from '../screens/hotels/HotelListScreen';
import HotelDetailsScreen from '../screens/hotels/HotelDetailsScreen';
import HotelDistrictListScreen from '../screens/hotels/HotelDistrictListScreen';

import TransportListScreen from '../screens/transport/TransportListScreen';
import AddTransportScreen from '../screens/transport/AddTransportScreen';
import EditTransportScreen from '../screens/transport/EditTransportScreen';
import TransportSchedulesScreen from '../screens/transport/TransportSchedulesScreen';

import NotificationListScreen from '../screens/notifications/NotificationListScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import ChangePasswordScreen from '../screens/profile/ChangePasswordScreen';
import ExpenseStackNavigator from './ExpenseStackNavigator';
import colors from '../constants/colors';
import AppLoader from '../components/common/AppLoader';
import { useAuth } from '../context/AuthContext';
import { getLastMainTab, saveLastMainTab } from '../utils/storage';

const Tab = createBottomTabNavigator();
const TripStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const PlaceStack = createNativeStackNavigator();
const HotelStack = createNativeStackNavigator();
const TransportStack = createNativeStackNavigator();

const DEFAULT_MAIN_TAB = 'Trips';
const MAIN_TABS = ['Places', 'Hotels', 'Transport', 'Trips', 'Expenses', 'Alerts', 'Profile'];

const getUserStorageKey = (user) =>
  String(user?._id || user?.id || user?.userId || user?.email || 'default');



const TripStackNavigator = () => (
  <TripStack.Navigator screenOptions={{ headerShown: false }}>
    <TripStack.Screen name="TripList" component={TripListScreen} />
    <TripStack.Screen name="TripDetails" component={TripDetailsScreen} />
    <TripStack.Screen name="TripForm" component={TripFormScreen} />
    <TripStack.Screen name="TripPlanner" component={TripPlannerScreen} />
    <TripStack.Screen
      name="PlannerDistrictPicker"
      component={DistrictListScreen}
      initialParams={{ plannerMode: true }}
    />
    <TripStack.Screen
      name="PlannerPlacePicker"
      component={PlaceListScreen}
      initialParams={{ plannerMode: true }}
    />
    <TripStack.Screen name="PlannerPreferences" component={TripPlannerPreferencesScreen} />
    <TripStack.Screen
      name="PlannerHotelPicker"
      component={HotelListScreen}
      initialParams={{ plannerMode: true }}
    />
    <TripStack.Screen name="PlannerBudget" component={TripPlannerBudgetScreen} />
    <TripStack.Screen name="TripAddTransport" component={AddTransportScreen} />
    <TripStack.Screen name="TripEditTransport" component={EditTransportScreen} />
  </TripStack.Navigator>
);

const PlaceStackNavigator = () => (
  <PlaceStack.Navigator screenOptions={{ headerShown: false }}>
    <PlaceStack.Screen name="DistrictList" component={DistrictListScreen} />
    <PlaceStack.Screen name="PlaceList" component={PlaceListScreen} />
    <PlaceStack.Screen name="PlaceDetails" component={PlaceDetailsScreen} />
  </PlaceStack.Navigator>
);

const HotelStackNavigator = () => (
  <HotelStack.Navigator screenOptions={{ headerShown: false }}>
    <HotelStack.Screen name="HotelDistrictList" component={HotelDistrictListScreen} />
    <HotelStack.Screen name="HotelList" component={HotelListScreen} />
    <HotelStack.Screen name="HotelDetails" component={HotelDetailsScreen} />
  </HotelStack.Navigator>
);

const TransportStackNavigator = () => (
  <TransportStack.Navigator screenOptions={{ headerShown: false }}>
    <TransportStack.Screen name="TransportList" component={TransportListScreen} />
    <TransportStack.Screen name="AddTransport" component={AddTransportScreen} />
    <TransportStack.Screen name="EditTransport" component={EditTransportScreen} />
    <TransportStack.Screen name="TransportSchedules" component={TransportSchedulesScreen} />
  </TransportStack.Navigator>
);

const ProfileStackNavigator = () => (
  <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
    <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
    <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
    <ProfileStack.Screen name="ChangePassword" component={ChangePasswordScreen} />
  </ProfileStack.Navigator>
);

const getTabBarIcon = (routeName, focused, color, size) => {
  const icons = {
    Places:    focused ? 'map'             : 'map-outline',
    Hotels:    focused ? 'bed'             : 'bed-outline',
    Transport: focused ? 'bus'             : 'bus-outline',
    Trips:     focused ? 'airplane'        : 'airplane-outline',
    Expenses:  focused ? 'wallet'          : 'wallet-outline',
    Alerts:    focused ? 'notifications'   : 'notifications-outline',
    Profile:   focused ? 'person'          : 'person-outline'
  };
  return <Ionicons name={icons[routeName] || 'ellipse-outline'} size={size} color={color} />;
};

const CustomAnimatedTabBar = ({ state, descriptors, navigation, insets }) => {
  const { width } = Dimensions.get('window');
  // Full width minus margin on left and right (10 each)
  const tabWidth = (width - 20) / state.routes.length;
  
  const translateX = useRef(new Animated.Value(state.index * tabWidth)).current;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: state.index * tabWidth,
      useNativeDriver: true,
      bounciness: 4,
      speed: 14,
    }).start();
  }, [state.index, tabWidth]);

  return (
    <View style={[styles.tabBarContainer, { bottom: Math.max(insets.bottom, 15) }]}>
      <Animated.View 
        style={[
          styles.activeCircleWrapper, 
          { 
            width: tabWidth,
            transform: [{ translateX }]
          }
        ]}
      >
        <View style={styles.activeCircle} />
      </Animated.View>

      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        // Determine icon and text sizes based on whether it's focused
        const iconSize = isFocused ? 24 : 22;
        const iconColor = isFocused ? colors.white : colors.textMuted;
        const textColor = isFocused ? colors.primary : colors.textMuted;

        return (
          <TouchableOpacity
            key={route.key}
            activeOpacity={0.8}
            onPress={onPress}
            style={styles.tabItem}
          >
            <View style={[styles.iconWrapper, isFocused && styles.iconWrapperActive]}>
              {getTabBarIcon(route.name, isFocused, iconColor, iconSize)}
            </View>
            <Text style={[styles.tabLabel, { color: textColor }, isFocused && styles.tabLabelActive]} numberOfLines={1}>
              {route.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const MainTabNavigator = () => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const userStorageKey = useMemo(() => getUserStorageKey(user), [user]);
  const [initialRouteName, setInitialRouteName] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadInitialTab = async () => {
      try {
        const savedTab = await getLastMainTab(userStorageKey);
        const nextTab = MAIN_TABS.includes(savedTab) ? savedTab : DEFAULT_MAIN_TAB;
        if (isMounted) setInitialRouteName(nextTab);
      } catch {
        if (isMounted) setInitialRouteName(DEFAULT_MAIN_TAB);
      }
    };

    loadInitialTab();

    return () => {
      isMounted = false;
    };
  }, [userStorageKey]);

  if (!initialRouteName) {
    return <AppLoader />;
  }

  return (
    <TripPlannerProvider>
    <Tab.Navigator
      initialRouteName={initialRouteName}
      tabBar={(props) => <CustomAnimatedTabBar {...props} insets={insets} />}
      screenOptions={{ headerShown: false }}
      screenListeners={{
        state: (event) => {
          const routeName = event.data.state.routes[event.data.state.index]?.name;
          if (MAIN_TABS.includes(routeName)) {
            saveLastMainTab(userStorageKey, routeName).catch(() => {});
          }
        }
      }}
    >
      <Tab.Screen name="Places"    component={PlaceStackNavigator} />
      <Tab.Screen name="Hotels"    component={HotelStackNavigator} />
      <Tab.Screen name="Transport" component={TransportStackNavigator} />
      <Tab.Screen name="Trips"     component={TripStackNavigator} />
      <Tab.Screen name="Expenses"  component={ExpenseStackNavigator} />
      <Tab.Screen name="Alerts"    component={NotificationListScreen} />
      <Tab.Screen name="Profile"   component={ProfileStackNavigator} />
    </Tab.Navigator>
    </TripPlannerProvider>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: 65,
    backgroundColor: colors.surface,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 8,
  },
  activeCircleWrapper: {
    position: 'absolute',
    top: -12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    borderWidth: 4,
    borderColor: colors.surface,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 5,
    elevation: 6,
  },
  tabItem: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 30,
  },
  iconWrapperActive: {
    transform: [{ translateY: -10 }],
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '800',
    marginTop: 2,
  },
  tabLabelActive: {
    transform: [{ translateY: 0 }],
  }
});

export default MainTabNavigator;
