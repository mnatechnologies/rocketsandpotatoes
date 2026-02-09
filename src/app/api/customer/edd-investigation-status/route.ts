import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createServerSupabase();

  const customerId = req.nextUrl.searchParams.get('customerId');

  if (!customerId) {
    return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
  }

  // Verify customer belongs to authenticated user
  const { data: customerOwner } = await supabase
    .from('customers')
    .select('clerk_user_id')
    .eq('id', customerId)
    .single();

  if (!customerOwner || customerOwner.clerk_user_id !== userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    // Check for active investigation
    const { data: investigation, error } = await supabase
      .from('edd_investigations')
      .select('id, investigation_number, status, opened_at, customer_edd_id, trigger_reason')
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
    return NextResponse.json({ error: 'Failed to check investigation status' }, { status: 500 });
  }
}
