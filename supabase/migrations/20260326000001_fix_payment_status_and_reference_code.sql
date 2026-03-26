-- Fix 1: Widen payment_status from varchar(20) to TEXT
-- 'awaiting_bank_transfer' is 23 chars, exceeds varchar(20)
ALTER TABLE transactions
  ALTER COLUMN payment_status TYPE TEXT;

-- Fix 2: Re-add unique constraint on reference_code
-- (was dropped during demo to work around the PLACEHOLDER bug, now fixed in code)
-- First clean up any duplicate PLACEHOLDER values
-- Rename all PLACEHOLDER reference codes to unique values using their ID
UPDATE bank_transfer_orders
SET reference_code = 'LEGACY-' || id::text
WHERE reference_code = 'PLACEHOLDER';

-- Re-add unique constraint
ALTER TABLE bank_transfer_orders
  ADD CONSTRAINT bank_transfer_orders_reference_code_key UNIQUE (reference_code);
