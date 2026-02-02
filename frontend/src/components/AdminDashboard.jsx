/**
 * Admin Dashboard Component
 * Main admin dashboard for managing users and registration codes
 * Provides overview statistics and navigation to management sections
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminAPI } from '../services/api';
import logger from '../utils/logger';
import UserManagement from './UserManagement';
import RegistrationCodeManagement from './RegistrationCodeManagement';
import ThemeToggle from './ThemeToggle';
import './AdminDashboard.css';

/**
 * Admin Dashboard Component
 * Main admin interface with statistics and management sections
 */
const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  /**
   * Load dashboard statistics
   * Fetches overview statistics for admin dashboard
   */
  const loadStats = async () => {
    try {
      setLoading(true);
      logger.info('Loading admin dashboard statistics');
      const response = await adminAPI.getDashboardStats();
      setStats(response.stats);
      logger.info('Dashboard statistics loaded successfully');
    } catch (error) {
      logger.error('Error loading dashboard statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle logout
   * Logs out admin user and redirects to login
   */
  const handleLogout = () => {
    logger.info('Admin logging out');
    logout();
    navigate('/login');
  };

  /**
   * Load stats on component mount
   */
  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="admin-header-left">
          <h1>Admin Dashboard</h1>
          <p className="admin-email">{user?.email}</p>
        </div>
        <div className="admin-header-right">
          <ThemeToggle />
          <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
            User Dashboard
          </button>
          <button className="btn btn-danger" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          User Management
        </button>
        <button
          className={`admin-tab ${activeTab === 'codes' ? 'active' : ''}`}
          onClick={() => setActiveTab('codes')}
        >
          Registration Codes
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'overview' && (
          <div className="admin-overview">
            {loading ? (
              <div className="loading">Loading statistics...</div>
            ) : stats ? (
              <>
                <div className="stats-grid">
                  <div className="stat-card">
                    <h3>Total Users</h3>
                    <p className="stat-value">{stats.users.total}</p>
                    <div className="stat-details">
                      <span>Admins: {stats.users.admins}</span>
                      <span>Regular: {stats.users.regular}</span>
                    </div>
                  </div>

                  <div className="stat-card">
                    <h3>Registration Codes</h3>
                    <p className="stat-value">{stats.registrationCodes.total}</p>
                    <div className="stat-details">
                      <span>Active: {stats.registrationCodes.active}</span>
                      <span>Used: {stats.registrationCodes.used}</span>
                      <span>Expired: {stats.registrationCodes.expired}</span>
                    </div>
                  </div>
                </div>

                <div className="admin-info">
                  <h2>Admin Features</h2>
                  <ul>
                    <li>Manage user accounts - view, reset passwords, grant/revoke admin privileges</li>
                    <li>Generate registration codes with custom expiry times</li>
                    <li>Monitor registration code usage and expiration</li>
                    <li>View system statistics and user activity</li>
                  </ul>
                </div>
              </>
            ) : (
              <div className="error">Failed to load statistics</div>
            )}
          </div>
        )}

        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'codes' && <RegistrationCodeManagement />}
      </div>
    </div>
  );
};

export default AdminDashboard;

