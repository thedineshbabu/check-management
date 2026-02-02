/**
 * Authentication Context
 * Manages user authentication state and provides auth methods
 * Uses React Context API for global state management
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import logger from '../utils/logger';

const AuthContext = createContext(null);

/**
 * AuthProvider Component
 * Provides authentication context to child components
 * Manages token and user state in localStorage
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Initialize auth state from localStorage
   * Runs on component mount
   */
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      logger.info('User session restored from localStorage');
    }
    setLoading(false);
  }, []);

  /**
   * Login function
   * Authenticates user and stores token/user in localStorage
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} Login result
   */
  const login = async (email, password) => {
    try {
      logger.info(`Login attempt for: ${email}`);
      const response = await authAPI.login(email, password);
      
      setToken(response.token);
      setUser(response.user);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      logger.info('Login successful');
      return { success: true };
    } catch (error) {
      logger.error('Login failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      };
    }
  };

  /**
   * Register function
   * Creates new user account and logs in
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} registrationCode - Registration code required for signup
   * @returns {Promise} Registration result
   */
  const register = async (email, password, registrationCode) => {
    try {
      logger.info(`Registration attempt for: ${email}`);
      const response = await authAPI.register(email, password, registrationCode);
      
      setToken(response.token);
      setUser(response.user);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      logger.info('Registration successful');
      return { success: true };
    } catch (error) {
      logger.error('Registration failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Registration failed' 
      };
    }
  };

  /**
   * Logout function
   * Clears authentication state and localStorage
   */
  const logout = () => {
    logger.info('User logged out');
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  /**
   * Check if user is authenticated
   * @returns {boolean} True if user is logged in
   */
  const isAuthenticated = () => {
    return !!token && !!user;
  };

  /**
   * Check if user is admin
   * @returns {boolean} True if user has admin privileges
   */
  const isAdmin = () => {
    return !!user && user.isAdmin === true;
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated,
    isAdmin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * useAuth Hook
 * Custom hook to access authentication context
 * @returns {Object} Auth context value
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

