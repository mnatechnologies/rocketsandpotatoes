'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface BankTransferOrderRow {
  id: string;
  reference_code: string;
  status: string;
  hold_status: string;
  deposit_percentage: number;
  deposit_amount_aud: number;
  hold_captured_amount: number | null;
  hold_capture_reason: string | null;
  payment_deadline: string;
  confirmed_at: string | null;
  confirmed_by: string | null;
  confirmation_notes: string | null;
  created_at: string;
  updated_at: string;
  transaction_id: string | null;
  amount: number | null;
  amount_aud: number | null;
  currency: string | null;
  customer_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  xero_match_status: string | null;
  xero_matched_at: string | null;
  xero_match_amount: number | null;
  xero_bank_transaction_id: string | null;
}

type Tab = 'awaiting' | 'completed' | 'expired';

function getTimeRemaining(deadline: string): { text: string; hours: number } {
  const now = new Date().getTime();
  const deadlineMs = new Date(deadline).getTime();
  const diff = deadlineMs - now;

  if (diff <= 0) return { text: 'Expired', hours: 0 };

  const totalHours = diff / (1000 * 60 * 60);
  const h = Math.floor(totalHours);
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (h > 0) {
    return { text: `${h}h ${m}m`, hours: totalHours };
  }
  return { text: `${m}m`, hours: totalHours };
}

function getUrgencyColor(hours: number): string {
  if (hours <= 0) return 'text-red-600 bg-red-50';
  if (hours < 2) return 'text-red-600 bg-red-50';
  if (hours < 6) return 'text-amber-600 bg-amber-50';
  return 'text-green-600 bg-green-50';
}

function formatAUD(amount: number | null): string {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(amount);
}

