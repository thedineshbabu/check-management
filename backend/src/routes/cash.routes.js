/**
 * Cash Routes
 * Defines API endpoints for cash transaction CRUD operations
 * All routes require authentication
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getCashTransactions,
  getCashTransactionById,
  createCashTransaction,
  updateCashTransaction,
  deleteCashTransaction
} from '../controllers/cash.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/cash
 * Get cash transactions with optional filters (date, type)
 * Query params: date, type, startDate, endDate
 */
router.get('/', getCashTransactions);

/**
 * GET /api/cash/:id
 * Get a specific cash transaction by ID
 */
router.get('/:id', getCashTransactionById);

/**
 * POST /api/cash
 * Create a new cash transaction (credit or debit)
 */
router.post('/', createCashTransaction);

/**
 * PUT /api/cash/:id
 * Update an existing cash transaction
 */
router.put('/:id', updateCashTransaction);

/**
 * DELETE /api/cash/:id
 * Delete a cash transaction
 */
router.delete('/:id', deleteCashTransaction);

export default router;
