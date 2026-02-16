'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Loader2,
  Link2,
  Unlink,
  RefreshCw,
  Package,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
} from 'lucide-react';

// -- Types matching API contracts --

interface XeroConnectionStatus {
  id: string;
  tenant_name: string;
  xero_tenant_id: string;
  connected_at: string;
  connected_by: string;
  scopes: string;
  token_expires_at: string;
}

interface XeroSyncLogEntry {
  id: string;
  sync_type: 'invoice' | 'contact' | 'item' | 'adjustment';
  sync_status: 'pending' | 'success' | 'failed';
  xero_invoice_id: string | null;
  xero_contact_id: string | null;
  xero_item_id: string | null;
  error_message: string | null;
  retry_count: number;
  created_at: string;
  completed_at: string | null;
}

interface XeroSyncSummary {
  total: number;
  success: number;
  failed: number;
  pending: number;
}

interface XeroStatusData {
  connected: boolean;
  connection: XeroConnectionStatus | null;
  sync_history: XeroSyncLogEntry[];
  sync_summary: XeroSyncSummary;
}

interface StockAdjustmentWithProduct {
  id: string;
  product_id: string;
  adjustment_type: 'write_off' | 'damaged' | 'correction' | 'other';
  reason: string;
  notes: string | null;
  adjusted_by: string;
  xero_journal_id: string | null;
  sync_status: 'pending' | 'synced' | 'failed';
  created_at: string;
  product: {
    name: string;
    slug: string;
    sku: string;
  };
}

interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
}

