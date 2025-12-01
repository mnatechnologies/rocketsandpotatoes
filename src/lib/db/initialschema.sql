-- Enable RLS and encryption
-- NOTE: The following database-level encryption setting is environment-specific and not portable.
-- ALTER DATABASE postgres SET encryption = 'on';

--CHECKOUT/ACCOUNT RELATED TABLES
------------------------------------------------------------------------------------------------------------------------
-- Customers table
CREATE TABLE customers
(
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email               VARCHAR(255) UNIQUE NOT NULL,
-- for later
-- customer_type VARCHAR(20) NOT NULL CHECK (customer_type IN ('individual', 'business')),

    -- Individual fields
    first_name          VARCHAR(100),
    middle_name         VARCHAR(100),
    last_name           VARCHAR(100),
    date_of_birth       DATE,
    residential_address JSONB, -- {street, city, state, postcode, country}
    phone               VARCHAR(50),

    -- Business fields
--     business_name       VARCHAR(255),
--     abn                 VARCHAR(11),
--     acn                 VARCHAR(9),
--     business_address    JSONB,
--     business_type       VARCHAR(50),

    -- Verification status
    verification_status VARCHAR(20)      DEFAULT 'unverified'
        CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected', 'requires_review')),
    verification_level  VARCHAR(20)      DEFAULT 'none'
        CHECK (verification_level IN ('none', 'manual', 'stripe_identity', 'dvs_verified')),
    stripe_customer_id  VARCHAR(255),


    -- Risk assessment
    risk_score          INTEGER          DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100),
    risk_level          VARCHAR(20)      DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
    is_pep              BOOLEAN          DEFAULT FALSE,
    is_sanctioned       BOOLEAN          DEFAULT FALSE,

    -- Metadata
    created_at          TIMESTAMPTZ      DEFAULT NOW(),
    updated_at          TIMESTAMPTZ      DEFAULT NOW(),
    last_verified_at    TIMESTAMPTZ
);

-- Identity verifications table
CREATE TABLE identity_verifications
(
    id                             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id                    UUID REFERENCES customers (id) ON DELETE CASCADE,

    -- Identity data
    stripe_verification_session_id VARCHAR(255) UNIQUE,
    verification_type              VARCHAR(50) NOT NULL, -- 'stripe_identity', 'manual', 'dvs'
    status                         VARCHAR(20) NOT NULL, -- 'processing', 'verified', 'failed', 'requires_input'


    -- Document details
    document_type                  VARCHAR(50),          -- 'driving_license', 'passport', 'id_card'
    document_number                VARCHAR(100),
    document_issuing_country       VARCHAR(2),
    document_expiry_date           DATE,

    -- Verification results
    verification_checks            JSONB,                -- Stripe's check results
    liveness_check_passed          BOOLEAN,
    document_check_passed          BOOLEAN,
    selfie_check_passed            BOOLEAN,

    -- Raw data (encrypted)
    stripe_response                JSONB,                -- Full Stripe API response

    -- Metadata
    verified_at                    TIMESTAMPTZ,
    created_at                     TIMESTAMPTZ      DEFAULT NOW()
);

-- Business verification table for later
-- CREATE TABLE business_verifications
-- (
--     id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     customer_id       UUID REFERENCES customers (id) ON DELETE CASCADE,
--
--     -- ABN/ACN verification
--     abn               VARCHAR(11),
--     acn               VARCHAR(9),
--     business_name     VARCHAR(255),
--     entity_type       VARCHAR(100),
--     entity_status     VARCHAR(50),
--
--     -- ABR API response
--     abr_verified      BOOLEAN          DEFAULT FALSE,
--     abr_response      JSONB,
--     abr_verified_at   TIMESTAMPTZ,
--
--     -- Beneficial owners
--     beneficial_owners JSONB, -- [{name, dob, ownership_percentage}]
--
--     -- ASIC verification (optional, add later)
--     asic_verified     BOOLEAN          DEFAULT FALSE,
--     asic_response     JSONB,
--
--     -- Metadata
--     created_at        TIMESTAMPTZ      DEFAULT NOW(),
--     updated_at        TIMESTAMPTZ      DEFAULT NOW()
-- );

