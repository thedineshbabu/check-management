#!/usr/bin/env node

/**
 * Recurring Transactions Job Runner
 * Script to manually run the recurring transactions job
 * Can be executed via cron or manually
 * 
 * Usage:
 *   node src/scripts/run-recurring-job.js
 * 
 * For cron setup (runs daily at 2 AM):
 *   0 2 * * * cd /path/to/backend && node src/scripts/run-recurring-job.js >> logs/recurring-job.log 2>&1
 */

import dotenv from 'dotenv';
import { runJob } from '../jobs/recurring-transactions.job.js';
import logger from '../config/logger.js';

// Load environment variables
dotenv.config();

/**
 * Main execution function
 */
const main = async () => {
  try {
    logger.info('Starting recurring transactions job script');
    const results = await runJob();
    
    console.log('Job completed successfully:');
    console.log(`  Processed: ${results.processed}`);
    console.log(`  Failed: ${results.failed}`);
    
    if (results.errors.length > 0) {
      console.log('Errors:');
      results.errors.forEach((error) => {
        console.log(`  - Transaction ${error.recurring_transaction_id}: ${error.error}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    logger.error('Job script failed:', error);
    console.error('Job failed:', error.message);
    process.exit(1);
  }
};

// Run the job
main();
