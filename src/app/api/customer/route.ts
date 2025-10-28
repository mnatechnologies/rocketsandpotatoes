import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
// import { createServerSupabase } from "@/lib/supabase/server";

const TESTING_MODE = process.env.TESTING_MODE === 'true' || true;

function log(...args: any[]) {
  if (TESTING_MODE) {
    console.log('[CUSTOMER_ME_API]', ...args);
  }
}

export async function GET(req: NextRequest) {
  log('Fetching current customer data');

  // Get the authenticated user from Clerk
  const { userId } = await auth();

  if (!userId) {
    log('No authenticated user found');
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  log('Authenticated Clerk user ID:', userId);

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
      log('Error fetching customer:', error);
      return NextResponse.json(
        { error: 'Customer not found', details: error },
        { status: 404 }
      );
    }

    if (!customer) {
      log('Customer not found for Clerk user:', userId);
      return NextResponse.json(
        { error: 'Customer not found. Please try signing out and back in.' },
        { status: 404 }
      );
    }

    log('Customer fetched successfully:', customer.email);
    return NextResponse.json(customer);
  } catch (err) {
    log('Exception fetching customer:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err },
      { status: 500 }
    );
  }
}
