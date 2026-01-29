// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import authApi  from '../api/authApi';

const AuthContext = React.createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authApi.login({ email, password });
      const userData = response.data.user;
      const token = response.data.token;

      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', token);

      setUser(userData);
      return true;
    } catch (error) {
      console.log('Login error:', error);
      return false;
    }
  };

  const register = async ({ name, email, rollNumber, password }) => {
    try {
      const response = await authApi.register({ name, email, rollNumber, password });
      const userData = response.data.user;
      const token = response.data.token;

      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', token);

      setUser(userData);
      return true;
    } catch (error) {
      console.log('Register error:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    isLoading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => React.useContext(AuthContext);