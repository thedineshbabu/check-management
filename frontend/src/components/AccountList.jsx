/**
 * Account List Component
 * Displays and manages bank accounts
 * Shows account balances and low balance warnings
 */

import { useState } from 'react';
import { accountAPI } from '../services/api';
import logger from '../utils/logger';
import './AccountList.css';

/**
 * AccountList Component
 * @param {Array} accounts - Array of account objects
 * @param {Object} balanceData - Balance data for accounts
 * @param {Function} onRefresh - Callback to refresh data
 */
const AccountList = ({ accounts, balanceData, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({
    bank_name: '',
    account_number: '',
    alias_name: '',
    low_balance_threshold: 0,
    opening_balance: 0
  });

  /**
   * Handle form submission
   * Creates or updates account
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAccount) {
        logger.info(`Updating account: ${editingAccount.id}`);
        await accountAPI.update(editingAccount.id, formData);
      } else {
        logger.info('Creating new account');
        await accountAPI.create(formData);
      }
      
      setShowForm(false);
      setEditingAccount(null);
      setFormData({
        bank_name: '',
        account_number: '',
        alias_name: '',
        low_balance_threshold: 0,
        opening_balance: 0
      });
      onRefresh();
    } catch (error) {
      logger.error('Error saving account:', error);
      alert(error.response?.data?.error || 'Failed to save account');
    }
  };

  /**
   * Handle account edit
   * Opens form with account data
   * @param {Object} account - Account to edit
   */
  const handleEdit = (account) => {
    setEditingAccount(account);
    setFormData({
      bank_name: account.bank_name,
      account_number: account.account_number,
      alias_name: account.alias_name || '',
      low_balance_threshold: account.low_balance_threshold || 0,
      opening_balance: account.opening_balance || 0
    });
    setShowForm(true);
  };

  /**
   * Handle account deletion
   * @param {string} accountId - Account ID to delete
   */
  const handleDelete = async (accountId) => {
    if (!window.confirm('Are you sure you want to delete this account?')) {
      return;
    }

    try {
      logger.info(`Deleting account: ${accountId}`);
      await accountAPI.delete(accountId);
      onRefresh();
    } catch (error) {
      logger.error('Error deleting account:', error);
      alert('Failed to delete account');
    }
  };

  /**
   * Get balance for account
   * @param {string} accountId - Account ID
   * @returns {number} Account balance
   */
  const getAccountBalance = (accountId) => {
    if (!balanceData) return 0;
    const account = balanceData.account_balances.find(acc => acc.account_id === accountId);
    return account ? account.balance : 0;
  };

  /**
   * Check if account has low balance
   * @param {Object} account - Account object
   * @returns {boolean} True if balance is low
   */
  const isLowBalance = (account) => {
    const balance = getAccountBalance(account.id);
    return balance < (account.low_balance_threshold || 0);
  };

  /**
   * Format currency amount
   * @param {number} amount - Amount to format
   * @returns {string} Formatted currency string
   */
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="account-list">
      <div className="account-list-header">
        <h2>Bank Accounts</h2>
        <button 
          className="btn btn-primary btn-sm"
          onClick={() => {
            setEditingAccount(null);
            setFormData({
              bank_name: '',
              account_number: '',
              alias_name: '',
              low_balance_threshold: 0,
              opening_balance: 0
            });
            setShowForm(true);
          }}
        >
          + Add
        </button>
      </div>

      {showForm && (
        <div className="account-form-modal">
          <div className="account-form-card">
            <h3>{editingAccount ? 'Edit Account' : 'New Account'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Bank Name</label>
                <input
                  type="text"
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  required
                  className="input"
                />
              </div>
              <div className="form-group">
                <label>Account Number</label>
                <input
                  type="text"
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  required
                  className="input"
                />
              </div>
              <div className="form-group">
                <label>Alias Name (Optional)</label>
                <input
                  type="text"
                  value={formData.alias_name}
                  onChange={(e) => setFormData({ ...formData, alias_name: e.target.value })}
                  className="input"
                />
              </div>
              <div className="form-group">
                <label>Opening Balance</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.opening_balance}
                  onChange={(e) => setFormData({ ...formData, opening_balance: parseFloat(e.target.value) || 0 })}
                  className="input"
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label>Low Balance Threshold</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.low_balance_threshold}
                  onChange={(e) => setFormData({ ...formData, low_balance_threshold: parseFloat(e.target.value) || 0 })}
                  className="input"
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {editingAccount ? 'Update' : 'Create'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowForm(false);
                    setEditingAccount(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="account-items">
        {accounts.length === 0 ? (
          <div className="no-accounts">
            <p>No accounts yet. Add your first account!</p>
          </div>
        ) : (
          accounts.map((account) => {
            const balance = getAccountBalance(account.id);
            const lowBalance = isLowBalance(account);

            return (
              <div 
                key={account.id} 
                className={`account-item ${lowBalance ? 'low-balance' : ''}`}
              >
                <div className="account-item-header">
                  <div className="account-item-info">
                    <div className="account-item-name">
                      {account.alias_name || account.bank_name}
                    </div>
                    <div className="account-item-number">{account.account_number}</div>
                  </div>
                  {lowBalance && <span className="warning-icon">⚠️</span>}
                </div>
                <div className="account-item-balance">
                  {formatCurrency(balance)}
                </div>
                <div className="account-item-actions">
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleEdit(account)}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(account.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AccountList;

