CREATE TABLE sanctioned_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    aliases TEXT[], -- Array of alternative names
    date_of_birth DATE,
    nationality VARCHAR(100),
    entity_type VARCHAR(20) CHECK (entity_type IN ('individual', 'entity')),
    source VARCHAR(50) NOT NULL, -- 'DFAT', 'UN', etc.
    reference_number VARCHAR(100),
    listing_info TEXT,
    search_vector tsvector, -- We'll populate this with a trigger
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Simple indexes
CREATE INDEX idx_sanctioned_entities_name_lower ON sanctioned_entities(LOWER(full_name));
CREATE INDEX idx_sanctioned_entities_source ON sanctioned_entities(source);
CREATE INDEX idx_sanctioned_entities_dob ON sanctioned_entities(date_of_birth);
CREATE INDEX idx_sanctioned_entities_aliases ON sanctioned_entities USING gin(aliases);

-- Index for full-text search
CREATE INDEX idx_sanctioned_entities_search ON sanctioned_entities USING gin(search_vector);

-- Trigger function to update search_vector
CREATE OR REPLACE FUNCTION update_sanctioned_entities_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    NEW.full_name || ' ' ||
    COALESCE(array_to_string(NEW.aliases, ' '), '')
  );
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update search_vector on INSERT or UPDATE
CREATE TRIGGER trg_update_search_vector
    BEFORE INSERT OR UPDATE ON sanctioned_entities
     FOR EACH ROW
     EXECUTE FUNCTION update_sanctioned_entities_search_vector();