-- Document enums
CREATE TYPE document_category AS ENUM (
  'primary_photo',
  'primary_non_photo',
  'secondary',
  'alternative'
);

CREATE TYPE document_type AS ENUM (
  -- Primary photographic
  'passport',
  'drivers_license',
  'proof_of_age_card',

  -- Primary non-photographic
  'birth_certificate',
  'citizenship_certificate',
  'pension_card',
  'centrelink_card',

  -- Secondary
  'medicare_card',
  'bank_statement',
  'utility_bill',
  'council_rates',
  'government_notice',
  'credit_card_statement',

  -- Alternative
  'referee_statement',
  'expired_id',
  'immicard',
  'government_correspondence',
  'foreign_birth_certificate'
);

-- Documents storage table (references to Supabase Storage)
CREATE TABLE customer_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers (id) ON DELETE CASCADE,
  verification_id UUID REFERENCES identity_verifications (id),

  -- Document classification
  document_category document_category,
  document_type document_type,

  -- Document metadata
  storage_path VARCHAR(500) NOT NULL, -- Supabase Storage path
  file_name VARCHAR(255),
  file_size INTEGER,
  mime_type VARCHAR(100),

  -- Retention
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 years'), -- AUSTRAC requirement

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions table
CREATE TABLE transactions
(
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id              UUID REFERENCES customers (id) ON DELETE CASCADE,

    -- Transaction details
    transaction_type         VARCHAR(50)    NOT NULL,        -- 'purchase', 'sale'
    amount                   DECIMAL(15, 2) NOT NULL,
    currency                 VARCHAR(3)       DEFAULT 'AUD',

    -- Product details
    product_type             VARCHAR(100),
    product_details          JSONB,

    -- Payment
    stripe_payment_intent_id VARCHAR(255),
    payment_method           VARCHAR(50),
    payment_status           VARCHAR(20),

    -- Compliance flags
    requires_kyc             BOOLEAN          DEFAULT FALSE, -- ≥ $5,000
    requires_ttr             BOOLEAN          DEFAULT FALSE, -- ≥ $10,000
    requires_enhanced_dd     BOOLEAN          DEFAULT FALSE,

    ttr_generated_at         TIMESTAMPTZ,
    ttr_submitted_at         TIMESTAMPTZ,
    ttr_reference            VARCHAR(100),

    -- Risk flags
    risk_flags               JSONB,                          -- ['structuring', 'unusual_pattern', 'high_value']
    flagged_for_review       BOOLEAN          DEFAULT FALSE,
    reviewed_by              UUID,                           -- Staff user ID
    reviewed_at              TIMESTAMPTZ,
    review_notes             TEXT,

    -- Metadata
    created_at               TIMESTAMPTZ      DEFAULT NOW(),
    updated_at               TIMESTAMPTZ      DEFAULT NOW()
);

-- COMPLIANCE/AUSTRAC RELATED TABLES
-----------------------------------------------------------------------------------------------------------------------
-- Suspicious activity reports table
CREATE TABLE suspicious_activity_reports
(
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id          UUID REFERENCES customers (id),
    transaction_id       UUID REFERENCES transactions (id),

    -- SMR details
    report_type          VARCHAR(20)      DEFAULT 'SMR', -- 'SMR', 'TTR'
    suspicion_category   VARCHAR(100),                   -- 'structuring', 'money_laundering', etc.
    description          TEXT NOT NULL,

    -- Status
    status               VARCHAR(20)      DEFAULT 'pending'
        CHECK (status IN ('pending', 'under_review', 'reported', 'dismissed')),

    flagged_by_system    BOOLEAN          DEFAULT TRUE,
    flagged_by_user      UUID,                           -- Staff user ID

    -- Reporting
    austrac_submitted_at TIMESTAMPTZ,
    austrac_reference    VARCHAR(100),

    -- Metadata
    created_at           TIMESTAMPTZ      DEFAULT NOW(),
    updated_at           TIMESTAMPTZ      DEFAULT NOW()
);

