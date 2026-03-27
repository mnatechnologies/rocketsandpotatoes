import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('ACCOUNT_ORDERS_API');

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
    // Look up customer by clerk_user_id
    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('clerk_user_id', userId)
      .single();

    if (customerError || !customer) {
      logger.log('Customer not found for userId:', userId);
      return NextResponse.json({ orders: [] });
    }

    // Fetch transactions for this customer with bank_transfer_orders join
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('transactions')
      .select(`
        id,
        transaction_type,
        amount,
        amount_aud,
        currency,
        payment_method_type,
        payment_status,
        fulfillment_status,
        product_details,
        created_at,
        ready_at,
        collected_at,
        bank_transfer_orders (
          id,
          reference_code,
          status,
          payment_deadline
        )
      `)
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false });

    if (ordersError) {
      logger.error('Error fetching orders:', ordersError);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    return NextResponse.json({ orders: orders || [] });
  } catch (err) {
    logger.error('Exception in account orders API:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
