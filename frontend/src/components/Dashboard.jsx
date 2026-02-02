/**
 * Dashboard Component
 * Main dashboard with calendar view and balance display
 * Shows checks and balances for selected date
 */

import { useState, useEffect, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI, accountAPI, checkAPI } from '../services/api';
import logger from '../utils/logger';
import CalendarView from './CalendarView';
import BalanceCard from './BalanceCard';
import CheckList from './CheckList';
import AccountList from './AccountList';
import CheckForm from './CheckForm';
import ThemeToggle from './ThemeToggle';
import './Dashboard.css';

/**
 * Dashboard Component
 * Main dashboard page with calendar and balance tracking
 */
const Dashboard = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'week'
  const [dashboardData, setDashboardData] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [monthChecks, setMonthChecks] = useState([]); // Checks for calendar indicators
  const [loading, setLoading] = useState(true);
  const [showCheckForm, setShowCheckForm] = useState(false);
  const [editingCheck, setEditingCheck] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0); // Key to force re-render
  const [currentDateRange, setCurrentDateRange] = useState({ start: null, end: null });
  const { logout, user, isAdmin } = useAuth();
  const navigate = useNavigate();

  /**
   * Load dashboard data for selected date
   * Fetches balance and checks information
   */
  const loadDashboardData = async (date) => {
    try {
      setLoading(true);
      const dateStr = format(date, 'yyyy-MM-dd');
      logger.info(`Loading dashboard data for date: ${dateStr}`);
      
      // Load accounts first to ensure balance calculation uses latest account data
      const accountsData = await accountAPI.getAll();
      logger.info(`Loaded ${accountsData.length} accounts`);
      
      // Then load summary which calculates balances using the latest account data
      const summary = await dashboardAPI.getSummary(dateStr);
      logger.info('Dashboard summary loaded with balance data');
      
      // Update state with fresh data
      setAccounts(accountsData);
      setDashboardData(summary);
      // Increment refresh key to force AccountList re-render
      setRefreshKey(prev => prev + 1);
      logger.info('Dashboard data loaded successfully - accounts and balances updated');
    } catch (error) {
      logger.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load checks for the visible date range (for calendar indicators)
   * Fetches all checks within the month/week view
   */
  const loadMonthChecks = useCallback(async (startDate, endDate) => {
    try {
      logger.info(`Loading checks for date range: ${startDate} to ${endDate}`);
      const checks = await checkAPI.getByDateRange(startDate, endDate);
      setMonthChecks(checks);
      logger.info(`Loaded ${checks.length} checks for calendar`);
    } catch (error) {
      logger.error('Error loading month checks:', error);
      setMonthChecks([]);
    }
  }, []);

  /**
   * Handle calendar month/week change
   * Loads checks for the new visible date range
   */
  const handleMonthChange = useCallback((startDate, endDate) => {
    // Only reload if date range changed
    if (currentDateRange.start !== startDate || currentDateRange.end !== endDate) {
      setCurrentDateRange({ start: startDate, end: endDate });
      loadMonthChecks(startDate, endDate);
    }
  }, [currentDateRange, loadMonthChecks]);

  /**
   * Load data when component mounts or date changes
   */
  useEffect(() => {
    loadDashboardData(selectedDate);
  }, [selectedDate]);

  /**
   * Reload month checks when a check is added/edited/deleted
   */
  useEffect(() => {
    if (currentDateRange.start && currentDateRange.end) {
      loadMonthChecks(currentDateRange.start, currentDateRange.end);
    }
  }, [refreshKey]);

  /**
   * Handle date selection from calendar
   * Updates selected date and reloads data
   * @param {Date} date - Selected date
   */
  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  /**
   * Handle check form submission
   * Reloads dashboard data after check creation/update
   */
  const handleCheckSubmit = () => {
    setShowCheckForm(false);
    setEditingCheck(null);
    loadDashboardData(selectedDate);
  };

  /**
   * Handle check edit
   * Opens form with check data for editing
   * @param {Object} check - Check object to edit
   */
  const handleEditCheck = (check) => {
    setEditingCheck(check);
    setShowCheckForm(true);
  };

  /**
   * Handle check deletion
   * Reloads dashboard data after deletion
   */
  const handleDeleteCheck = () => {
    loadDashboardData(selectedDate);
  };

  /**
   * Handle account refresh
   * Reloads dashboard data and accounts after account creation/update
   * This ensures balances are recalculated immediately
   */
  const handleAccountRefresh = async () => {
    try {
      logger.info('Refreshing dashboard data after account update');
      // Force a fresh reload of all data
      await loadDashboardData(selectedDate);
      // Small delay to ensure state updates propagate
      await new Promise(resolve => setTimeout(resolve, 100));
      logger.info('Dashboard data refreshed successfully');
    } catch (error) {
      logger.error('Error refreshing dashboard data:', error);
    }
  };

  /**
   * Handle logout
   * Logs out user and redirects to login
   */
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading && !dashboardData) {
    return (
      <div className="dashboard-loading">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          {user && <div className="user-email">{user.email}</div>}
        </div>
        <div className="dashboard-actions">
          <ThemeToggle />
          {isAdmin() && (
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/admin')}
            >
              Admin Dashboard
            </button>
          )}
          <button 
            className="btn btn-secondary"
            onClick={() => setViewMode(viewMode === 'month' ? 'week' : 'month')}
          >
            {viewMode === 'month' ? 'Week View' : 'Month View'}
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => {
              setEditingCheck(null);
              setShowCheckForm(true);
            }}
          >
            + New Check
          </button>
          <button 
            className="btn btn-secondary"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-main">
          <CalendarView
            selectedDate={selectedDate}
            viewMode={viewMode}
            onDateSelect={handleDateSelect}
            dashboardData={dashboardData}
            monthChecks={monthChecks}
            onMonthChange={handleMonthChange}
          />

          <div className="dashboard-balance-section">
            <BalanceCard 
              balanceData={dashboardData?.balance}
              selectedDate={selectedDate}
            />
          </div>

          <div className="dashboard-checks-section">
            <CheckList
              checks={dashboardData?.checks}
              selectedDate={selectedDate}
              onEdit={handleEditCheck}
              onDelete={handleDeleteCheck}
            />
          </div>
        </div>

        <div className="dashboard-sidebar">
          <AccountList 
            key={`account-list-${refreshKey}-${dashboardData?.date || 'default'}-${accounts.length}`}
            accounts={accounts}
            balanceData={dashboardData?.balance}
            onRefresh={handleAccountRefresh}
          />
        </div>
      </div>

      {showCheckForm && (
        <CheckForm
          accounts={accounts}
          defaultDate={selectedDate}
          check={editingCheck}
          onClose={() => {
            setShowCheckForm(false);
            setEditingCheck(null);
          }}
          onSubmit={handleCheckSubmit}
        />
      )}
    </div>
  );
};

export default Dashboard;

