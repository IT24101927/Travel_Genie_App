import React from 'react';

import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';
import AppLoader from '../components/common/AppLoader';
import { useAuth } from '../context/AuthContext';

const RootNavigator = () => {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return <AppLoader />;
  }

  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  return <MainTabNavigator />;
};

export default RootNavigator;
