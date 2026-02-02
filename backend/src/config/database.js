/**
 * PostgreSQL Database Configuration
 * Establishes connection pool to PostgreSQL database
 * Uses environment variables for connection parameters
 */

import pkg from 'pg';
import logger from './logger.js';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

/**
 * Database connection pool
 * Manages multiple database connections efficiently
 * Connection parameters loaded from environment variables
 */
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'check_management',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000 // Return error after 2 seconds if connection cannot be established
});

/**
 * Test database connection
 * Verifies that the database connection is working
 */
pool.on('connect', () => {
  logger.info('Database connection established');
});

/**
 * Handle database connection errors
 * Logs errors and prevents application crash
 */
pool.on('error', (err) => {
  logger.error('Unexpected database pool error:', err);
});

/**
 * Query helper function
 * Executes SQL queries with error handling and logging
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @returns {Promise} Query result
 */
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    logger.error('Database query error:', { text, error: error.message });
    throw error;
  }
};

/**
 * Get a client from the pool for transactions
 * Useful for multi-step operations that need to be atomic
 * @returns {Promise<Client>} Database client
 */
export const getClient = async () => {
  const client = await pool.connect();
  logger.debug('Client acquired from pool');
  return client;
};

export default pool;

