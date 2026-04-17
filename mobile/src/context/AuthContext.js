import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { loginApi, registerApi } from '../api/authApi';
import { clearAuthSession, getAuthSession, saveAuthSession } from '../utils/storage';
import { setAuthToken } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

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
        setLoading(false);
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

  const register = useCallback(async (payload) => {
    const response = await registerApi(payload);
    const authData = response?.data;
    await saveAuthSession({ token: authData.token, user: authData.user });
    setToken(authData.token);
    setUser(authData.user);
    setAuthToken(authData.token);
    return authData;
  }, []);

  const logout = useCallback(async () => {
    await clearAuthSession();
    setToken(null);
    setUser(null);
    setAuthToken(null);
  }, []);

  const value = useMemo(() => ({
    loading,
    user,
    token,
    isAuthenticated: !!token,
    login,
    register,
    logout,
    setUser
  }), [loading, user, token, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};
