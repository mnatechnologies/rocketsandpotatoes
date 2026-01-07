-- Add Customer Monitoring Level
-- Tracks relationship-level compliance monitoring decisions

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS monitoring_level VARCHAR(20) DEFAULT 'standard'
CHECK (monitoring_level IN ('standard', 'ongoing_review', 'enhanced', 'blocked'));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_monitoring_level ON customers(monitoring_level);

-- Comments for documentation
COMMENT ON COLUMN customers.monitoring_level IS 'Relationship-level compliance monitoring: standard (normal), ongoing_review (enhanced monitoring), enhanced (all transactions require review), blocked (no transactions allowed)';