-- Audit log table
CREATE TABLE audit_logs
(
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Actor ai suggested this, unsure if relevant
--     user_id UUID,
--     user_email  VARCHAR(255),
--     user_role   VARCHAR(50),

    -- Action
    action_type VARCHAR(100) NOT NULL, -- 'customer_verified', 'transaction_flagged', 'smr_submitted'
    entity_type VARCHAR(50),           -- 'customer', 'transaction', 'verification'
    entity_id   UUID,

    -- Details
    description TEXT,
    metadata    JSONB,

    -- Context
    ip_address  INET,
    user_agent  TEXT,

    -- Timestamp
    created_at  TIMESTAMPTZ      DEFAULT NOW()
);

-- Sanctions screening table (optional for now, add later)
CREATE TABLE sanctions_screenings
(
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id       UUID REFERENCES customers (id) ON DELETE CASCADE,

    -- Screening details
    screened_name     VARCHAR(255) NOT NULL,
    screening_service VARCHAR(50),   -- 'dfat', 'sanctions_io', 'manual'

    -- Results
    is_match          BOOLEAN          DEFAULT FALSE,
    match_score       DECIMAL(5, 2), -- If using fuzzy matching
    matched_entities  JSONB,         -- List of potential matches

    -- Status
    status            VARCHAR(20)      DEFAULT 'clear' CHECK (status IN ('clear', 'potential_match', 'confirmed_match')),
    reviewed_by       UUID,
    review_notes      TEXT,

    -- Metadata
    screened_at       TIMESTAMPTZ      DEFAULT NOW(),
    created_at        TIMESTAMPTZ      DEFAULT NOW()
);

-- CONTACT/ENQUIRIES TABLE

CREATE TABLE enquiries
(
    id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name    VARCHAR(255),
    email   VARCHAR(255),
    phone   VARCHAR(50),
    message TEXT
);


-- PRODUCTS TABLE
CREATE TABLE products
(
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255),
    description TEXT,
    price       DECIMAL(15, 2),
    currency    VARCHAR(3),
    weight      VARCHAR(255),
    category    VARCHAR(255),
    purity      VARCHAR(255),
    rating      VARCHAR(255),
    image       VARCHAR(255),
    stock       BOOLEAN
);


-- Indexes for performance
CREATE INDEX idx_customers_email ON customers (email);
CREATE INDEX idx_customers_verification_status ON customers (verification_status);
CREATE INDEX idx_transactions_customer_id ON transactions (customer_id);
CREATE INDEX idx_transactions_amount ON transactions (amount);
CREATE INDEX idx_transactions_requires_ttr ON transactions (requires_ttr);
CREATE INDEX idx_transactions_flagged ON transactions (flagged_for_review);
CREATE INDEX idx_transactions_created_at ON transactions (created_at);
CREATE INDEX idx_identity_verifications_customer_id ON identity_verifications (customer_id);
CREATE INDEX idx_suspicious_reports_status ON suspicious_activity_reports (status);
CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at);
CREATE INDEX idx_audit_logs_entity ON audit_logs (entity_type, entity_id);
CREATE INDEX idx_products_name ON products (name);


-- Enable Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE suspicious_activity_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;


-- RLS Policies (example for customers - customers can only see their own data)
CREATE
POLICY "Customers can view own data" ON customers
  FOR
SELECT
    USING (auth.uid() = id);

-- Unsure why AI suggested this on review, no staff table
-- CREATE
-- POLICY "Staff can view all customers" ON customers
--   FOR ALL USING (
--     EXISTS (
--       SELECT 1 FROM staff_users
--       WHERE staff_users.user_id = auth.uid()
--     )
--   );

-- DEPRECATED: verification_requirements table removed
-- Data now stored in identity_verifications.verification_checks JSONB field
-- DROP TABLE IF EXISTS verification_requirements;


// for clerk integration
ALTER TABLE customers ADD COLUMN clerk_user_id TEXT UNIQUE;
CREATE INDEX idx_customers_clerk_user_id ON customers (clerk_user_id);

DROP POLICY IF EXISTS "Customers can view own data" ON customers;

CREATE POLICY "Customers can view own data" ON customers
    FOR SELECT
    USING (clerk_user_id = (auth.jwt() ->> 'sub'));

