/**
 * Check Model
 * Database operations for check management
 * Handles CRUD operations for incoming and outgoing checks
 */

import { query } from '../config/database.js';
import logger from '../config/logger.js';

/**
 * Get checks with optional filters
 * Retrieves checks based on user, account, date, and type filters
 * @param {string} userId - User UUID
 * @param {Object} filters - Filter options
 * @param {string} filters.accountId - Filter by bank account ID
 * @param {string} filters.date - Filter by specific date (YYYY-MM-DD)
 * @param {string} filters.type - Filter by check type (incoming/outgoing)
 * @param {string} filters.startDate - Filter by start date range
 * @param {string} filters.endDate - Filter by end date range
 * @returns {Promise<Array>} Array of check objects
 */
export const getChecks = async (userId, filters = {}) => {
  try {
    const { accountId, date, type, startDate, endDate } = filters;
    logger.debug(`Fetching checks for user: ${userId}`, { filters });
    
    let queryText = `
      SELECT c.id, c.bank_account_id, c.type, c.amount, c.date, c.payee_payer_name, c.created_at, c.updated_at,
             ba.bank_name, ba.alias_name, ba.account_number
      FROM checks c
      INNER JOIN bank_accounts ba ON c.bank_account_id = ba.id
      WHERE ba.user_id = $1
    `;
    const params = [userId];
    let paramIndex = 2;
    
    // Add filters dynamically
    if (accountId) {
      queryText += ` AND c.bank_account_id = $${paramIndex}`;
      params.push(accountId);
      paramIndex++;
    }
    
    if (date) {
      queryText += ` AND c.date = $${paramIndex}`;
      params.push(date);
      paramIndex++;
    }
    
    if (type) {
      queryText += ` AND c.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }
    
    if (startDate) {
      queryText += ` AND c.date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }
    
    if (endDate) {
      queryText += ` AND c.date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }
    
    queryText += ' ORDER BY c.date DESC, c.created_at DESC';
    
    const result = await query(queryText, params);
    logger.debug(`Found ${result.rows.length} checks`);
    return result.rows;
  } catch (error) {
    logger.error('Error fetching checks:', error);
    throw error;
  }
};

/**
 * Get a single check by ID
 * Retrieves check by ID and verifies ownership through account
 * @param {string} checkId - Check UUID
 * @param {string} userId - User UUID for ownership verification
 * @returns {Promise<Object|null>} Check object or null if not found
 */
export const getCheckById = async (checkId, userId) => {
  try {
    logger.debug(`Fetching check: ${checkId} for user: ${userId}`);
    const result = await query(
      `SELECT c.id, c.bank_account_id, c.type, c.amount, c.date, c.payee_payer_name, c.created_at, c.updated_at,
              ba.bank_name, ba.alias_name, ba.account_number
       FROM checks c
       INNER JOIN bank_accounts ba ON c.bank_account_id = ba.id
       WHERE c.id = $1 AND ba.user_id = $2`,
      [checkId, userId]
    );
    
    if (result.rows.length === 0) {
      logger.debug(`Check not found: ${checkId}`);
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    logger.error('Error fetching check by ID:', error);
    throw error;
  }
};

/**
 * Create a new check
 * Inserts new check record into database
 * Verifies account ownership before creation
 * @param {string} userId - User UUID for ownership verification
 * @param {Object} checkData - Check data
 * @param {string} checkData.bank_account_id - Bank account UUID
 * @param {string} checkData.type - Check type (incoming/outgoing)
 * @param {number} checkData.amount - Check amount
 * @param {string} checkData.date - Check date (YYYY-MM-DD)
 * @param {string} checkData.payee_payer_name - Payee or payer name
 * @returns {Promise<Object>} Created check object
 */
export const createCheck = async (userId, checkData) => {
  try {
    const { bank_account_id, type, amount, date, payee_payer_name } = checkData;
    logger.info(`Creating ${type} check for user: ${userId}, amount: ${amount}`);
    
    // Verify account ownership
    const accountCheck = await query(
      'SELECT id FROM bank_accounts WHERE id = $1 AND user_id = $2',
      [bank_account_id, userId]
    );
    
    if (accountCheck.rows.length === 0) {
      logger.warn(`Account not found or access denied: ${bank_account_id}`);
      throw new Error('Bank account not found or access denied');
    }
    
    const result = await query(
      'INSERT INTO checks (bank_account_id, type, amount, date, payee_payer_name) VALUES ($1, $2, $3, $4, $5) RETURNING id, bank_account_id, type, amount, date, payee_payer_name, created_at, updated_at',
      [bank_account_id, type, amount, date, payee_payer_name]
    );
    
    logger.info(`Check created successfully: ${result.rows[0].id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating check:', error);
    throw error;
  }
};

/**
 * Update a check
 * Updates existing check record
 * Verifies ownership before update
 * @param {string} checkId - Check UUID
 * @param {string} userId - User UUID for ownership verification
 * @param {Object} checkData - Updated check data
 * @returns {Promise<Object|null>} Updated check object or null if not found
 */
export const updateCheck = async (checkId, userId, checkData) => {
  try {
    const { bank_account_id, type, amount, date, payee_payer_name } = checkData;
    logger.info(`Updating check: ${checkId} for user: ${userId}`);
    
    // Verify account ownership if bank_account_id is being changed
    if (bank_account_id) {
      const accountCheck = await query(
        'SELECT id FROM bank_accounts WHERE id = $1 AND user_id = $2',
        [bank_account_id, userId]
      );
      
      if (accountCheck.rows.length === 0) {
        logger.warn(`Account not found or access denied: ${bank_account_id}`);
        throw new Error('Bank account not found or access denied');
      }
    }
    
    const result = await query(
      `UPDATE checks 
       SET bank_account_id = COALESCE($1, bank_account_id),
           type = COALESCE($2, type),
           amount = COALESCE($3, amount),
           date = COALESCE($4, date),
           payee_payer_name = COALESCE($5, payee_payer_name)
       WHERE id = $6 
       AND EXISTS (
         SELECT 1 FROM bank_accounts ba 
         WHERE ba.id = checks.bank_account_id 
         AND ba.user_id = $7
       )
       RETURNING id, bank_account_id, type, amount, date, payee_payer_name, created_at, updated_at`,
      [bank_account_id || null, type || null, amount || null, date || null, payee_payer_name || null, checkId, userId]
    );
    
    if (result.rows.length === 0) {
      logger.warn(`Check not found for update: ${checkId}`);
      return null;
    }
    
    logger.info(`Check updated successfully: ${checkId}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error updating check:', error);
    throw error;
  }
};

/**
 * Delete a check
 * Removes check record from database
 * Verifies ownership before deletion
 * @param {string} checkId - Check UUID
 * @param {string} userId - User UUID for ownership verification
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
export const deleteCheck = async (checkId, userId) => {
  try {
    logger.info(`Deleting check: ${checkId} for user: ${userId}`);
    const result = await query(
      `DELETE FROM checks 
       WHERE id = $1 
       AND EXISTS (
         SELECT 1 FROM bank_accounts ba 
         WHERE ba.id = checks.bank_account_id 
         AND ba.user_id = $2
       )
       RETURNING id`,
      [checkId, userId]
    );
    
    if (result.rows.length === 0) {
      logger.warn(`Check not found for deletion: ${checkId}`);
      return false;
    }
    
    logger.info(`Check deleted successfully: ${checkId}`);
    return true;
  } catch (error) {
    logger.error('Error deleting check:', error);
    throw error;
  }
};

