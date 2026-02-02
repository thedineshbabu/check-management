/**
 * Authentication Controller
 * Handles user authentication logic
 * Manages login and registration endpoints
 */

import jwt from 'jsonwebtoken';
import { findUserByEmail, createUser, isUserExpired } from '../models/user.model.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { isValidEmail, isValidPassword, validateRequiredFields } from '../utils/validation.js';
import { validateCode, validateAndUseCode } from '../models/registration-code.model.js';
import logger from '../config/logger.js';

/**
 * User login
 * Authenticates user with email and password
 * Returns JWT token upon successful authentication
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    logger.info(`Login attempt for email: ${email}`);
    
    // Validate required fields
    const validation = validateRequiredFields({ email, password }, ['email', 'password']);
    if (!validation.isValid) {
      logger.warn(`Login validation failed: missing fields ${validation.missingFields.join(', ')}`);
      return res.status(400).json({ 
        error: 'Email and password are required',
        missingFields: validation.missingFields
      });
    }
    
    // Validate email format
    if (!isValidEmail(email)) {
      logger.warn(`Invalid email format: ${email}`);
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Find user by email
    const user = await findUserByEmail(email);
    if (!user) {
      logger.warn(`Login failed: user not found - ${email}`);
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      logger.warn(`Login failed: invalid password for ${email}`);
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Check if user account is expired
    if (isUserExpired(user)) {
      logger.warn(`Login failed: user account expired - ${email}`);
      return res.status(403).json({ 
        error: 'Your account has expired. Please contact an administrator.' 
      });
    }
    
    // Generate JWT token with admin status
    const token = jwt.sign(
      { userId: user.id, email: user.email, isAdmin: user.is_admin || false },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    
    logger.info(`Login successful for user: ${email}`);
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        isAdmin: user.is_admin || false
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * User registration
 * Creates a new user account
 * Returns JWT token upon successful registration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const register = async (req, res) => {
  try {
    const { email, password, registrationCode } = req.body;
    
    logger.info(`Registration attempt for email: ${email}`);
    
    // Validate required fields
    const validation = validateRequiredFields({ email, password, registrationCode }, ['email', 'password', 'registrationCode']);
    if (!validation.isValid) {
      logger.warn(`Registration validation failed: missing fields ${validation.missingFields.join(', ')}`);
      return res.status(400).json({ 
        error: 'Email, password, and registration code are required',
        missingFields: validation.missingFields
      });
    }
    
    // Validate email format
    if (!isValidEmail(email)) {
      logger.warn(`Invalid email format: ${email}`);
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Validate password strength
    if (!isValidPassword(password)) {
      logger.warn(`Invalid password strength for: ${email}`);
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    
    // Check if user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      logger.warn(`Registration failed: user already exists - ${email}`);
      return res.status(409).json({ error: 'User with this email already exists' });
    }
    
    // Validate registration code first (before creating user)
    const codeValidation = await validateCode(registrationCode.toUpperCase());
    if (!codeValidation) {
      logger.warn(`Invalid or expired registration code: ${registrationCode}`);
      return res.status(400).json({ error: 'Invalid or expired registration code' });
    }
    
    // Hash password and create user
    const passwordHash = await hashPassword(password);
    const user = await createUser(email, passwordHash);
    
    // Mark registration code as used by this user
    await validateAndUseCode(registrationCode.toUpperCase(), user.id);
    
    // Generate JWT token with admin status
    const token = jwt.sign(
      { userId: user.id, email: user.email, isAdmin: false },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    
    logger.info(`Registration successful for user: ${email}`);
    
    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        isAdmin: false
      }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

