'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, Download } from 'lucide-react';

interface AuditLog {
  id: string;
  action_type: string;
  entity_type: string;
  entity_id: string | null;
  description: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface Filters {
  actionTypes: string[];
  entityTypes: string[];
}

const formatActionType = (action: string): string => {
  return action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

const getActionColor = (action: string): string => {
  if (action.includes('match') || action.includes('blocked') || action.includes('rejected')) {
    return 'bg-red-100 text-red-800';
  }
  if (action.includes('alert') || action.includes('flagged') || action.includes('smr')) {
    return 'bg-amber-100 text-amber-800';
  }
  if (action.includes('approved') || action.includes('verified') || action.includes('submitted')) {
    return 'bg-green-100 text-green-800';
  }
  if (action.includes('created') || action.includes('declared')) {
    return 'bg-blue-100 text-blue-800';
  }
  return 'bg-gray-100 text-gray-800';
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<Filters>({ actionTypes: [], entityTypes: [] });

  // Filter state
  const [actionTypeFilter, setActionTypeFilter] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [entityIdSearch, setEntityIdSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination
  const [page, setPage] = useState(0);
  const limit = 50;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('limit', limit.toString());
      params.set('offset', (page * limit).toString());

      if (actionTypeFilter) params.set('action_type', actionTypeFilter);
      if (entityTypeFilter) params.set('entity_type', entityTypeFilter);
      if (entityIdSearch) params.set('entity_id', entityIdSearch);
      if (startDate) params.set('start_date', startDate);
      if (endDate) params.set('end_date', endDate);

      const response = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch audit logs');

      const data = await response.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setFilters(data.filters || { actionTypes: [], entityTypes: [] });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load audit logs';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [page, actionTypeFilter, entityTypeFilter, entityIdSearch, startDate, endDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleExportCSV = () => {
    if (logs.length === 0) {
      alert('No logs to export.');
      return;
    }

    const headers = ['Timestamp', 'Action', 'Entity Type', 'Entity ID', 'Description', 'Metadata'];
    const rows = logs.map(log => [
      new Date(log.created_at).toISOString(),
      log.action_type,
      log.entity_type,
      log.entity_id || '',
      `"${log.description.replace(/"/g, '""')}"`,
      log.metadata ? `"${JSON.stringify(log.metadata).replace(/"/g, '""')}"` : '',
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const totalPages = Math.ceil(total / limit);

  if (loading && logs.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-muted-foreground">Loading audit logs...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Audit Logs</h1>
          <p className="text-muted-foreground">
            Complete history of all compliance-related actions and system events
          </p>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-lg shadow p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium text-card-foreground">Filters</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Action Type</label>
              <select
                value={actionTypeFilter}
                onChange={(e) => {
                  setActionTypeFilter(e.target.value);
                  setPage(0);
                }}
                className="w-full p-2 border border-border rounded-lg bg-input text-foreground text-sm"
              >
                <option value="">All Actions</option>
                {filters.actionTypes.map(type => (
                  <option key={type} value={type}>{formatActionType(type)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">Entity Type</label>
              <select
                value={entityTypeFilter}
                onChange={(e) => {
                  setEntityTypeFilter(e.target.value);
                  setPage(0);
                }}
                className="w-full p-2 border border-border rounded-lg bg-input text-foreground text-sm"
              >
                <option value="">All Entities</option>
                {filters.entityTypes.map(type => (
                  <option key={type} value={type}>{formatActionType(type)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">Entity ID</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={entityIdSearch}
                  onChange={(e) => {
                    setEntityIdSearch(e.target.value);
                    setPage(0);
                  }}
                  placeholder="Search by ID..."
                  className="w-full pl-8 p-2 border border-border rounded-lg bg-input text-foreground text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(0);
                }}
                className="w-full p-2 border border-border rounded-lg bg-input text-foreground text-sm"
              />
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(0);
                }}
                className="w-full p-2 border border-border rounded-lg bg-input text-foreground text-sm"
              />
            </div>
          </div>

          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => {
                setActionTypeFilter('');
                setEntityTypeFilter('');
                setEntityIdSearch('');
                setStartDate('');
                setEndDate('');
                setPage(0);
              }}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Clear Filters
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive-foreground">
            {error}
          </div>
        )}

        {/* Results count */}
        <div className="mb-4 text-sm text-muted-foreground">
          Showing {logs.length} of {total} logs
        </div>

        {/* Logs table */}
        <div className="bg-card rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Entity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                      <div>{new Date(log.created_at).toLocaleDateString()}</div>
                      <div className="text-xs">{new Date(log.created_at).toLocaleTimeString()}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action_type)}`}>
                        {formatActionType(log.action_type)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <div className="text-card-foreground">{formatActionType(log.entity_type)}</div>
                      {log.entity_id && (
                        <div className="text-xs text-muted-foreground font-mono">
                          {log.entity_id.slice(0, 8)}...
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-card-foreground max-w-md">
                      <div className="truncate" title={log.description}>
                        {log.description}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <details className="cursor-pointer">
                          <summary className="text-primary text-xs">View metadata</summary>
                          <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-w-xs max-h-32">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Page {page + 1} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-2 border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-2 border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Info box */}
        <div className="mt-6 bg-card border border-border rounded-lg p-4">
          <h3 className="font-semibold text-card-foreground mb-2">About Audit Logs</h3>
          <p className="text-sm text-muted-foreground">
            All compliance-related actions are automatically logged for regulatory purposes. 
            Logs are retained for 7 years as required by AUSTRAC. Actions include customer verification, 
            sanctions screening, transaction reviews, TTR/SMR submissions, and administrative decisions.
          </p>
        </div>
      </div>
    </div>
  );
}








