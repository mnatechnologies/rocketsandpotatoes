import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createLogger } from '@/lib/utils/logger';
import { requireAdmin } from '@/lib/auth/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const logger = createLogger('ADMIN_BACKUP_STATUS');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

/**
 * GET /api/admin/backup/status
 *
 * Returns the last backup run details from audit_logs.
 * Used by the admin UI to surface backup health.
 */
export async function GET(req: NextRequest) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.authorized) return adminCheck.error;

  try {
    // Fetch the last 10 backup audit log entries
    const { data: backupLogs, error } = await supabase
      .from('audit_logs')
      .select('action_type, description, metadata, created_at')
      .eq('entity_type', 'system')
      .eq('entity_id', 'db-backup')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      logger.error('Failed to fetch backup audit logs:', error);
      return NextResponse.json({ error: 'Failed to fetch backup status' }, { status: 500 });
    }

    const lastBackup = backupLogs?.[0] ?? null;

    return NextResponse.json({
      lastBackup: lastBackup
        ? {
            timestamp: lastBackup.created_at,
            status: lastBackup.action_type === 'db_backup_completed' ? 'success' : 'failed',
            description: lastBackup.description,
            tablesSucceeded: lastBackup.metadata?.tables_succeeded ?? null,
            tablesFailed: lastBackup.metadata?.tables_failed ?? null,
            totalRows: lastBackup.metadata?.total_rows ?? null,
            totalSizeBytes: lastBackup.metadata?.total_size_bytes ?? null,
            durationMs: lastBackup.metadata?.duration_ms ?? null,
            errors: lastBackup.metadata?.errors ?? [],
          }
        : null,
      history: (backupLogs ?? []).map(log => ({
        timestamp: log.created_at,
        status: log.action_type === 'db_backup_completed' ? 'success' : 'failed',
        tablesSucceeded: log.metadata?.tables_succeeded ?? null,
        tablesFailed: log.metadata?.tables_failed ?? null,
        totalRows: log.metadata?.total_rows ?? null,
        errors: log.metadata?.errors ?? [],
      })),
      s3Bucket: process.env.AWS_S3_BACKUP_BUCKET
        ? `s3://${process.env.AWS_S3_BACKUP_BUCKET}/backups/`
        : null,
    });
  } catch (error) {
    logger.error('Unexpected error fetching backup status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
