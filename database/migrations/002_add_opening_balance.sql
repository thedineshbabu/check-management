-- Migration: 002_add_opening_balance.sql
-- Adds opening_balance column to bank_accounts table

-- Add opening_balance column to bank_accounts table
-- Defaults to 0 for existing accounts
ALTER TABLE bank_accounts 
ADD COLUMN IF NOT EXISTS opening_balance DECIMAL(15, 2) DEFAULT 0 NOT NULL;

-- Add comment to document the column
COMMENT ON COLUMN bank_accounts.opening_balance IS 'Initial balance amount when account was created';

