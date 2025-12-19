-- Migration: Add unique constraint on stripe_payment_intent_id to prevent duplicate transactions
-- This ensures that each Stripe payment intent can only be associated with one transaction

-- Step 1: Find all duplicate payment intents
-- Create a temp table with duplicates to keep (most recent succeeded, or most recent if none succeeded)
CREATE TEMP TABLE IF NOT EXISTS duplicates_to_keep AS
SELECT DISTINCT ON (stripe_payment_intent_id)
    id
FROM transactions
WHERE stripe_payment_intent_id IS NOT NULL
  AND stripe_payment_intent_id IN (
    -- Find payment intents that appear more than once
    SELECT stripe_payment_intent_id
    FROM transactions
    WHERE stripe_payment_intent_id IS NOT NULL
    GROUP BY stripe_payment_intent_id
    HAVING COUNT(*) > 1
  )
ORDER BY
    stripe_payment_intent_id,
    CASE WHEN payment_status = 'succeeded' THEN 1 ELSE 2 END,  -- Prefer succeeded
    created_at DESC;  -- Then most recent

-- Step 2: Mark duplicates (keep the ones in duplicates_to_keep table)
UPDATE transactions
SET
    payment_status = 'duplicate',
    review_notes = COALESCE(review_notes || '; ', '') || 'Marked as duplicate - another transaction exists for this payment intent'
WHERE stripe_payment_intent_id IS NOT NULL
  AND stripe_payment_intent_id IN (
    SELECT stripe_payment_intent_id
    FROM transactions
    WHERE stripe_payment_intent_id IS NOT NULL
    GROUP BY stripe_payment_intent_id
    HAVING COUNT(*) > 1
  )
  AND id NOT IN (SELECT id FROM duplicates_to_keep);

-- Step 3: Verify no duplicates remain (this will show any remaining duplicates)
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT stripe_payment_intent_id, COUNT(*) as cnt
        FROM transactions
        WHERE stripe_payment_intent_id IS NOT NULL
          AND payment_status != 'duplicate'
        GROUP BY stripe_payment_intent_id
        HAVING COUNT(*) > 1
    ) duplicates;

    IF duplicate_count > 0 THEN
        RAISE NOTICE 'Found % payment intents with duplicates after cleanup', duplicate_count;
    ELSE
        RAISE NOTICE 'No duplicates found, safe to create unique index';
    END IF;
END $$;

-- Step 4: Add unique constraint on stripe_payment_intent_id (only for non-duplicate, non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_unique_payment_intent
  ON transactions(stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL
    AND payment_status != 'duplicate';

-- Step 5: Clean up temp table
DROP TABLE IF EXISTS duplicates_to_keep;

-- Add comment for documentation
COMMENT ON INDEX idx_transactions_unique_payment_intent IS 'Ensures each Stripe payment intent is associated with only one non-duplicate transaction';
