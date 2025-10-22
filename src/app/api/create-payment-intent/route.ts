import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Stripe from 'stripe';

// Testing flag - set to true to enable console logging
const TESTING_MODE = process.env.TESTING_MODE === 'true' || true;

function log(...args: any[]) {
  if (TESTING_MODE) {
    console.log('[CREATE_PAYMENT_INTENT_API]', ...args);
  }
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export async function POST(req: NextRequest) {
  log('Payment intent creation request received');

  try {
    // Get authenticated user from Clerk
    const { userId } = await auth();
    
    if (!userId) {
      log('Unauthorized - no userId from Clerk');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    log('Authenticated user ID:', userId);

    const { amount, currency = 'aud', customerId, customerEmail } = await req.json();

    log('Payment intent params:', { amount, currency, customerId });

    // Validate amount
    if (!amount || amount <= 0) {
      log('Invalid amount:', amount);
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Create or retrieve Stripe customer
    let stripeCustomerId: string | undefined;

    if (customerEmail) {
      // Search for existing Stripe customer
      const existingCustomers = await stripe.customers.list({
        email: customerEmail,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        stripeCustomerId = existingCustomers.data[0].id;
        log('Found existing Stripe customer:', stripeCustomerId);
      } else {
        // Create new Stripe customer
        const customer = await stripe.customers.create({
          email: customerEmail,
          metadata: {
            supabase_customer_id: customerId,
            clerk_user_id: userId,
          },
        });
        stripeCustomerId = customer.id;
        log('Created new Stripe customer:', stripeCustomerId);
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
        clerk_user_id: userId,
      },
    });

    log('Payment intent created:', paymentIntent.id);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });

  } catch (error: any) {
    log('Error creating payment intent:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
