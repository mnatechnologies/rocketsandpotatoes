
'use client';
import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { createLogger } from '@/lib/utils/logger';
import { DocumentUploadFlow } from './DocumentUpload';

const logger = createLogger('KYC_VERIFICATION');

export function KYCVerification({ customerId }: { customerId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showManualUpload, setShowManualUpload] = useState(false);

  const handleVerify = async () => {
    logger.log('Starting KYC verification for customer:', customerId);
    setLoading(true);
    setError(null);

    try {
      // 1. Create verification session
      logger.log('Step 1: Initiating verification session...');
      const response = await fetch('/api/kyc/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId }),
      });

      logger.log('Verification session API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        logger.log('Error response from API:', errorData);
        throw new Error(errorData.error || 'Failed to create verification session');
      }

      const data = await response.json();
      logger.log('Verification session data:', data);

      const { verificationUrl, verificationSessionId, status } = data;

      if (status === 'already_verified') {
        logger.log('Customer is already verified');
        setError('You are already verified.');
        return;
      }

      if (!verificationUrl) {
        logger.log('No verification URL received');
        throw new Error('No verification URL provided');
      }

      logger.log('Step 2: Redirecting to Stripe Identity verification URL:', verificationUrl);
      
      // Redirect to Stripe Identity verification
      window.location.href = verificationUrl;

    } catch (error: any) {
      logger.error('Error during KYC verification:', error);
      setError(error.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
      logger.log('KYC verification process completed');
    }
  };

  // If manual upload is selected, show the DocumentUploadFlow
  if (showManualUpload) {
    return <DocumentUploadFlow customerId={customerId} />;
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Identity Verification</h2>

      {/* Two-card side-by-side layout */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Quick Verification Card */}
        <button
          onClick={handleVerify}
          disabled={loading}
          className="p-6 border-2 border-blue-500 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors text-left disabled:opacity-50"
        >
          <h3 className="font-bold text-lg mb-2 text-center">Quick Verification</h3>
          <p className="text-sm text-gray-700 text-center">
            Use passport or driver&#39;s license (2 minutes)
          </p>
        </button>

        {/* Alternative Documents Card */}
        <button
          onClick={() => setShowManualUpload(true)}
          className="p-6 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left"
        >
          <h3 className="font-bold text-lg mb-2 text-center">Alternative Documents</h3>
          <p className="text-sm text-gray-700 text-center">
            Use birth certificate, Medicare card, etc. (1-2 days review)
          </p>
        </button>
      </div>

      {/* Stripe Identity description */}
      <p className="text-gray-700 mb-6 text-center">
        We&#39;ll use Stripe Identity to verify your passport or driver&#39;s license automatically.
      </p>

      {/* Primary action button */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      <button
        onClick={handleVerify}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold mb-6"
      >
        {loading ? 'Loading...' : 'Start Quick Verification'}
      </button>

      {/* Need help section */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold mb-2">Need help?</h4>
        <p className="text-sm text-gray-700 mb-2">
          Don&#39;t have standard ID? We can accept:
        </p>
        <ul className="text-sm text-gray-600 space-y-1 ml-4">
          <li>• Foreign identity documents with translation</li>
          <li>• Referee statements in special cases</li>
        </ul>
        <button
          onClick={() => setShowManualUpload(true)}
          className="text-sm text-blue-600 mt-2 underline hover:text-blue-700"
        >
          Contact support for alternative options
        </button>
      </div>

      <p className="text-xs text-gray-500 mt-4 text-center">
        This verification is required by Australian Transaction Reports and Analysis Centre (AUSTRAC)
      </p>
    </div>
  );
}

