import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('ACCOUNT_PROFILE_API');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: customer, error } = await supabaseAdmin
      .from('customers')
      .select(`
        id,
        email,
        first_name,
        last_name,
        source_of_funds,
        occupation,
        employer,
        verification_status,
        verification_level,
        customer_type,
        created_at
      `)
      .eq('clerk_user_id', userId)
      .single();

    if (error || !customer) {
      logger.log('No customer record for userId:', userId);
      return NextResponse.json({ customer: null });
    }

    return NextResponse.json({ customer });
  } catch (err) {
    logger.error('Exception in account profile API:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
