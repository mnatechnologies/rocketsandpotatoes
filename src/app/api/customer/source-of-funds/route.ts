import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('SOURCE_OF_FUNDS');

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
    const { customerId, sourceOfFunds, occupation, employer, isPep, pepRelationship } = await req.json();

    // Validate required fields
    if (!customerId || !sourceOfFunds || !occupation) {
      return NextResponse.json(
        { error: 'Customer ID, source of funds, and occupation are required' },
        { status: 400 }
      );
    }

    // If PEP is true, relationship is required
    if (isPep && !pepRelationship) {
      return NextResponse.json(
        { error: 'PEP relationship is required when declaring as a PEP' },
        { status: 400 }
      );
    }

    logger.log('Saving source of funds for customer:', customerId);

    // Update customer record
    const { data, error } = await supabase
      .from('customers')
      .update({
        source_of_funds: sourceOfFunds,
        occupation: occupation,
        employer: employer || null,
        source_of_funds_declared_at: new Date().toISOString(),
        source_of_funds_verified: true,
        is_pep: isPep || false,
        pep_relationship: isPep ? pepRelationship : null,
        pep_declared_at: new Date().toISOString(),
        // Flag for EDD if PEP
        requires_enhanced_dd: isPep || false,
      })
      .eq('id', customerId)
      .select()
      .single();

    if (error) {
      logger.error('Database error:', error);
      throw error;
    }

    // Log audit event for source of funds
    await supabase.from('audit_logs').insert({
      action_type: 'source_of_funds_declared',
      entity_type: 'customer',
      entity_id: customerId,
      description: 'Customer declared source of funds',
      metadata: {
        source_of_funds: sourceOfFunds,
        occupation: occupation,
        employer: employer,
      },
      created_at: new Date().toISOString(),
    });

    // Log separate audit event for PEP declaration
    if (isPep) {
      await supabase.from('audit_logs').insert({
        action_type: 'pep_declaration',
        entity_type: 'customer',
        entity_id: customerId,
        description: `Customer declared as PEP: ${pepRelationship}`,
        metadata: {
          is_pep: true,
          pep_relationship: pepRelationship,
        },
        created_at: new Date().toISOString(),
      });

      logger.log(`PEP declaration recorded for customer ${customerId}: ${pepRelationship}`);
    }

    logger.log('Source of funds saved successfully');

    return NextResponse.json({
      success: true,
      message: 'Source of funds saved',
      data: {
        source_of_funds: data.source_of_funds,
        occupation: data.occupation,
        employer: data.employer,
        is_pep: data.is_pep,
        pep_relationship: data.pep_relationship,
      },
    });

  } catch (error: any) {
    logger.error('Error saving source of funds:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save source of funds' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve source of funds for a customer
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
    return NextResponse.json(
      { error: 'Customer ID is required' },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase
      .from('customers')
      .select('source_of_funds, occupation, employer, source_of_funds_verified, source_of_funds_declared_at')
      .eq('id', customerId)
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data,
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve source of funds' },
      { status: 500 }
    );
  }
}