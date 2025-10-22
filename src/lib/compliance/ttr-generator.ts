import { createServerSupabase } from "@/lib/supabase/server";

interface TTRData {
  transactionId: string;
  customerId: string;
  amount: number;
  transactionDate: string;
}

export async function generateTTR(data: TTRData) {
  const supabase = createServerSupabase()
  const { data: transaction } = await supabase
    .from('transactions')
    .select(`
      *,
      customers (*)
    `)
    .eq('id', data.transactionId)
    .single();

  if (!transaction) throw new Error('Transaction not found');

  // Format for AUSTRAC (CSV)
  const ttrRecord = {

    // Part B - Transaction details
    transaction_date: transaction.created_at,
    transaction_type: 'Purchase of bullion',
    transaction_amount: transaction.amount,
    transaction_currency: transaction.currency,

    // Part C - Customer details
    customer_type: transaction.customers.customer_type,
    customer_name: `${transaction.customers.first_name} ${transaction.customers.last_name}`,
    customer_dob: transaction.customers.date_of_birth,
    customer_address: JSON.stringify(transaction.customers.residential_address),

    // Part D - Verification method
    // review
    verification_method: 'Electronic verification via Stripe Identity',
    identification_document_type: 'See verification records',

    // Reference
    internal_reference: transaction.id,
  };

  // Store TTR record
  await supabase
    .from('transactions')
    .update({
      ttr_reference: `TTR-${Date.now()}`,
      ttr_generated_at: new Date().toISOString(),
    })
    .eq('id', data.transactionId);

  // In production, you would:
  // 1. Generate proper AUSTRAC format (CSV/XML)
  // 2. Upload to AUSTRAC Online
  // 3. Store submission confirmation

  return ttrRecord;
}
//
// // Admin function to export TTRs for submission
// export async function exportPendingTTRs() {
//   const { data: pendingTTRs } = await supabase
//     .from('transactions')
//     .select(`
//       *,
//       customers (*)
//     `)
//     .eq('requires_ttr', true)
//     .is('ttr_submitted_at', null)
//     .gte('created_at', new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()); // Last 10 days
//
//   // Format for AUSTRAC upload
//   const csvData = pendingTTRs?.map(generateTTR);
//
//   return csvData;
//}