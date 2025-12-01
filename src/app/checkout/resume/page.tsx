
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { createLogger } from '@/lib/utils/logger';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { PaymentForm } from '@/components/PaymentForm';

const logger = createLogger('RESUME_CHECKOUT');
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function ResumeCheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();
  const transactionId = searchParams.get('transactionId');

  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.push('/sign-in?redirect_url=/checkout/resume?transactionId=' + transactionId);
      return;
    }

    if (!transactionId) {
      setError('No transaction ID provided');
      setLoading(false);
      return;
    }

    loadTransaction();
  }, [user, isLoaded, transactionId]);

  const loadTransaction = async () => {
    try {
      logger.log('Loading transaction:', transactionId);

      const response = await fetch(`/api/orders/${transactionId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load transaction');
      }

      logger.log('Transaction loaded:', data);

      // Verify transaction is approved and pending payment
      if (data.review_status !== 'approved') {
        setError('This transaction has not been approved yet');
        setLoading(false);
        return;
      }

      if (data.payment_status === 'succeeded') {
        setError('This transaction has already been paid');
        setLoading(false);
        return;
      }

      setTransaction(data);

      // Get the existing payment intent ID from the transaction
      if (data.stripe_payment_intent_id) {
        // Retrieve the client secret for the existing payment intent
        const paymentResponse = await fetch('/api/retrieve-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentIntentId: data.stripe_payment_intent_id,
          }),
        });

        const paymentData = await paymentResponse.json();

        if (!paymentResponse.ok) {
          throw new Error(paymentData.error || 'Failed to retrieve payment intent');
        }

        setClientSecret(paymentData.clientSecret);
      } else {
        setError('No payment intent found for this transaction');
      }

      setLoading(false);

    } catch (err: any) {
      logger.error('Error loading transaction:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl mb-4">Loading transaction...</div>
          <div className="text-gray-600">Please wait</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-2xl font-bold text-red-600 mb-4">⚠️ Error</div>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => router.push('/account/orders')}
            className="px-6 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg"
          >
            View My Orders
          </button>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl mb-4">Setting up payment...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background/50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-green-900 mb-2">
            ✅ Transaction Approved
          </h1>
          <p className="text-green-800">
            Your transaction has been approved by our compliance team. Please complete your payment below.
          </p>
        </div>

        {/* Transaction Details */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Transaction Details</h2>
          <div className="space-y-2 text-gray-700">
            <div className="flex justify-between">
              <span>Transaction ID:</span>
              <span className="font-mono text-sm">{transaction.id.slice(0, 13)}...</span>
            </div>
            <div className="flex justify-between">
              <span>Product:</span>
              <span className="font-semibold">{transaction.product_type}</span>
            </div>
            <div className="flex justify-between text-xl font-bold border-t pt-2 mt-2">
              <span>Total Amount:</span>
              <span>
                {transaction.currency} ${transaction.amount.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Complete Payment</h2>
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: 'stripe',
              },
            }}
          >
            <PaymentForm
              amount={transaction.amount}
              currency={transaction.currency}
              customerId={transaction.customer_id}
              productDetails={transaction.product_details || { name: transaction.product_type }}
              cartItems={transaction.cart_items || []}
              paymentIntentId={transaction.stripe_payment_intent_id}
              onSuccess={(orderId) => {
                logger.log('Payment successful, redirecting...');
                router.push(`/order-confirmation?orderId=${orderId || transaction.id}`);
              }}
            />
          </Elements>
        </div>
      </div>
    </div>
  );
}

export default function ResumeCheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    }>
      <ResumeCheckoutContent />
    </Suspense>
  );
}