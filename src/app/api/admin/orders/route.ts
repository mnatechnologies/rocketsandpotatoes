import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/auth/admin';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('ADMIN_ORDERS');

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const VALID_FILTERS = ['all', 'succeeded', 'pending', 'failed', 'awaiting_bank_transfer'] as const;
type OrderFilter = typeof VALID_FILTERS[number];

export async function GET(req: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) return adminCheck.error;

  try {
    const { searchParams } = new URL(req.url);
    const rawSearch = searchParams.get('search') || '';
    const search = rawSearch.replace(/[.,()!]/g, '');
    const filterParam = searchParams.get('filter') || 'all';
    const filter: OrderFilter = VALID_FILTERS.includes(filterParam as OrderFilter)
      ? (filterParam as OrderFilter)
      : 'all';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '50', 10));
    const offset = (page - 1) * limit;

    let query = supabase
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
        fulfillment_status,
        product_details,
        stripe_payment_intent_id,
        created_at,
        customers!inner(id, email, first_name, last_name)
        `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (filter !== 'all') {
      query = query.eq('payment_status', filter);
    }

    if (search) {
      // Search by order ID or customer name/email via OR filter
      // For UUID search, check if it looks like one (starts with hex chars)
      const isIdSearch = /^[0-9a-f-]{4,}/i.test(search);
      if (isIdSearch) {
        query = query.or(
          `id.ilike.${search}%,customers.email.ilike.%${search}%,customers.first_name.ilike.%${search}%,customers.last_name.ilike.%${search}%`
        );
      } else {
        query = query.or(
          `customers.email.ilike.%${search}%,customers.first_name.ilike.%${search}%,customers.last_name.ilike.%${search}%`
        );
      }
    }

    const { data, error, count } = await query;

    if (error) {
      logger.error('Error fetching orders:', error);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    const orders = (data || []).map((tx) => {
      const customerArr = Array.isArray(tx.customers) ? tx.customers : [tx.customers];
      const customer = customerArr[0] || null;

      const items: Array<{ name: string; quantity: number; price: number; weight?: number; purity?: string }> =
        tx.product_details?.items || [];

      const firstItem = items[0] || null;
      const itemsSummary = firstItem
        ? items.length > 1
          ? `${firstItem.name} & ${items.length - 1} more`
          : firstItem.name
        : '—';

      return {
        id: tx.id,
        customer_id: tx.customer_id,
        customer_name: customer
          ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || null
          : null,
        customer_email: customer?.email || null,
        items_summary: itemsSummary,
        item_count: items.length,
        amount_aud: tx.amount_aud,
        payment_method_type: tx.payment_method_type,
        payment_status: tx.payment_status,
        fulfillment_status: tx.fulfillment_status,
        created_at: tx.created_at,
      };
    });

    return NextResponse.json({
      data: orders,
      total: count ?? orders.length,
      page,
      limit,
    });
  } catch (error) {
    logger.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
