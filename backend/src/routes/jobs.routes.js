/**
 * Jobs Routes
 * Defines API endpoints for scheduled jobs
 * Requires admin authentication
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';
import { runJob } from '../jobs/recurring-transactions.job.js';
import logger from '../config/logger.js';

const router = express.Router();

// All routes require authentication and admin privileges
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * POST /api/jobs/process-recurring-transactions
 * Manually trigger processing of due recurring transactions
 * Admin only endpoint
 */
router.post('/process-recurring-transactions', async (req, res) => {
  try {
    logger.info('Admin manually triggering recurring transactions job');
    const results = await runJob();
    res.json({
      message: 'Recurring transactions processed successfully',
      results
    });
  } catch (error) {
    logger.error('Error running recurring transactions job:', error);
    res.status(500).json({ error: 'Failed to process recurring transactions' });
  }
});

export default router;
