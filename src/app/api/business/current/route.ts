import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the customer record
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, business_customer_id')
      .eq('clerk_user_id', userId)
      .single();

    if (customerError || !customer) {
      return NextResponse.json({ business: null });
    }

    // If no business_customer_id, no business exists
    if (!customer.business_customer_id) {
      return NextResponse.json({ business: null });
    }

    // Get the business details
    const { data: business, error: businessError } = await supabase
      .from('business_customers')
      .select('*')
      .eq('id', customer.business_customer_id)
      .single();

    if (businessError || !business) {
      return NextResponse.json({ business: null });
    }

    return NextResponse.json({ business });

  } catch (error) {
    console.error('Error fetching current business:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
