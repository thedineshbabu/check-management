/**
 * Recurring Transaction Controller
 * Handles recurring transaction CRUD operations
 * Manages scheduled recurring check and cash transactions
 */

import * as recurringTransactionModel from '../models/recurring-transaction.model.js';
import { createCheck } from '../models/check.model.js';
import { createCashTransaction } from '../models/cash.model.js';
import { validateRequiredFields, isValidAmount, isValidDate, sanitizeString } from '../utils/validation.js';
import logger from '../config/logger.js';

/**
 * Get recurring transactions with optional filters
 * Retrieves recurring transactions based on query parameters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getRecurringTransactions = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { isActive, transactionType } = req.query;
    
    logger.info(`Fetching recurring transactions for user: ${userId}`, { isActive, transactionType });
    
    const filters = {};
    if (isActive !== undefined) {
      filters.isActive = isActive === 'true';
    }
    if (transactionType) {
      filters.transactionType = transactionType;
    }
    
    const recurringTransactions = await recurringTransactionModel.getRecurringTransactions(userId, filters);
    logger.info(`Retrieved ${recurringTransactions.length} recurring transactions for user: ${userId}`);
    
    res.json(recurringTransactions);
  } catch (error) {
    logger.error('Error fetching recurring transactions:', error);
    res.status(500).json({ error: 'Failed to fetch recurring transactions' });
  }
};

/**
 * Get a single recurring transaction by ID
 * Retrieves specific recurring transaction if it belongs to the user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getRecurringTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    logger.info(`Fetching recurring transaction: ${id} for user: ${userId}`);
    
    const recurringTransaction = await recurringTransactionModel.getRecurringTransactionById(id, userId);
    
    if (!recurringTransaction) {
      logger.warn(`Recurring transaction not found: ${id} for user: ${userId}`);
      return res.status(404).json({ error: 'Recurring transaction not found' });
    }
    
    res.json(recurringTransaction);
  } catch (error) {
    logger.error('Error fetching recurring transaction:', error);
    res.status(500).json({ error: 'Failed to fetch recurring transaction' });
  }
};

/**
 * Create a new recurring transaction
 * Creates a new recurring check or cash transaction template
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const createRecurringTransaction = async (req, res) => {
  try {
    const userId = req.user.userId;
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
    } = req.body;
    
    logger.info(`Creating recurring ${transaction_type} transaction for user: ${userId}`);
    
    // Validate required fields
    const requiredFields = ['transaction_type', 'amount', 'frequency', 'start_date'];
    const validation = validateRequiredFields(
      { transaction_type, amount, frequency, start_date },
      requiredFields
    );
    
    if (!validation.isValid) {
      logger.warn(`Recurring transaction creation validation failed: missing fields ${validation.missingFields.join(', ')}`);
      return res.status(400).json({
        error: 'Required fields are missing',
        missingFields: validation.missingFields
      });
    }
    
    // Validate transaction type
    if (!['check', 'cash'].includes(transaction_type)) {
      logger.warn(`Invalid transaction type: ${transaction_type}`);
      return res.status(400).json({ error: 'Transaction type must be "check" or "cash"' });
    }
    
    // Validate check-specific fields
    if (transaction_type === 'check') {
      if (!bank_account_id) {
        return res.status(400).json({ error: 'bank_account_id is required for check transactions' });
      }
      if (!check_type || !['incoming', 'outgoing'].includes(check_type)) {
        return res.status(400).json({ error: 'check_type must be "incoming" or "outgoing" for check transactions' });
      }
      if (!payee_payer_name) {
        return res.status(400).json({ error: 'payee_payer_name is required for check transactions' });
      }
    }
    
    // Validate cash-specific fields
    if (transaction_type === 'cash') {
      if (!cash_type || !['credit', 'debit'].includes(cash_type)) {
        return res.status(400).json({ error: 'cash_type must be "credit" or "debit" for cash transactions' });
      }
      if (!description) {
        return res.status(400).json({ error: 'description is required for cash transactions' });
      }
    }
    
    // Validate frequency
    if (!['daily', 'weekly', 'monthly', 'yearly'].includes(frequency)) {
      logger.warn(`Invalid frequency: ${frequency}`);
      return res.status(400).json({ error: 'Frequency must be "daily", "weekly", "monthly", or "yearly"' });
    }
    
    // Validate amount
    if (!isValidAmount(amount)) {
      logger.warn(`Invalid amount: ${amount}`);
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }
    
    // Validate date format
    if (!isValidDate(start_date)) {
      logger.warn(`Invalid start date format: ${start_date}`);
      return res.status(400).json({ error: 'Invalid start date format. Use YYYY-MM-DD' });
    }
    
    if (end_date && !isValidDate(end_date)) {
      logger.warn(`Invalid end date format: ${end_date}`);
      return res.status(400).json({ error: 'Invalid end date format. Use YYYY-MM-DD' });
    }
    
    // Validate day_of_month (1-31)
    if (day_of_month !== undefined && (day_of_month < 1 || day_of_month > 31)) {
      return res.status(400).json({ error: 'day_of_month must be between 1 and 31' });
    }
    
    // Validate day_of_week (0-6, 0=Sunday)
    if (day_of_week !== undefined && (day_of_week < 0 || day_of_week > 6)) {
      return res.status(400).json({ error: 'day_of_week must be between 0 (Sunday) and 6 (Saturday)' });
    }
    
    // Build recurring transaction data object
    const recurringData = {
      transaction_type,
      bank_account_id: bank_account_id || null,
      check_type: check_type || null,
      cash_type: cash_type || null,
      amount: parseFloat(amount),
      payee_payer_name: payee_payer_name ? sanitizeString(payee_payer_name) : null,
      description: description ? sanitizeString(description) : null,
      frequency,
      start_date,
      end_date: end_date || null,
      day_of_month: day_of_month || null,
      day_of_week: day_of_week !== undefined ? parseInt(day_of_week) : null
    };
    
    const recurringTransaction = await recurringTransactionModel.createRecurringTransaction(userId, recurringData);
    logger.info(`Recurring transaction created successfully: ${recurringTransaction.id}`);
    
    res.status(201).json(recurringTransaction);
  } catch (error) {
    logger.error('Error creating recurring transaction:', error);
    
    if (error.message === 'Bank account not found or access denied') {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to create recurring transaction' });
  }
};

/**
 * Update a recurring transaction
 * Updates existing recurring transaction if it belongs to the user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateRecurringTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
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
      day_of_week,
      is_active
    } = req.body;
    
    logger.info(`Updating recurring transaction: ${id} for user: ${userId}`);
    
    // Validate transaction type if provided
    if (transaction_type && !['check', 'cash'].includes(transaction_type)) {
      return res.status(400).json({ error: 'Transaction type must be "check" or "cash"' });
    }
    
    // Validate check type if provided
    if (check_type && !['incoming', 'outgoing'].includes(check_type)) {
      return res.status(400).json({ error: 'Check type must be "incoming" or "outgoing"' });
    }
    
    // Validate cash type if provided
    if (cash_type && !['credit', 'debit'].includes(cash_type)) {
      return res.status(400).json({ error: 'Cash type must be "credit" or "debit"' });
    }
    
    // Validate frequency if provided
    if (frequency && !['daily', 'weekly', 'monthly', 'yearly'].includes(frequency)) {
      return res.status(400).json({ error: 'Frequency must be "daily", "weekly", "monthly", or "yearly"' });
    }
    
    // Validate amount if provided
    if (amount !== undefined && !isValidAmount(amount)) {
      logger.warn(`Invalid amount: ${amount}`);
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }
    
    // Validate date formats if provided
    if (start_date && !isValidDate(start_date)) {
      return res.status(400).json({ error: 'Invalid start date format. Use YYYY-MM-DD' });
    }
    
    if (end_date !== undefined && end_date !== null && !isValidDate(end_date)) {
      return res.status(400).json({ error: 'Invalid end date format. Use YYYY-MM-DD' });
    }
    
    // Validate day_of_month
    if (day_of_month !== undefined && day_of_month !== null && (day_of_month < 1 || day_of_month > 31)) {
      return res.status(400).json({ error: 'day_of_month must be between 1 and 31' });
    }
    
    // Validate day_of_week
    if (day_of_week !== undefined && day_of_week !== null && (day_of_week < 0 || day_of_week > 6)) {
      return res.status(400).json({ error: 'day_of_week must be between 0 (Sunday) and 6 (Saturday)' });
    }
    
    // Build update data object
    const recurringData = {};
    if (transaction_type) recurringData.transaction_type = transaction_type;
    if (bank_account_id !== undefined) recurringData.bank_account_id = bank_account_id;
    if (check_type) recurringData.check_type = check_type;
    if (cash_type) recurringData.cash_type = cash_type;
    if (amount !== undefined) recurringData.amount = parseFloat(amount);
    if (payee_payer_name !== undefined) recurringData.payee_payer_name = payee_payer_name ? sanitizeString(payee_payer_name) : null;
    if (description !== undefined) recurringData.description = description ? sanitizeString(description) : null;
    if (frequency) recurringData.frequency = frequency;
    if (start_date) recurringData.start_date = start_date;
    if (end_date !== undefined) recurringData.end_date = end_date;
    if (day_of_month !== undefined) recurringData.day_of_month = day_of_month;
    if (day_of_week !== undefined) recurringData.day_of_week = day_of_week;
    if (is_active !== undefined) recurringData.is_active = is_active;
    
    const recurringTransaction = await recurringTransactionModel.updateRecurringTransaction(id, userId, recurringData);
    
    if (!recurringTransaction) {
      logger.warn(`Recurring transaction not found for update: ${id}`);
      return res.status(404).json({ error: 'Recurring transaction not found' });
    }
    
    logger.info(`Recurring transaction updated successfully: ${id}`);
    res.json(recurringTransaction);
  } catch (error) {
    logger.error('Error updating recurring transaction:', error);
    
    if (error.message === 'Bank account not found or access denied') {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to update recurring transaction' });
  }
};

/**
 * Delete a recurring transaction
 * Deletes recurring transaction if it belongs to the user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteRecurringTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    logger.info(`Deleting recurring transaction: ${id} for user: ${userId}`);
    
    const deleted = await recurringTransactionModel.deleteRecurringTransaction(id, userId);
    
    if (!deleted) {
      logger.warn(`Recurring transaction not found for deletion: ${id}`);
      return res.status(404).json({ error: 'Recurring transaction not found' });
    }
    
    logger.info(`Recurring transaction deleted successfully: ${id}`);
    res.json({ message: 'Recurring transaction deleted successfully' });
  } catch (error) {
    logger.error('Error deleting recurring transaction:', error);
    res.status(500).json({ error: 'Failed to delete recurring transaction' });
  }
};

/**
 * Manually trigger creation of a recurring transaction
 * Creates the actual transaction from a recurring template for a specific date
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const triggerRecurringTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { date } = req.body; // Optional: specific date to create transaction for
    
    logger.info(`Manually triggering recurring transaction: ${id} for user: ${userId}`);
    
    // Get recurring transaction
    const recurringTransaction = await recurringTransactionModel.getRecurringTransactionById(id, userId);
    
    if (!recurringTransaction) {
      return res.status(404).json({ error: 'Recurring transaction not found' });
    }
    
    if (!recurringTransaction.is_active) {
      return res.status(400).json({ error: 'Recurring transaction is not active' });
    }
    
    // Use provided date or next_due_date
    const transactionDate = date || recurringTransaction.next_due_date;
    
    if (!isValidDate(transactionDate)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    let createdTransaction;
    
    // Create the actual transaction based on type
    if (recurringTransaction.transaction_type === 'check') {
      const checkData = {
        bank_account_id: recurringTransaction.bank_account_id,
        type: recurringTransaction.check_type,
        amount: recurringTransaction.amount,
        date: transactionDate,
        payee_payer_name: recurringTransaction.payee_payer_name
      };
      createdTransaction = await createCheck(userId, checkData);
    } else if (recurringTransaction.transaction_type === 'cash') {
      const cashData = {
        type: recurringTransaction.cash_type,
        amount: recurringTransaction.amount,
        date: transactionDate,
        description: recurringTransaction.description
      };
      createdTransaction = await createCashTransaction(userId, cashData);
    }
    
    // Update recurring transaction's last_created_date and next_due_date
    await recurringTransactionModel.markRecurringTransactionCreated(id, transactionDate);
    
    logger.info(`Recurring transaction triggered successfully: ${id}, created transaction: ${createdTransaction.id}`);
    res.json({
      message: 'Transaction created successfully',
      transaction: createdTransaction,
      recurringTransaction: await recurringTransactionModel.getRecurringTransactionById(id, userId)
    });
  } catch (error) {
    logger.error('Error triggering recurring transaction:', error);
    res.status(500).json({ error: 'Failed to trigger recurring transaction' });
  }
};
