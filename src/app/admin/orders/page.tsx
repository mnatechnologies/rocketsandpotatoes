'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface OrderRow {
  id: string;
  customer_id: string;
  customer_name: string | null;
  customer_email: string | null;
  items_summary: string;
  item_count: number;
  amount_aud: number;
  payment_method_type: string | null;
  payment_status: string;
  fulfillment_status: string | null;
  created_at: string;
}

type Filter = 'all' | 'succeeded' | 'pending' | 'failed' | 'awaiting_bank_transfer';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'succeeded', label: 'Succeeded' },
  { key: 'pending', label: 'Pending' },
  { key: 'failed', label: 'Failed' },
  { key: 'awaiting_bank_transfer', label: 'Awaiting Transfer' },
];

function PaymentStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    succeeded: 'bg-green-100 text-green-800 border border-green-200',
    pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    failed: 'bg-red-100 text-red-800 border border-red-200',
    awaiting_bank_transfer: 'bg-blue-100 text-blue-800 border border-blue-200',
  };
  const labels: Record<string, string> = {
    succeeded: 'Succeeded',
    pending: 'Pending',
    failed: 'Failed',
    awaiting_bank_transfer: 'Awaiting Transfer',
  };
  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${styles[status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
      {labels[status] || status}
    </span>
  );
}

function FulfillmentStatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-xs text-muted-foreground">—</span>;
  const styles: Record<string, string> = {
    unfulfilled: 'bg-gray-100 text-gray-600 border border-gray-200',
    packing: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    ready_for_pickup: 'bg-blue-100 text-blue-800 border border-blue-200',
    collected: 'bg-green-100 text-green-800 border border-green-200',
  };
  const labels: Record<string, string> = {
    unfulfilled: 'Unfulfilled',
    packing: 'Packing',
    ready_for_pickup: 'Ready for Pickup',
    collected: 'Collected',
  };
  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${styles[status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
      {labels[status] || status}
    </span>
  );
}

function PaymentMethodLabel({ method }: { method: string | null }) {
  if (!method) return <span className="text-xs text-muted-foreground">—</span>;
  if (method === 'card') {
    return (
      <span className="text-xs font-medium text-foreground flex items-center gap-1">
        <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" />
          <path d="M2 10h20" stroke="currentColor" strokeLinecap="round" />
        </svg>
        Card
      </span>
    );
  }
  if (method === 'bank_transfer') {
    return (
      <span className="text-xs font-medium text-foreground flex items-center gap-1">
        <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10v11m16-11v11M8 10v11m8-11v11" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Bank Transfer
      </span>
    );
  }
  return <span className="text-xs text-muted-foreground">{method}</span>;
}

function formatAUD(amount: number): string {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(amount);
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const LIMIT = 50;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        filter: activeFilter,
        page: String(page),
        limit: String(LIMIT),
        t: String(Date.now()),
      });
      if (debouncedSearch) params.set('search', debouncedSearch);

      const res = await fetch(`/api/admin/orders?${params}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setOrders(json.data || []);
      setTotal(json.total || 0);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [activeFilter, page, debouncedSearch]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-1">Orders</h1>
        <p className="text-muted-foreground">View and manage all customer orders.</p>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by customer name, email, or order ID..."
          className="w-full max-w-sm px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => {
              setActiveFilter(f.key);
              setPage(1);
            }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeFilter === f.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {f.label}
            {!loading && activeFilter === f.key && total > 0 && (
              <span className="ml-2 text-xs bg-muted rounded-full px-2 py-0.5">{total}</span>
            )}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Loading orders...</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && orders.length === 0 && (
        <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground">
          No orders found.
        </div>
      )}

      {/* Table */}
      {!loading && orders.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Customer</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Items</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Total AUD</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Payment Method</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Payment Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fulfillment</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr
                  key={o.id}
                  onClick={() => router.push(`/admin/orders/${o.id}`)}
                  className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer"
                >
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {new Date(o.created_at).toLocaleDateString('en-AU')}
                  </td>
                  <td className="px-4 py-3">
                    {o.customer_name ? (
                      <div className="font-medium text-foreground">{o.customer_name}</div>
                    ) : (
                      <div className="text-muted-foreground italic text-xs">No name</div>
                    )}
                    {o.customer_email && (
                      <div className="text-xs text-muted-foreground">{o.customer_email}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">
                    {o.items_summary}
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                    {o.amount_aud ? formatAUD(o.amount_aud) : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <PaymentMethodLabel method={o.payment_method_type} />
                  </td>
                  <td className="px-4 py-3">
                    <PaymentStatusBadge status={o.payment_status} />
                  </td>
                  <td className="px-4 py-3">
                    <FulfillmentStatusBadge status={o.fulfillment_status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-sm border border-border rounded hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm text-muted-foreground">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 text-sm border border-border rounded hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
