-- Add EDD Investigation Tracking Links
-- Links investigations to customers, transactions, and SMRs

-- Add investigation tracking to customers table
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS current_investigation_id UUID REFERENCES edd_investigations(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS last_investigation_completed_at TIMESTAMPTZ;

-- Add investigation link to transactions
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS edd_investigation_id UUID REFERENCES edd_investigations(id) ON DELETE SET NULL;

-- Add investigation link to suspicious_activity_reports
ALTER TABLE suspicious_activity_reports
ADD COLUMN IF NOT EXISTS edd_investigation_id UUID REFERENCES edd_investigations(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_current_investigation ON customers(current_investigation_id);
CREATE INDEX IF NOT EXISTS idx_transactions_edd_investigation ON transactions(edd_investigation_id);
CREATE INDEX IF NOT EXISTS idx_smr_edd_investigation ON suspicious_activity_reports(edd_investigation_id);

-- Comments for documentation
COMMENT ON COLUMN customers.current_investigation_id IS 'References the active/most recent EDD investigation for this customer';
COMMENT ON COLUMN customers.last_investigation_completed_at IS 'Timestamp of most recent investigation completion';
COMMENT ON COLUMN transactions.edd_investigation_id IS 'Links transaction to EDD investigation if it triggered or is part of one';
COMMENT ON COLUMN suspicious_activity_reports.edd_investigation_id IS 'Links SMR to EDD investigation if created as part of investigation escalation';
