//import {createServerSupabase} from "@/lib/supabase/server";
import {createClient} from "@supabase/supabase-js";
import { createLogger} from "@/lib/utils/logger";
import { fetchFxRate } from '@/lib/metals-api/metalsApi';

const logger = createLogger('COMPLIANCE_THRESHOLDS')
export const complianceThreshold : {readonly enhancedDD: 50000, readonly kycRequired: 5000, readonly ttrRequired: 10000} = {
   enhancedDD: 50000,
   kycRequired: 5000,
   ttrRequired: 10000,
} as const;

export async function getComplianceRequirements(
  customerId: string,
  currentAmount: number
): Promise<{
  requiresEnhancedDD: boolean;
  requiresKYC: boolean;
  requiresTTR: boolean;
  cumulativeTotal: number;
  newCumulativeTotal: number;
}> {

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  // Get customer's lifetime transaction total
  //const supabase = createServerSupabase()

  const { data: transactions } = await supabase
    .from('transactions')
    .select('amount_aud, amount, currency')
    .eq('customer_id', customerId)
    .eq('payment_status', 'succeeded'); // Only count successful transactions

  logger.log(transactions)

  // Fetch current FX rate for legacy transaction conversion
  let currentFxRate: number | null = null;
  const hasLegacyTx = transactions?.some(tx => !tx.amount_aud && tx.currency === 'USD');
  if (hasLegacyTx) {
    try {
      const fxResult = await fetchFxRate('USD', 'AUD');
      currentFxRate = fxResult.rate;
    } catch (e) {
      logger.error('Failed to fetch FX rate for legacy tx conversion, using conservative fallback');
    }
  }

  const lifetimeTotal = transactions?.reduce((sum, tx) => {
    // Use amount_aud if available, otherwise convert with current rate
    let audAmount = tx.amount_aud;
    if (!audAmount) {
      // Legacy transaction without amount_aud — use current FX rate or conservative fallback
      const rate = currentFxRate || 1.70; // Conservative high fallback to avoid under-counting
      audAmount = tx.currency === 'USD' ? tx.amount * rate : tx.amount;
      logger.log(`Legacy tx conversion: ${tx.amount} ${tx.currency} → ${audAmount} AUD (rate: ${rate})`);
    }
    return sum + audAmount;
  }, 0) || 0;



  const newCumulativeTotal = lifetimeTotal + currentAmount;

  return {
    requiresEnhancedDD: newCumulativeTotal >= complianceThreshold.enhancedDD,
    requiresKYC: newCumulativeTotal >= complianceThreshold.kycRequired,
    requiresTTR: currentAmount >= complianceThreshold.ttrRequired,
    cumulativeTotal: lifetimeTotal,
    newCumulativeTotal
  };
}