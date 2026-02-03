/**
 * Recurring Transaction Routes
 * Defines API endpoints for recurring transaction CRUD operations
 * All routes require authentication
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getRecurringTransactions,
  getRecurringTransactionById,
  createRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
  triggerRecurringTransaction
} from '../controllers/recurring-transaction.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/recurring-transactions
 * Get recurring transactions with optional filters (isActive, transactionType)
 * Query params: isActive, transactionType
 */
router.get('/', getRecurringTransactions);

/**
 * GET /api/recurring-transactions/:id
 * Get a specific recurring transaction by ID
 */
router.get('/:id', getRecurringTransactionById);

/**
 * POST /api/recurring-transactions
 * Create a new recurring transaction
 */
router.post('/', createRecurringTransaction);

/**
 * PUT /api/recurring-transactions/:id
 * Update an existing recurring transaction
 */
router.put('/:id', updateRecurringTransaction);

/**
 * DELETE /api/recurring-transactions/:id
 * Delete a recurring transaction
 */
router.delete('/:id', deleteRecurringTransaction);

/**
 * POST /api/recurring-transactions/:id/trigger
 * Manually trigger creation of a transaction from recurring template
 */
router.post('/:id/trigger', triggerRecurringTransaction);

export default router;
