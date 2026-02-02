/**
 * Bank Account Model
 * Database operations for bank account management
 * Handles CRUD operations for bank accounts
 */

import { query } from '../config/database.js';
import logger from '../config/logger.js';

/**
 * Get all bank accounts for a user
 * Retrieves all bank accounts belonging to a specific user
 * @param {string} userId - User UUID
 * @returns {Promise<Array>} Array of bank account objects
 */
export const getAccountsByUserId = async (userId) => {
  try {
    logger.debug(`Fetching accounts for user: ${userId}`);
    const result = await query(
      'SELECT id, bank_name, account_number, alias_name, low_balance_threshold, opening_balance, created_at, updated_at FROM bank_accounts WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    logger.debug(`Found ${result.rows.length} accounts for user`);
    return result.rows;
  } catch (error) {
    logger.error('Error fetching accounts:', error);
    throw error;
  }
};

/**
 * Get a single bank account by ID
 * Retrieves bank account by ID and verifies ownership
 * @param {string} accountId - Bank account UUID
 * @param {string} userId - User UUID for ownership verification
 * @returns {Promise<Object|null>} Bank account object or null if not found
 */
export const getAccountById = async (accountId, userId) => {
  try {
    logger.debug(`Fetching account: ${accountId} for user: ${userId}`);
    const result = await query(
      'SELECT id, bank_name, account_number, alias_name, low_balance_threshold, opening_balance, created_at, updated_at FROM bank_accounts WHERE id = $1 AND user_id = $2',
      [accountId, userId]
    );
    
    if (result.rows.length === 0) {
      logger.debug(`Account not found: ${accountId}`);
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    logger.error('Error fetching account by ID:', error);
    throw error;
  }
};

/**
 * Create a new bank account
 * Inserts new bank account record into database
 * @param {string} userId - User UUID
 * @param {Object} accountData - Bank account data
 * @param {string} accountData.bank_name - Bank name
 * @param {string} accountData.account_number - Account number
 * @param {string} accountData.alias_name - Account alias name
 * @param {number} accountData.low_balance_threshold - Low balance threshold
 * @param {number} accountData.opening_balance - Opening balance amount
 * @returns {Promise<Object>} Created bank account object
 */
export const createAccount = async (userId, accountData) => {
  try {
    const { bank_name, account_number, alias_name, low_balance_threshold, opening_balance } = accountData;
    logger.info(`Creating account for user: ${userId}, bank: ${bank_name}`);
    
    const result = await query(
      'INSERT INTO bank_accounts (user_id, bank_name, account_number, alias_name, low_balance_threshold, opening_balance) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, bank_name, account_number, alias_name, low_balance_threshold, opening_balance, created_at, updated_at',
      [userId, bank_name, account_number, alias_name || null, low_balance_threshold || 0, opening_balance || 0]
    );
    
    logger.info(`Account created successfully: ${result.rows[0].id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating account:', error);
    // Check for unique constraint violation
    if (error.code === '23505') {
      throw new Error('Account number already exists for this user');
    }
    throw error;
  }
};

/**
 * Update a bank account
 * Updates existing bank account record
 * @param {string} accountId - Bank account UUID
 * @param {string} userId - User UUID for ownership verification
 * @param {Object} accountData - Updated bank account data
 * @returns {Promise<Object|null>} Updated bank account object or null if not found
 */
export const updateAccount = async (accountId, userId, accountData) => {
  try {
    const { bank_name, account_number, alias_name, low_balance_threshold, opening_balance } = accountData;
    logger.info(`Updating account: ${accountId} for user: ${userId}`);
    
    const result = await query(
      'UPDATE bank_accounts SET bank_name = $1, account_number = $2, alias_name = $3, low_balance_threshold = $4, opening_balance = $5 WHERE id = $6 AND user_id = $7 RETURNING id, bank_name, account_number, alias_name, low_balance_threshold, opening_balance, created_at, updated_at',
      [bank_name, account_number, alias_name || null, low_balance_threshold || 0, opening_balance || 0, accountId, userId]
    );
    
    if (result.rows.length === 0) {
      logger.warn(`Account not found for update: ${accountId}`);
      return null;
    }
    
    logger.info(`Account updated successfully: ${accountId}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error updating account:', error);
    throw error;
  }
};

/**
 * Delete a bank account
 * Removes bank account record from database
 * @param {string} accountId - Bank account UUID
 * @param {string} userId - User UUID for ownership verification
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
export const deleteAccount = async (accountId, userId) => {
  try {
    logger.info(`Deleting account: ${accountId} for user: ${userId}`);
    const result = await query(
      'DELETE FROM bank_accounts WHERE id = $1 AND user_id = $2 RETURNING id',
      [accountId, userId]
    );
    
    if (result.rows.length === 0) {
      logger.warn(`Account not found for deletion: ${accountId}`);
      return false;
    }
    
    logger.info(`Account deleted successfully: ${accountId}`);
    return true;
  } catch (error) {
    logger.error('Error deleting account:', error);
    throw error;
  }
};

