import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { loginApi, registerApi } from '../api/authApi';
import { adminLoginApi } from '../api/adminApi';
import { clearAuthSession, getAuthSession, saveAuthSession } from '../utils/storage';
import { setAuthToken } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const session = await getAuthSession();
        if (session?.token && session?.user) {
          setToken(session.token);
          setUser(session.user);
          setAuthToken(session.token);
        }
      } finally {
        // Enforce a 2.5s minimum load time so the global loading splash screen animation finishes
        setTimeout(() => {
          setLoading(false);
        }, 2500);
      }
    };

    bootstrap();
  }, []);

  const login = useCallback(async (email, password) => {
    const response = await loginApi({ email, password });
    const authData = response?.data;
    await saveAuthSession({ token: authData.token, user: authData.user });
    setToken(authData.token);
    setUser(authData.user);
    setAuthToken(authData.token);
    return authData;
  }, []);

  const adminLogin = useCallback(async (email, password) => {
    const response = await adminLoginApi({ email, password });
    const authData = response?.data;
    await saveAuthSession({ token: authData.token, user: authData.user });
    setToken(authData.token);
    setUser(authData.user);
    setAuthToken(authData.token);
    return authData;
  }, []);

  const register = useCallback(async (payload) => {
    const response = await registerApi(payload);
    const authData = response?.data;
    await saveAuthSession({ token: authData.token, user: authData.user });
    setToken(authData.token);
    setUser(authData.user);
    setAuthToken(authData.token);
    return authData;
  }, []);

  const browseAsGuest = useCallback(() => {
    setIsGuest(true);
  }, []);

  const exitGuest = useCallback(() => {
    setIsGuest(false);
  }, []);

  const logout = useCallback(async () => {
    await clearAuthSession();
    setToken(null);
    setUser(null);
    setIsGuest(false);
    setAuthToken(null);
  }, []);

  const value = useMemo(() => ({
    loading,
    user,
    token,
    isAuthenticated: !!token,
    isAdmin: user?.role === 'admin',
    isGuest,
    login,
    adminLogin,
    register,
    logout,
    browseAsGuest,
    exitGuest,
    setUser
  }), [loading, user, token, isGuest, login, adminLogin, register, logout, browseAsGuest, exitGuest]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};
