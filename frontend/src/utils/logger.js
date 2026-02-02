/**
 * Frontend Logger Utility
 * Simple console logger for frontend logging
 * Can be extended with more sophisticated logging in production
 */

const logger = {
  /**
   * Log info messages
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   */
  info: (message, data) => {
    console.log(`[INFO] ${message}`, data || '');
  },

  /**
   * Log warning messages
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   */
  warn: (message, data) => {
    console.warn(`[WARN] ${message}`, data || '');
  },

  /**
   * Log error messages
   * @param {string} message - Log message
   * @param {Object} error - Error object
   */
  error: (message, error) => {
    console.error(`[ERROR] ${message}`, error || '');
  },

  /**
   * Log debug messages
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   */
  debug: (message, data) => {
    if (import.meta.env.DEV) {
      console.debug(`[DEBUG] ${message}`, data || '');
    }
  }
};

export default logger;

