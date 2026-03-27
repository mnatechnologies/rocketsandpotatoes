-- AUSTRAC 7-year record retention policy
-- Adds archived_at (soft-delete flag) and retention_expires_at (computed: created_at + 7 years)
-- to all compliance-relevant tables.
-- Records are NEVER hard-deleted. Archival happens once retention_expires_at < NOW().

-- transactions
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS retention_expires_at TIMESTAMPTZ
    GENERATED ALWAYS AS (created_at + INTERVAL '7 years') STORED;

CREATE INDEX IF NOT EXISTS idx_transactions_retention
  ON transactions (retention_expires_at)
  WHERE archived_at IS NULL;

-- customers
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS retention_expires_at TIMESTAMPTZ
    GENERATED ALWAYS AS (created_at + INTERVAL '7 years') STORED;

CREATE INDEX IF NOT EXISTS idx_customers_retention
  ON customers (retention_expires_at)
  WHERE archived_at IS NULL;

-- identity_verifications
ALTER TABLE identity_verifications
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS retention_expires_at TIMESTAMPTZ
    GENERATED ALWAYS AS (created_at + INTERVAL '7 years') STORED;

CREATE INDEX IF NOT EXISTS idx_identity_verifications_retention
  ON identity_verifications (retention_expires_at)
  WHERE archived_at IS NULL;

-- sanctions_screenings
ALTER TABLE sanctions_screenings
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS retention_expires_at TIMESTAMPTZ
    GENERATED ALWAYS AS (created_at + INTERVAL '7 years') STORED;

CREATE INDEX IF NOT EXISTS idx_sanctions_screenings_retention
  ON sanctions_screenings (retention_expires_at)
  WHERE archived_at IS NULL;

-- suspicious_activity_reports
ALTER TABLE suspicious_activity_reports
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS retention_expires_at TIMESTAMPTZ
    GENERATED ALWAYS AS (created_at + INTERVAL '7 years') STORED;

CREATE INDEX IF NOT EXISTS idx_suspicious_activity_reports_retention
  ON suspicious_activity_reports (retention_expires_at)
  WHERE archived_at IS NULL;

-- edd_investigations
ALTER TABLE edd_investigations
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS retention_expires_at TIMESTAMPTZ
    GENERATED ALWAYS AS (created_at + INTERVAL '7 years') STORED;

CREATE INDEX IF NOT EXISTS idx_edd_investigations_retention
  ON edd_investigations (retention_expires_at)
  WHERE archived_at IS NULL;

-- audit_logs
ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS retention_expires_at TIMESTAMPTZ
    GENERATED ALWAYS AS (created_at + INTERVAL '7 years') STORED;

CREATE INDEX IF NOT EXISTS idx_audit_logs_retention
  ON audit_logs (retention_expires_at)
  WHERE archived_at IS NULL;
