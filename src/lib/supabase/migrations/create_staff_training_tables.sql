-- Staff Training Register - AUSTRAC Compliance
-- AML/CTF Program Section 3.1: "A training register is maintained for all employees"

-- Staff registry table
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id VARCHAR UNIQUE, -- Optional: link to Clerk if active user has account
  full_name VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  position VARCHAR,
  department VARCHAR,
  employment_start_date DATE,
  employment_end_date DATE, -- NULL if still employed
  is_active BOOLEAN DEFAULT true,
  requires_aml_training BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Training records table
CREATE TABLE IF NOT EXISTS staff_training (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  training_type VARCHAR NOT NULL, -- 'initial_aml', 'annual_refresher', 'role_specific', 'advanced_aml'
  training_date DATE NOT NULL,
  training_provider VARCHAR, -- 'Internal', 'AUSTRAC eLearning', 'External Provider', etc.
  topics_covered TEXT[], -- Array of topics covered
  duration_hours DECIMAL(4,2),
  completion_status VARCHAR DEFAULT 'completed', -- 'completed', 'in_progress', 'failed'
  pass_score DECIMAL(5,2), -- Percentage if applicable
  certificate_url VARCHAR, -- Link to certificate in Supabase Storage
  conducted_by VARCHAR, -- Name of trainer/facilitator
  next_training_due DATE, -- Auto-calculated for annual refreshers
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_staff_active ON staff(is_active);
CREATE INDEX IF NOT EXISTS idx_staff_clerk_user ON staff(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_staff_email ON staff(email);
CREATE INDEX IF NOT EXISTS idx_training_staff ON staff_training(staff_id);
CREATE INDEX IF NOT EXISTS idx_training_due ON staff_training(next_training_due);
CREATE INDEX IF NOT EXISTS idx_training_date ON staff_training(training_date);
CREATE INDEX IF NOT EXISTS idx_training_type ON staff_training(training_type);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_training_updated_at BEFORE UPDATE ON staff_training
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE staff IS 'Staff registry for AML/CTF training compliance tracking';
COMMENT ON TABLE staff_training IS 'Training records for AUSTRAC compliance - 7 year retention required';
COMMENT ON COLUMN staff.requires_aml_training IS 'Whether this staff member requires AML/CTF training based on their role';
COMMENT ON COLUMN staff_training.next_training_due IS 'Calculated date for next required training (typically annual refresher)';

ALTER TABLE staff ADD COLUMN role VARCHAR CHECK (role IN ('admin', 'manager', 'staff'));
