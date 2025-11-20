import Stripe from 'stripe'
import {createClient} from "@supabase/supabase-js";
/* eslint-disable */
/*@ts-ignore */

// Use a stable API version string
export const stripe = new Stripe(process.env.NEXT_STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
})

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

// Minimal audit logger to avoid runtime errors if helper is missing
async function logAuditEvent(event: {
  action_type: string
  entity_type?: string
  entity_id?: string
  description?: string
  metadata?: any
}) {
  try {
    await supabase.from('audit_logs').insert({
      ...event,
      created_at: new Date().toISOString(),
    })
  } catch (e) {
    // swallow logging errors
  }
}

export async function createVerificationSession(customerId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  // Create a Stripe Identity Verification Session for document verification
  return await stripe.identity.verificationSessions.create({
    type: 'document',
    metadata: {
      customer_id: customerId,
      purpose: 'austrac_kyc',
    },
    return_url: `${baseUrl}/kyc-return?kyc_status=complete&customer_id=${customerId}`,
    options: {
      document: {
        allowed_types: ['driving_license', 'passport'],
        require_live_capture: true,
        require_matching_selfie: true,
      },
    },
  })
}

export async function retrieveVerificationSession(sessionId: string) {
  return await stripe.identity.verificationSessions.retrieve(sessionId, {
    expand: ['verified_outputs', 'last_verification_report'],
  })
}

export async function processVerificationResult(sessionId: string, customerId: string) {
  const session = await retrieveVerificationSession(sessionId)

  const vo = session.verified_outputs
  const report = session.last_verification_report

  // @ts-ignore

  const verificationData = {
    customer_id: customerId,
    stripe_verification_session_id: sessionId,
    verification_type: 'stripe_identity',
    status: session.status,

    // Person details (from verified_outputs)
    given_name: vo?.first_name ?? null,
    family_name: vo?.last_name ?? null,
    date_of_birth: vo?.dob
      ? `${vo.dob.year?.toString().padStart(4, '0')}-${(vo.dob.month ?? 0)
        .toString()
        .padStart(2, '0')}-${(vo.dob.day ?? 0).toString().padStart(2, '0')}`
      : null,

    // Address (if provided)
    address_line1: vo?.address?.line1 ?? null,
    address_line2: vo?.address?.line2 ?? null,
    address_city: vo?.address?.city ?? null,
    address_state: vo?.address?.state ?? null,
    address_postal_code: vo?.address?.postal_code ?? null,
    address_country: vo?.address?.country ?? null,

    // ID number summary (Stripe generally won't provide the full number)
    // @ts-ignore
    id_number_type: vo?.id_number?.type ?? null,
    // @ts-ignore
    id_number_country: vo?.id_number?.country ?? vo?.id_number?.issuing_country ?? null,
    // @ts-ignore
    id_number_last4: vo?.id_number?.last4 ?? null,

    // @ts-ignore
    // Verification checks (from last_verification_report statuses)
    document_check_status: report?.document?.status ?? null,
    // @ts-ignore
    selfie_check_status: report?.selfie?.status ?? null,
    // @ts-ignore
    id_number_check_status: report?.id_number?.status ?? null,

    // Convenience booleans
    // @ts-ignore
    liveness_check_passed: report?.selfie?.status === 'verified',
    // @ts-ignore
    document_check_passed: report?.document?.status === 'verified',
    // @ts-ignore
    id_number_check_passed: report?.id_number?.status === 'verified',

    stripe_response: session, // consider storing a reduced subset for PII minimization
    verified_at: session.status === 'verified' ? new Date().toISOString() : null,
  }

  // CHANGED: Use upsert instead of insert
  const { data, error } = await supabase
    .from('identity_verifications')
    .upsert(verificationData, {
      onConflict: 'stripe_verification_session_id',
      ignoreDuplicates: false
    })
    .select()
    .single()

  if (error) throw error

  if (session.status === 'verified') {
    await supabase
      .from('customers')
      .update({
        verification_status: 'verified',
        verification_level: 'stripe_identity',
        last_verified_at: new Date().toISOString(),
      })
      .eq('id', customerId)

    await logAuditEvent({
      action_type: 'customer_verified',
      entity_type: 'customer',
      entity_id: customerId,
      description: 'Customer identity verified via Stripe Identity',
      metadata: { verification_id: data.id, session_id: sessionId },
    })
  }

  return data
}