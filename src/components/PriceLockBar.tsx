'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import { formatRemainingTime } from '@/lib/pricing/pricingTimer';
import { Lock, AlertTriangle, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function PriceLockBar() {
  const { timerRemaining, isTimerExpired, cart } = useCart();
  const [timeDisplay, setTimeDisplay] = useState(formatRemainingTime());
  const [showExpired, setShowExpired] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const pathname = usePathname();

  const arePricesLocked = !isTimerExpired && timerRemaining > 0;

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeDisplay(formatRemainingTime());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Show expired state when timer runs out
  useEffect(() => {
    if (isTimerExpired && cart.length > 0) {
      setShowExpired(true);
      setDismissed(false);
      const timeout = setTimeout(() => setShowExpired(false), 10000);
      return () => clearTimeout(timeout);
    } else {
      setShowExpired(false);
    }
  }, [isTimerExpired, cart.length]);

  // Reset dismissed when a new lock starts
  useEffect(() => {
    if (arePricesLocked) {
      setDismissed(false);
    }
  }, [arePricesLocked]);

  if ((!arePricesLocked && !showExpired) || cart.length === 0 || dismissed) {
    return null;
  }

  if (showExpired && !arePricesLocked) {
    return (
      <div className="bg-amber-500/10 border-b border-amber-500/20">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm min-w-0">
            <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
            <span className="text-amber-600 dark:text-amber-400 font-medium truncate">
              Price lock expired — prices are back to live rates
            </span>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link
              href="/cart"
              className="text-xs font-medium text-primary hover:text-primary/80 transition-colors whitespace-nowrap"
            >
              Re-lock in cart
            </Link>
            <button
              onClick={() => setDismissed(true)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isUrgent = timerRemaining <= 300000;
  const isWarning = timerRemaining <= 600000 && timerRemaining > 300000;

  return (
    <div className={`border-b ${
      isUrgent
        ? 'bg-red-500/10 border-red-500/20'
        : isWarning
          ? 'bg-amber-500/10 border-amber-500/20'
          : 'bg-primary/5 border-primary/10'
    }`}>
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm">
          <Lock className={`h-3.5 w-3.5 flex-shrink-0 ${
            isUrgent ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-primary'
          }`} />
          <span className={`font-medium ${
            isUrgent
              ? 'text-red-600 dark:text-red-400'
              : isWarning
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-foreground'
          }`}>
            Prices locked
          </span>
          <span className={`font-mono font-bold tabular-nums ${
            isUrgent
              ? 'text-red-600 dark:text-red-400'
              : isWarning
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-foreground'
          }`}>
            {timeDisplay}
          </span>
          {isUrgent && (
            <span className="text-red-600 dark:text-red-400 text-xs hidden sm:inline">
              — complete checkout soon
            </span>
          )}
        </div>
        {pathname !== '/checkout' && (
          <Link
            href="/checkout"
            className="text-xs font-medium text-primary hover:text-primary/80 transition-colors whitespace-nowrap"
          >
            Complete checkout →
          </Link>
        )}
      </div>
    </div>
  );
}
