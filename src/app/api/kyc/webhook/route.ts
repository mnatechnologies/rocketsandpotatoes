import {NextResponse, NextRequest} from "next/server";
//import { createServerSupabase } from "@/lib/supabase/server";
import {processVerificationResult, processUBOVerificationResult, stripe} from "@/lib/stripe/identity";
import {createClient} from "@supabase/supabase-js";
import { createLogger } from "@/lib/utils/logger";

const logger = createLogger('STRIPE_WEBHOOK')

export async function POST(req: NextRequest) {
  //const supabase = await createServerSupabase();

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
  const sig = (req as any).headers.get('stripe-signature')!;
  const body = await (req as any).text();

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_IDENTITY_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  if (event.type === 'identity.verification_session.verified') {
    const session = event.data.object;
    const customerId = session.metadata.customer_id;
    const beneficialOwnerId = session.metadata.beneficial_owner_id;
    const businessCustomerId = session.metadata.business_customer_id;

    // Check if this is a UBO verification or regular customer verification
    if (beneficialOwnerId && businessCustomerId) {
      // UBO Verification
      logger.log('[KYC_WEBHOOK] UBO verification completed');
      logger.log('[KYC_WEBHOOK] Beneficial Owner ID:', beneficialOwnerId);
      logger.log('[KYC_WEBHOOK] Business Customer ID:', businessCustomerId);
      logger.log('[KYC_WEBHOOK] Session ID:', session.id);
      logger.log('[KYC_WEBHOOK] Timestamp:', new Date().toISOString());

      await processUBOVerificationResult(session.id, beneficialOwnerId, businessCustomerId);

      logger.log('[KYC_WEBHOOK] UBO status updated');
    } else if (customerId) {
      // Regular Customer Verification
      logger.log('[KYC_WEBHOOK] Verification completed for customer:', customerId);
      logger.log('[KYC_WEBHOOK] Session ID:', session.id);
      logger.log('[KYC_WEBHOOK] Timestamp:', new Date().toISOString());

      await processVerificationResult(session.id, customerId);

      logger.log('[KYC_WEBHOOK] Customer status updated to verified');
    }
  }

  if (event.type === 'identity.verification_session.requires_input') {
    const session = event.data.object;
    const customerId = session.metadata.customer_id;
    const beneficialOwnerId = session.metadata.beneficial_owner_id;

    // Handle requires_input for both customer and UBO verifications
    if (beneficialOwnerId) {
      await supabase
        .from('beneficial_owners')
        .update({ verification_status: 'requires_review' })
        .eq('id', beneficialOwnerId);
    } else if (customerId) {
      await supabase
        .from('customers')
        .update({ verification_status: 'requires_review' })
        .eq('id', customerId);
    }
  }

  return NextResponse.json({ received: true });
}