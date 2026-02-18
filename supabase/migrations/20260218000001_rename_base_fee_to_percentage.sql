-- Rename base fee columns from flat amount to percentage
ALTER TABLE pricing_config RENAME COLUMN default_base_fee TO default_base_fee_percentage;
ALTER TABLE pricing_config RENAME COLUMN brand_base_fees TO brand_base_fee_percentages;

-- Update the default value to a sensible percentage (2%)
-- NOTE: Review this value before running. Adjust if your current base fee doesn't map to 2%.
UPDATE pricing_config SET default_base_fee_percentage = 2 WHERE default_base_fee_percentage = 10;
