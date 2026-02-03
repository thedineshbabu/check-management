/**
 * Recurring Transactions Component
 * Manages recurring transaction templates
 * Allows creation, editing, and deletion of recurring checks and cash transactions
 */

import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { recurringTransactionAPI, accountAPI } from '../services/api';
import logger from '../utils/logger';
import ThemeToggle from './ThemeToggle';
import './RecurringTransactions.css';

/**
 * RecurringTransactions Component
 * Main component for managing recurring transactions
 */
const RecurringTransactions = () => {
  const navigate = useNavigate();
  const [recurringTransactions, setRecurringTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [filter, setFilter] = useState('all'); // all, active, inactive

  /**
   * Load recurring transactions and accounts
   */
  useEffect(() => {
    loadData();
  }, [filter]);

  /**
   * Load recurring transactions and accounts
   */
  const loadData = async () => {
    try {
      setLoading(true);
      logger.info('Loading recurring transactions');
      
      const [transactionsData, accountsData] = await Promise.all([
        recurringTransactionAPI.getAll({ isActive: filter === 'all' ? undefined : filter === 'active' }),
        accountAPI.getAll()
      ]);
      
      setRecurringTransactions(transactionsData);
      setAccounts(accountsData);
      logger.info(`Loaded ${transactionsData.length} recurring transactions`);
    } catch (error) {
      logger.error('Error loading recurring transactions:', error);
      alert('Failed to load recurring transactions');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle delete recurring transaction
   */
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this recurring transaction?')) {
      return;
    }
    
    try {
      await recurringTransactionAPI.delete(id);
      logger.info(`Deleted recurring transaction: ${id}`);
      loadData();
    } catch (error) {
      logger.error('Error deleting recurring transaction:', error);
      alert('Failed to delete recurring transaction');
    }
  };

  /**
   * Handle toggle active status
   */
  const handleToggleActive = async (transaction) => {
    try {
      await recurringTransactionAPI.update(transaction.id, { is_active: !transaction.is_active });
      logger.info(`Toggled active status for recurring transaction: ${transaction.id}`);
      loadData();
    } catch (error) {
      logger.error('Error updating recurring transaction:', error);
      alert('Failed to update recurring transaction');
    }
  };

  /**
   * Handle manual trigger
   */
  const handleTrigger = async (transaction) => {
    try {
      await recurringTransactionAPI.trigger(transaction.id);
      logger.info(`Triggered recurring transaction: ${transaction.id}`);
      alert('Transaction created successfully!');
      loadData();
    } catch (error) {
      logger.error('Error triggering recurring transaction:', error);
      alert(error.response?.data?.error || 'Failed to trigger recurring transaction');
    }
  };

  /**
   * Format frequency display
   */
  const formatFrequency = (frequency, dayOfMonth, dayOfWeek) => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    switch (frequency) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        return dayOfWeek !== null ? `Weekly on ${dayNames[dayOfWeek]}` : 'Weekly';
      case 'monthly':
        return dayOfMonth !== null ? `Monthly on day ${dayOfMonth}` : 'Monthly';
      case 'yearly':
        return dayOfMonth !== null ? `Yearly on day ${dayOfMonth}` : 'Yearly';
      default:
        return frequency;
    }
  };

  if (loading) {
    return <div className="recurring-transactions-loading">Loading...</div>;
  }

  return (
    <div className="recurring-transactions">
      <div className="recurring-transactions-header">
        <h1>Recurring Transactions</h1>
        <div className="recurring-transactions-actions">
          <ThemeToggle />
          <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
            Dashboard
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/reports')}>
            Reports & Analytics
          </button>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingTransaction(null);
              setShowForm(true);
            }}
          >
            + New Recurring Transaction
          </button>
        </div>
      </div>

      <div className="recurring-transactions-list">
        {recurringTransactions.length === 0 ? (
          <div className="empty-state">
            <p>No recurring transactions found</p>
            <button
              className="btn btn-primary"
              onClick={() => {
                setEditingTransaction(null);
                setShowForm(true);
              }}
            >
              Create Your First Recurring Transaction
            </button>
          </div>
        ) : (
          recurringTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className={`recurring-transaction-card ${!transaction.is_active ? 'inactive' : ''}`}
            >
              <div className="recurring-transaction-header">
                <div className="recurring-transaction-title">
                  <h3>
                    {transaction.transaction_type === 'check'
                      ? `${transaction.check_type === 'incoming' ? 'Incoming' : 'Outgoing'} Check`
                      : `${transaction.cash_type === 'credit' ? 'Cash Credit' : 'Cash Debit'}`}
                  </h3>
                  <span className={`status-badge ${transaction.is_active ? 'active' : 'inactive'}`}>
                    {transaction.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="recurring-transaction-actions">
                  {transaction.is_active && (
                    <button
                      className="btn btn-small btn-secondary"
                      onClick={() => handleTrigger(transaction)}
                      title="Create transaction now"
                    >
                      Trigger Now
                    </button>
                  )}
                  <button
                    className="btn btn-small btn-secondary"
                    onClick={() => {
                      setEditingTransaction(transaction);
                      setShowForm(true);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-small btn-danger"
                    onClick={() => handleDelete(transaction.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="recurring-transaction-details">
                <div className="detail-row">
                  <span className="detail-label">Amount:</span>
                  <span className="detail-value">${parseFloat(transaction.amount).toFixed(2)}</span>
                </div>
                {transaction.transaction_type === 'check' && (
                  <>
                    <div className="detail-row">
                      <span className="detail-label">Account:</span>
                      <span className="detail-value">
                        {transaction.alias_name || transaction.bank_name} ({transaction.account_number})
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Payee/Payer:</span>
                      <span className="detail-value">{transaction.payee_payer_name}</span>
                    </div>
                  </>
                )}
                {transaction.transaction_type === 'cash' && (
                  <div className="detail-row">
                    <span className="detail-label">Description:</span>
                    <span className="detail-value">{transaction.description}</span>
                  </div>
                )}
                <div className="detail-row">
                  <span className="detail-label">Frequency:</span>
                  <span className="detail-value">
                    {formatFrequency(transaction.frequency, transaction.day_of_month, transaction.day_of_week)}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Start Date:</span>
                  <span className="detail-value">{format(parseISO(transaction.start_date), 'MMM dd, yyyy')}</span>
                </div>
                {transaction.end_date && (
                  <div className="detail-row">
                    <span className="detail-label">End Date:</span>
                    <span className="detail-value">{format(parseISO(transaction.end_date), 'MMM dd, yyyy')}</span>
                  </div>
                )}
                <div className="detail-row">
                  <span className="detail-label">Next Due:</span>
                  <span className="detail-value">
                    {transaction.next_due_date
                      ? format(parseISO(transaction.next_due_date), 'MMM dd, yyyy')
                      : 'N/A'}
                  </span>
                </div>
                {transaction.last_created_date && (
                  <div className="detail-row">
                    <span className="detail-label">Last Created:</span>
                    <span className="detail-value">
                      {format(parseISO(transaction.last_created_date), 'MMM dd, yyyy')}
                    </span>
                  </div>
                )}
              </div>

              <div className="recurring-transaction-footer">
                <button
                  className="btn btn-small"
                  onClick={() => handleToggleActive(transaction)}
                >
                  {transaction.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showForm && (
        <RecurringTransactionForm
          accounts={accounts}
          transaction={editingTransaction}
          onClose={() => {
            setShowForm(false);
            setEditingTransaction(null);
          }}
          onSubmit={() => {
            setShowForm(false);
            setEditingTransaction(null);
            loadData();
          }}
        />
      )}
    </div>
  );
};

/**
 * Recurring Transaction Form Component
 * Form for creating and editing recurring transactions
 */
const RecurringTransactionForm = ({ accounts, transaction, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    transaction_type: 'check',
    bank_account_id: accounts.length > 0 ? accounts[0].id : '',
    check_type: 'incoming',
    cash_type: 'credit',
    amount: '',
    payee_payer_name: '',
    description: '',
    frequency: 'monthly',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: '',
    day_of_month: '',
    day_of_week: ''
  });

  /**
   * Initialize form data when editing
   */
  useEffect(() => {
    if (transaction) {
      setFormData({
        transaction_type: transaction.transaction_type,
        bank_account_id: transaction.bank_account_id || '',
        check_type: transaction.check_type || 'incoming',
        cash_type: transaction.cash_type || 'credit',
        amount: transaction.amount.toString(),
        payee_payer_name: transaction.payee_payer_name || '',
        description: transaction.description || '',
        frequency: transaction.frequency,
        start_date: transaction.start_date,
        end_date: transaction.end_date || '',
        day_of_month: transaction.day_of_month?.toString() || '',
        day_of_week: transaction.day_of_week?.toString() || '',
        is_active: transaction.is_active
      });
    }
  }, [transaction]);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount),
        bank_account_id: formData.transaction_type === 'check' ? formData.bank_account_id : null,
        check_type: formData.transaction_type === 'check' ? formData.check_type : null,
        cash_type: formData.transaction_type === 'cash' ? formData.cash_type : null,
        payee_payer_name: formData.transaction_type === 'check' ? formData.payee_payer_name : null,
        description: formData.transaction_type === 'cash' ? formData.description : null,
        end_date: formData.end_date || null,
        day_of_month: formData.day_of_month ? parseInt(formData.day_of_month) : null,
        day_of_week: formData.day_of_week !== '' ? parseInt(formData.day_of_week) : null
      };

      if (transaction) {
        logger.info(`Updating recurring transaction: ${transaction.id}`);
        await recurringTransactionAPI.update(transaction.id, submitData);
      } else {
        logger.info('Creating new recurring transaction');
        await recurringTransactionAPI.create(submitData);
      }

      onSubmit();
    } catch (error) {
      logger.error('Error saving recurring transaction:', error);
      alert(error.response?.data?.error || 'Failed to save recurring transaction');
    }
  };

  return (
    <div className="recurring-transaction-form-modal">
      <div className="recurring-transaction-form-card">
        <div className="form-header">
          <h2>{transaction ? 'Edit Recurring Transaction' : 'New Recurring Transaction'}</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="recurring-transaction-form">
          <div className="form-group">
            <label>Transaction Type</label>
            <select
              value={formData.transaction_type}
              onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value })}
              required
              className="input"
            >
              <option value="check">Check</option>
              <option value="cash">Cash</option>
            </select>
          </div>

          {formData.transaction_type === 'check' && (
            <>
              <div className="form-group">
                <label>Account</label>
                <select
                  value={formData.bank_account_id}
                  onChange={(e) => setFormData({ ...formData, bank_account_id: e.target.value })}
                  required
                  className="input"
                >
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.alias_name || account.bank_name} ({account.account_number})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Check Type</label>
                <select
                  value={formData.check_type}
                  onChange={(e) => setFormData({ ...formData, check_type: e.target.value })}
                  required
                  className="input"
                >
                  <option value="incoming">Incoming</option>
                  <option value="outgoing">Outgoing</option>
                </select>
              </div>

              <div className="form-group">
                <label>Payee/Payer Name</label>
                <input
                  type="text"
                  value={formData.payee_payer_name}
                  onChange={(e) => setFormData({ ...formData, payee_payer_name: e.target.value })}
                  required
                  className="input"
                />
              </div>
            </>
          )}

          {formData.transaction_type === 'cash' && (
            <>
              <div className="form-group">
                <label>Cash Type</label>
                <select
                  value={formData.cash_type}
                  onChange={(e) => setFormData({ ...formData, cash_type: e.target.value })}
                  required
                  className="input"
                >
                  <option value="credit">Credit</option>
                  <option value="debit">Debit</option>
                </select>
              </div>

              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  className="input"
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Amount</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              className="input"
            />
          </div>

          <div className="form-group">
            <label>Frequency</label>
            <select
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
              required
              className="input"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          {formData.frequency === 'weekly' && (
            <div className="form-group">
              <label>Day of Week</label>
              <select
                value={formData.day_of_week}
                onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
                className="input"
              >
                <option value="">Any day</option>
                <option value="0">Sunday</option>
                <option value="1">Monday</option>
                <option value="2">Tuesday</option>
                <option value="3">Wednesday</option>
                <option value="4">Thursday</option>
                <option value="5">Friday</option>
                <option value="6">Saturday</option>
              </select>
            </div>
          )}

          {(formData.frequency === 'monthly' || formData.frequency === 'yearly') && (
            <div className="form-group">
              <label>Day of Month (1-31)</label>
              <input
                type="number"
                min="1"
                max="31"
                value={formData.day_of_month}
                onChange={(e) => setFormData({ ...formData, day_of_month: e.target.value })}
                className="input"
                placeholder="Optional"
              />
            </div>
          )}

          <div className="form-group">
            <label>Start Date</label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              required
              className="input"
            />
          </div>

          <div className="form-group">
            <label>End Date (Optional)</label>
            <input
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              className="input"
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {transaction ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecurringTransactions;
