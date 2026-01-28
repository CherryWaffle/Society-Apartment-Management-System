import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { storage } from '../utils/storage';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = await storage.getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.getMe();
      setUser(response.data);
      await storage.setUser(response.data);
    } catch (error) {
      await storage.clearAll();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await authAPI.login({ email, password });
    const { session, user: userData } = response.data;
    
    if (session?.access_token) {
      await storage.setToken(session.access_token);
      setUser(userData);
      await storage.setUser(userData);
      return { success: true };
    }
    throw new Error('Login failed');
  };

  const register = async (data) => {
    const response = await authAPI.register(data);
    const { session, user: userData } = response.data;
    
    if (session?.access_token) {
      await storage.setToken(session.access_token);
      setUser(userData);
      await storage.setUser(userData);
      return { success: true };
    }
    throw new Error('Registration failed');
  };

  const logout = async () => {
    await storage.clearAll();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
