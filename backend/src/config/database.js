/**
 * PostgreSQL Database Configuration
 * Establishes connection pool to PostgreSQL database
 * Supports both DATABASE_URL (Supabase/Render) and individual env vars
 */

import pkg from 'pg';
import logger from './logger.js';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

/**
 * Database connection pool
 * Manages multiple database connections efficiently
 * Supports DATABASE_URL for cloud deployments (Supabase)
 */
const poolConfig = process.env.DATABASE_URL 
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'check_management',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    };

const pool = new Pool(poolConfig);

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

