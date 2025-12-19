
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


  const [step, setStep] = useState<'validate' | 'review' | 'kyc' | 'sof' | 'blocked'| 'payment'>('validate');
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
    const productId = item.product?.id || item.id;
    const lockedPrice = getLockedPriceForProduct(productId);
    const displayPrice = lockedPrice ?? (item.product?.price || item.price)

    return {
      ...item,
      id: productId,
      productId: productId,  // ✅ Add productId for backend consistency
      name: item.product?.name || item.name,
      price: displayPrice,
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
  // Use currency context for formatting (amount is already in selected currency)
  const { formatPrice, currency, convertPrice, exchangeRate, isLoadingRate } = useCurrency();

  // ✅ Amount is already in user's selected currency from locked prices
  // No conversion needed - locked prices store both USD and AUD
  const finalAmount = amount;

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
      } else if (result.status === 'sof_required') {
        setStep('sof');
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
      if (finalAmount >= 10000) {
        try {
          const response = await fetch(`/api/customer/source-of-funds?customerId=${customerId}`);
          const result = await response.json();

          if (result.success && result.data?.source_of_funds) {
            setSourceOfFundsProvided(true);
          }
        } catch (error) {
          logger.error('Error checking source of funds:', error);
        }
      }

      // Check EDD status for $50K+ AUD
      if (finalAmount >= EDD_THRESHOLD) {
        try {
          const response = await fetch(`/api/customer/enhanced-dd?customerId=${customerId}`);
          const result = await response.json();

          if (result.success && result.data?.eddCompleted) {
            setEddCompleted(true);
          }
        } catch (error) {
          logger.error('Error checking EDD status:', error);
        }
      }
    };

    if (customerId && finalAmount > 0) {
      checkComplianceStatus();
    }
  }, [customerId, finalAmount]);

  const createPaymentIntent = async () => {
    logger.log(finalAmount)
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
          amount: finalAmount,
          currency,
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

  if (step === 'sof') {
    return (
      <SourceOfFundsForm
        customerId={customerId}
        amount={finalAmount}
        onComplete={() => {
          logger.log('SOF completed, re-validating...');
          setSourceOfFundsProvided(true);
          // Re-validate to proceed to next step
          setTimeout(() => {
            validateTransaction();
          }, 500);
        }}
      />
    );
  }


  if (step === 'review') {
    if (validationResult?.reason === "screening error") {
      return (
        <div className="max-w-md mx-auto p-6 bg-red-50 rounded-lg border border-red-200">
          <h2 className="text-xl font-bold text-red-800 mb-4">Transaction Cannot Proceed</h2>
          <p className="text-red-700">
            {`Your transaction requires additional verification for AUSTRAC Compliance purposes. Our compliance team will contact you within 1-2 business days. Please contact support if you need help with something urgent. We apologize for the inconvenience.`}
          </p>
        </div>
      )
    }
    const needsEDD = validationResult?.requirements?.requiresEnhancedDD && !eddCompleted;
    const needsSOF = validationResult?.requirements?.requiresTTR && !sourceOfFundsProvided;

    // ✅ Get backend-calculated AUD amount for consistency
    const backendAmountAUD = validationResult?.requirements?.newCumulativeTotal
      ? (validationResult.requirements.newCumulativeTotal - validationResult.requirements.cumulativeTotal)
      : finalAmount;

    // ✅ Show both forms if both are required
    if (needsEDD || needsSOF) {
      return (
        <div className="max-w-2xl mx-auto p-6 space-y-6">
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
            <div className="text-center mb-4">
              <div className="text-5xl mb-2">📋</div>
              <h2 className="text-2xl font-bold text-blue-800">Additional Information Required</h2>
            </div>

            <div className="space-y-4">
              <p className="text-gray-700">
                This transaction: <strong>${backendAmountAUD.toFixed(2)} AUD</strong>
              </p>
              <p className="text-gray-700">
                Your cumulative total {needsEDD ? 'has reached' : 'will be'}: <strong>${validationResult.requirements?.newCumulativeTotal?.toFixed(2)} AUD</strong>
              </p>
              {needsEDD && (
                <p className="text-gray-700">
                  ✓ Enhanced due diligence is required for cumulative totals over <strong>$50,000 AUD</strong>
                </p>
              )}
              {needsSOF && (
                <p className="text-gray-700">
                  ✓ Source of funds verification is required for transactions over <strong>$10,000 AUD</strong>
                </p>
              )}
              <p className="text-gray-700 font-semibold">
                Please complete the {needsEDD && needsSOF ? 'forms' : 'form'} below to continue.
              </p>
            </div>
          </div>

          {/* Source of Funds Form - Show first as it's simpler */}
          {needsSOF && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                1. Source of Funds Declaration
              </h3>
              <SourceOfFundsForm
                customerId={customerId}
                amount={backendAmountAUD}
                onComplete={() => {
                  setSourceOfFundsProvided(true);
                  // If EDD not required, re-validate after SOF
                  if (!needsEDD) {
                    setTimeout(() => validateTransaction(), 1000);
                  }
                }}
              />
            </div>
          )}

          {/* Enhanced Due Diligence Form */}
          {needsEDD && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {needsSOF ? '2. Enhanced Due Diligence' : 'Enhanced Due Diligence'}
              </h3>
              <EnhancedDueDiligenceForm
                customerId={customerId}
                amount={backendAmountAUD}
                onComplete={() => {
                  setEddCompleted(true);
                  // Re-validate after EDD completion
                  setTimeout(() => validateTransaction(), 1000);
                }}
              />
            </div>
          )}
        </div>
      );
    }

    // ✅ Only show "wait for review" if it's actual risk flagging, not missing compliance
    const reasons = [];
    if (validationResult?.flags?.structuring) reasons.push('Potential structuring detected');
    if (validationResult?.flags?.highRisk) reasons.push('High risk assessment');
    if (validationResult?.flags?.multipleRecentTransactions) reasons.push('Multiple recent transactions detected');
    if (validationResult?.flags?.highValue && !needsEDD) reasons.push('High-value transaction requiring review');

    return (
      <div className="max-w-md mx-auto p-6 bg-yellow-50 rounded-lg border border-yellow-200">
        <div className="text-center mb-4">
          <div className="text-5xl mb-2">⏳</div>
          <h2 className="text-2xl font-bold text-yellow-800">Transaction Under Review</h2>
        </div>

        <div className="space-y-4">
          <p className="text-gray-700">
            {/* ✅ Use backend-calculated AUD amount (no double conversion) */}
            Your transaction of <strong>${backendAmountAUD.toFixed(2)} AUD</strong> has been flagged for manual compliance review.
          </p>

          {validationResult?.requirements?.newCumulativeTotal && (
            <p className="text-sm text-gray-600">
              Cumulative total: <strong>${validationResult.requirements.newCumulativeTotal.toFixed(2)} AUD</strong>
            </p>
          )}

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
    const blockReason = validationResult?.reason;

    // Show EDD form if blocked due to EDD investigation
    if (blockReason === 'edd_investigation_required') {
      return (
        <EnhancedDueDiligenceForm
          customerId={customerId}
          amount={finalAmount}
          onComplete={() => {
            // After EDD submission, the investigation status screen will show
            // Customer stays blocked until admin approves
          }}
        />
      );
    }

    // Show account blocked message
    if (blockReason === 'account_blocked') {
      return (
        <div className="max-w-md mx-auto p-6 bg-red-50 rounded-lg border border-red-200">
          <h2 className="text-xl font-bold text-red-800 mb-4">Account Blocked</h2>
          <p className="text-red-700 mb-4">
            {validationResult?.message || 'Your account has been blocked. Please contact our compliance team for further information.'}
          </p>
          <p className="text-sm text-red-600">
            If you believe this is an error, please contact support.
          </p>
        </div>
      );
    }

    // Show pending review message
    if (blockReason === 'pending_review') {
      return (
        <div className="max-w-md mx-auto p-6 bg-amber-50 rounded-lg border border-amber-200">
          <h2 className="text-xl font-bold text-amber-800 mb-4">Transaction Under Review</h2>
          <p className="text-amber-700 mb-4">
            {validationResult?.message || 'You have a transaction pending review. Our compliance team will contact you once the review is complete.'}
          </p>
          {validationResult?.existingTransaction && (
            <div className="bg-amber-100 rounded p-3 text-sm text-amber-800">
              <p><strong>Transaction ID:</strong> {validationResult.existingTransaction.id}</p>
              <p className="mt-1"><strong>Submitted:</strong> {new Date(validationResult.existingTransaction.createdAt).toLocaleString()}</p>
            </div>
          )}
          <p className="text-sm text-amber-600 mt-4">
            Please do not attempt additional transactions while your current transaction is under review.
          </p>
        </div>
      );
    }

    // Generic blocked message (fallback)
    return (
      <div className="max-w-md mx-auto p-6 bg-red-50 rounded-lg border border-red-200">
        <h2 className="text-xl font-bold text-red-800 mb-4">Transaction Cannot Proceed</h2>
        <p className="text-red-700">
          {validationResult?.message || 'Your transaction requires additional verification. Our compliance team will contact you within 1-2 business days.'}
        </p>
      </div>
    );
  }

  if (step === 'payment') {
    const needsEDD = validationResult?.requirements?.requiresEnhancedDD && !eddCompleted;
    const needsSOF = validationResult?.requirements?.requiresTTR && !sourceOfFundsProvided;
    // Check if source of funds is needed but not provided (for $10K+ AUD)
    if (needsSOF) {
      return (
        <SourceOfFundsForm
          customerId={customerId}
          amount={finalAmount}
          onComplete={() => {
            setSourceOfFundsProvided(true);
          }}
        />
      );
    }

    // Check if EDD is needed but not completed (for $50K+ AUD)
    if (needsEDD) {
      return (
        <EnhancedDueDiligenceForm
          customerId={customerId}
          amount={finalAmount}
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
          amount={finalAmount}
          currency={currency}
          customerId={customerId}
          productDetails={productDetails}
          cartItems={cartItemsWithLockedPrices}
          paymentIntentId={paymentIntentId!}
          onSuccess={onSuccess}
          sessionId={sessionId}  // ✅ Pass sessionId
        />
      </Elements>
    );
  }

  return <div>Processing...</div>;
}