import { createClient } from '@supabase/supabase-js';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('RETENTION');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export interface TableRetentionStats {
  tableName: string;
  total: number;
  active: number;
  archived: number;
  expiringIn6Months: number;
  expiringIn12Months: number;
}

export interface RetentionReport {
  tables: TableRetentionStats[];
  generatedAt: string;
}

export interface ArchivalResult {
  archivedCounts: Record<string, number>;
  totalArchived: number;
  archivedAt: string;
}

const RETENTION_TABLES = [
  'transactions',
  'customers',
  'identity_verifications',
  'sanctions_screenings',
  'suspicious_activity_reports',
  'edd_investigations',
  'audit_logs',
] as const;

type RetentionTable = typeof RETENTION_TABLES[number];

async function getTableStats(tableName: RetentionTable): Promise<TableRetentionStats> {
  const now = new Date();
  const in6Months = new Date(now);
  in6Months.setMonth(in6Months.getMonth() + 6);
  const in12Months = new Date(now);
  in12Months.setMonth(in12Months.getMonth() + 12);

  const [totalResult, archivedResult, expiring6Result, expiring12Result] = await Promise.all([
    supabase.from(tableName).select('*', { count: 'exact', head: true }),
    supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true })
      .not('archived_at', 'is', null),
    supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true })
      .is('archived_at', null)
      .lte('retention_expires_at', in6Months.toISOString())
      .gte('retention_expires_at', now.toISOString()),
    supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true })
      .is('archived_at', null)
      .lte('retention_expires_at', in12Months.toISOString())
      .gte('retention_expires_at', now.toISOString()),
  ]);

  const total = totalResult.count ?? 0;
  const archived = archivedResult.count ?? 0;
  const active = total - archived;
  const expiringIn6Months = expiring6Result.count ?? 0;
  const expiringIn12Months = expiring12Result.count ?? 0;

  return { tableName, total, active, archived, expiringIn6Months, expiringIn12Months };
}

export async function getRetentionReport(): Promise<RetentionReport> {
  const tables = await Promise.all(RETENTION_TABLES.map(getTableStats));
  return { tables, generatedAt: new Date().toISOString() };
}

export async function archiveExpiredRecords(): Promise<ArchivalResult> {
  const now = new Date().toISOString();
  const archivedCounts: Record<string, number> = {};
  let totalArchived = 0;

  for (const tableName of RETENTION_TABLES) {
    try {
      // Use rpc to do an UPDATE...WHERE with a count return
      const { data, error } = await supabase
        .from(tableName)
        .update({ archived_at: now })
        .is('archived_at', null)
        .lt('retention_expires_at', now)
        .select('id');

      if (error) {
        logger.error(`Failed to archive ${tableName}:`, error);
        archivedCounts[tableName] = 0;
        continue;
      }

      const count = data?.length ?? 0;
      archivedCounts[tableName] = count;
      totalArchived += count;

      if (count > 0) {
        logger.log(`Archived ${count} records from ${tableName}`);
      }
    } catch (err) {
      logger.error(`Unexpected error archiving ${tableName}:`, err);
      archivedCounts[tableName] = 0;
    }
  }

  return { archivedCounts, totalArchived, archivedAt: now };
}

export async function getExpiringRecords(months: number) {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() + months);

  const results: Record<string, unknown[]> = {};

  for (const tableName of RETENTION_TABLES) {
    const { data, error } = await supabase
      .from(tableName)
      .select('id, created_at, retention_expires_at')
      .is('archived_at', null)
      .lte('retention_expires_at', cutoff.toISOString())
      .gte('retention_expires_at', now.toISOString())
      .order('retention_expires_at', { ascending: true });

    if (error) {
      logger.error(`Failed to get expiring records for ${tableName}:`, error);
      results[tableName] = [];
    } else {
      results[tableName] = data ?? [];
    }
  }

  return results;
}
