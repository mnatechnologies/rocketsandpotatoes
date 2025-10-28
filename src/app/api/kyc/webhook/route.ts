import {NextResponse, NextRequest} from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import {processVerificationResult, stripe} from "@/lib/stripe/identity";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase();
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

    await processVerificationResult(session.id, customerId);
  }

  if (event.type === 'identity.verification_session.requires_input') {
    // Handle cases where customer needs to re-submit
    const session = event.data.object;
    const customerId = session.metadata.customer_id;

    await supabase
      .from('customers')
      .update({ verification_status: 'requires_review' })
      .eq('id', customerId);
  }

  return NextResponse.json({ received: true });
}