'use client';

import { useState } from "react";
import { createLogger } from "@/lib/utils/logger";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    // Validate
    if (!sourceOfFunds || !occupation) {
      setError('Please complete all required fields');
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
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save source of funds');
      }

      logger.log('Source of funds saved successfully');
      onComplete();

    } catch (err: any) {
      logger.error('Error submitting source of funds:', err);
      setError(err.message || 'Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-bold mb-2">Source of Funds Declaration</h3>
      <p className="text-sm text-gray-600 mb-4">
        For transactions over $10,000, We&#39;re required by AUSTRAC to verify the source of your funds.
      </p>

      <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
        <p className="text-sm text-blue-800">
          <strong>Transaction Amount:</strong> ${amount.toLocaleString('en-AU', { minimumFractionDigits: 2 })} AUD
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block font-medium mb-2 text-gray-700">
            Source of Funds <span className="text-red-500">*</span>
          </label>
          <select
            value={sourceOfFunds}
            onChange={(e) => setSourceOfFunds(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          <label className="block font-medium mb-2 text-gray-700">
            Occupation <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={occupation}
            onChange={(e) => setOccupation(e.target.value)}
            placeholder="e.g. Software Engineer, Business Owner, Retired"
            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block font-medium mb-2 text-gray-700">
            Employer (if applicable)
          </label>
          <input
            type="text"
            value={employer}
            onChange={(e) => setEmployer(e.target.value)}
            placeholder="Company name or N/A if self-employed/retired"
            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !sourceOfFunds || !occupation}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
        >
          {loading ? 'Saving...' : 'Continue to Payment'}
        </button>

        <p className="text-xs text-gray-500 text-center">
          This information is required for compliance with Australian AML/CTF regulations
        </p>
      </div>
    </div>
  );
}