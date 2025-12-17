import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
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

  const customerId = req.nextUrl.searchParams.get('customerId');

  if (!customerId) {
    return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
  }

  try {
    // Check for active investigation
    const { data: investigation, error } = await supabase
      .from('edd_investigations')
      .select('id, investigation_number, status, opened_at, customer_edd_id')
      .eq('customer_id', customerId)
      .in('status', ['open', 'awaiting_customer_info', 'under_review', 'escalated'])
      .order('opened_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    return NextResponse.json({
      success: true,
      investigation: investigation || null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check investigation status';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
