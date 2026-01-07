-- Migration: Add approved_at timestamp to track when transactions were approved
-- This allows implementing 24-hour expiry for approved but unpaid transactions

-- Add approved_at column
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- Add index for querying expired approvals
CREATE INDEX IF NOT EXISTS idx_transactions_approved_at
  ON transactions(approved_at, payment_status)
  WHERE approved_at IS NOT NULL AND payment_status != 'succeeded';

-- Backfill approved_at for existing approved transactions
UPDATE transactions
SET approved_at = updated_at
WHERE review_status = 'approved'
  AND approved_at IS NULL
  AND payment_status != 'succeeded';

-- Add comment for documentation
COMMENT ON COLUMN transactions.approved_at IS 'Timestamp when transaction was approved for payment (24-hour expiry)';
