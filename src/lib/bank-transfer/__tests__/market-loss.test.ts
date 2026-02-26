import { describe, it, expect } from 'vitest';
import { calculateMarketLoss } from '../market-loss';

describe('calculateMarketLoss', () => {
  it('returns zero capture when current price equals locked price', () => {
    const result = calculateMarketLoss({
      lockedTotalAud: 5000,
      currentTotalAud: 5000,
      depositAmountAud: 500,
      cancellationFeePercentage: 0,
    });

    expect(result.marketLoss).toBe(0);
    expect(result.cancellationFee).toBe(0);
    expect(result.captureAmount).toBe(0);
    expect(result.shouldCapture).toBe(false);
  });

  it('returns zero capture when current price is higher than locked', () => {
    const result = calculateMarketLoss({
      lockedTotalAud: 5000,
      currentTotalAud: 5500,
      depositAmountAud: 500,
      cancellationFeePercentage: 0,
    });

    expect(result.marketLoss).toBe(0);
    expect(result.captureAmount).toBe(0);
    expect(result.shouldCapture).toBe(false);
  });

  it('captures market loss when price drops', () => {
    const result = calculateMarketLoss({
      lockedTotalAud: 5000,
      currentTotalAud: 4800,
      depositAmountAud: 500,
      cancellationFeePercentage: 0,
    });

    expect(result.marketLoss).toBe(200);
    expect(result.captureAmount).toBe(200);
    expect(result.shouldCapture).toBe(true);
  });

  it('caps capture amount at deposit amount', () => {
    const result = calculateMarketLoss({
      lockedTotalAud: 5000,
      currentTotalAud: 4000,
      depositAmountAud: 500,
      cancellationFeePercentage: 0,
    });

    expect(result.marketLoss).toBe(1000);
    expect(result.captureAmount).toBe(500); // capped at deposit
    expect(result.shouldCapture).toBe(true);
  });

  it('includes cancellation fee in capture', () => {
    const result = calculateMarketLoss({
      lockedTotalAud: 10000,
      currentTotalAud: 10000,
      depositAmountAud: 1000,
      cancellationFeePercentage: 2,
    });

    expect(result.marketLoss).toBe(0);
    expect(result.cancellationFee).toBe(200); // 2% of 10000
    expect(result.captureAmount).toBe(200);
    expect(result.shouldCapture).toBe(true);
  });

  it('combines market loss and cancellation fee', () => {
    const result = calculateMarketLoss({
      lockedTotalAud: 10000,
      currentTotalAud: 9500,
      depositAmountAud: 1000,
      cancellationFeePercentage: 2,
    });

    expect(result.marketLoss).toBe(500);
    expect(result.cancellationFee).toBe(200);
    expect(result.captureAmount).toBe(700); // 500 + 200
    expect(result.shouldCapture).toBe(true);
  });

  it('caps combined total at deposit amount', () => {
    const result = calculateMarketLoss({
      lockedTotalAud: 10000,
      currentTotalAud: 8000,
      depositAmountAud: 1000,
      cancellationFeePercentage: 5,
    });

    expect(result.marketLoss).toBe(2000);
    expect(result.cancellationFee).toBe(500);
    // raw = 2500, but capped at 1000 (deposit)
    expect(result.captureAmount).toBe(1000);
    expect(result.shouldCapture).toBe(true);
  });

  it('rounds to 2 decimal places', () => {
    const result = calculateMarketLoss({
      lockedTotalAud: 3333.33,
      currentTotalAud: 3200,
      depositAmountAud: 333.33,
      cancellationFeePercentage: 1.5,
    });

    // marketLoss = 133.33, fee = 49.999... -> 50.00
    expect(result.marketLoss).toBe(133.33);
    expect(result.cancellationFee).toBe(50);
    expect(result.captureAmount).toBe(183.33);
    expect(result.shouldCapture).toBe(true);
  });

  it('handles zero deposit amount', () => {
    const result = calculateMarketLoss({
      lockedTotalAud: 5000,
      currentTotalAud: 4000,
      depositAmountAud: 0,
      cancellationFeePercentage: 0,
    });

    expect(result.captureAmount).toBe(0);
    expect(result.shouldCapture).toBe(false);
  });
});
