import { createClient } from '@supabase/supabase-js';
import { BankTransferSettings } from '@/types/bank-transfer';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('BANK_TRANSFER_SETTINGS');

export async function getBankTransferSettings(): Promise<BankTransferSettings> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data, error } = await supabase
    .from('bank_transfer_settings')
    .select('*')
    .eq('id', 1)
    .single();

  if (error || !data) {
    logger.error('Failed to fetch bank transfer settings:', error);
    throw new Error('Bank transfer settings not configured');
  }

  return data as BankTransferSettings;
}

export function validateSettings(settings: BankTransferSettings): string | null {
  if (!settings.enabled) return 'Bank transfer payments are currently disabled';
  if (!settings.bsb || !settings.account_number || !settings.account_name) {
    return 'Bank account details not configured';
  }
  if (settings.deposit_percentage <= 0 || settings.deposit_percentage > 100) {
    return 'Invalid deposit percentage';
  }
  return null;
}
