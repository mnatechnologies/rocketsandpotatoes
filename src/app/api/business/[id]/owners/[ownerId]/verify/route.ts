import { createUBOVerificationSession } from '@/lib/stripe/identity';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';



export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; ownerId: string }> }
) {
  const { verification_method } = await req.json();
  const { id } =  await params;
  const { ownerId }  = await params
  const businessId = id;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

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