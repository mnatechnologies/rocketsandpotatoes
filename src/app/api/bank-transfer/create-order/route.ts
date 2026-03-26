import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { createLogger } from '@/lib/utils/logger';
import { getBankTransferSettings, validateSettings } from '@/lib/bank-transfer/settings';
import { generateUniqueReference } from '@/lib/bank-transfer/reference';
import { deduplicateLocks } from '@/lib/pricing/deduplicateLocks';

const logger = createLogger('BANK_TRANSFER_CREATE_ORDER');

const stripe = new Stripe(process.env.NEXT_STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
});

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

const MAX_ACTIVE_ORDERS_PER_CUSTOMER = 3;

export async function POST(req: NextRequest) {
  logger.log('Bank transfer order creation request received');

  try {
    // 1. Auth check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const {
      sessionId,
      customerId,
      clerkUserId,
      customerEmail,
      cartItems,
      currency,
      amount,
      marketLossPolicyAccepted,
    } = await req.json();

    logger.log('Request params:', {
      sessionId,
      customerId,
      clerkUserId,
      currency,
      amount,
      cartItemCount: cartItems?.length,
      marketLossPolicyAccepted,
    });

    // 2. Validate marketLossPolicyAccepted
    if (marketLossPolicyAccepted !== true) {
      logger.log('Market loss policy not accepted');
      return NextResponse.json(
        { error: 'You must accept the market loss policy to proceed with bank transfer.' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }
    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }
    if (!customerEmail) {
      return NextResponse.json({ error: 'Customer email is required' }, { status: 400 });
    }
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json({ error: 'Cart items are required' }, { status: 400 });
    }
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // 3. Fetch and validate bank transfer settings
    const settings = await getBankTransferSettings();
    const settingsError = validateSettings(settings);
    if (settingsError) {
      logger.log('Settings validation failed:', settingsError);
      return NextResponse.json({ error: settingsError }, { status: 400 });
    }

    // 4. Verify price locks exist and are active for this session
    const { data: priceLocks, error: lockError } = await supabase
      .from('price_locks')
      .select('*')
      .eq('session_id', sessionId)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString());

    if (lockError) {
      logger.error('Error fetching price locks:', lockError);
      return NextResponse.json(
        { error: 'Failed to verify price locks' },
        { status: 500 }
      );
    }

    if (!priceLocks || priceLocks.length === 0) {
      logger.log('No active price locks found for session:', sessionId);
      return NextResponse.json(
        { error: 'Price lock expired. Please refresh prices.' },
        { status: 400 }
      );
    }

    // 5. Deduplicate locks (race conditions can create multiple active locks per product)
    const uniqueLocks = deduplicateLocks(priceLocks);
    if (uniqueLocks.length < priceLocks.length) {
      logger.warn(`Deduplicated ${priceLocks.length} locks down to ${uniqueLocks.length}`);
    }

    // Calculate order total in AUD from price locks (always use locked_price_aud x quantity)
    let orderTotalAud = 0;
    let amountUsd = 0;

    for (const lock of uniqueLocks) {
      const cartItem = cartItems.find(
        (item: { productId: string }) => item.productId === lock.product_id
      );

      if (!cartItem) {
        logger.warn(`Skipping lock for product ${lock.product_id} - not in current cart`);
        continue;
      }

      orderTotalAud += Number(lock.locked_price_aud) * cartItem.quantity;
      amountUsd += Number(lock.locked_price_usd) * cartItem.quantity;
    }

    if (orderTotalAud <= 0) {
      logger.log('Calculated order total is zero or negative:', orderTotalAud);
      return NextResponse.json(
        { error: 'Invalid order total. Please refresh prices and try again.' },
        { status: 400 }
      );
    }

    logger.log('Order totals calculated:', {
      orderTotalAud,
      amountUsd,
      fxRate: priceLocks[0]?.fx_rate,
    });

    // 6. Calculate deposit amount
    const depositAmountAud = orderTotalAud * (settings.deposit_percentage / 100);

    logger.log('Deposit calculated:', {
      depositPercentage: settings.deposit_percentage,
      depositAmountAud,
    });

    // 7. Rate limit: max 3 active bank_transfer_orders per customer
    const { data: activeOrders, error: activeOrdersError } = await supabase
      .from('bank_transfer_orders')
      .select('id, transaction_id!inner(customer_id)')
      .eq('transaction_id.customer_id', customerId)
      .in('status', ['hold_pending', 'awaiting_transfer']);

    if (activeOrdersError) {
      logger.error('Error checking active orders:', activeOrdersError);
      // Fall through - don't block the order on a rate limit check failure
    }

    if (activeOrders && activeOrders.length >= MAX_ACTIVE_ORDERS_PER_CUSTOMER) {
      logger.log('Rate limit exceeded for customer:', {
        customerId,
        activeOrderCount: activeOrders.length,
      });
      return NextResponse.json(
        { error: `You have reached the maximum of ${MAX_ACTIVE_ORDERS_PER_CUSTOMER} active bank transfer orders. Please complete or cancel an existing order before placing a new one.` },
        { status: 429 }
      );
    }

    // 8. Find or create Stripe customer
    let stripeCustomerId: string | undefined;

    const existingCustomers = await stripe.customers.list({
      email: customerEmail,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      stripeCustomerId = existingCustomers.data[0].id;
      logger.log('Found existing Stripe customer:', stripeCustomerId);
    } else {
      const customer = await stripe.customers.create({
        email: customerEmail,
        metadata: {
          supabase_customer_id: customerId,
          clerk_user_id: userId,
        },
      });
      stripeCustomerId = customer.id;
      logger.log('Created new Stripe customer:', stripeCustomerId);
    }

    // 9. Create Stripe PaymentIntent (manual capture for deposit hold)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(depositAmountAud * 100), // Convert to cents
      currency: 'aud',
      capture_method: 'manual',
      customer: stripeCustomerId,
      metadata: {
        session_id: sessionId,
        customer_id: customerId,
        clerk_user_id: userId,
        type: 'bank_transfer_deposit',
        order_total_aud: orderTotalAud.toString(),
      },
    });

    logger.log('Payment intent created:', paymentIntent.id);

    // 10. Create transaction record
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        customer_id: customerId,
        transaction_type: 'purchase',
        amount: amountUsd,
        amount_aud: orderTotalAud,
        currency: 'USD',
        payment_method_type: 'bank_transfer',
        payment_status: 'pending',
        stripe_payment_intent_id: paymentIntent.id,
        product_type: cartItems[0]?.name || 'bullion',
        product_details: {
          items: cartItems,
          displayCurrency: currency,
          lockedFxRate: priceLocks[0]?.fx_rate,
          amountInUSD: amountUsd,
          amountInAUD: orderTotalAud,
        },
        metadata: { session_id: sessionId },
      })
      .select()
      .single();

    if (txError || !transaction) {
      logger.error('Error creating transaction:', txError);
      // Attempt to cancel the payment intent since the transaction failed
      try {
        await stripe.paymentIntents.cancel(paymentIntent.id);
        logger.log('Cancelled payment intent after transaction failure:', paymentIntent.id);
      } catch (cancelError) {
        logger.error('Failed to cancel payment intent:', cancelError);
      }
      return NextResponse.json(
        { error: 'Failed to create transaction record' },
        { status: 500 }
      );
    }

    logger.log('Transaction created:', transaction.id);

    // 11. Generate unique reference code and create bank_transfer_order record
    const referenceCode = await generateUniqueReference();
    logger.log('Reference code generated:', referenceCode);

    const { data: bankTransferOrder, error: btoError } = await supabase
      .from('bank_transfer_orders')
      .insert({
        transaction_id: transaction.id,
        reference_code: referenceCode,
        status: 'hold_pending',
        deposit_percentage: settings.deposit_percentage,
        deposit_amount_aud: depositAmountAud,
        stripe_hold_intent_id: paymentIntent.id,
        hold_status: 'pending',
        bank_name: settings.bank_name,
        bsb: settings.bsb,
        account_number: settings.account_number,
        account_name: settings.account_name,
        payid_identifier: settings.payid_identifier,
        payid_type: settings.payid_type,
        payment_deadline: new Date(
          Date.now() + settings.payment_window_hours * 3600000
        ).toISOString(),
        market_loss_policy_accepted: true,
        market_loss_policy_accepted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (btoError || !bankTransferOrder) {
      logger.error('Error creating bank transfer order:', btoError);
      // Attempt cleanup: cancel payment intent
      try {
        await stripe.paymentIntents.cancel(paymentIntent.id);
        logger.log('Cancelled payment intent after bank transfer order failure:', paymentIntent.id);
      } catch (cancelError) {
        logger.error('Failed to cancel payment intent:', cancelError);
      }
      return NextResponse.json(
        { error: 'Failed to create bank transfer order' },
        { status: 500 }
      );
    }

    logger.log('Bank transfer order created:', bankTransferOrder.id);

    // 12. Return response
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      bankTransferOrderId: bankTransferOrder.id,
      depositAmountAud,
      orderTotalAud,
    });
  } catch (error: any) {
    logger.error('Error creating bank transfer order:', error);
    return NextResponse.json(
      { error: 'Failed to create bank transfer order' },
      { status: 500 }
    );
  }
}
