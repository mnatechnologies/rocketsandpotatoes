import { createUBOVerificationSession } from '@/lib/stripe/identity';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerSupabase } from '@/lib/supabase/server';



export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; ownerId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { verification_method } = await req.json();
  const { id } =  await params;
  const { ownerId }  = await params
  const businessId = id;

  const supabase = await createServerSupabase();

  // Verify user has access to this business
  const { data: customer } = await supabase
    .from('customers')
    .select('business_customer_id')
    .eq('clerk_user_id', userId)
    .single();

  if (!customer || customer.business_customer_id !== businessId) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  if (verification_method === 'stripe_identity') {
    // Create Stripe Identity session with proper metadata
    const session = await createUBOVerificationSession(ownerId, businessId);

    return NextResponse.json({
      url: session.url,
      session_id: session.id
    });

  } else if (verification_method === 'manual') {
    // Manual verification flow
    await supabase
      .from('beneficial_owners')
      .update({
        verification_status: 'pending',
        verification_level: 'manual',
      })
      .eq('id', ownerId);

    return NextResponse.json({
      redirect: `/onboarding/business/verify/${ownerId}/documents`,
    });
  }
}