/**
 * Pricing Timer Utility
 * Manages a 15-minute timer from the first product addition to lock dynamic pricing
 */

const TIMER_KEY = 'pricing_timer_start';
const LOCKED_PRICES_KEY = 'locked_prices';
const TIMER_DURATION_MS = 15 * 60 * 1000; // 15 minutes in milliseconds

export interface LockedPrice {
  productId: string;
  price: number;
  spotPricePerGram?: number;
}

/**
 * Starts the pricing timer (only if not already started)
 * Should be called when the first product is added to cart
 */
export function startPricingTimer(): void {
  if (typeof window === 'undefined') return;
  
  const existingTimer = localStorage.getItem(TIMER_KEY);
  if (!existingTimer) {
    const startTime = Date.now();
    localStorage.setItem(TIMER_KEY, startTime.toString());
    console.log('[PRICING_TIMER] Timer started at:', new Date(startTime).toISOString());
  }
}

/**
 * Gets the timer start time
 * Returns null if timer hasn't been started
 */
export function getTimerStartTime(): number | null {
  if (typeof window === 'undefined') return null;
  
  const timerStr = localStorage.getItem(TIMER_KEY);
  return timerStr ? parseInt(timerStr, 10) : null;
}

/**
 * Checks if the timer is still active (within 15 minutes)
 */
export function isTimerActive(): boolean {
  const startTime = getTimerStartTime();
  if (!startTime) return false;
  
  const elapsed = Date.now() - startTime;
  const isActive = elapsed < TIMER_DURATION_MS;
  
  if (!isActive) {
    console.log('[PRICING_TIMER] Timer expired');
  }
  
  return isActive;
}

/**
 * Gets remaining time in milliseconds
 * Returns 0 if timer is not active or has expired
 */
export function getRemainingTime(): number {
  const startTime = getTimerStartTime();
  if (!startTime) return 0;
  
  const elapsed = Date.now() - startTime;
  const remaining = Math.max(0, TIMER_DURATION_MS - elapsed);
  
  return remaining;
}

/**
 * Formats remaining time as MM:SS
 */
export function formatRemainingTime(): string {
  const remaining = getRemainingTime();
  if (remaining === 0) return '00:00';
  
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Locks prices for products
 * Stores the prices in localStorage to use during the timer period
 */
export function lockPrices(prices: LockedPrice[]): void {
  if (typeof window === 'undefined') return;
  
  const existingLocked = getLockedPrices();
  const pricesMap = new Map(existingLocked.map(p => [p.productId, p]));
  
  // Add or update prices
  prices.forEach(price => {
    pricesMap.set(price.productId, price);
  });
  
  const allPrices = Array.from(pricesMap.values());
  localStorage.setItem(LOCKED_PRICES_KEY, JSON.stringify(allPrices));
  console.log('[PRICING_TIMER] Prices locked for', allPrices.length, 'products');
}

/**
 * Gets all locked prices
 */
export function getLockedPrices(): LockedPrice[] {
  if (typeof window === 'undefined') return [];
  
  const pricesStr = localStorage.getItem(LOCKED_PRICES_KEY);
  if (!pricesStr) return [];
  
  try {
    return JSON.parse(pricesStr);
  } catch (error) {
    console.error('[PRICING_TIMER] Error parsing locked prices:', error);
    return [];
  }
}

/**
 * Gets locked price for a specific product
 * Returns null if no locked price exists
 */
export function getLockedPrice(productId: string): LockedPrice | null {
  const lockedPrices = getLockedPrices();
  return lockedPrices.find(p => p.productId === productId) || null;
}

/**
 * Clears the timer and all locked prices
 * Should be called when cart is cleared or checkout is completed
 */
export function clearPricingTimer(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(TIMER_KEY);
  localStorage.removeItem(LOCKED_PRICES_KEY);
  console.log('[PRICING_TIMER] Timer and locked prices cleared');
}

/**
 * Resets the timer (clears and doesn't restart)
 * Use this when starting a new shopping session
 */
export function resetPricingTimer(): void {
  clearPricingTimer();
}
