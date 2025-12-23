import { createClient } from "@supabase/supabase-js";
import { calculateTTRDeadline } from "./deadline-utils";
import { createLogger } from "@/lib/utils/logger";
import { sendTTRCreatedAlert } from "@/lib/email/sendComplianceAlert";

const logger = createLogger('TTR Generator')
interface TTRData {
  transactionId: string;
  customerId: string;
  amount_aud: number;
  currency?: string;
  transactionDate: string;
  customerName: string;
}

export interface TTRRecord {
  transaction_date: string;
  transaction_type: string;
  transaction_amount: string;
  original_amount: number;
  original_currency: string;
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
    transaction_amount: transaction.amount_aud,
    original_amount: transaction.amount,
    original_currency: transaction.currency,

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
  logger.log('=== generateTTR START ===');
  const { transactionId, customerId, amount_aud, currency = 'AUD', transactionDate } = data;

  // Ensure amount is in AUD
  if (currency !== 'AUD') {
    throw new Error(`TTR generation requires AUD amount. Received: ${currency} ${amount_aud}`);
  }

  if (!amount_aud  || amount_aud <= 0) {
    throw new Error('Invalid amount for TTR generation');
  }


  logger.log(`Generating TTR for transaction ${transactionId}, amount: $${amount_aud} AUD`);
  logger.log('Input data:', JSON.stringify(data, null, 2));

  const supabase = getSupabaseClient();
  logger.log('Supabase client created');

  try {
    // Step 1: Simple check
    logger.log('Step 1: Checking if transaction exists...');
    const { data: simpleCheck, error: simpleError } = await supabase
      .from('transactions')
      .select('id, customer_id, created_at')
      .eq('id', data.transactionId)
      .single();

    logger.log('Simple check result:', {
      found: !!simpleCheck,
      error: simpleError?.message,
      data: simpleCheck,
    });

    if (simpleError) {
      logger.error('Simple check failed:', simpleError);
      throw new Error(`Transaction not found (simple check): ${simpleError.message}`);
    }

    if (!simpleCheck) {
      throw new Error('Transaction not found (no data returned)');
    }

    logger.log('✅ Transaction exists, proceeding to full query...');

    // Step 2: Full query with customer join only
    logger.log('Step 2: Fetching full transaction data with customer info...');
    const { data: transaction, error } = await supabase
      .from('transactions')
      .select(`
        id,
        customer_id,
        amount,
        amount_aud,
        currency,
        created_at,
        requires_ttr,
        ttr_reference,
        ttr_generated_at,
        ttr_submission_deadline,
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
      .eq('id', data.transactionId)
      .single();

    logger.log('Full query result:', {
      found: !!transaction,
      error: error?.message,
      hasCustomer: !!transaction?.customers,
    });

    if (error) {
      logger.error('Full query failed:', error);
      throw new Error(`Failed to fetch transaction details: ${error.message}`);
    }

    if (!transaction) {
      throw new Error('Transaction data is null after successful query');
    }

    if (!transaction.amount_aud) {
      logger.error('Transaction missing amount_aud:', transaction);
      throw new Error('Transaction does not have AUD amount calculated');
    }

    logger.log('✅ Full transaction data retrieved');

    // Step 3: Generate TTR reference
    logger.log('Step 3: Generating TTR reference...');
    const ttrReference = `TTR-${Date.now()}-${data.transactionId.slice(0, 8)}`;
    logger.log('TTR Reference:', ttrReference);

    // Step 4: Calculate deadline
    logger.log('Step 4: Calculating submission deadline...');
    const deadline = calculateTTRDeadline(new Date(data.transactionDate));
    logger.log('Deadline:', deadline.toISOString());

    // Step 5: Update transaction
    logger.log('Step 5: Updating transaction with TTR info...');
    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        ttr_reference: ttrReference,
        ttr_generated_at: new Date().toISOString(),
        ttr_submission_deadline: deadline.toISOString(),
      })
      .eq('id', data.transactionId);



    if (updateError) {
      logger.error('Update failed:', updateError);
      throw new Error(`Failed to update transaction: ${updateError.message}`);
    }

    logger.log('Step 6: Creating audit log...');
    const { error: auditError } = await supabase.from('audit_logs').insert({
      action_type: 'ttr_generated',
      entity_type: 'transaction',
      entity_id: data.transactionId,
      description: `TTR generated for transaction ${data.transactionId}`,
      metadata: {
        ttr_reference: ttrReference,
        amount_aud: transaction.amount_aud,
        original_amount: transaction.amount,
        original_currency: transaction.currency,
        deadline: deadline.toISOString(),
        customer_id: data.customerId,
      },
    });

    if (auditError) {
      logger.error('Failed to create audit log:', auditError);
      // Don't throw - audit log failure shouldn't stop TTR generation
    } else {
      logger.log('✅ Audit log created');
    }

    logger.log('✅ Transaction updated with TTR info');

    // Step 6: Format record
    logger.log('Step 6: Formatting TTR record...');
    transaction.ttr_reference = ttrReference;
    transaction.ttr_generated_at = new Date().toISOString();
    transaction.ttr_submission_deadline = deadline.toISOString();

    const formattedRecord = formatTTRRecord(transaction);
    logger.log('✅ TTR record formatted');

    logger.log('=== generateTTR SUCCESS ===');

    try {
      await sendTTRCreatedAlert({
        transactionId: data.transactionId,
        customerId: data.customerId,
        customerName: data.customerName || 'Unknown Customer',
        transactionAmount: data.amount_aud,
        currency: 'AUD',
        transactionDate: data.transactionDate,
        ttrReference: transaction.ttr_reference,
        deadline: deadline.toISOString(),
      });
      logger.log('✅ TTR generation alert sent');
    } catch (alertError) {
      logger.error('❌ Failed to send TTR alert, but TTR was generated:', alertError);
    }

    return formattedRecord;

  } catch (err: any) {
    logger.error('=== generateTTR FAILED ===');
    logger.error('Error details:', {
      message: err.message,
      stack: err.stack,
      name: err.name,
    });
    throw err;
  }
}


// ✅ Export pending TTRs for AUSTRAC submission
export async function exportPendingTTRs() {
  const supabase = getSupabaseClient();

  const { data: pendingTTRs, error } = await supabase
    .from('transactions')
    .select(`
     id,
      customer_id,
      amount,
      amount_aud,
      currency,
      created_at,
      ttr_reference,
      ttr_generated_at,
      ttr_submission_deadline,
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
    .not('ttr_reference', 'is', null)
    .is('ttr_submitted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch pending TTRs: ${error.message}`);
  }

  if (!pendingTTRs || pendingTTRs.length === 0) {
    return [];
  }

  const invalidTTRs = pendingTTRs.filter(ttr => !ttr.amount_aud);
  if (invalidTTRs.length > 0) {
    logger.error('Found TTRs without amount_aud:', invalidTTRs.map(t => t.id));
    throw new Error(`${invalidTTRs.length} TTRs are missing AUD amounts`);
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
    record.original_amount,
    record.original_currency,
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