-- Sales Kill Switch: tables for halt state, auto-halt config, and price snapshots

-- ============================================================================
-- sales_halt: current halt state per metal and globally
-- ============================================================================
CREATE TABLE IF NOT EXISTS sales_halt (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metal_type VARCHAR(10) NOT NULL UNIQUE,
    is_halted BOOLEAN NOT NULL DEFAULT false,
    halted_at TIMESTAMPTZ,
    halted_by VARCHAR(255),
    halt_reason TEXT,
    resumed_at TIMESTAMPTZ,
    resumed_by VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE sales_halt IS 'Per-metal and global sales halt state for the kill switch feature';

-- ============================================================================
-- sales_halt_config: configurable auto-halt thresholds per metal
-- ============================================================================
CREATE TABLE IF NOT EXISTS sales_halt_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metal_type VARCHAR(10) NOT NULL UNIQUE,
    drop_threshold_pct NUMERIC(5,2) NOT NULL DEFAULT 5.0,
    check_window_minutes INTEGER NOT NULL DEFAULT 60,
    enabled BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(255)
);

COMMENT ON TABLE sales_halt_config IS 'Auto-halt threshold configuration per metal type';

-- ============================================================================
-- price_snapshots: rolling price history for drop detection
-- ============================================================================
CREATE TABLE IF NOT EXISTS price_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metal_type VARCHAR(10) NOT NULL,
    price_usd NUMERIC(12,4) NOT NULL,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_snapshots_metal_captured
    ON price_snapshots (metal_type, captured_at);

COMMENT ON TABLE price_snapshots IS 'Rolling price history for auto-halt drop detection (24h retention)';

-- ============================================================================
-- Seed data: sales_halt rows for each metal + global
-- ============================================================================
INSERT INTO sales_halt (metal_type, is_halted)
SELECT 'XAU', false
WHERE NOT EXISTS (SELECT 1 FROM sales_halt WHERE metal_type = 'XAU');

INSERT INTO sales_halt (metal_type, is_halted)
SELECT 'XAG', false
WHERE NOT EXISTS (SELECT 1 FROM sales_halt WHERE metal_type = 'XAG');

INSERT INTO sales_halt (metal_type, is_halted)
SELECT 'XPT', false
WHERE NOT EXISTS (SELECT 1 FROM sales_halt WHERE metal_type = 'XPT');

INSERT INTO sales_halt (metal_type, is_halted)
SELECT 'XPD', false
WHERE NOT EXISTS (SELECT 1 FROM sales_halt WHERE metal_type = 'XPD');

INSERT INTO sales_halt (metal_type, is_halted)
SELECT 'ALL', false
WHERE NOT EXISTS (SELECT 1 FROM sales_halt WHERE metal_type = 'ALL');

-- ============================================================================
-- Seed data: sales_halt_config rows for each metal
-- ============================================================================
INSERT INTO sales_halt_config (metal_type, drop_threshold_pct, check_window_minutes, enabled)
SELECT 'XAU', 5.0, 60, true
WHERE NOT EXISTS (SELECT 1 FROM sales_halt_config WHERE metal_type = 'XAU');

INSERT INTO sales_halt_config (metal_type, drop_threshold_pct, check_window_minutes, enabled)
SELECT 'XAG', 5.0, 60, true
WHERE NOT EXISTS (SELECT 1 FROM sales_halt_config WHERE metal_type = 'XAG');

INSERT INTO sales_halt_config (metal_type, drop_threshold_pct, check_window_minutes, enabled)
SELECT 'XPT', 5.0, 60, true
WHERE NOT EXISTS (SELECT 1 FROM sales_halt_config WHERE metal_type = 'XPT');

INSERT INTO sales_halt_config (metal_type, drop_threshold_pct, check_window_minutes, enabled)
SELECT 'XPD', 5.0, 60, true
WHERE NOT EXISTS (SELECT 1 FROM sales_halt_config WHERE metal_type = 'XPD');
