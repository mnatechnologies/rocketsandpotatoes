
'use client';
import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';



export function KYCVerification({ customerId }: { customerId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Create verification session
      const response = await fetch('/api/kyc/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId }),
      });

      const { clientSecret } = await response.json();

      // 2. Load Stripe Identity
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

      if (!stripe) {
        throw new Error('Failed to load Stripe');
      }

      // 3. Start verification flow
      const { error: identityError } = await stripe.verifyIdentity(clientSecret);

      if (identityError) {
        setError(identityError.message || 'Verification failed');
      } else {
        // Success - redirect to payment
        window.location.href = '/checkout/payment';
      }
    } catch (error) {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Identity Verification Required</h2>
      <p className="text-gray-600 mb-6">
        For transactions over $5,000, Australian law (AUSTRAC) requires us to verify your identity.
        This process takes less than 2 minutes.
      </p>

      <div className="space-y-4 mb-6">
        <div className="flex items-start">
          <span className="mr-3">✓</span>
          <span>Secure verification powered by Stripe</span>
        </div>
        <div className="flex items-start">
          <span className="mr-3">✓</span>
          <span>Your data is encrypted and protected</span>
        </div>
        <div className="flex items-start">
          <span className="mr-3">✓</span>
          <span>You&#39;ll need a government-issued ID</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      <button
        onClick={handleVerify}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Loading...' : 'Verify Identity'}
      </button>

      <p className="text-xs text-gray-500 mt-4 text-center">
        This verification is required by Australian Transaction Reports and Analysis Centre (AUSTRAC)
      </p>
    </div>
  );
}

