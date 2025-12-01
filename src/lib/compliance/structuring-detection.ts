// import { createServerSupabase } from "@/lib/supabase/server";
import {createClient} from "@supabase/supabase-js";
import {generateSMR} from "@/lib/compliance/smr-generator";

// this function is to handle multiple transactions below thresehold and will serve as a check in the checkout process.
export async function detectStructuring(
  customerId: string,
  currentAmount: number,
) :Promise<boolean> {
  // const supabase = createServerSupabase()
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
  const {data: recentTransactions} = await supabase
    .from('transactions')
    .select('amount, created_at')
    .eq('customer_id', customerId)
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', {ascending: false});

  if (!recentTransactions || recentTransactions.length === 0) return false;


// to review
// tx = transaction. getting lazy
  const suspiciousTransactions = recentTransactions.filter(
    tx => tx.amount >=4000 && tx.amount <  5000
  );

  if (suspiciousTransactions.length >= 3) return true;

  const totalRecent = recentTransactions.reduce((sum, tx) => sum +parseFloat(tx.amount.toString()), 0);

  if (totalRecent + currentAmount >= 10000 && suspiciousTransactions.length >= 2) {

    await generateSMR({
      customerId,
      suspicionType: 'structuring',
      indicators: [
        `${suspiciousTransactions.length} transactions between $4,000-$5,000 in 7 days`,
        `Total amount: $${totalRecent.toFixed(2)}`,
      ],
      narrative: 'Customer appears to be structuring transactions to avoid $5,000 KYC threshold',
      transactionAmount: totalRecent + currentAmount,
    });
    return true;
  }
  return false;
}

