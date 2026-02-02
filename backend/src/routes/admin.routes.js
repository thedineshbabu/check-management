/**
 * Admin Routes
 * Defines API endpoints for admin operations
 * All routes require admin authentication
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';
import {
  getUsers,
  resetUserPassword,
  updateAdminStatus,
  setUserExpiry,
  removeUser,
  generateRegistrationCode,
  getRegistrationCodes,
  extendCodeExpiry,
  deactivateCode,
  removeRegistrationCode,
  getDashboardStats
} from '../controllers/admin.controller.js';

const router = express.Router();

// All admin routes require authentication and admin privileges
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * GET /api/admin/dashboard/stats
 * Get admin dashboard statistics
 */
router.get('/dashboard/stats', getDashboardStats);

/**
 * GET /api/admin/users
 * Get all users
 * Query params: isAdmin (boolean)
 */
router.get('/users', getUsers);

/**
 * POST /api/admin/users/:userId/reset-password
 * Reset user password to default
 * Body: { defaultPassword: string } (optional, defaults to 'DefaultPassword123!')
 */
router.post('/users/:userId/reset-password', resetUserPassword);

/**
 * PUT /api/admin/users/:userId/admin-status
 * Update user admin status
 * Body: { isAdmin: boolean }
 */
router.put('/users/:userId/admin-status', updateAdminStatus);

/**
 * POST /api/admin/users/:userId/set-expiry
 * Set user account expiry time
 * Body: { expiryHours: number } OR { expiryDate: string (ISO) } OR { removeExpiry: true }
 */
router.post('/users/:userId/set-expiry', setUserExpiry);

/**
 * DELETE /api/admin/users/:userId
 * Delete a user
 */
router.delete('/users/:userId', removeUser);

/**
 * POST /api/admin/registration-codes
 * Generate a new registration code
 * Body: { expiryHours: number } (optional, defaults to 24)
 */
router.post('/registration-codes', generateRegistrationCode);

/**
 * GET /api/admin/registration-codes
 * Get all registration codes
 * Query params: createdBy (UUID), isActive (boolean), used (boolean)
 */
router.get('/registration-codes', getRegistrationCodes);

/**
 * POST /api/admin/registration-codes/:codeId/extend-expiry
 * Extend registration code expiry time
 * Body: { additionalHours: number }
 */
router.post('/registration-codes/:codeId/extend-expiry', extendCodeExpiry);

/**
 * POST /api/admin/registration-codes/:codeId/deactivate
 * Deactivate a registration code
 */
router.post('/registration-codes/:codeId/deactivate', deactivateCode);

/**
 * DELETE /api/admin/registration-codes/:codeId
 * Delete a registration code
 */
router.delete('/registration-codes/:codeId', removeRegistrationCode);

export default router;

