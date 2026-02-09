import {NextResponse, NextRequest} from 'next/server'
/* eslint-disable */
import { auth } from '@clerk/nextjs/server';
import { createServerSupabase } from '@/lib/supabase/server';

type VerificationMethod =
  | 'stripe_identity'
  | 'manual_document'
  | 'electronic_dvs'
  | 'alternative';

interface ManualVerificationRequest {
  customerId: string;
  verificationMethod: VerificationMethod;
  documents: Array<{ docType: string; uploaded: boolean }>;
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createServerSupabase();
  const { customerId, verificationMethod, documents } = await request.json();

  // Verify customer belongs to authenticated user
  const { data: customerOwner } = await supabase
    .from('customers')
    .select('clerk_user_id')
    .eq('id', customerId)
    .single();

  if (!customerOwner || customerOwner.clerk_user_id !== userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  if (!customerId || !verificationMethod || !documents) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  // Create verification record
  const { error } = await supabase
    .from('identity_verifications')
    .insert({
      customer_id: customerId,
      verification_type: 'manual_document',
      status: 'pending',
      verification_checks: {
        verification_method: verificationMethod,
        documents_submitted: documents,
        submitted_documents: documents.filter((d: { docType: string; uploaded: boolean }) => d.uploaded),
      },
    });

  if (error) {
    return NextResponse.json({ error: 'Failed to submit verification documents' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: 'Documents submitted for review. You will be notified within 1-2 business days.',
  });
}