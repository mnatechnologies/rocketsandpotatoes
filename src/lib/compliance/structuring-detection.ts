import {supabase} from "@/lib/db/supabase";

// this function is to handle multiple transactions below thresehold and will serve as a check in the checkout process.
export async function detectStructuring(
  customerId: string,
  currentAmount: number,
) :Promise<boolean> {
  const {data: recentTransactions} = await supabase
    .from('transactions')
    .select('amount, created_at')
    .eq('customer_id', customerId)
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', {ascending: false});

  if (!recentTransactions || recentTransactions.length === 0) return false;



  //tx = transaction. getting lazy
  const suspiciousTransactions = recentTransactions.filter(
    tx => tx.amount >=4000 && tx.amount <  5000
  );

  if (suspiciousTransactions.length >= 3) return true;

  const totalRecent = recentTransactions.reduce((sum, tx) => sum +parseFloat(tx.amount.toString()), 0);
  if (totalRecent + currentAmount >= 10000 && suspiciousTransactions.length >= 2) return true;

  return false;
}

