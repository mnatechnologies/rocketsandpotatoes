import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/utils/logger';
import { auth } from '@clerk/nextjs/server';
import { createServerSupabase } from '@/lib/supabase/server';

const logger = createLogger('ENHANCED_DD');

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createServerSupabase();

  try {
    const {
      customerId,
      sourceOfWealth,
      sourceOfWealthDetails,
      transactionPurpose,
      transactionPurposeDetails,
      expectedFrequency,
      expectedAnnualVolume,
    } = await req.json();

    // Validate required fields
    if (!customerId || !sourceOfWealth || !transactionPurpose || !expectedFrequency) {
      return NextResponse.json(
        { error: 'Customer ID, source of wealth, transaction purpose, and expected frequency are required' },
        { status: 400 }
      );
    }

    // Verify customer belongs to authenticated user
    const { data: customerOwner } = await supabase
      .from('customers')
      .select('clerk_user_id')
      .eq('id', customerId)
      .single();

    if (!customerOwner || customerOwner.clerk_user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    logger.log('Processing Enhanced DD for customer:', customerId);

    // Check if there's an active investigation for this customer
    const { data: activeInvestigation } = await supabase
      .from('edd_investigations')
      .select('id, customer_edd_id, source_of_wealth, source_of_funds')
      .eq('customer_id', customerId)
      .in('status', ['open', 'awaiting_customer_info', 'under_review', 'escalated'])
      .order('opened_at', { ascending: false })
      .limit(1)
      .single();

    // Check if EDD already exists for this customer
    const { data: existingEdd } = await supabase
      .from('customer_edd')
      .select('id, status')
      .eq('customer_id', customerId)
      .single();

    let eddRecordId: string;

    if (existingEdd) {
      // Update existing EDD submission
      const { error: updateError } = await supabase
        .from('customer_edd')
        .update({
          source_of_wealth: sourceOfWealth,
          source_of_wealth_details: sourceOfWealthDetails || null,
          transaction_purpose: transactionPurpose,
          transaction_purpose_details: transactionPurposeDetails || null,
          expected_frequency: expectedFrequency,
          expected_annual_volume: expectedAnnualVolume || null,
          status: 'pending',
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingEdd.id);

      if (updateError) {
        logger.error('Database error updating EDD:', updateError);
        throw updateError;
      }

      eddRecordId = existingEdd.id;
      logger.log('Updated existing EDD submission');
    } else {
      // Create new EDD submission
      const { data: newEdd, error: insertError } = await supabase
        .from('customer_edd')
        .insert({
          customer_id: customerId,
          source_of_wealth: sourceOfWealth,
          source_of_wealth_details: sourceOfWealthDetails || null,
          transaction_purpose: transactionPurpose,
          transaction_purpose_details: transactionPurposeDetails || null,
          expected_frequency: expectedFrequency,
          expected_annual_volume: expectedAnnualVolume || null,
          status: 'pending',
        })
        .select('id')
        .single();

      if (insertError) {
        logger.error('Database error creating EDD:', insertError);
        throw insertError;
      }

      eddRecordId = newEdd.id;
      logger.log('Created new EDD submission');
    }

    // If there's an active investigation, link the EDD submission and update investigation
    if (activeInvestigation) {
      logger.log('Linking EDD submission to investigation:', activeInvestigation.id);

      // Update investigation with customer-provided info
      const { error: investigationUpdateError } = await supabase
        .from('edd_investigations')
        .update({
          customer_edd_id: eddRecordId,
          status: 'under_review',
          // Update source of wealth section with customer response
          source_of_wealth: {
            ...activeInvestigation.source_of_wealth,
            completed: true,
            primary_source: sourceOfWealth,
            verified: false, // Admin still needs to verify
            notes: sourceOfWealthDetails || null,
          },
          // Update source of funds section with transaction purpose
          source_of_funds: {
            ...activeInvestigation.source_of_funds,
            completed: true,
            funding_source: transactionPurpose,
            verified: false, // Admin still needs to verify
            notes: transactionPurposeDetails || null,
          },
        })
        .eq('id', activeInvestigation.id);

      if (investigationUpdateError) {
        logger.error('Error linking EDD to investigation:', investigationUpdateError);
      } else {
        logger.log('Investigation updated with customer EDD response');
      }

      // Update customer - keep them blocked until investigation completes
      // DO NOT set edd_completed to true - investigation must be approved first
      const { error: customerUpdateError } = await supabase
        .from('customers')
        .update({
          // Keep edd_completed: false so customer stays blocked
          // requires_enhanced_dd should already be true
        })
        .eq('id', customerId);

      if (customerUpdateError) {
        logger.error('Error updating customer:', customerUpdateError);
      }
    } else {
      // No active investigation - this is the old flow for customers who submitted without being triggered
      // Keep them unblocked but mark as requiring review
      const { error: customerUpdateError } = await supabase
        .from('customers')
        .update({
          edd_completed: true,
          edd_completed_at: new Date().toISOString(),
          requires_enhanced_dd: false,
        })
        .eq('id', customerId);

      if (customerUpdateError) {
        logger.error('Error updating customer EDD status:', customerUpdateError);
      }
    }

    // Log audit event
    await supabase.from('audit_logs').insert({
      action_type: 'edd_submitted',
      entity_type: 'customer',
      entity_id: customerId,
      description: 'Customer submitted Enhanced Due Diligence information',
      metadata: {
        source_of_wealth: sourceOfWealth,
        transaction_purpose: transactionPurpose,
        expected_frequency: expectedFrequency,
        expected_annual_volume: expectedAnnualVolume,
      },
      created_at: new Date().toISOString(),
    });

    logger.log('EDD submission saved successfully');

    return NextResponse.json({
      success: true,
      message: 'Enhanced due diligence information saved',
    });
  } catch (error) {
    logger.error('Error saving EDD:', error);
    return NextResponse.json({ error: 'Failed to save enhanced due diligence information' }, { status: 500 });
  }
}

// GET endpoint to check EDD status for a customer
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createServerSupabase();

  const customerId = req.nextUrl.searchParams.get('customerId');

  if (!customerId) {
    return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
  }

  try {
    // Check customer's EDD status
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('edd_completed, edd_completed_at, requires_enhanced_dd')
      .eq('id', customerId)
      .single();

    if (customerError) throw customerError;

    // Get EDD details if exists
    const { data: edd } = await supabase
      .from('customer_edd')
      .select('status, submitted_at, reviewed_at')
      .eq('customer_id', customerId)
      .single();

    return NextResponse.json({
      success: true,
      data: {
        eddCompleted: customer?.edd_completed || false,
        eddCompletedAt: customer?.edd_completed_at,
        requiresEnhancedDD: customer?.requires_enhanced_dd || false,
        eddStatus: edd?.status || null,
        eddSubmittedAt: edd?.submitted_at,
        eddReviewedAt: edd?.reviewed_at,
      },
    });
  } catch (error) {
    logger.error('Error retrieving EDD status:', error);
    return NextResponse.json({ error: 'Failed to retrieve EDD status' }, { status: 500 });
  }
}









