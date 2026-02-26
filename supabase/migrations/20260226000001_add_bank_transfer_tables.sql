-- Bank Transfer Settings (single-row config table)
CREATE TABLE bank_transfer_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  deposit_percentage DECIMAL(5,2) DEFAULT 10.00,
  payment_window_hours INTEGER DEFAULT 24,
  reminder_hours_before INTEGER DEFAULT 6,
  bank_name TEXT,
  bsb TEXT,
  account_number TEXT,
  account_name TEXT,
  payid_identifier TEXT,
  payid_type TEXT,
  cancellation_fee_percentage DECIMAL(5,2) DEFAULT 0,
  enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by TEXT
);

-- Insert default row
INSERT INTO bank_transfer_settings (id) VALUES (1);

-- Bank Transfer Orders
CREATE TABLE bank_transfer_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL UNIQUE REFERENCES transactions(id),
  reference_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'hold_pending'
    CHECK (status IN ('hold_pending', 'awaiting_transfer', 'transfer_received', 'succeeded', 'expired', 'cancelled')),

  deposit_percentage DECIMAL(5,2) NOT NULL,
  deposit_amount_aud DECIMAL(12,2) NOT NULL,
  stripe_hold_intent_id TEXT NOT NULL,
  hold_status TEXT DEFAULT 'pending'
    CHECK (hold_status IN ('pending', 'authorized', 'captured', 'voided', 'expired')),
  hold_captured_amount DECIMAL(12,2),
  hold_capture_reason TEXT,

  bank_name TEXT NOT NULL DEFAULT 'Commonwealth Bank of Australia',
  bsb TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  payid_identifier TEXT,
  payid_type TEXT,

  payment_deadline TIMESTAMPTZ NOT NULL,
  reminder_sent_at TIMESTAMPTZ,
  deadline_extended_at TIMESTAMPTZ,
  deadline_extended_by TEXT,

  confirmed_at TIMESTAMPTZ,
  confirmed_by TEXT,
  confirmation_notes TEXT,
  customer_transfer_ref TEXT,

  market_loss_policy_accepted BOOLEAN NOT NULL DEFAULT false,
  market_loss_policy_accepted_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_bto_status ON bank_transfer_orders(status);
CREATE INDEX idx_bto_deadline ON bank_transfer_orders(payment_deadline) WHERE status = 'awaiting_transfer';
CREATE INDEX idx_bto_reference ON bank_transfer_orders(reference_code);
CREATE INDEX idx_bto_transaction ON bank_transfer_orders(transaction_id);

-- Add payment_method_type to existing transactions table
ALTER TABLE transactions
  ADD COLUMN payment_method_type TEXT
    CHECK (payment_method_type IN ('card', 'bank_transfer'))
    DEFAULT 'card';
