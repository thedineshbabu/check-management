/**
 * API Service Layer
 * Centralized API communication using Axios
 * Handles authentication tokens and error responses
 */

import axios from 'axios';
import logger from '../utils/logger';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Create axios instance with default configuration
 * Sets base URL and default headers
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Request interceptor
 * Adds authentication token to requests if available
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor
 * Handles authentication errors and redirects to login
 */
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * Authentication API
 */
export const authAPI = {
  /**
   * User login
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} Login response with token
   */
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  /**
   * User registration
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} registrationCode - Registration code required for signup
   * @returns {Promise} Registration response with token
   */
  register: async (email, password, registrationCode) => {
    const response = await api.post('/auth/register', { email, password, registrationCode });
    return response.data;
  }
};

/**
 * Admin API
 */
export const adminAPI = {
  /**
   * Get dashboard statistics
   * @returns {Promise} Dashboard statistics
   */
  getDashboardStats: async () => {
    const response = await api.get('/admin/dashboard/stats');
    return response.data;
  },

  /**
   * Get all users
   * @param {Object} filters - Filter options (isAdmin)
   * @returns {Promise} Array of users
   */
  getUsers: async (filters = {}) => {
    const response = await api.get('/admin/users', { params: filters });
    return response.data;
  },

  /**
   * Reset user password
   * @param {string} userId - User ID
   * @param {string} defaultPassword - Default password (optional)
   * @returns {Promise} Reset password response
   */
  resetUserPassword: async (userId, defaultPassword) => {
    const response = await api.post(`/admin/users/${userId}/reset-password`, { defaultPassword });
    return response.data;
  },

  /**
   * Update user admin status
   * @param {string} userId - User ID
   * @param {boolean} isAdmin - Admin status
   * @returns {Promise} Updated user
   */
  updateAdminStatus: async (userId, isAdmin) => {
    const response = await api.put(`/admin/users/${userId}/admin-status`, { isAdmin });
    return response.data;
  },

  /**
   * Set user expiry time
   * @param {string} userId - User ID
   * @param {Object} options - Expiry options { expiryHours, expiryDate, or removeExpiry }
   * @returns {Promise} Updated user
   */
  setUserExpiry: async (userId, options) => {
    const response = await api.post(`/admin/users/${userId}/set-expiry`, options);
    return response.data;
  },

  /**
   * Delete user
   * @param {string} userId - User ID
   * @returns {Promise} Deletion confirmation
   */
  deleteUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  /**
   * Generate registration code
   * @param {number} expiryHours - Hours until expiry (default: 24)
   * @returns {Promise} Generated code
   */
  generateRegistrationCode: async (expiryHours = 24) => {
    const response = await api.post('/admin/registration-codes', { expiryHours });
    return response.data;
  },

  /**
   * Get all registration codes
   * @param {Object} filters - Filter options (createdBy, isActive, used)
   * @returns {Promise} Array of registration codes
   */
  getRegistrationCodes: async (filters = {}) => {
    const response = await api.get('/admin/registration-codes', { params: filters });
    return response.data;
  },

  /**
   * Extend registration code expiry
   * @param {string} codeId - Registration code ID
   * @param {number} additionalHours - Hours to extend expiry by
   * @returns {Promise} Extended code response
   */
  extendCodeExpiry: async (codeId, additionalHours) => {
    const response = await api.post(`/admin/registration-codes/${codeId}/extend-expiry`, { additionalHours });
    return response.data;
  },

  /**
   * Deactivate registration code
   * @param {string} codeId - Registration code ID
   * @returns {Promise} Deactivation confirmation
   */
  deactivateCode: async (codeId) => {
    const response = await api.post(`/admin/registration-codes/${codeId}/deactivate`);
    return response.data;
  },

  /**
   * Delete registration code
   * @param {string} codeId - Registration code ID
   * @returns {Promise} Deletion confirmation
   */
  deleteCode: async (codeId) => {
    const response = await api.delete(`/admin/registration-codes/${codeId}`);
    return response.data;
  }
};

/**
 * Bank Account API
 */
export const accountAPI = {
  /**
   * Get all bank accounts
   * @returns {Promise} Array of bank accounts
   */
  getAll: async () => {
    const response = await api.get('/accounts');
    return response.data;
  },

  /**
   * Get account by ID
   * @param {string} id - Account ID
   * @returns {Promise} Account object
   */
  getById: async (id) => {
    const response = await api.get(`/accounts/${id}`);
    return response.data;
  },

  /**
   * Create new bank account
   * @param {Object} accountData - Account data
   * @returns {Promise} Created account
   */
  create: async (accountData) => {
    const response = await api.post('/accounts', accountData);
    return response.data;
  },

  /**
   * Update bank account
   * @param {string} id - Account ID
   * @param {Object} accountData - Updated account data
   * @returns {Promise} Updated account
   */
  update: async (id, accountData) => {
    const response = await api.put(`/accounts/${id}`, accountData);
    return response.data;
  },

  /**
   * Delete bank account
   * @param {string} id - Account ID
   * @returns {Promise} Deletion confirmation
   */
  delete: async (id) => {
    const response = await api.delete(`/accounts/${id}`);
    return response.data;
  }
};

/**
 * Check API
 */
export const checkAPI = {
  /**
   * Get checks with optional filters
   * @param {Object} filters - Filter options (date, accountId, type)
   * @returns {Promise} Array of checks
   */
  getAll: async (filters = {}) => {
    const response = await api.get('/checks', { params: filters });
    return response.data;
  },

  /**
   * Get check by ID
   * @param {string} id - Check ID
   * @returns {Promise} Check object
   */
  getById: async (id) => {
    const response = await api.get(`/checks/${id}`);
    return response.data;
  },

  /**
   * Create new check
   * @param {Object} checkData - Check data
   * @returns {Promise} Created check
   */
  create: async (checkData) => {
    const response = await api.post('/checks', checkData);
    return response.data;
  },

  /**
   * Update check
   * @param {string} id - Check ID
   * @param {Object} checkData - Updated check data
   * @returns {Promise} Updated check
   */
  update: async (id, checkData) => {
    const response = await api.put(`/checks/${id}`, checkData);
    return response.data;
  },

  /**
   * Delete check
   * @param {string} id - Check ID
   * @returns {Promise} Deletion confirmation
   */
  delete: async (id) => {
    const response = await api.delete(`/checks/${id}`);
    return response.data;
  }
};

/**
 * Dashboard API
 */
export const dashboardAPI = {
  /**
   * Get balance for a specific date
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise} Balance data
   */
  getBalance: async (date) => {
    const response = await api.get('/dashboard/balance', { params: { date } });
    return response.data;
  },

  /**
   * Get checks for a specific date
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise} Array of checks
   */
  getChecks: async (date) => {
    const response = await api.get('/dashboard/checks', { params: { date } });
    return response.data;
  },

  /**
   * Get complete dashboard summary
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise} Dashboard summary data
   */
  getSummary: async (date) => {
    const response = await api.get('/dashboard/summary', { params: { date } });
    return response.data;
  }
};

export default api;

