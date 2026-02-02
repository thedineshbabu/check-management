/**
 * Registration Code Management Component
 * Admin interface for managing registration codes
 * Allows generating, viewing, deactivating, and deleting registration codes
 */

import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import logger from '../utils/logger';
import './RegistrationCodeManagement.css';

/**
 * Registration Code Management Component
 * Provides registration code management functionality for admins
 */
const RegistrationCodeManagement = () => {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'used', 'expired'
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [expiryHours, setExpiryHours] = useState(24);
  const [generatedCode, setGeneratedCode] = useState(null);

  /**
   * Load registration codes from API
   * Fetches all registration codes based on current filter
   */
  const loadCodes = async () => {
    try {
      setLoading(true);
      setError('');
      logger.info('Loading registration codes for admin management');

      const filters = {};
      if (filter === 'active') {
        filters.isActive = true;
        filters.used = false;
      } else if (filter === 'used') {
        filters.used = true;
      }

      const response = await adminAPI.getRegistrationCodes(filters);
      setCodes(response.codes);
      logger.info(`Loaded ${response.codes.length} registration codes`);
    } catch (err) {
      logger.error('Error loading registration codes:', err);
      setError('Failed to load registration codes');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Generate new registration code
   * Creates a new registration code with specified expiry time
   */
  const handleGenerateCode = async () => {
    try {
      setError('');
      logger.info(`Generating registration code with ${expiryHours} hours expiry`);

      const response = await adminAPI.generateRegistrationCode(expiryHours);
      setGeneratedCode(response);
      logger.info('Registration code generated successfully');
      
      // Reload codes after generation
      setTimeout(() => {
        loadCodes();
        setShowGenerateModal(false);
        setGeneratedCode(null);
      }, 5000);
    } catch (err) {
      logger.error('Error generating registration code:', err);
      setError(err.response?.data?.error || 'Failed to generate registration code');
    }
  };

  /**
   * Deactivate registration code
   * Deactivates a code without deleting it
   * @param {string} codeId - Registration code ID
   */
  const handleDeactivateCode = async (codeId) => {
    try {
      setError('');
      logger.info(`Deactivating registration code: ${codeId}`);

      await adminAPI.deactivateCode(codeId);
      logger.info('Registration code deactivated successfully');
      loadCodes();
    } catch (err) {
      logger.error('Error deactivating registration code:', err);
      setError(err.response?.data?.error || 'Failed to deactivate registration code');
    }
  };

  /**
   * Delete registration code
   * Permanently removes a registration code
   * @param {string} codeId - Registration code ID
   */
  const handleDeleteCode = async (codeId) => {
    if (!window.confirm('Are you sure you want to delete this registration code? This action cannot be undone.')) {
      return;
    }

    try {
      setError('');
      logger.info(`Deleting registration code: ${codeId}`);

      await adminAPI.deleteCode(codeId);
      logger.info('Registration code deleted successfully');
      loadCodes();
    } catch (err) {
      logger.error('Error deleting registration code:', err);
      setError(err.response?.data?.error || 'Failed to delete registration code');
    }
  };

  /**
   * Check if code is expired
   * @param {string} expiryTime - Expiry timestamp
   * @returns {boolean} True if code is expired
   */
  const isExpired = (expiryTime) => {
    return new Date() > new Date(expiryTime);
  };

  /**
   * Format date for display
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted date
   */
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  /**
   * Get code status
   * Returns status string for a registration code
   * @param {Object} code - Registration code object
   * @returns {string} Status string
   */
  const getCodeStatus = (code) => {
    if (code.used_by) {
      return 'used';
    }
    if (!code.is_active) {
      return 'inactive';
    }
    if (isExpired(code.expiry_time)) {
      return 'expired';
    }
    return 'active';
  };

  /**
   * Load codes when component mounts or filter changes
   */
  useEffect(() => {
    loadCodes();
  }, [filter]);

  // Filter codes based on selected filter
  const filteredCodes = codes.filter(code => {
    if (filter === 'expired') {
      return !code.used_by && isExpired(code.expiry_time);
    }
    return true;
  });

  return (
    <div className="code-management">
      <div className="code-management-header">
        <h2>Registration Code Management</h2>
        <button className="btn btn-primary" onClick={() => setShowGenerateModal(true)}>
          Generate New Code
        </button>
      </div>

      <div className="filter-buttons">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Codes
        </button>
        <button
          className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
          onClick={() => setFilter('active')}
        >
          Active
        </button>
        <button
          className={`filter-btn ${filter === 'used' ? 'active' : ''}`}
          onClick={() => setFilter('used')}
        >
          Used
        </button>
        <button
          className={`filter-btn ${filter === 'expired' ? 'active' : ''}`}
          onClick={() => setFilter('expired')}
        >
          Expired
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading registration codes...</div>
      ) : (
        <div className="codes-table-container">
          <table className="codes-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Status</th>
                <th>Expires</th>
                <th>Created By</th>
                <th>Used By</th>
                <th>Used At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCodes.length === 0 ? (
                <tr>
                  <td colSpan="7" className="no-codes">
                    No registration codes found
                  </td>
                </tr>
              ) : (
                filteredCodes.map((code) => {
                  const status = getCodeStatus(code);
                  return (
                    <tr key={code.id}>
                      <td>
                        <code className="code-display">{code.code}</code>
                      </td>
                      <td>
                        <span className={`status-badge ${status}`}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      </td>
                      <td>{formatDate(code.expiry_time)}</td>
                      <td>{code.creator_email || 'N/A'}</td>
                      <td>{code.user_email || '-'}</td>
                      <td>{code.used_at ? formatDate(code.used_at) : '-'}</td>
                      <td>
                        <div className="action-buttons">
                          {status === 'active' && (
                            <button
                              className="btn btn-sm btn-warning"
                              onClick={() => handleDeactivateCode(code.id)}
                            >
                              Deactivate
                            </button>
                          )}
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeleteCode(code.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Generate Code Modal */}
      {showGenerateModal && (
        <div className="modal-overlay" onClick={() => setShowGenerateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Generate Registration Code</h3>
            {generatedCode ? (
              <div className="success-message">
                <p>Registration code generated successfully!</p>
                <div className="code-display-large">
                  <strong>{generatedCode.code}</strong>
                </div>
                <p className="code-info">
                  Expires: {formatDate(generatedCode.expiryTime)}
                </p>
                <p className="code-note">
                  Share this code with the user offline. They will need it to register.
                </p>
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label>Expiry Time (Hours)</label>
                  <input
                    type="number"
                    min="1"
                    max="8760"
                    value={expiryHours}
                    onChange={(e) => setExpiryHours(parseInt(e.target.value) || 24)}
                    className="input"
                  />
                  <small>Code will expire after the specified number of hours</small>
                </div>
                <div className="modal-actions">
                  <button className="btn btn-primary" onClick={handleGenerateCode}>
                    Generate Code
                  </button>
                  <button className="btn btn-secondary" onClick={() => setShowGenerateModal(false)}>
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrationCodeManagement;

