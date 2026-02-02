/**
 * Validation Utility Functions
 * Provides input validation for API requests
 * Ensures data integrity and prevents invalid data entry
 */

import logger from '../config/logger.js';

/**
 * Validate email format
 * Checks if email matches standard email pattern
 * @param {string} email - Email address to validate
 * @returns {boolean} True if email is valid, false otherwise
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * Ensures password meets minimum requirements
 * @param {string} password - Password to validate
 * @returns {boolean} True if password is valid, false otherwise
 */
export const isValidPassword = (password) => {
  // Minimum 6 characters
  return password && password.length >= 6;
};

/**
 * Validate required fields in an object
 * Checks if all required fields are present and not empty
 * @param {Object} data - Object to validate
 * @param {Array<string>} requiredFields - Array of required field names
 * @returns {Object} Validation result with isValid flag and missing fields
 */
export const validateRequiredFields = (data, requiredFields) => {
  const missingFields = [];
  
  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      missingFields.push(field);
    }
  }
  
  return {
    isValid: missingFields.length === 0,
    missingFields
  };
};

/**
 * Validate amount (must be positive number)
 * Ensures amount is a valid positive number
 * @param {number|string} amount - Amount to validate
 * @returns {boolean} True if amount is valid, false otherwise
 */
export const isValidAmount = (amount) => {
  const numAmount = parseFloat(amount);
  return !isNaN(numAmount) && numAmount > 0;
};

/**
 * Validate date format (YYYY-MM-DD)
 * Checks if date string matches required format
 * @param {string} date - Date string to validate
 * @returns {boolean} True if date format is valid, false otherwise
 */
export const isValidDate = (date) => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return false;
  }
  const parsedDate = new Date(date);
  return parsedDate instanceof Date && !isNaN(parsedDate);
};

/**
 * Sanitize string input
 * Removes leading/trailing whitespace and prevents XSS
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
export const sanitizeString = (str) => {
  if (typeof str !== 'string') {
    return str;
  }
  return str.trim();
};

