import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createLogger } from '@/lib/utils/logger';
import { requireAdmin } from '@/lib/auth/admin';

const logger = createLogger('ADMIN_FULFILLMENT_LIST');

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

export async function GET(req: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) return adminCheck.error;

  try {
    const { searchParams } = new URL(req.url);
    const tab = searchParams.get('tab') || 'pending';
    const days = parseInt(searchParams.get('days') || '90', 10);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    let query = supabase
      .from('transactions')
      .select(`
        id,
        amount,
        amount_aud,
        currency,
        payment_status,
        payment_method_type,
        product_details,
        fulfillment_status,
        ready_at,
        collected_at,
        fulfillment_notes,
        fulfilled_by,
        created_at,
        customer_id,
        customer:customers!inner(
          first_name,
          last_name,
          email
        )
      `)
      .eq('payment_status', 'succeeded')
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: false });

    if (tab === 'pending') {
      query = query.in('fulfillment_status', ['unfulfilled', 'packing']);
    } else if (tab === 'ready') {
      query = query.eq('fulfillment_status', 'ready_for_pickup');
    } else if (tab === 'collected') {
      query = query.eq('fulfillment_status', 'collected');
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Error fetching fulfillment orders:', error);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    // Flatten the customer join (Supabase returns array for joins)
    const orders = (data || []).map((tx) => {
      const cust = Array.isArray(tx.customer) ? tx.customer[0] : tx.customer;
      return {
        id: tx.id,
        amount: tx.amount,
        amount_aud: tx.amount_aud,
        currency: tx.currency,
        payment_method_type: tx.payment_method_type || 'card',
        product_details: tx.product_details,
        fulfillment_status: tx.fulfillment_status,
        ready_at: tx.ready_at,
        collected_at: tx.collected_at,
        fulfillment_notes: tx.fulfillment_notes,
        fulfilled_by: tx.fulfilled_by,
        created_at: tx.created_at,
        customer_name: cust ? `${cust.first_name || ''} ${cust.last_name || ''}`.trim() : 'Unknown',
        customer_email: cust?.email || '',
      };
    });

    return NextResponse.json({ data: orders });
  } catch (error) {
    logger.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
