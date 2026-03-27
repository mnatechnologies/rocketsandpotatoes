'use client';

import { useState, useEffect } from 'react';

interface TableRetentionStats {
  tableName: string;
  total: number;
  active: number;
  archived: number;
  expiringIn6Months: number;
  expiringIn12Months: number;
}

interface RetentionReport {
  tables: TableRetentionStats[];
  generatedAt: string;
}

function formatTableName(name: string): string {
  return name
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function RetentionPage() {
  const [report, setReport] = useState<RetentionReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/retention', { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load retention data');
        const json = await res.json();
        setReport(json.report);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unknown error'))
      .finally(() => setLoading(false));
  }, []);

  const totalActive = report?.tables.reduce((s, t) => s + t.active, 0) ?? 0;
  const totalArchived = report?.tables.reduce((s, t) => s + t.archived, 0) ?? 0;
  const totalExpiring6 = report?.tables.reduce((s, t) => s + t.expiringIn6Months, 0) ?? 0;
  const totalExpiring12 = report?.tables.reduce((s, t) => s + t.expiringIn12Months, 0) ?? 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-1">Record Retention</h1>
        <p className="text-muted-foreground">
          AUSTRAC AML/CTF Act requires compliance records to be retained for a minimum of 7 years.
        </p>
      </div>

      {/* Info banner */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
        <strong>7-Year Retention Policy:</strong> All compliance records (transactions, customer KYC,
        identity verifications, sanctions screenings, SMRs, EDD investigations, and audit logs) must
        be retained for at least 7 years from the date of creation, as required by the{' '}
        <em>Anti-Money Laundering and Counter-Terrorism Financing Act 2006</em>. Records are never
        deleted — they are archived after 7 years and remain accessible to authorised users. A
        monthly cron job runs on the 1st of each month to archive expired records.
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Loading retention data...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          Failed to load retention data: {error}
        </div>
      )}

      {!loading && !error && report && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="text-2xl font-bold text-foreground">{totalActive.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground mt-1">Total Active Records</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="text-2xl font-bold text-foreground">{totalArchived.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground mt-1">Records Archived</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <div className={`text-2xl font-bold ${totalExpiring6 > 0 ? 'text-amber-600' : 'text-foreground'}`}>
                {totalExpiring6.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Expiring in 6 Months</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <div className={`text-2xl font-bold ${totalExpiring12 > 0 ? 'text-yellow-600' : 'text-foreground'}`}>
                {totalExpiring12.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Expiring in 12 Months</div>
            </div>
          </div>

          {/* Per-table breakdown */}
          <div className="bg-card border border-border rounded-lg overflow-x-auto mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Table</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Active</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Archived</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Expiring 6mo</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Expiring 12mo</th>
                </tr>
              </thead>
              <tbody>
                {report.tables.map((row) => (
                  <tr key={row.tableName} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{formatTableName(row.tableName)}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {row.total.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">{row.active.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {row.archived.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {row.expiringIn6Months > 0 ? (
                        <span className="text-amber-600 font-medium">
                          {row.expiringIn6Months.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {row.expiringIn12Months > 0 ? (
                        <span className="text-yellow-600 font-medium">
                          {row.expiringIn12Months.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-muted-foreground">
            Report generated: {formatDate(report.generatedAt)}
          </p>
        </>
      )}
    </div>
  );
}
