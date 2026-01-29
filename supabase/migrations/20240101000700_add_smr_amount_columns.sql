-- Migration: Add transaction amount columns to suspicious_activity_reports
-- This allows SMR records to store the transaction amount details

-- Add transaction amount columns
ALTER TABLE suspicious_activity_reports
  ADD COLUMN IF NOT EXISTS transaction_amount_aud DECIMAL(15, 2),
  ADD COLUMN IF NOT EXISTS original_amount DECIMAL(15, 2),
  ADD COLUMN IF NOT EXISTS original_currency VARCHAR(3);

-- Add index for queries filtering by amount
CREATE INDEX IF NOT EXISTS idx_smr_transaction_amount
  ON suspicious_activity_reports(transaction_amount_aud)
  WHERE transaction_amount_aud IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN suspicious_activity_reports.transaction_amount_aud IS 'Transaction amount converted to AUD for compliance reporting';
COMMENT ON COLUMN suspicious_activity_reports.original_amount IS 'Original transaction amount before conversion';
COMMENT ON COLUMN suspicious_activity_reports.original_currency IS 'Original currency of the transaction (USD, AUD, etc)';
