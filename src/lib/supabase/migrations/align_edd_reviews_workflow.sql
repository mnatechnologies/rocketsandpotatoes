BEGIN;

-- Add new columns
ALTER TABLE customer_edd
    ADD COLUMN escalated_to_management_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN requires_management_approval BOOLEAN DEFAULT FALSE;

-- Update status constraint
ALTER TABLE customer_edd
DROP CONSTRAINT customer_edd_status_check;

ALTER TABLE customer_edd
    ADD CONSTRAINT customer_edd_status_check
        CHECK (status IN ('pending', 'under_review', 'escalated', 'approved', 'rejected'));

-- Recreate index
DROP INDEX IF EXISTS idx_customer_edd_status;
CREATE INDEX idx_customer_edd_status
    ON customer_edd(status)
    WHERE status IN ('pending', 'under_review', 'escalated');

COMMIT;

--testing