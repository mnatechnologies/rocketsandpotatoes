//import { createServerSupabase } from "@/lib/supabase/server";

import {NextResponse, NextRequest} from 'next/server'
/* eslint-disable */
import {createClient} from "@supabase/supabase-js";

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
  //const supabase = createServerSupabase();

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
  const { customerId, verificationMethod, documents } = await request.json();

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: 'Documents submitted for review. You will be notified within 1-2 business days.',
  });
}