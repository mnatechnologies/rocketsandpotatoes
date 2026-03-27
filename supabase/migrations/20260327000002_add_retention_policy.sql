-- AUSTRAC 7-year record retention policy
-- Adds archived_at (soft-delete flag) and retention_expires_at (created_at + 7 years)
-- to all compliance-relevant tables.
-- Records are NEVER hard-deleted. Archival happens once retention_expires_at < NOW().
--
-- Note: Cannot use GENERATED ALWAYS AS with TIMESTAMPTZ + INTERVAL (not immutable in Postgres).
-- Instead, we use a regular column with a trigger to auto-compute on INSERT/UPDATE.

-- Helper function: sets retention_expires_at = created_at + 7 years
CREATE OR REPLACE FUNCTION set_retention_expires_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.retention_expires_at := NEW.created_at + INTERVAL '7 years';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- transactions
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS retention_expires_at TIMESTAMPTZ;

CREATE OR REPLACE TRIGGER trg_transactions_retention
  BEFORE INSERT OR UPDATE OF created_at ON transactions
  FOR EACH ROW EXECUTE FUNCTION set_retention_expires_at();

UPDATE transactions SET retention_expires_at = created_at + INTERVAL '7 years'
  WHERE retention_expires_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_retention
  ON transactions (retention_expires_at)
  WHERE archived_at IS NULL;

-- customers
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS retention_expires_at TIMESTAMPTZ;

CREATE OR REPLACE TRIGGER trg_customers_retention
  BEFORE INSERT OR UPDATE OF created_at ON customers
  FOR EACH ROW EXECUTE FUNCTION set_retention_expires_at();

UPDATE customers SET retention_expires_at = created_at + INTERVAL '7 years'
  WHERE retention_expires_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_customers_retention
  ON customers (retention_expires_at)
  WHERE archived_at IS NULL;

-- identity_verifications
ALTER TABLE identity_verifications
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS retention_expires_at TIMESTAMPTZ;

CREATE OR REPLACE TRIGGER trg_identity_verifications_retention
  BEFORE INSERT OR UPDATE OF created_at ON identity_verifications
  FOR EACH ROW EXECUTE FUNCTION set_retention_expires_at();

UPDATE identity_verifications SET retention_expires_at = created_at + INTERVAL '7 years'
  WHERE retention_expires_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_identity_verifications_retention
  ON identity_verifications (retention_expires_at)
  WHERE archived_at IS NULL;

-- sanctions_screenings
ALTER TABLE sanctions_screenings
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS retention_expires_at TIMESTAMPTZ;

CREATE OR REPLACE TRIGGER trg_sanctions_screenings_retention
  BEFORE INSERT OR UPDATE OF created_at ON sanctions_screenings
  FOR EACH ROW EXECUTE FUNCTION set_retention_expires_at();

UPDATE sanctions_screenings SET retention_expires_at = created_at + INTERVAL '7 years'
  WHERE retention_expires_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_sanctions_screenings_retention
  ON sanctions_screenings (retention_expires_at)
  WHERE archived_at IS NULL;

-- suspicious_activity_reports
ALTER TABLE suspicious_activity_reports
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS retention_expires_at TIMESTAMPTZ;

CREATE OR REPLACE TRIGGER trg_suspicious_activity_reports_retention
  BEFORE INSERT OR UPDATE OF created_at ON suspicious_activity_reports
  FOR EACH ROW EXECUTE FUNCTION set_retention_expires_at();

UPDATE suspicious_activity_reports SET retention_expires_at = created_at + INTERVAL '7 years'
  WHERE retention_expires_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_suspicious_activity_reports_retention
  ON suspicious_activity_reports (retention_expires_at)
  WHERE archived_at IS NULL;

-- edd_investigations
ALTER TABLE edd_investigations
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS retention_expires_at TIMESTAMPTZ;

CREATE OR REPLACE TRIGGER trg_edd_investigations_retention
  BEFORE INSERT OR UPDATE OF created_at ON edd_investigations
  FOR EACH ROW EXECUTE FUNCTION set_retention_expires_at();

UPDATE edd_investigations SET retention_expires_at = created_at + INTERVAL '7 years'
  WHERE retention_expires_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_edd_investigations_retention
  ON edd_investigations (retention_expires_at)
  WHERE archived_at IS NULL;

-- audit_logs
ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS retention_expires_at TIMESTAMPTZ;

CREATE OR REPLACE TRIGGER trg_audit_logs_retention
  BEFORE INSERT OR UPDATE OF created_at ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION set_retention_expires_at();

UPDATE audit_logs SET retention_expires_at = created_at + INTERVAL '7 years'
  WHERE retention_expires_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_audit_logs_retention
  ON audit_logs (retention_expires_at)
  WHERE archived_at IS NULL;
