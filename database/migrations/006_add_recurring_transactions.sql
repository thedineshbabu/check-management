-- Recurring Transactions Migration
-- Migration: 006_add_recurring_transactions.sql
-- Adds recurring transactions table for scheduled check and cash transactions

-- Recurring transactions table for scheduled transactions
CREATE TABLE IF NOT EXISTS recurring_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('check', 'cash')),
    -- For check transactions
    bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE CASCADE,
    check_type VARCHAR(20) CHECK (check_type IN ('incoming', 'outgoing')),
    -- For cash transactions
    cash_type VARCHAR(20) CHECK (cash_type IN ('credit', 'debit')),
    -- Common fields
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    payee_payer_name VARCHAR(255),
    description VARCHAR(255),
    -- Recurrence settings
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
    start_date DATE NOT NULL,
    end_date DATE, -- NULL means no end date
    day_of_month INTEGER CHECK (day_of_month >= 1 AND day_of_month <= 31), -- For monthly/yearly
    day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday for weekly
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_created_date DATE, -- Track when last transaction was created
    next_due_date DATE, -- Next date when transaction should be created
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_user_id ON recurring_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_bank_account_id ON recurring_transactions(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_is_active ON recurring_transactions(is_active);
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_next_due_date ON recurring_transactions(next_due_date);
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_transaction_type ON recurring_transactions(transaction_type);

-- Trigger to automatically update updated_at
CREATE TRIGGER update_recurring_transactions_updated_at BEFORE UPDATE ON recurring_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment explaining the table
COMMENT ON TABLE recurring_transactions IS 'Stores recurring transaction templates that can be automatically created on schedule';
