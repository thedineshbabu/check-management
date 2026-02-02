/**
 * Password Utility Functions
 * Handles password hashing and verification using bcrypt
 * Provides secure password management for user authentication
 */

import bcrypt from 'bcrypt';
import logger from '../config/logger.js';

const SALT_ROUNDS = 10; // Number of salt rounds for bcrypt hashing

/**
 * Hash a plain text password
 * Uses bcrypt to create a secure hash of the password
 * @param {string} plainPassword - Plain text password to hash
 * @returns {Promise<string>} Hashed password
 */
export const hashPassword = async (plainPassword) => {
  try {
    logger.debug('Hashing password');
    const hashedPassword = await bcrypt.hash(plainPassword, SALT_ROUNDS);
    logger.debug('Password hashed successfully');
    return hashedPassword;
  } catch (error) {
    logger.error('Error hashing password:', error);
    throw new Error('Failed to hash password');
  }
};

/**
 * Verify a plain text password against a hash
 * Compares the provided password with the stored hash
 * @param {string} plainPassword - Plain text password to verify
 * @param {string} hashedPassword - Stored password hash
 * @returns {Promise<boolean>} True if password matches, false otherwise
 */
export const verifyPassword = async (plainPassword, hashedPassword) => {
  try {
    logger.debug('Verifying password');
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
    logger.debug(`Password verification ${isMatch ? 'successful' : 'failed'}`);
    return isMatch;
  } catch (error) {
    logger.error('Error verifying password:', error);
    throw new Error('Failed to verify password');
  }
};

