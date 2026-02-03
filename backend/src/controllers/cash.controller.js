/**
 * Cash Controller
 * Handles cash transaction CRUD operations
 * Manages cash credit and debit transaction creation, retrieval, update, and deletion
 */

import * as cashModel from '../models/cash.model.js';
import { validateRequiredFields, isValidAmount, isValidDate, sanitizeString } from '../utils/validation.js';
import logger from '../config/logger.js';

/**
 * Get cash transactions with optional filters
 * Retrieves cash transactions based on query parameters (date, type)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getCashTransactions = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { date, type, startDate, endDate } = req.query;
    
    logger.info(`Fetching cash transactions for user: ${userId}`, { date, type, startDate, endDate });
    
    // Validate date format if provided
    if (date && !isValidDate(date)) {
      logger.warn(`Invalid date format: ${date}`);
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    if (startDate && !isValidDate(startDate)) {
      logger.warn(`Invalid start date format: ${startDate}`);
      return res.status(400).json({ error: 'Invalid start date format. Use YYYY-MM-DD' });
    }
    
    if (endDate && !isValidDate(endDate)) {
      logger.warn(`Invalid end date format: ${endDate}`);
      return res.status(400).json({ error: 'Invalid end date format. Use YYYY-MM-DD' });
    }
    
    // Validate type if provided
    if (type && !['credit', 'debit'].includes(type)) {
      logger.warn(`Invalid cash type: ${type}`);
      return res.status(400).json({ error: 'Invalid cash type. Must be "credit" or "debit"' });
    }
    
    const filters = {
      date: date || null,
      type: type || null,
      startDate: startDate || null,
      endDate: endDate || null
    };
    
    const cashTransactions = await cashModel.getCashTransactions(userId, filters);
    logger.info(`Retrieved ${cashTransactions.length} cash transactions for user: ${userId}`);
    
    res.json(cashTransactions);
  } catch (error) {
    logger.error('Error fetching cash transactions:', error);
    res.status(500).json({ error: 'Failed to fetch cash transactions' });
  }
};

/**
 * Get a single cash transaction by ID
 * Retrieves specific cash transaction if it belongs to the user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getCashTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    logger.info(`Fetching cash transaction: ${id} for user: ${userId}`);
    
    const cashTransaction = await cashModel.getCashTransactionById(id, userId);
    
    if (!cashTransaction) {
      logger.warn(`Cash transaction not found: ${id} for user: ${userId}`);
      return res.status(404).json({ error: 'Cash transaction not found' });
    }
    
    res.json(cashTransaction);
  } catch (error) {
    logger.error('Error fetching cash transaction:', error);
    res.status(500).json({ error: 'Failed to fetch cash transaction' });
  }
};

/**
 * Create a new cash transaction
 * Creates a new credit or debit cash transaction
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const createCashTransaction = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { type, amount, date, description } = req.body;
    
    logger.info(`Creating ${type} cash transaction for user: ${userId}`);
    
    // Validate required fields
    const validation = validateRequiredFields(
      { type, amount, date, description },
      ['type', 'amount', 'date', 'description']
    );
    
    if (!validation.isValid) {
      logger.warn(`Cash transaction creation validation failed: missing fields ${validation.missingFields.join(', ')}`);
      return res.status(400).json({
        error: 'All fields are required',
        missingFields: validation.missingFields
      });
    }
    
    // Validate type
    if (!['credit', 'debit'].includes(type)) {
      logger.warn(`Invalid cash type: ${type}`);
      return res.status(400).json({ error: 'Type must be "credit" or "debit"' });
    }
    
    // Validate amount
    if (!isValidAmount(amount)) {
      logger.warn(`Invalid amount: ${amount}`);
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }
    
    // Validate date format
    if (!isValidDate(date)) {
      logger.warn(`Invalid date format: ${date}`);
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    // Sanitize inputs
    const cashData = {
      type,
      amount: parseFloat(amount),
      date,
      description: sanitizeString(description)
    };
    
    const cashTransaction = await cashModel.createCashTransaction(userId, cashData);
    logger.info(`Cash transaction created successfully: ${cashTransaction.id}`);
    
    res.status(201).json(cashTransaction);
  } catch (error) {
    logger.error('Error creating cash transaction:', error);
    res.status(500).json({ error: 'Failed to create cash transaction' });
  }
};

/**
 * Update a cash transaction
 * Updates existing cash transaction if it belongs to the user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateCashTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { type, amount, date, description } = req.body;
    
    logger.info(`Updating cash transaction: ${id} for user: ${userId}`);
    
    // Validate type if provided
    if (type && !['credit', 'debit'].includes(type)) {
      logger.warn(`Invalid cash type: ${type}`);
      return res.status(400).json({ error: 'Type must be "credit" or "debit"' });
    }
    
    // Validate amount if provided
    if (amount !== undefined && !isValidAmount(amount)) {
      logger.warn(`Invalid amount: ${amount}`);
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }
    
    // Validate date format if provided
    if (date && !isValidDate(date)) {
      logger.warn(`Invalid date format: ${date}`);
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    // Build update data object
    const cashData = {};
    if (type) cashData.type = type;
    if (amount !== undefined) cashData.amount = parseFloat(amount);
    if (date) cashData.date = date;
    if (description) cashData.description = sanitizeString(description);
    
    const cashTransaction = await cashModel.updateCashTransaction(id, userId, cashData);
    
    if (!cashTransaction) {
      logger.warn(`Cash transaction not found for update: ${id}`);
      return res.status(404).json({ error: 'Cash transaction not found' });
    }
    
    logger.info(`Cash transaction updated successfully: ${id}`);
    res.json(cashTransaction);
  } catch (error) {
    logger.error('Error updating cash transaction:', error);
    res.status(500).json({ error: 'Failed to update cash transaction' });
  }
};

/**
 * Delete a cash transaction
 * Deletes cash transaction if it belongs to the user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteCashTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    logger.info(`Deleting cash transaction: ${id} for user: ${userId}`);
    
    const deleted = await cashModel.deleteCashTransaction(id, userId);
    
    if (!deleted) {
      logger.warn(`Cash transaction not found for deletion: ${id}`);
      return res.status(404).json({ error: 'Cash transaction not found' });
    }
    
    logger.info(`Cash transaction deleted successfully: ${id}`);
    res.json({ message: 'Cash transaction deleted successfully' });
  } catch (error) {
    logger.error('Error deleting cash transaction:', error);
    res.status(500).json({ error: 'Failed to delete cash transaction' });
  }
};
