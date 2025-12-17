-- Query to identify duplicate payment intents before running the migration
-- This helps you understand what will be cleaned up

-- Show all payment intents with duplicates
SELECT
    stripe_payment_intent_id,
    COUNT(*) as duplicate_count,
    STRING_AGG(
        id || ' (' || payment_status || ', ' || TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI') || ')',
        ', '
        ORDER BY created_at DESC
    ) as transaction_ids
FROM transactions
WHERE stripe_payment_intent_id IS NOT NULL
GROUP BY stripe_payment_intent_id
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, stripe_payment_intent_id;

-- Show which transaction will be KEPT for each duplicate (most recent succeeded, or most recent)
SELECT DISTINCT ON (stripe_payment_intent_id)
    stripe_payment_intent_id,
    id as transaction_to_keep,
    payment_status,
    amount,
    amount_aud,
    created_at,
    'WILL BE KEPT' as action
FROM transactions
WHERE stripe_payment_intent_id IS NOT NULL
  AND stripe_payment_intent_id IN (
    SELECT stripe_payment_intent_id
    FROM transactions
    WHERE stripe_payment_intent_id IS NOT NULL
    GROUP BY stripe_payment_intent_id
    HAVING COUNT(*) > 1
  )
ORDER BY
    stripe_payment_intent_id,
    CASE WHEN payment_status = 'succeeded' THEN 1 ELSE 2 END,
    created_at DESC;

-- Show transactions that will be marked as duplicate
SELECT
    t.id,
    t.stripe_payment_intent_id,
    t.payment_status,
    t.amount,
    t.amount_aud,
    t.created_at,
    'WILL BE MARKED DUPLICATE' as action
FROM transactions t
WHERE t.stripe_payment_intent_id IS NOT NULL
  AND t.stripe_payment_intent_id IN (
    SELECT stripe_payment_intent_id
    FROM transactions
    WHERE stripe_payment_intent_id IS NOT NULL
    GROUP BY stripe_payment_intent_id
    HAVING COUNT(*) > 1
  )
  AND t.id NOT IN (
    SELECT DISTINCT ON (stripe_payment_intent_id) id
    FROM transactions
    WHERE stripe_payment_intent_id IS NOT NULL
      AND stripe_payment_intent_id IN (
        SELECT stripe_payment_intent_id
        FROM transactions
        WHERE stripe_payment_intent_id IS NOT NULL
        GROUP BY stripe_payment_intent_id
        HAVING COUNT(*) > 1
      )
    ORDER BY
        stripe_payment_intent_id,
        CASE WHEN payment_status = 'succeeded' THEN 1 ELSE 2 END,
        created_at DESC
  )
ORDER BY stripe_payment_intent_id, created_at DESC;

