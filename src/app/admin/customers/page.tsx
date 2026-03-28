'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface CustomerRow {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  verification_status: string;
  monitoring_level: string | null;
  requires_enhanced_dd: boolean;
  created_at: string;
  order_count: number;
  total_spent_aud: number;
}

type Filter = 'all' | 'verified' | 'pending' | 'unverified';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'verified', label: 'Verified' },
  { key: 'pending', label: 'Pending' },
  { key: 'unverified', label: 'Unverified' },
];

function VerificationBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    verified: 'bg-green-100 text-green-800 border border-green-200',
    pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    unverified: 'bg-gray-100 text-gray-600 border border-gray-200',
    rejected: 'bg-red-100 text-red-800 border border-red-200',
  };
  const labels: Record<string, string> = {
    verified: 'Verified',
    pending: 'Pending',
    unverified: 'Unverified',
    rejected: 'Rejected',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {labels[status] || status}
    </span>
  );
}

function RiskBadge({ level, enhanced }: { level: string | null; enhanced: boolean }) {
  if (enhanced) {
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
        High (EDD)
      </span>
    );
  }
  if (!level || level === 'standard') {
    return <span className="text-xs text-muted-foreground">Standard</span>;
  }
  const styles: Record<string, string> = {
    elevated: 'bg-orange-100 text-orange-800 border border-orange-200',
    high: 'bg-red-100 text-red-800 border border-red-200',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[level] || 'bg-gray-100 text-gray-600'}`}>
      {level.charAt(0).toUpperCase() + level.slice(1)}
    </span>
  );
}

function formatAUD(amount: number): string {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(amount);
}

export default function AdminCustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const LIMIT = 50;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search
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

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        filter: activeFilter,
        page: String(page),
        limit: String(LIMIT),
        t: String(Date.now()),
      });
      if (debouncedSearch) params.set('search', debouncedSearch);

      const res = await fetch(`/api/admin/customers?${params}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setCustomers(json.data || []);
      setTotal(json.total || 0);
    } catch {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [activeFilter, page, debouncedSearch]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-1">Customers</h1>
        <p className="text-muted-foreground">Manage and review customer accounts and compliance status.</p>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
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
            <p className="text-muted-foreground text-sm">Loading customers...</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && customers.length === 0 && (
        <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground">
          No customers found.
        </div>
      )}

      {/* Table */}
      {!loading && customers.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Verification</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Risk Level</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Orders</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Total Spent</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Joined</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => router.push(`/admin/customers/${c.id}`)}
                  className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer"
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {c.first_name || c.last_name
                      ? `${c.first_name || ''} ${c.last_name || ''}`.trim()
                      : <span className="text-muted-foreground italic">No name</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.email}</td>
                  <td className="px-4 py-3">
                    <VerificationBadge status={c.verification_status} />
                  </td>
                  <td className="px-4 py-3">
                    <RiskBadge level={c.monitoring_level} enhanced={c.requires_enhanced_dd} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.order_count}</td>
                  <td className="px-4 py-3 font-medium">
                    {c.total_spent_aud > 0 ? formatAUD(c.total_spent_aud) : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString('en-AU')}
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
