import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { archiveExpiredRecords, getRetentionReport } from '@/lib/compliance/retention';
import { sendComplianceAlert } from '@/lib/email/sendComplianceAlert';
import { createLogger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const logger = createLogger('CRON_RETENTION_CHECK');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const isVercelCron = req.headers.get('x-vercel-cron') === '1';

  if (cronSecret) {
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      logger.log('Unauthorized retention cron request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  if (!cronSecret && !isVercelCron) {
    if (process.env.NODE_ENV === 'production') {
      logger.log('Retention cron called without authorization in production');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  logger.log('Running monthly retention check...');

  try {
    const archivalResult = await archiveExpiredRecords();
    const report = await getRetentionReport();

    const totalActive = report.tables.reduce((sum, t) => sum + t.active, 0);
    const totalArchived = report.tables.reduce((sum, t) => sum + t.archived, 0);
    const totalExpiring6 = report.tables.reduce((sum, t) => sum + t.expiringIn6Months, 0);

    // Log to audit_logs
    await supabase.from('audit_logs').insert({
      action: 'retention_check_run',
      resource_type: 'system',
      resource_id: null,
      details: {
        archived_this_run: archivalResult.totalArchived,
        archived_per_table: archivalResult.archivedCounts,
        total_active: totalActive,
        total_archived: totalArchived,
        expiring_in_6_months: totalExpiring6,
      },
      performed_by: 'system_cron',
      created_at: new Date().toISOString(),
    });

    // Send compliance alert if anything was archived or records are expiring soon
    if (archivalResult.totalArchived > 0 || totalExpiring6 > 0) {
      await sendComplianceAlert({
        type: 'retention_check',
        severity: totalExpiring6 > 0 ? 'medium' : 'low',
        title: 'Monthly Retention Check Complete',
        description: `AUSTRAC 7-year retention check completed. ${archivalResult.totalArchived} records archived this run. ${totalExpiring6} records expiring within 6 months require review.`,
        metadata: {
          count: archivalResult.totalArchived,
        },
        actionUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/admin/retention`,
      });
    }

    logger.log(
      `Retention check complete. Archived: ${archivalResult.totalArchived}, Active: ${totalActive}, Expiring (6mo): ${totalExpiring6}`
    );

    return NextResponse.json({
      success: true,
      message: 'Retention check completed',
      archivedThisRun: archivalResult.totalArchived,
      archivedPerTable: archivalResult.archivedCounts,
      totalActive,
      totalArchived,
      expiringIn6Months: totalExpiring6,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Retention check cron failed:', error);

    return NextResponse.json(
      { success: false, error: message, timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
