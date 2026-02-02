/**
 * Theme Toggle Component
 * Provides UI control to switch between light and dark themes
 * Displays current theme and allows toggling
 */

import { useTheme } from '../context/ThemeContext';
import logger from '../utils/logger';
import './ThemeToggle.css';

/**
 * Theme Toggle Component
 * Button component that toggles between light and dark themes
 * @returns {JSX.Element} Theme toggle button
 */
const ThemeToggle = () => {
  const { theme, toggleTheme, isDark } = useTheme();

  /**
   * Handle theme toggle click
   * Logs theme change for debugging
   */
  const handleToggle = () => {
    logger.info(`Theme toggle clicked. Current theme: ${theme}`);
    toggleTheme();
  };

  return (
    <button
      className="theme-toggle"
      onClick={handleToggle}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      title={`Current theme: ${theme}. Click to switch to ${isDark ? 'light' : 'dark'}`}
    >
      <span className="theme-toggle-icon">
        {isDark ? (
          // Sun icon for dark theme (clicking will switch to light)
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
        ) : (
          // Moon icon for light theme (clicking will switch to dark)
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        )}
      </span>
      <span className="theme-toggle-text">
        {isDark ? 'Light' : 'Dark'}
      </span>
    </button>
  );
};

export default ThemeToggle;

