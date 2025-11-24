'use client';

import { useState, useEffect } from 'react';
import { TTRRecord } from '@/lib/compliance/ttr-generator';


export default function TTRReportsPage() {
  const [ttrRecords, setTtrRecords] = useState<TTRRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchTTRRecords();
  }, []);

  const fetchTTRRecords = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/export-ttrs');
      
      if (!response.ok) {
        throw new Error('Failed to fetch TTR records');
      }

      const data = await response.json();
      setTtrRecords(data.records || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load TTR records');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(ttrRecords.map(record => record.internal_reference));
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

  const handleMarkAsSubmitted = async () => {
    if (selectedRecords.size === 0) {
      alert('Please select at least one record to mark as submitted');
      return;
    }

    if (!confirm(`Are you sure you want to mark ${selectedRecords.size} record(s) as submitted?`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/export-ttrs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionIds: Array.from(selectedRecords),
          action: 'mark_submitted',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark records as submitted');
      }

      alert('Records marked as submitted successfully');
      setSelectedRecords(new Set());
      fetchTTRRecords();
    } catch (err: any) {
      alert(err.message || 'Failed to mark records as submitted');
    }
  };


    const handleExportCSV = async () => {
      if (ttrRecords.length === 0) {
        alert('No records to export');
        return;
      }

      try {
        // Use the existing API endpoint with CSV format
        const response = await fetch('/api/admin/export-ttrs?format=csv');

        if (!response.ok) {
          throw new Error('Failed to export CSV');
        }

        // Download the file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `TTR_Report_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } catch (err: any) {
        alert(err.message || 'Failed to export CSV');
      }
    };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-muted-foreground">Loading TTR reports...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Threshold Transaction Reports (TTR)
          </h1>
          <p className="text-muted-foreground">
            Transactions over $10,000 AUD requiring AUSTRAC reporting
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive-foreground">
            {error}
          </div>
        )}

        {ttrRecords.length === 0 ? (
          <div className="bg-card rounded-lg shadow p-8 text-center">
            <div className="text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-bold text-card-foreground mb-2">
              No Pending TTR Reports
            </h2>
            <p className="text-muted-foreground">
              All transactions requiring TTR reporting have been processed
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex justify-between items-center">
              <div className="text-foreground">
                <strong>{ttrRecords.length}</strong> pending report(s)
                {selectedRecords.size > 0 && (
                  <span className="ml-4">
                    <strong>{selectedRecords.size}</strong> selected
                  </span>
                )}
              </div>
              <div className="space-x-3">
                <button
                  onClick={handleExportCSV}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                >
                  📥 Export to CSV
                </button>
                <button
                  onClick={handleMarkAsSubmitted}
                  disabled={selectedRecords.size === 0}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ✓ Mark as Submitted
                </button>
              </div>
            </div>

            <div className="bg-card rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedRecords.size === ttrRecords.length}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        TTR Reference
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Verification
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {ttrRecords.map((record) => (
                      <tr key={record.internal_reference} className="hover:bg-muted/50">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedRecords.has(record.internal_reference)}
                            onChange={(e) => handleSelectRecord(record.internal_reference, e.target.checked)}
                            className="rounded"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-card-foreground">
                          {record.ttr_reference}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {new Date(record.transaction_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-card-foreground">
                          {record.customer_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-card-foreground">
                          ${record.transaction_amount.toLocaleString()} {record.transaction_currency}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {record.verification_method}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 bg-card border border-border rounded-lg p-4">
              <h3 className="font-semibold text-card-foreground mb-2">📋 Next Steps</h3>
              <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                <li>Review all pending TTR records above</li>
                <li>Click &#34;Export to CSV&#34; to download the report</li>
                <li>Submit the CSV file to AUSTRAC Online</li>
                <li>Once submitted to AUSTRAC, select the records and click &#34Mark as Submitted&#34</li>
              </ol>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
