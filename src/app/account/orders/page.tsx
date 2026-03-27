'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

interface BankTransferOrder {
  id: string;
  reference_code: string;
  status: string;
  payment_deadline: string;
}

interface Order {
  id: string;
  amount_aud: number;
  amount: number;
  currency: string;
  payment_status: string;
  fulfillment_status: string;
  payment_method_type: string;
  product_details: {
    items?: Array<{
      product?: { name?: string; price?: number };
      name?: string;
      quantity?: number;
      price?: number;
      lockedPrice?: number;
    }>;
  } | null;
  created_at: string;
  bank_transfer_orders: BankTransferOrder[] | null;
}

const PAGE_SIZE = 10;

function formatAUD(amount: number): string {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(amount);
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

function getItemsSummary(order: Order): string {
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

function PaymentStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    succeeded: 'bg-green-100 text-green-800 border-green-200',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    failed: 'bg-red-100 text-red-800 border-red-200',
    awaiting_bank_transfer: 'bg-blue-100 text-blue-800 border-blue-200',
  };
  const labels: Record<string, string> = {
    succeeded: 'Paid',
    pending: 'Pending',
    failed: 'Failed',
    awaiting_bank_transfer: 'Awaiting Transfer',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${styles[status] || 'bg-muted text-muted-foreground border-border'}`}>
      {labels[status] || status}
    </span>
  );
}

function FulfillmentStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    unfulfilled: 'bg-muted text-muted-foreground border-border',
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
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${styles[status] || 'bg-muted text-muted-foreground border-border'}`}>
      {labels[status] || status}
    </span>
  );
}

function PaymentMethodIcon({ method }: { method: string }) {
  if (method === 'bank_transfer') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l18-3v3M3 6v14a1 1 0 001 1h16a1 1 0 001-1V6M3 6l9 2 9-2" />
        </svg>
        Bank Transfer
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h.01M11 15h.01M7 6h10a2 2 0 012 2v8a2 2 0 01-2 2H7a2 2 0 01-2-2V8a2 2 0 012-2z" />
      </svg>
      Card
    </span>
  );
}

function OrderRow({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  const items = order.product_details?.items || [];
  const btOrder = order.bank_transfer_orders?.[0] || null;

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Main row */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left px-5 py-4 bg-card hover:bg-muted/50 transition-colors"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-foreground truncate">{getItemsSummary(order)}</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs text-muted-foreground">{formatDate(order.created_at)}</span>
              <PaymentMethodIcon method={order.payment_method_type} />
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <PaymentStatusBadge status={order.payment_status} />
            <FulfillmentStatusBadge status={order.fulfillment_status} />
            <span className="text-sm font-semibold text-foreground">{formatAUD(order.amount_aud)}</span>
            <svg
              className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      {/* Expanded items */}
      {expanded && (
        <div className="border-t border-border bg-muted/50 px-5 py-4">
          {items.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="pb-2 font-medium">Item</th>
                  <th className="pb-2 font-medium text-center">Qty</th>
                  <th className="pb-2 font-medium text-right">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item, idx) => {
                  const name = item.product?.name || item.name || 'Product';
                  const qty = item.quantity || 1;
                  const price = item.lockedPrice || item.price || item.product?.price || 0;
                  return (
                    <tr key={idx}>
                      <td className="py-2 text-foreground">{name}</td>
                      <td className="py-2 text-center text-muted-foreground">{qty}</td>
                      <td className="py-2 text-right text-foreground">{formatAUD(price)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-muted-foreground">No item details available.</p>
          )}

          {btOrder && (
            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Bank Transfer Reference</p>
                <p className="text-sm font-mono font-semibold text-foreground">{btOrder.reference_code}</p>
              </div>
              <Link
                href={`/order/${order.id}`}
                className="text-sm text-primary hover:text-primary/80 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                View invoice
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/account/orders', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      } else {
        toast.error('Failed to load orders');
      }
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.push('/sign-in');
      return;
    }
    fetchOrders();
  }, [isLoaded, user, router, fetchOrders]);

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const visibleOrders = orders.slice(0, page * PAGE_SIZE);
  const hasMore = visibleOrders.length < orders.length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Order History</h2>
          <p className="text-muted-foreground mt-1">
            {orders.length} order{orders.length !== 1 ? 's' : ''} total
          </p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-card border border-border rounded-lg px-5 py-16 text-center">
          <p className="text-muted-foreground mb-3">You haven&apos;t placed any orders yet.</p>
          <Link href="/products" className="text-sm text-primary hover:text-primary/80 transition-colors">
            Browse products
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {visibleOrders.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
          </div>

          {hasMore && (
            <div className="mt-6 text-center">
              <button
                onClick={() => setPage((p) => p + 1)}
                className="px-6 py-2 bg-card border border-border rounded-lg text-sm text-foreground hover:bg-muted/50 transition-colors"
              >
                Load more ({orders.length - visibleOrders.length} remaining)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
