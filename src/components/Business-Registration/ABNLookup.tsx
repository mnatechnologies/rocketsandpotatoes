'use client';

import { useState } from 'react';
import { createLogger } from '@/lib/utils/logger';
import { ABRResponse } from '@/types/business';

const logger = createLogger('ABN_LOOKUP');

interface ABNLookupProps {
  onVerified: (data: ABRResponse) => void;
  entityType: string;
}

export function ABNLookup({ onVerified, entityType }: ABNLookupProps) {
  const [abn, setAbn] = useState('');
  const [acn, setAcn] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifiedData, setVerifiedData] = useState<ABRResponse | null>(null);

  const requiresACN = entityType === 'company';

  const formatABN = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
    if (digits.length <= 8) return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
    return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  };

  const formatACN = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 9);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  };

  const handleLookup = async () => {
    const cleanABN = abn.replace(/\s/g, '');

    if (cleanABN.length !== 11) {
      setError('Please enter a valid 11-digit ABN');
      return;
    }

    if (requiresACN) {
      const cleanACN = acn.replace(/\s/g, '');
      if (cleanACN.length !== 9) {
        setError('Please enter a valid 9-digit ACN');
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/business/lookup?abn=${cleanABN}`);
      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'ABN not found');
        setVerifiedData(null);
        return;
      }

      logger.log('ABN verified:', result.data.entityName);
      setVerifiedData(result.data);

    } catch (err) {
      logger.error('Lookup error:', err);
      setError('Failed to verify ABN. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (verifiedData) {
      onVerified(verifiedData);
    }
  };

  return (
    <div className="bg-card p-6 rounded-lg shadow-md border border-border">
      <h3 className="text-xl font-bold text-card-foreground mb-2">
        Verify Your Business
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Enter your ABN to verify your business details with the Australian Business Register.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded text-destructive-foreground text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block font-medium mb-2 text-foreground">
            ABN (Australian Business Number) <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={abn}
            onChange={(e) => setAbn(formatABN(e.target.value))}
            placeholder="XX XXX XXX XXX"
            className="w-full border border-border bg-input text-foreground rounded-lg p-3 focus:ring-2 focus:ring-primary focus:border-transparent font-mono"
            disabled={loading || !!verifiedData}
          />
        </div>

        {requiresACN && (
          <div>
            <label className="block font-medium mb-2 text-foreground">
              ACN (Australian Company Number) <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={acn}
              onChange={(e) => setAcn(formatACN(e.target.value))}
              placeholder="XXX XXX XXX"
              className="w-full border border-border bg-input text-foreground rounded-lg p-3 focus:ring-2 focus:ring-primary focus:border-transparent font-mono"
              disabled={loading || !!verifiedData}
            />
          </div>
        )}

        {!verifiedData && (
          <button
            onClick={handleLookup}
            disabled={loading || abn.replace(/\s/g, '').length !== 11}
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-opacity"
          >
            {loading ? 'Verifying...' : 'Verify ABN'}
          </button>
        )}

        {verifiedData && (
          <div className="mt-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Business Verified
              </h4>
              <div className="space-y-2 text-sm text-green-700">
                <p><strong>Business Name:</strong> {verifiedData.entityName}</p>
                <p><strong>ABN:</strong> {verifiedData.abn}</p>
                {verifiedData.acn && <p><strong>ACN:</strong> {verifiedData.acn}</p>}
                <p><strong>Entity Type:</strong> {verifiedData.entityType}</p>
                <p><strong>Status:</strong> {verifiedData.abnStatus}</p>
                <p><strong>GST Registered:</strong> {verifiedData.gstRegistered ? 'Yes' : 'No'}</p>
                <p><strong>Location:</strong> {verifiedData.mainBusinessLocation.state} {verifiedData.mainBusinessLocation.postcode}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setVerifiedData(null);
                  setAbn('');
                  setAcn('');
                }}
                className="flex-1 border border-border text-foreground py-3 rounded-lg hover:bg-muted transition-colors"
              >
                Try Different ABN
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 bg-primary text-primary-foreground py-3 rounded-lg hover:opacity-90 font-semibold transition-opacity"
              >
                Confirm & Continue
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}