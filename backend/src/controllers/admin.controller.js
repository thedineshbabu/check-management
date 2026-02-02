/**
 * Admin Controller
 * Handles admin-specific operations
 * Manages user accounts, registration codes, and admin functions
 */

import { getAllUsers, updateUserPassword, updateUserAdminStatus, updateUserExpiry, deleteUser, findUserById } from '../models/user.model.js';
import { 
  createRegistrationCode, 
  getAllRegistrationCodes, 
  getRegistrationCodeById,
  deactivateRegistrationCode,
  updateRegistrationCodeExpiry,
  deleteRegistrationCode 
} from '../models/registration-code.model.js';
import { hashPassword } from '../utils/password.js';
import { validateRequiredFields, isValidEmail } from '../utils/validation.js';
import logger from '../config/logger.js';

/**
 * Get all users
 * Retrieves list of all users in the system
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getUsers = async (req, res) => {
  try {
    logger.info('Admin fetching all users');
    
    const filters = {};
    if (req.query.isAdmin !== undefined) {
      filters.isAdmin = req.query.isAdmin === 'true';
    }
    
    const users = await getAllUsers(filters);
    
    logger.info(`Retrieved ${users.length} users`);
    res.json({ users });
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Reset user password
 * Resets a user's password to a default password
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const resetUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { defaultPassword = 'DefaultPassword123!' } = req.body;
    
    logger.info(`Admin resetting password for user: ${userId}`);
    
    // Validate user exists
    const user = await findUserById(userId);
    if (!user) {
      logger.warn(`User not found for password reset: ${userId}`);
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Hash the default password
    const passwordHash = await hashPassword(defaultPassword);
    
    // Update user password
    await updateUserPassword(userId, passwordHash);
    
    logger.info(`Password reset successfully for user: ${userId}`);
    res.json({ 
      message: 'Password reset successfully',
      defaultPassword: defaultPassword // Return default password so admin can share it
    });
  } catch (error) {
    logger.error('Error resetting user password:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update user admin status
 * Grants or revokes admin privileges for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateAdminStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isAdmin } = req.body;
    
    logger.info(`Admin updating admin status for user: ${userId} to ${isAdmin}`);
    
    // Validate required fields
    if (typeof isAdmin !== 'boolean') {
      return res.status(400).json({ error: 'isAdmin must be a boolean value' });
    }
    
    // Prevent admin from revoking their own admin status
    if (req.user.userId === userId && !isAdmin) {
      logger.warn(`Admin attempted to revoke their own admin status: ${userId}`);
      return res.status(400).json({ error: 'Cannot revoke your own admin privileges' });
    }
    
    // Validate user exists
    const user = await findUserById(userId);
    if (!user) {
      logger.warn(`User not found for admin status update: ${userId}`);
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update admin status
    const updatedUser = await updateUserAdminStatus(userId, isAdmin);
    
    logger.info(`Admin status updated successfully for user: ${userId}`);
    res.json({ 
      message: 'Admin status updated successfully',
      user: updatedUser
    });
  } catch (error) {
    logger.error('Error updating admin status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Set user expiry time
 * Sets or updates the expiry time for a user account
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const setUserExpiry = async (req, res) => {
  try {
    const { userId } = req.params;
    const { expiryHours, expiryDate, removeExpiry } = req.body;
    
    logger.info(`Admin setting expiry for user: ${userId}`);
    
    // Validate user exists
    const user = await findUserById(userId);
    if (!user) {
      logger.warn(`User not found for expiry update: ${userId}`);
      return res.status(404).json({ error: 'User not found' });
    }
    
    let expiryTime = null;
    
    // If removeExpiry is true, set expiry to null (permanent access)
    if (removeExpiry === true) {
      expiryTime = null;
    } else if (expiryDate) {
      // Use provided expiry date
      expiryTime = new Date(expiryDate);
      if (isNaN(expiryTime.getTime())) {
        return res.status(400).json({ error: 'Invalid expiry date format' });
      }
    } else if (expiryHours) {
      // Calculate expiry from hours
      const hours = parseInt(expiryHours);
      if (isNaN(hours) || hours <= 0 || hours > 87600) { // Max 10 years
        return res.status(400).json({ error: 'Expiry hours must be between 1 and 87600 (10 years)' });
      }
      
      // Calculate expiry time from now
      expiryTime = new Date();
      expiryTime.setHours(expiryTime.getHours() + hours);
    } else {
      return res.status(400).json({ error: 'Either expiryHours, expiryDate, or removeExpiry must be provided' });
    }
    
    // Update user expiry
    const updatedUser = await updateUserExpiry(userId, expiryTime);
    
    logger.info(`User expiry updated successfully: ${userId}`);
    res.json({
      message: expiryTime ? 'User expiry set successfully' : 'User expiry removed (permanent access)',
      user: updatedUser
    });
  } catch (error) {
    logger.error('Error setting user expiry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete user
 * Permanently removes a user from the system
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const removeUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    logger.info(`Admin deleting user: ${userId}`);
    
    // Prevent admin from deleting themselves
    if (req.user.userId === userId) {
      logger.warn(`Admin attempted to delete themselves: ${userId}`);
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    // Validate user exists
    const user = await findUserById(userId);
    if (!user) {
      logger.warn(`User not found for deletion: ${userId}`);
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Delete user
    const deleted = await deleteUser(userId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    logger.info(`User deleted successfully: ${userId}`);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    logger.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Generate registration code
 * Creates a new registration code with expiry time
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const generateRegistrationCode = async (req, res) => {
  try {
    const { expiryHours = 24 } = req.body; // Default 24 hours expiry
    
    logger.info(`Admin generating registration code with ${expiryHours} hours expiry`);
    
    // Validate expiry hours
    const hours = parseInt(expiryHours);
    if (isNaN(hours) || hours <= 0 || hours > 8760) { // Max 1 year
      return res.status(400).json({ error: 'Expiry hours must be between 1 and 8760 (1 year)' });
    }
    
    // Calculate expiry time
    const expiryTime = new Date();
    expiryTime.setHours(expiryTime.getHours() + hours);
    
    // Create registration code
    const registrationCode = await createRegistrationCode(req.user.userId, expiryTime);
    
    logger.info(`Registration code generated successfully: ${registrationCode.code}`);
    res.status(201).json({
      message: 'Registration code generated successfully',
      code: registrationCode.code,
      expiryTime: registrationCode.expiry_time,
      createdAt: registrationCode.created_at
    });
  } catch (error) {
    logger.error('Error generating registration code:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get all registration codes
 * Retrieves list of all registration codes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getRegistrationCodes = async (req, res) => {
  try {
    logger.info('Admin fetching all registration codes');
    
    const filters = {};
    
    // Filter by creator
    if (req.query.createdBy) {
      filters.createdBy = req.query.createdBy;
    }
    
    // Filter by active status
    if (req.query.isActive !== undefined) {
      filters.isActive = req.query.isActive === 'true';
    }
    
    // Filter by used status
    if (req.query.used !== undefined) {
      filters.used = req.query.used === 'true';
    }
    
    const codes = await getAllRegistrationCodes(filters);
    
    logger.info(`Retrieved ${codes.length} registration codes`);
    res.json({ codes });
  } catch (error) {
    logger.error('Error fetching registration codes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Extend registration code expiry
 * Extends the expiry time for a registration code
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const extendCodeExpiry = async (req, res) => {
  try {
    const { codeId } = req.params;
    const { additionalHours } = req.body;
    
    logger.info(`Admin extending expiry for registration code: ${codeId} by ${additionalHours} hours`);
    
    // Validate additional hours
    const hours = parseInt(additionalHours);
    if (isNaN(hours) || hours <= 0 || hours > 8760) { // Max 1 year
      return res.status(400).json({ error: 'Additional hours must be between 1 and 8760 (1 year)' });
    }
    
    // Get current code to check expiry
    const currentCode = await getRegistrationCodeById(codeId);
    if (!currentCode) {
      return res.status(404).json({ error: 'Registration code not found' });
    }
    
    // Check if code is already used
    if (currentCode.used_by) {
      return res.status(400).json({ error: 'Cannot extend expiry for a code that has already been used' });
    }
    
    // Calculate new expiry time (extend from current expiry or now, whichever is later)
    const currentExpiry = new Date(currentCode.expiry_time);
    const now = new Date();
    const baseTime = currentExpiry > now ? currentExpiry : now;
    const newExpiryTime = new Date(baseTime);
    newExpiryTime.setHours(newExpiryTime.getHours() + hours);
    
    // Update expiry time
    const updatedCode = await updateRegistrationCodeExpiry(codeId, newExpiryTime);
    
    if (!updatedCode) {
      return res.status(400).json({ error: 'Failed to extend expiry. Code may have been used or deleted.' });
    }
    
    logger.info(`Registration code expiry extended successfully: ${codeId}`);
    res.json({
      message: 'Registration code expiry extended successfully',
      code: {
        id: updatedCode.id,
        code: updatedCode.code,
        expiryTime: updatedCode.expiry_time
      }
    });
  } catch (error) {
    logger.error('Error extending registration code expiry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Deactivate registration code
 * Deactivates a registration code without deleting it
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deactivateCode = async (req, res) => {
  try {
    const { codeId } = req.params;
    
    logger.info(`Admin deactivating registration code: ${codeId}`);
    
    const code = await deactivateRegistrationCode(codeId);
    
    if (!code) {
      return res.status(404).json({ error: 'Registration code not found' });
    }
    
    logger.info(`Registration code deactivated successfully: ${codeId}`);
    res.json({ 
      message: 'Registration code deactivated successfully',
      code: code
    });
  } catch (error) {
    logger.error('Error deactivating registration code:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete registration code
 * Permanently removes a registration code
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const removeRegistrationCode = async (req, res) => {
  try {
    const { codeId } = req.params;
    
    logger.info(`Admin deleting registration code: ${codeId}`);
    
    const deleted = await deleteRegistrationCode(codeId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Registration code not found' });
    }
    
    logger.info(`Registration code deleted successfully: ${codeId}`);
    res.json({ message: 'Registration code deleted successfully' });
  } catch (error) {
    logger.error('Error deleting registration code:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get admin dashboard statistics
 * Retrieves summary statistics for admin dashboard
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getDashboardStats = async (req, res) => {
  try {
    logger.info('Admin fetching dashboard statistics');
    
    // Get all users
    const allUsers = await getAllUsers();
    const adminUsers = await getAllUsers({ isAdmin: true });
    const regularUsers = await getAllUsers({ isAdmin: false });
    
    // Get all registration codes
    const allCodes = await getAllRegistrationCodes();
    const activeCodes = await getAllRegistrationCodes({ isActive: true, used: false });
    const usedCodes = await getAllRegistrationCodes({ used: true });
    
    const stats = {
      users: {
        total: allUsers.length,
        admins: adminUsers.length,
        regular: regularUsers.length
      },
      registrationCodes: {
        total: allCodes.length,
        active: activeCodes.length,
        used: usedCodes.length,
        expired: allCodes.filter(code => {
          const expiryTime = new Date(code.expiry_time);
          return new Date() > expiryTime && !code.used_by;
        }).length
      }
    };
    
    logger.info('Dashboard statistics retrieved successfully');
    res.json({ stats });
  } catch (error) {
    logger.error('Error fetching dashboard statistics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

