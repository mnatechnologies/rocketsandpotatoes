'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('ORDER_CONFIRMATION');

interface Order {
  id: string;
  customer_id: string;
  transaction_type: string;
  amount: number;
  currency: string;
  product_type: string;
  product_details: any;
  payment_method: string;
  payment_status: string;
  stripe_payment_intent_id: string;
  requires_kyc: boolean;
  requires_ttr: boolean;
  created_at: string;
  customer: {
    email: string;
    first_name: string;
    last_name: string;
  };
}

function OrderConfirmationContent() {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const hasFetchedOrder = useRef(false); // ✅ Add this

  useEffect(() => {
    logger.log('Order confirmation page mounted');

    if (hasFetchedOrder.current) {
      logger.log('Order already fetched, skipping...');
      return;
    }

    if (!isLoaded) {
      logger.log('User auth not loaded yet');
      return;
    }

    if (!user) {
      logger.log('User not authenticated, redirecting to sign-in');
      router.push('/sign-in');
      return;
    }

    const orderId = searchParams.get('orderId');
    if (!orderId) {
      logger.log('No order ID in URL');
      setError('No order ID provided');
      setLoading(false);
      return;
    }
    hasFetchedOrder.current = true
    logger.log('Fetching order:', orderId);
    fetchOrder(orderId);
  }, [isLoaded]);

  const fetchOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch order');
      }

      const data = await response.json();
      logger.log('Order data fetched:', data);
      setOrder(data);
    } catch (err: any) {
      logger.error('Error fetching order:', err);
      setError(err.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl mb-4">Loading order details...</div>
          <div className="text-gray-600">Please wait</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Order</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/products"
            className="inline-block px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg"
          >
            Return to Products
          </Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl">Order not found</div>
        </div>
      </div>
    );
  }

  const items = order.product_details?.items || [order.product_details?.mainProduct];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">✓</div>
          <h1 className="text-4xl font-bold text-green-600 mb-2">Order Confirmed!</h1>
          <p className="text-xl text-gray-600">
            Thank you for your purchase
          </p>
        </div>

        {/* Order Details Card */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="border-b pb-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Details</h2>
            <p className="text-gray-600">
              Order ID: <span className="font-mono text-sm">{order.id}</span>
            </p>
            <p className="text-gray-600 text-sm">
              Placed on {new Date(order.created_at).toLocaleString('en-AU', {
              dateStyle: 'long',
              timeStyle: 'short',
            })}
            </p>
          </div>

          {/* Customer Info */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Customer Information</h3>
            <p className="text-gray-700">{order.customer.first_name} {order.customer.last_name}</p>
            <p className="text-gray-700">{order.customer.email}</p>
          </div>

          {/* Order Items */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
            <div className="space-y-3">
              {items.map((item: any, index: number) => {
                // ✅ Handle both nested and flat structures
                const itemPrice = item.price || item.product?.price;
                const itemQuantity = item.quantity || 1;
                const itemName = item.name || item.product?.name;
                const itemWeight = item.weight || item.product?.weight;
                const itemPurity = item.purity || item.product?.purity;

                return (
                  <div key={index} className="flex justify-between items-start py-2 border-b">
                    <div>
                      <p className="font-medium text-gray-900">{itemName}</p>
                      <p className="text-sm text-gray-600">
                        {itemWeight} • {itemPurity}
                      </p>
                      <p className="text-sm text-gray-600">Qty: {itemQuantity}</p>
                    </div>
                    <p className="font-semibold text-gray-900">
                      ${(itemPrice * itemQuantity).toLocaleString('en-AU', {
                      minimumFractionDigits: 2,
                    })} {order.currency || 'AUD'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Summary */}
          <div className="border-t pt-4">
            <div className="flex justify-between text-lg mb-2">
              <span className="text-gray-700">Payment Method:</span>
              <span className="font-medium capitalize">{order.payment_method}</span>
            </div>
            <div className="flex justify-between text-lg mb-2">
              <span className="text-gray-700">Payment Status:</span>
              <span className="font-medium text-green-600 capitalize">{order.payment_status}</span>
            </div>
            <div className="flex justify-between text-2xl font-bold text-gray-900 mt-4">
              <span>Total Paid:</span>
              <span>${order.amount.toLocaleString('en-AU', { minimumFractionDigits: 2 })} {order.currency}</span>
            </div>
          </div>
        </div>

        {/* Compliance Notice */}
        {(order.requires_kyc || order.requires_ttr) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">Compliance Notice</h3>
            <div className="text-sm text-blue-800 space-y-1">
              {order.requires_kyc && (
                <p>✓ Your identity verification is on file (KYC completed)</p>
              )}
              {order.requires_ttr && (
                <p>✓ This transaction will be reported to AUSTRAC as required by law</p>
              )}
            </div>
          </div>
        )}

        {/* Next Steps */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">What Happens Next?</h3>
          <div className="space-y-3 text-gray-700">
            <div className="flex items-start">
              <span className="mr-3">1.</span>
              <span>You will receive an order confirmation email shortly</span>
            </div>
            <div className="flex items-start">
              <span className="mr-3">2.</span>
              <span>Your order will be processed within 1-2 business days</span>
            </div>
            <div className="flex items-start">
              <span className="mr-3">3.</span>
              <span>You&#39;ll receive shipping information once your order is dispatched</span>
            </div>
            <div className="flex items-start">
              <span className="mr-3">4.</span>
              <span>Insured delivery typically takes 2-5 business days</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/products"
            className="px-8 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg text-center transition-colors"
          >
            Continue Shopping
          </Link>
          <Link
            href="/"
            className="px-8 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg text-center transition-colors"
          >
            Return to Home
          </Link>
        </div>

        {/* Support */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>
            Need help? Contact our support team at{' '}
            <a href="mailto:support@australiannationalbullion.com.au" className="text-blue-600 hover:underline">
              support@australiannationalbullion.com.au
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl mb-4">Loading order details...</div>
          <div className="text-gray-600">Please wait</div>
        </div>
      </div>
    }>
      <OrderConfirmationContent />
    </Suspense>
  );
}