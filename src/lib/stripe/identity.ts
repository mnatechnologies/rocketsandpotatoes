import Stripe from 'stripe'
import {createClient} from "@supabase/supabase-js";
import { createLogger } from "@/lib/utils/logger";
import {sanctionsScreening} from "@/lib/compliance/screening";
import { sendSanctionsMatchAlert } from "@/lib/email/sendComplianceAlert";
/* eslint-disable */
/*@ts-ignore */
const logger = createLogger('STRIPE_IDENTITY');

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

export async function createUBOVerificationSession(
  beneficialOwnerId: string,
  businessCustomerId: string
) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  // Create a Stripe Identity Verification Session for UBO
  return await stripe.identity.verificationSessions.create({
    type: 'document',
    metadata: {
      beneficial_owner_id: beneficialOwnerId,
      business_customer_id: businessCustomerId,
      purpose: 'austrac_kyc_ubo',
    },
    return_url: `${baseUrl}/onboarding/business?ubo_verified=${beneficialOwnerId}`,
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

  // // Validate that verified address is in Australia
  // if (session.status === 'verified' && vo?.address?.country && vo.address.country !== 'AU') {
  //   logger.log('⛔ Verification rejected: Non-Australian address detected', {
  //     country: vo.address.country,
  //     customerId
  //   });
  //
  //   await logAuditEvent({
  //     action_type: 'kyc_verification_rejected',
  //     entity_type: 'customer',
  //     entity_id: customerId,
  //     description: 'KYC verification rejected: Document shows non-Australian address',
  //     metadata: {
  //       country: vo.address.country,
  //       session_id: sessionId
  //     },
  //   });
  //
  //   await supabase
  //     .from('customers')
  //     .update({
  //       verification_status: 'rejected',
  //       last_verified_at: new Date().toISOString(),
  //     })
  //     .eq('id', customerId);
  //
  //   throw new Error('Verification rejected: We currently only serve customers with Australian addresses.');
  // }

  if (session.status === 'verified' && vo?.first_name && vo?.last_name) {
    logger.log('🔍 Starting sanctions screening for verified customer...');

    try {
      const screeningResult = await sanctionsScreening(
        vo.first_name,
        vo.last_name,
        verificationData.date_of_birth || undefined
      );

      logger.log(`Screening result: ${screeningResult.isMatch ? '⚠️ MATCH FOUND' : '✅ Clear'}`);

      // Save screening result
      await supabase.from('sanctions_screenings').insert({
        customer_id: customerId,
        screened_name: `${vo.first_name} ${vo.last_name}`,
        screening_service: 'DFAT',
        is_match: screeningResult.isMatch,
        match_score: screeningResult.matches[0]?.matchScore || 0,
        matched_entities: screeningResult.matches,
        status: screeningResult.isMatch ? 'potential_match' : 'clear',
        screened_at: new Date().toISOString(),
      });

      // Update customer with verified details AND sanctions status
      await supabase
        .from('customers')
        .update({
          first_name: vo.first_name,
          last_name: vo.last_name,
          date_of_birth: verificationData.date_of_birth,
          residential_address: vo.address ? {
            line1: vo.address.line1,
            line2: vo.address.line2,
            city: vo.address.city,
            state: vo.address.state,
            postcode: vo.address.postal_code,
            country: vo.address.country,
          } : null,
          verification_status: screeningResult.isMatch ? 'requires_review' : 'verified',
          verification_level: 'stripe_identity',
          is_sanctioned: screeningResult.isMatch,
          last_verified_at: new Date().toISOString(),
        })
        .eq('id', customerId);

      // ⚠️ If sanctioned, log critical alert
      if (screeningResult.isMatch) {
        logger.log('🚨 SANCTIONS MATCH DETECTED! Customer flagged for review.');

        await logAuditEvent({
          action_type: 'sanctions_match_detected',
          entity_type: 'customer',
          entity_id: customerId,
          description: `CRITICAL: Customer matched against ${screeningResult.matches[0].source} sanctions list`,
          metadata: {
            matches: screeningResult.matches,
            verification_id: data.id,
            session_id: sessionId
          },
        });

        // Send alert to compliance officer
        await sendSanctionsMatchAlert({
          customerId,
          customerName: `${vo.first_name} ${vo.last_name}`,
          matchedEntity: screeningResult.matches[0].name,
          matchScore: screeningResult.matches[0].matchScore,
          source: screeningResult.matches[0].source,
        });
      } else {
        // Customer is clear
        await logAuditEvent({
          action_type: 'customer_verified',
          entity_type: 'customer',
          entity_id: customerId,
          description: 'Customer identity verified via Stripe Identity and cleared sanctions screening',
          metadata: {
            verification_id: data.id,
            session_id: sessionId,
            sanctions_cleared: true,
          },
        });
      }

    } catch (screeningError) {
      logger.error('❌ Sanctions screening failed:', screeningError);

      // Log the screening failure
      await logAuditEvent({
        action_type: 'sanctions_screening_failed',
        entity_type: 'customer',
        entity_id: customerId,
        description: 'Sanctions screening encountered an error',
        metadata: {
          error: String(screeningError),
          session_id: sessionId
        },
      });

      // Mark customer for manual review
      await supabase
        .from('customers')
        .update({
          verification_status: 'requires_review',
          first_name: vo.first_name,
          last_name: vo.last_name,
          date_of_birth: verificationData.date_of_birth,
        })
        .eq('id', customerId);
    }
  } else if (session.status === 'verified') {
    // Verification succeeded but missing name data
    logger.log('⚠️ Verification succeeded but missing name data for screening');

    await supabase
      .from('customers')
      .update({
        verification_status: 'verified',
        verification_level: 'stripe_identity',
        last_verified_at: new Date().toISOString(),
      })
      .eq('id', customerId);

    await logAuditEvent({
      action_type: 'customer_verified',
      entity_type: 'customer',
      entity_id: customerId,
      description: 'Customer identity verified via Stripe Identity (sanctions screening skipped - no name data)',
      metadata: { verification_id: data.id, session_id: sessionId },
    });
  }

  return data
}

export async function processUBOVerificationResult(
  sessionId: string,
  beneficialOwnerId: string,
  businessCustomerId: string
) {
  const session = await retrieveVerificationSession(sessionId)

  const vo = session.verified_outputs
  const report = session.last_verification_report

  // Store verification data (reusing identity_verifications table)
  const verificationData = {
    // Link to beneficial owner instead of customer
    beneficial_owner_id: beneficialOwnerId,
    stripe_verification_session_id: sessionId,
    verification_type: 'stripe_identity_ubo',
    status: session.status,

    // Person details (from verified_outputs)
    given_name: vo?.first_name ?? null,
    family_name: vo?.last_name ?? null,
    date_of_birth: vo?.dob
      ? `${vo.dob.year?.toString().padStart(4, '0')}-${(vo.dob.month ?? 0)
        .toString()
        .padStart(2, '0')}-${(vo.dob.day ?? 0).toString().padStart(2, '0')}`
      : null,

    // Address
    address_line1: vo?.address?.line1 ?? null,
    address_line2: vo?.address?.line2 ?? null,
    address_city: vo?.address?.city ?? null,
    address_state: vo?.address?.state ?? null,
    address_postal_code: vo?.address?.postal_code ?? null,
    address_country: vo?.address?.country ?? null,

    // ID number summary
    id_number_type: vo?.id_number?.type ?? null,
    id_number_country: vo?.id_number?.country ?? vo?.id_number?.issuing_country ?? null,
    id_number_last4: vo?.id_number?.last4 ?? null,

    // Verification checks
    document_check_status: report?.document?.status ?? null,
    selfie_check_status: report?.selfie?.status ?? null,
    id_number_check_status: report?.id_number?.status ?? null,

    // Convenience booleans
    liveness_check_passed: report?.selfie?.status === 'verified',
    document_check_passed: report?.document?.status === 'verified',
    id_number_check_passed: report?.id_number?.status === 'verified',

    stripe_response: session,
    verified_at: session.status === 'verified' ? new Date().toISOString() : null,
  }

  // Store in identity_verifications table
  const { data: verificationRecord, error: verificationError } = await supabase
    .from('identity_verifications')
    .upsert(verificationData, {
      onConflict: 'stripe_verification_session_id',
      ignoreDuplicates: false
    })
    .select()
    .single()

  if (verificationError) throw verificationError

  // Perform sanctions screening if verification succeeded
  if (session.status === 'verified' && vo?.first_name && vo?.last_name) {
    logger.log('🔍 Starting sanctions screening for beneficial owner...');

    try {
      const screeningResult = await sanctionsScreening(
        vo.first_name,
        vo.last_name,
        verificationData.date_of_birth || undefined
      );

      logger.log(`Screening result: ${screeningResult.isMatch ? '⚠️ MATCH FOUND' : '✅ Clear'}`);

      // Save screening result
      await supabase.from('sanctions_screenings').insert({
        beneficial_owner_id: beneficialOwnerId,
        screened_name: `${vo.first_name} ${vo.last_name}`,
        screening_service: 'DFAT',
        is_match: screeningResult.isMatch,
        match_score: screeningResult.matches[0]?.matchScore || 0,
        matched_entities: screeningResult.matches,
        status: screeningResult.isMatch ? 'potential_match' : 'clear',
        screened_at: new Date().toISOString(),
      });

      // Update beneficial owner with verified details AND sanctions status
      const updateData: Record<string, any> = {
        first_name: vo.first_name,
        last_name: vo.last_name,
        verification_status: screeningResult.isMatch ? 'requires_review' : 'verified',
        verification_level: 'stripe_identity',
        last_verified_at: new Date().toISOString(),
      };

      // Only include date_of_birth if available
      if (verificationData.date_of_birth) {
        updateData.date_of_birth = verificationData.date_of_birth;
      }

      // Only include address if available
      if (vo.address) {
        updateData.residential_address = {
          line1: vo.address.line1,
          line2: vo.address.line2,
          city: vo.address.city,
          state: vo.address.state,
          postcode: vo.address.postal_code,
          country: vo.address.country,
        };
      }

      const { error: uboUpdateError } = await supabase
        .from('beneficial_owners')
        .update(updateData)
        .eq('id', beneficialOwnerId);

      if (uboUpdateError) {
        logger.error('❌ Failed to update beneficial owner:', uboUpdateError);
        throw uboUpdateError;
      }

      logger.log('✅ Beneficial owner updated successfully');

      // If sanctioned, log critical alert
      if (screeningResult.isMatch) {
        logger.log('🚨 SANCTIONS MATCH DETECTED! Beneficial owner flagged for review.');

        await logAuditEvent({
          action_type: 'sanctions_match_detected_ubo',
          entity_type: 'beneficial_owner',
          entity_id: beneficialOwnerId,
          description: `CRITICAL: Beneficial owner matched against ${screeningResult.matches[0].source} sanctions list`,
          metadata: {
            business_customer_id: businessCustomerId,
            matches: screeningResult.matches,
            verification_id: verificationRecord.id,
            session_id: sessionId
          },
        });

        // Send alert to compliance officer
        await sendSanctionsMatchAlert({
          customerId: beneficialOwnerId, // Reuse same alert function
          customerName: `${vo.first_name} ${vo.last_name} (UBO)`,
          matchedEntity: screeningResult.matches[0].name,
          matchScore: screeningResult.matches[0].matchScore,
          source: screeningResult.matches[0].source,
        });
      } else {
        // UBO is clear - log success
        await logAuditEvent({
          action_type: 'ubo_verified',
          entity_type: 'beneficial_owner',
          entity_id: beneficialOwnerId,
          description: 'Beneficial owner verified via Stripe Identity and cleared sanctions screening',
          metadata: {
            business_customer_id: businessCustomerId,
            verification_id: verificationRecord.id,
            session_id: sessionId,
            sanctions_cleared: true,
          },
        });
      }

    } catch (screeningError) {
      logger.error('❌ Sanctions screening failed for UBO:', screeningError);

      await logAuditEvent({
        action_type: 'sanctions_screening_failed',
        entity_type: 'beneficial_owner',
        entity_id: beneficialOwnerId,
        description: 'UBO sanctions screening encountered an error',
        metadata: {
          business_customer_id: businessCustomerId,
          error: String(screeningError),
          session_id: sessionId
        },
      });

      // Mark for manual review
      const reviewUpdateData: Record<string, any> = {
        verification_status: 'requires_review',
        first_name: vo.first_name,
        last_name: vo.last_name,
      };

      if (verificationData.date_of_birth) {
        reviewUpdateData.date_of_birth = verificationData.date_of_birth;
      }

      await supabase
        .from('beneficial_owners')
        .update(reviewUpdateData)
        .eq('id', beneficialOwnerId);
    }
  } else if (session.status === 'verified') {
    // Verification succeeded but missing name data
    logger.log('⚠️ UBO verification succeeded but missing name data for screening');

    await supabase
      .from('beneficial_owners')
      .update({
        verification_status: 'verified',
        verification_level: 'stripe_identity',
        last_verified_at: new Date().toISOString(),
      })
      .eq('id', beneficialOwnerId);

    await logAuditEvent({
      action_type: 'ubo_verified',
      entity_type: 'beneficial_owner',
      entity_id: beneficialOwnerId,
      description: 'Beneficial owner verified via Stripe Identity (sanctions screening skipped - no name data)',
      metadata: {
        business_customer_id: businessCustomerId,
        verification_id: verificationRecord.id,
        session_id: sessionId
      },
    });
  }

  // Check if ALL UBOs are now verified for this business
  const { data: allUbos } = await supabase
    .from('beneficial_owners')
    .select('id, verification_status')
    .eq('business_customer_id', businessCustomerId);

  const allVerified = allUbos?.every(ubo => ubo.verification_status === 'verified') ?? false;

  if (allVerified && allUbos && allUbos.length > 0) {
    logger.log('✅ All UBOs verified! Marking business as UBO-complete.');

    // Mark business as fully UBO-verified
    const { error: businessUpdateError } = await supabase
      .from('business_customers')
      .update({
        ubo_verification_complete: true,
        ubo_verification_date: new Date().toISOString(),
        verification_status: 'verified',
      })
      .eq('id', businessCustomerId);

    if (businessUpdateError) {
      logger.error('❌ Failed to update business customer:', businessUpdateError);
    } else {
      logger.log('✅ Business customer marked as UBO-complete');
    }

    await logAuditEvent({
      action_type: 'business_ubo_verification_complete',
      entity_type: 'business_customer',
      entity_id: businessCustomerId,
      description: 'All beneficial owners verified - business cleared for trading',
      metadata: {
        ubo_count: allUbos.length,
        verification_method: 'stripe_identity',
      },
    });
  } else {
    logger.log(`⏳ Not all UBOs verified yet. Status: ${allUbos?.map(u => `${u.id.slice(0, 8)}: ${u.verification_status}`).join(', ')}`);
  }

  return verificationRecord;
}