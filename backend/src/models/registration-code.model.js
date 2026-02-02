/**
 * Registration Code Model
 * Database operations for registration code management
 * Handles creation, validation, and usage tracking of registration codes
 */

import { query } from '../config/database.js';
import logger from '../config/logger.js';
import crypto from 'crypto';

/**
 * Generate a unique registration code
 * Creates a random alphanumeric code for user registration
 * @returns {string} Generated registration code
 */
const generateCode = () => {
  // Generate a random 8-character alphanumeric code
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

/**
 * Create a new registration code
 * Inserts registration code record into database with expiry time
 * @param {string} createdBy - Admin user ID who created the code
 * @param {Date} expiryTime - Expiration timestamp for the code
 * @returns {Promise<Object>} Created registration code object
 */
export const createRegistrationCode = async (createdBy, expiryTime) => {
  try {
    logger.info(`Creating registration code for admin: ${createdBy}`);
    
    // Generate unique code (retry if duplicate)
    let code = generateCode();
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      const existing = await query(
        'SELECT id FROM registration_codes WHERE code = $1',
        [code]
      );
      
      if (existing.rows.length === 0) {
        break; // Code is unique
      }
      
      code = generateCode();
      attempts++;
    }
    
    if (attempts >= maxAttempts) {
      throw new Error('Failed to generate unique registration code');
    }
    
    const result = await query(
      `INSERT INTO registration_codes (code, expiry_time, created_by, is_active)
       VALUES ($1, $2, $3, TRUE)
       RETURNING id, code, expiry_time, created_by, created_at, is_active`,
      [code, expiryTime, createdBy]
    );
    
    logger.info(`Registration code created successfully: ${code}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating registration code:', error);
    throw error;
  }
};

/**
 * Validate registration code without using it
 * Checks if code exists, is active, not expired, and not already used
 * Does not mark code as used
 * @param {string} code - Registration code to validate
 * @returns {Promise<Object>} Registration code object if valid, null otherwise
 */
export const validateCode = async (code) => {
  try {
    logger.info(`Validating registration code: ${code}`);
    
    const result = await query(
      `SELECT id, code, expiry_time, created_by, used_by, used_at, is_active
       FROM registration_codes
       WHERE code = $1`,
      [code]
    );
    
    if (result.rows.length === 0) {
      logger.warn(`Registration code not found: ${code}`);
      return null;
    }
    
    const registrationCode = result.rows[0];
    
    // Check if code is active
    if (!registrationCode.is_active) {
      logger.warn(`Registration code is inactive: ${code}`);
      return null;
    }
    
    // Check if code is already used
    if (registrationCode.used_by) {
      logger.warn(`Registration code already used: ${code}`);
      return null;
    }
    
    // Check if code is expired
    const now = new Date();
    const expiryTime = new Date(registrationCode.expiry_time);
    if (now > expiryTime) {
      logger.warn(`Registration code expired: ${code}`);
      return null;
    }
    
    logger.info(`Registration code validated successfully: ${code}`);
    return registrationCode;
  } catch (error) {
    logger.error('Error validating registration code:', error);
    throw error;
  }
};

/**
 * Validate and use a registration code
 * Checks if code exists, is active, not expired, and not already used
 * Marks code as used if valid
 * @param {string} code - Registration code to validate
 * @param {string} userId - User ID who is using the code
 * @returns {Promise<Object>} Registration code object if valid
 */
export const validateAndUseCode = async (code, userId) => {
  try {
    logger.info(`Validating registration code: ${code}`);
    
    const result = await query(
      `SELECT id, code, expiry_time, created_by, used_by, used_at, is_active
       FROM registration_codes
       WHERE code = $1`,
      [code]
    );
    
    if (result.rows.length === 0) {
      logger.warn(`Registration code not found: ${code}`);
      return null;
    }
    
    const registrationCode = result.rows[0];
    
    // Check if code is active
    if (!registrationCode.is_active) {
      logger.warn(`Registration code is inactive: ${code}`);
      return null;
    }
    
    // Check if code is already used
    if (registrationCode.used_by) {
      logger.warn(`Registration code already used: ${code}`);
      return null;
    }
    
    // Check if code is expired
    const now = new Date();
    const expiryTime = new Date(registrationCode.expiry_time);
    if (now > expiryTime) {
      logger.warn(`Registration code expired: ${code}`);
      return null;
    }
    
    // Mark code as used
    await query(
      `UPDATE registration_codes
       SET used_by = $1, used_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [userId, registrationCode.id]
    );
    
    logger.info(`Registration code validated and marked as used: ${code}`);
    return registrationCode;
  } catch (error) {
    logger.error('Error validating registration code:', error);
    throw error;
  }
};

