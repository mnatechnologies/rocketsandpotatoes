'use client';

import { useState, useEffect } from 'react';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('ENHANCED_DD_FORM');

interface EnhancedDDFormProps {
  customerId: string;
  amount: number;
  onComplete: () => void;
}

interface Investigation {
  id: string;
  investigation_number: string;
  status: string;
  opened_at: string;
}

export function EnhancedDueDiligenceForm({
  customerId,
  amount,
  onComplete,
}: EnhancedDDFormProps) {
  const [sourceOfWealth, setSourceOfWealth] = useState('');
  const [sourceOfWealthDetails, setSourceOfWealthDetails] = useState('');
  const [transactionPurpose, setTransactionPurpose] = useState('');
  const [transactionPurposeDetails, setTransactionPurposeDetails] = useState('');
  const [expectedFrequency, setExpectedFrequency] = useState('');
  const [expectedAnnualVolume, setExpectedAnnualVolume] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingInvestigation, setCheckingInvestigation] = useState(true);
  const [investigation, setInvestigation] = useState<Investigation | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if there's an active investigation
  useEffect(() => {
    const checkInvestigation = async () => {
      try {
        const response = await fetch(`/api/customer/edd-investigation-status?customerId=${customerId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.investigation) {
            setInvestigation(data.investigation);
          }
        }
      } catch (err) {
        logger.error('Error checking investigation:', err);
      } finally {
        setCheckingInvestigation(false);
      }
    };

    checkInvestigation();
  }, [customerId]);

  const handleSubmit = async () => {
    // Validate required fields
    if (!sourceOfWealth || !transactionPurpose || !expectedFrequency) {
      setError('Please complete all required fields');
      return;
    }

    // Require details for "other" selections
    if (sourceOfWealth === 'other' && !sourceOfWealthDetails) {
      setError('Please provide details for your source of wealth');
      return;
    }

    if (transactionPurpose === 'other' && !transactionPurposeDetails) {
      setError('Please provide details for your transaction purpose');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      logger.log('Submitting Enhanced Due Diligence...');

      const response = await fetch('/api/customer/enhanced-dd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          sourceOfWealth,
          sourceOfWealthDetails,
          transactionPurpose,
          transactionPurposeDetails,
          expectedFrequency,
          expectedAnnualVolume,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit EDD');
      }

      logger.log('EDD submitted successfully');
      onComplete();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit. Please try again.';
      logger.error('Error submitting EDD:', err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking for investigation
  if (checkingInvestigation) {
    return (
      <div className="bg-card p-6 rounded-lg shadow-md max-w-2xl mx-auto text-center border border-border">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Checking investigation status...</p>
      </div>
    );
  }

  // If investigation exists and customer already submitted (under_review), show status
  if (investigation && (investigation.status === 'under_review' || investigation.status === 'awaiting_customer_info')) {
    return (
      <div className="bg-card p-6 rounded-lg shadow-md max-w-2xl mx-auto border border-border">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-card-foreground mb-2">EDD Investigation Under Review</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Your Enhanced Due Diligence information has been submitted and is currently under review by our compliance team.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-900">
              <strong>Investigation Number:</strong> {investigation.investigation_number}
            </p>
            <p className="text-sm text-blue-900 mt-1">
              <strong>Status:</strong> {investigation.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </p>
            <p className="text-sm text-blue-900 mt-1">
              <strong>Opened:</strong> {new Date(investigation.opened_at).toLocaleDateString()}
            </p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              <strong>Your account is temporarily blocked</strong> until our compliance team completes the review.
              We&#39;ll notify you by email once the review is complete. This typically takes 1-2 business days.
            </p>
            {investigation.status === 'awaiting_customer_info' && (
              <p className="text-sm text-amber-800 mt-2 font-semibold">
                ⚠️ Additional information has been requested. Please check your email for details.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Otherwise, show the EDD form
  return (
    <div className="bg-card p-6 rounded-lg shadow-md max-w-2xl mx-auto border border-border">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-card-foreground mb-2">Enhanced Due Diligence Required</h3>
        <p className="text-sm text-muted-foreground">
          Your cumulative transactions have exceeded $50,000 AUD. Australian anti-money laundering regulations require
          us to collect additional information about your financial background before you can continue transacting.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-amber-800">
          <strong>Transaction Amount:</strong> ${amount.toLocaleString('en-AU', { minimumFractionDigits: 2 })} AUD
        </p>
        <p className="text-xs text-amber-700 mt-1">
          This information is required under the AML/CTF Act for enhanced customer due diligence.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive-foreground text-sm">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Source of Wealth */}
        <div>
          <label className="block font-medium mb-2 text-foreground">
            Source of Wealth <span className="text-destructive">*</span>
          </label>
          <p className="text-xs text-muted-foreground mb-2">
            How did you accumulate the wealth being used for this purchase? This is different from the
            immediate source of funds.
          </p>
          <select
            value={sourceOfWealth}
            onChange={(e) => setSourceOfWealth(e.target.value)}
            className="w-full border border-border bg-input text-foreground rounded-lg p-3 focus:ring-2 focus:ring-primary focus:border-transparent"
            disabled={loading}
          >
            <option value="">Select source of wealth...</option>
            <option value="employment_salary">Employment / Salary over time</option>
            <option value="business_ownership">Business Ownership / Profits</option>
            <option value="investments">Investment Portfolio Growth</option>
            <option value="real_estate">Real Estate / Property Sales</option>
            <option value="inheritance">Inheritance</option>
            <option value="superannuation">Superannuation</option>
            <option value="family_wealth">Family Wealth</option>
            <option value="legal_settlement">Legal Settlement / Compensation</option>
            <option value="other">Other (please specify)</option>
          </select>
          {sourceOfWealth === 'other' && (
            <textarea
              value={sourceOfWealthDetails}
              onChange={(e) => setSourceOfWealthDetails(e.target.value)}
              placeholder="Please describe your source of wealth..."
              className="w-full border border-border bg-input text-foreground rounded-lg p-3 mt-2 focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={3}
              disabled={loading}
            />
          )}
        </div>

        {/* Transaction Purpose */}
        <div>
          <label className="block font-medium mb-2 text-foreground">
            Purpose of Transaction <span className="text-destructive">*</span>
          </label>
          <p className="text-xs text-muted-foreground mb-2">
            What is the primary reason for purchasing precious metals?
          </p>
          <select
            value={transactionPurpose}
            onChange={(e) => setTransactionPurpose(e.target.value)}
            className="w-full border border-border bg-input text-foreground rounded-lg p-3 focus:ring-2 focus:ring-primary focus:border-transparent"
            disabled={loading}
          >
            <option value="">Select purpose...</option>
            <option value="investment_portfolio">Investment / Portfolio Diversification</option>
            <option value="wealth_preservation">Wealth Preservation / Hedge against inflation</option>
            <option value="retirement_savings">Retirement Savings</option>
            <option value="gift">Gift for Family / Friends</option>
            <option value="collection">Numismatic Collection</option>
            <option value="business_use">Business Use</option>
            <option value="other">Other (please specify)</option>
          </select>
          {transactionPurpose === 'other' && (
            <textarea
              value={transactionPurposeDetails}
              onChange={(e) => setTransactionPurposeDetails(e.target.value)}
              placeholder="Please describe the purpose of your transaction..."
              className="w-full border border-border bg-input text-foreground rounded-lg p-3 mt-2 focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={3}
              disabled={loading}
            />
          )}
        </div>

        {/* Expected Frequency */}
        <div>
          <label className="block font-medium mb-2 text-foreground">
            Expected Transaction Frequency <span className="text-destructive">*</span>
          </label>
          <p className="text-xs text-muted-foreground mb-2">
            How often do you expect to make purchases of this size?
          </p>
          <select
            value={expectedFrequency}
            onChange={(e) => setExpectedFrequency(e.target.value)}
            className="w-full border border-border bg-input text-foreground rounded-lg p-3 focus:ring-2 focus:ring-primary focus:border-transparent"
            disabled={loading}
          >
            <option value="">Select frequency...</option>
            <option value="one_time">One-time purchase</option>
            <option value="rarely">Rarely (less than once per year)</option>
            <option value="annually">Annually (1-2 times per year)</option>
            <option value="quarterly">Quarterly (3-4 times per year)</option>
            <option value="monthly">Monthly or more frequently</option>
          </select>
        </div>

        {/* Expected Annual Volume */}
        <div>
          <label className="block font-medium mb-2 text-foreground">
            Expected Annual Purchase Volume
          </label>
          <p className="text-xs text-muted-foreground mb-2">
            Approximate total value of purchases you expect to make per year.
          </p>
          <select
            value={expectedAnnualVolume}
            onChange={(e) => setExpectedAnnualVolume(e.target.value)}
            className="w-full border border-border bg-input text-foreground rounded-lg p-3 focus:ring-2 focus:ring-primary focus:border-transparent"
            disabled={loading}
          >
            <option value="">Select volume (optional)...</option>
            <option value="under_50k">Under $50,000</option>
            <option value="50k_100k">$50,000 - $100,000</option>
            <option value="100k_250k">$100,000 - $250,000</option>
            <option value="250k_500k">$250,000 - $500,000</option>
            <option value="over_500k">Over $500,000</option>
          </select>
        </div>

        <div className="border-t border-border pt-4 mt-6">
          <button
            onClick={handleSubmit}
            disabled={loading || !sourceOfWealth || !transactionPurpose || !expectedFrequency}
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-opacity"
          >
            {loading ? 'Submitting...' : 'Continue to Payment'}
          </button>

          <p className="text-xs text-muted-foreground text-center mt-3">
            By submitting, you confirm that the information provided is accurate and complete.
            False declarations may result in your account being suspended.
          </p>
        </div>
      </div>
    </div>
  );
}









