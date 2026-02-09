'use client';

import { useEffect, useRef, Suspense, useState, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Product } from '@/types/product';
import Image from 'next/image';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { useCart } from '@/contexts/CartContext';
import {lockPrices, startPricingTimer, formatRemainingTime} from '@/lib/pricing/pricingTimer';
import { useMetalPrices } from '@/contexts/MetalPricesContext';
import { calculateBulkPricingFromCache } from '@/lib/pricing/priceCalculations';
import { MetalSymbol } from '@/lib/metals-api/metalsApi';
import { createLogger} from "@/lib/utils/logger";
import { useCurrency } from '@/contexts/CurrencyContext';
import { toast } from 'sonner';
import { ShoppingCartIcon } from 'lucide-react';

const logger = createLogger('CART_PAGE')

// Market hours checker
function getMarketStatus() {
  const now = new Date();
  const utcDay = now.getUTCDay();
  const utcHour = now.getUTCHours();

  if (utcDay === 6) return { isOpen: false };
  if (utcDay === 5 && utcHour >= 22) return { isOpen: false };
  if (utcDay === 0 && utcHour < 23) return { isOpen: false };
  return { isOpen: true };
}

function CartContent() {
  const {
    cart,
    addToCartById,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount,
    isLoading,
    lockPricesOnServer,
    isTimerExpired,
    timerRemaining,
    startTimer,
    getLockedPriceForProduct,
  } = useCart();

  // Check if prices are currently locked
  const arePricesLocked = !isTimerExpired && timerRemaining > 0;

  // Use shared metal prices from context
  const { prices: metalPrices, isLoading: loadingPrices, refetch } = useMetalPrices();

  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const hasAddedProduct = useRef(false);
  const hasFetchedPrices = useRef(false);
  const { formatPrice, currency } = useCurrency();
  const [marketStatus, setMarketStatus] = useState(getMarketStatus());

  // Update market status every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketStatus(getMarketStatus());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Calculate current market prices for all cart items (memoized to prevent loops)
  const currentCartPrices = useMemo(() => {
    if (!metalPrices || metalPrices.length === 0 || cart.length === 0) {
      return new Map<string, number>();
    }

    const metalPriceMap = new Map<MetalSymbol, number>(
      metalPrices.map(price => [price.symbol, price.price])
    );

    const products = cart.map(item => item.product);
    const priceMap = calculateBulkPricingFromCache(products, metalPriceMap);

    // Convert to simple price map (productId -> price)
    const simplePriceMap = new Map<string, number>();
    priceMap.forEach((priceInfo, productId) => {
      simplePriceMap.set(productId, priceInfo.calculatedPrice);
    });

    return simplePriceMap;
  }, [cart, metalPrices]); // Only recalculate when cart or metal prices change

  // This function is ONLY called when user clicks "Proceed to Checkout"
  const lockPricesForCheckout = useCallback(async () => {
    if (cart.length === 0 || !metalPrices || metalPrices.length === 0) {
      throw new Error('Cannot lock prices: cart or metal prices not available');
    }

    try {
      logger.log('[CART] Locking prices for checkout at current market rates');

      const products = cart.map(item => item.product);

      // Lock prices on server (this also locks locally) with user's selected currency
      await lockPricesOnServer(products, currency);

      logger.log('[CART] ✅ Prices locked successfully for checkout in', currency);

    } catch (error) {
      logger.error('[CART] ❌ Error locking prices:', error);
      throw error; // Re-throw so handleCheckout can catch it
    }
  }, [cart, metalPrices, lockPricesOnServer, currency]);


  // Note: We NO LONGER re-lock prices in cart
  // Cart displays current market prices in real-time
  // Prices are only locked when user proceeds to checkout

  // Handle adding product from URL parameter
  useEffect(() => {
    const productId = searchParams.get('add');

    if (productId && !hasAddedProduct.current) {
      hasAddedProduct.current = true;

      logger.log('[CART] Adding product from URL:', productId);

      addToCartById(productId).then(success => {
        if (success) {
          toast.success('Product added to cart');
          // Remove the 'add' parameter from URL without reloading
          router.replace('/cart', { scroll: false });
        } else {
          toast.error('Failed to add product to cart');
        }
      });
    }
  }, [searchParams, addToCartById, router]);




  const handleCheckout = async () => {
    if (!isLoaded) {
      return;
    }

    if (!user) {
      router.push('/sign-in?redirect_url=/cart');
      return;
    }

    try {
      logger.log('[CART] Refreshing metal prices before checkout');
      await refetch();
      // Start 15-minute timer and lock prices at current market rates
      await new Promise(resolve => setTimeout(resolve, 100));

      if (!arePricesLocked) {
        logger.log('[CART] Starting checkout - locking prices and starting timer');
        startTimer();
        await lockPricesForCheckout();

        toast.success('Prices locked for 15 minutes', {
          description: 'Complete your purchase within this time',
        });
      } else {
        logger.log('[CART] Prices already locked, proceeding to checkout');
      }


      router.push('/checkout');
    } catch (error) {
      logger.error('[CART] Failed to lock prices for checkout:', error);
      toast.error('Failed to lock prices', {
        description: 'Please try again or contact support',
      });
    }
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
        <h1 className="text-3xl font-bold text-foreground my-8">Shopping Cart</h1>

        {cart.length > 0 && (
            <div className={`mb-4 p-4 ${arePricesLocked ? 'bg-success/10 border-success/30' : 'bg-primary/5 border-primary/20'} border rounded-lg`}>
              <div className="flex items-start gap-3">
                <div className={`${arePricesLocked ? 'text-success' : 'text-primary'} mt-0.5`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {arePricesLocked ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    )}
                  </svg>
                </div>
                <div className="flex-1">
                  {arePricesLocked ? (
                    <>
                      <p className="text-success font-semibold mb-1">
                        Prices Currently Locked - {formatRemainingTime()} Remaining
                      </p>
                      <p className="text-success/80 text-sm">
                        Your prices are locked at checkout rates. Return to checkout to complete your purchase before the timer expires.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-foreground font-semibold mb-1">
                        {marketStatus.isOpen ? 'Live Market Pricing - Not Locked' : 'Current Market Pricing - Not Locked'}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {marketStatus.isOpen
                            ? 'Prices shown are live and may change. Click "Proceed to Checkout" to lock current prices for 15 minutes.'
                            : 'Markets are currently closed. Prices shown are from the last market close. Click "Proceed to Checkout" to lock current prices for 15 minutes.'}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
        )}
        {cart.length > 0 && (
          <p className="text-xs text-muted-foreground mb-4 text-center">
            Note: Minor price variations may occur due to real-time market data synchronization. Final prices are confirmed at checkout.
          </p>
        )}

        {loadingPrices && (
          <div className="mb-4 p-4 bg-primary/5 border border-primary/20 rounded-lg text-center">
            <p className="text-foreground text-sm">Updating prices with {marketStatus.isOpen ? 'live' : 'current'} market data...</p>
          </div>
        )}

        {cart.length === 0 ? (
          <div className="bg-card rounded-lg border border-border shadow-card p-6 sm:p-8 md:p-12 text-center max-w-md mx-auto">
            <div className="mb-6">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <ShoppingCartIcon className="w-7 h-7 text-muted-foreground" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                Your cart is empty
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Start building your precious metals portfolio today
              </p>
            </div>

            <div className="bg-muted/30 rounded-lg p-4 mb-6">
              <p className="text-sm text-foreground/70 mb-2">Popular products:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>Gold bars and coins</li>
                <li>Silver bullion</li>
                <li>Platinum products</li>
              </ul>
            </div>

            <Link
              href="/products"
              className="inline-block px-6 sm:px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-colors shadow-gold text-sm sm:text-base"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => {
                // Get pre-calculated current market price (from memoized map)
                const currentPrice = currentCartPrices.get(item.product.id) ?? item.product.price;
                const lockedPrice = getLockedPriceForProduct(item.product.id);
                const displayPrice = arePricesLocked && lockedPrice ? lockedPrice : currentPrice;

                return (
                  <div
                    key={item.product.id}
                    className="bg-card rounded-lg border border-border shadow-card p-5 flex flex-col md:flex-row gap-4"
                  >
                    <div className="relative w-28 h-28 mx-auto md:mx-0 md:w-28 bg-muted/30 rounded-md flex-shrink-0">
                      <Image
                        src={item.product.image_url || '/images/placeholder-product.jpg'}
                        alt={item.product.name}
                        fill
                        className="object-contain rounded p-2"
                        sizes="(max-width: 768px) 128px, 128px"
                      />
                    </div>

                    <div className="flex-grow">
                      <h3 className="text-base font-semibold text-foreground mb-2">
                        {item.product.name}
                      </h3>
                      <div className="flex gap-3 text-xs text-muted-foreground mb-2">
                        <span>Weight: {item.product.weight}</span>
                        <span>Purity: {item.product.purity}</span>
                      </div>
                      <div className="text-lg font-bold text-foreground">
                        {arePricesLocked && lockedPrice
                          ? `$${displayPrice.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : formatPrice(displayPrice)
                        } {currency}
                      </div>
                    </div>

                    <div
                      className="flex md:flex-col items-center md:items-end justify-between md:justify-start gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-8 h-8 cursor-pointer rounded-md bg-muted hover:bg-muted/80 flex items-center justify-center font-bold text-foreground transition-colors"
                        >
                          -
                        </button>
                        <span className="w-10 text-center font-semibold text-foreground">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="w-8 h-8 cursor-pointer rounded-md bg-muted hover:bg-muted/80 flex items-center justify-center font-bold text-foreground transition-colors"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="cursor-pointer text-destructive hover:text-destructive/80 font-medium text-xs transition-colors"
                      >
                        Remove
                      </button>

                      <div className="text-base font-bold text-foreground md:mt-auto">
                        {arePricesLocked && lockedPrice
                          ? `$${(displayPrice * item.quantity).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : formatPrice(displayPrice * item.quantity)
                        } {currency}
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
              <div className="bg-card rounded-lg border border-border shadow-card p-6 sticky top-4">
                <h2 className="text-xl font-bold text-foreground mb-5">Order Summary</h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-muted-foreground text-sm">
                    <span>Items ({getCartCount()})</span>
                    {arePricesLocked
                      ? `$${getCartTotal().toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : formatPrice(getCartTotal(currentCartPrices))
                    } {currency}
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between text-lg font-bold text-foreground">
                    <span>Total</span>
                    {arePricesLocked
                      ? `$${getCartTotal().toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : formatPrice(getCartTotal(currentCartPrices))
                    } {currency}
                  </div>
                </div>

                {/* Coming Soon Notice */}
                <div className="mb-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-foreground text-sm">Checkout Coming Soon</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    We are preparing to launch. Our checkout system will be available very soon. Thank you for your patience.
                  </p>
                </div>

                <button
                  onClick={handleCheckout}
                  className="cursor-pointer w-full py-3 font-semibold rounded-lg transition-colors mb-3 bg-primary hover:bg-primary/90 text-primary-foreground shadow-gold"
                >
                  Proceed to Checkout
                </button>

                <Link
                  href="/products"
                  className="block text-center text-primary hover:text-primary/80 font-medium text-sm transition-colors"
                >
                  Continue Shopping
                </Link>

                <div className="mt-5 pt-5 border-t border-border text-xs text-muted-foreground space-y-1.5">
                  <p className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-success flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Secure checkout
                  </p>
                  <p className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-success flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Compliance verification included
                  </p>
                  <p className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-success flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Secure pickup location
                  </p>
                  {loadingPrices && (
                    <p className="mt-2 text-primary text-xs">Updating prices...</p>
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