/**
 * Balance Card Component
 * Displays overall balance and per-account balances
 * Shows low balance warnings
 */

import { format } from 'date-fns';
import logger from '../utils/logger';
import './BalanceCard.css';

/**
 * BalanceCard Component
 * @param {Object} balanceData - Balance data from API
 * @param {Date} selectedDate - Currently selected date
 */
const BalanceCard = ({ balanceData, selectedDate }) => {
  if (!balanceData) {
    return (
      <div className="balance-card">
        <div>Loading balance...</div>
      </div>
    );
  }

  const { overall_balance, account_balances } = balanceData;
  const hasLowBalance = account_balances.some(acc => acc.is_low_balance);

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
    <div className="balance-card">
      <div className="balance-header">
        <h2>Balance</h2>
        <div className="balance-date">
          {format(selectedDate, 'MMMM d, yyyy')}
        </div>
      </div>

      <div className="balance-overall">
        <div className="balance-label">Overall Balance</div>
        <div className={`balance-amount ${overall_balance < 0 ? 'negative' : ''}`}>
          {formatCurrency(overall_balance)}
        </div>
      </div>

      {hasLowBalance && (
        <div className="balance-warning">
          <span>⚠️</span>
          <span>Low balance detected in one or more accounts</span>
        </div>
      )}

      <div className="balance-accounts">
        <h3>Account Balances</h3>
        <div className="account-balance-list">
          {account_balances.map((account) => (
            <div 
              key={account.account_id} 
              className={`account-balance-item ${account.is_low_balance ? 'low-balance' : ''}`}
            >
              <div className="account-info">
                <div className="account-name">
                  {account.alias_name || account.bank_name}
                </div>
                <div className="account-number">{account.account_number}</div>
              </div>
              <div className={`account-balance ${account.balance < 0 ? 'negative' : ''}`}>
                {formatCurrency(account.balance)}
                {account.is_low_balance && (
                  <span className="low-balance-indicator">⚠️</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BalanceCard;

