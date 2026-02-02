/**
 * Winston Logger Configuration
 * Centralized logging module for the application
 * Provides different log levels: error, warn, info, debug
 */

import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

/**
 * Custom log format
 * Formats log messages with timestamp, level, and message
 */
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

/**
 * Winston logger instance
 * Configured with console transport for development
 * Can be extended with file transports for production
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }), // Capture stack traces
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(), // Add colors for console output
        logFormat
      )
    })
  ]
});

// Add file transports in production for persistent logging
if (process.env.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    })
  );
  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log'
    })
  );
}

export default logger;

