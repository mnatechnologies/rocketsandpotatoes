import { createLogger } from '@/lib/utils/logger';
import { getAuthenticatedClient } from '@/lib/xero/client';
import { SupabaseClient } from '@supabase/supabase-js';

const logger = createLogger('XERO_BANK_MATCHING');

const REFERENCE_PATTERN = /ANB-[A-Z0-9]{6}/i;

export interface MatchResult {
  ordersMatched: number;
  amountMismatches: number;
  unmatched: number;
  errors: string[];
}

interface OpenOrder {
  id: string;
  reference_code: string;
  transaction_id: string;
}

interface TransactionAmount {
  id: string;
  amount_aud: number;
}

/**
 * Extracts an ANB reference code (format ANB-XXXXXX) from arbitrary text.
 * Returns the reference in uppercase, or null if none found.
 */
export function extractReferenceCode(text: string): string | null {
  const match = text.match(REFERENCE_PATTERN);
  if (!match) return null;
  return match[0].toUpperCase();
}

/**
 * Checks whether two monetary amounts match when rounded to 2 decimal places.
 * Returns false if either amount is zero or negative.
 */
export function isAmountMatch(xeroAmount: number, orderAmount: number): boolean {
  if (xeroAmount <= 0 || orderAmount <= 0) return false;
  return (
    Math.round(xeroAmount * 100) === Math.round(orderAmount * 100)
  );
}

/**
 * Fetches unreconciled RECEIVE bank transactions from Xero and matches them
 * against open bank transfer orders using reference codes and amounts.
 *
 * Updates matched orders in `bank_transfer_orders` and logs to `audit_logs`.
 */
