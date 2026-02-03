/**
 * Recurring Transactions Job
 * Scheduled job to automatically create transactions from recurring templates
 * Should be run daily (e.g., via cron job or scheduled task)
 */

import { getDueRecurringTransactions, markRecurringTransactionCreated } from '../models/recurring-transaction.model.js';
import { createCheck } from '../models/check.model.js';
import { createCashTransaction } from '../models/cash.model.js';
import logger from '../config/logger.js';

/**
 * Process due recurring transactions
 * Creates actual transactions from recurring templates that are due
 * @param {Date} processDate - Date to process transactions for (default: today)
 * @returns {Promise<Object>} Summary of processed transactions
 */
export const processDueRecurringTransactions = async (processDate = new Date()) => {
  try {
    const dateStr = processDate.toISOString().split('T')[0];
    logger.info(`Processing due recurring transactions for date: ${dateStr}`);
    
    // Get all recurring transactions that are due
    const dueTransactions = await getDueRecurringTransactions(processDate);
    
    logger.info(`Found ${dueTransactions.length} due recurring transactions`);
    
    const results = {
      processed: 0,
      failed: 0,
      errors: []
    };
    
    // Process each due transaction
    for (const recurringTransaction of dueTransactions) {
      try {
        logger.info(`Processing recurring transaction: ${recurringTransaction.id} for user: ${recurringTransaction.user_id}`);
        
        let createdTransaction;
        
        // Create the actual transaction based on type
        if (recurringTransaction.transaction_type === 'check') {
          const checkData = {
            bank_account_id: recurringTransaction.bank_account_id,
            type: recurringTransaction.check_type,
            amount: recurringTransaction.amount,
            date: dateStr,
            payee_payer_name: recurringTransaction.payee_payer_name
          };
          createdTransaction = await createCheck(recurringTransaction.user_id, checkData);
          logger.info(`Created check transaction: ${createdTransaction.id} from recurring template: ${recurringTransaction.id}`);
        } else if (recurringTransaction.transaction_type === 'cash') {
          const cashData = {
            type: recurringTransaction.cash_type,
            amount: recurringTransaction.amount,
            date: dateStr,
            description: recurringTransaction.description
          };
          createdTransaction = await createCashTransaction(recurringTransaction.user_id, cashData);
          logger.info(`Created cash transaction: ${createdTransaction.id} from recurring template: ${recurringTransaction.id}`);
        }
        
        // Update recurring transaction's last_created_date and next_due_date
        await markRecurringTransactionCreated(recurringTransaction.id, dateStr);
        
        results.processed++;
        logger.info(`Successfully processed recurring transaction: ${recurringTransaction.id}`);
      } catch (error) {
        results.failed++;
        results.errors.push({
          recurring_transaction_id: recurringTransaction.id,
          error: error.message
        });
        logger.error(`Error processing recurring transaction: ${recurringTransaction.id}`, error);
      }
    }
    
    logger.info(`Completed processing recurring transactions. Processed: ${results.processed}, Failed: ${results.failed}`);
    return results;
  } catch (error) {
    logger.error('Error processing due recurring transactions:', error);
    throw error;
  }
};

/**
 * Run the job manually (for testing or manual execution)
 * Can be called from a script or API endpoint
 */
export const runJob = async () => {
  try {
    logger.info('Starting recurring transactions job');
    const results = await processDueRecurringTransactions();
    logger.info('Recurring transactions job completed', results);
    return results;
  } catch (error) {
    logger.error('Recurring transactions job failed:', error);
    throw error;
  }
};
