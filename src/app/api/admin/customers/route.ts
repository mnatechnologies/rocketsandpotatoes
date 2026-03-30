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
    const search = rawSearch.replace(/[.,()!]/g, '');
    const VALID_FILTERS = ['all', 'verified', 'pending', 'unverified', 'pep', 'high_risk', 'edd'] as const;
    const filterParam = searchParams.get('filter') || 'all';
    const filter = VALID_FILTERS.includes(filterParam as typeof VALID_FILTERS[number]) ? filterParam : 'all';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '50', 10));
    const offset = (page - 1) * limit;

    // Fetch customers (no embedded join — business_customers FK not discoverable by PostgREST)
    let query = supabase
      .from('customers')
      .select(
        `id, clerk_user_id, email, first_name, last_name, verification_status, monitoring_level, requires_enhanced_dd, is_pep, risk_level, created_at`,
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
    } else if (filter === 'pep') {
      query = query.eq('is_pep', true);
    } else if (filter === 'high_risk') {
      query = query.eq('risk_level', 'high');
    } else if (filter === 'edd') {
      query = query.eq('requires_enhanced_dd', true);
    }

    const { data, error, count } = await query;

    if (error) {
      logger.error('Error fetching customers:', error);
      return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
    }

    const customerIds = (data || []).map((c) => c.id);

    // Fetch transaction aggregates
    const txAggMap = new Map<string, { order_count: number; total_aud: number }>();
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

      for (const row of txRows || []) {
        const existing = txAggMap.get(row.customer_id) || { order_count: 0, total_aud: 0 };
        txAggMap.set(row.customer_id, {
          order_count: existing.order_count + 1,
          total_aud: existing.total_aud + (row.amount_aud || 0),
        });
      }
    }

    const enriched = (data || []).map((c) => {
      const tx = txAggMap.get(c.id);
      return {
        id: c.id,
        clerk_user_id: c.clerk_user_id,
        email: c.email,
        first_name: c.first_name,
        last_name: c.last_name,
        verification_status: c.verification_status,
        monitoring_level: c.monitoring_level,
        requires_enhanced_dd: c.requires_enhanced_dd,
        is_pep: c.is_pep,
        risk_level: c.risk_level,
        created_at: c.created_at,
        order_count: tx?.order_count || 0,
        total_spent_aud: tx?.total_aud || 0,
      };
    });

    const total = count ?? enriched.length;

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