export async function matchBankTransfers(
  supabase: SupabaseClient
): Promise<MatchResult> {
  const result: MatchResult = {
    ordersMatched: 0,
    amountMismatches: 0,
    unmatched: 0,
    errors: [],
  };

  // 1. Get authenticated Xero client
  const authResult = await getAuthenticatedClient(supabase);
  if (!authResult) {
    logger.warn('No active Xero connection - skipping bank transfer matching');
    return result;
  }
  const { xero, tenantId } = authResult;

  // 2. Fetch open orders awaiting transfer that haven't been matched yet
  const { data: openOrders, error: ordersError } = await supabase
    .from('bank_transfer_orders')
    .select('id, reference_code, transaction_id')
    .eq('status', 'awaiting_transfer')
    .is('xero_match_status', null);

  if (ordersError) {
    const msg = `Failed to fetch open orders: ${ordersError.message}`;
    logger.error(msg);
    result.errors.push(msg);
    return result;
  }

  if (!openOrders || openOrders.length === 0) {
    logger.log('No open orders to match');
    return result;
  }

  logger.log(`Found ${openOrders.length} open order(s) to match`);

  // 3. Fetch AUD amounts from the transactions table for each open order
  const transactionIds = openOrders.map((o: OpenOrder) => o.transaction_id);
  const { data: transactions, error: txError } = await supabase
    .from('transactions')
    .select('id, amount_aud')
    .in('id', transactionIds);

  if (txError) {
    const msg = `Failed to fetch transaction amounts: ${txError.message}`;
    logger.error(msg);
    result.errors.push(msg);
    return result;
  }

  // Build a lookup: reference_code -> { orderId, amount }
  const amountByTxId = new Map<string, number>();
  for (const tx of (transactions ?? []) as TransactionAmount[]) {
    amountByTxId.set(tx.id, tx.amount_aud);
  }

  const orderLookup = new Map<
    string,
    { orderId: string; amount: number; transactionId: string }
  >();
  for (const order of openOrders as OpenOrder[]) {
    const amount = amountByTxId.get(order.transaction_id);
    if (amount !== undefined) {
      orderLookup.set(order.reference_code, {
        orderId: order.id,
        amount,
        transactionId: order.transaction_id,
      });
    }
  }

  // 4. Query Xero for unreconciled RECEIVE bank transactions from the last 48 hours
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000);
  let xeroTransactions;
  try {
    const response = await xero.accountingApi.getBankTransactions(
      tenantId,
      since,
      'Type=="RECEIVE"&&IsReconciled==false'
    );
    xeroTransactions = response.body?.bankTransactions ?? [];
  } catch (err) {
    const msg = `Xero API error fetching bank transactions: ${err instanceof Error ? err.message : String(err)}`;
    logger.error(msg);
    result.errors.push(msg);
    return result;
  }

  logger.log(`Fetched ${xeroTransactions.length} unreconciled RECEIVE transaction(s) from Xero`);

  // 5. Match each Xero transaction against open orders
  const matchedRefs = new Set<string>();

  for (const bt of xeroTransactions) {
    // Look for ANB reference in the transaction reference field and first line item description
    const textsToSearch: string[] = [];
    if (bt.reference) textsToSearch.push(bt.reference);
    if (bt.lineItems?.[0]?.description) textsToSearch.push(bt.lineItems[0].description);

    let refCode: string | null = null;
    for (const text of textsToSearch) {
      refCode = extractReferenceCode(text);
      if (refCode) break;
    }

    if (!refCode) continue;
    if (matchedRefs.has(refCode)) continue; // Already processed this ref in this run

    const order = orderLookup.get(refCode);
    if (!order) continue;

    matchedRefs.add(refCode);

    const xeroAmount = bt.total ?? 0;
    const now = new Date().toISOString();

    if (isAmountMatch(xeroAmount, order.amount)) {
      // Exact match
      const { error: updateError } = await supabase
        .from('bank_transfer_orders')
        .update({
          xero_match_status: 'matched',
          xero_matched_at: now,
          xero_bank_transaction_id: bt.bankTransactionID,
          xero_match_amount: xeroAmount,
        })
        .eq('id', order.orderId);

      if (updateError) {
        const msg = `Failed to update order ${order.orderId} as matched: ${updateError.message}`;
        logger.error(msg);
        result.errors.push(msg);
      } else {
        result.ordersMatched++;
        logger.log(`Matched order ${refCode} - Xero amount $${xeroAmount}`);
      }

      await supabase.from('audit_logs').insert({
        action_type: 'xero_bank_transfer_matched',
        entity_type: 'bank_transfer_order',
        entity_id: order.orderId,
        description: `Xero bank transfer matched for ${refCode}: $${xeroAmount} AUD`,
        metadata: {
          reference_code: refCode,
          xero_bank_transaction_id: bt.bankTransactionID,
          xero_amount: xeroAmount,
          order_amount: order.amount,
          transaction_id: order.transactionId,
        },
        created_at: now,
      });
    } else {
      // Amount mismatch
      const { error: updateError } = await supabase
        .from('bank_transfer_orders')
        .update({
          xero_match_status: 'amount_mismatch',
          xero_matched_at: now,
          xero_bank_transaction_id: bt.bankTransactionID,
          xero_match_amount: xeroAmount,
        })
        .eq('id', order.orderId);

      if (updateError) {
        const msg = `Failed to update order ${order.orderId} as amount_mismatch: ${updateError.message}`;
        logger.error(msg);
        result.errors.push(msg);
      } else {
        result.amountMismatches++;
        logger.warn(
          `Amount mismatch for ${refCode}: Xero $${xeroAmount} vs order $${order.amount}`
        );
      }

      await supabase.from('audit_logs').insert({
        action_type: 'xero_bank_transfer_amount_mismatch',
        entity_type: 'bank_transfer_order',
        entity_id: order.orderId,
        description: `Xero amount mismatch for ${refCode}: Xero $${xeroAmount} vs order $${order.amount}`,
        metadata: {
          reference_code: refCode,
          xero_bank_transaction_id: bt.bankTransactionID,
          xero_amount: xeroAmount,
          order_amount: order.amount,
          transaction_id: order.transactionId,
        },
        created_at: now,
      });
    }
  }

  // Count unmatched orders (those with a reference that was never found in Xero)
  result.unmatched = orderLookup.size - matchedRefs.size;

  logger.log(
    `Bank transfer matching complete: ${result.ordersMatched} matched, ` +
    `${result.amountMismatches} mismatches, ${result.unmatched} unmatched, ` +
    `${result.errors.length} errors`
  );

  return result;
}
