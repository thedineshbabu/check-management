/**
 * Dashboard Controller
 * Handles dashboard data aggregation and balance calculations
 * Provides summary data for calendar view and balance tracking
 */

import { query } from '../config/database.js';
import logger from '../config/logger.js';
import { isValidDate } from '../utils/validation.js';

/**
 * Calculate balance for a specific date
 * Computes account balances up to and including the specified date
 * Balance = sum of all incoming checks - sum of all outgoing checks (up to date)
 * Also includes cash transactions: cash credit adds to balance, cash debit subtracts from balance
 * @param {string} userId - User UUID
 * @param {string} date - Target date (YYYY-MM-DD)
 * @returns {Promise<Object>} Balance data with overall and per-account balances
 */
const calculateBalanceForDate = async (userId, date) => {
  try {
    logger.debug(`Calculating balance for user: ${userId}, date: ${date}`);
    
    // Get all accounts for the user (including opening_balance)
    const accountsResult = await query(
      'SELECT id, bank_name, account_number, alias_name, low_balance_threshold, opening_balance FROM bank_accounts WHERE user_id = $1',
      [userId]
    );
    
    // Get cash transactions up to date
    const cashResult = await query(
      `SELECT COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END), 0) as credit_total,
              COALESCE(SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END), 0) as debit_total
       FROM cash
       WHERE user_id = $1 AND date <= $2`,
      [userId, date]
    );
    
    const cashCreditTotal = parseFloat(cashResult.rows[0].credit_total) || 0;
    const cashDebitTotal = parseFloat(cashResult.rows[0].debit_total) || 0;
    const cashNetBalance = cashCreditTotal - cashDebitTotal;
    
    const accounts = accountsResult.rows;
    const accountBalances = [];
    let overallBalance = cashNetBalance; // Start with cash balance
    
    // Calculate balance for each account
    for (const account of accounts) {
      // Get incoming checks sum up to date
      const incomingResult = await query(
        `SELECT COALESCE(SUM(amount), 0) as total 
         FROM checks 
         WHERE bank_account_id = $1 
         AND type = 'incoming' 
         AND date <= $2`,
        [account.id, date]
      );
      
      // Get outgoing checks sum up to date
      const outgoingResult = await query(
        `SELECT COALESCE(SUM(amount), 0) as total 
         FROM checks 
         WHERE bank_account_id = $1 
         AND type = 'outgoing' 
         AND date <= $2`,
        [account.id, date]
      );
      
      const incomingTotal = parseFloat(incomingResult.rows[0].total) || 0;
      const outgoingTotal = parseFloat(outgoingResult.rows[0].total) || 0;
      const openingBalance = parseFloat(account.opening_balance) || 0;
      // Balance = opening balance + incoming checks - outgoing checks
      const balance = openingBalance + incomingTotal - outgoingTotal;
      
      accountBalances.push({
        account_id: account.id,
        bank_name: account.bank_name,
        account_number: account.account_number,
        alias_name: account.alias_name,
        balance: balance,
        low_balance_threshold: parseFloat(account.low_balance_threshold) || 0,
        is_low_balance: balance < (parseFloat(account.low_balance_threshold) || 0)
      });
      
      overallBalance += balance;
    }
    
    logger.debug(`Balance calculated: overall=${overallBalance}, accounts=${accountBalances.length}, cash_net=${cashNetBalance}`);
    
    return {
      date,
      overall_balance: overallBalance,
      account_balances: accountBalances,
      cash_balance: cashNetBalance
    };
  } catch (error) {
    logger.error('Error calculating balance:', error);
    throw error;
  }
};

/**
 * Get checks for a specific date
 * Retrieves all checks (incoming and outgoing) for the specified date
 * @param {string} userId - User UUID
 * @param {string} date - Target date (YYYY-MM-DD)
 * @returns {Promise<Array>} Array of check objects
 */
const getChecksForDate = async (userId, date) => {
  try {
    logger.debug(`Fetching checks for user: ${userId}, date: ${date}`);
    
    const result = await query(
      `SELECT c.id, c.bank_account_id, c.type, c.amount, c.date, c.payee_payer_name, c.created_at, c.updated_at,
              ba.bank_name, ba.alias_name, ba.account_number
       FROM checks c
       INNER JOIN bank_accounts ba ON c.bank_account_id = ba.id
       WHERE ba.user_id = $1 AND c.date = $2
       ORDER BY c.type, c.created_at DESC`,
      [userId, date]
    );
    
    logger.debug(`Found ${result.rows.length} checks for date: ${date}`);
    return result.rows;
  } catch (error) {
    logger.error('Error fetching checks for date:', error);
    throw error;
  }
};

