/**
 * Bank Account Controller
 * Handles bank account CRUD operations
 * Manages account creation, retrieval, update, and deletion
 */

import * as accountModel from '../models/account.model.js';
import { validateRequiredFields, isValidAmount, sanitizeString } from '../utils/validation.js';
import logger from '../config/logger.js';

/**
 * Get all bank accounts for authenticated user
 * Retrieves all bank accounts belonging to the logged-in user
 * @param {Object} req - Express request object (contains user from auth middleware)
 * @param {Object} res - Express response object
 */
export const getAccounts = async (req, res) => {
  try {
    const userId = req.user.userId;
    logger.info(`Fetching accounts for user: ${userId}`);
    
    const accounts = await accountModel.getAccountsByUserId(userId);
    logger.info(`Retrieved ${accounts.length} accounts for user: ${userId}`);
    
    res.json(accounts);
  } catch (error) {
    logger.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
};

/**
 * Get a single bank account by ID
 * Retrieves specific bank account if it belongs to the user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAccountById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    logger.info(`Fetching account: ${id} for user: ${userId}`);
    
    const account = await accountModel.getAccountById(id, userId);
    
    if (!account) {
      logger.warn(`Account not found: ${id} for user: ${userId}`);
      return res.status(404).json({ error: 'Account not found' });
    }
    
    res.json(account);
  } catch (error) {
    logger.error('Error fetching account:', error);
    res.status(500).json({ error: 'Failed to fetch account' });
  }
};

/**
 * Create a new bank account
 * Creates a new bank account for the authenticated user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const createAccount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { bank_name, account_number, alias_name, low_balance_threshold, opening_balance } = req.body;
    
    logger.info(`Creating account for user: ${userId}`);
    
    // Validate required fields
    const validation = validateRequiredFields(
      { bank_name, account_number },
      ['bank_name', 'account_number']
    );
    
    if (!validation.isValid) {
      logger.warn(`Account creation validation failed: missing fields ${validation.missingFields.join(', ')}`);
      return res.status(400).json({
        error: 'Bank name and account number are required',
        missingFields: validation.missingFields
      });
    }
    
    // Validate low balance threshold if provided
    if (low_balance_threshold !== undefined && low_balance_threshold !== null) {
      const threshold = parseFloat(low_balance_threshold);
      if (isNaN(threshold) || threshold < 0) {
        logger.warn(`Invalid low balance threshold: ${low_balance_threshold}`);
        return res.status(400).json({ error: 'Low balance threshold must be a non-negative number' });
      }
    }
    
    // Validate opening balance if provided
    if (opening_balance !== undefined && opening_balance !== null) {
      const balance = parseFloat(opening_balance);
      if (isNaN(balance)) {
        logger.warn(`Invalid opening balance: ${opening_balance}`);
        return res.status(400).json({ error: 'Opening balance must be a valid number' });
      }
    }
    
    // Sanitize inputs
    const accountData = {
      bank_name: sanitizeString(bank_name),
      account_number: sanitizeString(account_number),
      alias_name: alias_name ? sanitizeString(alias_name) : null,
      low_balance_threshold: low_balance_threshold || 0,
      opening_balance: opening_balance !== undefined && opening_balance !== null ? parseFloat(opening_balance) : 0
    };
    
    const account = await accountModel.createAccount(userId, accountData);
    logger.info(`Account created successfully: ${account.id}`);
    
    res.status(201).json(account);
  } catch (error) {
    logger.error('Error creating account:', error);
    
    if (error.message === 'Account number already exists for this user') {
      return res.status(409).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to create account' });
  }
};

/**
 * Update a bank account
 * Updates existing bank account if it belongs to the user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { bank_name, account_number, alias_name, low_balance_threshold, opening_balance } = req.body;
    
    logger.info(`Updating account: ${id} for user: ${userId}`);
    
    // Validate required fields
    const validation = validateRequiredFields(
      { bank_name, account_number },
      ['bank_name', 'account_number']
    );
    
    if (!validation.isValid) {
      logger.warn(`Account update validation failed: missing fields ${validation.missingFields.join(', ')}`);
      return res.status(400).json({
        error: 'Bank name and account number are required',
        missingFields: validation.missingFields
      });
    }
    
    // Validate low balance threshold if provided
    if (low_balance_threshold !== undefined && low_balance_threshold !== null) {
      const threshold = parseFloat(low_balance_threshold);
      if (isNaN(threshold) || threshold < 0) {
        logger.warn(`Invalid low balance threshold: ${low_balance_threshold}`);
        return res.status(400).json({ error: 'Low balance threshold must be a non-negative number' });
      }
    }
    
    // Validate opening balance if provided
    if (opening_balance !== undefined && opening_balance !== null) {
      const balance = parseFloat(opening_balance);
      if (isNaN(balance)) {
        logger.warn(`Invalid opening balance: ${opening_balance}`);
        return res.status(400).json({ error: 'Opening balance must be a valid number' });
      }
    }
    
    // Sanitize inputs
    const accountData = {
      bank_name: sanitizeString(bank_name),
      account_number: sanitizeString(account_number),
      alias_name: alias_name ? sanitizeString(alias_name) : null,
      low_balance_threshold: low_balance_threshold || 0,
      opening_balance: opening_balance !== undefined && opening_balance !== null ? parseFloat(opening_balance) : 0
    };
    
    const account = await accountModel.updateAccount(id, userId, accountData);
    
    if (!account) {
      logger.warn(`Account not found for update: ${id}`);
      return res.status(404).json({ error: 'Account not found' });
    }
    
    logger.info(`Account updated successfully: ${id}`);
    res.json(account);
  } catch (error) {
    logger.error('Error updating account:', error);
    res.status(500).json({ error: 'Failed to update account' });
  }
};

/**
 * Delete a bank account
 * Deletes bank account if it belongs to the user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    logger.info(`Deleting account: ${id} for user: ${userId}`);
    
    const deleted = await accountModel.deleteAccount(id, userId);
    
    if (!deleted) {
      logger.warn(`Account not found for deletion: ${id}`);
      return res.status(404).json({ error: 'Account not found' });
    }
    
    logger.info(`Account deleted successfully: ${id}`);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    logger.error('Error deleting account:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
};

