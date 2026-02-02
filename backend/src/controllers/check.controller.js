/**
 * Check Controller
 * Handles check CRUD operations
 * Manages incoming and outgoing check creation, retrieval, update, and deletion
 */

import * as checkModel from '../models/check.model.js';
import { validateRequiredFields, isValidAmount, isValidDate, sanitizeString } from '../utils/validation.js';
import logger from '../config/logger.js';

/**
 * Get checks with optional filters
 * Retrieves checks based on query parameters (date, account, type)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getChecks = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { accountId, date, type, startDate, endDate } = req.query;
    
    logger.info(`Fetching checks for user: ${userId}`, { accountId, date, type, startDate, endDate });
    
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
    if (type && !['incoming', 'outgoing'].includes(type)) {
      logger.warn(`Invalid check type: ${type}`);
      return res.status(400).json({ error: 'Invalid check type. Must be "incoming" or "outgoing"' });
    }
    
    const filters = {
      accountId: accountId || null,
      date: date || null,
      type: type || null,
      startDate: startDate || null,
      endDate: endDate || null
    };
    
    const checks = await checkModel.getChecks(userId, filters);
    logger.info(`Retrieved ${checks.length} checks for user: ${userId}`);
    
    res.json(checks);
  } catch (error) {
    logger.error('Error fetching checks:', error);
    res.status(500).json({ error: 'Failed to fetch checks' });
  }
};

/**
 * Get a single check by ID
 * Retrieves specific check if it belongs to the user's account
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getCheckById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    logger.info(`Fetching check: ${id} for user: ${userId}`);
    
    const check = await checkModel.getCheckById(id, userId);
    
    if (!check) {
      logger.warn(`Check not found: ${id} for user: ${userId}`);
      return res.status(404).json({ error: 'Check not found' });
    }
    
    res.json(check);
  } catch (error) {
    logger.error('Error fetching check:', error);
    res.status(500).json({ error: 'Failed to fetch check' });
  }
};

/**
 * Create a new check
 * Creates a new incoming or outgoing check
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const createCheck = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { bank_account_id, type, amount, date, payee_payer_name } = req.body;
    
    logger.info(`Creating ${type} check for user: ${userId}`);
    
    // Validate required fields
    const validation = validateRequiredFields(
      { bank_account_id, type, amount, date, payee_payer_name },
      ['bank_account_id', 'type', 'amount', 'date', 'payee_payer_name']
    );
    
    if (!validation.isValid) {
      logger.warn(`Check creation validation failed: missing fields ${validation.missingFields.join(', ')}`);
      return res.status(400).json({
        error: 'All fields are required',
        missingFields: validation.missingFields
      });
    }
    
    // Validate type
    if (!['incoming', 'outgoing'].includes(type)) {
      logger.warn(`Invalid check type: ${type}`);
      return res.status(400).json({ error: 'Type must be "incoming" or "outgoing"' });
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
    const checkData = {
      bank_account_id,
      type,
      amount: parseFloat(amount),
      date,
      payee_payer_name: sanitizeString(payee_payer_name)
    };
    
    const check = await checkModel.createCheck(userId, checkData);
    logger.info(`Check created successfully: ${check.id}`);
    
    res.status(201).json(check);
  } catch (error) {
    logger.error('Error creating check:', error);
    
    if (error.message === 'Bank account not found or access denied') {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to create check' });
  }
};

/**
 * Update a check
 * Updates existing check if it belongs to the user's account
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateCheck = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { bank_account_id, type, amount, date, payee_payer_name } = req.body;
    
    logger.info(`Updating check: ${id} for user: ${userId}`);
    
    // Validate type if provided
    if (type && !['incoming', 'outgoing'].includes(type)) {
      logger.warn(`Invalid check type: ${type}`);
      return res.status(400).json({ error: 'Type must be "incoming" or "outgoing"' });
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
    const checkData = {};
    if (bank_account_id) checkData.bank_account_id = bank_account_id;
    if (type) checkData.type = type;
    if (amount !== undefined) checkData.amount = parseFloat(amount);
    if (date) checkData.date = date;
    if (payee_payer_name) checkData.payee_payer_name = sanitizeString(payee_payer_name);
    
    const check = await checkModel.updateCheck(id, userId, checkData);
    
    if (!check) {
      logger.warn(`Check not found for update: ${id}`);
      return res.status(404).json({ error: 'Check not found' });
    }
    
    logger.info(`Check updated successfully: ${id}`);
    res.json(check);
  } catch (error) {
    logger.error('Error updating check:', error);
    
    if (error.message === 'Bank account not found or access denied') {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to update check' });
  }
};

/**
 * Delete a check
 * Deletes check if it belongs to the user's account
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteCheck = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    logger.info(`Deleting check: ${id} for user: ${userId}`);
    
    const deleted = await checkModel.deleteCheck(id, userId);
    
    if (!deleted) {
      logger.warn(`Check not found for deletion: ${id}`);
      return res.status(404).json({ error: 'Check not found' });
    }
    
    logger.info(`Check deleted successfully: ${id}`);
    res.json({ message: 'Check deleted successfully' });
  } catch (error) {
    logger.error('Error deleting check:', error);
    res.status(500).json({ error: 'Failed to delete check' });
  }
};

