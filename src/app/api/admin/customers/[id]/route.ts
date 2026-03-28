import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/auth/admin';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('ADMIN_CUSTOMER_DETAIL');

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) return adminCheck.error;

  try {
    const { id } = await params;

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json({ error: 'Invalid customer ID' }, { status: 400 });
    }

    // Fetch customer base record
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select(
        `
        id,
        clerk_user_id,
        email,
        first_name,
        last_name,
        source_of_funds,
        occupation,
        employer,
        verification_status,
        verification_level,
        monitoring_level,
        requires_enhanced_dd,
        is_pep,
        is_sanctioned,
        risk_score,
        risk_level,
        customer_type,
        created_at
        `
      )
      .eq('id', id)
      .single();

    if (customerError || !customer) {
      logger.error('Customer not found:', customerError);
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Parallel fetches for all related data
    const [
      transactionsResult,
      verificationsResult,
      eddResult,
      sanctionsResult,
    ] = await Promise.all([
      supabase
        .from('transactions')
        .select(
          `
          id,
          amount,
          amount_aud,
          currency,
          payment_status,
          payment_method_type,
          product_details,
          fulfillment_status,
          created_at
          `
        )
        .eq('customer_id', id)
        .order('created_at', { ascending: false }),

      supabase
        .from('identity_verifications')
        .select('id, verification_type, status, created_at')
        .eq('customer_id', id)
        .order('created_at', { ascending: false }),

      supabase
        .from('edd_investigations')
        .select('id, status, created_at')
        .eq('customer_id', id)
        .order('created_at', { ascending: false }),

      supabase
        .from('sanctions_screenings')
        .select('id, is_match, match_score, screened_name, screening_service, status, screening_type, created_at')
        .eq('customer_id', id)
        .order('created_at', { ascending: false }),
    ]);

    return NextResponse.json({
      customer,
      transactions: transactionsResult.data || [],
      identity_verifications: verificationsResult.data || [],
      edd_investigations: eddResult.data || [],
      sanctions_screenings: sanctionsResult.data || [],
    });
  } catch (error) {
    logger.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
