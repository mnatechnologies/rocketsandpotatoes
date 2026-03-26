-- Add fulfillment tracking columns to transactions table (pickup-only model)
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS fulfillment_status TEXT DEFAULT 'unfulfilled'
    CHECK (fulfillment_status IN ('unfulfilled', 'packing', 'ready_for_pickup', 'collected')),
  ADD COLUMN IF NOT EXISTS ready_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS collected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS fulfillment_notes TEXT,
  ADD COLUMN IF NOT EXISTS fulfilled_by TEXT;

-- Index for filtering by fulfillment status (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_transactions_fulfillment_status
  ON transactions (fulfillment_status)
  WHERE payment_status = 'succeeded';
