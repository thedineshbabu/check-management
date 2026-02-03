/**
 * Cash Form Component
 * Form for creating and editing cash transactions
 * Handles both credit and debit cash transactions
 */

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { cashAPI } from '../services/api';
import logger from '../utils/logger';
import './CashForm.css';

/**
 * CashForm Component
 * @param {Date} defaultDate - Default date for new cash transactions
 * @param {Object} cash - Cash transaction object for editing (null for new)
 * @param {Function} onClose - Callback when form is closed
 * @param {Function} onSubmit - Callback when form is submitted
 */
const CashForm = ({ defaultDate, cash, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    type: 'credit',
    amount: '',
    date: format(defaultDate || new Date(), 'yyyy-MM-dd'),
    description: ''
  });

  /**
   * Initialize form data when editing
   */
  useEffect(() => {
    if (cash) {
      setFormData({
        type: cash.type,
        amount: cash.amount.toString(),
        date: cash.date,
        description: cash.description
      });
    }
  }, [cash]);

  /**
   * Handle form submission
   * Creates or updates cash transaction
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount)
      };

      if (cash) {
        logger.info(`Updating cash transaction: ${cash.id}`);
        await cashAPI.update(cash.id, submitData);
      } else {
        logger.info('Creating new cash transaction');
        await cashAPI.create(submitData);
      }

      onSubmit();
    } catch (error) {
      logger.error('Error saving cash transaction:', error);
      alert(error.response?.data?.error || 'Failed to save cash transaction');
    }
  };

  return (
    <div className="cash-form-modal">
      <div className="cash-form-card">
        <div className="cash-form-header">
          <h2>{cash ? 'Edit Cash Transaction' : 'New Cash Transaction'}</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="cash-form">
          <div className="form-group">
            <label>Type</label>
            <div className="type-toggle">
              <button
                type="button"
                className={`type-btn ${formData.type === 'credit' ? 'active credit' : ''}`}
                onClick={() => setFormData({ ...formData, type: 'credit' })}
              >
                Credit
              </button>
              <button
                type="button"
                className={`type-btn ${formData.type === 'debit' ? 'active debit' : ''}`}
                onClick={() => setFormData({ ...formData, type: 'debit' })}
              >
                Debit
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              placeholder={formData.type === 'credit' ? 'What is the source of cash?' : 'What is the cash being used for?'}
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
              {cash ? 'Update Transaction' : 'Create Transaction'}
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

export default CashForm;
