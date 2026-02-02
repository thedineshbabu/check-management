/**
 * Check Form Component
 * Form for creating and editing checks
 * Handles both incoming and outgoing checks
 */

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { checkAPI } from '../services/api';
import logger from '../utils/logger';
import './CheckForm.css';

/**
 * CheckForm Component
 * @param {Array} accounts - Array of account objects
 * @param {Date} defaultDate - Default date for new checks
 * @param {Object} check - Check object for editing (null for new)
 * @param {Function} onClose - Callback when form is closed
 * @param {Function} onSubmit - Callback when form is submitted
 */
const CheckForm = ({ accounts, defaultDate, check, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    bank_account_id: accounts.length > 0 ? accounts[0].id : '',
    type: 'incoming',
    amount: '',
    date: format(defaultDate || new Date(), 'yyyy-MM-dd'),
    payee_payer_name: ''
  });

  /**
   * Initialize form data when editing
   */
  useEffect(() => {
    if (check) {
      setFormData({
        bank_account_id: check.bank_account_id,
        type: check.type,
        amount: check.amount.toString(),
        date: check.date,
        payee_payer_name: check.payee_payer_name
      });
    }
  }, [check]);

  /**
   * Handle form submission
   * Creates or updates check
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount)
      };

      if (check) {
        logger.info(`Updating check: ${check.id}`);
        await checkAPI.update(check.id, submitData);
      } else {
        logger.info('Creating new check');
        await checkAPI.create(submitData);
      }

      onSubmit();
    } catch (error) {
      logger.error('Error saving check:', error);
      alert(error.response?.data?.error || 'Failed to save check');
    }
  };

  return (
    <div className="check-form-modal">
      <div className="check-form-card">
        <div className="check-form-header">
          <h2>{check ? 'Edit Check' : 'New Check'}</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="check-form">
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
            <label>Type</label>
            <div className="type-toggle">
              <button
                type="button"
                className={`type-btn ${formData.type === 'incoming' ? 'active incoming' : ''}`}
                onClick={() => setFormData({ ...formData, type: 'incoming' })}
              >
                Incoming
              </button>
              <button
                type="button"
                className={`type-btn ${formData.type === 'outgoing' ? 'active outgoing' : ''}`}
                onClick={() => setFormData({ ...formData, type: 'outgoing' })}
              >
                Outgoing
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>{formData.type === 'incoming' ? 'Payer Name' : 'Payee Name'}</label>
            <input
              type="text"
              value={formData.payee_payer_name}
              onChange={(e) => setFormData({ ...formData, payee_payer_name: e.target.value })}
              required
              placeholder={formData.type === 'incoming' ? 'Who is paying?' : 'Who are you paying?'}
              className="input"
            />
          </div>

          <div className="form-group">
            <label>Amount</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              placeholder="0.00"
              className="input"
            />
          </div>

          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              className="input"
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {check ? 'Update Check' : 'Create Check'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckForm;

