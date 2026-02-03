/**
 * Reports Routes
 * Defines API endpoints for reports and analytics
 * All routes require authentication
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getFinancialSummary,
  getMonthlyTrends,
  getAccountPerformance,
  exportTransactions
} from '../controllers/report.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/reports/financial-summary
 * Get financial summary (income vs expense) for a date range
 * Query params: startDate, endDate (required)
 */
router.get('/financial-summary', getFinancialSummary);

/**
 * GET /api/reports/monthly-trends
 * Get monthly income and expense trends
 * Query params: year (optional), months (optional, default: 12)
 */
router.get('/monthly-trends', getMonthlyTrends);

/**
 * GET /api/reports/account-performance
 * Get account-wise performance metrics
 * Query params: accountId (optional), startDate (optional), endDate (optional)
 */
router.get('/account-performance', getAccountPerformance);

/**
 * GET /api/reports/export
 * Export transactions to CSV or JSON
 * Query params: startDate, endDate (required), format (optional: csv/json, default: csv)
 */
router.get('/export', exportTransactions);

export default router;
