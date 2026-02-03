/**
 * Cash List Component
 * Displays list of cash transactions for selected date
 * Shows credit and debit cash transactions separately
 */

import { format } from 'date-fns';
import { cashAPI } from '../services/api';
import logger from '../utils/logger';
import './CashList.css';

/**
 * CashList Component
 * @param {Object} cash - Cash transactions data from dashboard
 * @param {Date} selectedDate - Currently selected date
 * @param {Function} onEdit - Callback when cash transaction is edited
 * @param {Function} onDelete - Callback when cash transaction is deleted
 */
const CashList = ({ cash, selectedDate, onEdit, onDelete }) => {
  if (!cash) {
    return (
      <div className="cash-list">
        <div>Loading cash transactions...</div>
      </div>
    );
  }

  /**
   * Handle cash transaction deletion
   * Confirms deletion and calls API
   * @param {string} cashId - Cash transaction ID to delete
   */
  const handleDelete = async (cashId) => {
    if (!window.confirm('Are you sure you want to delete this cash transaction?')) {
      return;
    }

    try {
      logger.info(`Deleting cash transaction: ${cashId}`);
      await cashAPI.delete(cashId);
      logger.info('Cash transaction deleted successfully');
      onDelete();
    } catch (error) {
      logger.error('Error deleting cash transaction:', error);
      alert('Failed to delete cash transaction');
    }
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

  const { credit, debit, total } = cash;
  const hasCash = total > 0;

  return (
    <div className="cash-list">
      <div className="cash-list-header">
        <h2>Cash Transactions for {format(selectedDate, 'MMMM d, yyyy')}</h2>
        {hasCash && (
          <div className="cash-summary">
            <span className="summary-item credit">
              Credit: {formatCurrency(
                credit.reduce((sum, transaction) => sum + parseFloat(transaction.amount), 0)
              )}
            </span>
            <span className="summary-item debit">
              Debit: {formatCurrency(
                debit.reduce((sum, transaction) => sum + parseFloat(transaction.amount), 0)
              )}
            </span>
          </div>
        )}
      </div>

      {!hasCash ? (
        <div className="no-cash">
          <p>No cash transactions for this date</p>
        </div>
      ) : (
        <div className="cash-sections">
          {credit.length > 0 && (
            <div className="cash-section">
              <h3 className="section-title credit">
                Credit Transactions ({credit.length})
              </h3>
              <div className="cash-items">
                {credit.map((transaction) => (
                  <div key={transaction.id} className="cash-item credit">
                    <div className="cash-info">
                      <div className="cash-amount">{formatCurrency(transaction.amount)}</div>
                      <div className="cash-details">
                        <div className="cash-description">{transaction.description}</div>
                      </div>
                    </div>
                    <div className="cash-actions">
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => onEdit(transaction)}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(transaction.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {debit.length > 0 && (
            <div className="cash-section">
              <h3 className="section-title debit">
                Debit Transactions ({debit.length})
              </h3>
              <div className="cash-items">
                {debit.map((transaction) => (
                  <div key={transaction.id} className="cash-item debit">
                    <div className="cash-info">
                      <div className="cash-amount">{formatCurrency(transaction.amount)}</div>
                      <div className="cash-details">
                        <div className="cash-description">{transaction.description}</div>
                      </div>
                    </div>
                    <div className="cash-actions">
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => onEdit(transaction)}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(transaction.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CashList;
