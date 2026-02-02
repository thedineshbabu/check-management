/**
 * User Model
 * Database operations for user management
 * Handles user creation, retrieval, and authentication queries
 */

import { query } from '../config/database.js';
import logger from '../config/logger.js';

/**
 * Create a new user
 * Inserts user record into database
 * @param {string} email - User email address
 * @param {string} passwordHash - Hashed password
 * @returns {Promise<Object>} Created user object
 */
export const createUser = async (email, passwordHash) => {
  try {
    logger.info(`Creating new user: ${email}`);
    const result = await query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
      [email, passwordHash]
    );
    logger.info(`User created successfully: ${email}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating user:', error);
    throw error;
  }
};

/**
 * Find user by email
 * Retrieves user record by email address
 * @param {string} email - User email address
 * @returns {Promise<Object|null>} User object or null if not found
 */
export const findUserByEmail = async (email) => {
  try {
    logger.debug(`Finding user by email: ${email}`);
    const result = await query(
      'SELECT id, email, password_hash, is_admin, expiry_time, created_at FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      logger.debug(`User not found: ${email}`);
      return null;
    }
    
    logger.debug(`User found: ${email}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error finding user by email:', error);
    throw error;
  }
};

/**
 * Find user by ID
 * Retrieves user record by user ID
 * @param {string} userId - User UUID
 * @returns {Promise<Object|null>} User object or null if not found
 */
export const findUserById = async (userId) => {
  try {
    logger.debug(`Finding user by ID: ${userId}`);
    const result = await query(
      'SELECT id, email, is_admin, expiry_time, created_at FROM users WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      logger.debug(`User not found: ${userId}`);
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    logger.error('Error finding user by ID:', error);
    throw error;
  }
};

/**
 * Get all users
 * Retrieves all users with optional filters
 * @param {Object} filters - Filter options (isAdmin, expired)
 * @returns {Promise<Array>} Array of user objects
 */
export const getAllUsers = async (filters = {}) => {
  try {
    logger.debug('Fetching all users');
    
    let queryString = 'SELECT id, email, is_admin, expiry_time, created_at FROM users WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    // Filter by admin status
    if (filters.isAdmin !== undefined) {
      queryString += ` AND is_admin = $${paramIndex}`;
      params.push(filters.isAdmin);
      paramIndex++;
    }
    
    // Filter by expired status
    if (filters.expired !== undefined) {
      if (filters.expired) {
        queryString += ` AND expiry_time IS NOT NULL AND expiry_time < CURRENT_TIMESTAMP`;
      } else {
        queryString += ` AND (expiry_time IS NULL OR expiry_time >= CURRENT_TIMESTAMP)`;
      }
    }
    
    queryString += ' ORDER BY created_at DESC';
    
    const result = await query(queryString, params);
    logger.debug(`Found ${result.rows.length} users`);
    return result.rows;
  } catch (error) {
    logger.error('Error fetching users:', error);
    throw error;
  }
};

/**
 * Check if user account is expired
 * Verifies if user's expiry time has passed
 * @param {Object} user - User object with expiry_time
 * @returns {boolean} True if user is expired
 */
export const isUserExpired = (user) => {
  if (!user.expiry_time) {
    return false; // No expiry means permanent access
  }
  const now = new Date();
  const expiryTime = new Date(user.expiry_time);
  return now > expiryTime;
};

/**
 * Update user expiry time
 * Sets or updates the expiry time for a user account
 * @param {string} userId - User UUID
 * @param {Date|null} expiryTime - New expiry timestamp (null for no expiry)
 * @returns {Promise<Object>} Updated user object
 */
export const updateUserExpiry = async (userId, expiryTime) => {
  try {
    logger.info(`Updating expiry time for user: ${userId}`);
    
    const result = await query(
      'UPDATE users SET expiry_time = $1 WHERE id = $2 RETURNING id, email, is_admin, expiry_time, created_at',
      [expiryTime, userId]
    );
    
    if (result.rows.length === 0) {
      logger.warn(`User not found for expiry update: ${userId}`);
      return null;
    }
    
    logger.info(`User expiry updated successfully: ${userId}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error updating user expiry:', error);
    throw error;
  }
};

/**
 * Update user password
 * Updates password hash for a user
 * @param {string} userId - User UUID
 * @param {string} passwordHash - New hashed password
 * @returns {Promise<Object>} Updated user object
 */
export const updateUserPassword = async (userId, passwordHash) => {
  try {
    logger.info(`Updating password for user: ${userId}`);
    
    const result = await query(
      'UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id, email, created_at',
      [passwordHash, userId]
    );
    
    if (result.rows.length === 0) {
      logger.warn(`User not found for password update: ${userId}`);
      return null;
    }
    
    logger.info(`Password updated successfully for user: ${userId}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error updating user password:', error);
    throw error;
  }
};

/**
 * Update user admin status
 * Grants or revokes admin privileges for a user
 * @param {string} userId - User UUID
 * @param {boolean} isAdmin - Admin status
 * @returns {Promise<Object>} Updated user object
 */
export const updateUserAdminStatus = async (userId, isAdmin) => {
  try {
    logger.info(`Updating admin status for user: ${userId} to ${isAdmin}`);
    
    const result = await query(
      'UPDATE users SET is_admin = $1 WHERE id = $2 RETURNING id, email, is_admin, created_at',
      [isAdmin, userId]
    );
    
    if (result.rows.length === 0) {
      logger.warn(`User not found for admin status update: ${userId}`);
      return null;
    }
    
    logger.info(`Admin status updated successfully for user: ${userId}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error updating user admin status:', error);
    throw error;
  }
};

/**
 * Delete user
 * Permanently removes a user from the database
 * @param {string} userId - User UUID
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
export const deleteUser = async (userId) => {
  try {
    logger.info(`Deleting user: ${userId}`);
    
    const result = await query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [userId]
    );
    
    if (result.rows.length === 0) {
      logger.warn(`User not found for deletion: ${userId}`);
      return false;
    }
    
    logger.info(`User deleted successfully: ${userId}`);
    return true;
  } catch (error) {
    logger.error('Error deleting user:', error);
    throw error;
  }
};

