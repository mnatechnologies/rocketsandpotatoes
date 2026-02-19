import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createLogger } from '@/lib/utils/logger';
import { requireManagement } from '@/lib/auth/admin';
import { sendEmail } from '@/lib/email/ses';
import { waitUntil } from '@vercel/functions';

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

const VALID_HALT_TARGETS = ['ALL', 'XAU', 'XAG', 'XPT', 'XPD'] as const;

function getAdminAlertRecipients(): string[] {
  const emails = process.env.ADMIN_ALERT_EMAILS || '';
  return emails
    .split(',')
    .map(email => email.trim())
    .filter(email => email.length > 0);
}

// GET: Fetch current halt states, config, and recent history
export async function GET() {
  const authCheck = await requireManagement();
  if (!authCheck.authorized) return authCheck.error;

  try {
    // Fetch all halt states
    const { data: halt_states, error: haltError } = await supabase
      .from('sales_halt')
      .select('*')
      .order('metal_type');

    if (haltError) {
      logger.error('Error fetching halt states:', haltError);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    // Fetch all config rows
    const { data: config, error: configError } = await supabase
      .from('sales_halt_config')
      .select('*')
      .order('metal_type');

    if (configError) {
      logger.error('Error fetching halt config:', configError);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    // Fetch recent halt/resume history from audit_logs
    const { data: auditRows, error: historyError } = await supabase
      .from('audit_logs')
      .select('*')
      .in('action_type', ['sales_halt', 'sales_resume'])
      .order('created_at', { ascending: false })
      .limit(50);

    if (historyError) {
      logger.error('Error fetching halt history:', historyError);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    // Map audit rows into the history shape
    const history = (auditRows || []).map((row: Record<string, unknown>) => {
      const metadata = (row.metadata || {}) as Record<string, unknown>;
      return {
        metal_type: metadata.metal_type || null,
        event: row.action_type === 'sales_halt' ? 'halted' : 'resumed',
        triggered_by: metadata.admin_user_id || 'auto',
        reason: metadata.reason || null,
        timestamp: row.created_at,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        halt_states: halt_states || [],
        config: config || [],
        history,
      },
    });
  } catch (error) {
    logger.error('Unexpected error in GET /api/admin/sales-halt:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Manual halt or resume sales for a metal or globally
export async function PUT(req: NextRequest) {
  const authCheck = await requireManagement();
  if (!authCheck.authorized) return authCheck.error;

  const userId = authCheck.userId;

  try {
    const body = await req.json();
    const { metal_type, is_halted, reason } = body;

    // Validate metal_type
    if (!metal_type || !VALID_HALT_TARGETS.includes(metal_type)) {
      return NextResponse.json(
        { error: 'Invalid metal_type: must be one of ALL, XAU, XAG, XPT, XPD' },
        { status: 400 }
      );
    }

    // Validate is_halted
    if (typeof is_halted !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid is_halted: must be a boolean' },
        { status: 400 }
      );
    }

    // Validate reason
    if (reason !== undefined && reason !== null) {
      if (typeof reason !== 'string' || reason.length === 0 || reason.length > 500) {
        return NextResponse.json(
          { error: 'Invalid reason: must be a string with max 500 characters' },
          { status: 400 }
        );
      }
    }

    // Fetch current state
    const { data: existing, error: fetchError } = await supabase
      .from('sales_halt')
      .select('*')
      .eq('metal_type', metal_type)
      .single();

    if (fetchError || !existing) {
      logger.error('Halt record not found:', fetchError);
      return NextResponse.json(
        { error: `Halt record not found for metal_type: ${metal_type}` },
        { status: 404 }
      );
    }

    // Idempotency: if state already matches, return current state without update
    if (existing.is_halted === is_halted) {
      return NextResponse.json({
        success: true,
        data: existing,
      });
    }

    const now = new Date().toISOString();

    if (is_halted) {
      // Halting
      const haltReason = reason || 'Manual halt by admin';
      const { data: updated, error: updateError } = await supabase
        .from('sales_halt')
        .update({
          is_halted: true,
          halted_at: now,
          halted_by: userId,
          halt_reason: haltReason,
          resumed_at: null,
          resumed_by: null,
          updated_at: now,
        })
        .eq('metal_type', metal_type)
        .select()
        .single();

      if (updateError) {
        logger.error('Error halting sales:', updateError);
        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        );
      }

      // Audit log
      const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
      const userAgent = req.headers.get('user-agent') || null;
      const { error: auditError } = await supabase.from('audit_logs').insert({
        action_type: 'sales_halt',
        entity_type: 'sales_halt',
        entity_id: existing.id,
        description: `Sales halted for ${metal_type} by admin`,
        metadata: {
          metal_type,
          is_halted: true,
          reason: haltReason,
          admin_user_id: userId,
        },
        ip_address: ipAddress,
        user_agent: userAgent,
      });

      if (auditError) {
        logger.error('Failed to write halt audit log:', auditError);
      }

      // Send email notification (non-blocking, kept alive via waitUntil)
      waitUntil(sendHaltNotificationEmail(metal_type, true, haltReason, userId));

      return NextResponse.json({
        success: true,
        data: updated,
      });
    } else {
      // Resuming
      const { data: updated, error: updateError } = await supabase
        .from('sales_halt')
        .update({
          is_halted: false,
          resumed_at: now,
          resumed_by: userId,
          updated_at: now,
        })
        .eq('metal_type', metal_type)
        .select()
        .single();

      if (updateError) {
        logger.error('Error resuming sales:', updateError);
        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        );
      }

      // Audit log
      const resumeIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
      const resumeUa = req.headers.get('user-agent') || null;
      const { error: resumeAuditError } = await supabase.from('audit_logs').insert({
        action_type: 'sales_resume',
        entity_type: 'sales_halt',
        entity_id: existing.id,
        description: `Sales resumed for ${metal_type} by admin`,
        metadata: {
          metal_type,
          is_halted: false,
          reason: reason || null,
          admin_user_id: userId,
        },
        ip_address: resumeIp,
        user_agent: resumeUa,
      });

      if (resumeAuditError) {
        logger.error('Failed to write resume audit log:', resumeAuditError);
      }

      // Send email notification (non-blocking, kept alive via waitUntil)
      waitUntil(sendHaltNotificationEmail(metal_type, false, reason || null, userId));

      return NextResponse.json({
        success: true,
        data: updated,
      });
    }
  } catch (error) {
    logger.error('Unexpected error in PUT /api/admin/sales-halt:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function sendHaltNotificationEmail(
  metalType: string,
  isHalted: boolean,
  reason: string | null,
  adminUserId: string | null
) {
  const recipients = getAdminAlertRecipients();
  if (recipients.length === 0) {
    logger.warn('No ADMIN_ALERT_EMAILS configured, skipping notification');
    return;
  }

  const action = isHalted ? 'HALTED' : 'RESUMED';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
  const subject = `[ANB] Sales ${action} for ${metalType}`;

  const html = `
    <h2>Sales ${action} for ${metalType}</h2>
    <p><strong>Metal:</strong> ${metalType}</p>
    <p><strong>Action:</strong> ${action}</p>
    ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
    <p><strong>By:</strong> ${adminUserId || 'Unknown'}</p>
    <p><strong>Time:</strong> ${new Date().toISOString()}</p>
    <p><a href="${baseUrl}/admin/sales-control">View Sales Control Dashboard</a></p>
  `;

  try {
    await sendEmail({ to: recipients, subject, html });
    logger.log(`Halt notification email sent to ${recipients.length} recipients`);
  } catch (error) {
    logger.error('Failed to send halt notification email:', error);
  }
}
