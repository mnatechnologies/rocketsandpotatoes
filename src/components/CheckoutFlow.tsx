
'use client';
/* eslint-disable */

import { useState, useEffect, useRef } from 'react';
import { KYCVerification } from './KYCVerification';
import { Product } from "@/types/product";
import { loadStripe } from '@stripe/stripe-js';
import { Elements  } from "@stripe/react-stripe-js";
import { PaymentForm } from './PaymentForm';
import { createLogger } from '@/lib/utils/logger'
import { SourceOfFundsForm } from './SourceOfFunds';


const logger = createLogger('CHECKOUT_FLOW')

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
  const [sourceOfFundsProvided, setSourceOfFundsProvided] = useState(false);
  const paymentIntentCreated = useRef(false);
  const hasValidated = useRef(false); // ✅ Add this

  useEffect(() => {
    // ✅ Add guard to prevent duplicate validation
    if (hasValidated.current) {
      logger.log('Already validated, skipping...');
      return;
    }

    logger.log('CheckoutFlow mounted', { customerId, amount, productDetails });
    hasValidated.current = true; // ✅ Mark as validated
    validateTransaction();
  }, []); //


  const validateTransaction = async () => {
    if (isValidating) {
      logger.log('Validation already in progress, skipping...');
      return;
    }

    logger.log('Starting transaction validation...');
    setIsValidating(true);

    try {
      const requestBody = { customerId, amount, productDetails };
      logger.log('Sending validation request:', requestBody);

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      logger.log('Validation response status:', response.status);

      const result = await response.json();
      logger.log('Validation result:', result);
      setValidationResult(result);

      if (result.status === 'kyc_required') {
        logger.log('KYC required - redirecting to KYC verification');
        setStep('kyc');
      } else if (result.status === 'requires_review') {
        logger.log('Transaction requires manual review');
        setStep('review');
      } else {
        logger.log('Transaction approved - proceeding to payment');
        await createPaymentIntent();
        setStep('payment');
      }
    } catch (error) {
      logger.error('Error during validation:', error);
    } finally {
      setIsValidating(false);
      logger.log('Validation complete');
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('kyc_status') === 'complete') {
      logger.log('Returned from KYC verification, re-validating...');

      // Clear the URL parameters to prevent re-triggering
      window.history.replaceState({}, '', '/checkout');

      // Wait a moment for any async processes to complete
      setTimeout(() => {
        validateTransaction();
      }, 1000);
    }
  }, []);

  useEffect(() => {
    const checkSourceOfFunds = async () => {
      if (amount >= 10000) {
        try {
          const response = await fetch(`/api/customer/source-of-funds?customerId=${customerId}`);
          const result = await response.json();

          if (result.success && result.data?.source_of_funds) {
            setSourceOfFundsProvided(true);
          }
        } catch (error) {
          console.error('Error checking source of funds:', error);
        }
      }
    };

    if (customerId) {
      checkSourceOfFunds();
    }
  }, [customerId, amount]);

  const createPaymentIntent = async () => {
    if (paymentIntentCreated.current) {
      logger.log('Payment intent already created, skipping...');
      return;
    }
    logger.log('Creating payment intent...');
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
      logger.log('Payment intent created:', data.paymentIntentId);
      setClientSecret(data.clientSecret);
      logger.log('Client secret:', data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);
    } catch (error) {
      logger.error('Error creating payment intent:', error);
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
    // Check if source of funds is needed but not provided
    if (amount >= 10000 && !sourceOfFundsProvided) {
      return (
        <SourceOfFundsForm
          customerId={customerId}
          amount={amount}
          onComplete={() => {
            setSourceOfFundsProvided(true);
            // Will automatically show payment form on next render
          }}
        />
      );
    }
  }

    if (step === 'payment') {
    if (!clientSecret) {
      return <div>Preparing payment...</div>;
    }

    if (step === 'payment' && clientSecret) {
      return (
          <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: 'stripe'
                }
              }}
              key={clientSecret} // Force re-render when clientSecret changes
          >
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

}