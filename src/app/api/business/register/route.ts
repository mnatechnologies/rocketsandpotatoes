import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { createLogger } from '@/lib/utils/logger';
import { BusinessRegistrationForm } from '@/types/business';
import { validateABNFormat, validateACNFormat, mapEntityType } from '@/lib/abr/abr-service';

const logger = createLogger('BUSINESS_REGISTER_API');

export async function POST(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createServerSupabase();

  try {
    const body: BusinessRegistrationForm & { abr_response?: unknown } = await req.json();

    // Validate required fields
    if (!body.entity_type || !body.abn || !body.business_name) {
      return NextResponse.json(
        { error: 'Missing required fields: entity_type, abn, business_name' },
        { status: 400 }
      );
    }

    // Validate ABN
    if (!validateABNFormat(body.abn)) {
      return NextResponse.json({ error: 'Invalid ABN format' }, { status: 400 });
    }

    // Validate ACN for companies
    if (body.entity_type === 'company' && body.acn && !validateACNFormat(body.acn)) {
      return NextResponse.json({ error: 'Invalid ACN format' }, { status: 400 });
    }

    // Get the customer record for this Clerk user
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('clerk_user_id', userId)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'Customer record not found' },
        { status: 404 }
      );
    }

    // Check if ABN already registered
    const { data: existingBusiness } = await supabase
      .from('business_customers')
      .select('id')
      .eq('abn', body.abn.replace(/\s/g, ''))
      .single();

    if (existingBusiness) {
      return NextResponse.json(
        { error: 'A business with this ABN is already registered' },
        { status: 409 }
      );
    }

    // Create business customer
    const { data: business, error: businessError } = await supabase
      .from('business_customers')
      .insert({
        primary_contact_customer_id: customer.id,
        abn: body.abn.replace(/\s/g, ''),
        acn: body.acn?.replace(/\s/g, ''),
        business_name: body.business_name,
        trading_name: body.trading_name,
        entity_type: body.entity_type,
        registered_address: body.registered_address,
        principal_address: body.principal_address || body.registered_address,
        abr_verified: !!body.abr_response,
        abr_verified_at: body.abr_response ? new Date().toISOString() : null,
        abr_response: body.abr_response,
        verification_status: 'pending',
        risk_level: 'medium',
      })
      .select()
      .single();

    if (businessError) {
      logger.error('Error creating business:', businessError);
      return NextResponse.json(
        { error: 'Failed to create business' },
        { status: 500 }
      );
    }

    // Update customer to link to business
    await supabase
      .from('customers')
      .update({
        customer_type: 'business_contact',
        business_customer_id: business.id,
      })
      .eq('id', customer.id);

    // Create audit log
    await supabase.from('audit_logs').insert({
      action_type: 'business_registration',
      entity_type: 'business_customer',
      entity_id: business.id,
      description: `Business registered: ${body.business_name} (ABN: ${body.abn})`,
      metadata: {
        entity_type: body.entity_type,
        abn: body.abn,
        registered_by: customer.id,
      },
    });

    logger.log('Business registered successfully:', business.id);

    return NextResponse.json({
      success: true,
      business_id: business.id,
    });

  } catch (error) {
    logger.error('Business registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}