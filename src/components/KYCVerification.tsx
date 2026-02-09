
'use client';
import { useState } from 'react';
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
    return (
      <DocumentUploadFlow
        customerId={customerId}
        onStripeVerify={handleVerify}
        onBackToSelection={() => setShowManualUpload(false)}
      />
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-card rounded-lg shadow-card">
      <h2 className="text-2xl font-bold text-foreground mb-4">Identity Verification</h2>

      {/* Two-card side-by-side layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Quick Verification Card */}
        <button
          onClick={handleVerify}
          disabled={loading}
          className="p-6 border-2 border-primary rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors text-left disabled:opacity-50"
        >
          <h3 className="font-bold text-lg mb-2 text-center text-foreground">Quick Verification</h3>
          <p className="text-sm text-muted-foreground text-center">
            Use passport or driver&#39;s license (2 minutes)
          </p>
        </button>

        {/* Alternative Documents Card */}
        <button
          onClick={() => setShowManualUpload(true)}
          className="p-6 border-2 border-border rounded-lg hover:bg-muted/50 transition-colors text-left"
        >
          <h3 className="font-bold text-lg mb-2 text-center text-foreground">Alternative Documents</h3>
          <p className="text-sm text-muted-foreground text-center">
            Use birth certificate, Medicare card, etc. (1-2 days review)
          </p>
        </button>
      </div>

      {/* Stripe Identity description */}
      <p className="text-foreground/80 mb-6 text-center">
        We&#39;ll use Stripe Identity to verify your passport or driver&#39;s license automatically.
      </p>

      {/* Primary action button */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <button
        onClick={handleVerify}
        disabled={loading}
        className="w-full bg-primary text-primary-foreground py-3 rounded-lg hover:bg-primary/90 disabled:opacity-50 font-semibold mb-6"
      >
        {loading ? 'Loading...' : 'Start Quick Verification'}
      </button>

      {/* Need help section */}
      <div className="bg-muted/50 p-4 rounded-lg">
        <h4 className="font-semibold text-foreground mb-2">Need help?</h4>
        <p className="text-sm text-foreground/80 mb-2">
          Don&#39;t have standard ID? We can accept:
        </p>
        <ul className="text-sm text-muted-foreground space-y-1 ml-4">
          <li>• Foreign identity documents with translation</li>
          <li>• Referee statements in special cases</li>
        </ul>
        <button
          onClick={() => setShowManualUpload(true)}
          className="text-sm text-primary mt-2 underline hover:text-primary/80"
        >
          Contact support for alternative options
        </button>
      </div>

      <p className="text-xs text-muted-foreground mt-4 text-center">
        This verification is required by Australian Transaction Reports and Analysis Centre (AUSTRAC)
      </p>
    </div>
  );
}

