
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { CheckoutFlow } from '@/components/CheckoutFlow';
import { Product } from '@/types/product';
import { useCart} from '@/contexts/CartContext';
import {formatRemainingTime} from "@/lib/pricing/pricingTimer";
import { createLogger } from '@/lib/utils/logger';
import {useCurrency} from "@/contexts/CurrencyContext";

const logger = createLogger('CHECKOUT_PAGE');

export default function CheckoutPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const { formatPrice, currency, convertPrice } = useCurrency();

  const { getLockedPriceForProduct, isTimerExpired, timerRemaining, cart, customerId, isLoading: cartLoading, sessionId } = useCart();

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.push('/sign-in?redirect_url=/checkout');
      return;
    }
    if (isTimerExpired) {
      alert('Your price lock has expired. Please refresh prices in your cart.');
      router.push('/cart');
      return;
    }
    if (cart.length === 0 && !cartLoading) {
      router.push('/cart');
      return;
    }
  }, [user, isLoaded, router, isTimerExpired, cart.length, cartLoading]);

  const getTotalAmount = () => {
    const total = cart.reduce((sum, item) => {
      // Use locked price if available, fallback to stored price
      const lockedPrice = getLockedPriceForProduct(item.product.id);
      const price = lockedPrice ?? item.product.price;
      return sum + (price * item.quantity);
    }, 0);
    logger.log('Total amount calculated with locked prices:', total);
    return total;
  };

  // Get converted total for display and payment
  const getConvertedTotal = () => {
    return convertPrice(getTotalAmount());
  };

  // Get AUD equivalent for compliance threshold display
  const getAmountInAUDForThresholds = () => {
    if (currency === 'AUD') {
      return getTotalAmount();
    }
    // If in USD, convert to AUD for compliance display (approx rate)
    return getTotalAmount() * 1.57;
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

  if ( !isLoaded || cartLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl mb-4">Loading checkout...</div>
          <div className="text-gray-600">Please wait</div>
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
            className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg"
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
            className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg"
          >
            Return to Cart
          </button>
        </div>
      </div>
    );
  }

  const amountInAUD = getAmountInAUDForThresholds();

  return (
    <div className="min-h-screen bg-background/50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-primary my-8">Checkout</h1>
        {timerRemaining > 0 && timerRemaining < 300000 && ( // Show if less than 5 minutes
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
            <p className="text-yellow-800 font-semibold">
              ⏰ Price lock expires in: <span className="text-xl font-bold">{formatRemainingTime()}</span>
            </p>
            <p className="text-yellow-700 text-sm mt-1">
              Complete checkout before timer expires to secure these prices
            </p>
          </div>
        )}
        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Summary</h2>
          <div className="space-y-3">
            {cart.map((item) => {
              const lockedPrice = getLockedPriceForProduct(item.product.id);
              const displayPrice = lockedPrice ?? item.product.price;
              return (
                <div key={item.product.id} className="flex justify-between text-gray-700">
                  <span>
                    {item.product.name} x {item.quantity}
                  </span>
                  <span className="font-semibold">
                    {formatPrice(displayPrice * item.quantity)} {currency}
                  </span>
                </div>
              );
            })}
            <div className="border-t pt-3 flex justify-between text-xl font-bold text-gray-900">
              <span>Total</span>
              <span>
                {formatPrice(getTotalAmount())} {currency}
              </span>
            </div>
          </div>
        </div>

        {/* Compliance Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">Compliance Information</h3>
          <p className="text-sm text-blue-800">
            All precious metal transactions are subject to Australian compliance requirements.
            Your order will be verified for anti-money laundering (AML) compliance.
            {amountInAUD >= 5000 && (
              <span className="block mt-2 font-semibold">
                ⚠️ Transactions over $5,000 AUD require identity verification (KYC).
              </span>
            )}
          </p>
        </div>

        {/* Checkout Flow Component */}
        <div className="bg-white rounded-lg shadow-md p-6 text-black ">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment & Verification</h2>
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