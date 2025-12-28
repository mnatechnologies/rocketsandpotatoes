-- Migration: Selecti1e table truncation
-- Use this if you only want to clear SOME tables, not all

-- ============================================================================
-- OPTION 1: Clear transaction/order data only (keep customers & products)
-- ============================================================================

-- Uncomment to clear only transaction-related data:
/*
TRUNCATE TABLE audit_logs CASCADE;
TRUNCATE TABLE customer_documents CASCADE;
TRUNCATE TABLE customer_edd CASCADE;
TRUNCATE TABLE identity_verifications CASCADE;
TRUNCATE TABLE price_locks CASCADE;
TRUNCATE TABLE sanctions_screenings CASCADE;
TRUNCATE TABLE suspicious_activity_reports CASCADE;
TRUNCATE TABLE transactions CASCADE;
TRUNCATE TABLE verification_requirements CASCADE;

RAISE NOTICE '✓ Cleared all transaction and verification data';
RAISE NOTICE '✓ Kept: customers, products, sanctioned_entities, enquiries';
*/

-- ============================================================================
-- OPTION 2: Clear test/development data only
-- ============================================================================

-- Uncomment to clear test data while keeping production data:
/*
-- Clear transactions from last 30 days (assumes dev/test data is recent)
DELETE FROM transactions
WHERE created_at > NOW() - INTERVAL '30 days';

-- Clear customer data for test emails
DELETE FROM customers
WHERE email LIKE '%test%'
   OR email LIKE '%@example.com';

-- Clear recent enquiries
DELETE FROM enquiries
WHERE created_at > NOW() - INTERVAL '30 days';

RAISE NOTICE '✓ Cleared recent test data';
*/

-- ============================================================================
-- OPTION 3: Clear specific customer data
-- ============================================================================

-- Uncomment and modify to clear data for specific customers:
/*
DO $$
DECLARE
    customer_ids UUID[];
BEGIN
    -- Add customer IDs you want to delete
    customer_ids := ARRAY[
        'customer-id-1'::UUID,
        'customer-id-2'::UUID
    ]::UUID[];

    -- Delete related data
    DELETE FROM transactions WHERE customer_id = ANY(customer_ids);
    DELETE FROM price_locks WHERE customer_id = ANY(customer_ids);
    DELETE FROM customer_documents WHERE customer_id = ANY(customer_ids);
    DELETE FROM customer_edd WHERE customer_id = ANY(customer_ids);
    DELETE FROM identity_verifications WHERE customer_id = ANY(customer_ids);
    DELETE FROM verification_requirements WHERE customer_id = ANY(customer_ids);
    DELETE FROM sanctions_screenings WHERE customer_id = ANY(customer_ids);
    DELETE FROM customers WHERE id = ANY(customer_ids);

    RAISE NOTICE 'Deleted data for % customers', array_length(customer_ids, 1);
END $$;
*/

-- ============================================================================
-- OPTION 4: Clear old audit logs (keep last 90 days)
-- ============================================================================

-- Uncomment to keep database clean by removing old audit logs:
/*
DELETE FROM audit_logs
WHERE created_at < NOW() - INTERVAL '90 days';

RAISE NOTICE '✓ Cleared audit logs older than 90 days';
*/

-- ============================================================================
-- OPTION 5: Clear failed/cancelled transactions
-- ============================================================================

-- Uncomment to clean up failed transactions:
/*
DELETE FROM transactions
WHERE payment_status IN ('failed', 'cancelled', 'duplicate')
  AND created_at < NOW() - INTERVAL '30 days';

RAISE NOTICE '✓ Cleared old failed/cancelled transactions';
*/

-- ============================================================================
-- Instructions:
-- ============================================================================
-- 1. Choose which option(s) you want to use
-- 2. Uncomment the relevant section(s)
-- 3. Modify as needed for your use case
-- 4. Run the migration
-- ============================================================================

RAISE NOTICE '⚠️  No tables truncated - all options are commented out';
RAISE NOTICE 'Uncomment the section you want to use and re-run';
