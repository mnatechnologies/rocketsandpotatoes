-- Add Xero bank transfer matching columns to bank_transfer_orders
ALTER TABLE bank_transfer_orders
    ADD COLUMN IF NOT EXISTS xero_matched_at timestamptz,
    ADD COLUMN IF NOT EXISTS xero_bank_transaction_id text,
    ADD COLUMN IF NOT EXISTS xero_match_status text,
    ADD COLUMN IF NOT EXISTS xero_match_amount numeric;

-- Add a check constraint for valid match statuses
ALTER TABLE bank_transfer_orders
    ADD CONSTRAINT chk_xero_match_status
        CHECK (xero_match_status IS NULL OR xero_match_status IN ('matched', 'amount_mismatch', 'not_found'));

COMMENT ON COLUMN bank_transfer_orders.xero_matched_at IS 'Timestamp when Xero bank feed match was found';
COMMENT ON COLUMN bank_transfer_orders.xero_bank_transaction_id IS 'Xero BankTransactionID for audit trail';
COMMENT ON COLUMN bank_transfer_orders.xero_match_status IS 'null=not checked, matched, amount_mismatch, not_found';
COMMENT ON COLUMN bank_transfer_orders.xero_match_amount IS 'Amount seen in Xero bank feed (for mismatch debugging)';
