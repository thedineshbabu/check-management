/**
 * Recurring Transaction Model
 * Database operations for recurring transaction management
 * Handles CRUD operations for scheduled recurring transactions
 */

import { query } from '../config/database.js';
import logger from '../config/logger.js';

/**
 * Calculate next due date based on frequency and current date
 * Helper function to determine when next transaction should be created
 * @param {string} frequency - Frequency type (daily, weekly, monthly, yearly)
 * @param {Date} lastDate - Last created date or start date
 * @param {number} dayOfMonth - Day of month for monthly/yearly (1-31)
 * @param {number} dayOfWeek - Day of week for weekly (0=Sunday, 6=Saturday)
 * @returns {Date} Next due date
 */
const calculateNextDueDate = (frequency, lastDate, dayOfMonth = null, dayOfWeek = null) => {
  const nextDate = new Date(lastDate);
  
  switch (frequency) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 'weekly':
      if (dayOfWeek !== null) {
        // Find next occurrence of specified day of week
        const daysUntilNext = (dayOfWeek - nextDate.getDay() + 7) % 7 || 7;
        nextDate.setDate(nextDate.getDate() + daysUntilNext);
      } else {
        nextDate.setDate(nextDate.getDate() + 7);
      }
      break;
    case 'monthly':
      if (dayOfMonth !== null) {
        // Set to next month with specified day
        nextDate.setMonth(nextDate.getMonth() + 1);
        // Handle months with fewer days (e.g., Feb 31 -> Feb 28)
        const lastDayOfMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
        nextDate.setDate(Math.min(dayOfMonth, lastDayOfMonth));
      } else {
        nextDate.setMonth(nextDate.getMonth() + 1);
      }
      break;
    case 'yearly':
      if (dayOfMonth !== null) {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        const lastDayOfMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
        nextDate.setDate(Math.min(dayOfMonth, lastDayOfMonth));
      } else {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
      }
      break;
    default:
      logger.warn(`Unknown frequency: ${frequency}`);
  }
  
  return nextDate;
};

/**
 * Get all recurring transactions for a user
 * Retrieves all recurring transactions belonging to a specific user
 * @param {string} userId - User UUID
 * @param {Object} filters - Filter options (isActive, transactionType)
 * @returns {Promise<Array>} Array of recurring transaction objects
 */
export const getRecurringTransactions = async (userId, filters = {}) => {
  try {
    const { isActive, transactionType } = filters;
    logger.debug(`Fetching recurring transactions for user: ${userId}`, { filters });
    
    let queryText = `
      SELECT rt.id, rt.user_id, rt.transaction_type, rt.bank_account_id, rt.check_type,
             rt.cash_type, rt.amount, rt.payee_payer_name, rt.description,
             rt.frequency, rt.start_date, rt.end_date, rt.day_of_month, rt.day_of_week,
             rt.is_active, rt.last_created_date, rt.next_due_date,
             rt.created_at, rt.updated_at,
             ba.bank_name, ba.alias_name, ba.account_number
      FROM recurring_transactions rt
      LEFT JOIN bank_accounts ba ON rt.bank_account_id = ba.id
      WHERE rt.user_id = $1
    `;
    const params = [userId];
    let paramIndex = 2;
    
    // Add filters dynamically
    if (isActive !== undefined) {
      queryText += ` AND rt.is_active = $${paramIndex}`;
      params.push(isActive);
      paramIndex++;
    }
    
    if (transactionType) {
      queryText += ` AND rt.transaction_type = $${paramIndex}`;
      params.push(transactionType);
      paramIndex++;
    }
    
    queryText += ' ORDER BY rt.next_due_date ASC, rt.created_at DESC';
    
    const result = await query(queryText, params);
    logger.debug(`Found ${result.rows.length} recurring transactions`);
    return result.rows;
  } catch (error) {
    logger.error('Error fetching recurring transactions:', error);
    throw error;
  }
};

/**
 * Get a single recurring transaction by ID
 * Retrieves recurring transaction by ID and verifies ownership
 * @param {string} recurringId - Recurring transaction UUID
 * @param {string} userId - User UUID for ownership verification
 * @returns {Promise<Object|null>} Recurring transaction object or null if not found
 */
