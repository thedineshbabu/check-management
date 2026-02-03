/**
 * Reports & Analytics Component
 * Provides financial reports, trends, and analytics
 * Includes financial summary, monthly trends, and account performance
 */

import { useState, useEffect } from 'react';
import { format, startOfYear, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { reportAPI, accountAPI } from '../services/api';
import logger from '../utils/logger';
import ThemeToggle from './ThemeToggle';
import './Reports.css';

/**
 * Reports Component
 * Main component for reports and analytics
 */
const Reports = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('summary');
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Financial Summary State
  const [summaryData, setSummaryData] = useState(null);
  const [summaryStartDate, setSummaryStartDate] = useState(
    format(startOfYear(new Date()), 'yyyy-MM-dd')
  );
  const [summaryEndDate, setSummaryEndDate] = useState(
    format(new Date(), 'yyyy-MM-dd')
  );

  // Monthly Trends State
  const [trendsData, setTrendsData] = useState(null);
  const [trendsYear, setTrendsYear] = useState(new Date().getFullYear());
  const [trendsMonths, setTrendsMonths] = useState(12);

  // Account Performance State
  const [performanceData, setPerformanceData] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [perfStartDate, setPerfStartDate] = useState(
    format(startOfYear(new Date()), 'yyyy-MM-dd')
  );
  const [perfEndDate, setPerfEndDate] = useState(
    format(new Date(), 'yyyy-MM-dd')
  );

  /**
   * Load accounts on mount
   */
  useEffect(() => {
    loadAccounts();
  }, []);

  /**
   * Load accounts
   */
  const loadAccounts = async () => {
    try {
      const accountsData = await accountAPI.getAll();
      setAccounts(accountsData);
    } catch (error) {
      logger.error('Error loading accounts:', error);
    }
  };

  /**
   * Load financial summary
   */
  const loadFinancialSummary = async () => {
    if (!summaryStartDate || !summaryEndDate) {
      alert('Please select both start and end dates');
      return;
    }

    try {
      setLoading(true);
      logger.info('Loading financial summary');
      const data = await reportAPI.getFinancialSummary(summaryStartDate, summaryEndDate);
      setSummaryData(data);
      logger.info('Financial summary loaded successfully');
    } catch (error) {
      logger.error('Error loading financial summary:', error);
      alert('Failed to load financial summary');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load monthly trends
   */
  const loadMonthlyTrends = async () => {
    try {
      setLoading(true);
      logger.info('Loading monthly trends');
      const data = await reportAPI.getMonthlyTrends(trendsYear, trendsMonths);
      setTrendsData(data);
      logger.info('Monthly trends loaded successfully');
    } catch (error) {
      logger.error('Error loading monthly trends:', error);
      alert('Failed to load monthly trends');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load account performance
   */
  const loadAccountPerformance = async () => {
    try {
      setLoading(true);
      logger.info('Loading account performance');
      const accountId = selectedAccount === 'all' ? null : selectedAccount;
      const data = await reportAPI.getAccountPerformance(
        accountId,
        perfStartDate || null,
        perfEndDate || null
      );
      setPerformanceData(data);
      logger.info('Account performance loaded successfully');
    } catch (error) {
      logger.error('Error loading account performance:', error);
      alert('Failed to load account performance');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Export transactions
   */
  const handleExport = async () => {
    if (!summaryStartDate || !summaryEndDate) {
      alert('Please select both start and end dates');
      return;
    }

    try {
      logger.info('Exporting transactions');
      const blob = await reportAPI.exportTransactions(summaryStartDate, summaryEndDate, 'csv');
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions_${summaryStartDate}_to_${summaryEndDate}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      logger.info('Transactions exported successfully');
    } catch (error) {
      logger.error('Error exporting transactions:', error);
      alert('Failed to export transactions');
    }
  };

  /**
   * Calculate percentage for bar chart
   */
  const calculatePercentage = (value, max) => {
    if (max === 0) return 0;
    return Math.min((value / max) * 100, 100);
  };

  /**
   * Format currency
   */
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  /**
   * Parse ISO date string
   */
  const parseISODate = (dateString) => {
    return parseISO(dateString);
  };

  return (
    <div className="reports">
      <div className="reports-header">
        <h1>Reports & Analytics</h1>
        <div className="reports-actions">
          <ThemeToggle />
          <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
            Dashboard
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/recurring-transactions')}>
            Recurring Transactions
          </button>
          <button className="btn btn-primary" onClick={handleExport}>
            Export CSV
          </button>
        </div>
      </div>

      <div className="reports-tabs">
        <button
          className={`report-tab ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          Financial Summary
        </button>
        <button
          className={`report-tab ${activeTab === 'trends' ? 'active' : ''}`}
          onClick={() => setActiveTab('trends')}
        >
          Monthly Trends
        </button>
        <button
          className={`report-tab ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          Account Performance
        </button>
      </div>

      <div className="reports-content">
        {activeTab === 'summary' && (
          <div className="report-section">
            <div className="report-filters">
              <div className="filter-group">
                <label>Start Date</label>
                <input
                  type="date"
                  value={summaryStartDate}
                  onChange={(e) => setSummaryStartDate(e.target.value)}
                  className="input"
                />
              </div>
              <div className="filter-group">
                <label>End Date</label>
                <input
                  type="date"
                  value={summaryEndDate}
                  onChange={(e) => setSummaryEndDate(e.target.value)}
                  className="input"
                />
              </div>
              <button className="btn btn-primary" onClick={loadFinancialSummary}>
                Generate Report
              </button>
            </div>

            {loading && <div className="loading">Loading...</div>}

            {summaryData && (
              <div className="summary-results">
                <div className="summary-cards">
                  <div className="summary-card income">
                    <h3>Total Income</h3>
                    <p className="summary-amount">{formatCurrency(summaryData.totals.income.total)}</p>
                    <div className="summary-breakdown">
                      <span>Checks: {formatCurrency(summaryData.totals.income.checks)}</span>
                      <span>Cash: {formatCurrency(summaryData.totals.income.cash)}</span>
                    </div>
                  </div>

                  <div className="summary-card expense">
                    <h3>Total Expense</h3>
                    <p className="summary-amount">{formatCurrency(summaryData.totals.expense.total)}</p>
                    <div className="summary-breakdown">
                      <span>Checks: {formatCurrency(summaryData.totals.expense.checks)}</span>
                      <span>Cash: {formatCurrency(summaryData.totals.expense.cash)}</span>
                    </div>
                  </div>

                  <div className={`summary-card net ${summaryData.totals.net >= 0 ? 'positive' : 'negative'}`}>
                    <h3>Net Amount</h3>
                    <p className="summary-amount">{formatCurrency(summaryData.totals.net)}</p>
                  </div>
                </div>

                <div className="summary-chart">
                  <h3>Income vs Expense</h3>
                  <div className="bar-chart">
                    <div className="bar-chart-item">
                      <div className="bar-label">Income</div>
                      <div className="bar-container">
                        <div
                          className="bar income-bar"
                          style={{
                            width: `${calculatePercentage(
                              summaryData.totals.income.total,
                              Math.max(summaryData.totals.income.total, summaryData.totals.expense.total)
                            )}%`
                          }}
                        >
                          {formatCurrency(summaryData.totals.income.total)}
                        </div>
                      </div>
                    </div>
                    <div className="bar-chart-item">
                      <div className="bar-label">Expense</div>
                      <div className="bar-container">
                        <div
                          className="bar expense-bar"
                          style={{
                            width: `${calculatePercentage(
                              summaryData.totals.expense.total,
                              Math.max(summaryData.totals.income.total, summaryData.totals.expense.total)
                            )}%`
                          }}
                        >
                          {formatCurrency(summaryData.totals.expense.total)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {summaryData.account_breakdown && summaryData.account_breakdown.length > 0 && (
                  <div className="account-breakdown">
                    <h3>Account Breakdown</h3>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Account</th>
                          <th>Income</th>
                          <th>Expense</th>
                          <th>Net</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summaryData.account_breakdown.map((account) => (
                          <tr key={account.account_id}>
                            <td>{account.alias_name || account.bank_name}</td>
                            <td>{formatCurrency(account.income)}</td>
                            <td>{formatCurrency(account.expense)}</td>
                            <td className={account.net >= 0 ? 'positive' : 'negative'}>
                              {formatCurrency(account.net)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'trends' && (
          <div className="report-section">
            <div className="report-filters">
              <div className="filter-group">
                <label>Year</label>
                <input
                  type="number"
                  value={trendsYear}
                  onChange={(e) => setTrendsYear(parseInt(e.target.value))}
                  className="input"
                  min="2020"
                  max={new Date().getFullYear()}
                />
              </div>
              <div className="filter-group">
                <label>Months</label>
                <input
                  type="number"
                  value={trendsMonths}
                  onChange={(e) => setTrendsMonths(parseInt(e.target.value))}
                  className="input"
                  min="1"
                  max="24"
                />
              </div>
              <button className="btn btn-primary" onClick={loadMonthlyTrends}>
                Generate Trends
              </button>
            </div>

            {loading && <div className="loading">Loading...</div>}

            {trendsData && trendsData.monthly_data && (
              <div className="trends-results">
                <h3>Monthly Income vs Expense Trends</h3>
                <div className="trends-chart">
                  {trendsData.monthly_data.map((month) => {
                    const maxValue = Math.max(
                      ...trendsData.monthly_data.map((m) => Math.max(m.total_income, m.total_expense))
                    );
                    return (
                        <div key={month.month} className="trend-month">
                          <div className="trend-month-label">{format(parseISODate(month.month + '-01'), 'MMM yyyy')}</div>
                        <div className="trend-bars">
                          <div className="trend-bar-container">
                            <div
                              className="trend-bar income-bar"
                              style={{
                                height: `${calculatePercentage(month.total_income, maxValue)}%`
                              }}
                              title={`Income: ${formatCurrency(month.total_income)}`}
                            />
                            <span className="trend-value">{formatCurrency(month.total_income)}</span>
                          </div>
                          <div className="trend-bar-container">
                            <div
                              className="trend-bar expense-bar"
                              style={{
                                height: `${calculatePercentage(month.total_expense, maxValue)}%`
                              }}
                              title={`Expense: ${formatCurrency(month.total_expense)}`}
                            />
                            <span className="trend-value">{formatCurrency(month.total_expense)}</span>
                          </div>
                        </div>
                        <div className="trend-net">
                          Net: <span className={month.net >= 0 ? 'positive' : 'negative'}>
                            {formatCurrency(month.net)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="trends-summary">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Month</th>
                        <th>Income</th>
                        <th>Expense</th>
                        <th>Net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trendsData.monthly_data.map((month) => (
                        <tr key={month.month}>
                          <td>{format(parseISODate(month.month + '-01'), 'MMM yyyy')}</td>
                          <td>{formatCurrency(month.total_income)}</td>
                          <td>{formatCurrency(month.total_expense)}</td>
                          <td className={month.net >= 0 ? 'positive' : 'negative'}>
                            {formatCurrency(month.net)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="report-section">
            <div className="report-filters">
              <div className="filter-group">
                <label>Account</label>
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="input"
                >
                  <option value="all">All Accounts</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.alias_name || account.bank_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>Start Date</label>
                <input
                  type="date"
                  value={perfStartDate}
                  onChange={(e) => setPerfStartDate(e.target.value)}
                  className="input"
                />
              </div>
              <div className="filter-group">
                <label>End Date</label>
                <input
                  type="date"
                  value={perfEndDate}
                  onChange={(e) => setPerfEndDate(e.target.value)}
                  className="input"
                />
              </div>
              <button className="btn btn-primary" onClick={loadAccountPerformance}>
                Generate Report
              </button>
            </div>

            {loading && <div className="loading">Loading...</div>}

            {performanceData && performanceData.accounts && (
              <div className="performance-results">
                <h3>Account Performance</h3>
                <div className="performance-cards">
                  {performanceData.accounts.map((account) => (
                    <div key={account.account_id} className="performance-card">
                      <h4>{account.alias_name || account.bank_name}</h4>
                      <div className="performance-details">
                        <div className="performance-item">
                          <span className="label">Opening Balance:</span>
                          <span className="value">{formatCurrency(account.opening_balance)}</span>
                        </div>
                        <div className="performance-item">
                          <span className="label">Current Balance:</span>
                          <span className={`value ${account.current_balance >= 0 ? 'positive' : 'negative'}`}>
                            {formatCurrency(account.current_balance)}
                          </span>
                        </div>
                        <div className="performance-item">
                          <span className="label">Incoming:</span>
                          <span className="value positive">
                            {formatCurrency(account.incoming.total)} ({account.incoming.count} transactions)
                          </span>
                        </div>
                        <div className="performance-item">
                          <span className="label">Outgoing:</span>
                          <span className="value negative">
                            {formatCurrency(account.outgoing.total)} ({account.outgoing.count} transactions)
                          </span>
                        </div>
                        <div className="performance-item">
                          <span className="label">Net Flow:</span>
                          <span className={`value ${account.net_flow >= 0 ? 'positive' : 'negative'}`}>
                            {formatCurrency(account.net_flow)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
