/**
 * Authentication Routes
 * Defines API endpoints for user authentication
 */

import express from 'express';
import { login, register } from '../controllers/auth.controller.js';

const router = express.Router();

/**
 * POST /api/auth/login
 * User login endpoint
 * Authenticates user and returns JWT token
 */
router.post('/login', login);

/**
 * POST /api/auth/register
 * User registration endpoint
 * Creates new user account and returns JWT token
 */
router.post('/register', register);

export default router;

