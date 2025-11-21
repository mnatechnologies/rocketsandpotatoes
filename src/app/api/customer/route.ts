import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { createLogger } from '@/lib/utils/logger';
// import { createServerSupabase } from "@/lib/supabase/server";

const logger = createLogger('CUSTOMER_ME_API');

export async function GET(req: NextRequest) {
  logger.log('Fetching current customer data');

  // Get the authenticated user from Clerk
  const { userId } = await auth();

  if (!userId) {
    logger.log('No authenticated user found');
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  logger.log('Authenticated Clerk user ID:', userId);

  //subject to removal once I actually get createServerSupabase workin with clerk lmao
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

  try {
    // Fetch customer by clerk_user_id
    const { data: customer, error } = await supabase
      .from('customers')
      .select('*')
      .eq('clerk_user_id', userId)
      .single();

    if (error) {
      logger.error('Error fetching customer:', error);
      return NextResponse.json(
        { error: 'Customer not found', details: error },
        { status: 404 }
      );
    }

    if (!customer) {
      logger.log('Customer not found for Clerk user:', userId);
      return NextResponse.json(
        { error: 'Customer not found. Please try signing out and back in.' },
        { status: 404 }
      );
    }

    logger.log('Customer fetched successfully:', customer.email);
    return NextResponse.json(customer);
  } catch (err) {
    logger.error('Exception fetching customer:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err },
      { status: 500 }
    );
  }
}
