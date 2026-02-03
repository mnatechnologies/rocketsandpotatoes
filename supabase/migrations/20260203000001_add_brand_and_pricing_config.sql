-- Add brand column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand VARCHAR(100);

-- Create pricing_config table
CREATE TABLE IF NOT EXISTS pricing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  markup_percentage NUMERIC(5,2) DEFAULT 5.00 NOT NULL,
  default_base_fee NUMERIC(10,2) DEFAULT 10.00 NOT NULL,
  brand_base_fees JSONB DEFAULT '{}' NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Insert default pricing config (only if table is empty)
INSERT INTO pricing_config (markup_percentage, default_base_fee, brand_base_fees)
SELECT 5.00, 10.00, '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM pricing_config);

-- Add comment
COMMENT ON TABLE pricing_config IS 'Global pricing configuration including markup percentage and base fees (brand-specific overrides supported)';
