import React from 'react';

import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';
import AdminNavigator from './AdminNavigator';
import GuestNavigator from './GuestNavigator';
import AppLoader from '../components/common/AppLoader';
import { useAuth } from '../context/AuthContext';

const RootNavigator = () => {
  const { loading, isAuthenticated, isAdmin, isGuest } = useAuth();

  if (loading) {
    return <AppLoader />;
  }

  if (!isAuthenticated) {
    if (isGuest) return <GuestNavigator />;
    return <AuthNavigator />;
  }

  if (isAdmin) {
    return <AdminNavigator />;
  }

  return <MainTabNavigator />;
};

export default RootNavigator;
