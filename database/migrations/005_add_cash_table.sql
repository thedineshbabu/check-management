-- Cash Transactions Migration
-- Migration: 005_add_cash_table.sql
-- Adds cash transaction table similar to checks table

-- Cash transactions table for credit and debit cash operations
CREATE TABLE IF NOT EXISTS cash (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('credit', 'debit')),
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    date DATE NOT NULL,
    description VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_cash_user_id ON cash(user_id);
CREATE INDEX IF NOT EXISTS idx_cash_date ON cash(date);
CREATE INDEX IF NOT EXISTS idx_cash_type ON cash(type);

-- Trigger to automatically update updated_at
CREATE TRIGGER update_cash_updated_at BEFORE UPDATE ON cash
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