ALTER TABLE customers
    ALTER COLUMN clerk_user_id
     SET DEFAULT (auth.jwt() ->> 'sub');


CREATE TABLE metal_prices (
                              metal VARCHAR(50) PRIMARY KEY,
                              price_per_gram DECIMAL(15, 4),
                              currency VARCHAR(3),
                              last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

- Add a premium/markup column to products:

ALTER TABLE products ADD COLUMN premium_percentage DECIMAL(5, 2) DEFAULT 5.00;

ALTER TABLE transactions
    ADD COLUMN IF NOT EXISTS review_status VARCHAR(50),
    ADD COLUMN IF NOT EXISTS review_notes TEXT,
    ADD COLUMN IF NOT EXISTS reviewed_by VARCHAR(255),
    ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_transactions_review
    ON transactions(flagged_for_review, review_status)
    WHERE flagged_for_review = true;

ALTER TABLE identity_verifications
    ADD COLUMN IF NOT EXISTS given_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS family_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Add address columns
ALTER TABLE identity_verifications
    ADD COLUMN IF NOT EXISTS address_line1 VARCHAR(255),
    ADD COLUMN IF NOT EXISTS address_line2 VARCHAR(255),
    ADD COLUMN IF NOT EXISTS address_city VARCHAR(100),
    ADD COLUMN IF NOT EXISTS address_state VARCHAR(100),
    ADD COLUMN IF NOT EXISTS address_postal_code VARCHAR(20),
    ADD COLUMN IF NOT EXISTS address_country VARCHAR(2);

-- Add ID number columns
ALTER TABLE identity_verifications
    ADD COLUMN IF NOT EXISTS id_number_type VARCHAR(50),
    ADD COLUMN IF NOT EXISTS id_number_country VARCHAR(2),
    ADD COLUMN IF NOT EXISTS id_number_last4 VARCHAR(4);

-- Add individual check status columns
ALTER TABLE identity_verifications
    ADD COLUMN IF NOT EXISTS document_check_status VARCHAR(20),
    ADD COLUMN IF NOT EXISTS selfie_check_status VARCHAR(20),
    ADD COLUMN IF NOT EXISTS id_number_check_status VARCHAR(20),
    ADD COLUMN IF NOT EXISTS id_number_check_passed BOOLEAN;

-- Add comments for documentation
COMMENT ON COLUMN identity_verifications.given_name IS 'First name from verified document';
COMMENT ON COLUMN identity_verifications.family_name IS 'Last name from verified document';
COMMENT ON COLUMN identity_verifications.date_of_birth IS 'Date of birth from verified document';
COMMENT ON COLUMN identity_verifications.address_city IS 'City from verified address';
COMMENT ON COLUMN identity_verifications.id_number_type IS 'Type of ID number (e.g., license_number, passport_number)';
COMMENT ON COLUMN identity_verifications.id_number_last4 IS 'Last 4 digits of ID number';


ALTER TABLE customer_documents
    ADD COLUMN review_status VARCHAR(20) DEFAULT 'pending'
        CHECK (review_status IN ('pending', 'approved', 'rejected', 'resubmission_required')),
ADD COLUMN reviewed_by UUID,
ADD COLUMN reviewed_at TIMESTAMPTZ,
ADD COLUMN review_notes TEXT,
ADD COLUMN rejection_reason TEXT;

ALTER TABLE customers
    ADD COLUMN IF NOT EXISTS source_of_funds VARCHAR(100),
    ADD COLUMN IF NOT EXISTS source_of_funds_verified BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS source_of_funds_declared_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS occupation VARCHAR(100),
    ADD COLUMN IF NOT EXISTS employer VARCHAR(255);

-- Add index for queries
CREATE INDEX IF NOT EXISTS idx_customers_source_of_funds
    ON customers(source_of_funds_verified);

-- Add to transactions table:
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS source_of_funds_checked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS source_of_funds_check_date TIMESTAMPTZ;

-- Add TTR deadline tracking
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS ttr_submission_deadline TIMESTAMPTZ;

-- Add SMR deadline tracking
ALTER TABLE suspicious_activity_reports
ADD COLUMN IF NOT EXISTS submission_deadline TIMESTAMPTZ;

-- Index for deadline queries
CREATE INDEX IF NOT EXISTS idx_transactions_ttr_deadline
    ON transactions(ttr_submission_deadline)
    WHERE requires_ttr = true AND ttr_submitted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_smr_deadline
    ON suspicious_activity_reports(submission_deadline)
    WHERE status IN ('pending', 'under_review');

-- PEP Declaration columns
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS pep_relationship VARCHAR(50),
ADD COLUMN IF NOT EXISTS pep_declared_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS requires_enhanced_dd BOOLEAN DEFAULT FALSE;

-- Index for PEP customers
CREATE INDEX IF NOT EXISTS idx_customers_pep
    ON customers(is_pep)
    WHERE is_pep = true;

-- Index for customers requiring EDD
CREATE INDEX IF NOT EXISTS idx_customers_edd
    ON customers(requires_enhanced_dd)
    WHERE requires_enhanced_dd = true;

-- Enhanced Due Diligence (EDD) submissions table
CREATE TABLE IF NOT EXISTS customer_edd (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id),
    
    -- Source of Wealth (different from source of funds)
    source_of_wealth VARCHAR(100) NOT NULL,
    source_of_wealth_details TEXT,
    
    -- Transaction purpose
    transaction_purpose VARCHAR(100) NOT NULL,
    transaction_purpose_details TEXT,
    
    -- Expected transaction frequency
    expected_frequency VARCHAR(50) NOT NULL,
    expected_annual_volume VARCHAR(50),
    
    -- Additional documentation
    additional_documents JSONB,
    
    -- Review status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    
    -- Timestamps
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_customer_edd UNIQUE (customer_id)
);