/**
 * Get all registration codes
 * Retrieves all registration codes with optional filters
 * @param {Object} filters - Filter options (createdBy, isActive, used)
 * @returns {Promise<Array>} Array of registration codes
 */
export const getAllRegistrationCodes = async (filters = {}) => {
  try {
    logger.debug('Fetching all registration codes');
    
    let queryString = `
      SELECT 
        rc.id,
        rc.code,
        rc.expiry_time,
        rc.created_by,
        rc.used_by,
        rc.used_at,
        rc.is_active,
        rc.created_at,
        creator.email as creator_email,
        user_email.email as user_email
      FROM registration_codes rc
      LEFT JOIN users creator ON rc.created_by = creator.id
      LEFT JOIN users user_email ON rc.used_by = user_email.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    // Filter by creator
    if (filters.createdBy) {
      queryString += ` AND rc.created_by = $${paramIndex}`;
      params.push(filters.createdBy);
      paramIndex++;
    }
    
    // Filter by active status
    if (filters.isActive !== undefined) {
      queryString += ` AND rc.is_active = $${paramIndex}`;
      params.push(filters.isActive);
      paramIndex++;
    }
    
    // Filter by used status
    if (filters.used !== undefined) {
      if (filters.used) {
        queryString += ` AND rc.used_by IS NOT NULL`;
      } else {
        queryString += ` AND rc.used_by IS NULL`;
      }
    }
    
    queryString += ` ORDER BY rc.created_at DESC`;
    
    const result = await query(queryString, params);
    logger.debug(`Found ${result.rows.length} registration codes`);
    return result.rows;
  } catch (error) {
    logger.error('Error fetching registration codes:', error);
    throw error;
  }
};

/**
 * Get registration code by ID
 * Retrieves a specific registration code by its ID
 * @param {string} codeId - Registration code UUID
 * @returns {Promise<Object|null>} Registration code object or null if not found
 */
export const getRegistrationCodeById = async (codeId) => {
  try {
    logger.debug(`Fetching registration code by ID: ${codeId}`);
    
    const result = await query(
      `SELECT 
        rc.id,
        rc.code,
        rc.expiry_time,
        rc.created_by,
        rc.used_by,
        rc.used_at,
        rc.is_active,
        rc.created_at,
        creator.email as creator_email,
        user_email.email as user_email
      FROM registration_codes rc
      LEFT JOIN users creator ON rc.created_by = creator.id
      LEFT JOIN users user_email ON rc.used_by = user_email.id
      WHERE rc.id = $1`,
      [codeId]
    );
    
    if (result.rows.length === 0) {
      logger.debug(`Registration code not found: ${codeId}`);
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    logger.error('Error fetching registration code by ID:', error);
    throw error;
  }
};

/**
 * Deactivate a registration code
 * Sets is_active to false without deleting the record
 * @param {string} codeId - Registration code UUID
 * @returns {Promise<Object>} Updated registration code object
 */
export const deactivateRegistrationCode = async (codeId) => {
  try {
    logger.info(`Deactivating registration code: ${codeId}`);
    
    const result = await query(
      `UPDATE registration_codes
       SET is_active = FALSE
       WHERE id = $1
       RETURNING id, code, is_active`,
      [codeId]
    );
    
    if (result.rows.length === 0) {
      logger.warn(`Registration code not found for deactivation: ${codeId}`);
      return null;
    }
    
    logger.info(`Registration code deactivated: ${codeId}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error deactivating registration code:', error);
    throw error;
  }
};

/**
 * Delete a registration code
 * Permanently removes a registration code from the database
 * @param {string} codeId - Registration code UUID
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
export const deleteRegistrationCode = async (codeId) => {
  try {
    logger.info(`Deleting registration code: ${codeId}`);
    
    const result = await query(
      'DELETE FROM registration_codes WHERE id = $1 RETURNING id',
      [codeId]
    );
    
    if (result.rows.length === 0) {
      logger.warn(`Registration code not found for deletion: ${codeId}`);
      return false;
    }
    
    logger.info(`Registration code deleted: ${codeId}`);
    return true;
  } catch (error) {
    logger.error('Error deleting registration code:', error);
    throw error;
  }
};

