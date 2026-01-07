import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('ACCOUNT_TYPE_API');

export async function POST(req: NextRequest) {
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
    const { account_type } = await req.json();

    if (!['individual', 'business'].includes(account_type)) {
      return NextResponse.json({ error: 'Invalid account type' }, { status: 400 });
    }

    // Get customer record
    const { data: customer, error: fetchError } = await supabase
      .from('customers')
      .select('id')
      .eq('clerk_user_id', userId)
      .single();

    if (fetchError || !customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Update customer type
    const updateData: Record<string, unknown> = {
      customer_type: account_type === 'business' ? 'business_contact' : 'individual',
      onboarding_complete: account_type === 'individual', // Individual is done, business needs more steps
    };

    const { error: updateError } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', customer.id);

    if (updateError) {
      logger.error('Failed to update account type:', updateError);
      return NextResponse.json({ error: 'Failed to update account type' }, { status: 500 });
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      action_type: 'account_type_selected',
      entity_type: 'customer',
      entity_id: customer.id,
      description: `Account type set to: ${account_type}`,
      metadata: { account_type },
    });

    logger.log('Account type updated:', { customerId: customer.id, type: account_type });

    return NextResponse.json({ success: true, account_type });

  } catch (error) {
    logger.error('Error setting account type:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}