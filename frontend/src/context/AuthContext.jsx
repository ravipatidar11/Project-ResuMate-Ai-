import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/auth';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchUser = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const res = await authAPI.getMe();
          setUser(res.data);
        } catch (error) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await authAPI.login({ email, password });
      const { access_token, user: loggedUser } = res.data;
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(loggedUser));
      setToken(access_token);
      setUser(loggedUser);
      addToast(`Welcome back, ${loggedUser.full_name || loggedUser.email}!`, 'success');
      return loggedUser;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed. Please check your credentials.';
      addToast(msg, 'error');
      throw err;
    }
  };

  const register = async (email, password, full_name) => {
    try {
      const res = await authAPI.register({ email, password, full_name });
      const { access_token, user: registeredUser } = res.data;
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(registeredUser));
      setToken(access_token);
      setUser(registeredUser);
      addToast('Account created successfully!', 'success');
      return registeredUser;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed.';
      addToast(msg, 'error');
      throw err;
    }
  };

  const demoLogin = async () => {
    try {
      const res = await authAPI.demoLogin();
      const { access_token, user: demoUser } = res.data;
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(demoUser));
      setToken(access_token);
      setUser(demoUser);
      addToast('Logged in to Instant Demo Account!', 'success');
      return demoUser;
    } catch (err) {
      addToast('Failed to start demo session', 'error');
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    addToast('Logged out successfully', 'info');
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        demoLogin,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
