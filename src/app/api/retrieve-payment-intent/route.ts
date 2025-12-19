
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('RETRIEVE_PAYMENT_INTENT');
const stripe = new Stripe(process.env.NEXT_STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

export async function POST(req: NextRequest) {
  try {
    const { paymentIntentId } = await req.json();

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      );
    }

    logger.log('Retrieving payment intent:', paymentIntentId);

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      status: paymentIntent.status,
    });

  } catch (error: any) {
    logger.error('Error retrieving payment intent:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve payment intent' },
      { status: 500 }
    );
  }
}