import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // TODO: Add proper admin role check
  // For now, you can check if userId matches a specific admin ID

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
    .is('review_status', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching flagged transactions:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(transactions || []);
}