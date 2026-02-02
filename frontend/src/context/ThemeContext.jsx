/**
 * Theme Context
 * Manages application theme state (light/dark mode)
 * Persists theme preference to localStorage
 * Provides theme toggle functionality
 */

import { createContext, useContext, useState, useEffect } from 'react';
import logger from '../utils/logger';

/**
 * Theme Context Object
 * Provides theme state and toggle function
 */
const ThemeContext = createContext();

/**
 * Theme Provider Component
 * Wraps application to provide theme context
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const ThemeProvider = ({ children }) => {
  // Initialize theme from localStorage or default to 'dark'
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('app-theme');
    logger.info(`Initializing theme from storage: ${savedTheme || 'dark (default)'}`);
    return savedTheme || 'dark';
  });

  /**
   * Apply theme to document root
   * Updates data-theme attribute for CSS variable switching
   * @param {string} newTheme - Theme to apply ('light' or 'dark')
   */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    logger.info(`Theme applied: ${theme}`);
  }, [theme]);

  /**
   * Toggle between light and dark themes
   * Saves preference to localStorage
   */
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('app-theme', newTheme);
    logger.info(`Theme toggled to: ${newTheme}`);
  };

  /**
   * Set theme explicitly
   * @param {string} newTheme - Theme to set ('light' or 'dark')
   */
  const setThemeValue = (newTheme) => {
    if (newTheme === 'light' || newTheme === 'dark') {
      setTheme(newTheme);
      localStorage.setItem('app-theme', newTheme);
      logger.info(`Theme set to: ${newTheme}`);
    } else {
      logger.warn(`Invalid theme value: ${newTheme}. Must be 'light' or 'dark'`);
    }
  };

  const value = {
    theme,
    toggleTheme,
    setTheme: setThemeValue,
    isDark: theme === 'dark',
    isLight: theme === 'light'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Custom hook to use theme context
 * @returns {Object} Theme context value
 * @throws {Error} If used outside ThemeProvider
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    logger.error('useTheme must be used within ThemeProvider');
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export default ThemeContext;

