import {NextRequest, NextResponse} from "next/server";
import {createVerificationSession} from "@/lib/stripe/identity";
import { createServerSupabase } from "@/lib/supabase/server";
import { createLogger } from "@/lib/utils/logger";
import { auth } from '@clerk/nextjs/server';

/* eslint-disable */

const logger = createLogger('KYC_INITIATE_API');

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { customerId } = await (req as any).json();

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


  const session = await createVerificationSession(customerId);

  // Update customer status to pending
  await supabase
    .from('customers')
    .update({ verification_status: 'pending' })
    .eq('id', customerId);

  const { data: verificationRecord, error: insertError } = await supabase
    .from('identity_verifications')
    .insert({
      customer_id: customerId,
      stripe_verification_session_id: session.id,
      verification_type: 'stripe_identity',
      status: 'processing', // Stripe initial status
    })
    .select()
    .single();

  if (insertError) {
    logger.error('Error creating verification record:', insertError);
    // Continue anyway - the webhook can still process it
  } else {
    logger.log('Verification record created:', verificationRecord.id);
  }

  return NextResponse.json({
    verificationSessionId: session.id,
    clientSecret: session.client_secret,
    verificationUrl: session.url,
  });
}
