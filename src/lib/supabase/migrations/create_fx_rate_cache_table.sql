CREATE TABLE IF NOT EXISTS fx_rate_cache (
                                             id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_currency VARCHAR(3) NOT NULL,
    to_currency VARCHAR(3) NOT NULL,
    rate DECIMAL(10, 6) NOT NULL,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fx_rate_cache_currencies_unique UNIQUE (from_currency, to_currency)
    );

CREATE INDEX IF NOT EXISTS idx_fx_rate_cache_currencies
    ON fx_rate_cache (from_currency, to_currency);

CREATE INDEX IF NOT EXISTS idx_fx_rate_cache_fetched_at
    ON fx_rate_cache (fetched_at DESC);
