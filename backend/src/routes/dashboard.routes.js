/**
 * Dashboard Routes
 * Defines API endpoints for dashboard data aggregation
 * All routes require authentication
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getBalance,
  getChecks,
  getSummary
} from '../controllers/dashboard.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/dashboard/balance
 * Get balance information for a specific date
 * Query param: date (YYYY-MM-DD), defaults to today
 */
router.get('/balance', getBalance);

/**
 * GET /api/dashboard/checks
 * Get checks for a specific date
 * Query param: date (YYYY-MM-DD), defaults to today
 */
router.get('/checks', getChecks);

/**
 * GET /api/dashboard/summary
 * Get complete dashboard summary (balance + checks) for a specific date
 * Query param: date (YYYY-MM-DD), defaults to today
 */
router.get('/summary', getSummary);

export default router;

