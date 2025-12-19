'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface FlaggedTransaction {
  id: string;
  customer_id: string;
  amount: number;
  currency: string;
  amount_aud: number;
  created_at: string;
  risk_score: number;
  risk_level: string;
  flagged_for_review: boolean;
  review_status: string;
  customer: {
    first_name: string;
    last_name: string;
    email: string;
    verification_status: string;
    risk_level: string;
  };
  product_details: any;
}

export default function ReviewsPage() {
  const [transactions, setTransactions] = useState<FlaggedTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFlaggedTransactions();
  }, []);

  const fetchFlaggedTransactions = async () => {
    const response = await fetch('/api/admin/flagged-transactions');
    const data = await response.json();
    setTransactions(data);
    setLoading(false);
  };

  const handleReview = async (transactionId: string, decision: 'approve' | 'reject', notes: string) => {
    await fetch('/api/admin/review-transaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionId, decision, notes }),
    });

    fetchFlaggedTransactions();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-muted-foreground">Loading flagged transactions...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Transaction Reviews</h1>
          <p className="text-muted-foreground">
            Review flagged transactions for compliance approval
          </p>
        </div>

        {transactions.length === 0 ? (
          <div className="bg-card rounded-lg p-8 text-center text-muted-foreground">
            ✓ No transactions pending review
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((tx) => (
              <TransactionReviewCard
                key={tx.id}
                transaction={tx}
                onReview={handleReview}
                onRefresh={fetchFlaggedTransactions}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TransactionReviewCard({
   transaction,
   onReview,
    onRefresh,
  }: {
    transaction: FlaggedTransaction;
    onReview: (id: string, decision: 'approve' | 'reject', notes: string) => void;
    onRefresh: () => void;
  }) {
  const [notes, setNotes] = useState('');
  const [eddReason, setEddReason] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [showEddInput, setShowEddInput] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleDecision = async (decision: 'approve' | 'reject') => {
    if (!notes.trim()) {
      alert('Please add review notes');
      return;
    }
    setProcessing(true);
    await onReview(transaction.id, decision, notes);
    setProcessing(false);
  };

  const handleTriggerEDD = async () => {
    if (!eddReason.trim()) {
      toast.error('Please enter a reason for the EDD investigation');
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch('/api/admin/edd-investigations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          customer_id: transaction.customer_id, // Already available!
          transaction_id: transaction.id,
          trigger_reason: eddReason.trim(),
          triggered_by: 'transaction_review',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.existing_investigation) {
          toast.success(`Transaction linked to existing investigation: ${result.existing_investigation.investigation_number}`);
        } else {
          throw new Error(result.error);
        }
      } else {
        toast.success(`EDD Investigation created: ${result.investigation.investigation_number}. Customer is now blocked.`);
      }

      onRefresh()
    } catch (error: any) {
      toast.error(`Failed: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="bg-card rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-card-foreground">{transaction.customer.first_name} {transaction.customer.last_name}</h3>
          <p className="text-muted-foreground">{transaction.customer.email}</p>
          <p className="text-sm text-muted-foreground mt-1">
            ID: {transaction.id.slice(0, 13)}...
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-card-foreground">
            <div className="text-xl font-bold">
              AUD ${transaction.amount_aud?.toLocaleString('en-AU') || transaction.amount.toLocaleString('en-AU')}
            </div>
            {transaction.currency !== 'AUD' && (
              <div className="text-sm text-gray-600">
                Original: {transaction.currency} ${transaction.amount.toLocaleString()}
              </div>
            )}

          </div>
          <div className="text-sm text-muted-foreground">
            {new Date(transaction.created_at).toLocaleDateString('en-AU')}
          </div>
        </div>
      </div>

      {/* Risk Indicators */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {/*<span className={`px-3 py-1 rounded-full text-sm font-medium ${*/}
        {/*  transaction.risk_level === 'high'*/}
        {/*    ? 'bg-red-100 text-red-800'*/}
        {/*    : transaction.risk_level === 'medium'*/}
        {/*      ? 'bg-yellow-100 text-yellow-800'*/}
        {/*      : 'bg-green-100 text-green-800'*/}
        {/*}`}>*/}
        {/*  Risk: {transaction.risk_level.toUpperCase()} ({transaction.risk_score})*/}
        {/*</span>*/}

        {transaction.amount >= 10000 && (
          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
            TTR Required
          </span>
        )}

        {transaction.amount >= 5000 && (
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            KYC Required
          </span>
        )}
      </div>

      {/* Toggle Details */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="text-primary hover:text-primary/80 text-sm font-medium mb-4"
      >
        {showDetails ? '▼ Hide Details' : '▶ Show Details'}
      </button>

      {showDetails && (
        <div className="bg-muted rounded p-4 mb-4 text-sm space-y-2 text-muted-foreground">
          <div><strong>Customer Name:</strong> {transaction.customer.first_name} {transaction.customer.last_name}</div>
          <div><strong>Customer Verification:</strong> {transaction.customer.verification_status}</div>
          <div><strong>Customer Risk Level:</strong> {transaction.customer.risk_level}</div>
          <div><strong>Product:</strong> {transaction.product_details?.name || 'Multiple items'}</div>
          <div><strong>Transaction ID:</strong> {transaction.id}</div>
          <div><strong>Customer ID:</strong> {transaction.customer_id}</div>
        </div>
      )}

      {/* Review Notes */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-card-foreground mb-2">
          Review Notes *
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Document your review decision and reasoning..."
          className="w-full p-3 border border-border bg-input text-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          rows={3}
        />
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <div className="flex gap-3">
          <button
            onClick={() => handleDecision('approve')}
            disabled={processing}
            className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? 'Processing...' : '✓ Approve Transaction'}
          </button>
          <button
            onClick={() => handleDecision('reject')}
            disabled={processing}
            className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? 'Processing...' : '✗ Reject Transaction'}
          </button>
        </div>

        {/* EDD Investigation Trigger */}
        <div className="border-t border-border pt-3">
          <button
            onClick={() => setShowEddInput(!showEddInput)}
            className="text-sm text-amber-600 hover:text-amber-700 font-medium mb-2"
          >
            {showEddInput ? '▼' : '▶'} Trigger EDD Investigation
          </button>

          {showEddInput && (
            <div className="space-y-3 mt-2">
              <textarea
                value={eddReason}
                onChange={(e) => setEddReason(e.target.value)}
                placeholder="Enter reason for EDD investigation (e.g., unusual transaction pattern, high-risk customer profile...)"
                className="w-full p-3 border border-border bg-input text-foreground rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                rows={2}
                disabled={processing}
              />
              <button
                onClick={handleTriggerEDD}
                disabled={processing || !eddReason.trim()}
                className="w-full bg-amber-600 text-white py-3 rounded-lg hover:bg-amber-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'Creating Investigation...' : '🔍 Create EDD Investigation & Block Customer'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}