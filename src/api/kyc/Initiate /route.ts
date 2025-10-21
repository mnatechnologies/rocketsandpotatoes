import {NextRequest, NextResponse} from "next/server";
import {createVerificationSession} from "@/lib/stripe/identity";
import { createServerSupabase } from "@/lib/supabase/server";
/* eslint-disable */

export async function POST(req: NextRequest) {
  const { customerId } = await (req as any).json();
  const supabase = createServerSupabase();

  // Create Stripe Identity verification session
  const session = await createVerificationSession(customerId);

  // Update customer status to pending
  await supabase
    .from('customers')
    .update({ verification_status: 'pending' })
    .eq('id', customerId);

  return NextResponse.json({
    sessionId: session.id,
    clientSecret: session.client_secret,
    url: session.url,
  });
}
