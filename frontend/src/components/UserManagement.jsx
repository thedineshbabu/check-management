/**
 * User Management Component
 * Admin interface for managing users
 * Allows viewing, password reset, admin status updates, and user deletion
 */

import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import logger from '../utils/logger';
import './UserManagement.css';

/**
 * User Management Component
 * Provides user management functionality for admins
 */
const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'admin', 'regular'
  const [resetPasswordUserId, setResetPasswordUserId] = useState(null);
  const [defaultPassword, setDefaultPassword] = useState('DefaultPassword123!');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [resetPasswordResult, setResetPasswordResult] = useState(null);

  /**
   * Load users from API
   * Fetches all users based on current filter
   */
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      logger.info('Loading users for admin management');

      const filters = {};
      if (filter === 'admin') {
        filters.isAdmin = true;
      } else if (filter === 'regular') {
        filters.isAdmin = false;
      }

      const response = await adminAPI.getUsers(filters);
      setUsers(response.users);
      logger.info(`Loaded ${response.users.length} users`);
    } catch (err) {
      logger.error('Error loading users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Reset user password
   * Resets a user's password to default value
   * @param {string} userId - User ID to reset password for
   */
  const handleResetPassword = async () => {
    try {
      setError('');
      logger.info(`Resetting password for user: ${resetPasswordUserId}`);

      const response = await adminAPI.resetUserPassword(resetPasswordUserId, defaultPassword);
      setResetPasswordResult({
        success: true,
        defaultPassword: response.defaultPassword || defaultPassword
      });
      logger.info('Password reset successfully');
      
      // Reload users after reset
      setTimeout(() => {
        loadUsers();
        setShowPasswordModal(false);
        setResetPasswordResult(null);
      }, 3000);
    } catch (err) {
      logger.error('Error resetting password:', err);
      setResetPasswordResult({
        success: false,
        error: err.response?.data?.error || 'Failed to reset password'
      });
    }
  };

  /**
   * Toggle admin status
   * Grants or revokes admin privileges for a user
   * @param {string} userId - User ID
   * @param {boolean} currentStatus - Current admin status
   */
  const handleToggleAdminStatus = async (userId, currentStatus) => {
    try {
      setError('');
      const newStatus = !currentStatus;
      logger.info(`Toggling admin status for user: ${userId} to ${newStatus}`);

      await adminAPI.updateAdminStatus(userId, newStatus);
      logger.info('Admin status updated successfully');
      loadUsers();
    } catch (err) {
      logger.error('Error updating admin status:', err);
      setError(err.response?.data?.error || 'Failed to update admin status');
    }
  };

  /**
   * Delete user
   * Permanently removes a user from the system
   * @param {string} userId - User ID to delete
   */
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      setError('');
      logger.info(`Deleting user: ${userId}`);

      await adminAPI.deleteUser(userId);
      logger.info('User deleted successfully');
      loadUsers();
    } catch (err) {
      logger.error('Error deleting user:', err);
      setError(err.response?.data?.error || 'Failed to delete user');
    }
  };

  /**
   * Format date for display
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted date
   */
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  /**
   * Load users when component mounts or filter changes
   */
  useEffect(() => {
    loadUsers();
  }, [filter]);

  return (
    <div className="user-management">
      <div className="user-management-header">
        <h2>User Management</h2>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Users
          </button>
          <button
            className={`filter-btn ${filter === 'admin' ? 'active' : ''}`}
            onClick={() => setFilter('admin')}
          >
            Admins
          </button>
          <button
            className={`filter-btn ${filter === 'regular' ? 'active' : ''}`}
            onClick={() => setFilter('regular')}
          >
            Regular Users
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading users...</div>
      ) : (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="4" className="no-users">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-badge ${user.is_admin ? 'admin' : 'regular'}`}>
                        {user.is_admin ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td>{formatDate(user.created_at)}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => {
                            setResetPasswordUserId(user.id);
                            setShowPasswordModal(true);
                            setResetPasswordResult(null);
                          }}
                        >
                          Reset Password
                        </button>
                        <button
                          className={`btn btn-sm ${user.is_admin ? 'btn-warning' : 'btn-success'}`}
                          onClick={() => handleToggleAdminStatus(user.id, user.is_admin)}
                        >
                          {user.is_admin ? 'Revoke Admin' : 'Make Admin'}
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Reset User Password</h3>
            {resetPasswordResult ? (
              resetPasswordResult.success ? (
                <div className="success-message">
                  <p>Password reset successfully!</p>
                  <p className="password-display">
                    Default Password: <strong>{resetPasswordResult.defaultPassword}</strong>
                  </p>
                  <p className="password-note">Share this password with the user offline.</p>
                </div>
              ) : (
                <div className="error-message">
                  {resetPasswordResult.error}
                </div>
              )
            ) : (
              <>
                <div className="form-group">
                  <label>Default Password</label>
                  <input
                    type="text"
                    value={defaultPassword}
                    onChange={(e) => setDefaultPassword(e.target.value)}
                    className="input"
                  />
                </div>
                <div className="modal-actions">
                  <button className="btn btn-primary" onClick={handleResetPassword}>
                    Reset Password
                  </button>
                  <button className="btn btn-secondary" onClick={() => setShowPasswordModal(false)}>
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

