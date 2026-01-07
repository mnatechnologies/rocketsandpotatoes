import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { createLogger } from '@/lib/utils/logger';
import { UBOForm } from '@/types/business';

const logger = createLogger('BUSINESS_OWNERS_API');

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    // Verify user has access to this business
    const { data: customer } = await supabase
      .from('customers')
      .select('business_customer_id')
      .eq('clerk_user_id', userId)
      .single();

    if (!customer || customer.business_customer_id !== id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { data: owners, error } = await supabase
      .from('beneficial_owners')
      .select('*')
      .eq('business_customer_id', id)
      .order('ownership_percentage', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ owners });

  } catch (error) {
    logger.error('Error fetching owners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch beneficial owners' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  const { id }  = await params;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    const body: UBOForm = await req.json();

    // Verify user has access to this business
    const { data: customer } = await supabase
      .from('customers')
      .select('id, business_customer_id')
      .eq('clerk_user_id', userId)
      .single();

    if (!customer || customer.business_customer_id !== id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Validate ownership percentage
    if (body.ownership_percentage < 25 || body.ownership_percentage > 100) {
      return NextResponse.json(
        { error: 'Ownership percentage must be between 25% and 100%' },
        { status: 400 }
      );
    }

    // Check total ownership doesn't exceed 100%
    const { data: existingOwners } = await supabase
      .from('beneficial_owners')
      .select('ownership_percentage')
      .eq('business_customer_id', id);

    const currentTotal = existingOwners?.reduce(
      (sum, o) => sum + Number(o.ownership_percentage), 0
    ) || 0;

    if (currentTotal + body.ownership_percentage > 100) {
      return NextResponse.json(
        { error: `Total ownership would exceed 100%. Current total: ${currentTotal}%` },
        { status: 400 }
      );
    }

    // Create beneficial owner
    const { data: owner, error } = await supabase
      .from('beneficial_owners')
      .insert({
        business_customer_id: id,
        first_name: body.first_name,
        middle_name: body.middle_name,
        last_name: body.last_name,
        date_of_birth: body.date_of_birth,
        email: body.email,
        phone: body.phone,
        residential_address: body.residential_address,
        ownership_percentage: body.ownership_percentage,
        ownership_type: body.ownership_type,
        role: body.role,
        is_pep: body.is_pep,
        pep_relationship: body.is_pep ? body.pep_relationship : null,
        verification_status: 'unverified',
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Update business verification status
    await supabase
      .from('business_customers')
      .update({ ubo_verification_complete: false })
      .eq('id', id);

    // Audit log
    await supabase.from('audit_logs').insert({
      action_type: 'ubo_added',
      entity_type: 'beneficial_owner',
      entity_id: owner.id,
      description: `Beneficial owner added: ${body.first_name} ${body.last_name} (${body.ownership_percentage}%)`,
      metadata: {
        business_customer_id: id,
        ownership_percentage: body.ownership_percentage,
        is_pep: body.is_pep,
      },
    });

    logger.log('Beneficial owner added:', owner.id);

    return NextResponse.json({ success: true, owner });

  } catch (error) {
    logger.error('Error adding owner:', error);
    return NextResponse.json(
      { error: 'Failed to add beneficial owner' },
      { status: 500 }
    );
  }
}