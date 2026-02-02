/**
 * Admin Middleware
 * Verifies that the authenticated user has admin privileges
 * Must be used after authenticateToken middleware
 */

import logger from '../config/logger.js';
import { findUserById } from '../models/user.model.js';

/**
 * Admin authorization middleware
 * Checks if the authenticated user has admin privileges
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const requireAdmin = async (req, res, next) => {
  try {
    // Check if user is authenticated (should be set by authenticateToken middleware)
    if (!req.user || !req.user.userId) {
      logger.warn('Admin access attempted without authentication');
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Fetch user from database to check admin status
    const user = await findUserById(req.user.userId);
    
    if (!user) {
      logger.warn(`Admin access attempted by non-existent user: ${req.user.userId}`);
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is admin
    if (!user.is_admin) {
      logger.warn(`Admin access denied for user: ${req.user.userId}`);
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Attach full user object to request for use in controllers
    req.adminUser = user;
    logger.debug(`Admin access granted for user: ${req.user.userId}`);
    next();
  } catch (error) {
    logger.error('Error in admin middleware:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

