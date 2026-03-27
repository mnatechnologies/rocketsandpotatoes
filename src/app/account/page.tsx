'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

interface Order {
  id: string;
  amount_aud: number;
  payment_status: string;
  fulfillment_status: string;
  payment_method_type: string;
  product_details: {
    items?: Array<{
      product?: { name?: string };
      name?: string;
      quantity?: number;
    }>;
  } | null;
  created_at: string;
}

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  verification_status: string;
  account_type: string;
  created_at: string;
}

function formatAUD(amount: number): string {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
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

export default function AccountDashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [ordersRes, profileRes] = await Promise.all([
        fetch('/api/account/orders', { cache: 'no-store' }),
        fetch('/api/account/profile', { cache: 'no-store' }),
      ]);

      if (ordersRes.ok) {
        const data = await ordersRes.json();
        setOrders(data.orders || []);
      } else {
        toast.error('Failed to load orders');
      }
      if (profileRes.ok) {
        const data = await profileRes.json();
        setCustomer(data.customer || null);
      }
    } catch {
      toast.error('Failed to load account data');
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
    fetchData();
  }, [isLoaded, user, router, fetchData]);

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your account...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const firstName = user.firstName || customer?.first_name || '';
  const totalSpent = orders
    .filter((o) => o.payment_status === 'succeeded')
    .reduce((sum, o) => sum + (o.amount_aud || 0), 0);
  const recentOrders = orders.slice(0, 5);

  const verificationLabel: Record<string, string> = {
    unverified: 'Unverified',
    pending: 'Pending Review',
    verified: 'Verified',
    rejected: 'Rejected',
    enhanced_due_diligence: 'Enhanced Due Diligence',
  };

  const verificationColor: Record<string, string> = {
    unverified: 'text-yellow-600',
    pending: 'text-blue-600',
    verified: 'text-green-600',
    rejected: 'text-red-600',
    enhanced_due_diligence: 'text-purple-600',
  };

  const verificationStatus = customer?.verification_status || 'unverified';

  return (
    <div>
      {/* Greeting */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-foreground">
          Welcome back{firstName ? `, ${firstName}` : ''}
        </h2>
        <p className="text-muted-foreground mt-1">
          Here&apos;s an overview of your account activity
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-card border border-border rounded-lg p-5">
          <p className="text-sm text-muted-foreground mb-1">Total Orders</p>
          <p className="text-3xl font-bold text-foreground">{orders.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5">
          <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
          <p className="text-3xl font-bold text-foreground">{formatAUD(totalSpent)}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5">
          <p className="text-sm text-muted-foreground mb-1">Member Since</p>
          <p className="text-xl font-bold text-foreground">
            {customer ? formatDate(customer.created_at) : formatDate(user.createdAt?.toISOString() || new Date().toISOString())}
          </p>
        </div>
      </div>

      {/* Account status */}
      <div className="bg-card border border-border rounded-lg p-5 mb-8">
        <h3 className="text-lg font-semibold text-foreground mb-3">Account Status</h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Verification</p>
            <p className={`font-semibold ${verificationColor[verificationStatus] || 'text-foreground'}`}>
              {verificationLabel[verificationStatus] || verificationStatus}
            </p>
          </div>
          {customer?.account_type && (
            <div>
              <p className="text-sm text-muted-foreground">Account Type</p>
              <p className="font-semibold text-foreground capitalize">{customer.account_type}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-semibold text-foreground">{user.primaryEmailAddress?.emailAddress}</p>
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-card border border-border rounded-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Recent Orders</h3>
          <Link href="/account/orders" className="text-sm text-primary hover:text-primary/80 transition-colors">
            View all
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-muted-foreground">No orders yet.</p>
            <Link href="/products" className="mt-2 inline-block text-sm text-primary hover:text-primary/80">
              Browse products
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentOrders.map((order) => (
              <div key={order.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{getItemsSummary(order)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatDate(order.created_at)}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <PaymentStatusBadge status={order.payment_status} />
                  <FulfillmentStatusBadge status={order.fulfillment_status} />
                  <span className="text-sm font-semibold text-foreground">{formatAUD(order.amount_aud)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        <Link href="/account/orders">
          <div className="bg-card border border-border rounded-lg p-5 hover:border-primary hover:shadow-sm transition-all cursor-pointer">
            <h4 className="font-semibold text-foreground mb-1">Order History</h4>
            <p className="text-sm text-muted-foreground">View all your past and pending orders</p>
          </div>
        </Link>
        <Link href="/account/settings">
          <div className="bg-card border border-border rounded-lg p-5 hover:border-primary hover:shadow-sm transition-all cursor-pointer">
            <h4 className="font-semibold text-foreground mb-1">Account Settings</h4>
            <p className="text-sm text-muted-foreground">Manage your profile and preferences</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
