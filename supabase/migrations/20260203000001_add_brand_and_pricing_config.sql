-- Add brand field to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand VARCHAR(100);

-- Create pricing_config table
CREATE TABLE IF NOT EXISTS pricing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  markup_percentage NUMERIC(5,2) DEFAULT 5.00 NOT NULL,
  default_base_fee NUMERIC(10,2) DEFAULT 10.00 NOT NULL,
  brand_base_fees JSONB DEFAULT '{}' NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Insert initial pricing config
INSERT INTO pricing_config (markup_percentage, default_base_fee, brand_base_fees)
VALUES (5.00, 10.00, '{}')
ON CONFLICT DO NOTHING;

-- Add comment to table
COMMENT ON TABLE pricing_config IS 'Global pricing configuration including markup percentage, default base fee, and brand-specific base fee overrides';
COMMENT ON COLUMN pricing_config.markup_percentage IS 'Percentage markup applied to spot cost (e.g., 5.00 for 5%)';
COMMENT ON COLUMN pricing_config.default_base_fee IS 'Default flat fee added to all products';
COMMENT ON COLUMN pricing_config.brand_base_fees IS 'JSON object mapping brand names to custom base fees';
