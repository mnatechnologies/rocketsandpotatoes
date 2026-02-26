import { describe, it, expect } from 'vitest';
import { validateSettings } from '../settings';
import type { BankTransferSettings } from '@/types/bank-transfer';

function makeSettings(overrides: Partial<BankTransferSettings> = {}): BankTransferSettings {
  return {
    id: 1,
    deposit_percentage: 10,
    payment_window_hours: 24,
    reminder_hours_before: 6,
    bank_name: 'Commonwealth Bank of Australia',
    bsb: '062000',
    account_number: '12345678',
    account_name: 'Australian National Bullion Pty Ltd',
    payid_identifier: null,
    payid_type: null,
    cancellation_fee_percentage: 0,
    enabled: true,
    updated_at: new Date().toISOString(),
    updated_by: null,
    ...overrides,
  };
}

describe('validateSettings', () => {
  it('returns null for valid, enabled settings', () => {
    const result = validateSettings(makeSettings());
    expect(result).toBeNull();
  });

  it('rejects disabled settings', () => {
    const result = validateSettings(makeSettings({ enabled: false }));
    expect(result).toBe('Bank transfer payments are currently disabled');
  });

  it('rejects missing BSB', () => {
    const result = validateSettings(makeSettings({ bsb: null }));
    expect(result).toBe('Bank account details not configured');
  });

  it('rejects missing account number', () => {
    const result = validateSettings(makeSettings({ account_number: null }));
    expect(result).toBe('Bank account details not configured');
  });

  it('rejects missing account name', () => {
    const result = validateSettings(makeSettings({ account_name: null }));
    expect(result).toBe('Bank account details not configured');
  });

  it('rejects empty string BSB', () => {
    const result = validateSettings(makeSettings({ bsb: '' }));
    expect(result).toBe('Bank account details not configured');
  });

  it('rejects zero deposit percentage', () => {
    const result = validateSettings(makeSettings({ deposit_percentage: 0 }));
    expect(result).toBe('Invalid deposit percentage');
  });

  it('rejects negative deposit percentage', () => {
    const result = validateSettings(makeSettings({ deposit_percentage: -5 }));
    expect(result).toBe('Invalid deposit percentage');
  });

  it('rejects deposit percentage over 100', () => {
    const result = validateSettings(makeSettings({ deposit_percentage: 101 }));
    expect(result).toBe('Invalid deposit percentage');
  });

  it('accepts 100% deposit percentage', () => {
    const result = validateSettings(makeSettings({ deposit_percentage: 100 }));
    expect(result).toBeNull();
  });

  it('accepts 1% deposit percentage', () => {
    const result = validateSettings(makeSettings({ deposit_percentage: 1 }));
    expect(result).toBeNull();
  });
});
