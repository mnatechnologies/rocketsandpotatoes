// INSPECT REACT-STRIPE-JS
'use client';
/* eslint-disable */

import { useState, useEffect } from 'react';
import { KYCVerification } from './KYCVerification';
import {Product} from "@/types/product";
import { loadStripe } from '@stripe/stripe-js';
// @ts-expect-error
import { Elements  } from "@stripe/react-stripe-js/src";
import { PaymentForm } from './PaymentForm';

// Testing flag - set to true to enable console logging
const TESTING_MODE = process.env.NEXT_PUBLIC_TESTING_MODE === 'true' || true;

function log(...args: any[]) {
  if (TESTING_MODE) {
    console.log('[CHECKOUT_FLOW]', ...args);
  }
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface Props {
  customerId: string;
  amount: number;
  productDetails: Product;
  cartItems?: any[];
  customerEmail?: string;
  onSuccess?: (orderId: string) => void;
}
export function CheckoutFlow({ customerId, amount, productDetails, cartItems, customerEmail, onSuccess }: Props) {
  const [step, setStep] = useState<'validate' | 'review' | 'kyc' | 'payment'>('validate');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  // Automatically trigger validation on component mount
  useEffect(() => {
    log('CheckoutFlow mounted', { customerId, amount, productDetails });
    validateTransaction();
  }, [customerId, amount, productDetails]);

  const validateTransaction = async () => {
    if (isValidating) {
      log('Validation already in progress, skipping...');
      return;
    }

    log('Starting transaction validation...');
    setIsValidating(true);

    try {
      const requestBody = { customerId, amount, productDetails };
      log('Sending validation request:', requestBody);

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      log('Validation response status:', response.status);

      const result = await response.json();
      log('Validation result:', result);
      setValidationResult(result);

      if (result.status === 'kyc_required') {
        log('KYC required - redirecting to KYC verification');
        setStep('kyc');
      } else if (result.status === 'requires_review') {
        log('Transaction requires manual review');
        setStep('review');
      } else {
        log('Transaction approved - proceeding to payment');
        await createPaymentIntent();
        setStep('payment');
      }
    } catch (error) {
      log('Error during validation:', error);
      // Optionally handle error state
    } finally {
      setIsValidating(false);
      log('Validation complete');
    }
  };

  const createPaymentIntent = async () => {
    log('Creating payment intent...');
    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency: 'aud',
          customerId,
          customerEmail,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const data = await response.json();
      log('Payment intent created:', data.paymentIntentId);
      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);
    } catch (error) {
      log('Error creating payment intent:', error);
      throw error;
    }
  };

  if (step === 'validate') {
    return <div>Validating transaction...</div>;
  }

  if (step === 'kyc') {
    return <KYCVerification customerId={customerId} />;
  }

  if (step === 'review') {
    return (
      <div className="max-w-md mx-auto p-6 bg-yellow-50 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Transaction Under Review</h2>
        <p className="text-gray-700">
          Your transaction has been flagged for manual review for compliance purposes.
          This typically takes 1-2 business days. We'll email you once approved.
        </p>
        {validationResult.flags && (
          <div className="mt-4 text-sm text-gray-600">
            <p>Reason: {
              validationResult.flags.structuring ? 'Multiple recent transactions detected' :
                validationResult.flags.highValue ? 'High-value transaction' :
                  'Routine compliance check'
            }</p>
          </div>
        )}
      </div>
    );
  }

  if (step === 'payment') {
    if (!clientSecret) {
      return <div>Preparing payment...</div>;
    }

    return (
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <PaymentForm
          amount={amount}
          customerId={customerId}
          productDetails={productDetails}
          cartItems={cartItems}
          paymentIntentId={paymentIntentId!}
          onSuccess={onSuccess}
        />
      </Elements>
    );
  }

  return <div>Processing...</div>;
}