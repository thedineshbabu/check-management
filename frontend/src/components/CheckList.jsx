/**
 * Check List Component
 * Displays list of checks for selected date
 * Shows incoming and outgoing checks separately
 */

import { format } from 'date-fns';
import { checkAPI } from '../services/api';
import logger from '../utils/logger';
import './CheckList.css';

/**
 * CheckList Component
 * @param {Object} checks - Checks data from dashboard
 * @param {Date} selectedDate - Currently selected date
 * @param {Function} onEdit - Callback when check is edited
 * @param {Function} onDelete - Callback when check is deleted
 */
const CheckList = ({ checks, selectedDate, onEdit, onDelete }) => {
  if (!checks) {
    return (
      <div className="check-list">
        <div>Loading checks...</div>
      </div>
    );
  }

  /**
   * Handle check deletion
   * Confirms deletion and calls API
   * @param {string} checkId - Check ID to delete
   */
  const handleDelete = async (checkId) => {
    if (!window.confirm('Are you sure you want to delete this check?')) {
      return;
    }

    try {
      logger.info(`Deleting check: ${checkId}`);
      await checkAPI.delete(checkId);
      logger.info('Check deleted successfully');
      onDelete();
    } catch (error) {
      logger.error('Error deleting check:', error);
      alert('Failed to delete check');
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

  const { incoming, outgoing, total } = checks;
  const hasChecks = total > 0;

  return (
    <div className="check-list">
      <div className="check-list-header">
        <h2>Checks for {format(selectedDate, 'MMMM d, yyyy')}</h2>
        {hasChecks && (
          <div className="check-summary">
            <span className="summary-item incoming">
              Incoming: {formatCurrency(
                incoming.reduce((sum, check) => sum + parseFloat(check.amount), 0)
              )}
            </span>
            <span className="summary-item outgoing">
              Outgoing: {formatCurrency(
                outgoing.reduce((sum, check) => sum + parseFloat(check.amount), 0)
              )}
            </span>
          </div>
        )}
      </div>

      {!hasChecks ? (
        <div className="no-checks">
          <p>No checks for this date</p>
        </div>
      ) : (
        <div className="check-sections">
          {incoming.length > 0 && (
            <div className="check-section">
              <h3 className="section-title incoming">
                Incoming Checks ({incoming.length})
              </h3>
              <div className="check-items">
                {incoming.map((check) => (
                  <div key={check.id} className="check-item incoming">
                    <div className="check-info">
                      <div className="check-amount">{formatCurrency(check.amount)}</div>
                      <div className="check-details">
                        <div className="check-payer">{check.payee_payer_name}</div>
                        <div className="check-account">
                          {check.alias_name || check.bank_name} • {check.account_number}
                        </div>
                      </div>
                    </div>
                    <div className="check-actions">
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => onEdit(check)}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(check.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {outgoing.length > 0 && (
            <div className="check-section">
              <h3 className="section-title outgoing">
                Outgoing Checks ({outgoing.length})
              </h3>
              <div className="check-items">
                {outgoing.map((check) => (
                  <div key={check.id} className="check-item outgoing">
                    <div className="check-info">
                      <div className="check-amount">{formatCurrency(check.amount)}</div>
                      <div className="check-details">
                        <div className="check-payer">{check.payee_payer_name}</div>
                        <div className="check-account">
                          {check.alias_name || check.bank_name} • {check.account_number}
                        </div>
                      </div>
                    </div>
                    <div className="check-actions">
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => onEdit(check)}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(check.id)}
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

export default CheckList;

