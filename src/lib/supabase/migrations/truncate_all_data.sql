-- Migration: Clear all data from tables (keep schema intact)
-- WARNING: This will permanently delete ALL data from ALL tables
-- Use with caution - this is irreversible!

-- Disable foreign key checks temporarily
SET session_replication_role = 'replica';

-- Truncate all tables in reverse dependency order
-- (child tables first, then parent tables)

DO $$
BEGIN
    RAISE NOTICE '⚠️  WARNING: Starting data truncation...';
    RAISE NOTICE 'This will delete ALL data from ALL tables';
END $$;

-- Step 1: Truncate child tables (those with foreign keys)
DO $$
BEGIN
    TRUNCATE TABLE audit_logs CASCADE;
    RAISE NOTICE '✓ Cleared audit_logs';

    TRUNCATE TABLE customer_documents CASCADE;
    RAISE NOTICE '✓ Cleared customer_documents';

    TRUNCATE TABLE customer_edd CASCADE;
    RAISE NOTICE '✓ Cleared customer_edd';

    TRUNCATE TABLE edd_investigations CASCADE;
    RAISE NOTICE '✓ Cleared edd_investigations';

    TRUNCATE TABLE identity_verifications CASCADE;
    RAISE NOTICE '✓ Cleared identity_verifications';

    TRUNCATE TABLE price_locks CASCADE;
    RAISE NOTICE '✓ Cleared price_locks';

    TRUNCATE TABLE sanctions_screenings CASCADE;
    RAISE NOTICE '✓ Cleared sanctions_screenings';

    TRUNCATE TABLE staff_training CASCADE;
    RAISE NOTICE '✓ Cleared staff_training';

    TRUNCATE TABLE suspicious_activity_reports CASCADE;
    RAISE NOTICE '✓ Cleared suspicious_activity_reports';

    TRUNCATE TABLE transactions CASCADE;
    RAISE NOTICE '✓ Cleared transactions';

    -- Step 2: Truncate parent tables
    TRUNCATE TABLE customers CASCADE;
    RAISE NOTICE '✓ Cleared customers';

    TRUNCATE TABLE staff CASCADE;
    RAISE NOTICE '✓ Cleared staff';

    -- Products and sanctioned_entities are preserved (commented out)
    -- TRUNCATE TABLE products CASCADE;
    -- TRUNCATE TABLE sanctioned_entities CASCADE;

    -- Step 3: Truncate reference/lookup tables
    TRUNCATE TABLE enquiries CASCADE;
    RAISE NOTICE '✓ Cleared enquiries';

    TRUNCATE TABLE metal_prices CASCADE;
    RAISE NOTICE '✓ Cleared metal_prices';

    TRUNCATE TABLE fx_rate_cache CASCADE;
    RAISE NOTICE '✓ Cleared fx_rate_cache';
END $$;

-- Re-enable foreign key checks
SET session_replication_role = 'origin';

-- Verify all tables are empty
DO $$
DECLARE
    table_counts TEXT;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📊 Table counts after truncation:';
    RAISE NOTICE '=====================================';

    SELECT INTO table_counts string_agg(
        format('  %s: %s rows',
            table_name,
            (SELECT COUNT(*) FROM information_schema.tables t
             WHERE t.table_name = tables.table_name)
        ),
        E'\n'
    )
    FROM (VALUES
        ('audit_logs'),
        ('customer_documents'),
        ('customer_edd'),
        ('customers'),
        ('edd_investigations'),
        ('enquiries'),
        ('fx_rate_cache'),
        ('identity_verifications'),
        ('metal_prices'),
        ('price_locks'),
        ('sanctions_screenings'),
        ('staff'),
        ('staff_training'),
        ('suspicious_activity_reports'),
        ('transactions')
    ) AS tables(table_name);

END $$;

-- Show actual counts
SELECT 'audit_logs' as table_name, COUNT(*) as row_count FROM audit_logs
UNION ALL SELECT 'customer_documents', COUNT(*) FROM customer_documents
UNION ALL SELECT 'customer_edd', COUNT(*) FROM customer_edd
UNION ALL SELECT 'customers', COUNT(*) FROM customers
UNION ALL SELECT 'edd_investigations', COUNT(*) FROM edd_investigations
UNION ALL SELECT 'enquiries', COUNT(*) FROM enquiries
UNION ALL SELECT 'fx_rate_cache', COUNT(*) FROM fx_rate_cache
UNION ALL SELECT 'identity_verifications', COUNT(*) FROM identity_verifications
UNION ALL SELECT 'metal_prices', COUNT(*) FROM metal_prices
UNION ALL SELECT 'price_locks', COUNT(*) FROM price_locks
-- UNION ALL SELECT 'products', COUNT(*) FROM products
-- UNION ALL SELECT 'sanctioned_entities', COUNT(*) FROM sanctioned_entities
UNION ALL SELECT 'sanctions_screenings', COUNT(*) FROM sanctions_screenings
UNION ALL SELECT 'staff', COUNT(*) FROM staff
UNION ALL SELECT 'staff_training', COUNT(*) FROM staff_training
UNION ALL SELECT 'suspicious_activity_reports', COUNT(*) FROM suspicious_activity_reports
UNION ALL SELECT 'transactions', COUNT(*) FROM transactions
ORDER BY table_name;

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Data truncation complete!';
    RAISE NOTICE 'All tables have been cleared while preserving schema structure';
    RAISE NOTICE '';
    RAISE NOTICE 'Note: You may want to re-import:';
    RAISE NOTICE '  - Products (your product catalog)';
    RAISE NOTICE '  - Sanctioned entities (DFAT sanctions list)';
END $$;
