
'use client';
/* eslint-disable */

import { useState, useEffect, useRef } from 'react';
import { KYCVerification } from './KYCVerification';
import { Product } from "@/types/product";
import { loadStripe } from '@stripe/stripe-js';
import { Elements  } from "@stripe/react-stripe-js";
import { PaymentForm } from './PaymentForm';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { BankTransferHoldForm } from './BankTransferHoldForm';
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


  const [step, setStep] = useState<'validate' | 'review' | 'kyc' | 'sof' | 'blocked' | 'business_verification' | 'payment_method' | 'payment' | 'bank_transfer_hold' | 'coming_soon'>('validate');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [sourceOfFundsProvided, setSourceOfFundsProvided] = useState(false);
  const [eddCompleted, setEddCompleted] = useState(false);
  const paymentIntentCreated = useRef(false);
  const paymentIntentAmount = useRef<number>(0)
  const hasValidated = useRef(false);
  const [eddInvestigation, setEddInvestigation] = useState<any>(null);


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
        if (result.status === 'coming_soon') {
          setStep('coming_soon');
          return;
        }
        if (result.status === 'blocked') {
          setStep('blocked');
          return;
        }
        if (result.status === 'business_verification_required') {
          setStep('business_verification');
          return;
        }
        setStep('review');
        return;
      }

      if (result.status === 'coming_soon') {
        setStep('coming_soon');
      } else if (result.status === 'kyc_required') {
        setStep('kyc');
      } else if (result.status === 'sof_required') {
        setStep('sof');
      } else if (result.status === 'requires_review' || result.status === 'screening_error') {
        setStep('review');
      } else if (result.status === 'business_verification_required') {
        setStep('business_verification');
      } else if (result.status === 'approved') {
        setStep('payment_method');
      }
    } catch (error) {
      logger.error('Error during validation:', error);
    } finally {
      setIsValidating(false);
      logger.log('Validation complete');
    }
  };

  const needsEDD = validationResult?.requirements?.showEDDForm || (validationResult?.requirements?.requiresEnhancedDD && !eddCompleted);
  const needsSOF = validationResult?.requirements?.requiresTTR && !sourceOfFundsProvided;

  useEffect(() => {
    const fetchInvestigation = async () => {
      if (needsEDD && customerId) {
        try {
          const response = await fetch(`/api/customer/edd-investigation-status?customerId=${customerId}`);
          if (response.ok) {
            const data = await response.json();
            setEddInvestigation(data.investigation);
          }
        } catch (error) {
          console.error('Error fetching investigation:', error);
        }
      }
    };
    fetchInvestigation();
  }, [needsEDD, customerId]);

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
    
      // Check EDD status for $50K+ AUD (convert to AUD if user is viewing in USD)
      const amountInAUD = currency === 'AUD' ? finalAmount : finalAmount * exchangeRate;
      if (amountInAUD >= EDD_THRESHOLD) {
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
        <div className="max-w-md mx-auto p-6 bg-red-500/10 rounded-lg border border-red-500/20">
          <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">Transaction Cannot Proceed</h2>
          <p className="text-red-600 dark:text-red-400">
            {`Your transaction requires additional verification for AUSTRAC Compliance purposes. Our compliance team will contact you within 1-2 business days. Please contact support if you need help with something urgent. We apologize for the inconvenience.`}
          </p>
        </div>
      )
    }



    // ✅ Get backend-calculated AUD amount for consistency
    const backendAmountAUD = validationResult?.requirements?.newCumulativeTotal
      ? (validationResult.requirements.newCumulativeTotal - validationResult.requirements.cumulativeTotal)
      : finalAmount;

    // ✅ Show both forms if both are required
    if (needsEDD || needsSOF) {
      return (
        <div className="max-w-2xl mx-auto p-6 space-y-6">
          <div className="bg-blue-500/10 rounded-lg border border-blue-500/20 p-6">
            <div className="text-center mb-4">
              <div className="text-5xl mb-2">📋</div>
              <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400">Additional Information Required</h2>
            </div>

            <div className="space-y-4">
              <p className="text-foreground/80">
                This transaction: <strong>${backendAmountAUD.toFixed(2)} AUD</strong>
              </p>
              <p className="text-foreground/80">
                Your cumulative total {needsEDD ? 'has reached' : 'will be'}: <strong>${validationResult.requirements?.newCumulativeTotal?.toFixed(2)} AUD</strong>
              </p>
              {needsEDD && (
                  <p className="text-foreground/80">
                    {eddInvestigation?.trigger_reason ? (
                        <>✓ {eddInvestigation.trigger_reason}</>
                    ) : validationResult.requirements?.newCumulativeTotal >= 50000 ? (
                        <>✓ Enhanced due diligence is required for cumulative totals over <strong>$50,000 AUD</strong></>
                    ) : (
                        <>✓ Enhanced due diligence is required to complete this transaction</>
                    )}
                  </p>
              )}
              {needsSOF && (
                <p className="text-foreground/80">
                  ✓ Source of funds verification is required for transactions over <strong>$10,000 AUD</strong>
                </p>
              )}
              <p className="text-foreground/80 font-semibold">
                Please complete the {needsEDD && needsSOF ? 'forms' : 'form'} below to continue.
              </p>
            </div>
          </div>

          {/* Source of Funds Form - Show first as it's simpler */}
          {needsSOF && (
            <div className="bg-card rounded-lg shadow-card p-6">
              <h3 className="text-xl font-bold text-foreground mb-4">
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
            <div className="bg-card rounded-lg shadow-card p-6">
              <h3 className="text-xl font-bold text-foreground mb-4">
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
      <div className="max-w-md mx-auto p-6 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
        <div className="text-center mb-4">
          <div className="text-5xl mb-2">⏳</div>
          <h2 className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">Transaction Under Review</h2>
        </div>

        <div className="space-y-4">
          <p className="text-foreground/80">
            {/* Use backend-calculated AUD amount (no double conversion) */}
            Your transaction of <strong>${backendAmountAUD.toFixed(2)} AUD</strong> has been flagged for manual compliance review.
          </p>

          {validationResult?.requirements?.newCumulativeTotal && (
            <p className="text-sm text-muted-foreground">
              Cumulative total: <strong>${validationResult.requirements.newCumulativeTotal.toFixed(2)} AUD</strong>
            </p>
          )}

          {reasons.length > 0 && (
            <div className="bg-card p-4 rounded-lg border border-yellow-500/30">
              <p className="font-semibold text-foreground mb-2">Review Reasons:</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-foreground/80">
                {reasons.map((reason, index) => (
                  <li key={index}>{reason}</li>
                ))}
              </ul>
            </div>
          )}

          {validationResult?.riskScore && (
            <div className="text-sm text-muted-foreground">
              <p>Risk Assessment: <span className="font-semibold capitalize">{validationResult.riskLevel}</span></p>
              <p>Risk Score: {validationResult.riskScore}/100</p>
            </div>
          )}

          <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
            <p className="text-sm text-blue-600 dark:text-blue-400">
              <strong>What happens next?</strong>
            </p>
            <ul className="text-sm text-blue-600 dark:text-blue-400 mt-2 space-y-1">
              <li>• Our compliance team will review your transaction within 1-2 business days</li>
              <li>• You&apos;ll receive an email notification once the review is complete</li>
              <li>• No payment has been processed yet</li>
            </ul>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            This review is a standard compliance procedure required by Australian regulations.
          </p>
        </div>
      </div>
    );
  }



  if (step === 'business_verification') {
    return (
      <div className="max-w-md mx-auto p-6 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
        <div className="text-center mb-4">
          <div className="text-5xl mb-2">🏢</div>
          <h2 className="text-xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">Business Verification Required</h2>
        </div>

        <div className="space-y-4 text-yellow-600 dark:text-yellow-400">
          <p className="font-semibold">
            Your business account needs to be verified before you can make purchases.
          </p>

          <div className="bg-card rounded-lg p-4 text-sm text-foreground/80">
            <p className="font-semibold mb-2">What's needed:</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 dark:text-yellow-400">•</span>
                <span>ABN verification</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 dark:text-yellow-400">•</span>
                <span>Beneficial owner identification (25%+ ownership)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 dark:text-yellow-400">•</span>
                <span>Identity verification for all beneficial owners</span>
              </li>
            </ul>
          </div>

          <p className="text-sm">
            This is a one-time process required for AUSTRAC compliance. Once completed, you'll be able to make purchases immediately.
          </p>

          <button
            onClick={() => window.location.href = '/onboarding/business'}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Complete Business Verification
          </button>

          <p className="text-xs text-center text-muted-foreground">
            Estimated time: 5-10 minutes
          </p>
        </div>
      </div>
    );
  }

  if (step === 'coming_soon') {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-gradient-to-br from-primary/5 to-background rounded-2xl border-2 border-primary/20 shadow-lg">
        <div className="text-center mb-6">
          <div className="text-7xl mb-4">🚀</div>
          <h2 className="text-3xl font-bold text-foreground mb-3">Coming Soon</h2>
          <div className="w-24 h-1 bg-primary mx-auto rounded-full mb-4"></div>
        </div>

        <div className="space-y-6 text-center">
          <p className="text-xl font-semibold text-foreground">
            We're preparing to launch!
          </p>

          <p className="text-lg text-muted-foreground leading-relaxed">
            Australian National Bullion is currently finalizing our systems to ensure a secure and seamless experience for our customers. Our checkout will be available very soon.
          </p>

          <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
            <p className="font-semibold text-foreground mb-3">In the meantime:</p>
            <ul className="space-y-3 text-left text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="text-primary text-xl">✓</span>
                <span>Browse our full range of precious metals products</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary text-xl">✓</span>
                <span>View live market pricing updated every 5 minutes</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary text-xl">✓</span>
                <span>Learn about our AUSTRAC-compliant processes</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary text-xl">✓</span>
                <span>Contact us with any questions about our products</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <button
              onClick={() => window.location.href = '/products'}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-8 rounded-xl transition-colors text-lg"
            >
              Browse Products
            </button>
            <button
              onClick={() => window.location.href = '/contact'}
              className="bg-muted hover:bg-muted/80 text-foreground font-bold py-3 px-8 rounded-xl border border-border transition-colors text-lg"
            >
              Contact Us
            </button>
          </div>

          <p className="text-sm text-muted-foreground pt-4">
            Thank you for your patience as we prepare to serve you.
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
        <div className="max-w-md mx-auto p-6 bg-red-500/10 rounded-lg border border-red-500/20">
          <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">Account Blocked</h2>
          <p className="text-red-600 dark:text-red-400 mb-4">
            {validationResult?.message || 'Your account has been blocked. Please contact our compliance team for further information.'}
          </p>
          <p className="text-sm text-red-600/80 dark:text-red-400/80">
            If you believe this is an error, please contact support.
          </p>
        </div>
      );
    }

    // Show pending review message
    if (blockReason === 'pending_review') {
      return (
        <div className="max-w-md mx-auto p-6 bg-amber-500/10 rounded-lg border border-amber-500/20">
          <h2 className="text-xl font-bold text-amber-600 dark:text-amber-400 mb-4">Transaction Under Review</h2>
          <p className="text-amber-600 dark:text-amber-400 mb-4">
            {validationResult?.message || 'You have a transaction pending review. Our compliance team will contact you once the review is complete.'}
          </p>
          {validationResult?.existingTransaction && (
            <div className="bg-amber-500/10 rounded-lg p-3 text-sm text-amber-600 dark:text-amber-400">
              <p><strong>Transaction ID:</strong> {validationResult.existingTransaction.id}</p>
              <p className="mt-1"><strong>Submitted:</strong> {new Date(validationResult.existingTransaction.createdAt).toLocaleString()}</p>
            </div>
          )}
          <p className="text-sm text-amber-600/80 dark:text-amber-400/80 mt-4">
            Please do not attempt additional transactions while your current transaction is under review.
          </p>
        </div>
      );
    }

    // Generic blocked message (fallback)
    return (
      <div className="max-w-md mx-auto p-6 bg-red-500/10 rounded-lg border border-red-500/20">
        <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">Transaction Cannot Proceed</h2>
        <p className="text-red-600 dark:text-red-400">
          {validationResult?.message || 'Your transaction requires additional verification. Our compliance team will contact you within 1-2 business days.'}
        </p>
      </div>
    );
  }

  if (step === 'payment_method') {
    // Calculate AUD amount for the selector
    const amountAud = currency === 'AUD' ? finalAmount : finalAmount * exchangeRate;

    return (
      <PaymentMethodSelector
        onSelect={async (method) => {
          if (method === 'card') {
            logger.log('Card payment selected, creating payment intent...');
            await createPaymentIntent();
            setStep('payment');
          } else {
            logger.log('Bank transfer selected');
            setStep('bank_transfer_hold');
          }
        }}
        orderTotalAud={amountAud}
        depositPercentage={10}
      />
    );
  }

  if (step === 'bank_transfer_hold') {
    const amountAud = currency === 'AUD' ? finalAmount : finalAmount * exchangeRate;

    return (
      <BankTransferHoldFormWrapper
        sessionId={sessionId!}
        customerId={customerId}
        customerEmail={customerEmail || ''}
        cartItems={cartItemsWithLockedPrices || []}
        currency={currency}
        amount={finalAmount}
        orderTotalAud={amountAud}
        onSuccess={(orderId) => {
          logger.log('Bank transfer hold successful, redirecting to invoice...');
          window.location.href = `/order/${orderId}/invoice`;
        }}
        onBack={() => setStep('payment_method')}
      />
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


/**
 * Wrapper that calls create-order to get the Stripe clientSecret,
 * then renders Elements + BankTransferHoldForm.
 */
interface BankTransferHoldFormWrapperProps {
  sessionId: string;
  customerId: string;
  customerEmail: string;
  cartItems: any[];
  currency: string;
  amount: number;
  orderTotalAud: number;
  onSuccess: (orderId: string) => void;
  onBack: () => void;
}

function BankTransferHoldFormWrapper({
  sessionId,
  customerId,
  customerEmail,
  cartItems,
  currency,
  amount,
  orderTotalAud,
  onSuccess,
  onBack,
}: BankTransferHoldFormWrapperProps) {
  const [holdClientSecret, setHoldClientSecret] = useState<string | null>(null);
  const [holdOrderId, setHoldOrderId] = useState<string | null>(null);
  const [holdPaymentIntentId, setHoldPaymentIntentId] = useState<string | null>(null);
  const [holdDepositAmountAud, setHoldDepositAmountAud] = useState<number>(0);
  const [holdOrderTotalAud, setHoldOrderTotalAud] = useState<number>(orderTotalAud);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const orderCreated = useRef(false);

  useEffect(() => {
    if (orderCreated.current) return;
    orderCreated.current = true;

    const createOrder = async () => {
      try {
        const response = await fetch('/api/bank-transfer/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            customerId,
            clerkUserId: customerId,
            customerEmail,
            cartItems: cartItems.map((item: any) => ({
              productId: item.productId || item.id,
              quantity: item.quantity,
              name: item.name,
            })),
            currency,
            amount,
            marketLossPolicyAccepted: true,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to create bank transfer order');
        }

        const data = await response.json();
        setHoldClientSecret(data.clientSecret);
        setHoldOrderId(data.bankTransferOrderId);
        setHoldPaymentIntentId(data.paymentIntentId);
        setHoldDepositAmountAud(data.depositAmountAud);
        if (data.orderTotalAud) setHoldOrderTotalAud(data.orderTotalAud);
      } catch (err: any) {
        setError(err.message || 'Failed to set up bank transfer order');
      } finally {
        setIsLoading(false);
      }
    };

    createOrder();
  }, [sessionId, customerId, customerEmail, cartItems, currency, amount]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">Setting up your bank transfer order...</p>
      </div>
    );
  }

  if (error || !holdClientSecret || !holdOrderId || !holdPaymentIntentId) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
          <p className="text-destructive-foreground font-medium">Setup Error</p>
          <p className="text-destructive-foreground text-sm mt-1">
            {error || 'Failed to initialize bank transfer order. Please try again.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Back to payment method selection
        </button>
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret: holdClientSecret,
        appearance: { theme: 'stripe' },
      }}
      key={holdClientSecret}
    >
      <BankTransferHoldForm
        bankTransferOrderId={holdOrderId}
        paymentIntentId={holdPaymentIntentId}
        depositAmountAud={holdDepositAmountAud}
        orderTotalAud={holdOrderTotalAud}
        onSuccess={onSuccess}
        onBack={onBack}
      />
    </Elements>
  );
}