'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface FulfillmentOrder {
  id: string;
  amount: number;
  amount_aud: number;
  currency: string;
  payment_method_type: string;
  product_details: {
    items?: Array<{
      product?: { name?: string };
      name?: string;
      quantity?: number;
    }>;
  } | null;
  fulfillment_status: string;
  ready_at: string | null;
  collected_at: string | null;
  fulfillment_notes: string | null;
  fulfilled_by: string | null;
  created_at: string;
  customer_name: string;
  customer_email: string;
}

type Tab = 'pending' | 'ready' | 'collected';

function formatAUD(amount: number | null): string {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getItemsSummary(order: FulfillmentOrder): string {
  const items = order.product_details?.items || [];
  if (items.length === 0) return 'N/A';
  return items
    .map((item) => {
      const name = item.product?.name || item.name || 'Product';
      const qty = item.quantity || 1;
      return `${name} x${qty}`;
    })
    .join(', ');
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    unfulfilled: 'bg-red-100 text-red-800 border-red-200',
    packing: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    ready_for_pickup: 'bg-blue-100 text-blue-800 border-blue-200',
    collected: 'bg-green-100 text-green-800 border-green-200',
  };

  const labels: Record<string, string> = {
    unfulfilled: 'Unfulfilled',
    packing: 'Packing',
    ready_for_pickup: 'Ready for Pickup',
    collected: 'Collected',
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold border ${styles[status] || 'bg-gray-100 text-gray-800'}`}
    >
      {labels[status] || status}
    </span>
  );
}

function PaymentBadge({ method }: { method: string }) {
  const isBank = method === 'bank_transfer';
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-medium ${
        isBank ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
      }`}
    >
      {isBank ? 'Bank' : 'Card'}
    </span>
  );
}

export default function FulfillmentPage() {
  const [activeTab, setActiveTab] = useState<Tab>('pending');
  const [orders, setOrders] = useState<FulfillmentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Ready for pickup modal state
  const [readyModal, setReadyModal] = useState<FulfillmentOrder | null>(null);
  const [readyNotes, setReadyNotes] = useState('');
  const [readyProcessing, setReadyProcessing] = useState(false);

  // Collect confirm state
  const [collectConfirm, setCollectConfirm] = useState<FulfillmentOrder | null>(null);
  const [collectProcessing, setCollectProcessing] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/fulfillment/list?tab=${activeTab}&t=${Date.now()}`,
        { cache: 'no-store' }
      );
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setOrders(json.data || []);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateStatus = async (
    transactionId: string,
    newStatus: string,
    extra?: { fulfillmentNotes?: string }
  ) => {
    const res = await fetch('/api/admin/fulfillment/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionId, newStatus, ...extra }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Update failed');
    }
    return res.json();
  };

  const handleStartPacking = async (order: FulfillmentOrder) => {
    try {
      await updateStatus(order.id, 'packing');
      toast.success('Order marked as packing');
      fetchOrders();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  const handleReadySubmit = async () => {
    if (!readyModal) return;
    setReadyProcessing(true);
    try {
      await updateStatus(readyModal.id, 'ready_for_pickup', {
        fulfillmentNotes: readyNotes || undefined,
      });
      toast.success('Order ready for pickup — customer notified');
      setReadyModal(null);
      setReadyNotes('');
      fetchOrders();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setReadyProcessing(false);
    }
  };

  const handleCollectConfirm = async () => {
    if (!collectConfirm) return;
    setCollectProcessing(true);
    try {
      await updateStatus(collectConfirm.id, 'collected');
      toast.success('Order marked as collected');
      setCollectConfirm(null);
      fetchOrders();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setCollectProcessing(false);
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'pending', label: 'Pending' },
    { key: 'ready', label: 'Ready for Pickup' },
    { key: 'collected', label: 'Collected' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-1">Order Fulfillment</h1>
        <p className="text-muted-foreground">Track and manage order packing and customer pickup.</p>
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
            {!loading && activeTab === tab.key && (
              <span className="ml-2 text-xs bg-muted rounded-full px-2 py-0.5">
                {orders.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Loading orders...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && orders.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No orders in this category.
        </div>
      )}

      {/* Table */}
      {!loading && orders.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Order</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Customer</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Items</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Payment</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">{order.id.slice(0, 8)}...</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{order.customer_name}</div>
                    <div className="text-xs text-muted-foreground">{order.customer_email}</div>
                  </td>
                  <td className="px-4 py-3 text-xs max-w-[200px] truncate" title={getItemsSummary(order)}>
                    {getItemsSummary(order)}
                  </td>
                  <td className="px-4 py-3 font-medium">{formatAUD(order.amount_aud)}</td>
                  <td className="px-4 py-3">
                    <PaymentBadge method={order.payment_method_type} />
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(order.created_at)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.fulfillment_status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {activeTab === 'pending' && order.fulfillment_status === 'unfulfilled' && (
                      <button
                        onClick={() => handleStartPacking(order)}
                        className="px-3 py-1 bg-yellow-500 text-white text-xs font-medium rounded hover:bg-yellow-600 transition-colors"
                      >
                        Start Packing
                      </button>
                    )}
                    {activeTab === 'pending' && order.fulfillment_status === 'packing' && (
                      <button
                        onClick={() => {
                          setReadyModal(order);
                          setReadyNotes('');
                        }}
                        className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
                      >
                        Ready for Pickup
                      </button>
                    )}
                    {activeTab === 'ready' && (
                      <button
                        onClick={() => setCollectConfirm(order)}
                        className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition-colors"
                      >
                        Mark Collected
                      </button>
                    )}
                    {activeTab === 'collected' && (
                      <span className="text-xs text-muted-foreground">
                        {order.collected_at ? formatDate(order.collected_at) : '-'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Ready for Pickup Modal */}
      {readyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">Mark Ready for Pickup</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Order <span className="font-mono">{readyModal.id.slice(0, 8)}...</span> for{' '}
              <strong>{readyModal.customer_name}</strong>
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              The customer will receive an email notifying them their order is ready for collection.
            </p>

            <label className="block text-sm font-medium mb-1">Notes (optional)</label>
            <textarea
              value={readyNotes}
              onChange={(e) => setReadyNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Pickup available 9am-5pm weekdays"
              className="w-full border border-border rounded-lg px-3 py-2 mb-4 bg-background text-foreground resize-none"
            />

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setReadyModal(null)}
                className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReadySubmit}
                disabled={readyProcessing}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {readyProcessing ? 'Updating...' : 'Confirm Ready'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collect Confirmation Modal */}
      {collectConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold mb-3">Mark as Collected</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Confirm that <strong>{collectConfirm.customer_name}</strong> has collected order{' '}
              <span className="font-mono">{collectConfirm.id.slice(0, 8)}...</span>?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setCollectConfirm(null)}
                className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCollectConfirm}
                disabled={collectProcessing}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {collectProcessing ? 'Updating...' : 'Confirm Collected'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
