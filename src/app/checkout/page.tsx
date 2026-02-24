
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { CheckoutFlow } from '@/components/CheckoutFlow';
import { Product } from '@/types/product';
import { useCart} from '@/contexts/CartContext';
import { createLogger } from '@/lib/utils/logger';
import {useCurrency} from "@/contexts/CurrencyContext";
import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';

const logger = createLogger('CHECKOUT_PAGE');

export default function CheckoutPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const { formatPrice, currency, exchangeRate } = useCurrency();

  const { getLockedPriceForProduct, isTimerExpired, timerRemaining, cart, customerId, isLoading: cartLoading, sessionId } = useCart();
  const [noReturnsAcknowledged, setNoReturnsAcknowledged] = useState(false);

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

  // Handle redirects after all hooks are called
  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.push('/sign-in?redirect_url=/checkout');
      return;
    }
    if (cart.length === 0 && !cartLoading) {
      router.push('/cart');
      return;
    }
  }, [user, isLoaded, router, cart.length, cartLoading]);

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

        {/* No Returns Notice + Acknowledgment */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-amber-600 dark:text-amber-400 mb-2">No Returns Policy</h3>
          <p className="text-sm text-amber-600 dark:text-amber-400 mb-3">
            Bullion purchases are final. No refunds or exchanges for change of mind.
            Returns are only accepted for defective, damaged, or incorrectly supplied items reported within 14 days.{' '}
            <a href="/returns-refunds" className="underline hover:no-underline font-medium">
              View our Returns & Refunds Policy
            </a>
          </p>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={noReturnsAcknowledged}
              onChange={(e) => setNoReturnsAcknowledged(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-amber-500/50 accent-amber-600"
            />
            <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
              I acknowledge that bullion purchases are final and cannot be returned for change of mind.
            </span>
          </label>
        </div>

        {/* Pickup Only Notice */}
        <div className="bg-muted/50 border border-border rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Pickup Only</strong> — All orders are collected in person from our Sydney CBD office by appointment.{' '}
              <a href="/pickup-information" className="text-primary hover:underline">View pickup details</a>
            </p>
          </div>
        </div>

        {/* Checkout Flow or Expired State */}
        {isTimerExpired ? (
          <div className="bg-card rounded-lg shadow-card p-8 text-center border border-amber-500/30">
            <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-foreground mb-2">Price Lock Expired</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Your locked prices have expired. Return to your cart to lock in current market prices.
            </p>
            <button
              onClick={() => router.push('/cart')}
              className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-colors"
            >
              Return to Cart
            </button>
          </div>
        ) : !noReturnsAcknowledged ? (
          <div className="bg-card rounded-lg shadow-card p-8 text-center border border-border">
            <h2 className="text-xl font-bold text-foreground mb-2">Acknowledgment Required</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Please acknowledge the no-returns policy above before proceeding to payment.
            </p>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}