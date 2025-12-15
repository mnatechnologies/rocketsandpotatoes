import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('ENHANCED_DD');

export async function POST(req: NextRequest) {
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

    logger.log('Processing Enhanced DD for customer:', customerId);

    // Check if EDD already exists for this customer
    const { data: existingEdd } = await supabase
      .from('customer_edd')
      .select('id, status')
      .eq('customer_id', customerId)
      .single();

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

      logger.log('Updated existing EDD submission');
    } else {
      // Create new EDD submission
      const { error: insertError } = await supabase
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
        });

      if (insertError) {
        logger.error('Database error creating EDD:', insertError);
        throw insertError;
      }

      logger.log('Created new EDD submission');
    }

    // Update customer record
    const { error: customerUpdateError } = await supabase
      .from('customers')
      .update({
        edd_completed: true,
        edd_completed_at: new Date().toISOString(),
        requires_enhanced_dd: true,
      })
      .eq('id', customerId);

    if (customerUpdateError) {
      logger.error('Error updating customer EDD status:', customerUpdateError);
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
    const message = error instanceof Error ? error.message : 'Failed to save EDD';
    logger.error('Error saving EDD:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET endpoint to check EDD status for a customer
export async function GET(req: NextRequest) {
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
    const message = error instanceof Error ? error.message : 'Failed to retrieve EDD status';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}








