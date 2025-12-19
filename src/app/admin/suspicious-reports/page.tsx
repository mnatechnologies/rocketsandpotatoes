'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';

interface SMRRecord {
  id: string;
  customer_id: string;
  transaction_id: string | null;
  report_type: string;
  suspicion_category: string;
  description: string;
  status: string;
  flagged_by_system: boolean;
  austrac_submitted_at: string | null;
  austrac_reference: string | null;
  submission_deadline: string | null;
  created_at: string;
  customer_name: string;
  customer_email: string;
  transaction_amount: number | null;
  days_remaining: number | null;
}

export default function SMRReportsPage() {
  const [smrRecords, setSmrRecords] = useState<SMRRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<'pending' | 'submitted' | 'dismissed' | 'all'>('pending');
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);
  const [austracReference, setAustracReference] = useState('');
  const [dismissNotes, setDismissNotes] = useState('');

  const fetchSMRRecords = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/smr-reports?status=${statusFilter}`);

      if (!response.ok) {
        throw new Error('Failed to fetch SMR records');
      }

      const data = await response.json();
      setSmrRecords(data.records || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load SMR records';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchSMRRecords();
  }, [fetchSMRRecords]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(smrRecords.map(record => record.id));
      setSelectedRecords(allIds);
    } else {
      setSelectedRecords(new Set());
    }
  };

  const handleSelectRecord = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedRecords);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedRecords(newSelected);
  };

  const handleAction = async (action: string) => {
    if (selectedRecords.size === 0) {
      alert('Please select at least one record');
      return;
    }

    if (action === 'mark_submitted') {
      if (!confirm(`Are you sure you want to mark ${selectedRecords.size} SMR(s) as submitted to AUSTRAC?`)) {
        return;
      }
    }

    if (action === 'dismiss') {
      if (!dismissNotes.trim()) {
        alert('Please provide a reason for dismissal');
        return;
      }
      if (!confirm(`Are you sure you want to dismiss ${selectedRecords.size} SMR(s)?`)) {
        return;
      }
    }

    try {
      const response = await fetch('/api/admin/smr-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smrIds: Array.from(selectedRecords),
          action,
          austracReference: austracReference || undefined,
          notes: dismissNotes || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to process request');
      }

      alert('Action completed successfully');
      setSelectedRecords(new Set());
      setAustracReference('');
      setDismissNotes('');
      fetchSMRRecords();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process request';
      alert(message);
    }
  };

  const handleExportCSV = async () => {
    if (smrRecords.length === 0) {
      alert('No records to export');
      return;
    }

    try {
      const response = await fetch(`/api/admin/smr-reports?status=${statusFilter}&format=csv`);

      if (!response.ok) {
        throw new Error('Failed to export CSV');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SMR_Report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to export CSV';
      alert(message);
    }
  };

  const getSeverityColor = (category: string, daysRemaining: number | null) => {
    if (daysRemaining !== null && daysRemaining <= 1) {
      return 'bg-red-100 text-red-800 border-red-300';
    }
    if (category === 'sanctions_match') {
      return 'bg-red-100 text-red-800 border-red-300';
    }
    if (category === 'structuring') {
      return 'bg-orange-100 text-orange-800 border-orange-300';
    }
    return 'bg-yellow-100 text-yellow-800 border-yellow-300';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'under_review':
        return 'bg-blue-100 text-blue-800';
      case 'reported':
        return 'bg-green-100 text-green-800';
      case 'dismissed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-muted-foreground">Loading SMR reports...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Suspicious Matter Reports (SMR)
          </h1>
          <p className="text-muted-foreground">
            Review and submit suspicious activity reports to AUSTRAC
          </p>
        </div>

        {/* Status Filter */}
        <div className="mb-6 flex gap-2">
          {(['pending', 'submitted', 'dismissed', 'all'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-card-foreground border border-border hover:bg-muted'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive-foreground">
            {error}
          </div>
        )}

        {smrRecords.length === 0 ? (
          <div className="bg-card rounded-lg shadow p-8 text-center">
            <div className="text-6xl mb-4">
              {statusFilter === 'pending' ? '✓' : '📋'}
            </div>
            <h2 className="text-2xl font-bold text-card-foreground mb-2">
              {statusFilter === 'pending' ? 'No Pending SMRs' : `No ${statusFilter} SMRs`}
            </h2>
            <p className="text-muted-foreground">
              {statusFilter === 'pending'
                ? 'All suspicious matter reports have been processed'
                : `No SMRs with status "${statusFilter}" found`}
            </p>
          </div>
        ) : (
          <>
            {/* Actions Bar */}
            <div className="mb-4 flex justify-between items-center flex-wrap gap-4">
              <div className="text-foreground">
                <strong>{smrRecords.length}</strong> report(s)
                {selectedRecords.size > 0 && (
                  <span className="ml-4">
                    <strong>{selectedRecords.size}</strong> selected
                  </span>
                )}
              </div>
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={handleExportCSV}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                >
                  📥 Export CSV
                </button>
                {statusFilter === 'pending' && (
                  <>
                    <button
                      onClick={() => handleAction('mark_under_review')}
                      disabled={selectedRecords.size === 0}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      👁️ Mark Under Review
                    </button>
                    <button
                      onClick={() => handleAction('mark_submitted')}
                      disabled={selectedRecords.size === 0}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ✓ Mark as Submitted
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* AUSTRAC Reference Input (for submission) */}
            {statusFilter === 'pending' && selectedRecords.size > 0 && (
              <div className="mb-4 p-4 bg-card border border-border rounded-lg">
                <div className="flex gap-4 items-end flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-card-foreground mb-1">
                      AUSTRAC Reference (optional)
                    </label>
                    <input
                      type="text"
                      value={austracReference}
                      onChange={(e) => setAustracReference(e.target.value)}
                      placeholder="Enter AUSTRAC reference number"
                      className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground"
                    />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-card-foreground mb-1">
                      Dismissal Reason (if dismissing)
                    </label>
                    <input
                      type="text"
                      value={dismissNotes}
                      onChange={(e) => setDismissNotes(e.target.value)}
                      placeholder="Reason for dismissal"
                      className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground"
                    />
                  </div>
                  <button
                    onClick={() => handleAction('dismiss')}
                    disabled={selectedRecords.size === 0 || !dismissNotes.trim()}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ✗ Dismiss Selected
                  </button>
                </div>
              </div>
            )}

            {/* SMR Table */}
            <div className="bg-card rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedRecords.size === smrRecords.length && smrRecords.length > 0}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Deadline
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {smrRecords.map((record) => (
                      <Fragment key={record.id}>
                        <tr className="hover:bg-muted/50">
                          <td className="px-4 py-4">
                            <input
                              type="checkbox"
                              checked={selectedRecords.has(record.id)}
                              onChange={(e) => handleSelectRecord(record.id, e.target.checked)}
                              className="rounded"
                            />
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${getSeverityColor(record.suspicion_category, record.days_remaining)}`}>
                              {record.suspicion_category.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm font-medium text-card-foreground">
                              {record.customer_name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {record.customer_email}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-card-foreground">
                            {record.transaction_amount
                              ? `$${record.transaction_amount.toLocaleString()}`
                              : 'N/A'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            {new Date(record.created_at).toLocaleDateString('en-AU')}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            {record.submission_deadline ? (
                              <div>
                                <div className="text-sm text-card-foreground">
                                  {new Date(record.submission_deadline).toLocaleDateString('en-AU')}
                                </div>
                                {record.days_remaining !== null && record.status !== 'reported' && (
                                  <div className={`text-xs font-medium ${
                                    record.days_remaining <= 1 ? 'text-red-600' : 
                                    record.days_remaining <= 2 ? 'text-orange-600' : 'text-muted-foreground'
                                  }`}>
                                    {record.days_remaining === 0
                                      ? '⚠️ Due today!'
                                      : record.days_remaining === 1
                                        ? '⚠️ 1 day left'
                                        : `${record.days_remaining} days left`}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">N/A</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadge(record.status)}`}>
                              {record.status.replace('_', ' ').toUpperCase()}
                            </span>
                            {record.austrac_reference && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Ref: {record.austrac_reference}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <button
                              onClick={() => setExpandedRecord(expandedRecord === record.id ? null : record.id)}
                              className="text-primary hover:text-primary/80 text-sm font-medium"
                            >
                              {expandedRecord === record.id ? '▲ Hide' : '▼ View'}
                            </button>
                          </td>
                        </tr>
                        {expandedRecord === record.id && (
                          <tr>
                            <td colSpan={8} className="px-4 py-4 bg-muted/30">
                              <div className="space-y-3">
                                <div>
                                  <h4 className="text-sm font-semibold text-card-foreground mb-1">SMR Narrative</h4>
                                  <pre className="text-sm text-muted-foreground whitespace-pre-wrap bg-background p-3 rounded border border-border">
                                    {record.description}
                                  </pre>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">SMR ID:</span>
                                    <span className="ml-2 text-card-foreground font-mono text-xs">{record.id}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Customer ID:</span>
                                    <span className="ml-2 text-card-foreground font-mono text-xs">{record.customer_id}</span>
                                  </div>
                                  {record.transaction_id && (
                                    <div>
                                      <span className="text-muted-foreground">Transaction ID:</span>
                                      <span className="ml-2 text-card-foreground font-mono text-xs">{record.transaction_id}</span>
                                    </div>
                                  )}
                                  <div>
                                    <span className="text-muted-foreground">Flagged by:</span>
                                    <span className="ml-2 text-card-foreground">
                                      {record.flagged_by_system ? 'System' : 'Manual'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Instructions */}
            <div className="mt-6 bg-card border border-border rounded-lg p-4">
              <h3 className="font-semibold text-card-foreground mb-2">📋 SMR Submission Process</h3>
              <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                <li>Review the SMR details and narrative for accuracy</li>
                <li>Click &quot;Mark Under Review&quot; while investigating</li>
                <li>Submit the SMR via AUSTRAC Online within <strong>3 business days</strong></li>
                <li>Enter the AUSTRAC reference number and click &quot;Mark as Submitted&quot;</li>
                <li>If determined to be a false positive, provide a reason and dismiss</li>
              </ol>
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                <strong>⚠️ Important:</strong> SMRs must be submitted to AUSTRAC within 3 business days of forming a suspicion. 
                Failure to report may result in regulatory penalties.
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

