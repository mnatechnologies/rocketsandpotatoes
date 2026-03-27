'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface BackupEntry {
  timestamp: string;
  status: 'success' | 'failed';
  tablesSucceeded: number | null;
  tablesFailed: number | null;
  totalRows: number | null;
  errors: string[];
}

interface BackupStatus {
  lastBackup: {
    timestamp: string;
    status: 'success' | 'failed';
    description: string;
    tablesSucceeded: number | null;
    tablesFailed: number | null;
    totalRows: number | null;
    totalSizeBytes: number | null;
    durationMs: number | null;
    errors: string[];
  } | null;
  history: BackupEntry[];
  s3Bucket: string | null;
}

function formatBytes(bytes: number | null): string {
  if (bytes === null || bytes === undefined) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(ms: number | null): string {
  if (ms === null || ms === undefined) return '-';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function StatusBadge({ status }: { status: 'success' | 'failed' }) {
  const styles = status === 'success'
    ? 'bg-green-100 text-green-800 border-green-200'
    : 'bg-red-100 text-red-800 border-red-200';
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full border ${styles}`}>
      {status === 'success' ? 'Success' : 'Failed'}
    </span>
  );
}

export default function BackupStatusPage() {
  const [data, setData] = useState<BackupStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/backup/status?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch backup status');
      const json = await res.json();
      setData(json);
    } catch {
      toast.error('Failed to load backup status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">Loading backup status...</p>
      </div>
    );
  }

  const last = data?.lastBackup;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-1">Database Backups</h1>
        <p className="text-muted-foreground">
          Daily automated backups of compliance-critical tables to S3
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 dark:bg-blue-950/30 dark:border-blue-800">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>Schedule:</strong> Daily at 2:00 AM AEST &mdash; 8 compliance tables exported as JSON to S3.
          {data?.s3Bucket && (
            <span className="block mt-1">
              <strong>Destination:</strong>{' '}
              <code className="text-xs bg-blue-100 dark:bg-blue-900 px-1.5 py-0.5 rounded">{data.s3Bucket}</code>
            </span>
          )}
        </p>
      </div>

      {/* Last Backup Summary */}
      {last ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Last Backup</p>
            <p className="text-sm font-semibold text-foreground">
              {new Date(last.timestamp).toLocaleDateString('en-AU', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(last.timestamp).toLocaleTimeString('en-AU', {
                hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Status</p>
            <StatusBadge status={last.status} />
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Tables / Rows</p>
            <p className="text-sm font-semibold text-foreground">
              {last.tablesSucceeded ?? '-'} tables &middot; {last.totalRows?.toLocaleString() ?? '-'} rows
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Size / Duration</p>
            <p className="text-sm font-semibold text-foreground">
              {formatBytes(last.totalSizeBytes)} &middot; {formatDuration(last.durationMs)}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg p-6 mb-6 text-center">
          <p className="text-muted-foreground text-sm">
            No backups recorded yet. The first backup will run at 2:00 AM AEST.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Ensure <code className="bg-muted px-1 py-0.5 rounded">AWS_S3_BACKUP_BUCKET</code> and{' '}
            <code className="bg-muted px-1 py-0.5 rounded">AWS_S3_BACKUP_REGION</code> are set in Vercel.
          </p>
        </div>
      )}

      {/* Error Details */}
      {last && last.errors && last.errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 dark:bg-red-950/30 dark:border-red-800">
          <h3 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">
            Errors from Last Backup
          </h3>
          <ul className="text-xs text-red-700 dark:text-red-400 space-y-1">
            {last.errors.map((err, i) => (
              <li key={i} className="font-mono">{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Backup History */}
      <h2 className="text-lg font-semibold text-foreground mb-3">Backup History</h2>
      {data?.history && data.history.length > 0 ? (
        <div className="bg-card border border-border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tables</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rows</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Errors</th>
              </tr>
            </thead>
            <tbody>
              {data.history.map((entry, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    {new Date(entry.timestamp).toLocaleDateString('en-AU', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}{' '}
                    <span className="text-muted-foreground">
                      {new Date(entry.timestamp).toLocaleTimeString('en-AU', {
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={entry.status} />
                  </td>
                  <td className="px-4 py-3">
                    {entry.tablesSucceeded ?? '-'}
                    {entry.tablesFailed ? (
                      <span className="text-red-600 ml-1">({entry.tablesFailed} failed)</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">{entry.totalRows?.toLocaleString() ?? '-'}</td>
                  <td className="px-4 py-3">
                    {entry.errors.length > 0 ? (
                      <span className="text-red-600 text-xs">{entry.errors.length} error(s)</span>
                    ) : (
                      <span className="text-green-600 text-xs">None</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No backup history available.
        </div>
      )}
    </div>
  );
}
