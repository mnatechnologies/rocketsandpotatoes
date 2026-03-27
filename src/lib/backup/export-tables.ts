import { createClient } from '@supabase/supabase-js';
import { createLogger } from '@/lib/utils/logger';
import { uploadBackupToS3, UploadResult } from './s3-client';

const logger = createLogger('EXPORT_TABLES');

// Compliance-critical tables that must be backed up daily.
// Ordered from smallest/fastest to largest.
const BACKUP_TABLES = [
  'suspicious_activity_reports',
  'sanctions_screenings',
  'identity_verifications',
  'edd_investigations',
  'staff_training',
  'audit_logs',
  'customers',
  'transactions',
] as const;

// Page size for paginated reads — keeps memory usage bounded
const PAGE_SIZE = 500;

export interface TableExportResult {
  table: string;
  rowCount: number;
  sizeBytes: number;
  s3Key: string;
  durationMs: number;
  error?: string;
}

export interface ExportAllTablesResult {
  date: string;
  tables: TableExportResult[];
  totalRows: number;
  totalSizeBytes: number;
  durationMs: number;
  errors: string[];
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

async function exportTable(
  supabase: ReturnType<typeof getSupabase>,
  table: string,
  dateStr: string,
): Promise<TableExportResult> {
  const start = Date.now();
  const rows: unknown[] = [];
  let page = 0;

  // Paginate to avoid memory spikes on large tables (e.g. audit_logs)
  while (true) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from(table)
      .select('*')
      .range(from, to)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Supabase query failed on ${table} (page ${page}): ${error.message}`);
    }

    if (!data || data.length === 0) break;

    rows.push(...data);
    page++;

    if (data.length < PAGE_SIZE) break; // last page
  }

  const json = JSON.stringify({
    table,
    exported_at: new Date().toISOString(),
    row_count: rows.length,
    rows,
  });

  const s3Key = `backups/${dateStr}/${table}.json`;
  const uploaded = await uploadBackupToS3(s3Key, json);

  return {
    table,
    rowCount: rows.length,
    sizeBytes: uploaded.sizeBytes,
    s3Key,
    durationMs: Date.now() - start,
  };
}

export async function exportAllTables(): Promise<ExportAllTablesResult> {
  const overallStart = Date.now();
  const dateStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const supabase = getSupabase();

  const results: TableExportResult[] = [];
  const errors: string[] = [];

  for (const table of BACKUP_TABLES) {
    try {
      logger.log(`Exporting table: ${table}`);
      const result = await exportTable(supabase, table, dateStr);
      results.push(result);
      logger.log(`Exported ${table}: ${result.rowCount} rows, ${result.sizeBytes} bytes`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error(`Failed to export ${table}:`, err);
      errors.push(`${table}: ${msg}`);
      results.push({
        table,
        rowCount: 0,
        sizeBytes: 0,
        s3Key: `backups/${dateStr}/${table}.json`,
        durationMs: 0,
        error: msg,
      });
    }
  }

  return {
    date: dateStr,
    tables: results,
    totalRows: results.reduce((sum, r) => sum + r.rowCount, 0),
    totalSizeBytes: results.reduce((sum, r) => sum + r.sizeBytes, 0),
    durationMs: Date.now() - overallStart,
    errors,
  };
}
