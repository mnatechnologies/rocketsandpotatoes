'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Product } from '@/types/product';
import Image from 'next/image';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';

// Testing flag - set to true to enable console logging
const TESTING_MODE = process.env.NEXT_PUBLIC_TESTING_MODE === 'true' || true;

function log(...args: any[]) {
  if (TESTING_MODE) {
    console.log('[CART_PAGE]', ...args);
  }
}

interface CartItem {
  product: Product;
  quantity: number;
  livePrice?: number
}

// Separate the component that uses useSearchParams
function CartContent() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const {user, isLoaded} = useUser();
  const hasAddedProduct = useRef(false);


  // ... rest of your existing component code (all the useEffect, functions, and JSX)
  // (Keep everything exactly as it is from line 24 onwards)

  useEffect(() => {
    log('Cart page mounted, loading cart from localStorage');
    // Load cart from localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        const cartWithUrls = parsedCart.map((item: CartItem) => ({
          ...item,
          product: {
            ...item.product,
            image_url: item.product.image_url?.startsWith('http')
              ? item.product.image_url
              : `https://vlvejjyyvzrepccgmsvo.supabase.co/storage/v1/object/public/Images/gold/${item.product.image_url?.trim()}`
          }
        }));
        setCart(cartWithUrls);
        log('Cart loaded:', cartWithUrls);
        fetchLivePrices(cartWithUrls)
      } catch (error) {
        log('Error parsing cart:', error);
      }
    }

    // Check if adding a product via URL param
    const productId = searchParams.get('add');
    if (productId && !hasAddedProduct.current) {
      log('Adding product from URL:', productId);
      hasAddedProduct.current = true;
      addToCart(productId);
    }

    setLoading(false);
  }, [searchParams]);

  const fetchLivePrices = async (cartItems: CartItem[]) => {
    if (cartItems.length === 0) return;

    setLoadingPrices(true);
    try {
      const productIds = cartItems.map(item => item.product.id).join(',');
      const response = await fetch(`/api/products/pricing?ids=${productIds}`);

      if (!response.ok) {
        throw new Error('Failed to fetch pricing');
      }

      const data = await response.json();

      if (data.success && data.data) {
        log('Live prices fetched:', data.data);

        // Update cart with live prices
        setCart(prevCart => prevCart.map(item => {
          const updatedProduct = data.data.find((p: any) => p.id === item.product.id);
          if (updatedProduct && updatedProduct.calculated_price) {
            return {
              ...item,
              livePrice: updatedProduct.calculated_price
            };
          }
          return item;
        }));
      }
    } catch (error) {
      log('Error fetching live prices:', error);
      // Continue with static prices
    } finally {
      setLoadingPrices(false);
    }
  };

  const addToCart = async (productId: string) => {
    log('Fetching product:', productId);
    try {
      const response = await fetch(`/api/products/${productId}`);
      if (!response.ok) {
        throw new Error('Product not found');
      }
      const product: Product = await response.json();
      log('Product fetched:', product);

      const trimmedImageUrl = product.image_url?.trim();
      const fullImageUrl = trimmedImageUrl
        ? `https://vlvejjyyvzrepccgmsvo.supabase.co/storage/v1/object/public/Images/gold/${trimmedImageUrl}`
        : '/anblogo.png';

      const productWithUrl: Product = {
        ...product,
        image_url: fullImageUrl
      };

      setCart((prevCart) => {
        const existingItem = prevCart.find((item) => item.product.id === productId);
        let newCart;

        if (existingItem) {
          log('Product already in cart, incrementing quantity');
          newCart = prevCart.map((item) =>
            item.product.id === productId
              ? {...item, quantity: item.quantity + 1}
              : item
          );
        } else {
          log('Adding new product to cart');
          newCart = [...prevCart, {product: productWithUrl, quantity: 1}];
        }

        localStorage.setItem('cart', JSON.stringify(newCart));
        window.dispatchEvent(new Event('cartUpdated'));
        log('Cart updated:', newCart);
        return newCart;
      });

      router.replace('/cart');
    } catch (error) {
      log('Error adding to cart:', error);
      alert('Failed to add product to cart');
    }
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    log('Updating quantity for product:', productId, 'to:', newQuantity);
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prevCart) => {
      const newCart = prevCart.map((item) =>
        item.product.id === productId ? {...item, quantity: newQuantity} : item
      );
      localStorage.setItem('cart', JSON.stringify(newCart));
      window.dispatchEvent(new Event('cartUpdated'));
      log('Cart updated:', newCart);
      return newCart;
    });
  };

  const removeFromCart = (productId: string) => {
    log('Removing product from cart:', productId);
    setCart((prevCart) => {
      const newCart = prevCart.filter((item) => item.product.id !== productId);
      localStorage.setItem('cart', JSON.stringify(newCart));
      window.dispatchEvent(new Event('cartUpdated'));
      log('Cart updated:', newCart);
      return newCart;
    });
  };

  const clearCart = () => {
    log('Clearing entire cart');
    setCart([]);
    localStorage.removeItem('cart');
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const getTotalPrice = () => {
    const total = cart.reduce((sum, item) => {
      const price = item.livePrice ?? item.product.price;
      return sum + price * item.quantity
    }, 0);
    log('Total price calculated:', total);
    return total;
  };

  const getTotalItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleCheckout = () => {
    log('Proceeding to checkout');
    if (!isLoaded) {
      log('User not loaded yet');
      return;
    }

    if (!user) {
      log('User not authenticated, redirecting to sign-in');
      router.push('/sign-in?redirect_url=/cart');
      return;
    }

    log('User authenticated, proceeding to checkout');
    router.push('/checkout');
  };

  if (loading) {
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
                const displayPrice = item.livePrice ?? item.product.price;
                const hasPriceChange = item.livePrice && item.livePrice !== item.product.price;

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
                        ${displayPrice.toLocaleString('en-AU', {minimumFractionDigits: 2})} AUD
                        {hasPriceChange && (
                          <span className={`text-sm ml-2 ${
                            item.livePrice! > item.product.price ? 'text-red-600' : 'text-green-600'
                          }`}>
                            ({item.livePrice! > item.product.price ? '↑' : '↓'}
                            ${Math.abs(item.livePrice! - item.product.price).toFixed(2)})
                          </span>
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
                        ${(displayPrice * item.quantity).toLocaleString('en-AU', {minimumFractionDigits: 2})}
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
                    <span>Items ({getTotalItems()})</span>
                    <span>${getTotalPrice().toLocaleString('en-AU', {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span>Calculated at checkout</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between text-xl font-bold text-gray-900">
                    <span>Total</span>
                    <span>${getTotalPrice().toLocaleString('en-AU', {minimumFractionDigits: 2})} AUD</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="cursor-pointer w-full py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-lg transition-colors mb-4"
                >
                  Proceed to Checkout
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
                  <p>✓ Insured shipping available</p>
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