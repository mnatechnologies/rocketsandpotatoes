-- Migration: Add currency tracking to price_locks
-- This ensures a single source of truth for pricing with consistent FX rates

-- Add new columns for dual currency support
ALTER TABLE price_locks
  ADD COLUMN IF NOT EXISTS locked_price_usd DECIMAL(15, 2),
  ADD COLUMN IF NOT EXISTS locked_price_aud DECIMAL(15, 2),
  ADD COLUMN IF NOT EXISTS fx_rate DECIMAL(10, 6),
  ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD';

-- Add index for faster queries by currency
CREATE INDEX IF NOT EXISTS idx_price_locks_currency
  ON price_locks(currency, status, expires_at);

-- Add check constraint to ensure both prices are set
ALTER TABLE price_locks
  ADD CONSTRAINT chk_both_prices_set
  CHECK (
    (locked_price_usd IS NOT NULL AND locked_price_aud IS NOT NULL AND fx_rate IS NOT NULL)
    OR (locked_price_usd IS NULL AND locked_price_aud IS NULL AND fx_rate IS NULL)
  );

-- Backfill existing data
-- Assumes existing locked_price is in the currency specified, or USD if currency is NULL
UPDATE price_locks
SET
  currency = COALESCE(currency, 'USD'),
  fx_rate = CASE
    WHEN currency = 'AUD' THEN 1.57  -- Fallback rate for historical data
    ELSE 1.0
  END,
  locked_price_usd = CASE
    WHEN currency = 'AUD' THEN locked_price / 1.57
    ELSE locked_price
  END,
  locked_price_aud = CASE
    WHEN currency = 'AUD' THEN locked_price
    ELSE locked_price * 1.57
  END
WHERE locked_price_usd IS NULL
  AND locked_price IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN price_locks.locked_price_usd IS 'Locked price in USD (base currency)';
COMMENT ON COLUMN price_locks.locked_price_aud IS 'Locked price in AUD (for compliance)';
COMMENT ON COLUMN price_locks.fx_rate IS 'USD to AUD exchange rate used for this lock';
COMMENT ON COLUMN price_locks.currency IS 'Currency user selected for display (USD or AUD)';
