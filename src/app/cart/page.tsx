'use client';

import { useEffect, useRef, Suspense, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Product } from '@/types/product';
import Image from 'next/image';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { useCart } from '@/contexts/CartContext';
import { lockPrices, startPricingTimer, clearPricingTimer } from '@/lib/pricing/pricingTimer';
import { useMetalPrices } from '@/contexts/MetalPricesContext';
import { calculateBulkPricingFromCache } from '@/lib/pricing/priceCalculations';
import { MetalSymbol } from '@/lib/metals-api/metalsApi';
import { createLogger} from "@/lib/utils/logger";
import { useCurrency } from '@/contexts/CurrencyContext';

const logger = createLogger('CART_PAGE')

function CartContent() {
  const {
    cart,
    addToCartById,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount,
    getLockedPriceForProduct,
    isLoading,
    timerRemaining,
    timerFormatted,
    isTimerExpired,
    lockPricesOnServer,
  } = useCart();

  // Use shared metal prices from context
  const { prices: metalPrices, isLoading: loadingPrices } = useMetalPrices();

  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const hasAddedProduct = useRef(false);
  const hasFetchedPrices = useRef(false);
  const { formatPrice, currency } = useCurrency();


  const calculateAndLockPrices = useCallback(async () => {
  if (cart.length === 0 || !metalPrices || metalPrices.length === 0) return;

  try {
    const metalPriceMap = new Map<MetalSymbol, number>(
      metalPrices.map(price => [price.symbol, price.price])
    );

    const products = cart.map(item => item.product);
    const priceMap = calculateBulkPricingFromCache(products, metalPriceMap);

    const pricesToLock = Array.from(priceMap.entries()).map(([productId, priceInfo]) => ({
      productId,
      price: priceInfo.calculatedPrice,
      spotPricePerGram: priceInfo.spotPricePerGram
    }));

    // Lock locally
    lockPrices(pricesToLock);
    
    // Lock on server (ADD THIS)
    await lockPricesOnServer(products);
    
  } catch (error) {
    logger.error('[CART] Error calculating prices:', error);
  }
}, [cart, metalPrices, lockPricesOnServer]);

  // ✅ Re-lock prices whenever cart changes (no guard)
  useEffect(() => {
    if (loadingPrices || !metalPrices || metalPrices.length === 0 || cart.length === 0) {
      return;
    }

    if (!isLoading) {
      logger.log('🔒 Cart changed, re-locking prices for', cart.length, 'items');
      calculateAndLockPrices();
    }
  }, [isLoading, cart.length, metalPrices, loadingPrices, calculateAndLockPrices]);

  // Handle adding product from URL parameter
  useEffect(() => {
    const productId = searchParams.get('add');
    if (productId && !hasAddedProduct.current) {
      hasAddedProduct.current = true;
      addToCartById(productId).then((success) => {
        if (!success) {
          alert('Failed to add product to cart');
        }
        router.replace('/cart');
      });
      // Trigger price calculation after cart updates
      setTimeout(() => calculateAndLockPrices(), 100);
    }
  }, [searchParams, addToCartById, router, calculateAndLockPrices]);




  const handleCheckout = () => {
    if (!isLoaded) {
      return;
    }

    if (!user) {
      router.push('/sign-in?redirect_url=/cart');
      return;
    }

    if (isTimerExpired) {
      alert('⏰ Price lock has expired. Please refresh prices before checkout.');
      // Force price recalculation
      hasFetchedPrices.current = false;
      calculateAndLockPrices();
      return;
    }

    router.push('/checkout');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading cart...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background/50 py-12 mt-10">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-primary my-8">Shopping Cart</h1>

        {timerRemaining > 0 && !isTimerExpired && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
            <p className="text-green-800 font-semibold">
              🔒 Prices locked for: <span className="text-xl font-bold">{timerFormatted}</span>
            </p>
            <p className="text-green-700 text-sm mt-1">
              Your prices are guaranteed for the next {timerFormatted}
            </p>
          </div>
        )}

        {isTimerExpired && cart.length > 0 && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-center">
            <p className="text-red-800 font-semibold mb-2">
              ⏰ Price lock expired - prices need to be refreshed
            </p>
            <button
              onClick={() => {
                logger.log('[CART] Refreshing prices and restarting timer');
                clearPricingTimer();
                hasFetchedPrices.current = false;
                startPricingTimer();
                calculateAndLockPrices();
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
            >
              Refresh Prices & Restart Timer
            </button>
          </div>
        )}

        {loadingPrices && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
            <p className="text-blue-800">Updating prices with live market data...</p>
          </div>
        )}

        {cart.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-xl text-gray-600 mb-6">Your cart is empty</p>
            <Link
              href="/products"
              className="inline-block px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-colors"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => {
                const lockedPrice = getLockedPriceForProduct(item.product.id);
                const displayPrice = lockedPrice ?? item.product.price;
                const isPriceLocked = lockedPrice !== null;

                return (
                  <div
                    key={item.product.id}
                    className="bg-white rounded-lg shadow-md p-6 flex flex-col md:flex-row gap-4"
                  >
                    <div className="relative w-full md:w-32 h-32 bg-gray-100 rounded flex-shrink-0">
                      <Image
                        src={item.product.image_url || '/images/placeholder-product.jpg'}
                        alt={item.product.name}
                        fill
                        className="object-cover rounded"
                        sizes="128px"
                      />
                    </div>

                    <div className="flex-grow">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {item.product.name}
                      </h3>
                      <div className="flex gap-4 text-sm text-gray-600 mb-2">
                        <span>Weight: {item.product.weight}</span>
                        <span>Purity: {item.product.purity}</span>
                      </div>
                      <div className="text-xl font-bold text-gray-900">
                        {formatPrice(displayPrice)}
                        {isPriceLocked && (
                          <div className="text-xs text-green-600 font-medium mt-1">
                            🔒 Price Locked
                          </div>
                        )}
                        {!isPriceLocked && (
                          <div className="text-xs text-blue-600 font-medium mt-1">
                            ⟳ Live Market Price
                          </div>
                        )}
                      </div>
                    </div>

                    <div
                      className="flex text-primary font-bold md:flex-col items-center md:items-end justify-between md:justify-start gap-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-8 h-8 cursor-pointer rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold"
                        >
                          -
                        </button>
                        <span className="w-12 text-center font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="w-8 h-8 cursor-pointer rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="cursor-pointer text-red-600 hover:text-red-800 font-medium text-sm"
                      >
                        Remove
                      </button>

                      <div className="text-lg font-bold text-gray-900 md:mt-auto">
                        {formatPrice(displayPrice * item.quantity)} {currency}
                      </div>
                    </div>
                  </div>
                );
              })}

              <button
                onClick={clearCart}
                className="text-red-600 hover:text-red-800 font-medium text-sm"
              >
                Clear Cart
              </button>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Items ({getCartCount()})</span>
                    {formatPrice(getCartTotal())} {currency}
                  </div>
                  <div className="border-t pt-3 flex justify-between text-xl font-bold text-gray-900">
                    <span>Total</span>
                    {formatPrice(getCartTotal())} {currency}
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={isTimerExpired} 
                  className={`cursor-pointer w-full py-3 font-bold rounded-lg transition-colors mb-4 ${
                    isTimerExpired
                      ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                      : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                  }`}
                >
                  {isTimerExpired ? '⏰ Prices Expired - Refresh Required' : 'Proceed to Checkout'}
                </button>

                <Link
                  href="/products"
                  className="block text-center text-yellow-600 hover:text-yellow-700 font-medium"
                >
                  Continue Shopping
                </Link>

                <div className="mt-6 pt-6 border-t text-sm text-gray-600">
                  <p className="mb-2">✓ Secure checkout</p>
                  <p className="mb-2">✓ Compliance verification included</p>
                  <p>✓ Secure pickup location</p>
                  {loadingPrices && (
                    <p className="mt-2 text-blue-600">⟳ Updating prices...</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CartPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading cart...</div>
      </div>
    }>
      <CartContent />
    </Suspense>
  );
}