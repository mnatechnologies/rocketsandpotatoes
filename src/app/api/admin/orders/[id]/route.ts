import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/auth/admin';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('ADMIN_ORDERS_DETAIL');

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) return adminCheck.error;

  const { id } = await params;
  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
  }

  try {
    const [txResult, btResult, auditResult] = await Promise.all([
      supabase
        .from('transactions')
        .select(
          `
          id,
          customer_id,
          transaction_type,
          amount,
          amount_aud,
          currency,
          payment_method_type,
          payment_status,
          stripe_payment_intent_id,
          product_details,
          requires_kyc,
          requires_ttr,
          requires_enhanced_dd,
          flagged_for_review,
          review_status,
          review_notes,
          fulfillment_status,
          ready_at,
          collected_at,
          fulfillment_notes,
          payment_cardholder_name,
          payment_name_mismatch,
          payment_name_mismatch_severity,
          created_at,
          customers!inner(id, email, first_name, last_name, verification_status)
          `
        )
        .eq('id', id)
        .single(),

      supabase
        .from('bank_transfer_orders')
        .select(
          `
          id,
          transaction_id,
          reference_code,
          status,
          hold_status,
          hold_captured_amount,
          deposit_percentage,
          deposit_amount_aud,
          payment_deadline,
          confirmed_at,
          confirmed_by,
          confirmation_notes
          `
        )
        .eq('transaction_id', id)
        .maybeSingle(),

      supabase
        .from('audit_logs')
        .select('id, action, entity_type, entity_id, metadata, created_at')
        .eq('entity_id', id)
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

    if (txResult.error) {
      if (txResult.error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      logger.error('Error fetching transaction:', txResult.error);
      return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
    }

    const tx = txResult.data;
    const customerArr = Array.isArray(tx.customers) ? tx.customers : [tx.customers];
    const customer = customerArr[0] || null;

    const items: Array<{ name: string; quantity: number; price: number; weight?: number; purity?: string }> =
      tx.product_details?.items || [];

    const fxRate =
      tx.amount && tx.amount > 0 && tx.amount_aud
        ? tx.amount_aud / tx.amount
        : null;

    return NextResponse.json({
      transaction: {
        id: tx.id,
        customer_id: tx.customer_id,
        transaction_type: tx.transaction_type,
        amount: tx.amount,
        amount_aud: tx.amount_aud,
        currency: tx.currency,
        fx_rate: fxRate,
        payment_method_type: tx.payment_method_type,
        payment_status: tx.payment_status,
        stripe_payment_intent_id: tx.stripe_payment_intent_id,
        items,
        requires_kyc: tx.requires_kyc,
        requires_ttr: tx.requires_ttr,
        requires_enhanced_dd: tx.requires_enhanced_dd,
        flagged_for_review: tx.flagged_for_review,
        review_status: tx.review_status,
        review_notes: tx.review_notes,
        fulfillment_status: tx.fulfillment_status,
        ready_at: tx.ready_at,
        collected_at: tx.collected_at,
        fulfillment_notes: tx.fulfillment_notes,
        payment_cardholder_name: tx.payment_cardholder_name,
        payment_name_mismatch: tx.payment_name_mismatch,
        payment_name_mismatch_severity: tx.payment_name_mismatch_severity,
        created_at: tx.created_at,
      },
      customer: customer
        ? {
            id: customer.id,
            email: customer.email,
            first_name: customer.first_name,
            last_name: customer.last_name,
            verification_status: customer.verification_status,
          }
        : null,
      bank_transfer: btResult.data || null,
      audit_logs: auditResult.data || [],
    });
  } catch (error) {
    logger.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
