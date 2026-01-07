'use client';

import { useState } from 'react';
import { createLogger } from '@/lib/utils/logger';
import { UBOForm as UBOFormType, Address, OwnershipType } from '@/types/business';

const logger = createLogger('UBO_FORM');

interface UBOFormProps {
  businessId: string;
  currentTotalOwnership: number;
  onAdded: () => void;
  onCancel: () => void;
}

export function UBOForm({ businessId, currentTotalOwnership, onAdded, onCancel }: UBOFormProps) {
  const [formData, setFormData] = useState<Partial<UBOFormType>>({
    ownership_type: 'direct',
    is_pep: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxOwnership = 100 - currentTotalOwnership;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.first_name || !formData.last_name || !formData.date_of_birth) {
      setError('Please complete all required fields');
      return;
    }

    if (!formData.ownership_percentage || formData.ownership_percentage < 25) {
      setError('Ownership percentage must be at least 25%');
      return;
    }

    if (formData.ownership_percentage > maxOwnership) {
      setError(`Ownership percentage cannot exceed ${maxOwnership}%`);
      return;
    }

    if (!formData.residential_address?.street || !formData.residential_address?.city) {
      setError('Please provide a complete residential address');
      return;
    }

    if (formData.is_pep && !formData.pep_relationship) {
      setError('Please specify the PEP relationship');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/business/${businessId}/owners`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add beneficial owner');
      }

      logger.log('UBO added successfully');
      onAdded();

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add owner';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const updateAddress = (field: keyof Address, value: string) => {
    setFormData(prev => ({
      ...prev,
      residential_address: {
        ...prev.residential_address,
        [field]: value,
        country: prev.residential_address?.country || 'Australia',
      } as Address,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card p-6 rounded-lg shadow-md border border-border">
      <h3 className="text-xl font-bold text-card-foreground mb-4">
        Add Beneficial Owner
      </h3>

      <p className="text-sm text-muted-foreground mb-4">
        Add details for any individual with 25% or more ownership in the business.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded text-destructive-foreground text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Personal Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block font-medium mb-2 text-foreground">
              First Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={formData.first_name || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
              className="w-full border border-border bg-input text-foreground rounded-lg p-3"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block font-medium mb-2 text-foreground">
              Middle Name
            </label>
            <input
              type="text"
              value={formData.middle_name || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, middle_name: e.target.value }))}
              className="w-full border border-border bg-input text-foreground rounded-lg p-3"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block font-medium mb-2 text-foreground">
              Last Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={formData.last_name || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
              className="w-full border border-border bg-input text-foreground rounded-lg p-3"
              disabled={loading}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-2 text-foreground">
              Date of Birth <span className="text-destructive">*</span>
            </label>
            <input
              type="date"
              value={formData.date_of_birth || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
              className="w-full border border-border bg-input text-foreground rounded-lg p-3"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block font-medium mb-2 text-foreground">
              Email
            </label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full border border-border bg-input text-foreground rounded-lg p-3"
              disabled={loading}
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block font-medium mb-2 text-foreground">
            Residential Address <span className="text-destructive">*</span>
          </label>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Street Address"
              value={formData.residential_address?.street || ''}
              onChange={(e) => updateAddress('street', e.target.value)}
              className="w-full border border-border bg-input text-foreground rounded-lg p-3"
              disabled={loading}
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <input
                type="text"
                placeholder="City"
                value={formData.residential_address?.city || ''}
                onChange={(e) => updateAddress('city', e.target.value)}
                className="w-full border border-border bg-input text-foreground rounded-lg p-3"
                disabled={loading}
              />
              <input
                type="text"
                placeholder="State"
                value={formData.residential_address?.state || ''}
                onChange={(e) => updateAddress('state', e.target.value)}
                className="w-full border border-border bg-input text-foreground rounded-lg p-3"
                disabled={loading}
              />
              <input
                type="text"
                placeholder="Postcode"
                value={formData.residential_address?.postcode || ''}
                onChange={(e) => updateAddress('postcode', e.target.value)}
                className="w-full border border-border bg-input text-foreground rounded-lg p-3"
                disabled={loading}
              />
              <input
                type="text"
                placeholder="Country"
                value={formData.residential_address?.country || 'Australia'}
                onChange={(e) => updateAddress('country', e.target.value)}
                className="w-full border border-border bg-input text-foreground rounded-lg p-3"
                disabled={loading}
              />
            </div>
          </div>
        </div>

        {/* Ownership Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block font-medium mb-2 text-foreground">
              Ownership % <span className="text-destructive">*</span>
            </label>
            <input
              type="number"
              min="25"
              max={maxOwnership}
              step="0.01"
              value={formData.ownership_percentage || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, ownership_percentage: parseFloat(e.target.value) }))}
              className="w-full border border-border bg-input text-foreground rounded-lg p-3"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Max: {maxOwnership}% remaining
            </p>
          </div>
          <div>
            <label className="block font-medium mb-2 text-foreground">
              Ownership Type <span className="text-destructive">*</span>
            </label>
            <select
              value={formData.ownership_type}
              onChange={(e) => setFormData(prev => ({ ...prev, ownership_type: e.target.value as OwnershipType }))}
              className="w-full border border-border bg-input text-foreground rounded-lg p-3"
              disabled={loading}
            >
              <option value="direct">Direct Ownership</option>
              <option value="indirect">Indirect Ownership</option>
              <option value="control_person">Control Person</option>
            </select>
          </div>
          <div>
            <label className="block font-medium mb-2 text-foreground">
              Role
            </label>
            <input
              type="text"
              placeholder="e.g., Director, Shareholder"
              value={formData.role || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
              className="w-full border border-border bg-input text-foreground rounded-lg p-3"
              disabled={loading}
            />
          </div>
        </div>

        {/* PEP Declaration */}
        <div className="border-t border-border pt-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_pep || false}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  is_pep: e.target.checked,
                  pep_relationship: e.target.checked ? prev.pep_relationship : undefined,
                }))}
                className="mt-1 h-5 w-5 rounded border-border text-primary"
                disabled={loading}
              />
              <span className="text-sm text-foreground">
                This person is a Politically Exposed Person (PEP) or related to a PEP
              </span>
            </label>

            {formData.is_pep && (
              <div className="mt-3">
                <select
                  value={formData.pep_relationship || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, pep_relationship: e.target.value }))}
                  className="w-full border border-border bg-input text-foreground rounded-lg p-3"
                  disabled={loading}
                >
                  <option value="">Select relationship...</option>
                  <option value="self">Is a PEP</option>
                  <option value="spouse">Spouse of a PEP</option>
                  <option value="family_member">Family member of a PEP</option>
                  <option value="close_associate">Close associate of a PEP</option>
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 border border-border text-foreground py-3 rounded-lg hover:bg-muted transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-primary text-primary-foreground py-3 rounded-lg hover:opacity-90 disabled:opacity-50 font-semibold transition-opacity"
          >
            {loading ? 'Adding...' : 'Add Beneficial Owner'}
          </button>
        </div>
      </div>
    </form>
  );
}