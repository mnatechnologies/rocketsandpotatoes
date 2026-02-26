'use client';

import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { toast } from 'sonner';
import { ArrowLeft, Shield } from 'lucide-react';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('BANK_TRANSFER_HOLD_FORM');

interface BankTransferHoldFormProps {
  bankTransferOrderId: string;
  paymentIntentId: string;
  depositAmountAud: number;
  orderTotalAud: number;
  onSuccess: (orderId: string) => void;
  onBack: () => void;
}

export function BankTransferHoldForm({
  bankTransferOrderId,
  paymentIntentId,
  depositAmountAud,
  orderTotalAud,
  onSuccess,
  onBack,
}: BankTransferHoldFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPaymentElementReady, setIsPaymentElementReady] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    logger.log('Hold form submitted');

    if (!stripe || !elements || !isPaymentElementReady) {
      logger.log('Stripe not ready yet');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Confirm the card auth hold with Stripe
      logger.log('Confirming card authorization hold...');
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout`,
        },
        redirect: 'if_required',
      });

      if (stripeError) {
        logger.error('Stripe hold error:', stripeError);
        setError(stripeError.message || 'Card authorization failed');
        setIsProcessing(false);
        return;
      }

      // For manual capture, status will be 'requires_capture' after successful auth
      if (paymentIntent?.status === 'requires_capture') {
        logger.log('Card authorized, confirming hold with backend...');

        const confirmResponse = await fetch('/api/bank-transfer/confirm-hold', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bankTransferOrderId,
            paymentIntentId,
          }),
        });

        if (!confirmResponse.ok) {
          const data = await confirmResponse.json();
          throw new Error(data.error || 'Failed to confirm hold');
        }

        const confirmData = await confirmResponse.json();
        logger.log('Hold confirmed:', confirmData);

        toast.success('Security deposit authorized. You will receive bank transfer instructions shortly.');
        onSuccess(bankTransferOrderId);
      } else {
        logger.log('Unexpected payment intent status:', paymentIntent?.status);
        setError('Card authorization was not completed. Please try again.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred during authorization';
      logger.error('Error during hold confirmation:', err);
      setError(message);
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        disabled={isProcessing}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to payment method selection
      </button>

      {/* Deposit info */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-1">
              Security Deposit
            </h4>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 mb-2">
              A${depositAmountAud.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-400">
              This is a temporary authorization hold on your card, not a charge.
              It will be released automatically when your bank transfer is received.
            </p>
          </div>
        </div>
      </div>

      {/* Order total reminder */}
      <div className="flex justify-between items-center text-sm text-muted-foreground border-b border-border pb-3">
        <span>Order total (bank transfer amount)</span>
        <span className="font-semibold text-foreground">
          A${orderTotalAud.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>

      {/* Card details for hold */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Card Details for Security Deposit</h3>
        <PaymentElement onReady={() => setIsPaymentElementReady(true)} />
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
          <p className="text-destructive-foreground font-medium">Authorization Error</p>
          <p className="text-destructive-foreground text-sm mt-1">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || !isPaymentElementReady || isProcessing}
        className="w-full py-3 bg-primary text-primary-foreground hover:opacity-90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed font-bold rounded-lg transition-opacity"
      >
        {isProcessing
          ? 'Authorizing...'
          : `Authorize A$${depositAmountAud.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Security Deposit`}
      </button>

      <p className="text-xs text-muted-foreground text-center">
        This authorization hold is temporary. Your card will not be charged unless the market loss policy applies.
        Payment is secured by Stripe.
      </p>
    </form>
  );
}
