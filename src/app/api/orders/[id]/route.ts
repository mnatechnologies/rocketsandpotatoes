import { NextRequest, NextResponse } from 'next/server';
// import { createServerSupabase } from '@/lib/supabase/server';
import {createClient} from "@supabase/supabase-js";
import { auth } from '@clerk/nextjs/server';
import { createLogger } from '@/lib/utils/logger';
/* eslint-disable */

const logger = createLogger('ORDER_API');

export async function GET(
  req: NextRequest,
  { params }: { params: Promise <{ id: string }> }
) {
  const { id: orderId } = await params;
  logger.log('Order fetch request received for ID:', orderId);

  try {
    // Get authenticated user from Clerk
    const { userId } = await auth();
    
    if (!userId) {
      logger.log('Unauthorized - no userId from Clerk');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.log('Authenticated user ID:', userId);

    // const supabase = createServerSupabase();
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

    // Fetch the transaction/order
    const { data: order, error: orderError } = await supabase
      .from('transactions')
      .select(`
        *,
        customers!inner(
          id,
          email,
          first_name,
          last_name,
          clerk_user_id
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError) {
      logger.error('Error fetching order:', orderError);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    if (!order) {
      logger.log('Order not found:', orderId);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Verify the order belongs to the authenticated user
    if (order.customers.clerk_user_id !== userId) {
      logger.log('Unauthorized access attempt - order does not belong to user');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    logger.log('Order found and authorized:', {
      id: order.id,
      amount: order.amount,
      status: order.payment_status,
      customer_id: order.customer_id
    });

    // Format the response
    const response = {
      id: order.id,
      customer_id: order.customer_id,
      transaction_type: order.transaction_type,
      amount: order.amount,
      currency: order.currency,
      product_type: order.product_type,
      product_details: order.product_details,
      payment_method: order.payment_method,
      payment_status: order.payment_status,
      status: order.payment_status,
      stripe_payment_intent_id: order.stripe_payment_intent_id,
      requires_kyc: order.requires_kyc,
      requires_ttr: order.requires_ttr,
      flagged_for_review: order.flagged_for_review,
      created_at: order.created_at,
      updated_at: order.updated_at,
      customer: {
        email: order.customers.email,
        first_name: order.customers.first_name,
        last_name: order.customers.last_name,
      }
    };

    logger.log('Returning order data');

    return NextResponse.json(response);

  } catch (error: any) {
    logger.error('Error in order fetch:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
