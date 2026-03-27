'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';

const METAL_TYPES = [
  { value: 'XAU', label: 'Gold' },
  { value: 'XAG', label: 'Silver' },
  { value: 'XPT', label: 'Platinum' },
  { value: 'XPD', label: 'Palladium' },
];

interface FormState {
  name: string;
  description: string;
  metal_type: string;
  weight: string;
  purity: string;
  category: string;
  form_type: string;
  brand: string;
  price: string;
  stock: boolean;
  image_url: string;
}

const defaultForm: FormState = {
  name: '',
  description: '',
  metal_type: '',
  weight: '',
  purity: '',
  category: '',
  form_type: '',
  brand: '',
  price: '',
  stock: true,
  image_url: '',
};

export default function NewProductPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  // Auto-populate category from metal_type label
  useEffect(() => {
    if (form.metal_type && !form.category) {
      const label = METAL_TYPES.find((m) => m.value === form.metal_type)?.label || '';
      setForm((prev) => ({ ...prev, category: label }));
    }
  }, [form.metal_type]);

  const set = (field: keyof FormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.metal_type) newErrors.metal_type = 'Metal type is required';
    if (!form.price || Number(form.price) <= 0) newErrors.price = 'Price must be greater than 0';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || 'Failed to create product');
        return;
      }

      toast.success(`${form.name} created successfully`);
      router.push('/admin/products');
    } catch {
      toast.error('Failed to create product');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/admin/products"
          className="text-muted-foreground hover:text-foreground transition-colors text-sm"
        >
          &larr; Back to Products
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-1">Add Product</h1>
        <p className="text-muted-foreground">Create a new product in the catalogue.</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="e.g. 1oz ABC Gold Bar"
            className={`w-full border rounded-lg px-3 py-2 bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
              errors.name ? 'border-red-400' : 'border-border'
            }`}
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            rows={3}
            placeholder="Product description..."
            className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Metal Type + Form Type */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Metal Type <span className="text-red-500">*</span>
            </label>
            <select
              value={form.metal_type}
              onChange={(e) => set('metal_type', e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
                errors.metal_type ? 'border-red-400' : 'border-border'
              }`}
            >
              <option value="">Select metal type</option>
              {METAL_TYPES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label} ({m.value})
                </option>
              ))}
            </select>
            {errors.metal_type && <p className="text-red-500 text-xs mt-1">{errors.metal_type}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Form Type</label>
            <input
              type="text"
              value={form.form_type}
              onChange={(e) => set('form_type', e.target.value)}
              placeholder="e.g. bar, coin, round"
              className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Weight + Purity */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Weight</label>
            <input
              type="text"
              value={form.weight}
              onChange={(e) => set('weight', e.target.value)}
              placeholder="e.g. 1oz, 100g"
              className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Purity</label>
            <input
              type="text"
              value={form.purity}
              onChange={(e) => set('purity', e.target.value)}
              placeholder="e.g. 0.9999"
              className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Category</label>
          <input
            type="text"
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
            placeholder="e.g. Gold, Silver (auto-filled from metal type)"
            className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Brand */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Brand</label>
          <input
            type="text"
            value={form.brand}
            onChange={(e) => set('brand', e.target.value)}
            placeholder="e.g. Perth Mint, ABC Bullion"
            className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Base Price (USD) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <input
              type="number"
              value={form.price}
              onChange={(e) => set('price', e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className={`w-full border rounded-lg pl-7 pr-3 py-2 bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
                errors.price ? 'border-red-400' : 'border-border'
              }`}
            />
          </div>
          {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
        </div>

        {/* Image URL */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Image URL</label>
          <input
            type="text"
            value={form.image_url}
            onChange={(e) => set('image_url', e.target.value)}
            placeholder="https://..."
            className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {form.image_url && (
            <img
              src={form.image_url}
              alt="Preview"
              className="mt-2 h-20 w-20 object-cover rounded border border-border"
              onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
            />
          )}
        </div>

        {/* Stock */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.stock}
              onChange={(e) => set('stock', e.target.checked)}
              className="w-4 h-4 rounded border-border"
            />
            <span className="text-sm font-medium text-foreground">In Stock</span>
          </label>
          <p className="text-xs text-muted-foreground mt-1 ml-7">
            Uncheck to mark this product as out of stock.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Link
            href="/admin/products"
            className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
