/**
 * Report Controller
 * Handles report generation and analytics
 * Provides financial summaries, trends, and account-wise reports
 */

import { query } from '../config/database.js';
import logger from '../config/logger.js';
import { isValidDate } from '../utils/validation.js';

/**
 * Get financial summary report
 * Provides income vs expense summary for a date range
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getFinancialSummary = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { startDate, endDate } = req.query;
    
    logger.info(`Generating financial summary for user: ${userId}`, { startDate, endDate });
    
    // Validate date formats
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }
    
    if (!isValidDate(startDate) || !isValidDate(endDate)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    // Get all accounts for the user
    const accountsResult = await query(
      'SELECT id, bank_name, account_number, alias_name, opening_balance FROM bank_accounts WHERE user_id = $1',
      [userId]
    );
    
    const accounts = accountsResult.rows;
    
    // Calculate income (incoming checks + cash credit)
    const incomeChecksResult = await query(
      `SELECT COALESCE(SUM(c.amount), 0) as total
       FROM checks c
       INNER JOIN bank_accounts ba ON c.bank_account_id = ba.id
       WHERE ba.user_id = $1 AND c.type = 'incoming' AND c.date >= $2 AND c.date <= $3`,
      [userId, startDate, endDate]
    );
    
    const incomeCashResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM cash
       WHERE user_id = $1 AND type = 'credit' AND date >= $2 AND date <= $3`,
      [userId, startDate, endDate]
    );
    
    // Calculate expenses (outgoing checks + cash debit)
    const expenseChecksResult = await query(
      `SELECT COALESCE(SUM(c.amount), 0) as total
       FROM checks c
       INNER JOIN bank_accounts ba ON c.bank_account_id = ba.id
       WHERE ba.user_id = $1 AND c.type = 'outgoing' AND c.date >= $2 AND c.date <= $3`,
      [userId, startDate, endDate]
    );
    
    const expenseCashResult = await query(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM cash
       WHERE user_id = $1 AND type = 'debit' AND date >= $2 AND date <= $3`,
      [userId, startDate, endDate]
    );
    
    const incomeChecks = parseFloat(incomeChecksResult.rows[0].total) || 0;
    const incomeCash = parseFloat(incomeCashResult.rows[0].total) || 0;
    const expenseChecks = parseFloat(expenseChecksResult.rows[0].total) || 0;
    const expenseCash = parseFloat(expenseCashResult.rows[0].total) || 0;
    
    const totalIncome = incomeChecks + incomeCash;
    const totalExpense = expenseChecks + expenseCash;
    const netAmount = totalIncome - totalExpense;
    
    // Get account-wise breakdown
    const accountBreakdown = [];
    for (const account of accounts) {
      const accountIncomeResult = await query(
        `SELECT COALESCE(SUM(amount), 0) as total
         FROM checks
         WHERE bank_account_id = $1 AND type = 'incoming' AND date >= $2 AND date <= $3`,
        [account.id, startDate, endDate]
      );
      
      const accountExpenseResult = await query(
        `SELECT COALESCE(SUM(amount), 0) as total
         FROM checks
         WHERE bank_account_id = $1 AND type = 'outgoing' AND date >= $2 AND date <= $3`,
        [account.id, startDate, endDate]
      );
      
      const accountIncome = parseFloat(accountIncomeResult.rows[0].total) || 0;
      const accountExpense = parseFloat(accountExpenseResult.rows[0].total) || 0;
      
      accountBreakdown.push({
        account_id: account.id,
        bank_name: account.bank_name,
        alias_name: account.alias_name,
        account_number: account.account_number,
        income: accountIncome,
        expense: accountExpense,
        net: accountIncome - accountExpense
      });
    }
    
    const summary = {
      period: {
        start_date: startDate,
        end_date: endDate
      },
      totals: {
        income: {
          checks: incomeChecks,
          cash: incomeCash,
          total: totalIncome
        },
        expense: {
          checks: expenseChecks,
          cash: expenseCash,
          total: totalExpense
        },
        net: netAmount
      },
      account_breakdown: accountBreakdown
    };
    
    logger.info(`Financial summary generated successfully for period: ${startDate} to ${endDate}`);
    res.json(summary);
  } catch (error) {
    logger.error('Error generating financial summary:', error);
    res.status(500).json({ error: 'Failed to generate financial summary' });
  }
};

/**
 * Get monthly trends
 * Provides month-by-month income and expense trends
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getMonthlyTrends = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { year, months = 12 } = req.query; // Default to last 12 months
    
    logger.info(`Generating monthly trends for user: ${userId}`, { year, months });
    
    const monthsCount = parseInt(months) || 12;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    
    // Calculate start date (monthsCount months ago)
    const endDate = new Date(targetYear, 11, 31); // End of target year
    const startDate = new Date(targetYear, 0, 1); // Start of target year
    
    if (year) {
      // If specific year provided, show that year's months
      startDate.setFullYear(targetYear);
      endDate.setFullYear(targetYear);
    } else {
      // Otherwise, show last N months
      startDate.setMonth(endDate.getMonth() - (monthsCount - 1));
      startDate.setDate(1); // First day of month
    }
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // Get monthly breakdown
    const monthlyData = [];
    
    // Get income by month
    const incomeByMonthResult = await query(
      `SELECT 
         DATE_TRUNC('month', c.date) as month,
         SUM(CASE WHEN c.type = 'incoming' THEN c.amount ELSE 0 END) as check_income,
         SUM(CASE WHEN c.type = 'outgoing' THEN c.amount ELSE 0 END) as check_expense
       FROM checks c
       INNER JOIN bank_accounts ba ON c.bank_account_id = ba.id
       WHERE ba.user_id = $1 AND c.date >= $2 AND c.date <= $3
       GROUP BY DATE_TRUNC('month', c.date)
       ORDER BY month`,
      [userId, startDateStr, endDateStr]
    );
    
    // Get cash by month
    const cashByMonthResult = await query(
      `SELECT 
         DATE_TRUNC('month', date) as month,
         SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END) as cash_income,
         SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END) as cash_expense
       FROM cash
       WHERE user_id = $1 AND date >= $2 AND date <= $3
       GROUP BY DATE_TRUNC('month', date)
       ORDER BY month`,
      [userId, startDateStr, endDateStr]
    );
    
    // Combine data by month
    const monthMap = new Map();
    
    // Process check data
    incomeByMonthResult.rows.forEach(row => {
      const monthKey = row.month.toISOString().split('T')[0].substring(0, 7); // YYYY-MM
      monthMap.set(monthKey, {
        month: monthKey,
        income: parseFloat(row.check_income) || 0,
        expense: parseFloat(row.check_expense) || 0,
        cash_income: 0,
        cash_expense: 0
      });
    });
    
    // Process cash data
    cashByMonthResult.rows.forEach(row => {
      const monthKey = row.month.toISOString().split('T')[0].substring(0, 7);
      if (monthMap.has(monthKey)) {
        const existing = monthMap.get(monthKey);
        existing.cash_income = parseFloat(row.cash_income) || 0;
        existing.cash_expense = parseFloat(row.cash_expense) || 0;
      } else {
        monthMap.set(monthKey, {
          month: monthKey,
          income: 0,
          expense: 0,
          cash_income: parseFloat(row.cash_income) || 0,
          cash_expense: parseFloat(row.cash_expense) || 0
        });
      }
    });
    
    // Convert to array and calculate totals
    monthlyData.push(...Array.from(monthMap.values()).map(data => ({
      ...data,
      total_income: data.income + data.cash_income,
      total_expense: data.expense + data.cash_expense,
      net: (data.income + data.cash_income) - (data.expense + data.cash_expense)
    })));
    
    logger.info(`Monthly trends generated successfully: ${monthlyData.length} months`);
    res.json({
      period: {
        start_date: startDateStr,
        end_date: endDateStr
      },
      monthly_data: monthlyData
    });
  } catch (error) {
    logger.error('Error generating monthly trends:', error);
    res.status(500).json({ error: 'Failed to generate monthly trends' });
  }
};

/**
 * Get account performance report
 * Provides detailed account-wise performance metrics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAccountPerformance = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { accountId, startDate, endDate } = req.query;
    
    logger.info(`Generating account performance for user: ${userId}`, { accountId, startDate, endDate });
    
    // Get all accounts or specific account
    let accountsQuery = 'SELECT id, bank_name, account_number, alias_name, opening_balance FROM bank_accounts WHERE user_id = $1';
    const queryParams = [userId];
    
    if (accountId) {
      accountsQuery += ' AND id = $2';
      queryParams.push(accountId);
    }
    
    const accountsResult = await query(accountsQuery, queryParams);
    const accounts = accountsResult.rows;
    
    if (accounts.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    const accountReports = [];
    
    for (const account of accounts) {
      // Get date range or use all time
      const dateFilter = startDate && endDate ? `AND c.date >= '${startDate}' AND c.date <= '${endDate}'` : '';
      
      // Get incoming checks
      const incomingResult = await query(
        `SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total
         FROM checks
         WHERE bank_account_id = $1 AND type = 'incoming' ${dateFilter}`,
        [account.id]
      );
      
      // Get outgoing checks
      const outgoingResult = await query(
        `SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total
         FROM checks
         WHERE bank_account_id = $1 AND type = 'outgoing' ${dateFilter}`,
        [account.id]
      );
      
      // Get current balance (up to endDate or today)
      const balanceDate = endDate || new Date().toISOString().split('T')[0];
      const balanceResult = await query(
        `SELECT COALESCE(SUM(CASE WHEN type = 'incoming' THEN amount ELSE -amount END), 0) as net
         FROM checks
         WHERE bank_account_id = $1 AND date <= $2`,
        [account.id, balanceDate]
      );
      
      const openingBalance = parseFloat(account.opening_balance) || 0;
      const netFromChecks = parseFloat(balanceResult.rows[0].net) || 0;
      const currentBalance = openingBalance + netFromChecks;
      
      const incomingCount = parseInt(incomingResult.rows[0].count) || 0;
      const incomingTotal = parseFloat(incomingResult.rows[0].total) || 0;
      const outgoingCount = parseInt(outgoingResult.rows[0].count) || 0;
      const outgoingTotal = parseFloat(outgoingResult.rows[0].total) || 0;
      
      accountReports.push({
        account_id: account.id,
        bank_name: account.bank_name,
        alias_name: account.alias_name,
        account_number: account.account_number,
        opening_balance: openingBalance,
        current_balance: currentBalance,
        incoming: {
          count: incomingCount,
          total: incomingTotal
        },
        outgoing: {
          count: outgoingCount,
          total: outgoingTotal
        },
        net_flow: incomingTotal - outgoingTotal
      });
    }
    
    logger.info(`Account performance report generated successfully: ${accountReports.length} accounts`);
    res.json({
      period: startDate && endDate ? { start_date: startDate, end_date: endDate } : null,
      accounts: accountReports
    });
  } catch (error) {
    logger.error('Error generating account performance:', error);
    res.status(500).json({ error: 'Failed to generate account performance report' });
  }
};

/**
 * Export transactions to CSV format
 * Exports checks and cash transactions for a date range
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const exportTransactions = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { startDate, endDate, format = 'csv' } = req.query;
    
    logger.info(`Exporting transactions for user: ${userId}`, { startDate, endDate, format });
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }
    
    if (!isValidDate(startDate) || !isValidDate(endDate)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    // Get checks
    const checksResult = await query(
      `SELECT c.id, c.type, c.amount, c.date, c.payee_payer_name, c.created_at,
              ba.bank_name, ba.alias_name, ba.account_number
       FROM checks c
       INNER JOIN bank_accounts ba ON c.bank_account_id = ba.id
       WHERE ba.user_id = $1 AND c.date >= $2 AND c.date <= $3
       ORDER BY c.date DESC, c.created_at DESC`,
      [userId, startDate, endDate]
    );
    
    // Get cash transactions
    const cashResult = await query(
      `SELECT id, type, amount, date, description, created_at
       FROM cash
       WHERE user_id = $1 AND date >= $2 AND date <= $3
       ORDER BY date DESC, created_at DESC`,
      [userId, startDate, endDate]
    );
    
    if (format === 'csv') {
      // Generate CSV
      let csv = 'Type,Transaction Type,Date,Amount,Description/Payee,Account,Account Number\n';
      
      // Add checks
      checksResult.rows.forEach(check => {
        csv += `Check,${check.type},${check.date},${check.amount},"${check.payee_payer_name}",${check.bank_name || check.alias_name || 'N/A'},${check.account_number}\n`;
      });
      
      // Add cash transactions
      cashResult.rows.forEach(cash => {
        csv += `Cash,${cash.type},${cash.date},${cash.amount},"${cash.description || 'N/A'}",N/A,N/A\n`;
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=transactions_${startDate}_to_${endDate}.csv`);
      res.send(csv);
    } else {
      // Return JSON format
      res.json({
        period: {
          start_date: startDate,
          end_date: endDate
        },
        checks: checksResult.rows,
        cash: cashResult.rows,
        totals: {
          checks_count: checksResult.rows.length,
          cash_count: cashResult.rows.length,
          total_count: checksResult.rows.length + cashResult.rows.length
        }
      });
    }
  } catch (error) {
    logger.error('Error exporting transactions:', error);
    res.status(500).json({ error: 'Failed to export transactions' });
  }
};
