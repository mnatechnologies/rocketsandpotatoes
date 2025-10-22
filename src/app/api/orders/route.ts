import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';

// Testing flag - set to true to enable console logging
const TESTING_MODE = process.env.TESTING_MODE === 'true' || true;

function log(...args: any[]) {
  if (TESTING_MODE) {
    console.log('[CREATE_ORDER_API]', ...args);
  }
}

export async function POST(req: NextRequest) {
  log('Order creation request received');

  try {
    // Get authenticated user from Clerk
    const { userId } = await auth();
    
    if (!userId) {
      log('Unauthorized - no userId from Clerk');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    log('Authenticated user ID:', userId);

    const body = await req.json();
    const {
      customerId,
      amount,
      currency = 'AUD',
      productDetails,
      cartItems,
      stripePaymentIntentId,
      paymentMethod = 'card',
    } = body;

    log('Order data:', { customerId, amount, currency, productCount: cartItems?.length });

    // Validate required fields
    if (!customerId || !amount || !stripePaymentIntentId) {
      log('Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: customerId, amount, stripePaymentIntentId' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabase();

    // Verify customer belongs to authenticated user
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, clerk_user_id')
      .eq('id', customerId)
      .single();

    if (customerError || !customer) {
      log('Customer not found:', customerError);
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    if (customer.clerk_user_id !== userId) {
      log('Unauthorized - customer does not belong to user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    log('Customer verified:', customer.id);

    // Determine compliance requirements
    const requiresKYC = amount >= 5000;
    const requiresTTR = amount >= 10000;
    const requiresEnhancedDD = amount >= 50000;

    log('Compliance flags:', { requiresKYC, requiresTTR, requiresEnhancedDD });

    // Create transaction record
    const transactionData = {
      customer_id: customerId,
      transaction_type: 'purchase',
      amount: amount,
      currency: currency,
      product_type: productDetails?.name || 'Multiple items',
      product_details: {
        items: cartItems || [productDetails],
        mainProduct: productDetails,
      },
      stripe_payment_intent_id: stripePaymentIntentId,
      payment_method: paymentMethod,
      payment_status: 'succeeded',
      requires_kyc: requiresKYC,
      requires_ttr: requiresTTR,
      requires_enhanced_dd: requiresEnhancedDD,
      flagged_for_review: false,
    };

    log('Creating transaction record');

    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert(transactionData)
      .select()
      .single();

    if (transactionError) {
      log('Error creating transaction:', transactionError);
      return NextResponse.json(
        { error: 'Failed to create order', details: transactionError },
        { status: 500 }
      );
    }

    log('Transaction created successfully:', transaction.id);

    // Log audit event
    await supabase.from('audit_logs').insert({
      action_type: 'order_created',
      entity_type: 'transaction',
      entity_id: transaction.id,
      description: `Order created for ${currency} ${amount}`,
      metadata: {
        customer_id: customerId,
        amount,
        payment_intent_id: stripePaymentIntentId,
      },
    });

    log('Audit log created');

    return NextResponse.json({
      success: true,
      orderId: transaction.id,
      order: transaction,
    });

  } catch (error: any) {
    log('Error in order creation:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
