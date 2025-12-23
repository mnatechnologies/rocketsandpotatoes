'use client';
/* eslint-disable */
import { useState } from 'react';
import { useStripe, useElements, PaymentElement, Elements } from '@stripe/react-stripe-js';
import { Product } from '@/types/product';
import { clearPricingTimer } from '@/lib/pricing/pricingTimer';
import { createLogger } from '@/lib/utils/logger';
import {useCart} from "@/contexts/CartContext";
import {useCurrency} from "@/contexts/CurrencyContext";

const logger = createLogger('PAYMENT_FORM');

interface PaymentFormProps {
  amount: number;
  currency: 'USD' | 'AUD';
  customerId: string;
  productDetails: Product;
  cartItems?: any[];
  paymentIntentId: string;
  onSuccess?: (orderId: string) => void;
  sessionId?: string | null;  // ✅ Add sessionId prop
}

export function PaymentForm({
  amount,
  currency,
  customerId,
  productDetails,
  cartItems,
  paymentIntentId,
  onSuccess,
  sessionId,  // ✅ Destructure sessionId
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPaymentElementReady, setIsPaymentElementReady] = useState(false);
  const { clearCart } = useCart()
  const {formatPrice} = useCurrency();
  const handlePaymentElementReady = () => {
    logger.log('PaymentElement is ready');
    setIsPaymentElementReady(true);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    logger.log('Payment form submitted');

    if (!stripe || !elements || !isPaymentElementReady) {
      logger.log('Stripe not loaded yet');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {


      logger.log('Step 1: Confirming payment with Stripe...');
      
      // Confirm the payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/order-confirmation`,
        },
        redirect: 'if_required', //
      });


      if (stripeError) {
        logger.error('Stripe payment error:', stripeError);
        setError(stripeError.message || 'Payment failed');
        setIsProcessing(false);
        return;
      }



      if (paymentIntent?.status === 'succeeded') {
        logger.log('Step 2: Payment succeeded, creating order...');

        
        // Create order in database
        const orderResponse = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId,
            amount,
            currency,
            productDetails,
            cartItems,
            stripePaymentIntentId: paymentIntent.id,
            paymentMethod: 'card',
            sessionId,  // ✅ Pass sessionId for locked prices
          }),
        });

        if (!orderResponse.ok) {
          const errorData = await orderResponse.json();
          logger.error('Order creation failed:', errorData);
          throw new Error(errorData.error || 'Failed to create order');
        }

        const orderData = await orderResponse.json();
        logger.log('Order created successfully:', orderData.orderId);

        setSuccess(true);
        
        // Clear cart from localStorage
        logger.log('Clearing cart from localStorage');
        clearCart();
        
        // Clear pricing timer
        clearPricingTimer();
        logger.log('Pricing timer cleared');

        // Call success callback if provided
        if (onSuccess) {
          onSuccess(orderData.orderId);
        }

          window.location.href = `/order-confirmation?orderId=${orderData.orderId}`;
      } else {
        logger.log('Payment status not succeeded:', paymentIntent?.status);
        setError('Payment was not successful. Please try again.');
      }
    } catch (err: any) {
      logger.error('Error during payment process:', err);
      setError(err.message || 'An error occurred during payment');
    } finally {
      setIsProcessing(false);
      logger.log('Payment process completed');
    }
  };

  if (success) {
    return (
      <div className="text-center p-6 bg-card border border-border rounded-lg">
        <div className="text-6xl mb-4">✓</div>
        <h2 className="text-2xl font-bold text-card-foreground mb-2">Payment Successful!</h2>
        <p className="text-muted-foreground mb-4">
          Your order has been placed successfully.
        </p>
        <p className="text-sm text-muted-foreground">
          Redirecting to order confirmation...
        </p>
      </div>
    );

  }


  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-card-foreground mb-4">Payment Details</h3>
        <PaymentElement onReady={handlePaymentElementReady} />
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
          <p className="text-destructive-foreground font-medium">Payment Error</p>
          <p className="text-destructive-foreground text-sm mt-1">{error}</p>
        </div>
      )}

      <div className="border-t pt-4">
        <div className="flex justify-between text-lg font-bold mb-4">
          <span>Total Amount:</span>
          <span>${amount.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}</span>
        </div>

        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="w-full py-3 bg-primary text-primary-foreground hover:opacity-90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed font-bold rounded-lg transition-opacity"
        >
          {isProcessing ? 'Processing Payment...' : `Pay $${amount.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`}
        </button>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Your payment is secured by Stripe. We do not store your card details.
      </p>
    </form>
  );
}
