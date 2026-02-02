/**
 * Bank Account Routes
 * Defines API endpoints for bank account CRUD operations
 * All routes require authentication
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount
} from '../controllers/account.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/accounts
 * Get all bank accounts for authenticated user
 */
router.get('/', getAccounts);

/**
 * GET /api/accounts/:id
 * Get a specific bank account by ID
 */
router.get('/:id', getAccountById);

/**
 * POST /api/accounts
 * Create a new bank account
 */
router.post('/', createAccount);

/**
 * PUT /api/accounts/:id
 * Update an existing bank account
 */
router.put('/:id', updateAccount);

/**
 * DELETE /api/accounts/:id
 * Delete a bank account
 */
router.delete('/:id', deleteAccount);

export default router;

