import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createLogger } from '@/lib/utils/logger';
import { requireManagement } from '@/lib/auth/admin';

const logger = createLogger('SALES_HALT');

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

const VALID_METAL_TYPES = ['XAU', 'XAG', 'XPT', 'XPD'] as const;

// PUT: Update auto-halt threshold configuration for a specific metal
export async function PUT(req: NextRequest) {
  const authCheck = await requireManagement();
  if (!authCheck.authorized) return authCheck.error;

  const userId = authCheck.userId;

  try {
    const body = await req.json();
    const { metal_type, drop_threshold_pct, check_window_minutes, enabled } = body;

    // Validate metal_type (no ALL for config — auto-halt is per-metal only)
    if (!metal_type || !VALID_METAL_TYPES.includes(metal_type)) {
      return NextResponse.json(
        { error: 'Invalid metal_type: must be one of XAU, XAG, XPT, XPD' },
        { status: 400 }
      );
    }

    // Validate drop_threshold_pct
    if (drop_threshold_pct !== undefined) {
      if (typeof drop_threshold_pct !== 'number' || drop_threshold_pct <= 0 || drop_threshold_pct > 50) {
        return NextResponse.json(
          { error: 'Invalid drop_threshold_pct: must be a number between 0 (exclusive) and 50' },
          { status: 400 }
        );
      }
    }

    // Validate check_window_minutes
    if (check_window_minutes !== undefined) {
      if (
        typeof check_window_minutes !== 'number' ||
        !Number.isInteger(check_window_minutes) ||
        check_window_minutes < 5 ||
        check_window_minutes > 1440
      ) {
        return NextResponse.json(
          { error: 'Invalid check_window_minutes: must be an integer between 5 and 1440' },
          { status: 400 }
        );
      }
    }

    // Validate enabled
    if (enabled !== undefined) {
      if (typeof enabled !== 'boolean') {
        return NextResponse.json(
          { error: 'Invalid enabled: must be a boolean' },
          { status: 400 }
        );
      }
    }

    // At least one config field must be provided
    if (drop_threshold_pct === undefined && check_window_minutes === undefined && enabled === undefined) {
      return NextResponse.json(
        { error: 'No configuration fields provided to update' },
        { status: 400 }
      );
    }

    // Fetch existing config row
    const { data: existing, error: fetchError } = await supabase
      .from('sales_halt_config')
      .select('*')
      .eq('metal_type', metal_type)
      .single();

    if (fetchError || !existing) {
      logger.error('Config not found:', fetchError);
      return NextResponse.json(
        { error: `Config not found for metal_type: ${metal_type}` },
        { status: 404 }
      );
    }

    // Build partial update object
    const now = new Date().toISOString();
    const updateData: Record<string, unknown> = {
      updated_at: now,
      updated_by: userId,
    };
    const changes: Record<string, unknown> = {};

    if (drop_threshold_pct !== undefined) {
      updateData.drop_threshold_pct = drop_threshold_pct;
      changes.drop_threshold_pct = drop_threshold_pct;
    }
    if (check_window_minutes !== undefined) {
      updateData.check_window_minutes = check_window_minutes;
      changes.check_window_minutes = check_window_minutes;
    }
    if (enabled !== undefined) {
      updateData.enabled = enabled;
      changes.enabled = enabled;
    }

    // Update the config row
    const { data: updated, error: updateError } = await supabase
      .from('sales_halt_config')
      .update(updateData)
      .eq('metal_type', metal_type)
      .select()
      .single();

    if (updateError) {
      logger.error('Error updating halt config:', updateError);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    // Audit log with previous values for compliance traceability
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
    const userAgent = req.headers.get('user-agent') || null;
    const { error: auditError } = await supabase.from('audit_logs').insert({
      action_type: 'sales_halt_config_update',
      entity_type: 'sales_halt_config',
      entity_id: existing.id,
      description: `Auto-halt config updated for ${metal_type}`,
      metadata: {
        metal_type,
        previous: {
          drop_threshold_pct: existing.drop_threshold_pct,
          check_window_minutes: existing.check_window_minutes,
          enabled: existing.enabled,
        },
        changes,
        admin_user_id: userId,
      },
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    if (auditError) {
      logger.error('Failed to write config audit log:', auditError);
    }

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    logger.error('Unexpected error in PUT /api/admin/sales-halt/config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
