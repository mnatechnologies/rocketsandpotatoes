import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/auth/admin';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('ADMIN_CUSTOMERS');

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(req: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) return adminCheck.error;

  try {
    const { searchParams } = new URL(req.url);
    const rawSearch = searchParams.get('search') || '';
    // Sanitize search to prevent PostgREST filter injection (strip special chars used in filter syntax)
    const search = rawSearch.replace(/[.,()!]/g, '');
    const VALID_FILTERS = ['all', 'verified', 'pending', 'unverified', 'business'] as const;
    const filterParam = searchParams.get('filter') || 'all';
    const filter = VALID_FILTERS.includes(filterParam as typeof VALID_FILTERS[number]) ? filterParam : 'all';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '50', 10));
    const offset = (page - 1) * limit;

    let query = supabase
      .from('customers')
      .select(
        `
        id,
        clerk_user_id,
        email,
        first_name,
        last_name,
        verification_status,
        monitoring_level,
        requires_enhanced_dd,
        created_at,
        business_customers(id, business_name)
        `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(
        `email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`
      );
    }

    if (filter === 'verified') {
      query = query.eq('verification_status', 'verified');
    } else if (filter === 'pending') {
      query = query.eq('verification_status', 'pending');
    } else if (filter === 'unverified') {
      query = query.eq('verification_status', 'unverified');
    }
    // 'business' filter handled post-fetch since it requires join inspection

    const { data, error, count } = await query;

    if (error) {
      logger.error('Error fetching customers:', error);
      return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
    }

    let customers = (data || []).map((c) => {
      const bizArr = Array.isArray(c.business_customers) ? c.business_customers : [];
      const biz = bizArr[0] || null;
      return {
        id: c.id,
        clerk_user_id: c.clerk_user_id,
        email: c.email,
        first_name: c.first_name,
        last_name: c.last_name,
        verification_status: c.verification_status,
        monitoring_level: c.monitoring_level,
        requires_enhanced_dd: c.requires_enhanced_dd,
        created_at: c.created_at,
        is_business: !!biz,
        business_name: biz?.business_name || null,
      };
    });

    if (filter === 'business') {
      customers = customers.filter((c) => c.is_business);
    }

    // Fetch transaction aggregates for these customer IDs
    const customerIds = customers.map((c) => c.id);

    let txData: Array<{ customer_id: string; order_count: number; total_aud: number }> = [];
    if (customerIds.length > 0) {
      const { data: txRows, error: txError } = await supabase
        .from('transactions')
        .select('customer_id, amount_aud')
        .in('customer_id', customerIds)
        .eq('payment_status', 'succeeded')
        .limit(5000);

      if (txError) {
        logger.error('Error fetching transaction aggregates:', txError);
      }

      if (txRows) {
        const aggMap = new Map<string, { order_count: number; total_aud: number }>();
        for (const row of txRows) {
          const existing = aggMap.get(row.customer_id) || { order_count: 0, total_aud: 0 };
          aggMap.set(row.customer_id, {
            order_count: existing.order_count + 1,
            total_aud: existing.total_aud + (row.amount_aud || 0),
          });
        }
        txData = Array.from(aggMap.entries()).map(([customer_id, agg]) => ({
          customer_id,
          ...agg,
        }));
      }
    }

    const txMap = new Map(txData.map((t) => [t.customer_id, t]));
    const enriched = customers.map((c) => {
      const tx = txMap.get(c.id);
      return {
        ...c,
        order_count: tx?.order_count || 0,
        total_spent_aud: tx?.total_aud || 0,
      };
    });

    // For business filter applied post-fetch, use filtered count instead of DB count
    const total = filter === 'business' ? enriched.length : (count ?? enriched.length);

    return NextResponse.json({
      data: enriched,
      total,
      page,
      limit,
    });
  } catch (error) {
    logger.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
