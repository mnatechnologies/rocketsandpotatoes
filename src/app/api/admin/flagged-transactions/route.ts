import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createLogger } from "@/lib/utils/logger";
import { requireAdmin } from '@/lib/auth/admin';

const logger = createLogger('flagged_transactions')

export async function GET(req: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) return adminCheck.error;

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

  const { data: transactions, error } = await supabase
    .from('transactions')
    .select(`
      *,
      customer:customers(
        first_name,
        last_name,
        email,
        verification_status,
        risk_level
      )
    `)
    .eq('flagged_for_review', true)
    .or('review_status.is.null,review_status.eq.pending')
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Error fetching flagged transactions:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(transactions || []);
}