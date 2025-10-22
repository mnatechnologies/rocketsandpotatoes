'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { CheckoutFlow } from '@/components/CheckoutFlow';
import { Product } from '@/types/product';

// Testing flag - set to true to enable console logging
const TESTING_MODE = process.env.NEXT_PUBLIC_TESTING_MODE === 'true' || true;

function log(...args: any[]) {
  if (TESTING_MODE) {
    console.log('[CHECKOUT_PAGE]', ...args);
  }
}

interface CartItem {
  product: Product;
  quantity: number;
}

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    log('Checkout page mounted');
    
    if (!isLoaded) {
      log('User auth not loaded yet');
      return;
    }

    if (!user) {
      log('User not authenticated, redirecting to sign-in');
      router.push('/sign-in?redirect_url=/checkout');
      return;
    }

    log('User authenticated:', user.id);
    fetchCustomerId();
    loadCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isLoaded, router]);

  const fetchCustomerId = async () => {
    if (!user) return;

    log('Fetching customer ID for Clerk user:', user.id);
    try {
      const response = await fetch('/api/customer/me');
      if (!response.ok) {
        throw new Error('Failed to fetch customer data');
      }
      const data = await response.json();
      log('Customer data fetched:', data);
      setCustomerId(data.id);
    } catch (error) {
      log('Error fetching customer ID:', error);
      // If customer doesn't exist yet, the webhook might not have processed
      // We'll create a temporary flow or wait
      alert('Please wait a moment while we set up your account, then try again.');
    }
  };

  const loadCart = () => {
    log('Loading cart from localStorage');
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        log('Cart loaded:', parsedCart);
        setCart(parsedCart);
      } catch (error) {
        log('Error parsing cart:', error);
      }
    } else {
      log('No cart found, redirecting to cart page');
      router.push('/cart');
    }
    setLoading(false);
  };

  const getTotalAmount = () => {
    const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    log('Total amount calculated:', total);
    return total;
  };

  const getMainProduct = (): Product | null => {
    if (cart.length === 0) return null;
    // Return the highest value item as the main product for compliance checks
    const sorted = [...cart].sort((a, b) => 
      (b.product.price * b.quantity) - (a.product.price * a.quantity)
    );
    log('Main product for compliance:', sorted[0]?.product.name);
    return sorted[0]?.product || null;
  };

  if (loading || !isLoaded) {
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

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Checkout</h1>

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Summary</h2>
          <div className="space-y-3">
            {cart.map((item) => (
              <div key={item.product.id} className="flex justify-between text-gray-700">
                <span>
                  {item.product.name} x {item.quantity}
                </span>
                <span className="font-semibold">
                  ${(item.product.price * item.quantity).toLocaleString('en-AU', { 
                    minimumFractionDigits: 2 
                  })}
                </span>
              </div>
            ))}
            <div className="border-t pt-3 flex justify-between text-xl font-bold text-gray-900">
              <span>Total</span>
              <span>
                ${getTotalAmount().toLocaleString('en-AU', { minimumFractionDigits: 2 })} AUD
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
            {getTotalAmount() >= 5000 && (
              <span className="block mt-2 font-semibold">
                ⚠️ Transactions over $5,000 AUD require identity verification (KYC).
              </span>
            )}
          </p>
        </div>

        {/* Checkout Flow Component */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment & Verification</h2>
          <CheckoutFlow
            customerId={customerId}
            amount={getTotalAmount()}
            productDetails={mainProduct}
            cartItems={cart}
            customerEmail={user?.primaryEmailAddress?.emailAddress}
            onSuccess={(orderId) => {
              log('Payment successful, redirecting to confirmation');
              router.push(`/order-confirmation?orderId=${orderId}`);
            }}
          />
        </div>
      </div>
    </div>
  );
}
