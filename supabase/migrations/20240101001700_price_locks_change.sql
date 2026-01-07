ALTER TABLE price_locks
    ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD',
    ADD COLUMN IF NOT EXISTS locked_price_usd DECIMAL(15, 2),
    ADD COLUMN IF NOT EXISTS locked_price_aud DECIMAL(15, 2),
    ADD COLUMN IF NOT EXISTS fx_rate DECIMAL(10, 6);


ALTER TABLE price_locks
DROP CONSTRAINT IF EXISTS unique_active_session_product;

CREATE UNIQUE INDEX unique_active_session_product
    ON price_locks (session_id, product_id)
    WHERE status = 'active';
