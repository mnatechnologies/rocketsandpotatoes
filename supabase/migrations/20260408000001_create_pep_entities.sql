-- PEP entities table (reference data from OpenSanctions)
-- Adapted from IntelliCompli compliance platform
-- Uses soft-delete: is_active=false when entity removed from source (preserves audit trail)
CREATE TABLE IF NOT EXISTS pep_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opensanctions_id VARCHAR(100) NOT NULL,
    schema_type VARCHAR(50) NOT NULL DEFAULT 'Person',
    caption VARCHAR(500) NOT NULL,
    names TEXT[] NOT NULL DEFAULT '{}',
    birth_dates TEXT[] DEFAULT '{}',
    nationalities TEXT[] DEFAULT '{}',
    countries TEXT[] DEFAULT '{}',
    positions TEXT[] DEFAULT '{}',
    topics TEXT[] NOT NULL DEFAULT '{}',
    datasets TEXT[] DEFAULT '{}',
    source VARCHAR(50) NOT NULL DEFAULT 'opensanctions',
    first_seen TIMESTAMPTZ,
    last_seen TIMESTAMPTZ,
    last_change TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    deactivated_at TIMESTAMPTZ,
    search_vector TSVECTOR,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint on source + external ID for upsert
CREATE UNIQUE INDEX IF NOT EXISTS idx_pep_entities_source_ext_id ON pep_entities(source, opensanctions_id);

-- Name search indexes
CREATE INDEX IF NOT EXISTS idx_pep_entities_caption ON pep_entities(LOWER(caption));
CREATE INDEX IF NOT EXISTS idx_pep_entities_names ON pep_entities USING gin(names);
CREATE INDEX IF NOT EXISTS idx_pep_entities_search ON pep_entities USING gin(search_vector);

-- Topic filter index (for quick PEP vs RCA filtering)
CREATE INDEX IF NOT EXISTS idx_pep_entities_topics ON pep_entities USING gin(topics);

-- Active entity filtering
CREATE INDEX IF NOT EXISTS idx_pep_entities_active ON pep_entities(is_active) WHERE is_active = true;

-- Search vector trigger (uses 'simple' config — no stemming for proper names)
CREATE OR REPLACE FUNCTION update_pep_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('simple',
    NEW.caption || ' ' ||
    COALESCE(array_to_string(NEW.names, ' '), '')
  );
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pep_search_vector
    BEFORE INSERT OR UPDATE ON pep_entities
    FOR EACH ROW
    EXECUTE FUNCTION update_pep_search_vector();

-- RLS: reference data, service_role can read/write
ALTER TABLE pep_entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY service_role_pep_entities ON pep_entities
    FOR ALL TO service_role USING (true);

-- Import log table to track data freshness
CREATE TABLE IF NOT EXISTS pep_import_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'running',
    source VARCHAR(50) NOT NULL DEFAULT 'opensanctions',
    entities_imported INTEGER DEFAULT 0,
    entities_deactivated INTEGER DEFAULT 0,
    entities_skipped INTEGER DEFAULT 0,
    source_url TEXT,
    error_message TEXT,
    CONSTRAINT pep_import_status_check
        CHECK (status IN ('running', 'completed', 'failed'))
);

ALTER TABLE pep_import_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY service_role_pep_import_log ON pep_import_log
    FOR ALL TO service_role USING (true);
