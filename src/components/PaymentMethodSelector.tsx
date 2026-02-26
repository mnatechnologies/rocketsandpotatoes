'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Building, Loader2, Shield } from 'lucide-react';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('PAYMENT_METHOD_SELECTOR');

interface PaymentMethodSelectorProps {
  onSelect: (method: 'card' | 'bank_transfer') => void;
  orderTotalAud: number;
  depositPercentage: number;
}

export function PaymentMethodSelector({
  onSelect,
  orderTotalAud,
  depositPercentage,
}: PaymentMethodSelectorProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [bankTransferEnabled, setBankTransferEnabled] = useState(false);
  const [actualDepositPercentage, setActualDepositPercentage] = useState(depositPercentage);
  const [marketLossAccepted, setMarketLossAccepted] = useState(false);
  const [selected, setSelected] = useState<'card' | 'bank_transfer' | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/bank-transfer/settings');
        if (response.ok) {
          const data = await response.json();
          setBankTransferEnabled(data.enabled);
          setActualDepositPercentage(data.deposit_percentage);
          logger.log('Bank transfer settings loaded:', data);

          // If bank transfer is not enabled, auto-select card
          if (!data.enabled) {
            logger.log('Bank transfer not enabled, auto-selecting card');
            onSelect('card');
            return;
          }
        } else {
          // Settings fetch failed, default to card only
          logger.log('Failed to fetch bank transfer settings, defaulting to card');
          onSelect('card');
          return;
        }
      } catch (error) {
        logger.error('Error fetching bank transfer settings:', error);
        onSelect('card');
        return;
      }
      setIsLoading(false);
    };

    fetchSettings();
  }, [onSelect]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading payment options...</span>
      </div>
    );
  }

  const depositAmount = orderTotalAud * (actualDepositPercentage / 100);

  const handleContinue = () => {
    if (selected === 'card') {
      onSelect('card');
    } else if (selected === 'bank_transfer' && marketLossAccepted) {
      onSelect('bank_transfer');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Choose Payment Method</h3>
        <p className="text-sm text-muted-foreground">
          Select how you would like to pay for your order.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Pay by Card */}
        <button
          type="button"
          onClick={() => setSelected('card')}
          className={`relative flex flex-col items-start gap-3 rounded-lg border-2 p-5 text-left transition-all ${
            selected === 'card'
              ? 'border-primary bg-primary/5 shadow-md'
              : 'border-border hover:border-primary/50 hover:bg-muted/30'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`rounded-full p-2.5 ${
              selected === 'card' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Pay by Card</h4>
            </div>
          </div>
          <div className="space-y-1.5 text-sm text-muted-foreground">
            <p>Instant processing with Stripe</p>
            <p>Visa, Mastercard, and more accepted</p>
          </div>
          {selected === 'card' && (
            <div className="absolute top-3 right-3 h-3 w-3 rounded-full bg-primary" />
          )}
        </button>

        {/* Pay by Bank Transfer */}
        <button
          type="button"
          onClick={() => setSelected('bank_transfer')}
          className={`relative flex flex-col items-start gap-3 rounded-lg border-2 p-5 text-left transition-all ${
            selected === 'bank_transfer'
              ? 'border-primary bg-primary/5 shadow-md'
              : 'border-border hover:border-primary/50 hover:bg-muted/30'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`rounded-full p-2.5 ${
              selected === 'bank_transfer' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
              <Building className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Pay by Bank Transfer</h4>
            </div>
          </div>
          <div className="space-y-1.5 text-sm text-muted-foreground">
            <p>Save on card processing fees</p>
            <p>24-hour payment window</p>
            <p className="text-xs">
              Requires a {actualDepositPercentage}% refundable security deposit (A${depositAmount.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
            </p>
          </div>
          {selected === 'bank_transfer' && (
            <div className="absolute top-3 right-3 h-3 w-3 rounded-full bg-primary" />
          )}
        </button>
      </div>

      {/* Market loss policy checkbox — only shown for bank transfer */}
      {selected === 'bank_transfer' && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
          <div className="flex items-start gap-2 mb-3">
            <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
              Market Loss Policy
            </p>
          </div>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={marketLossAccepted}
              onChange={(e) => setMarketLossAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-amber-500/50 accent-amber-600"
            />
            <span className="text-sm text-amber-700 dark:text-amber-300">
              I understand that if I fail to complete the bank transfer within the payment window,
              my security deposit may be partially or fully retained to cover any market losses
              incurred due to price movements.
            </span>
          </label>
        </div>
      )}

      {/* Continue button */}
      <button
        type="button"
        onClick={handleContinue}
        disabled={
          !selected ||
          (selected === 'bank_transfer' && !marketLossAccepted)
        }
        className="w-full py-3 bg-primary text-primary-foreground hover:opacity-90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed font-bold rounded-lg transition-opacity"
      >
        {selected === 'bank_transfer'
          ? `Continue with Bank Transfer`
          : selected === 'card'
            ? 'Continue with Card Payment'
            : 'Select a payment method'}
      </button>
    </div>
  );
}
