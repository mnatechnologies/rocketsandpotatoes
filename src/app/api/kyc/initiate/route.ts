import {NextRequest, NextResponse} from "next/server";
import {createVerificationSession} from "@/lib/stripe/identity";
import { createServerSupabase } from "@/lib/supabase/server";
import {createClient} from "@supabase/supabase-js";

/* eslint-disable */

export async function POST(req: NextRequest) {
  const { customerId } = await (req as any).json();
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
    console.error('[KYC_INITIATE] Error creating verification record:', insertError);
    // Continue anyway - the webhook can still process it
  } else {
    console.log('[KYC_INITIATE] Verification record created:', verificationRecord.id);
  }

  return NextResponse.json({
    verificationSessionId: session.id,
    clientSecret: session.client_secret,
    verificationUrl: session.url,
  });
}
