import { NextRequest, NextResponse } from 'next/server';
// import { createServerSupabase } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('CREATE_ORDER_API');

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

export async function POST(req: NextRequest) {
  logger.log('Order creation request received');

  try {
    // Get authenticated user from Clerk
    const { userId } = await auth();
    
    if (!userId) {
      logger.log('Unauthorized - no userId from Clerk');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.log('Authenticated user ID:', userId);

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

    logger.log('Order data:', { customerId, amount, currency, productCount: cartItems?.length });

    // Validate required fields
    if (!customerId || !amount || !stripePaymentIntentId) {
      logger.log('Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: customerId, amount, stripePaymentIntentId' },
        { status: 400 }
      );
    }


    // Verify customer belongs to authenticated user
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, clerk_user_id')
      .eq('id', customerId)
      .single();

    if (customerError || !customer) {
      logger.error('Customer not found:', customerError);
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    if (customer.clerk_user_id !== userId) {
      logger.log('Unauthorized - customer does not belong to user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    logger.log('Customer verified:', customer.id);

    // Determine compliance requirements
    const requiresKYC = amount >= 5000;
    const requiresTTR = amount >= 10000;
    const requiresEnhancedDD = amount >= 50000;

    logger.log('Compliance flags:', { requiresKYC, requiresTTR, requiresEnhancedDD });

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

    logger.log('Creating transaction record');

    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert(transactionData)
      .select()
      .single();

    if (transactionError) {
      logger.error('Error creating transaction:', transactionError);
      return NextResponse.json(
        { error: 'Failed to create order', details: transactionError },
        { status: 500 }
      );
    }

    logger.log('Transaction created successfully:', transaction.id);

    try {
      // Fetch customer details
      const { data: customerData } = await supabase
        .from('customers')
        .select('email, first_name, last_name')
        .eq('id', customerId)
        .single();

      if (customerData) {
        // Format items for email
        const emailItems = cartItems.map((item: any) => ({
          name: item.name,
          quantity: item.quantity || 1,
          price: item.price * (item.quantity || 1),
          weight: item.weight,
          purity: item.purity,
        }));

        // Send email notification
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-order-confirmation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderNumber: transaction.id,
            customerName: `${customerData.first_name} ${customerData.last_name}`,
            customerEmail: customerData.email,
            orderDate: new Date().toLocaleDateString('en-AU', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
            items: emailItems,
            subtotal: amount,
            total: amount,
            currency: currency,
            paymentMethod: paymentMethod === 'card' ? 'Credit/Debit Card' : paymentMethod,
            requiresKYC: requiresKYC,
            requiresTTR: requiresTTR,
          }),
        });

        logger.log('Order confirmation email sent to:', customerData.email);
      }
    } catch (emailError) {
      // Don't fail the order if email fails
      logger.error('Failed to send confirmation email:', emailError);
    }

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

    logger.log('Audit log created');

    return NextResponse.json({
      success: true,
      orderId: transaction.id,
      order: transaction,
    });

  } catch (error: any) {
    logger.error('Error in order creation:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
