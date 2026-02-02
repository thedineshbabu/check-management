-- Check Management Application Database Schema
-- Migration: 004_add_user_expiry.sql
-- Adds user expiry time functionality for access control

-- Add expiry_time column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS expiry_time TIMESTAMP;

-- Create index for better query performance on expiry checks
CREATE INDEX IF NOT EXISTS idx_users_expiry_time ON users(expiry_time);

-- Add comment explaining the column
COMMENT ON COLUMN users.expiry_time IS 'Timestamp when the user account expires. NULL means no expiry (permanent access).';

