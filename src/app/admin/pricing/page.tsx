'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2, Save, Plus, Trash2 } from 'lucide-react';

interface PricingConfig {
  id: string;
  markup_percentage: number;
  default_base_fee: number;
  brand_base_fees: Record<string, number>;
  updated_at: string;
  created_at: string;
}

export default function AdminPricingPage() {
  const [config, setConfig] = useState<PricingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [markupPercentage, setMarkupPercentage] = useState<number>(5);
  const [defaultBaseFee, setDefaultBaseFee] = useState<number>(10);
  const [brandFees, setBrandFees] = useState<Record<string, number>>({});

  // New brand entry state
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandFee, setNewBrandFee] = useState<number>(10);

  useEffect(() => {
    fetchPricingConfig();
  }, []);

  const fetchPricingConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/pricing');

      if (!response.ok) {
        throw new Error('Failed to fetch pricing configuration');
      }

      const result = await response.json();

      if (result.success && result.data) {
        setConfig(result.data);
        setMarkupPercentage(result.data.markup_percentage);
        setDefaultBaseFee(result.data.default_base_fee);
        setBrandFees(result.data.brand_base_fees || {});
      }
    } catch (error) {
      console.error('Error fetching pricing config:', error);
      toast.error('Failed to load pricing configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const response = await fetch('/api/admin/pricing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markup_percentage: markupPercentage,
          default_base_fee: defaultBaseFee,
          brand_base_fees: brandFees,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save pricing configuration');
      }

      const result = await response.json();

      if (result.success) {
        setConfig(result.data);
        toast.success('Pricing configuration updated successfully');
      }
    } catch (error: any) {
      console.error('Error saving pricing config:', error);
      toast.error(error.message || 'Failed to save pricing configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleAddBrand = () => {
    if (!newBrandName.trim()) {
      toast.error('Please enter a brand name');
      return;
    }

    if (newBrandFee < 0) {
      toast.error('Base fee must be a positive number');
      return;
    }

    if (brandFees[newBrandName]) {
      toast.error('Brand already exists');
      return;
    }

    setBrandFees({
      ...brandFees,
      [newBrandName]: newBrandFee,
    });

    setNewBrandName('');
    setNewBrandFee(10);
    toast.success(`Added brand: ${newBrandName}`);
  };

  const handleRemoveBrand = (brand: string) => {
    const updated = { ...brandFees };
    delete updated[brand];
    setBrandFees(updated);
    toast.success(`Removed brand: ${brand}`);
  };

  const handleUpdateBrandFee = (brand: string, fee: number) => {
    setBrandFees({
      ...brandFees,
      [brand]: fee,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Pricing Configuration</h1>
        <p className="text-muted-foreground">
          Manage global pricing settings including markup percentage and base fees
        </p>
      </div>

      {/* Global Settings */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-6">
        <h2 className="text-xl font-semibold text-foreground">Global Settings</h2>

        {/* Markup Percentage */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            Markup Percentage (%)
          </label>
          <p className="text-xs text-muted-foreground mb-2">
            Percentage markup applied to spot cost for all products
          </p>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={markupPercentage}
            onChange={(e) => setMarkupPercentage(parseFloat(e.target.value) || 0)}
            className="w-full max-w-xs px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <p className="text-xs text-muted-foreground">
            Current: {markupPercentage}% (e.g., $100 spot cost = ${(100 * (1 + markupPercentage / 100)).toFixed(2)} markup cost)
          </p>
        </div>

        {/* Default Base Fee */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            Default Base Fee ($)
          </label>
          <p className="text-xs text-muted-foreground mb-2">
            Flat fee added to all products (unless overridden by brand-specific fee)
          </p>
          <input
            type="number"
            min="0"
            step="0.01"
            value={defaultBaseFee}
            onChange={(e) => setDefaultBaseFee(parseFloat(e.target.value) || 0)}
            className="w-full max-w-xs px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <p className="text-xs text-muted-foreground">
            This fee is added to the final price after markup
          </p>
        </div>
      </div>

      {/* Brand-Specific Base Fees */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-1">Brand-Specific Base Fees</h2>
          <p className="text-sm text-muted-foreground">
            Override the default base fee for specific brands
          </p>
        </div>

        {/* Add New Brand */}
        <div className="bg-muted/30 rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Add Brand Override</h3>
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Brand name (e.g., Perth Mint)"
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              />
            </div>
            <div className="w-32">
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Base fee"
                value={newBrandFee}
                onChange={(e) => setNewBrandFee(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              />
            </div>
            <button
              onClick={handleAddBrand}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
        </div>

        {/* Brand Fees List */}
        {Object.keys(brandFees).length > 0 ? (
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_150px_60px] gap-3 text-xs font-semibold text-muted-foreground px-3 pb-2 border-b border-border">
              <div>Brand Name</div>
              <div>Base Fee</div>
              <div></div>
            </div>
            {Object.entries(brandFees).map(([brand, fee]) => (
              <div
                key={brand}
                className="grid grid-cols-[1fr_150px_60px] gap-3 items-center bg-background rounded-lg p-3 border border-border"
              >
                <div className="font-medium text-foreground">{brand}</div>
                <div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={fee}
                    onChange={(e) => handleUpdateBrandFee(brand, parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-muted border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <button
                    onClick={() => handleRemoveBrand(brand)}
                    className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    title="Remove brand override"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No brand-specific fees configured. Add one above to override the default base fee for specific brands.
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <button
          onClick={fetchPricingConfig}
          disabled={saving}
          className="px-6 py-2.5 border border-border rounded-lg font-medium hover:bg-muted transition-colors disabled:opacity-50"
        >
          Reset
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </button>
      </div>

      {/* Last Updated */}
      {config && (
        <div className="text-xs text-muted-foreground text-center">
          Last updated: {new Date(config.updated_at).toLocaleString()}
        </div>
      )}
    </div>
  );
}
