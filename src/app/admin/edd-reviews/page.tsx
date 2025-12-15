'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import { CheckCircle, XCircle, Clock, AlertTriangle, FileText } from 'lucide-react';

interface EDDRecord {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  source_of_wealth: string;
  source_of_wealth_details: string | null;
  transaction_purpose: string;
  transaction_purpose_details: string | null;
  expected_frequency: string;
  expected_annual_volume: string | null;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  reviewed_at: string | null;
  review_notes: string | null;
  submitted_at: string;
  is_pep: boolean;
  pep_relationship: string | null;
}

type EDDStatusFilter = 'pending' | 'under_review' | 'approved' | 'rejected' | 'all';

const formatLabel = (value: string): string => {
  return value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

export default function EDDReviewsPage() {
  const [eddRecords, setEddRecords] = useState<EDDRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<EDDStatusFilter>('pending');
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/edd-reviews?status=${filter}`);
      if (!response.ok) throw new Error('Failed to fetch EDD records');
      const data = await response.json();
      setEddRecords(data.records || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load EDD records';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleAction = async (eddId: string, action: 'approve' | 'reject' | 'request_info') => {
    if (action === 'reject' && !reviewNotes.trim()) {
      alert('Please provide notes when rejecting an EDD submission.');
      return;
    }

    setProcessingId(eddId);

    try {
      const response = await fetch('/api/admin/edd-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eddId,
          action,
          notes: reviewNotes.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} EDD`);
      }

      setReviewNotes('');
      setExpandedRecord(null);
      fetchRecords();
    } catch (err) {
      const message = err instanceof Error ? err.message : `Failed to ${action} EDD`;
      alert(message);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusIcon = (status: EDDRecord['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'under_review':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-muted-foreground">Loading EDD reviews...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Enhanced Due Diligence Reviews
          </h1>
          <p className="text-muted-foreground">
            Review EDD submissions for high-value transactions ($50,000+)
          </p>

          <div className="flex space-x-2 mt-4">
            {['pending', 'under_review', 'approved', 'rejected', 'all'].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s as EDDStatusFilter)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  filter === s
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {formatLabel(s)}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive-foreground">
            {error}
          </div>
        )}

        {eddRecords.length === 0 ? (
          <div className="bg-card rounded-lg shadow p-8 text-center">
            <div className="text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-bold text-card-foreground mb-2">
              No {filter === 'all' ? '' : formatLabel(filter)} EDD Reviews
            </h2>
            <p className="text-muted-foreground">
              No enhanced due diligence submissions found for the selected status.
            </p>
          </div>
        ) : (
          <div className="bg-card rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Source of Wealth
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Purpose
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Frequency
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      PEP
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {eddRecords.map((record) => (
                    <Fragment key={record.id}>
                      <tr className="hover:bg-muted/50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-card-foreground">
                            {record.customer_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {record.customer_email}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-card-foreground">
                          {formatLabel(record.source_of_wealth)}
                        </td>
                        <td className="px-6 py-4 text-sm text-card-foreground">
                          {formatLabel(record.transaction_purpose)}
                        </td>
                        <td className="px-6 py-4 text-sm text-card-foreground">
                          {formatLabel(record.expected_frequency)}
                        </td>
                        <td className="px-6 py-4">
                          {record.is_pep ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {formatLabel(record.pep_relationship || 'Yes')}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">No</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(record.status)}
                            <span className="text-sm">{formatLabel(record.status)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {new Date(record.submitted_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() =>
                              setExpandedRecord(expandedRecord === record.id ? null : record.id)
                            }
                            className="text-primary hover:text-primary/80 text-sm font-medium"
                          >
                            {expandedRecord === record.id ? '▲ Hide' : '▼ Review'}
                          </button>
                        </td>
                      </tr>

                      {expandedRecord === record.id && (
                        <tr>
                          <td colSpan={8} className="px-6 py-4 bg-muted/30">
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div>
                                  <span className="text-xs text-muted-foreground block">
                                    Source of Wealth
                                  </span>
                                  <span className="text-sm font-medium text-card-foreground">
                                    {formatLabel(record.source_of_wealth)}
                                  </span>
                                  {record.source_of_wealth_details && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {record.source_of_wealth_details}
                                    </p>
                                  )}
                                </div>
                                <div>
                                  <span className="text-xs text-muted-foreground block">
                                    Transaction Purpose
                                  </span>
                                  <span className="text-sm font-medium text-card-foreground">
                                    {formatLabel(record.transaction_purpose)}
                                  </span>
                                  {record.transaction_purpose_details && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {record.transaction_purpose_details}
                                    </p>
                                  )}
                                </div>
                                <div>
                                  <span className="text-xs text-muted-foreground block">
                                    Expected Annual Volume
                                  </span>
                                  <span className="text-sm font-medium text-card-foreground">
                                    {record.expected_annual_volume
                                      ? formatLabel(record.expected_annual_volume)
                                      : 'Not specified'}
                                  </span>
                                </div>
                              </div>

                              {record.review_notes && (
                                <div className="bg-background p-3 rounded border border-border">
                                  <span className="text-xs text-muted-foreground block mb-1">
                                    Previous Review Notes
                                  </span>
                                  <p className="text-sm text-card-foreground">{record.review_notes}</p>
                                </div>
                              )}

                              {(record.status === 'pending' || record.status === 'under_review') && (
                                <div className="border-t border-border pt-4">
                                  <label className="block text-sm font-medium text-card-foreground mb-2">
                                    Review Notes
                                  </label>
                                  <textarea
                                    value={reviewNotes}
                                    onChange={(e) => setReviewNotes(e.target.value)}
                                    placeholder="Add notes for this review..."
                                    rows={3}
                                    className="w-full p-3 border border-border bg-input text-foreground rounded-lg"
                                  />

                                  <div className="flex space-x-3 mt-3">
                                    <button
                                      onClick={() => handleAction(record.id, 'approve')}
                                      disabled={processingId === record.id}
                                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                    >
                                      <CheckCircle className="inline-block h-4 w-4 mr-2" />
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => handleAction(record.id, 'request_info')}
                                      disabled={processingId === record.id}
                                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                    >
                                      <FileText className="inline-block h-4 w-4 mr-2" />
                                      Request Info
                                    </button>
                                    <button
                                      onClick={() => handleAction(record.id, 'reject')}
                                      disabled={processingId === record.id || !reviewNotes.trim()}
                                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                                    >
                                      <XCircle className="inline-block h-4 w-4 mr-2" />
                                      Reject
                                    </button>
                                  </div>
                                </div>
                              )}
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
        )}

        <div className="mt-6 bg-card border border-border rounded-lg p-4">
          <h3 className="font-semibold text-card-foreground mb-2">📋 EDD Review Guidelines</h3>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            <li>Verify that the source of wealth is consistent with the customer&apos;s profile</li>
            <li>Check if the transaction purpose aligns with normal bullion purchasing patterns</li>
            <li>PEP customers require extra scrutiny - ensure all information is documented</li>
            <li>Request additional information if any details are unclear or inconsistent</li>
            <li>Reject submissions with clear red flags and document the reasons</li>
          </ul>
        </div>
      </div>
    </div>
  );
}