-- Add EDD completion tracking to customers
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS edd_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS edd_completed_at TIMESTAMPTZ;

-- Index for pending EDD reviews
CREATE INDEX IF NOT EXISTS idx_customer_edd_status
    ON customer_edd(status)
    WHERE status IN ('pending', 'under_review');

-- Add screening_type column to sanctions_screenings
ALTER TABLE sanctions_screenings
ADD COLUMN IF NOT EXISTS screening_type VARCHAR(50) DEFAULT 'transaction';

CREATE TABLE price_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  session_id VARCHAR(255) NOT NULL,  -- For guest users
  
  -- Lock details
  product_id UUID REFERENCES products(id),
  locked_price DECIMAL(15, 2) NOT NULL,
  spot_price_per_gram DECIMAL(15, 4),
  metal_type VARCHAR(10),

  
  -- Timing
  locked_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,  -- locked_at + 15 minutes
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired')),
  used_at TIMESTAMPTZ,
  payment_intent_id VARCHAR(255),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_price_locks_session ON price_locks(session_id, status);
CREATE INDEX idx_price_locks_customer ON price_locks(customer_id, status);
CREATE INDEX idx_price_locks_expires ON price_locks(expires_at) WHERE status = 'active';

ALTER TABLE products ADD COLUMN metal_type VARCHAR(10);

UPDATE products SET metal_type = 'XAU' WHERE category = 'Gold';
UPDATE products SET metal_type = 'XAG' WHERE category = 'Silver';
UPDATE products SET metal_type = 'XPT' WHERE category = 'Platinum';
UPDATE products SET metal_type = 'XPD' WHERE category = 'Palladium';

ALTER TABLE products ADD CONSTRAINT chk_metal_type 
CHECK (metal_type IN ('XAU', 'XAG', 'XPT', 'XPD'));

ALTER TABLE products ADD COLUMN form_type VARCHAR(20);
-- Values: 'cast', 'minted', NULL (for non-gold)

ALTER TABLE price_locks ADD COLUMN currency VARCHAR(3) DEFAULT 'AUD';
ALTER TABLE price_locks ALTER COLUMN currency SET NOT NULL;


ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;


CREATE INDEX IF NOT EXISTS idx_transactions_metadata ON transactions USING gin(metadata);

COMMENT ON COLUMN transactions.metadata IS 'Stores additional transaction data including flag reasons, risk scores, and compliance details';

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS last_transaction_reviewed_at TIMESTAMPTZ;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_customers_last_transaction_reviewed
ON customers(last_transaction_reviewed_at);