export default function BankTransfersPage() {
  const [activeTab, setActiveTab] = useState<Tab>('awaiting');
  const [orders, setOrders] = useState<BankTransferOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setTick] = useState(0);

  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState<BankTransferOrderRow | null>(null);
  const [confirmNotes, setConfirmNotes] = useState('');
  const [confirmProcessing, setConfirmProcessing] = useState(false);

  // Cancel modal state
  const [cancelModal, setCancelModal] = useState<BankTransferOrderRow | null>(null);
  const [cancelReason, setCancelReason] = useState('Customer requested');
  const [cancelReasonOther, setCancelReasonOther] = useState('');
  const [captureHold, setCaptureHold] = useState(false);
  const [captureAmount, setCaptureAmount] = useState('');
  const [cancelProcessing, setCancelProcessing] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      let statusParam = '';
      if (activeTab === 'awaiting') statusParam = 'awaiting_transfer';
      else if (activeTab === 'completed') statusParam = 'succeeded';
      else statusParam = 'expired,cancelled';

      // For expired/cancelled, we need two fetches since the API validates single status
      if (activeTab === 'expired') {
        const [expiredRes, cancelledRes] = await Promise.all([
          fetch(`/api/admin/bank-transfer/list?status=expired&t=${Date.now()}`, { cache: 'no-store' }),
          fetch(`/api/admin/bank-transfer/list?status=cancelled&t=${Date.now()}`, { cache: 'no-store' }),
        ]);
        const expiredData = await expiredRes.json();
        const cancelledData = await cancelledRes.json();
        const combined = [
          ...(expiredData.data || []),
          ...(cancelledData.data || []),
        ];
        combined.sort(
          (a: BankTransferOrderRow, b: BankTransferOrderRow) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
        setOrders(combined);
      } else {
        const res = await fetch(
          `/api/admin/bank-transfer/list?status=${statusParam}&t=${Date.now()}`,
          { cache: 'no-store' }
        );
        const data = await res.json();
        setOrders(data.data || []);
      }
    } catch {
      toast.error('Failed to fetch bank transfer orders');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Countdown timer — update every minute
  useEffect(() => {
    if (activeTab !== 'awaiting') return;
    const interval = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const handleConfirmPayment = async () => {
    if (!confirmModal) return;
    setConfirmProcessing(true);
    try {
      const res = await fetch('/api/admin/bank-transfer/confirm-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankTransferOrderId: confirmModal.id,
          confirmationNotes: confirmNotes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to confirm payment');
      toast.success(`Payment confirmed for ${confirmModal.reference_code}`);
      setConfirmModal(null);
      setConfirmNotes('');
      fetchOrders();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to confirm payment';
      toast.error(message);
    } finally {
      setConfirmProcessing(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelModal) return;
    const reason = cancelReason === 'Other' ? cancelReasonOther : cancelReason;
    if (!reason.trim()) {
      toast.error('Please provide a cancellation reason');
      return;
    }
    setCancelProcessing(true);
    try {
      const body: Record<string, unknown> = {
        bankTransferOrderId: cancelModal.id,
        reason,
        captureHold,
      };
      if (captureHold && captureAmount) {
        body.captureAmount = parseFloat(captureAmount);
      }
      const res = await fetch('/api/admin/bank-transfer/cancel-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel order');
      toast.success(`Order ${cancelModal.reference_code} cancelled`);
      setCancelModal(null);
      resetCancelForm();
      fetchOrders();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to cancel order';
      toast.error(message);
    } finally {
      setCancelProcessing(false);
    }
  };

  const resetCancelForm = () => {
    setCancelReason('Customer requested');
    setCancelReasonOther('');
    setCaptureHold(false);
    setCaptureAmount('');
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'awaiting', label: 'Awaiting Payment' },
    { key: 'completed', label: 'Completed' },
    { key: 'expired', label: 'Expired / Cancelled' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Bank Transfers</h1>
        <p className="text-muted-foreground">
          Manage bank transfer orders and confirm payments
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3"></div>
            <div className="text-muted-foreground text-sm">Loading orders...</div>
          </div>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-card rounded-lg p-8 text-center text-muted-foreground">
          No orders found
        </div>
      ) : activeTab === 'awaiting' ? (
        <AwaitingTable
          orders={orders}
          onConfirm={(o) => setConfirmModal(o)}
          onCancel={(o) => {
            setCancelModal(o);
            resetCancelForm();
          }}
        />
      ) : (
        <ReadOnlyTable orders={orders} tab={activeTab} />
      )}

      {/* Confirm Payment Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-card-foreground mb-4">
              Confirm Payment
            </h2>
            <div className="space-y-2 text-sm text-muted-foreground mb-4">
              <p>
                <strong>Reference:</strong> {confirmModal.reference_code}
              </p>
              <p>
                <strong>Customer:</strong> {confirmModal.customer_name || 'Unknown'}
              </p>
              <p>
                <strong>Amount:</strong> {formatAUD(confirmModal.amount_aud)}
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800 mb-4">
              The security deposit hold on the customer&apos;s card will be released.
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-card-foreground mb-1">
                Notes (optional)
              </label>
              <textarea
                value={confirmNotes}
                onChange={(e) => setConfirmNotes(e.target.value)}
                placeholder="Add any confirmation notes..."
                className="w-full p-2 border border-border bg-input text-foreground rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setConfirmModal(null);
                  setConfirmNotes('');
                }}
                className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPayment}
                disabled={confirmProcessing}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {confirmProcessing ? 'Confirming...' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {cancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-card-foreground mb-4">
              Cancel Order
            </h2>
            <div className="space-y-2 text-sm text-muted-foreground mb-4">
              <p>
                <strong>Reference:</strong> {cancelModal.reference_code}
              </p>
              <p>
                <strong>Customer:</strong> {cancelModal.customer_name || 'Unknown'}
              </p>
              <p>
                <strong>Amount:</strong> {formatAUD(cancelModal.amount_aud)}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-card-foreground mb-1">
                Reason
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full p-2 border border-border bg-input text-foreground rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option>Customer requested</option>
                <option>Payment not received</option>
                <option>Suspected fraud</option>
                <option>Other</option>
              </select>
            </div>

            {cancelReason === 'Other' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-card-foreground mb-1">
                  Other reason
                </label>
                <input
                  type="text"
                  value={cancelReasonOther}
                  onChange={(e) => setCancelReasonOther(e.target.value)}
                  placeholder="Specify reason..."
                  className="w-full p-2 border border-border bg-input text-foreground rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            )}

            <div className="mb-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={captureHold}
                  onChange={(e) => setCaptureHold(e.target.checked)}
                  className="rounded border-border"
                />
                <span className="text-card-foreground font-medium">
                  Capture security deposit (market loss protection)
                </span>
              </label>
            </div>

            {captureHold && (
              <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
                <p className="text-sm text-amber-800">
                  Full deposit: {formatAUD(cancelModal.deposit_amount_aud)}
                </p>
                <div>
                  <label className="block text-sm font-medium text-amber-800 mb-1">
                    Partial amount (optional)
                  </label>
                  <input
                    type="number"
                    value={captureAmount}
                    onChange={(e) => setCaptureAmount(e.target.value)}
                    placeholder={cancelModal.deposit_amount_aud.toString()}
                    min="0"
                    max={cancelModal.deposit_amount_aud}
                    step="0.01"
                    className="w-full p-2 border border-amber-300 bg-white text-foreground rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setCancelModal(null);
                  resetCancelForm();
                }}
                className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={cancelProcessing}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {cancelProcessing ? 'Cancelling...' : 'Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function XeroMatchBadge({ order }: { order: BankTransferOrderRow }) {
  if (!order.xero_match_status) return null;

  if (order.xero_match_status === 'matched') {
    return (
      <div className="flex flex-col gap-1">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs font-medium">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
          Xero Matched
        </span>
        {order.xero_matched_at && (
          <span className="text-[10px] text-muted-foreground">
            {new Date(order.xero_matched_at).toLocaleString('en-AU')}
          </span>
        )}
      </div>
    );
  }

  if (order.xero_match_status === 'amount_mismatch') {
    return (
      <div className="flex flex-col gap-1">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-700 text-xs font-medium">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
          Amount Mismatch
        </span>
        <span className="text-[10px] text-muted-foreground">
          Expected {formatAUD(order.amount_aud)} — Received {formatAUD(order.xero_match_amount)}
        </span>
      </div>
    );
  }

  return null;
}

function AwaitingTable({
  orders,
  onConfirm,
  onCancel,
}: {
  orders: BankTransferOrderRow[];
  onConfirm: (o: BankTransferOrderRow) => void;
  onCancel: (o: BankTransferOrderRow) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="pb-3 font-medium text-muted-foreground">Reference</th>
            <th className="pb-3 font-medium text-muted-foreground">Customer</th>
            <th className="pb-3 font-medium text-muted-foreground">Amount (AUD)</th>
            <th className="pb-3 font-medium text-muted-foreground">Deposit Hold</th>
            <th className="pb-3 font-medium text-muted-foreground">Time Remaining</th>
            <th className="pb-3 font-medium text-muted-foreground">Status</th>
            <th className="pb-3 font-medium text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const { text: timeText, hours } = getTimeRemaining(order.payment_deadline);
            const urgencyColor = getUrgencyColor(hours);

            return (
              <tr key={order.id} className={`border-b border-border/50 hover:bg-muted/30 ${order.xero_match_status === 'matched' ? 'bg-green-50/50 dark:bg-green-950/20' : order.xero_match_status === 'amount_mismatch' ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''}`}>
                <td className="py-3 font-mono text-xs">{order.reference_code}</td>
                <td className="py-3">
                  <div className="text-card-foreground">{order.customer_name || 'Unknown'}</div>
                  <div className="text-xs text-muted-foreground">{order.customer_email}</div>
                </td>
                <td className="py-3 font-medium">{formatAUD(order.amount_aud)}</td>
                <td className="py-3 text-muted-foreground">{formatAUD(order.deposit_amount_aud)}</td>
                <td className="py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${urgencyColor}`}>
                    {timeText}
                  </span>
                </td>
                <td className="py-3">
                  <XeroMatchBadge order={order} />
                  {!order.xero_match_status && (
                    <span className="px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs font-medium">
                      Awaiting Transfer
                    </span>
                  )}
                </td>
                <td className="py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onConfirm(order)}
                      className={`px-3 py-1 text-white rounded text-xs font-medium transition-colors ${
                        order.xero_match_status === 'matched'
                          ? 'bg-green-600 hover:bg-green-700 ring-2 ring-green-300 ring-offset-1'
                          : 'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      {order.xero_match_status === 'matched' ? 'Confirm (Matched)' : 'Confirm'}
                    </button>
                    <button
                      onClick={() => onCancel(order)}
                      className="px-3 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ReadOnlyTable({ orders, tab }: { orders: BankTransferOrderRow[]; tab: Tab }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="pb-3 font-medium text-muted-foreground">Reference</th>
            <th className="pb-3 font-medium text-muted-foreground">Customer</th>
            <th className="pb-3 font-medium text-muted-foreground">Amount (AUD)</th>
            <th className="pb-3 font-medium text-muted-foreground">
              {tab === 'completed' ? 'Date Confirmed' : 'Date'}
            </th>
            <th className="pb-3 font-medium text-muted-foreground">Status</th>
            <th className="pb-3 font-medium text-muted-foreground">Notes</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const statusColors: Record<string, string> = {
              succeeded: 'bg-green-50 text-green-700',
              expired: 'bg-gray-100 text-gray-600',
              cancelled: 'bg-red-50 text-red-700',
            };
            const statusLabels: Record<string, string> = {
              succeeded: 'Completed',
              expired: 'Expired',
              cancelled: 'Cancelled',
            };

            return (
              <tr key={order.id} className="border-b border-border/50 hover:bg-muted/30">
                <td className="py-3 font-mono text-xs">{order.reference_code}</td>
                <td className="py-3">
                  <div className="text-card-foreground">{order.customer_name || 'Unknown'}</div>
                  <div className="text-xs text-muted-foreground">{order.customer_email}</div>
                </td>
                <td className="py-3 font-medium">{formatAUD(order.amount_aud)}</td>
                <td className="py-3 text-muted-foreground">
                  {order.confirmed_at
                    ? new Date(order.confirmed_at).toLocaleDateString('en-AU')
                    : new Date(order.updated_at).toLocaleDateString('en-AU')}
                </td>
                <td className="py-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      statusColors[order.status] || 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {statusLabels[order.status] || order.status}
                  </span>
                </td>
                <td className="py-3 text-muted-foreground text-xs max-w-[200px] truncate">
                  {order.confirmation_notes || (order.hold_capture_reason ? `Hold captured: ${order.hold_capture_reason}` : '-')}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
