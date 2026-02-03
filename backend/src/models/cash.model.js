/**
 * Cash Model
 * Database operations for cash transaction management
 * Handles CRUD operations for cash credit and debit transactions
 */

import { query } from '../config/database.js';
import logger from '../config/logger.js';

/**
 * Get cash transactions with optional filters
 * Retrieves cash transactions based on user, date, and type filters
 * @param {string} userId - User UUID
 * @param {Object} filters - Filter options
 * @param {string} filters.date - Filter by specific date (YYYY-MM-DD)
 * @param {string} filters.type - Filter by cash type (credit/debit)
 * @param {string} filters.startDate - Filter by start date range
 * @param {string} filters.endDate - Filter by end date range
 * @returns {Promise<Array>} Array of cash transaction objects
 */
export const getCashTransactions = async (userId, filters = {}) => {
  try {
    const { date, type, startDate, endDate } = filters;
    logger.debug(`Fetching cash transactions for user: ${userId}`, { filters });
    
    let queryText = `
      SELECT id, user_id, type, amount, date, description, created_at, updated_at
      FROM cash
      WHERE user_id = $1
    `;
    const params = [userId];
    let paramIndex = 2;
    
    // Add filters dynamically
    if (date) {
      queryText += ` AND date = $${paramIndex}`;
      params.push(date);
      paramIndex++;
    }
    
    if (type) {
      queryText += ` AND type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }
    
    if (startDate) {
      queryText += ` AND date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }
    
    if (endDate) {
      queryText += ` AND date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }
    
    queryText += ' ORDER BY date DESC, created_at DESC';
    
    const result = await query(queryText, params);
    logger.debug(`Found ${result.rows.length} cash transactions`);
    return result.rows;
  } catch (error) {
    logger.error('Error fetching cash transactions:', error);
    throw error;
  }
};

/**
 * Get a single cash transaction by ID
 * Retrieves cash transaction by ID and verifies ownership
 * @param {string} cashId - Cash transaction UUID
 * @param {string} userId - User UUID for ownership verification
 * @returns {Promise<Object|null>} Cash transaction object or null if not found
 */
export const getCashTransactionById = async (cashId, userId) => {
  try {
    logger.debug(`Fetching cash transaction: ${cashId} for user: ${userId}`);
    const result = await query(
      `SELECT id, user_id, type, amount, date, description, created_at, updated_at
       FROM cash
       WHERE id = $1 AND user_id = $2`,
      [cashId, userId]
    );
    
    if (result.rows.length === 0) {
      logger.debug(`Cash transaction not found: ${cashId}`);
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    logger.error('Error fetching cash transaction by ID:', error);
    throw error;
  }
};

/**
 * Create a new cash transaction
 * Inserts new cash transaction record into database
 * Verifies user ownership before creation
 * @param {string} userId - User UUID for ownership verification
 * @param {Object} cashData - Cash transaction data
 * @param {string} cashData.type - Cash type (credit/debit)
 * @param {number} cashData.amount - Cash amount
 * @param {string} cashData.date - Transaction date (YYYY-MM-DD)
 * @param {string} cashData.description - Transaction description
 * @returns {Promise<Object>} Created cash transaction object
 */
export const createCashTransaction = async (userId, cashData) => {
  try {
    const { type, amount, date, description } = cashData;
    logger.info(`Creating ${type} cash transaction for user: ${userId}, amount: ${amount}`);
    
    const result = await query(
      'INSERT INTO cash (user_id, type, amount, date, description) VALUES ($1, $2, $3, $4, $5) RETURNING id, user_id, type, amount, date, description, created_at, updated_at',
      [userId, type, amount, date, description]
    );
    
    logger.info(`Cash transaction created successfully: ${result.rows[0].id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating cash transaction:', error);
    throw error;
  }
};

/**
 * Update a cash transaction
 * Updates existing cash transaction record
 * Verifies ownership before update
 * @param {string} cashId - Cash transaction UUID
 * @param {string} userId - User UUID for ownership verification
 * @param {Object} cashData - Updated cash transaction data
 * @returns {Promise<Object|null>} Updated cash transaction object or null if not found
 */
export const updateCashTransaction = async (cashId, userId, cashData) => {
  try {
    const { type, amount, date, description } = cashData;
    logger.info(`Updating cash transaction: ${cashId} for user: ${userId}`);
    
    const result = await query(
      `UPDATE cash 
       SET type = COALESCE($1, type),
           amount = COALESCE($2, amount),
           date = COALESCE($3, date),
           description = COALESCE($4, description)
       WHERE id = $5 AND user_id = $6
       RETURNING id, user_id, type, amount, date, description, created_at, updated_at`,
      [type || null, amount || null, date || null, description || null, cashId, userId]
    );
    
    if (result.rows.length === 0) {
      logger.warn(`Cash transaction not found for update: ${cashId}`);
      return null;
    }
    
    logger.info(`Cash transaction updated successfully: ${cashId}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error updating cash transaction:', error);
    throw error;
  }
};

/**
 * Delete a cash transaction
 * Removes cash transaction record from database
 * Verifies ownership before deletion
 * @param {string} cashId - Cash transaction UUID
 * @param {string} userId - User UUID for ownership verification
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
export const deleteCashTransaction = async (cashId, userId) => {
  try {
    logger.info(`Deleting cash transaction: ${cashId} for user: ${userId}`);
    const result = await query(
      `DELETE FROM cash 
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [cashId, userId]
    );
    
    if (result.rows.length === 0) {
      logger.warn(`Cash transaction not found for deletion: ${cashId}`);
      return false;
    }
    
    logger.info(`Cash transaction deleted successfully: ${cashId}`);
    return true;
  } catch (error) {
    logger.error('Error deleting cash transaction:', error);
    throw error;
  }
};
