ALTER TABLE transactions
    ADD COLUMN IF NOT EXISTS amount_aud DECIMAL(10, 2);

-- Add index for compliance queries
CREATE INDEX IF NOT EXISTS idx_transactions_amount_aud
    ON transactions(amount_aud)
    WHERE amount_aud >= 10000;

-- Add comment for documentation
COMMENT ON COLUMN transactions.amount_aud IS 'Transaction amount converted to AUD for compliance threshold checks';
UPDATE transactions
SET amount_aud =
        CASE
            WHEN currency = 'USD' THEN amount * 1.57  -- Or fetch historical rates
            WHEN currency = 'AUD' THEN amount
            ELSE amount  -- Fallback for any other currency
            END
WHERE amount_aud IS NULL AND created_at < NOW();