// -- Status badge component --

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    synced: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    connected: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    disconnected: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  };

  return (
    <span
      className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// -- Main page component --

export default function AdminIntegrationsPage() {
  const [loading, setLoading] = useState(true);
  const [statusData, setStatusData] = useState<XeroStatusData | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  // Stock adjustments state
  const [adjustments, setAdjustments] = useState<StockAdjustmentWithProduct[]>([]);
  const [adjustmentsLoading, setAdjustmentsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  // New adjustment form state
  const [showAdjustmentForm, setShowAdjustmentForm] = useState(false);
  const [adjProductId, setAdjProductId] = useState('');
  const [adjType, setAdjType] = useState<'write_off' | 'damaged' | 'correction' | 'other'>('damaged');
  const [adjReason, setAdjReason] = useState('');
  const [adjNotes, setAdjNotes] = useState('');
  const [submittingAdj, setSubmittingAdj] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/xero/status');
      if (!response.ok) throw new Error('Failed to fetch Xero status');
      const result = await response.json();
      if (result.success) {
        setStatusData(result.data);
      }
    } catch (error) {
      console.error('Error fetching Xero status:', error);
      toast.error('Failed to load Xero connection status');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAdjustments = useCallback(async () => {
    try {
      setAdjustmentsLoading(true);
      const response = await fetch('/api/admin/stock-adjustments?limit=50');
      if (!response.ok) throw new Error('Failed to fetch stock adjustments');
      const result = await response.json();
      if (result.success) {
        setAdjustments(result.data.adjustments);
      }
    } catch (error) {
      console.error('Error fetching stock adjustments:', error);
      toast.error('Failed to load stock adjustments');
    } finally {
      setAdjustmentsLoading(false);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      setProductsLoading(true);
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchAdjustments();
    fetchProducts();
  }, [fetchStatus, fetchAdjustments, fetchProducts]);

  // Handle query params from OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const xeroParam = params.get('xero');
    if (xeroParam === 'connected') {
      toast.success('Xero connected successfully');
      // Clean up URL
      window.history.replaceState({}, '', '/admin/integrations');
    } else if (xeroParam === 'error') {
      const message = params.get('message') || 'Unknown error';
      toast.error(`Xero connection failed: ${message.replace(/_/g, ' ')}`);
      window.history.replaceState({}, '', '/admin/integrations');
    }
  }, []);

  const handleDisconnect = async () => {
    try {
      setDisconnecting(true);
      const response = await fetch('/api/xero/disconnect', { method: 'POST' });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to disconnect Xero');
      }
      toast.success('Xero disconnected successfully');
      setShowDisconnectConfirm(false);
      await fetchStatus();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to disconnect Xero';
      console.error('Error disconnecting Xero:', error);
      toast.error(message);
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSyncProducts = async () => {
    try {
      setSyncing(true);
      toast.info('Syncing products to Xero...');
      const response = await fetch('/api/xero/items', { method: 'POST' });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to sync products');
      }
      const result = await response.json();
      if (result.success) {
        const { synced, failed, total } = result.data;
        if (failed > 0) {
          toast.warning(`Synced ${synced}/${total} products. ${failed} failed.`);
        } else {
          toast.success(`Successfully synced ${synced} products to Xero`);
        }
        await fetchStatus();
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to sync products';
      console.error('Error syncing products:', error);
      toast.error(message);
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!adjProductId) {
      toast.error('Please select a product');
      return;
    }
    if (!adjReason.trim()) {
      toast.error('Please enter a reason');
      return;
    }

    try {
      setSubmittingAdj(true);
      const response = await fetch('/api/admin/stock-adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: adjProductId,
          adjustment_type: adjType,
          reason: adjReason.trim(),
          notes: adjNotes.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to create stock adjustment');
      }

      toast.success('Stock adjustment created');
      setAdjProductId('');
      setAdjType('damaged');
      setAdjReason('');
      setAdjNotes('');
      setShowAdjustmentForm(false);
      await fetchAdjustments();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create stock adjustment';
      console.error('Error creating stock adjustment:', error);
      toast.error(message);
    } finally {
      setSubmittingAdj(false);
    }
  };

  const getXeroId = (entry: XeroSyncLogEntry): string => {
    return entry.xero_invoice_id || entry.xero_contact_id || entry.xero_item_id || '-';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isConnected = statusData?.connected ?? false;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Integrations</h1>
        <p className="text-muted-foreground">
          Manage external service connections and data synchronisation
        </p>
      </div>

      {/* Xero Connection Card */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-foreground">Xero Accounting</h2>
            <StatusBadge status={isConnected ? 'connected' : 'disconnected'} />
          </div>
        </div>

        {isConnected && statusData?.connection ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/30 rounded-lg p-4">
              <div>
                <p className="text-xs text-muted-foreground">Organisation</p>
                <p className="text-sm font-medium text-foreground">
                  {statusData.connection.tenant_name}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Connected</p>
                <p className="text-sm font-medium text-foreground">
                  {new Date(statusData.connection.connected_at).toLocaleDateString('en-AU', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Connected By</p>
                <p className="text-sm font-medium text-foreground">
                  {statusData.connection.connected_by}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Token Expires</p>
                <p className="text-sm font-medium text-foreground">
                  {new Date(statusData.connection.token_expires_at).toLocaleString('en-AU')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSyncProducts}
                disabled={syncing}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
              >
                {syncing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <Package className="h-4 w-4" />
                    Sync Products to Xero
                  </>
                )}
              </button>

              {!showDisconnectConfirm ? (
                <button
                  onClick={() => setShowDisconnectConfirm(true)}
                  className="px-4 py-2 border border-border rounded-lg font-medium text-sm hover:bg-muted transition-colors flex items-center gap-2 text-destructive"
                >
                  <Unlink className="h-4 w-4" />
                  Disconnect
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Are you sure?</span>
                  <button
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                    className="px-3 py-1.5 bg-destructive text-destructive-foreground rounded-lg font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                  >
                    {disconnecting ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : null}
                    Yes, Disconnect
                  </button>
                  <button
                    onClick={() => setShowDisconnectConfirm(false)}
                    className="px-3 py-1.5 border border-border rounded-lg font-medium text-sm hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Connect your Xero account to automatically sync invoices, contacts, and inventory
              items.
            </p>
            <a
              href="/api/xero/auth"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
            >
              <Link2 className="h-4 w-4" />
              Connect Xero
            </a>
          </div>
        )}
      </div>

      {/* Sync Summary */}
      {isConnected && statusData?.sync_summary && statusData.sync_summary.total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl border border-border shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{statusData.sync_summary.total}</p>
            <p className="text-xs text-muted-foreground">Total Syncs</p>
          </div>
          <div className="bg-card rounded-xl border border-border shadow-sm p-4 text-center">
            <div className="flex items-center justify-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <p className="text-2xl font-bold text-foreground">{statusData.sync_summary.success}</p>
            </div>
            <p className="text-xs text-muted-foreground">Successful</p>
          </div>
          <div className="bg-card rounded-xl border border-border shadow-sm p-4 text-center">
            <div className="flex items-center justify-center gap-1.5">
              <XCircle className="h-4 w-4 text-red-500" />
              <p className="text-2xl font-bold text-foreground">{statusData.sync_summary.failed}</p>
            </div>
            <p className="text-xs text-muted-foreground">Failed</p>
          </div>
          <div className="bg-card rounded-xl border border-border shadow-sm p-4 text-center">
            <div className="flex items-center justify-center gap-1.5">
              <Clock className="h-4 w-4 text-yellow-500" />
              <p className="text-2xl font-bold text-foreground">{statusData.sync_summary.pending}</p>
            </div>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
        </div>
      )}

      {/* Sync History Table */}
      {isConnected && statusData && statusData.sync_history.length > 0 && (
        <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Sync History</h2>
            <button
              onClick={fetchStatus}
              className="p-2 text-muted-foreground hover:text-primary rounded-lg hover:bg-muted transition-colors"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Xero ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {statusData.sync_history.map((entry) => (
                  <tr key={entry.id} className={entry.sync_status === 'failed' ? 'bg-red-50/50 dark:bg-red-950/10' : ''}>
                    <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">
                      {new Date(entry.created_at).toLocaleDateString('en-AU', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground capitalize">{entry.sync_type}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={entry.sync_status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground font-mono text-xs">
                      {getXeroId(entry)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {entry.error_message ? (
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-3.5 w-3.5 text-destructive flex-shrink-0" />
                          <span className="text-destructive text-xs">{entry.error_message}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Adjustments Section */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Stock Adjustments</h2>
            <p className="text-sm text-muted-foreground">
              Record write-offs, damages, and corrections.
              {isConnected ? ' Adjustments sync to Xero as manual journal entries.' : ''}
            </p>
          </div>
          <button
            onClick={() => setShowAdjustmentForm(!showAdjustmentForm)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Adjustment
          </button>
        </div>

        {/* New Adjustment Form */}
        {showAdjustmentForm && (
          <form onSubmit={handleCreateAdjustment} className="bg-muted/30 rounded-lg p-4 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">New Stock Adjustment</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-foreground">Product</label>
                <select
                  value={adjProductId}
                  onChange={(e) => setAdjProductId(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  disabled={productsLoading}
                >
                  <option value="">Select a product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.sku ? `(${p.sku})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-foreground">Adjustment Type</label>
                <select
                  value={adjType}
                  onChange={(e) => setAdjType(e.target.value as typeof adjType)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                >
                  <option value="write_off">Write Off</option>
                  <option value="damaged">Damaged</option>
                  <option value="correction">Correction</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-foreground">Reason</label>
              <input
                type="text"
                value={adjReason}
                onChange={(e) => setAdjReason(e.target.value)}
                placeholder="Short description of why this adjustment is needed"
                maxLength={500}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-foreground">Notes (optional)</label>
              <textarea
                value={adjNotes}
                onChange={(e) => setAdjNotes(e.target.value)}
                placeholder="Additional details..."
                rows={3}
                maxLength={2000}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm resize-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={submittingAdj}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
              >
                {submittingAdj ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Create Adjustment'
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowAdjustmentForm(false)}
                className="px-4 py-2 border border-border rounded-lg font-medium text-sm hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Adjustments Table */}
        {adjustmentsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : adjustments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Xero Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {adjustments.map((adj) => (
                  <tr key={adj.id}>
                    <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">
                      {new Date(adj.created_at).toLocaleDateString('en-AU', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {adj.product?.name || adj.product_id}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground capitalize">
                      {adj.adjustment_type.replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground max-w-[200px] truncate" title={adj.reason}>
                      {adj.reason}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={adj.sync_status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No stock adjustments recorded yet.
          </div>
        )}
      </div>
    </div>
  );
}
