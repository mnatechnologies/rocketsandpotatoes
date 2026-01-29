-- Add payment name mismatch tracking to transactions table
ALTER TABLE transactions
    ADD COLUMN IF NOT EXISTS payment_cardholder_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS payment_name_mismatch BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS payment_name_mismatch_severity VARCHAR(20) CHECK (payment_name_mismatch_severity IN ('none', 'low', 'medium', 'high'));

-- Add index for querying mismatches
CREATE INDEX IF NOT EXISTS idx_transactions_payment_name_mismatch
    ON transactions(payment_name_mismatch, payment_name_mismatch_severity)
    WHERE payment_name_mismatch = true;

-- Add comments
COMMENT ON COLUMN transactions.payment_cardholder_name IS 'Name on payment card from Stripe billing details';
  COMMENT ON COLUMN transactions.payment_name_mismatch IS 'Whether payment card name differs from customer name';
  COMMENT ON COLUMN transactions.payment_name_mismatch_severity IS 'Severity of name mismatch: none, low, medium, high';