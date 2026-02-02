/**
 * Authentication Middleware
 * Verifies JWT tokens for protected routes
 * Extracts user information from token and attaches to request
 */

import jwt from 'jsonwebtoken';
import logger from '../config/logger.js';

/**
 * Authentication middleware
 * Verifies JWT token from Authorization header
 * Attaches user information to request object if token is valid
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const authenticateToken = (req, res, next) => {
  // Extract token from Authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

  if (!token) {
    logger.warn('Authentication attempt without token');
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    // Verify token and extract user information
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user info to request (includes userId, email, isAdmin)
    logger.debug(`User authenticated: ${decoded.userId}`);
    next();
  } catch (error) {
    logger.warn('Invalid token provided:', error.message);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

