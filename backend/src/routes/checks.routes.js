/**
 * Check Routes
 * Defines API endpoints for check CRUD operations
 * All routes require authentication
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getChecks,
  getCheckById,
  createCheck,
  updateCheck,
  deleteCheck
} from '../controllers/check.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/checks
 * Get checks with optional filters (date, accountId, type)
 * Query params: date, accountId, type, startDate, endDate
 */
router.get('/', getChecks);

/**
 * GET /api/checks/:id
 * Get a specific check by ID
 */
router.get('/:id', getCheckById);

/**
 * POST /api/checks
 * Create a new check (incoming or outgoing)
 */
router.post('/', createCheck);

/**
 * PUT /api/checks/:id
 * Update an existing check
 */
router.put('/:id', updateCheck);

/**
 * DELETE /api/checks/:id
 * Delete a check
 */
router.delete('/:id', deleteCheck);

export default router;

