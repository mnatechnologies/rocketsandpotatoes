'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  description: string | null;
  metal_type: string;
  weight: string | null;
  purity: string | null;
  category: string | null;
  form_type: string | null;
  brand: string | null;
  price: number;
  stock: boolean;
  image_url: string | null;
  slug: string | null;
  created_at: string;
}

const METAL_TYPES = ['gold', 'silver', 'platinum', 'palladium'];

function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function StockBadge({ inStock }: { inStock: boolean }) {
  return (
    <span
      className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${
        inStock
          ? 'bg-green-50 text-green-700 border-green-200'
          : 'bg-red-50 text-red-700 border-red-200'
      }`}
    >
      {inStock ? 'In Stock' : 'Out of Stock'}
    </span>
  );
}

function MetalBadge({ metal }: { metal: string }) {
  const colors: Record<string, string> = {
    gold: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    silver: 'bg-gray-50 text-gray-700 border-gray-300',
    platinum: 'bg-blue-50 text-blue-700 border-blue-200',
    palladium: 'bg-purple-50 text-purple-700 border-purple-200',
  };
  return (
    <span
      className={`text-xs font-medium px-2.5 py-0.5 rounded-full border capitalize ${
        colors[metal] || 'bg-muted text-muted-foreground border-border'
      }`}
    >
      {metal}
    </span>
  );
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [metalFilter, setMetalFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [deleteModal, setDeleteModal] = useState<Product | null>(null);
  const [deleteProcessing, setDeleteProcessing] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [search]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ t: String(Date.now()) });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (metalFilter !== 'all') params.set('metal_type', metalFilter);
      if (stockFilter !== 'all') params.set('stock', stockFilter);

      const res = await fetch(`/api/admin/products?${params}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setProducts(json.data || []);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, metalFilter, stockFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleToggleStock = async (product: Product) => {
    setTogglingId(product.id);
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: !product.stock }),
      });
      if (!res.ok) throw new Error('Failed to update');
      toast.success(`${product.name} marked as ${!product.stock ? 'in stock' : 'out of stock'}`);
      fetchProducts();
    } catch {
      toast.error('Failed to update stock status');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    setDeleteProcessing(true);
    try {
      const res = await fetch(`/api/admin/products/${deleteModal.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success(`${deleteModal.name} deleted`);
      setDeleteModal(null);
      fetchProducts();
    } catch {
      toast.error('Failed to delete product');
    } finally {
      setDeleteProcessing(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-1">Products</h1>
          <p className="text-muted-foreground">Manage your precious metals product catalogue.</p>
        </div>
        <Link
          href="/admin/products/new"
          className="flex-shrink-0 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64 border border-border rounded-lg px-3 py-2 bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <select
          value={metalFilter}
          onChange={(e) => setMetalFilter(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Metals</option>
          {METAL_TYPES.map((m) => (
            <option key={m} value={m} className="capitalize">
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </option>
          ))}
        </select>
        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Stock Status</option>
          <option value="in_stock">In Stock</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Loading products...</p>
        </div>
      )}

      {/* Empty */}
      {!loading && products.length === 0 && (
        <div className="text-center py-12 text-muted-foreground bg-card border border-border rounded-lg">
          No products found.
          {(debouncedSearch || metalFilter !== 'all' || stockFilter !== 'all') && (
            <span> Try clearing your filters.</span>
          )}
        </div>
      )}

      {/* Table */}
      {!loading && products.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Image</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Metal</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Weight</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Purity</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Form</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Brand</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Price (USD)</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Stock</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-10 h-10 object-cover rounded border border-border"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-10 h-10 rounded border border-border bg-muted flex items-center justify-center text-muted-foreground text-xs ${
                        product.image_url ? 'hidden' : ''
                      }`}
                    >
                      No img
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{product.name}</div>
                    {product.slug && (
                      <div className="text-xs text-muted-foreground font-mono">{product.slug}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <MetalBadge metal={product.metal_type} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{product.weight || '-'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{product.purity || '-'}</td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">{product.form_type || '-'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{product.brand || '-'}</td>
                  <td className="px-4 py-3 font-medium">{formatUSD(product.price)}</td>
                  <td className="px-4 py-3">
                    <StockBadge inStock={product.stock} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleToggleStock(product)}
                        disabled={togglingId === product.id}
                        className={`px-3 py-1 text-xs font-medium rounded transition-colors disabled:opacity-50 ${
                          product.stock
                            ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                            : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                        }`}
                        title={product.stock ? 'Mark out of stock' : 'Mark in stock'}
                      >
                        {togglingId === product.id
                          ? '...'
                          : product.stock
                          ? 'Mark OOS'
                          : 'Mark In Stock'}
                      </button>
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => setDeleteModal(product)}
                        className="px-3 py-1 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-foreground mb-3">Delete Product</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to delete{' '}
              <strong className="text-foreground">{deleteModal.name}</strong>? This action cannot be
              undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteModal(null)}
                disabled={deleteProcessing}
                className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteProcessing}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleteProcessing ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
