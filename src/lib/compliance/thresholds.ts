//import {createServerSupabase} from "@/lib/supabase/server";
import {createClient} from "@supabase/supabase-js";
import { createLogger} from "@/lib/utils/logger";
// fetchFxRateWithFallback removed — historical transactions must use amount_aud locked at transaction time

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

  // Only use amount_aud (locked at transaction time) for cumulative totals.
  // Legacy transactions without amount_aud are excluded with a warning — they
  // should be backfilled with the historical rate, not converted at today's rate.
  let legacySkipCount = 0;
  const lifetimeTotal = transactions?.reduce((sum, tx) => {
    if (tx.amount_aud) {
      return sum + tx.amount_aud;
    }
    // Legacy transaction missing amount_aud — cannot use current FX rate
    // as it would misrepresent the AUD value at time of transaction
    legacySkipCount++;
    return sum;
  }, 0) || 0;

  if (legacySkipCount > 0) {
    logger.warn(
      `${legacySkipCount} legacy transactions for customer ${customerId} missing amount_aud — ` +
      `excluded from cumulative total. Run backfill migration to populate historical AUD values.`
    );
  }



  const newCumulativeTotal = lifetimeTotal + currentAmount;

  return {
    requiresEnhancedDD: newCumulativeTotal >= complianceThreshold.enhancedDD,
    requiresKYC: newCumulativeTotal >= complianceThreshold.kycRequired,
    requiresTTR: currentAmount >= complianceThreshold.ttrRequired,
    cumulativeTotal: lifetimeTotal,
    newCumulativeTotal
  };
}