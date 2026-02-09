import { NextRequest, NextResponse } from 'next/server';
import { retrieveVerificationSession, processVerificationResult, stripe } from '@/lib/stripe/identity';
import { createLogger } from '@/lib/utils/logger';
import { auth } from '@clerk/nextjs/server';
import { createServerSupabase } from '@/lib/supabase/server';

const logger = createLogger('VERIFICATION_STATUS_API');

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get('customerId');

  if (!customerId) {
    return NextResponse.json({ error: 'Customer ID required' }, { status: 400 });
  }

  const supabase = await createServerSupabase();

  // Verify customer belongs to authenticated user
  const { data: customerOwner } = await supabase
    .from('customers')
    .select('clerk_user_id')
    .eq('id', customerId)
    .single();

  if (!customerOwner || customerOwner.clerk_user_id !== userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    // Get customer's current status
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('verification_status, verification_level, last_verified_at')
      .eq('id', customerId)
      .single();

    if (customerError) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // If status is pending, check Stripe for real-time status
    if (customer.verification_status === 'pending') {
      logger.log('Customer pending, checking Stripe...');

      // Find the most recent verification session for this customer
      const { data: verificationSession, error: sessionError } = await supabase
        .from('identity_verifications')
        .select('stripe_verification_session_id, status')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!sessionError && verificationSession?.stripe_verification_session_id) {
        const sessionId = verificationSession.stripe_verification_session_id;

        logger.log('Checking session:', sessionId);

        try {
          // Retrieve real-time status from Stripe
          const stripeSession = await stripe.identity.verificationSessions.retrieve(sessionId);

          logger.log('Stripe status:', stripeSession.status);

          // If Stripe shows verified but DB doesn't, update it
          if (stripeSession.status === 'verified' && customer.verification_status !== 'verified') {
            logger.log('Stripe verified, updating database...');

            // Process the verification result (updates DB)
            await processVerificationResult(sessionId, customerId);

            // Return updated status
            return NextResponse.json({
              verification_status: 'verified',
              verification_level: 'stripe_identity',
              last_verified_at: new Date().toISOString(),
            });
          }

          // If Stripe shows requires_input, update accordingly
          if (stripeSession.status === 'requires_input') {
            await supabase
              .from('customers')
              .update({ verification_status: 'requires_review' })
              .eq('id', customerId);

            return NextResponse.json({
              verification_status: 'requires_review',
              verification_level: customer.verification_level,
              last_verified_at: customer.last_verified_at,
            });
          }

          // Still processing - return pending
          return NextResponse.json(customer);
        } catch (stripeError) {
          logger.error('Stripe API error:', stripeError);
          // Fall back to database status if Stripe call fails
          return NextResponse.json(customer);
        }
      }
    }

    // Return database status (for verified/rejected/etc)
    return NextResponse.json(customer);
  } catch (err) {
    logger.error('Error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}