/**
 * Get cash transactions for a specific date
 * Retrieves all cash transactions (credit and debit) for the specified date
 * @param {string} userId - User UUID
 * @param {string} date - Target date (YYYY-MM-DD)
 * @returns {Promise<Array>} Array of cash transaction objects
 */
const getCashTransactionsForDate = async (userId, date) => {
  try {
    logger.debug(`Fetching cash transactions for user: ${userId}, date: ${date}`);
    
    const result = await query(
      `SELECT id, user_id, type, amount, date, description, created_at, updated_at
       FROM cash
       WHERE user_id = $1 AND date = $2
       ORDER BY type, created_at DESC`,
      [userId, date]
    );
    
    logger.debug(`Found ${result.rows.length} cash transactions for date: ${date}`);
    return result.rows;
  } catch (error) {
    logger.error('Error fetching cash transactions for date:', error);
    throw error;
  }
};

/**
 * Get balance for a specific date
 * Returns balance information for the requested date
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getBalance = async (req, res) => {
  try {
    const userId = req.user.userId;
    const date = req.query.date || new Date().toISOString().split('T')[0]; // Default to today
    
    logger.info(`Fetching balance for user: ${userId}, date: ${date}`);
    
    // Validate date format
    if (!isValidDate(date)) {
      logger.warn(`Invalid date format: ${date}`);
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    const balanceData = await calculateBalanceForDate(userId, date);
    res.json(balanceData);
  } catch (error) {
    logger.error('Error fetching balance:', error);
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
};

/**
 * Get checks for a specific date
 * Returns all checks for the requested date
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getChecks = async (req, res) => {
  try {
    const userId = req.user.userId;
    const date = req.query.date || new Date().toISOString().split('T')[0]; // Default to today
    
    logger.info(`Fetching checks for user: ${userId}, date: ${date}`);
    
    // Validate date format
    if (!isValidDate(date)) {
      logger.warn(`Invalid date format: ${date}`);
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    const checks = await getChecksForDate(userId, date);
    res.json(checks);
  } catch (error) {
    logger.error('Error fetching checks:', error);
    res.status(500).json({ error: 'Failed to fetch checks' });
  }
};

/**
 * Get dashboard summary
 * Returns complete dashboard data including balance, checks, and cash transactions for the date
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getSummary = async (req, res) => {
  try {
    const userId = req.user.userId;
    const date = req.query.date || new Date().toISOString().split('T')[0]; // Default to today
    
    logger.info(`Fetching dashboard summary for user: ${userId}, date: ${date}`);
    
    // Validate date format
    if (!isValidDate(date)) {
      logger.warn(`Invalid date format: ${date}`);
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    // Get balance, checks, and cash transactions in parallel
    const [balanceData, checks, cashTransactions] = await Promise.all([
      calculateBalanceForDate(userId, date),
      getChecksForDate(userId, date),
      getCashTransactionsForDate(userId, date)
    ]);
    
    // Separate incoming and outgoing checks
    const incomingChecks = checks.filter(check => check.type === 'incoming');
    const outgoingChecks = checks.filter(check => check.type === 'outgoing');
    
    // Separate credit and debit cash transactions
    const creditCash = cashTransactions.filter(cash => cash.type === 'credit');
    const debitCash = cashTransactions.filter(cash => cash.type === 'debit');
    
    // Calculate totals for the day
    const incomingTotal = incomingChecks.reduce((sum, check) => sum + parseFloat(check.amount), 0);
    const outgoingTotal = outgoingChecks.reduce((sum, check) => sum + parseFloat(check.amount), 0);
    const creditCashTotal = creditCash.reduce((sum, cash) => sum + parseFloat(cash.amount), 0);
    const debitCashTotal = debitCash.reduce((sum, cash) => sum + parseFloat(cash.amount), 0);
    
    const summary = {
      date,
      balance: balanceData,
      checks: {
        incoming: incomingChecks,
        outgoing: outgoingChecks,
        total: checks.length
      },
      cash: {
        credit: creditCash,
        debit: debitCash,
        total: cashTransactions.length
      },
      daily_totals: {
        incoming: incomingTotal,
        outgoing: outgoingTotal,
        credit_cash: creditCashTotal,
        debit_cash: debitCashTotal,
        net: incomingTotal - outgoingTotal + creditCashTotal - debitCashTotal
      }
    };
    
    logger.info(`Dashboard summary retrieved for date: ${date}`);
    res.json(summary);
  } catch (error) {
    logger.error('Error fetching dashboard summary:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
};

