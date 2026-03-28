import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createLogger } from '@/lib/utils/logger';
import { exportAllTables } from '@/lib/backup/export-tables';
import { sendComplianceAlert } from '@/lib/email/sendComplianceAlert';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Vercel Pro plan allows up to 10-min function timeout — backup needs it
export const maxDuration = 600;

const logger = createLogger('CRON_DB_BACKUP');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

/**
 * Daily database backup cron — exports compliance-critical tables to S3.
 *
 * Schedule: daily at 16:00 UTC (2 AM AEST next day)
 * Vercel cron entry in vercel.json:
 *   { "path": "/api/cron/db-backup", "schedule": "0 16 * * *" }
 *
 * Required env vars:
 *   AWS_S3_BACKUP_BUCKET   — S3 bucket name (e.g. "anb-db-backups")
 *   AWS_S3_BACKUP_REGION   — S3 region (default ap-southeast-2)
 *   AWS_ACCESS_KEY_ID      — shared with SES/SNS
 *   AWS_SECRET_ACCESS_KEY  — shared with SES/SNS
 *
 * Optional:
 *   SUPABASE_PROJECT_REF   — Supabase project reference (for Management API use in future)
 *
 * S3 bucket lifecycle rules (configure in AWS console — cannot be set from code):
 *   - Transition to S3 Standard-IA after 30 days
 *   - Expire after 2557 days (7 years) to meet AUSTRAC record retention requirements
 *   - Enable versioning on the bucket for accidental delete protection
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const isVercelCron = req.headers.get('x-vercel-cron') === '1';

  if (cronSecret && authHeader !== `Bearer ${cronSecret}` && !isVercelCron) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!cronSecret && !isVercelCron && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  logger.log('Starting daily database backup...');
  const startTime = Date.now();

  try {
    const result = await exportAllTables();
    const durationSec = (result.durationMs / 1000).toFixed(1);

    const successCount = result.tables.filter(t => !t.error).length;
    const failCount = result.errors.length;

    // Write success audit log
    const { error: auditError } = await supabase.from('audit_logs').insert({
      action_type: 'db_backup_completed',
      entity_type: 'system',
      entity_id: null,
      description: `Daily DB backup completed: ${successCount} tables exported to S3`,
      metadata: {
        date: result.date,
        tables_succeeded: successCount,
        tables_failed: failCount,
        total_rows: result.totalRows,
        total_size_bytes: result.totalSizeBytes,
        duration_ms: result.durationMs,
        errors: result.errors.length > 0 ? result.errors : undefined,
      },
      created_at: new Date().toISOString(),
    });

    if (auditError) {
      logger.error('Failed to write backup audit log (non-fatal):', auditError);
    }

    // Send alert if any table failed
    if (failCount > 0) {
      await sendComplianceAlert({
        type: 'db_backup_partial_failure',
        severity: 'high',
        title: `DB Backup: ${failCount} table(s) failed`,
        description: `Daily backup on ${result.date} completed with errors. ${successCount}/${result.tables.length} tables succeeded.`,
        metadata: {
          count: failCount,
          // Errors surfaced in admin status endpoint
        },
        actionUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/admin/backup`,
      });
    }

    logger.log(
      `Backup complete in ${durationSec}s — ${successCount} tables, ` +
      `${result.totalRows} rows, ${(result.totalSizeBytes / 1024).toFixed(0)} KB`,
    );

    return NextResponse.json({
      success: true,
      date: result.date,
      tablesSucceeded: successCount,
      tablesFailed: failCount,
      totalRows: result.totalRows,
      totalSizeBytes: result.totalSizeBytes,
      durationMs: result.durationMs,
      tables: result.tables.map(t => ({
        table: t.table,
        rowCount: t.rowCount,
        sizeBytes: t.sizeBytes,
        durationMs: t.durationMs,
        ...(t.error ? { error: t.error } : {}),
      })),
      errors: result.errors.length > 0 ? result.errors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('DB backup cron failed entirely:', error);

    // Alert admin on total failure
    try {
      await sendComplianceAlert({
        type: 'db_backup_failed',
        severity: 'critical',
        title: 'DB Backup Failed',
        description: `Daily database backup failed to run. Data may not be protected. Error: ${message}`,
        actionUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/admin/backup`,
      });
    } catch (alertErr) {
      logger.error('Also failed to send backup failure alert:', alertErr);
    }

    return NextResponse.json(
      {
        success: false,
        error: message,
        durationMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
