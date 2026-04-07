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
  const [suspicionRationale, setSuspicionRationale] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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
      return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30';
    }
    if (category === 'sanctions_match') {
      return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30';
    }
    if (category === 'structuring') {
      return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30';
    }
    return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_review':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400';
      case 'under_review':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
      case 'reported':
        return 'bg-green-500/10 text-green-600 dark:text-green-400';
      case 'dismissed':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const handleConfirmSuspicion = async () => {
    if (selectedRecords.size === 0) {
      alert('Please select at least one record');
      return;
    }
    if (!suspicionRationale.trim()) {
      alert('You must document your rationale for forming the suspicion');
      return;
    }
    if (!confirm(
      `You are confirming that you have reviewed ${selectedRecords.size} flag(s) and formed a suspicion.\n\n` +
      `This starts the 3-business-day filing deadline.\n\n` +
      `Rationale: "${suspicionRationale}"\n\nProceed?`
    )) {
      return;
    }

    try {
      const response = await fetch('/api/admin/smr-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smrIds: Array.from(selectedRecords),
          action: 'confirm_suspicion',
          suspicionRationale,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to confirm suspicion');

      alert(data.message);
      setSelectedRecords(new Set());
      setSuspicionRationale('');
      setShowConfirmModal(false);
      fetchSMRRecords();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to confirm suspicion';
      alert(message);
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
                    {/* Show Confirm Suspicion for pending_review items */}
                    {smrRecords.some(r => r.status === 'pending_review' && selectedRecords.has(r.id)) && (
                      <button
                        onClick={() => setShowConfirmModal(true)}
                        disabled={selectedRecords.size === 0}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        Confirm Suspicion
                      </button>
                    )}
                    <button
                      onClick={() => handleAction('mark_under_review')}
                      disabled={selectedRecords.size === 0}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Mark Under Review
                    </button>
                    {/* Only allow "Mark as Submitted" for items that have a deadline (not pending_review) */}
                    <button
                      onClick={() => {
                        const selectedPendingReview = smrRecords.filter(
                          r => selectedRecords.has(r.id) && r.status === 'pending_review'
                        );
                        if (selectedPendingReview.length > 0) {
                          alert('Cannot mark as submitted: some selected items are still awaiting review. Confirm suspicion first.');
                          return;
                        }
                        handleAction('mark_submitted');
                      }}
                      disabled={selectedRecords.size === 0}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Mark as Submitted
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
                              {record.suspicion_category.replaceAll('_', ' ').toUpperCase()}
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
                            {record.status === 'pending_review' ? (
                              <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                                Awaiting review
                              </span>
                            ) : record.submission_deadline ? (
                              <div>
                                <div className="text-sm text-card-foreground">
                                  {new Date(record.submission_deadline).toLocaleDateString('en-AU')}
                                </div>
                                {record.days_remaining !== null && record.status !== 'reported' && (
                                  <div className={`text-xs font-medium ${
                                    record.days_remaining < 0 ? 'text-red-600 font-bold' :
                                    record.days_remaining === 0 ? 'text-red-600' :
                                    record.days_remaining <= 1 ? 'text-red-600' :
                                    record.days_remaining <= 2 ? 'text-orange-600' : 'text-muted-foreground'
                                  }`}>
                                    {record.days_remaining < 0
                                      ? `OVERDUE by ${Math.abs(record.days_remaining)} day(s)`
                                      : record.days_remaining === 0
                                        ? 'Due today!'
                                        : record.days_remaining === 1
                                          ? '1 day left'
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
                              {record.status.replaceAll('_', ' ').toUpperCase()}
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
              <h3 className="font-semibold text-card-foreground mb-2">AMLCO Review Workflow</h3>
              <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                <li><strong>Review system flags</strong> — items with &quot;Pending Review&quot; status are automated flags, not filed SMRs</li>
                <li><strong>Form suspicion</strong> — if you believe the flag warrants an SMR, click &quot;Confirm Suspicion&quot; with your rationale. This starts the 3-business-day deadline.</li>
                <li><strong>Dismiss false positives</strong> — provide a reason and dismiss. The flag and your rationale are preserved in the audit trail.</li>
                <li><strong>File with AUSTRAC</strong> — submit the SMR via AUSTRAC Online, then enter the reference number and click &quot;Mark as Submitted&quot;</li>
              </ol>
              <div className="mt-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg text-sm text-purple-600 dark:text-purple-400">
                <strong>Key distinction:</strong> &quot;Pending Review&quot; = system flag awaiting your assessment.
                &quot;Pending&quot; = you have confirmed a suspicion and the 3-business-day filing clock is ticking.
                The deadline does NOT start until you confirm the suspicion.
              </div>
              <div className="mt-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-sm text-yellow-600 dark:text-yellow-400">
                <strong>Filing obligation:</strong> Once you confirm a suspicion, the SMR must be submitted to AUSTRAC within 3 business days.
                The audit trail records both the system flag timestamp and your suspicion confirmation timestamp separately.
              </div>
            </div>

            {/* Confirm Suspicion Modal */}
            {showConfirmModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-card border border-border rounded-lg shadow-xl max-w-lg w-full p-6">
                  <h3 className="text-lg font-bold text-card-foreground mb-2">Confirm Suspicion</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    You are confirming that you have reviewed {selectedRecords.size} system flag(s) and formed a suspicion
                    that warrants filing an SMR with AUSTRAC. This action starts the <strong>3-business-day filing deadline</strong>.
                  </p>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-card-foreground mb-1">
                      Suspicion rationale <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Document why you formed the suspicion. This is recorded in the audit trail.
                    </p>
                    <textarea
                      value={suspicionRationale}
                      onChange={(e) => setSuspicionRationale(e.target.value)}
                      rows={4}
                      placeholder="e.g., Customer has 5 transactions between $4,000-$4,900 over 3 weeks, consistent with structuring to avoid KYC threshold. Pattern is inconsistent with stated occupation (retired)."
                      className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground text-sm"
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setShowConfirmModal(false);
                        setSuspicionRationale('');
                      }}
                      className="px-4 py-2 text-sm bg-muted text-muted-foreground rounded-lg hover:bg-muted/80"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmSuspicion}
                      disabled={!suspicionRationale.trim()}
                      className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      Confirm Suspicion & Start Deadline
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

