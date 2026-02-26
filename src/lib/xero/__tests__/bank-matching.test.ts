import { describe, it, expect } from 'vitest';
import { extractReferenceCode, isAmountMatch } from '../bank-matching';

describe('extractReferenceCode', () => {
  it('extracts from a simple reference string', () => {
    expect(extractReferenceCode('ANB-X7K2M9')).toBe('ANB-X7K2M9');
  });

  it('extracts from a bank description containing other text', () => {
    expect(extractReferenceCode('Transfer from J Smith ANB-X7K2M9 bullion')).toBe(
      'ANB-X7K2M9'
    );
  });

  it('returns null when no reference code is present', () => {
    expect(extractReferenceCode('Random bank transfer')).toBeNull();
  });

  it('returns the first match when multiple reference codes are present', () => {
    expect(extractReferenceCode('ANB-AAAAAA and ANB-BBBBBB')).toBe('ANB-AAAAAA');
  });

  it('handles lowercase input and returns uppercase', () => {
    expect(extractReferenceCode('anb-x7k2m9')).toBe('ANB-X7K2M9');
  });
});

describe('isAmountMatch', () => {
  it('returns true for exact matching amounts', () => {
    expect(isAmountMatch(263.5, 263.5)).toBe(true);
  });

  it('returns false for different amounts', () => {
    expect(isAmountMatch(263.5, 264.0)).toBe(false);
  });

  it('handles floating point precision by rounding to 2 decimal places', () => {
    expect(isAmountMatch(263.499999999, 263.5)).toBe(true);
  });

  it('returns false when either amount is zero', () => {
    expect(isAmountMatch(0, 263.5)).toBe(false);
  });
});
