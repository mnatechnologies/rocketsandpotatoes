
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { CheckoutFlow } from '@/components/CheckoutFlow';
import { Product } from '@/types/product';
import { useCart} from '@/contexts/CartContext';
import {formatRemainingTime} from "@/lib/pricing/pricingTimer";
import { createLogger } from '@/lib/utils/logger';
import {useCurrency} from "@/contexts/CurrencyContext";
import { toast } from 'sonner';
import { CheckCircle, Clock, AlertTriangle, Lock } from 'lucide-react';

const logger = createLogger('CHECKOUT_PAGE');

export default function CheckoutPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const { formatPrice, currency, exchangeRate } = useCurrency();

  const { getLockedPriceForProduct, isTimerExpired, timerRemaining, cart, customerId, isLoading: cartLoading, sessionId } = useCart();
  const [timeDisplay, setTimeDisplay] = useState(formatRemainingTime());

  // Update timer display every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeDisplay(formatRemainingTime());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getTotalAmount = () => {
    const total = cart.reduce((sum, item) => {
      // ✅ Use locked price in selected currency (USD or AUD)
      const lockedPrice = getLockedPriceForProduct(item.product.id);
      const price = lockedPrice ?? item.product.price; // Fallback to database price (USD)
      return sum + (price * item.quantity);
    }, 0);
    logger.log('Total amount calculated with locked prices:', total, currency);
    return total;
  };

  // ✅ Locked prices are already in the user's selected currency - no conversion needed!
  const getConvertedTotal = () => {
    return getTotalAmount(); // ✅ Already in selected currency (locked prices include both USD and AUD)
  };

  // Get AUD equivalent for compliance threshold display
  const getAmountInAUDForThresholds = () => {
    if (currency === 'AUD') {
      return getTotalAmount();
    }
    // If in USD, convert back to AUD by multiplying by the USD→AUD rate
    return getTotalAmount() * exchangeRate;
  };

  const getMainProduct = (): Product | null => {
    if (cart.length === 0) return null;

    const sorted = [...cart].sort((a, b) => {
      const priceA = getLockedPriceForProduct(a.product.id) ?? a.product.price;
      const priceB = getLockedPriceForProduct(b.product.id) ?? b.product.price;
      return (priceB * b.quantity) - (priceA * a.quantity);
    });

    logger.log('Main product for compliance:', sorted[0]?.product.name);
    return sorted[0]?.product || null;
  };

  // Memoize timer styling to prevent re-calculations (must be before early returns)
  const timerStyle = useMemo(() => {
    if (timerRemaining > 600000) { // > 10 minutes
      return {
        bg: 'bg-green-500/10',
        border: 'border-green-500/20',
        text: 'text-green-600 dark:text-green-400',
        textBold: 'text-green-600 dark:text-green-400',
        icon: <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
      };
    } else if (timerRemaining > 300000) { // 5-10 minutes
      return {
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/20',
        text: 'text-yellow-600 dark:text-yellow-400',
        textBold: 'text-yellow-600 dark:text-yellow-400',
        icon: <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
      };
    } else { // < 5 minutes
      return {
        bg: 'bg-red-500/10',
        border: 'border-red-500/20',
        text: 'text-red-600 dark:text-red-400',
        textBold: 'text-red-600 dark:text-red-400',
        icon: <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
      };
    }
  }, [timerRemaining]);

  // Handle redirects after all hooks are called
  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.push('/sign-in?redirect_url=/checkout');
      return;
    }
    if (isTimerExpired) {
      toast.warning('15-Minute Price Lock Expired', {
        description: 'Returning to cart. Prices will show current market rates. You can checkout again to lock new prices.',
        duration: 5000,
      });
      router.push('/cart?from=checkout');
      return;
    }
    if (cart.length === 0 && !cartLoading) {
      router.push('/cart');
      return;
    }
  }, [user, isLoaded, router, isTimerExpired, cart.length, cartLoading]);

  if ( !isLoaded || cartLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl mb-4">Loading checkout...</div>
          <div className="text-muted-foreground">Please wait</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
          <button
            onClick={() => router.push('/products')}
            className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  if (!customerId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl mb-4">Setting up your account...</div>
          <div className="text-gray-600">This should only take a moment</div>
        </div>
      </div>
    );
  }

  const mainProduct = getMainProduct();

  if (!mainProduct) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error loading products</h1>
          <button
            onClick={() => router.push('/cart')}
            className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg"
          >
            Return to Cart
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background/50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-primary my-8">Checkout</h1>

        {/* Always-visible persistent timer */}
        <div className={`mb-4 p-4 ${timerStyle.bg} border ${timerStyle.border} rounded-lg sticky top-20 z-10 shadow-card`}>
          <div className="flex items-center justify-center gap-3">
            {timerStyle.icon}
            <div className="text-center flex-1">
              <p className={`${timerStyle.textBold} font-semibold flex items-center justify-center gap-1.5`}>
                <Lock className="h-4 w-4 inline-block" /> Prices Locked - Expires In: <span className="text-2xl font-mono font-bold">{timeDisplay}</span>
              </p>
              <p className={`${timerStyle.text} text-sm mt-1`}>
                {timerRemaining > 600000
                  ? 'Your prices are locked at checkout rates. Complete your purchase before the timer expires.'
                  : timerRemaining > 300000
                  ? 'Complete checkout soon to secure these locked prices.'
                  : 'Time running out! Complete checkout now or prices will reset to current market rates.'}
              </p>
            </div>
          </div>
        </div>
        {/* Order Summary */}
        <div className="bg-card rounded-lg shadow-card p-6 mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-4">Order Summary</h2>
          <div className="space-y-3">
            {cart.map((item) => {
              const lockedPrice = getLockedPriceForProduct(item.product.id);
              const displayPrice = lockedPrice ?? item.product.price;
              const itemTotal = displayPrice * item.quantity;
              return (
                <div key={item.product.id} className="flex justify-between text-foreground/80">
                  <span>
                    {item.product.name} x {item.quantity}
                  </span>
                  <span className="font-semibold">
                    ${itemTotal.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
                  </span>
                </div>
              );
            })}
            <div className="border-t border-border pt-3 flex justify-between text-xl font-bold text-foreground">
              <span>Total</span>
              <span>
                ${getTotalAmount().toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
              </span>
            </div>
          </div>
        </div>

        {/* Compliance Notice */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">Compliance Information</h3>
          <p className="text-sm text-blue-600 dark:text-blue-400">
            All precious metal transactions are subject to Australian compliance requirements.
            Your order will be verified for anti-money laundering (AML) compliance.
            {getAmountInAUDForThresholds() >= 5000 && (
              <span className="block mt-2 font-semibold">
                ⚠️ Transactions over $5,000 AUD require identity verification (KYC).
              </span>
            )}
          </p>
        </div>

        {/* Checkout Flow Component */}
        <div className="bg-card rounded-lg shadow-card p-6">
          <h2 className="text-2xl font-bold text-foreground mb-6">Payment & Verification</h2>
          <CheckoutFlow
            customerId={customerId}
            amount={getConvertedTotal()}
            productDetails={mainProduct}
            cartItems={cart}
            customerEmail={user?.primaryEmailAddress?.emailAddress}
            sessionId={sessionId}
            onSuccess={(orderId) => {
              logger.log('Payment successful, redirecting to confirmation');
              router.push(`/order-confirmation?orderId=${orderId}`);
            }}
          />
        </div>
      </div>
    </div>
  );
}