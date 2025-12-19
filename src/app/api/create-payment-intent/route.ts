import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Stripe from 'stripe';
import { createLogger } from '@/lib/utils/logger';
import { createClient } from '@supabase/supabase-js';

const logger = createLogger('CREATE_PAYMENT_INTENT_API');

const stripe = new Stripe(process.env.NEXT_STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
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

const MINIMUM_LOCK_REMAINING_SECONDS = 30;

export async function POST(req: NextRequest) {
  logger.log('Payment intent creation request received');


  try {
    // Parse body ONCE - include sessionId
    const { amount, currency, customerId, customerEmail, clerkUserId, sessionId, cartItems } = await req.json();

    const { userId: clerkUserIdFromAuth } = await auth();
    const finalClerkUserId = clerkUserIdFromAuth || clerkUserId;

    logger.log('Request params:', { amount, currency, customerId, finalClerkUserId, sessionId, cartItems });

    // Validate required fields
    if (!amount || amount <= 0) {
      logger.log('Invalid amount:', amount);
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    if (!customerId) {
      logger.log('Missing customerId');
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 });
    }

    // ✅ Validate prices against server locks (single source of truth - NO conversion!)
    if (sessionId) {
      const { data: locks, error: lockError } = await supabase
        .from('price_locks')
        .select('product_id, locked_price_usd, locked_price_aud, currency, fx_rate')
        .eq('session_id', sessionId)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString());

      if (lockError) {
        logger.error('Error fetching price locks:', lockError);
      }

      if (!locks || locks.length === 0) {
        logger.log('No active price locks found for session:', sessionId);
        return NextResponse.json(
          { error: 'Price lock expired. Please refresh prices.' },
          { status: 400 }
        );
      }

      // ✅ Get the currency these prices were locked in
      const lockedCurrency = locks[0]?.currency || 'USD';

      // ✅ Calculate expected total in the LOCKED currency (no conversion!)
      const expectedTotal = locks.reduce((sum, lock) => {
        const cartItem = cartItems?.find((item: { productId: any; }) => item.productId === lock.product_id);

        // SKIP locks for products not in current cart (old locks from previous sessions)
        if (!cartItem) {
          logger.warn(`⚠️ Skipping lock for product ${lock.product_id} - not in current cart`);
          return sum;
        }

        const quantity = cartItem.quantity;

        // Use the appropriate price field based on locked currency
        const price = lockedCurrency === 'AUD' ? lock.locked_price_aud : lock.locked_price_usd;
        return sum + (Number(price) * quantity);
      }, 0);

      // ✅ Ensure submitted currency matches locked currency
      if (currency.toLowerCase() !== lockedCurrency.toLowerCase()) {
        logger.log('Currency mismatch:', {
          submittedCurrency: currency,
          lockedCurrency,
        });
        return NextResponse.json(
          { error: 'Currency mismatch. Please refresh prices and try again.' },
          { status: 400 }
        );
      }

      // ✅ Validate in SAME currency - NO conversion!
      const tolerance = Math.max(0.01, expectedTotal * 0.01);
      if (Math.abs(amount - expectedTotal) > tolerance) {
        logger.log('❌ Price mismatch:', {
          submittedAmount: amount,
          expectedTotal,
          currency: lockedCurrency,
          difference: (amount - expectedTotal).toFixed(2),
          tolerance
        });
        return NextResponse.json(
          { error: 'Price mismatch. Please refresh prices.' },
          { status: 400 }
        );
      }

      logger.log('✅ Price validation passed:', {
        amount,
        expectedTotal,
        currency: lockedCurrency,
        fxRate: locks[0].fx_rate
      });
    }

    // Create or retrieve Stripe customer
    let stripeCustomerId: string | undefined;

    if (customerEmail) {
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
            clerk_user_id: finalClerkUserId,
          },
        });
        stripeCustomerId = customer.id;
        logger.log('Created new Stripe customer:', stripeCustomerId);
      }
    }

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      customer: stripeCustomerId,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        supabase_customer_id: customerId,
        clerk_user_id: finalClerkUserId,
        session_id: sessionId, // Store for webhook reference
      },
    });

    logger.log('Payment intent created:', paymentIntent.id);

    if (sessionId) {
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

      // Find the transaction associated with this session
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .select('id')
        .eq('customer_id', customerId)
        .in('payment_status', ['pending', 'pending_review'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (transaction && !txError) {
        const { error: updateError } = await supabase
          .from('transactions')
          .update({
            stripe_payment_intent_id: paymentIntent.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', transaction.id);

        if (updateError) {
          logger.error('Error updating transaction with payment intent ID:', updateError);
        } else {
          logger.log('Updated transaction with payment intent ID:', transaction.id);
        }
      } else {
        logger.warn('Could not find transaction to update with payment intent ID');
      }
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });

  } catch (error: any) {
    logger.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}