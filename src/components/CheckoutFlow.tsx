
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
import { EnhancedDueDiligenceForm } from './EnhancedDueDiligence';
import { useCurrency } from '@/contexts/CurrencyContext';
import {useCart} from "@/contexts/CartContext";


const logger = createLogger('CHECKOUT_FLOW')

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// EDD threshold
const EDD_THRESHOLD = 50000;

interface Props {
  customerId: string;
  amount: number;
  productDetails: Product;
  cartItems?: any[];
  customerEmail?: string;
  onSuccess?: (orderId: string) => void;
  sessionId: string | null;
}
export function CheckoutFlow({ customerId, amount, productDetails, cartItems, customerEmail, onSuccess, sessionId }: Props) {
  const { getLockedPriceForProduct } = useCart();


  const [step, setStep] = useState<'validate' | 'review' | 'kyc' | 'blocked'| 'payment'>('validate');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [sourceOfFundsProvided, setSourceOfFundsProvided] = useState(false);
  const [eddCompleted, setEddCompleted] = useState(false);
  const paymentIntentCreated = useRef(false);
  const paymentIntentAmount = useRef<number>(0)
  const hasValidated = useRef(false);

  const cartItemsWithLockedPrices = cartItems?.map(item => {
    const lockedPrice = getLockedPriceForProduct(item.product?.id || item.id);
    const displayPrice = lockedPrice ?? (item.product?.price || item.price)

    return {
      ...item,
      id: item.product?.id || item.id,
      name: item.product?.name || item.name,
      price: displayPrice, // ✅ Use locked price
      originalPrice: item.product?.price || item.price,
      lockedPrice: lockedPrice,
      quantity: item.quantity || 1,
      weight: item.product?.weight || item.weight,
      purity: item.product?.purity || item.purity,
      metal_type: item.product?.metal_type || item.metal_type,
      image_url: item.product?.image_url || item.image_url,
      totalPrice: displayPrice * (item.quantity || 1),
    }
  })
  // Use currency context for formatting and conversion
  const { formatPrice, currency, convertPrice, exchangeRate, isLoadingRate } = useCurrency();

  // Calculate amount in AUD for threshold checks using context
  const amountInAUD = currency === 'AUD'
    ? amount
    : amount * exchangeRate; // exchangeRate is USD->AUD when currency is AUD

  const getAmountInAUDForThresholds = () => {
    if (currency === 'AUD') {
      return amount;
    }
    // If in USD, we need USD->AUD rate (approximately 1.57)
    // The context provides the rate for the selected currency
    // For threshold checks, fetch AUD equivalent
    return amount * 1.57; // Fallback rate, or you could fetch dynamically
  };

  const thresholdAmountAUD = getAmountInAUDForThresholds();

  useEffect(() => {
    // Add guard to prevent duplicate validation
    if (hasValidated.current) {
      logger.log('Already validated, skipping...');
      return;
    }

    logger.log('CheckoutFlow mounted', { customerId, amount, productDetails });
    hasValidated.current = true;
    validateTransaction();
  }, []);

  const validateTransaction = async () => {
    if (isValidating) {
      logger.log('Validation already in progress, skipping...');
      return;
    }

    logger.log('Starting transaction validation...');
    setIsValidating(true);

    try {
      const requestBody = { customerId, amount, currency, productDetails, cartItems:cartItemsWithLockedPrices, sessionId };
      logger.log('Sending validation request:', requestBody);

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      logger.log('Validation response status:', response.status);

      const result = await response.json();
      setValidationResult(result);

      if (!response.ok) {
        if (result.status === 'blocked') {
          setStep('blocked');
          return;
        }
        setStep('review');
        return;
      }

      if (result.status === 'kyc_required') {
        setStep('kyc');
      } else if (result.status === 'requires_review' || result.status === 'screening_error') {
        setStep('review');
      } else if (result.status === 'approved') {
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
      window.history.replaceState({}, '', '/checkout');
      setTimeout(() => {
        validateTransaction();
      }, 1000);
    }
  }, []);

  useEffect(() => {
    const checkComplianceStatus = async () => {
      // Check source of funds for $10K+ AUD
      if (thresholdAmountAUD >= 10000) {
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

      // Check EDD status for $50K+ AUD
      if (thresholdAmountAUD >= EDD_THRESHOLD) {
        try {
          const response = await fetch(`/api/customer/enhanced-dd?customerId=${customerId}`);
          const result = await response.json();

          if (result.success && result.data?.eddCompleted) {
            setEddCompleted(true);
          }
        } catch (error) {
          console.error('Error checking EDD status:', error);
        }
      }
    };

    if (customerId && thresholdAmountAUD > 0) {
      checkComplianceStatus();
    }
  }, [customerId, thresholdAmountAUD]);

  const createPaymentIntent = async () => {
    const newsNewIntent = !paymentIntentCreated.current || paymentIntentAmount.current !== amount;

    if (!newsNewIntent) {
      logger.log('Payment intent already created with same amount, skipping...');
      return;
    }
    if (paymentIntentCreated.current && paymentIntentAmount.current !== amount){
      logger.log('Cart Amount changed, creating new payment intent...', {

      })
    }
    logger.log('Creating payment intent...');
    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency: currency.toLowerCase(),
          customerId,
          customerEmail,
          sessionId,
          cartItems: cartItems?.map(item => ({ productId: item.product.id, quantity: item.quantity })),
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

  if (!sessionId) {
    return <div>Initializing session...</div>;
  }

  if (step === 'validate') {
    return <div>Validating transaction...</div>;
  }

  if (step === 'kyc') {
    return <KYCVerification customerId={customerId} />;
  }

  if (step === 'review') {
    // ✅ Build detailed reason message
    const reasons = [];
    if (validationResult?.flags?.structuring) reasons.push('Potential structuring detected');
    if (validationResult?.flags?.highRisk) reasons.push('High risk assessment');
    if (validationResult?.flags?.multipleRecentTransactions) reasons.push('Multiple recent transactions detected');
    if (validationResult?.flags?.highValue) reasons.push('High-value transaction requiring enhanced due diligence');

    return (
      <div className="max-w-md mx-auto p-6 bg-yellow-50 rounded-lg border border-yellow-200">
        <div className="text-center mb-4">
          <div className="text-5xl mb-2">⏳</div>
          <h2 className="text-2xl font-bold text-yellow-800">Transaction Under Review</h2>
        </div>

        <div className="space-y-4">
          <p className="text-gray-700">
            Your transaction of <strong>{formatPrice(amount)} {currency}</strong> (approximately <strong>${thresholdAmountAUD.toFixed(2)} AUD</strong>) has been flagged for manual compliance review.
          </p>

          {reasons.length > 0 && (
            <div className="bg-white p-4 rounded border border-yellow-300">
              <p className="font-semibold text-gray-800 mb-2">Review Reasons:</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                {reasons.map((reason, index) => (
                  <li key={index}>{reason}</li>
                ))}
              </ul>
            </div>
          )}

          {validationResult?.riskScore && (
            <div className="text-sm text-gray-600">
              <p>Risk Assessment: <span className="font-semibold capitalize">{validationResult.riskLevel}</span></p>
              <p>Risk Score: {validationResult.riskScore}/100</p>
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>What happens next?</strong>
            </p>
            <ul className="text-sm text-blue-700 mt-2 space-y-1">
              <li>• Our compliance team will review your transaction within 1-2 business days</li>
              <li>• You&apos;ll receive an email notification once the review is complete</li>
              <li>• No payment has been processed yet</li>
            </ul>
          </div>

          <p className="text-xs text-gray-500 text-center">
            This review is a standard compliance procedure required by Australian regulations.
          </p>
        </div>
      </div>
    );
  }

  if (step === 'blocked') {
    return (
      <div className="max-w-md mx-auto p-6 bg-red-50 rounded-lg border border-red-200">
        <h2 className="text-xl font-bold text-red-800 mb-4">Transaction Cannot Proceed</h2>
        <p className="text-red-700">
          Your transaction requires additional verification.
          Our compliance team will contact you within 1-2 business days.
        </p>
      </div>
    );
  }

  if (step === 'payment') {
    // Check if source of funds is needed but not provided (for $10K+ AUD)
    if (thresholdAmountAUD >= 10000 && !sourceOfFundsProvided) {
      return (
        <SourceOfFundsForm
          customerId={customerId}
          amount={thresholdAmountAUD}
          onComplete={() => {
            setSourceOfFundsProvided(true);
          }}
        />
      );
    }

    // Check if EDD is needed but not completed (for $50K+ AUD)
    if (thresholdAmountAUD >= EDD_THRESHOLD && !eddCompleted) {
      return (
        <EnhancedDueDiligenceForm
          customerId={customerId}
          amount={thresholdAmountAUD}
          onComplete={() => {
            setEddCompleted(true);
          }}
        />
      );
    }

    if (!clientSecret) {
      return <div>Preparing payment...</div>;
    }

    return (
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: {
            theme: 'stripe'
          }
        }}
        key={clientSecret}
      >
        <PaymentForm
          amount={amount}
          currency={currency}
          customerId={customerId}
          productDetails={productDetails}
          cartItems={cartItemsWithLockedPrices}
          paymentIntentId={paymentIntentId!}
          onSuccess={onSuccess}
        />
      </Elements>
    );
  }

  return <div>Processing...</div>;
}