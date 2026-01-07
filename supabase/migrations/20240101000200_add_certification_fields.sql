-- Add certification fields to customer_documents table
-- This supports AUSTRAC requirement 6.1 for authorized certifier validation

ALTER TABLE customer_documents
    ADD COLUMN IF NOT EXISTS is_certified BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS certifier_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS certifier_type VARCHAR(100),
    ADD COLUMN IF NOT EXISTS certifier_registration_number VARCHAR(100),
    ADD COLUMN IF NOT EXISTS certification_date DATE,
    ADD COLUMN IF NOT EXISTS certification_statement TEXT,
    ADD COLUMN IF NOT EXISTS certification_validated BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS certification_validated_by UUID REFERENCES staff(id),
    ADD COLUMN IF NOT EXISTS certification_validated_at TIMESTAMPTZ;

-- Add review status if not existssx
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'customer_documents'
                   AND column_name = 'review_status') THEN
ALTER TABLE customer_documents
    ADD COLUMN review_status VARCHAR(50) DEFAULT 'pending';
END IF;
END $$;

-- Add review notes if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'customer_documents'
                   AND column_name = 'review_notes') THEN
ALTER TABLE customer_documents
    ADD COLUMN review_notes TEXT;
END IF;
END $$;

-- Add reviewed by if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'customer_documents'
                   AND column_name = 'reviewed_by') THEN
ALTER TABLE customer_documents
    ADD COLUMN reviewed_by UUID REFERENCES staff(id);
END IF;
END $$;

-- Add reviewed at if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'customer_documents'
                   AND column_name = 'reviewed_at') THEN
ALTER TABLE customer_documents
    ADD COLUMN reviewed_at TIMESTAMPTZ;
END IF;
END $$;

-- Add rejection reason if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'customer_documents'
                   AND column_name = 'rejection_reason') THEN
ALTER TABLE customer_documents
    ADD COLUMN rejection_reason VARCHAR(500);
END IF;
END $$;

-- Create index for faster certification validation queries
CREATE INDEX IF NOT EXISTS idx_customer_documents_certification
    ON customer_documents(is_certified, certification_validated);

-- Add comment for documentation
COMMENT ON COLUMN customer_documents.certifier_type IS 'Type of authorized certifier: doctor, lawyer, jp, accountant, police_officer, pharmacist, teacher, engineer, nurse, minister';
COMMENT ON COLUMN customer_documents.is_certified IS 'Whether document is certified by an authorized certifier';
COMMENT ON COLUMN customer_documents.certification_validated IS 'Whether admin has validated the certification details';
