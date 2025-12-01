import { createClient } from "@supabase/supabase-js";
import { calculateTTRDeadline } from "./deadline-utils";

interface TTRData {
  transactionId: string;
  customerId: string;
  amount: number;
  transactionDate: string;
}

export interface TTRRecord {
  transaction_date: string;
  transaction_type: string;
  transaction_amount: number;
  transaction_currency: string;
  customer_type?: string;
  customer_name: string;
  customer_dob?: string;
  customer_address: string;
  customer_occupation?: string;
  customer_source_of_funds?: string;
  customer_employer?: string;
  verification_method: string;
  identification_document_type: string;
  internal_reference: string;
  ttr_reference?: string;
}

// ✅ Create Supabase client once
function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

// ✅ Single function to format TTR record
function formatTTRRecord(transaction: any): TTRRecord {
  const formatAddress = (addr: any) => {
    if (!addr) return 'Address not provided';

    if (typeof addr === 'string') {
      try {
        addr = JSON.parse(addr);
      } catch {
        return addr;
      }
    }

    const parts = [
      addr.line1,
      addr.line2,
      addr.city,
      addr.state,
      addr.postcode,
      addr.country,
    ].filter(Boolean);

    return parts.join(' | ');
  };

  // Helper to format date
  const formatDate = (date: string | null) => {
    if (!date) return '';
    try {
      return new Date(date).toISOString().split('T')[0]; // YYYY-MM-DD
    } catch {
      return date;
    }
  };

  return {
    // Part B - Transaction details
    transaction_date: formatDate(transaction.created_at),
    transaction_type: 'Purchase of bullion',
    transaction_amount: transaction.amount,
    transaction_currency: transaction.currency,

    // Part C - Customer details
    customer_type: transaction.customers?.customer_type || 'individual',
    customer_name: `${transaction.customers?.first_name || ''} ${transaction.customers?.last_name || ''}`.trim() || 'Name not provided',
    customer_dob: formatDate(transaction.customers?.date_of_birth),
    customer_address: formatAddress(transaction.customers?.residential_address),
    customer_occupation: transaction.customers?.occupation || 'Not provided',
    customer_source_of_funds: transaction.customers?.source_of_funds || 'Not declared',
    customer_employer: transaction.customers?.employer || 'N/A',

    // Part D - Verification level
    verification_method: getVerificationMethod(transaction),
    identification_document_type: getDocumentType(transaction),

    // Reference
    internal_reference: transaction.id,
    ttr_reference: transaction.ttr_reference,
  };
}

function getVerificationMethod(transaction: any): string {
  const level = transaction.customers?.verification_level;
  
  if (!level || level === 'none') {
    return 'Not verified';
  }
  
  if (level === 'stripe_identity') {
    return 'Electronic verification via Stripe Identity';
  }
  
  if (level === 'manual') {
    return 'Manual verification';
  }
  
  if (level === 'dvs_verified') {
    return 'Electronic verification via DVS';
  }
  
  return 'Not verified';
}

function getDocumentType(transaction: any): string {

  if (transaction.customers?.verification_level === 'stripe_identity') {
    return 'Government-issued photo ID (Passport or Driver License)';
  }

  if (transaction.customers?.verification_level === 'manual_document') {
    return 'Manually verified documents';
  }

  return 'Verification pending';
}

// ✅ Generate TTR for a single transaction
export async function generateTTR(data: TTRData) {
  const supabase = getSupabaseClient();

  // Generate TTR reference immediately
  const ttrReference = `TTR-${Date.now()}-${data.transactionId.slice(0, 8)}`;
  
  // Calculate submission deadline (10 business days)
  const deadline = calculateTTRDeadline(new Date(data.transactionDate));

  const { data: transaction, error } = await supabase
    .from('transactions')
    .select(`
      *,
      customers (
        customer_type,
        first_name,
        last_name,
        date_of_birth,
        residential_address,
        occupation,
        source_of_funds,
        employer,
        verification_level
      )
    `)
    .eq('id', data.transactionId)
    .single();

  if (error || !transaction) {
    throw new Error('Transaction not found');
  }

  // Store TTR reference and deadline BEFORE formatting
  await supabase
    .from('transactions')
    .update({
      ttr_reference: ttrReference,
      ttr_generated_at: new Date().toISOString(),
      ttr_submission_deadline: deadline.toISOString(),
    })
    .eq('id', data.transactionId);

  // Add the reference to the transaction object
  transaction.ttr_reference = ttrReference;

  // Format and return
  return formatTTRRecord(transaction);
}

// ✅ Export pending TTRs for AUSTRAC submission
export async function exportPendingTTRs() {
  const supabase = getSupabaseClient();

  const { data: pendingTTRs, error } = await supabase
    .from('transactions')
    .select(`
      *,
      customers (
        first_name,
        last_name,
        date_of_birth,
        residential_address,
        occupation,
        source_of_funds,
        employer,
        verification_level
      )
    `)
    .eq('requires_ttr', true)
    .is('ttr_submitted_at', null)
    .gte('created_at', new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString());

  if (error) {
    throw new Error(`Failed to fetch pending TTRs: ${error.message}`);
  }

  if (!pendingTTRs || pendingTTRs.length === 0) {
    return [];
  }

  return pendingTTRs.map(formatTTRRecord);
}

// ✅ Mark TTRs as submitted
export async function markTTRsAsSubmitted(transactionIds: string[], submittedBy?: string) {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('transactions')
    .update({
      ttr_submitted_at: new Date().toISOString(),
    })
    .in('id', transactionIds);

  if (error) {
    throw new Error(`Failed to mark TTRs as submitted: ${error.message}`);
  }

  // Log audit event for each TTR
  for (const transactionId of transactionIds) {
    await supabase.from('audit_logs').insert({
      action_type: 'ttr_submitted',
      entity_type: 'transaction',
      entity_id: transactionId,
      description: 'TTR marked as submitted to AUSTRAC',
      metadata: {
        submitted_by: submittedBy,
        submitted_at: new Date().toISOString(),
      },
    });
  }

  return { success: true };
}

// ✅ Helper to export TTRs as CSV
export function exportTTRsAsCSV(ttrRecords: TTRRecord[]): string {
  if (ttrRecords.length === 0) return '';
  // CSV headers
  const headers = [
    'Transaction Date',
    'Transaction Type',
    'Amount',
    'Currency',
    'Customer Name',
    'Date of Birth',
    'Address',
    'Occupation',
    'Source of Funds',
    'Employer',
    'Verification Level',
    'ID Document Type',
    'Internal Reference',
    'TTR Reference',
  ];

  // CSV rows
  const rows = ttrRecords.map(record => [
    record.transaction_date,
    record.transaction_type,
    record.transaction_amount,
    record.transaction_currency,
    `"${record.customer_name}"`,
    record.customer_dob || '',
    `"${record.customer_address}"`,
    record.customer_occupation || '',
    record.customer_source_of_funds || '',
    record.customer_employer || '',
    `"${record.verification_method}"`,
    `"${record.identification_document_type}"`,
    record.internal_reference,
    record.ttr_reference || '',
  ]);

  // Combine headers and rows
  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
}