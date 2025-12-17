-- Fix foreign key constraints in edd_investigations table
-- These should reference staff table, not customers table

-- Step 1: Drop existing incorrect foreign key constraints
ALTER TABLE edd_investigations
    DROP CONSTRAINT IF EXISTS edd_investigations_triggered_by_admin_id_fkey;

ALTER TABLE edd_investigations
    DROP CONSTRAINT IF EXISTS edd_investigations_management_approver_id_fkey;

ALTER TABLE edd_investigations
    DROP CONSTRAINT IF EXISTS edd_investigations_assigned_to_fkey;

ALTER TABLE edd_investigations
    DROP CONSTRAINT IF EXISTS edd_investigations_primary_investigator_id_fkey;

ALTER TABLE edd_investigations
    DROP CONSTRAINT IF EXISTS edd_investigations_reviewed_by_fkey;

-- Step 2: Clean up existing data - set fields to NULL where they don't reference valid staff
-- This is necessary because the old foreign keys pointed to customers table
UPDATE edd_investigations
SET
    triggered_by_admin_id = NULL,
    management_approver_id = NULL,
    assigned_to = NULL,
    primary_investigator_id = NULL,
    reviewed_by = NULL
WHERE
    triggered_by_admin_id NOT IN (SELECT id FROM staff WHERE id IS NOT NULL)
    OR management_approver_id NOT IN (SELECT id FROM staff WHERE id IS NOT NULL)
    OR assigned_to NOT IN (SELECT id FROM staff WHERE id IS NOT NULL)
    OR primary_investigator_id NOT IN (SELECT id FROM staff WHERE id IS NOT NULL)
    OR reviewed_by NOT IN (SELECT id FROM staff WHERE id IS NOT NULL);

-- Step 3: Add correct foreign key constraints pointing to staff table
ALTER TABLE edd_investigations
    ADD CONSTRAINT edd_investigations_triggered_by_admin_id_fkey
        FOREIGN KEY (triggered_by_admin_id) REFERENCES staff(id) ON DELETE SET NULL;

ALTER TABLE edd_investigations
    ADD CONSTRAINT edd_investigations_management_approver_id_fkey
        FOREIGN KEY (management_approver_id) REFERENCES staff(id) ON DELETE SET NULL;

ALTER TABLE edd_investigations
    ADD CONSTRAINT edd_investigations_assigned_to_fkey
        FOREIGN KEY (assigned_to) REFERENCES staff(id) ON DELETE SET NULL;

ALTER TABLE edd_investigations
    ADD CONSTRAINT edd_investigations_primary_investigator_id_fkey
        FOREIGN KEY (primary_investigator_id) REFERENCES staff(id) ON DELETE SET NULL;

ALTER TABLE edd_investigations
    ADD CONSTRAINT edd_investigations_reviewed_by_fkey
        FOREIGN KEY (reviewed_by) REFERENCES staff(id) ON DELETE SET NULL;

-- Step 4: Add indexes for the foreign keys (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_edd_investigations_triggered_by_admin_id
    ON edd_investigations(triggered_by_admin_id);

CREATE INDEX IF NOT EXISTS idx_edd_investigations_management_approver_id
    ON edd_investigations(management_approver_id);

CREATE INDEX IF NOT EXISTS idx_edd_investigations_primary_investigator_id
    ON edd_investigations(primary_investigator_id);

CREATE INDEX IF NOT EXISTS idx_edd_investigations_reviewed_by
    ON edd_investigations(reviewed_by);
