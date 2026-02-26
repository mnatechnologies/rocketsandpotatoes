export type BankTransferStatus = 'hold_pending' | 'awaiting_transfer' | 'transfer_received' | 'succeeded' | 'expired' | 'cancelled';
export type HoldStatus = 'pending' | 'authorized' | 'captured' | 'voided' | 'expired';

export interface BankTransferOrder {
  id: string;
  transaction_id: string;
  reference_code: string;
  status: BankTransferStatus;

  deposit_percentage: number;
  deposit_amount_aud: number;
  stripe_hold_intent_id: string;
  hold_status: HoldStatus;
  hold_captured_amount: number | null;
  hold_capture_reason: string | null;

  bank_name: string;
  bsb: string;
  account_number: string;
  account_name: string;
  payid_identifier: string | null;
  payid_type: string | null;

  payment_deadline: string;
  reminder_sent_at: string | null;
  deadline_extended_at: string | null;
  deadline_extended_by: string | null;

  confirmed_at: string | null;
  confirmed_by: string | null;
  confirmation_notes: string | null;
  customer_transfer_ref: string | null;

  market_loss_policy_accepted: boolean;
  market_loss_policy_accepted_at: string | null;

  created_at: string;
  updated_at: string;
}

export interface BankTransferSettings {
  id: number;
  deposit_percentage: number;
  payment_window_hours: number;
  reminder_hours_before: number;
  bank_name: string | null;
  bsb: string | null;
  account_number: string | null;
  account_name: string | null;
  payid_identifier: string | null;
  payid_type: string | null;
  cancellation_fee_percentage: number;
  enabled: boolean;
  updated_at: string;
  updated_by: string | null;
}

export interface InvoiceData {
  reference_code: string;
  bank_name: string;
  bsb: string;
  account_number: string;
  account_name: string;
  payid_identifier: string | null;
  payid_type: string | null;
  amount_aud: number;
  payment_deadline: string;
  deposit_amount_aud: number;
  card_last_four: string | null;
}
