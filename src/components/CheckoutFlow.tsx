
'use client';

import { useState, useEffect } from 'react';
import { KYCVerification } from './KYCVerification';
import {Product} from "@/types/product";

interface Props {
  customerId: string;
  amount: number;
  productDetails: Product
}
export function CheckoutFlow({ customerId, amount, productDetails }: Props) {
  const [step, setStep] = useState<'validate' | 'review' | 'kyc' | 'payment'>('validate');
  const [validationResult, setValidationResult] = useState<any>(null);



  const validateTransaction = async () => {
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId, amount, productDetails }),
    });


    const result = await response.json();
    setValidationResult(result);

    if (result.status === 'kyc_required') {
      setStep('kyc');
    } else if (result.status === 'requires_review') {
      // Show pending review message
      setStep('review');
    } else {
      setStep('payment');
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

  return <div>Proceed to payment...</div>;
}