'use client';

import { useState } from "react";
import { createLogger } from "@/lib/utils/logger";
import {useCurrency} from "@/contexts/CurrencyContext";

const logger = createLogger('SOURCE_OF_FUNDS_FORM');

export function SourceOfFundsForm({
  customerId,
  amount,
  onComplete
  }: {
  customerId: string;
  amount: number;
  onComplete: () => void;
}) {
  const [sourceOfFunds, setSourceOfFunds] = useState('');
  const [occupation, setOccupation] = useState('');
  const [employer, setEmployer] = useState('');
  const [isPep, setIsPep] = useState(false);
  const [pepRelationship, setPepRelationship] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {formatPrice, currency} = useCurrency();


  const handleSubmit = async () => {
    // Validate
    if (!sourceOfFunds || !occupation) {
      setError('Please complete all required fields');
      return;
    }

    // If PEP is checked, require relationship
    if (isPep && !pepRelationship) {
      setError('Please specify your PEP relationship');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      logger.log('Submitting source of funds...');

      const response = await fetch('/api/customer/source-of-funds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          sourceOfFunds,
          occupation,
          employer,
          isPep,
          pepRelationship: isPep ? pepRelationship : null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save source of funds');
      }

      logger.log('Source of funds saved successfully');
      onComplete();

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save. Please try again.';
      logger.error('Error submitting source of funds:', err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card p-6 rounded-lg shadow-md border border-border">
      <h3 className="text-xl font-bold text-card-foreground mb-2">Source of Funds Declaration</h3>
      <p className="text-sm text-muted-foreground mb-4">
        For transactions over $10,000, We&#39;re required by AUSTRAC to verify the source of your funds.
      </p>

      <div className="bg-primary/10 border border-primary/30 rounded p-3 mb-4">
        <p className="text-sm text-primary-foreground">
          <strong>Transaction Amount:</strong> ${amount.toLocaleString('en-AU', { minimumFractionDigits: 2 })} {currency}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded text-destructive-foreground text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block font-medium mb-2 text-foreground">
            Source of Funds <span className="text-destructive">*</span>
          </label>
          <select
            value={sourceOfFunds}
            onChange={(e) => setSourceOfFunds(e.target.value)}
            className="w-full border border-border bg-input text-foreground rounded-lg p-3 focus:ring-2 focus:ring-primary focus:border-transparent"
            disabled={loading}
          >
            <option value="">Select source of funds...</option>
            <option value="employment_income">Employment Income</option>
            <option value="business_profits">Business Profits</option>
            <option value="investment_returns">Investment Returns</option>
            <option value="inheritance">Inheritance</option>
            <option value="savings">Savings</option>
            <option value="property_sale">Property Sale</option>
            <option value="gift">Gift</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block font-medium mb-2 text-foreground">
            Occupation <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={occupation}
            onChange={(e) => setOccupation(e.target.value)}
            placeholder="e.g. Software Engineer, Business Owner, Retired"
            className="w-full border border-border bg-input text-foreground rounded-lg p-3 focus:ring-2 focus:ring-primary focus:border-transparent"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block font-medium mb-2 text-foreground">
            Employer (if applicable)
          </label>
          <input
            type="text"
            value={employer}
            onChange={(e) => setEmployer(e.target.value)}
            placeholder="Company name or N/A if self-employed/retired"
            className="w-full border border-border bg-input text-foreground rounded-lg p-3 focus:ring-2 focus:ring-primary focus:border-transparent"
            disabled={loading}
          />
        </div>

        {/* PEP Declaration */}
        <div className="border-t border-border pt-4 mt-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-3">
            <h4 className="font-semibold text-amber-800 mb-2">Politically Exposed Person (PEP) Declaration</h4>
            <p className="text-sm text-amber-700 mb-3">
              A PEP is someone who holds or has held a prominent public position, or is a close associate or family member of such a person.
            </p>
            
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isPep}
                onChange={(e) => {
                  setIsPep(e.target.checked);
                  if (!e.target.checked) setPepRelationship('');
                }}
                className="mt-1 h-5 w-5 rounded border-border text-primary focus:ring-primary"
                disabled={loading}
              />
              <span className="text-sm text-foreground">
                I am, or am related to / associated with, a Politically Exposed Person (PEP)
              </span>
            </label>
          </div>

          {isPep && (
            <div>
              <label className="block font-medium mb-2 text-foreground">
                PEP Relationship <span className="text-destructive">*</span>
              </label>
              <select
                value={pepRelationship}
                onChange={(e) => setPepRelationship(e.target.value)}
                className="w-full border border-border bg-input text-foreground rounded-lg p-3 focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={loading}
              >
                <option value="">Select relationship...</option>
                <option value="self">I am a PEP</option>
                <option value="spouse">Spouse of a PEP</option>
                <option value="family_member">Family member of a PEP</option>
                <option value="close_associate">Close associate of a PEP</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                This information is required for enhanced due diligence under AML/CTF regulations.
              </p>
            </div>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !sourceOfFunds || !occupation || (isPep && !pepRelationship)}
          className="w-full bg-primary text-primary-foreground py-3 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-opacity"
        >
          {loading ? 'Saving...' : 'Continue to Payment'}
        </button>

        <p className="text-xs text-muted-foreground text-center">
          This information is required for compliance with Australian AML/CTF regulations
        </p>
      </div>
    </div>
  );
}