/**
 * Dashboard Component
 * Main dashboard with calendar view and balance display
 * Shows checks and balances for selected date
 */

import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI, accountAPI } from '../services/api';
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
  const [loading, setLoading] = useState(true);
  const [showCheckForm, setShowCheckForm] = useState(false);
  const [editingCheck, setEditingCheck] = useState(null);
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
      
      const [summary, accountsData] = await Promise.all([
        dashboardAPI.getSummary(dateStr),
        accountAPI.getAll()
      ]);
      
      setDashboardData(summary);
      setAccounts(accountsData);
      logger.info('Dashboard data loaded successfully');
    } catch (error) {
      logger.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load data when component mounts or date changes
   */
  useEffect(() => {
    loadDashboardData(selectedDate);
  }, [selectedDate]);

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
            accounts={accounts}
            balanceData={dashboardData?.balance}
            onRefresh={loadDashboardData}
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

