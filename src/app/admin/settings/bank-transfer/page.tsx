'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { BankTransferSettings } from '@/types/bank-transfer';

export default function BankTransferSettingsPage() {
  const [settings, setSettings] = useState<BankTransferSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [enabled, setEnabled] = useState(false);
  const [depositPercentage, setDepositPercentage] = useState('10');
  const [paymentWindowHours, setPaymentWindowHours] = useState('24');
  const [reminderHoursBefore, setReminderHoursBefore] = useState('6');
  const [cancellationFeePercentage, setCancellationFeePercentage] = useState('0');
  const [bankName, setBankName] = useState('');
  const [bsb, setBsb] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [payidIdentifier, setPayidIdentifier] = useState('');
  const [payidType, setPayidType] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/bank-transfer/settings?t=${Date.now()}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch settings');

      const s = data.data as BankTransferSettings;
      setSettings(s);
      setEnabled(s.enabled);
      setDepositPercentage(s.deposit_percentage.toString());
      setPaymentWindowHours(s.payment_window_hours.toString());
      setReminderHoursBefore(s.reminder_hours_before.toString());
      setCancellationFeePercentage(s.cancellation_fee_percentage.toString());
      setBankName(s.bank_name || '');
      setBsb(s.bsb || '');
      setAccountNumber(s.account_number || '');
      setAccountName(s.account_name || '');
      setPayidIdentifier(s.payid_identifier || '');
      setPayidType(s.payid_type || '');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load settings';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validation
    const deposit = parseFloat(depositPercentage);
    if (isNaN(deposit) || deposit < 1 || deposit > 100) {
      toast.error('Deposit percentage must be between 1 and 100');
      return;
    }

    const windowHours = parseFloat(paymentWindowHours);
    if (isNaN(windowHours) || windowHours <= 0) {
      toast.error('Payment window hours must be greater than 0');
      return;
    }

    const reminderHours = parseFloat(reminderHoursBefore);
    if (isNaN(reminderHours) || reminderHours < 0) {
      toast.error('Reminder hours must be 0 or greater');
      return;
    }

    const cancellationFee = parseFloat(cancellationFeePercentage);
    if (isNaN(cancellationFee) || cancellationFee < 0 || cancellationFee > 100) {
      toast.error('Cancellation fee must be between 0 and 100');
      return;
    }

    if (bsb && !/^\d{3}-?\d{3}$/.test(bsb.replace('-', '').length === 6 ? bsb : '')) {
      // More lenient: just check it's 6 digits (with optional dash)
      const bsbDigits = bsb.replace(/\D/g, '');
      if (bsbDigits.length !== 6) {
        toast.error('BSB must be 6 digits (e.g. 123-456)');
        return;
      }
    }

    if (accountNumber) {
      const acctDigits = accountNumber.replace(/\D/g, '');
      if (acctDigits.length < 6 || acctDigits.length > 10) {
        toast.error('Account number must be 6-10 digits');
        return;
      }
    }

    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        enabled,
        deposit_percentage: deposit,
        payment_window_hours: windowHours,
        reminder_hours_before: reminderHours,
        cancellation_fee_percentage: cancellationFee,
        bank_name: bankName || null,
        bsb: bsb || null,
        account_number: accountNumber || null,
        account_name: accountName || null,
        payid_identifier: payidIdentifier || null,
        payid_type: payidType || null,
      };

      const res = await fetch('/api/admin/bank-transfer/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save settings');

      setSettings(data.data);
      toast.success('Settings saved');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save settings';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3"></div>
          <div className="text-muted-foreground text-sm">Loading settings...</div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="bg-destructive/10 border border-destructive/30 text-destructive-foreground px-6 py-4 rounded-lg">
        <p>Failed to load bank transfer settings. Please try again.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Bank Transfer Settings</h1>
        <p className="text-muted-foreground">
          Configure bank transfer payment options and bank details
        </p>
      </div>

      <div className="bg-card rounded-lg border border-border p-6 space-y-6 max-w-2xl">
        {/* Enabled toggle */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-card-foreground">
              Bank Transfers Enabled
            </label>
            <p className="text-xs text-muted-foreground">
              Allow customers to pay via bank transfer
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEnabled(!enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              enabled ? 'bg-green-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <hr className="border-border" />

        {/* Payment Configuration */}
        <div>
          <h2 className="text-lg font-semibold text-card-foreground mb-4">
            Payment Configuration
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">
                Deposit Percentage
              </label>
              <input
                type="number"
                value={depositPercentage}
                onChange={(e) => setDepositPercentage(e.target.value)}
                min="1"
                max="100"
                step="0.01"
                className="w-full p-2 border border-border bg-input text-foreground rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Card hold percentage (1-100%)
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">
                Payment Window (hours)
              </label>
              <input
                type="number"
                value={paymentWindowHours}
                onChange={(e) => setPaymentWindowHours(e.target.value)}
                min="1"
                step="1"
                className="w-full p-2 border border-border bg-input text-foreground rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Hours before deadline expires
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">
                Reminder Before Deadline (hours)
              </label>
              <input
                type="number"
                value={reminderHoursBefore}
                onChange={(e) => setReminderHoursBefore(e.target.value)}
                min="0"
                step="1"
                className="w-full p-2 border border-border bg-input text-foreground rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Send reminder email this many hours before deadline
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">
                Cancellation Fee (%)
              </label>
              <input
                type="number"
                value={cancellationFeePercentage}
                onChange={(e) => setCancellationFeePercentage(e.target.value)}
                min="0"
                max="100"
                step="0.01"
                className="w-full p-2 border border-border bg-input text-foreground rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Fee percentage for cancellations (0-100%)
              </p>
            </div>
          </div>
        </div>

        <hr className="border-border" />

        {/* Bank Details */}
        <div>
          <h2 className="text-lg font-semibold text-card-foreground mb-4">
            Bank Account Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">
                Bank Name
              </label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. Commonwealth Bank"
                className="w-full p-2 border border-border bg-input text-foreground rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">
                BSB
              </label>
              <input
                type="text"
                value={bsb}
                onChange={(e) => setBsb(e.target.value)}
                placeholder="XXX-XXX"
                maxLength={7}
                className="w-full p-2 border border-border bg-input text-foreground rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <p className="text-xs text-muted-foreground mt-1">6 digits, e.g. 062-000</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">
                Account Number
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="6-10 digits"
                maxLength={10}
                className="w-full p-2 border border-border bg-input text-foreground rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">
                Account Name
              </label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="e.g. Australian National Bullion"
                className="w-full p-2 border border-border bg-input text-foreground rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <hr className="border-border" />

        {/* PayID */}
        <div>
          <h2 className="text-lg font-semibold text-card-foreground mb-4">
            PayID (Optional)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">
                PayID Identifier
              </label>
              <input
                type="text"
                value={payidIdentifier}
                onChange={(e) => setPayidIdentifier(e.target.value)}
                placeholder="e.g. payments@example.com"
                className="w-full p-2 border border-border bg-input text-foreground rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">
                PayID Type
              </label>
              <select
                value={payidType}
                onChange={(e) => setPayidType(e.target.value)}
                className="w-full p-2 border border-border bg-input text-foreground rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Not set</option>
                <option value="Email">Email</option>
                <option value="Phone">Phone</option>
                <option value="ABN">ABN</option>
              </select>
            </div>
          </div>
        </div>

        <hr className="border-border" />

        {/* Save Button */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Last updated: {new Date(settings.updated_at).toLocaleString('en-AU')}
          </p>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
