
'use client';
import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';

// Testing flag - set to true to enable console logging
const TESTING_MODE = process.env.NEXT_PUBLIC_TESTING_MODE === 'true' || true;

function log(...args: any[]) {
  if (TESTING_MODE) {
    console.log('[KYC_VERIFICATION]', ...args);
  }
}

export function KYCVerification({ customerId }: { customerId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    log('Starting KYC verification for customer:', customerId);
    setLoading(true);
    setError(null);

    try {
      // 1. Create verification session
      log('Step 1: Initiating verification session...');
      const response = await fetch('/api/kyc/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId }),
      });

      log('Verification session API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        log('Error response from API:', errorData);
        throw new Error(errorData.error || 'Failed to create verification session');
      }

      const data = await response.json();
      log('Verification session data:', data);

      const { verificationUrl, verificationSessionId, status } = data;

      if (status === 'already_verified') {
        log('Customer is already verified');
        setError('You are already verified.');
        return;
      }

      if (!verificationUrl) {
        log('No verification URL received');
        throw new Error('No verification URL provided');
      }

      log('Step 2: Redirecting to Stripe Identity verification URL:', verificationUrl);
      
      // Redirect to Stripe Identity verification
      window.location.href = verificationUrl;

    } catch (error: any) {
      log('Error during KYC verification:', error);
      setError(error.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
      log('KYC verification process completed');
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

