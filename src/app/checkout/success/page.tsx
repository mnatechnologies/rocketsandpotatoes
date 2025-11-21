'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { clearPricingTimer } from '@/lib/pricing/pricingTimer';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('SUCCESS_PAGE');

function CheckoutSuccessContent() {
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    logger.log('Success page mounted');

    // Get order ID from URL params
    const orderId = searchParams.get('order_id');
    const paymentIntentId = searchParams.get('payment_intent');

    logger.log('Order ID:', orderId);
    logger.log('Payment Intent ID:', paymentIntentId);

    if (!orderId && !paymentIntentId) {
      logger.log('No order information found');
      // Redirect if no order info
      setTimeout(() => {
        router.push('/products');
      }, 3000);
    }

    // Clear cart from localStorage
    logger.log('Clearing cart from localStorage');
    localStorage.removeItem('cart');
    
    // Clear pricing timer
    clearPricingTimer();
    logger.log('Pricing timer cleared');

    // Fetch order details if we have an order ID
    if (orderId) {
      fetchOrderDetails(orderId);
    } else {
      setLoading(false);
    }
  }, [searchParams, router]);

  const fetchOrderDetails = async (orderId: string) => {
    logger.log('Fetching order details for:', orderId);
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (response.ok) {
        const data = await response.json();
        logger.log('Order details fetched:', data);
        setOrderDetails(data);
      } else {
        logger.log('Failed to fetch order details');
      }
    } catch (error) {
      logger.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading order details...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* Success Message */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
              <svg
                className="w-12 h-12 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Order Successful!
            </h1>
            <p className="text-xl text-gray-600">
              Thank you for your purchase from Australian National Bullion
            </p>
          </div>

          {orderDetails && (
            <div className="border-t pt-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Details</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Number:</span>
                  <span className="font-semibold">{orderDetails.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Date:</span>
                  <span className="font-semibold">
                    {new Date(orderDetails.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-semibold text-xl">
                    ${orderDetails.amount?.toLocaleString('en-AU', { minimumFractionDigits: 2 })} AUD
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                    {orderDetails.status || 'Processing'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Next Steps */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">What Happens Next?</h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center font-bold mr-3">
                1
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Order Confirmation</h3>
                <p className="text-gray-600">
                  You will receive an email confirmation with your order details shortly.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center font-bold mr-3">
                2
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Compliance Verification</h3>
                <p className="text-gray-600">
                  Your order will be reviewed for compliance with Australian regulations.
                  This typically takes 1-2 business days.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center font-bold mr-3">
                3
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Secure Shipping</h3>
                <p className="text-gray-600">
                  Once approved, your precious metals will be securely packaged and shipped
                  with full insurance and tracking.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center font-bold mr-3">
                4
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Delivery</h3>
                <p className="text-gray-600">
                  Your order will arrive within 3-5 business days after shipping.
                  Signature may be required upon delivery.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Important Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">Important Information</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Keep your order number for reference</li>
            <li>• Check your email for tracking information</li>
            <li>• Contact us if you have any questions about your order</li>
            <li>• All transactions are subject to AUSTRAC compliance requirements</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/products"
            className="px-8 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-lg text-center transition-colors"
          >
            Continue Shopping
          </Link>
          <Link
            href="/"
            className="px-8 py-3 bg-white hover:bg-gray-50 text-gray-900 font-bold rounded-lg border-2 border-gray-300 text-center transition-colors"
          >
            Return Home
          </Link>
        </div>

        {/* Support */}
        <div className="mt-8 text-center text-gray-600">
          <p className="mb-2">Need help with your order?</p>
          <Link
            href="/contact"
            className="text-yellow-600 hover:text-yellow-700 font-semibold"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading order details...</div>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}