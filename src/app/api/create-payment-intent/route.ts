import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Stripe from 'stripe';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('CREATE_PAYMENT_INTENT_API');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

export async function POST(req: NextRequest) {
  logger.log('Payment intent creation request received');

  try {
    const { amount, currency = 'aud', customerId, customerEmail, clerkUserId } = await req.json();

    // Optional: Try to get Clerk userId, but don't require it
    const { userId: clerkUserIdFromAuth } = await auth();
    const finalClerkUserId = clerkUserIdFromAuth || clerkUserId;

    logger.log('Request params:', { amount, currency, customerId, finalClerkUserId });

    // Validate required fields
    if (!amount || amount <= 0) {
      logger.log('Invalid amount:', amount);
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    if (!customerId) {
      logger.log('Missing customerId');
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 });
    }


    logger.log('Authenticated user ID:', finalClerkUserId, customerId);

    logger.log('Payment intent params:', { amount, currency, customerId });

    // Validate amount
    if (!amount || amount <= 0) {
      logger.log('Invalid amount:', amount);
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
        logger.log('Found existing Stripe customer:', stripeCustomerId);
      } else {
        // Create new Stripe customer
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
      },
    });

    logger.log('Payment intent created:', paymentIntent.id);

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
