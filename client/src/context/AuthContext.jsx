import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Verify token session on initial mount
  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        try {
          const response = await api.get('/auth/me');
          const resData = response.data;
          setUser(resData.user);
          setProfile(resData.profile);
          localStorage.setItem('user', JSON.stringify(resData.user));
          localStorage.setItem('profile', JSON.stringify(resData.profile));
        } catch (error) {
          // Token expired or invalid, wipe out session credentials
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, [token]);

  const login = async (email, password, role) => {
    try {
      const response = await api.post('/auth/login', { email, password, role });
      const data = response.data;
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('profile', JSON.stringify(data.profile));
      
      setToken(data.token);
      setUser(data.user);
      setProfile(data.profile);
      
      return { user: data.user, profile: data.profile };
    } catch (error) {
      throw error;
    }
  };

  const register = async (registerData) => {
    try {
      const response = await api.post('/auth/register', registerData);
      const data = response.data;
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('profile', JSON.stringify(data.profile));
      
      setToken(data.token);
      setUser(data.user);
      setProfile(data.profile);
      
      return { user: data.user, profile: data.profile };
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('profile');
    
    setToken(null);
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await api.put('/profile', profileData);
      const updatedProfile = response.data;
      localStorage.setItem('profile', JSON.stringify(updatedProfile));
      setProfile(updatedProfile);
      return updatedProfile;
    } catch (error) {
      throw error;
    }
  };

  // Helper setter for avatars or other custom profile mutations
  const updateLocalProfile = (updatedProfile) => {
    localStorage.setItem('profile', JSON.stringify(updatedProfile));
    setProfile(updatedProfile);
  };

  const isAuthenticated = !!token;
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        token,
        loading,
        login,
        register,
        logout,
        updateProfile,
        updateLocalProfile,
        isAuthenticated,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
