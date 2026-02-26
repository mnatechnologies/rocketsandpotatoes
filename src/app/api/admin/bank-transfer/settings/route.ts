import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createLogger } from '@/lib/utils/logger';
import { requireAdmin } from '@/lib/auth/admin';

const logger = createLogger('ADMIN_BANK_TRANSFER_SETTINGS');

export async function GET() {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) return adminCheck.error;

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
    logger.log('Admin fetching bank transfer settings');

    const { data: settings, error } = await supabase
      .from('bank_transfer_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (error || !settings) {
      logger.error('Failed to fetch bank transfer settings:', error);
      return NextResponse.json(
        { error: 'Bank transfer settings not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: settings });
  } catch (error: unknown) {
    logger.error('Error fetching bank transfer settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bank transfer settings' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) return adminCheck.error;

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
    const body = await req.json();

    logger.log('Admin updating bank transfer settings:', {
      adminUserId: adminCheck.userId,
      fields: Object.keys(body),
    });

    // Validate inputs
    if (body.deposit_percentage !== undefined) {
      if (typeof body.deposit_percentage !== 'number' || body.deposit_percentage < 1 || body.deposit_percentage > 100) {
        return NextResponse.json(
          { error: 'deposit_percentage must be a number between 1 and 100' },
          { status: 400 }
        );
      }
    }

    if (body.payment_window_hours !== undefined) {
      if (typeof body.payment_window_hours !== 'number' || body.payment_window_hours <= 0) {
        return NextResponse.json(
          { error: 'payment_window_hours must be a positive number' },
          { status: 400 }
        );
      }
    }

    if (body.reminder_hours_before !== undefined) {
      if (typeof body.reminder_hours_before !== 'number' || body.reminder_hours_before < 0) {
        return NextResponse.json(
          { error: 'reminder_hours_before must be a non-negative number' },
          { status: 400 }
        );
      }
    }

    if (body.cancellation_fee_percentage !== undefined) {
      if (typeof body.cancellation_fee_percentage !== 'number' || body.cancellation_fee_percentage < 0 || body.cancellation_fee_percentage > 100) {
        return NextResponse.json(
          { error: 'cancellation_fee_percentage must be a number between 0 and 100' },
          { status: 400 }
        );
      }
    }

    if (body.enabled !== undefined && typeof body.enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'enabled must be a boolean' },
        { status: 400 }
      );
    }

    // Build update object with only allowed fields
    const allowedFields = [
      'deposit_percentage',
      'payment_window_hours',
      'reminder_hours_before',
      'bank_name',
      'bsb',
      'account_number',
      'account_name',
      'payid_identifier',
      'payid_type',
      'cancellation_fee_percentage',
      'enabled',
    ] as const;

    const updateData: Record<string, unknown> = {
      updated_by: adminCheck.userId,
      updated_at: new Date().toISOString(),
    };

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Update settings
    const { data: updatedSettings, error: updateError } = await supabase
      .from('bank_transfer_settings')
      .update(updateData)
      .eq('id', 1)
      .select()
      .single();

    if (updateError || !updatedSettings) {
      logger.error('Failed to update bank transfer settings:', updateError);
      return NextResponse.json(
        { error: 'Failed to update bank transfer settings' },
        { status: 500 }
      );
    }

    // Audit log
    const { error: auditError } = await supabase.from('audit_logs').insert({
      action_type: 'bank_transfer_settings_updated',
      entity_type: 'bank_transfer_settings',
      entity_id: '1',
      description: 'Bank transfer settings updated by admin',
      metadata: {
        updated_by_clerk_id: adminCheck.userId,
        updated_fields: Object.keys(body).filter((key) =>
          (allowedFields as readonly string[]).includes(key)
        ),
        new_values: updateData,
      },
      created_at: new Date().toISOString(),
    });

    if (auditError) {
      logger.error('Failed to create audit log (non-fatal):', auditError);
    }

    logger.log('Bank transfer settings updated successfully');

    return NextResponse.json({ data: updatedSettings });
  } catch (error: unknown) {
    logger.error('Error updating bank transfer settings:', error);
    return NextResponse.json(
      { error: 'Failed to update bank transfer settings' },
      { status: 500 }
    );
  }
}
