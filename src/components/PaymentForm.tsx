'use client';
/* eslint-disable */
import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Product } from '@/types/product';

// Testing flag - set to true to enable console logging
const TESTING_MODE = process.env.NEXT_PUBLIC_TESTING_MODE === 'true' || true;

function log(...args: any[]) {
  if (TESTING_MODE) {
    console.log('[PAYMENT_FORM]', ...args);
  }
}

interface PaymentFormProps {
  amount: number;
  customerId: string;
  productDetails: Product;
  cartItems?: any[];
  paymentIntentId: string;
  onSuccess?: (orderId: string) => void;
}

export function PaymentForm({
  amount,
  customerId,
  productDetails,
  cartItems,
  paymentIntentId,
  onSuccess,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    log('Payment form submitted');

    if (!stripe || !elements) {
      log('Stripe not loaded yet');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      log('Step 1: Confirming payment with Stripe...');
      
      // Confirm the payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/order-confirmation`,
        },
        redirect: 'if_required', // Don't redirect, handle success here
      });

      if (stripeError) {
        log('Stripe payment error:', stripeError);
        setError(stripeError.message || 'Payment failed');
        setIsProcessing(false);
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        log('Step 2: Payment succeeded, creating order...');
        
        // Create order in database
        const orderResponse = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId,
            amount,
            currency: 'AUD',
            productDetails,
            cartItems,
            stripePaymentIntentId: paymentIntent.id,
            paymentMethod: 'card',
          }),
        });

        if (!orderResponse.ok) {
          const errorData = await orderResponse.json();
          log('Order creation failed:', errorData);
          throw new Error(errorData.error || 'Failed to create order');
        }

        const orderData = await orderResponse.json();
        log('Order created successfully:', orderData.orderId);

        setSuccess(true);
        
        // Clear cart from localStorage
        log('Clearing cart from localStorage');
        localStorage.removeItem('cart');

        // Call success callback if provided
        if (onSuccess) {
          onSuccess(orderData.orderId);
        }

        // Redirect to order confirmation page after a short delay
        setTimeout(() => {
          window.location.href = `/order-confirmation?orderId=${orderData.orderId}`;
        }, 2000);
      } else {
        log('Payment status not succeeded:', paymentIntent?.status);
        setError('Payment was not successful. Please try again.');
      }
    } catch (err: any) {
      log('Error during payment process:', err);
      setError(err.message || 'An error occurred during payment');
    } finally {
      setIsProcessing(false);
      log('Payment process completed');
    }
  };

  if (success) {
    return (
      <div className="text-center p-6 bg-green-50 rounded-lg">
        <div className="text-6xl mb-4">✓</div>
        <h2 className="text-2xl font-bold text-green-800 mb-2">Payment Successful!</h2>
        <p className="text-green-700 mb-4">
          Your order has been placed successfully.
        </p>
        <p className="text-sm text-gray-600">
          Redirecting to order confirmation...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Payment Details</h3>
        <PaymentElement />
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 font-medium">Payment Error</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      )}

      <div className="border-t pt-4">
        <div className="flex justify-between text-lg font-bold mb-4">
          <span>Total Amount:</span>
          <span>${amount.toLocaleString('en-AU', { minimumFractionDigits: 2 })} AUD</span>
        </div>

        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="w-full py-3 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors"
        >
          {isProcessing ? 'Processing Payment...' : `Pay $${amount.toLocaleString('en-AU', { minimumFractionDigits: 2 })} AUD`}
        </button>
      </div>

      <p className="text-xs text-gray-500 text-center">
        Your payment is secured by Stripe. We do not store your card details.
      </p>
    </form>
  );
}
