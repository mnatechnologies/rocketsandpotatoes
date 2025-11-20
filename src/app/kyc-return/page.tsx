'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

export default function KYCReturnPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded, isSignedIn, user } = useUser();
  const [status, setStatus] = useState('processing');
  const [attempts, setAttempts] = useState(0);

  const customerId = searchParams.get('customer_id');
  const kycStatus = searchParams.get('kyc_status');

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      // User lost session, redirect to sign in with return URL
      const returnUrl = `/kyc-return?kyc_status=${kycStatus}&customer_id=${customerId}`;
      router.push(`/sign-in?redirect_url=${encodeURIComponent(returnUrl)}`);
      return;
    }

    // User is signed in, poll for verification status
    if (kycStatus === 'complete' && customerId) {
      pollVerificationStatus(customerId);
    }
  }, [isLoaded, isSignedIn, customerId, kycStatus, router]);

  const pollVerificationStatus = async (customerId: string) => {
    const maxAttempts = 10; // Poll for up to 30 seconds

    if (attempts >= maxAttempts) {
      setStatus('timeout');
      return;
    }

    try {
      const response = await fetch(`/api/kyc/verification-status?customerId=${customerId}`);
      const data = await response.json();

      if (data.verification_status === 'verified') {
        setStatus('verified');
        // Wait a moment then redirect to checkout
        setTimeout(() => {
          router.push('/checkout');
        }, 1500);
      } else if (data.verification_status === 'requires_review') {
        setStatus('review');
        setTimeout(() => {
          router.push('/checkout');
        }, 2000);
      } else {
        // Still pending, poll again
        setAttempts(prev => prev + 1);
        setTimeout(() => pollVerificationStatus(customerId), 3000);
      }
    } catch (error) {
      console.error('[KYC_RETURN] Error polling status:', error);
      setStatus('error');
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl mb-4">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md mx-auto p-8 bg-white rounded-lg shadow-lg text-center">
        {status === 'processing' && (
          <>
            <div className="text-6xl mb-4">⏳</div>
            <h1 className="text-2xl font-bold mb-4">Processing Verification</h1>
            <p className="text-gray-600 mb-4">
              Please wait while we confirm your identity verification...
            </p>
            <div className="animate-pulse text-sm text-gray-500">
              This usually takes just a few seconds
            </div>
          </>
        )}

        {status === 'verified' && (
          <>
            <div className="text-6xl mb-4">✓</div>
            <h1 className="text-2xl font-bold text-green-600 mb-4">Verification Complete!</h1>
            <p className="text-gray-600 mb-4">
              Your identity has been verified successfully.
            </p>
            <p className="text-sm text-gray-500">Redirecting to checkout...</p>
          </>
        )}

        {status === 'review' && (
          <>
            <div className="text-6xl mb-4">🔍</div>
            <h1 className="text-2xl font-bold text-yellow-600 mb-4">Under Review</h1>
            <p className="text-gray-600 mb-4">
              Your verification requires additional review. We&#39;ll email you within 1-2 business days.
            </p>
            <p className="text-sm text-gray-500">Redirecting...</p>
          </>
        )}

        {status === 'timeout' && (
          <>
            <div className="text-6xl mb-4">⏱️</div>
            <h1 className="text-2xl font-bold text-orange-600 mb-4">Processing Taking Longer</h1>
            <p className="text-gray-600 mb-4">
              Your verification is still being processed. You can continue to checkout - We&#39;ll update your status shortly.
            </p>
            <button
              onClick={() => router.push('/checkout')}
              className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Continue to Checkout
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-red-600 mb-4">Connection Error</h1>
            <p className="text-gray-600 mb-4">
              We couldn&#39;t verify your status. Please try refreshing or continue to checkout.
            </p>
            <button
              onClick={() => router.push('/checkout')}
              className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Continue to Checkout
            </button>
          </>
        )}
      </div>
    </div>
  );
}