export const getRecurringTransactionById = async (recurringId, userId) => {
  try {
    logger.debug(`Fetching recurring transaction: ${recurringId} for user: ${userId}`);
    const result = await query(
      `SELECT rt.id, rt.user_id, rt.transaction_type, rt.bank_account_id, rt.check_type,
              rt.cash_type, rt.amount, rt.payee_payer_name, rt.description,
              rt.frequency, rt.start_date, rt.end_date, rt.day_of_month, rt.day_of_week,
              rt.is_active, rt.last_created_date, rt.next_due_date,
              rt.created_at, rt.updated_at,
              ba.bank_name, ba.alias_name, ba.account_number
       FROM recurring_transactions rt
       LEFT JOIN bank_accounts ba ON rt.bank_account_id = ba.id
       WHERE rt.id = $1 AND rt.user_id = $2`,
      [recurringId, userId]
    );
    
    if (result.rows.length === 0) {
      logger.debug(`Recurring transaction not found: ${recurringId}`);
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    logger.error('Error fetching recurring transaction by ID:', error);
    throw error;
  }
};

/**
 * Create a new recurring transaction
 * Inserts new recurring transaction record into database
 * Calculates initial next_due_date based on frequency
 * @param {string} userId - User UUID
 * @param {Object} recurringData - Recurring transaction data
 * @returns {Promise<Object>} Created recurring transaction object
 */
export const createRecurringTransaction = async (userId, recurringData) => {
  try {
    const {
      transaction_type,
      bank_account_id,
      check_type,
      cash_type,
      amount,
      payee_payer_name,
      description,
      frequency,
      start_date,
      end_date,
      day_of_month,
      day_of_week
    } = recurringData;
    
    logger.info(`Creating recurring ${transaction_type} transaction for user: ${userId}`);
    
    // Verify account ownership if bank_account_id is provided
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
    
    // Calculate initial next_due_date
    const startDateObj = new Date(start_date);
    const nextDueDate = calculateNextDueDate(frequency, startDateObj, day_of_month, day_of_week);
    
    const result = await query(
      `INSERT INTO recurring_transactions 
       (user_id, transaction_type, bank_account_id, check_type, cash_type, amount,
        payee_payer_name, description, frequency, start_date, end_date, day_of_month,
        day_of_week, next_due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING id, user_id, transaction_type, bank_account_id, check_type, cash_type,
                 amount, payee_payer_name, description, frequency, start_date, end_date,
                 day_of_month, day_of_week, is_active, last_created_date, next_due_date,
                 created_at, updated_at`,
      [
        userId,
        transaction_type,
        bank_account_id || null,
        check_type || null,
        cash_type || null,
        amount,
        payee_payer_name || null,
        description || null,
        frequency,
        start_date,
        end_date || null,
        day_of_month || null,
        day_of_week || null,
        nextDueDate.toISOString().split('T')[0]
      ]
    );
    
    logger.info(`Recurring transaction created successfully: ${result.rows[0].id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating recurring transaction:', error);
    throw error;
  }
};

/**
 * Update a recurring transaction
 * Updates existing recurring transaction record
 * Recalculates next_due_date if frequency or dates change
 * @param {string} recurringId - Recurring transaction UUID
 * @param {string} userId - User UUID for ownership verification
 * @param {Object} recurringData - Updated recurring transaction data
 * @returns {Promise<Object|null>} Updated recurring transaction object or null if not found
 */
export const updateRecurringTransaction = async (recurringId, userId, recurringData) => {
  try {
    logger.info(`Updating recurring transaction: ${recurringId} for user: ${userId}`);
    
    // Get current transaction to check what changed
    const current = await getRecurringTransactionById(recurringId, userId);
    if (!current) {
      return null;
    }
    
    // Verify account ownership if bank_account_id is being changed
    if (recurringData.bank_account_id && recurringData.bank_account_id !== current.bank_account_id) {
      const accountCheck = await query(
        'SELECT id FROM bank_accounts WHERE id = $1 AND user_id = $2',
        [recurringData.bank_account_id, userId]
      );
      
      if (accountCheck.rows.length === 0) {
        logger.warn(`Account not found or access denied: ${recurringData.bank_account_id}`);
        throw new Error('Bank account not found or access denied');
      }
    }
    
    // Recalculate next_due_date if frequency or start_date changed
    let nextDueDate = current.next_due_date;
    if (recurringData.frequency || recurringData.start_date || recurringData.day_of_month !== undefined || recurringData.day_of_week !== undefined) {
      const frequency = recurringData.frequency || current.frequency;
      const startDate = recurringData.start_date ? new Date(recurringData.start_date) : new Date(current.start_date);
      const dayOfMonth = recurringData.day_of_month !== undefined ? recurringData.day_of_month : current.day_of_month;
      const dayOfWeek = recurringData.day_of_week !== undefined ? recurringData.day_of_week : current.day_of_week;
      nextDueDate = calculateNextDueDate(frequency, startDate, dayOfMonth, dayOfWeek);
    }
    
    const result = await query(
      `UPDATE recurring_transactions 
       SET transaction_type = COALESCE($1, transaction_type),
           bank_account_id = COALESCE($2, bank_account_id),
           check_type = COALESCE($3, check_type),
           cash_type = COALESCE($4, cash_type),
           amount = COALESCE($5, amount),
           payee_payer_name = COALESCE($6, payee_payer_name),
           description = COALESCE($7, description),
           frequency = COALESCE($8, frequency),
           start_date = COALESCE($9, start_date),
           end_date = COALESCE($10, end_date),
           day_of_month = COALESCE($11, day_of_month),
           day_of_week = COALESCE($12, day_of_week),
           is_active = COALESCE($13, is_active),
           next_due_date = $14
       WHERE id = $15 AND user_id = $16
       RETURNING id, user_id, transaction_type, bank_account_id, check_type, cash_type,
                 amount, payee_payer_name, description, frequency, start_date, end_date,
                 day_of_month, day_of_week, is_active, last_created_date, next_due_date,
                 created_at, updated_at`,
      [
        recurringData.transaction_type || null,
        recurringData.bank_account_id || null,
        recurringData.check_type || null,
        recurringData.cash_type || null,
        recurringData.amount || null,
        recurringData.payee_payer_name || null,
        recurringData.description || null,
        recurringData.frequency || null,
        recurringData.start_date || null,
        recurringData.end_date !== undefined ? recurringData.end_date : null,
        recurringData.day_of_month !== undefined ? recurringData.day_of_month : null,
        recurringData.day_of_week !== undefined ? recurringData.day_of_week : null,
        recurringData.is_active !== undefined ? recurringData.is_active : null,
        nextDueDate,
        recurringId,
        userId
      ]
    );
    
    if (result.rows.length === 0) {
      logger.warn(`Recurring transaction not found for update: ${recurringId}`);
      return null;
    }
    
    logger.info(`Recurring transaction updated successfully: ${recurringId}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error updating recurring transaction:', error);
    throw error;
  }
};

/**
 * Delete a recurring transaction
 * Removes recurring transaction record from database
 * @param {string} recurringId - Recurring transaction UUID
 * @param {string} userId - User UUID for ownership verification
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
export const deleteRecurringTransaction = async (recurringId, userId) => {
  try {
    logger.info(`Deleting recurring transaction: ${recurringId} for user: ${userId}`);
    const result = await query(
      `DELETE FROM recurring_transactions 
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [recurringId, userId]
    );
    
    if (result.rows.length === 0) {
      logger.warn(`Recurring transaction not found for deletion: ${recurringId}`);
      return false;
    }
    
    logger.info(`Recurring transaction deleted successfully: ${recurringId}`);
    return true;
  } catch (error) {
    logger.error('Error deleting recurring transaction:', error);
    throw error;
  }
};

/**
 * Get recurring transactions that are due for creation
 * Finds active recurring transactions where next_due_date is today or in the past
 * Used by scheduled job to create transactions
 * @param {Date} upToDate - Check transactions due up to this date (default: today)
 * @returns {Promise<Array>} Array of recurring transactions that are due
 */
export const getDueRecurringTransactions = async (upToDate = new Date()) => {
  try {
    const dateStr = upToDate.toISOString().split('T')[0];
    logger.debug(`Fetching recurring transactions due up to: ${dateStr}`);
    
    const result = await query(
      `SELECT rt.id, rt.user_id, rt.transaction_type, rt.bank_account_id, rt.check_type,
              rt.cash_type, rt.amount, rt.payee_payer_name, rt.description,
              rt.frequency, rt.start_date, rt.end_date, rt.day_of_month, rt.day_of_week,
              rt.last_created_date, rt.next_due_date
       FROM recurring_transactions rt
       WHERE rt.is_active = true
       AND rt.next_due_date <= $1
       AND (rt.end_date IS NULL OR rt.end_date >= rt.next_due_date)
       AND rt.start_date <= rt.next_due_date
       ORDER BY rt.next_due_date ASC`,
      [dateStr]
    );
    
    logger.debug(`Found ${result.rows.length} due recurring transactions`);
    return result.rows;
  } catch (error) {
    logger.error('Error fetching due recurring transactions:', error);
    throw error;
  }
};

/**
 * Update recurring transaction after transaction is created
 * Updates last_created_date and calculates next_due_date
 * @param {string} recurringId - Recurring transaction UUID
 * @param {Date} createdDate - Date when transaction was created
 * @returns {Promise<Object|null>} Updated recurring transaction object
 */
export const markRecurringTransactionCreated = async (recurringId, createdDate) => {
  try {
    logger.debug(`Marking recurring transaction as created: ${recurringId} on ${createdDate}`);
    
    // Get current transaction to calculate next due date
    const current = await query(
      'SELECT frequency, day_of_month, day_of_week FROM recurring_transactions WHERE id = $1',
      [recurringId]
    );
    
    if (current.rows.length === 0) {
      return null;
    }
    
    const { frequency, day_of_month, day_of_week } = current.rows[0];
    const createdDateObj = new Date(createdDate);
    const nextDueDate = calculateNextDueDate(frequency, createdDateObj, day_of_month, day_of_week);
    
    const result = await query(
      `UPDATE recurring_transactions 
       SET last_created_date = $1,
           next_due_date = $2
       WHERE id = $3
       RETURNING id, last_created_date, next_due_date`,
      [createdDate, nextDueDate.toISOString().split('T')[0], recurringId]
    );
    
    return result.rows[0];
  } catch (error) {
    logger.error('Error marking recurring transaction as created:', error);
    throw error;
  }
};
