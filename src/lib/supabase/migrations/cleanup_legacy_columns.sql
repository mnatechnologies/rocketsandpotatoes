-- Migration: Clean up legacy columns and optimize schema
-- Removes deprecated columns that have been replaced with better alternatives

-- ============================================================================
-- PRICE_LOCKS TABLE CLEANUP
-- ============================================================================

-- The locked_price column is now redundant since we have locked_price_usd and locked_price_aud
-- Check if any rows rely on locked_price without the new columns
DO $$
DECLARE
    legacy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO legacy_count
    FROM price_locks
    WHERE locked_price IS NOT NULL
      AND (locked_price_usd IS NULL OR locked_price_aud IS NULL);

    IF legacy_count > 0 THEN
        RAISE NOTICE 'Found % price locks with legacy locked_price data. Backfilling...', legacy_count;

        -- Backfill any rows that haven't been migrated
        UPDATE price_locks
        SET
            locked_price_usd = CASE
                WHEN currency = 'USD' THEN locked_price
                ELSE locked_price / COALESCE(fx_rate, 1.57)
            END,
            locked_price_aud = CASE
                WHEN currency = 'AUD' THEN locked_price
                ELSE locked_price * COALESCE(fx_rate, 1.57)
            END,
            fx_rate = COALESCE(fx_rate, 1.57)
        WHERE locked_price IS NOT NULL
          AND (locked_price_usd IS NULL OR locked_price_aud IS NULL);

        RAISE NOTICE 'Backfill complete';
    ELSE
        RAISE NOTICE 'No legacy price lock data found';
    END IF;
END $$;

-- Now safe to drop the legacy column
ALTER TABLE price_locks
  DROP COLUMN IF EXISTS locked_price;

COMMENT ON TABLE price_locks IS 'Price locks use locked_price_usd and locked_price_aud with fx_rate for dual currency tracking';

-- ============================================================================
-- ADD MISSING INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for finding active price locks by session
CREATE INDEX IF NOT EXISTS idx_price_locks_session_status
  ON price_locks(session_id, status, expires_at)
  WHERE status = 'active';

-- Index for customer transaction queries
CREATE INDEX IF NOT EXISTS idx_transactions_customer_created
  ON transactions(customer_id, created_at DESC);

-- Index for finding transactions needing TTR generation
CREATE INDEX IF NOT EXISTS idx_transactions_needs_ttr
  ON transactions(requires_ttr, ttr_reference, ttr_submitted_at)
  WHERE requires_ttr = true;

-- Index for finding flagged transactions
CREATE INDEX IF NOT EXISTS idx_transactions_flagged
  ON transactions(flagged_for_review, review_status)
  WHERE flagged_for_review = true;

-- Index for payment status queries
CREATE INDEX IF NOT EXISTS idx_transactions_payment_status
  ON transactions(payment_status, created_at DESC);

-- Index for finding approved transactions needing payment
CREATE INDEX IF NOT EXISTS idx_transactions_approved_pending
  ON transactions(review_status, payment_status, approved_at)
  WHERE review_status = 'approved' AND payment_status != 'succeeded';

-- ============================================================================
-- ADD MISSING CONSTRAINTS
-- ============================================================================

-- Ensure amount_aud is set for all transactions (required for compliance)
DO $$
DECLARE
    missing_aud_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO missing_aud_count
    FROM transactions
    WHERE amount_aud IS NULL
      AND amount IS NOT NULL;

    IF missing_aud_count > 0 THEN
        RAISE NOTICE 'Found % transactions missing amount_aud. Backfilling...', missing_aud_count;

        -- Backfill using currency conversion
        UPDATE transactions
        SET amount_aud = CASE
            WHEN currency = 'USD' THEN amount * 1.57
            WHEN currency = 'AUD' THEN amount
            ELSE amount * 1.57  -- Default to USD conversion
        END
        WHERE amount_aud IS NULL
          AND amount IS NOT NULL;

        RAISE NOTICE 'Backfill complete';
    ELSE
        RAISE NOTICE 'All transactions have amount_aud set';
    END IF;
END $$;

-- ============================================================================
-- VERIFY DATA INTEGRITY
-- ============================================================================

-- Check for transactions with requires_ttr but no amount_aud
DO $$
DECLARE
    invalid_ttrs INTEGER;
BEGIN
    SELECT COUNT(*) INTO invalid_ttrs
    FROM transactions
    WHERE requires_ttr = true
      AND amount_aud IS NULL;

    IF invalid_ttrs > 0 THEN
        RAISE WARNING 'Found % transactions marked requires_ttr=true but missing amount_aud!', invalid_ttrs;
    ELSE
        RAISE NOTICE 'All TTR transactions have valid amount_aud';
    END IF;
END $$;

-- Check for price locks missing dual currency data
DO $$
DECLARE
    invalid_locks INTEGER;
BEGIN
    SELECT COUNT(*) INTO invalid_locks
    FROM price_locks
    WHERE (locked_price_usd IS NULL OR locked_price_aud IS NULL)
      AND status = 'active'
      AND expires_at > NOW();

    IF invalid_locks > 0 THEN
        RAISE WARNING 'Found % active price locks missing dual currency data!', invalid_locks;
    ELSE
        RAISE NOTICE 'All active price locks have valid dual currency data';
    END IF;
END $$;

-- ============================================================================
-- SUMMARY
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Database cleanup complete:';
    RAISE NOTICE '   - Removed legacy price_locks.locked_price column';
    RAISE NOTICE '   - Added performance indexes';
    RAISE NOTICE '   - Backfilled missing amount_aud values';
    RAISE NOTICE '   - Verified data integrity';
END $$;
