ALTER TABLE price_locks
    ADD COLUMN currency VARCHAR(3) DEFAULT 'USD',
    ADD COLUMN locked_price_usd DECIMAL(15, 2),
    ADD COLUMN locked_price_aud DECIMAL(15, 2),
    ADD COLUMN fx_rate DECIMAL(10, 6);

UPDATE price_locks
SET locked_price_usd = locked_price,
    locked_price_aud = locked_price * 1.57,  -- Use current fallback
    fx_rate = 1.57,
    currency = 'USD'
WHERE locked_price_usd IS NULL;

ALTER TABLE price_locks
DROP CONSTRAINT IF EXISTS unique_active_session_product;

ALTER TABLE price_locks
    ADD CONSTRAINT unique_active_session_product
        UNIQUE (session_id, product_id, status)
    WHERE status = 'active';
