//import { createServerSupabase } from "@/lib/supabase/server";

import {NextResponse, NextRequest} from 'next/server'
/* eslint-disable */
import {createClient} from "@supabase/supabase-js";

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
  const { data: verification } = await supabase
    .from('identity_verifications')
    .insert({
      customer_id: customerId,
      verification_type: 'manual_document',
      status: 'pending',
      verification_checks: { documents_submitted: documents },
    })
    .select()
    .single();

  // Create verification requirements record
  await supabase
    .from('verification_requirements')
    .insert({
      customer_id: customerId,
      verification_method: verificationMethod,
      is_complete: false,
      required_documents: documents,
      submitted_documents: documents.filter((d: any) => d.uploaded),
    });

  return NextResponse.json({
    success: true,
    message: 'Documents submitted for review. You will be notified within 1-2 business days.',
  });
}