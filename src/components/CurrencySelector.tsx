
'use client';

import { useCurrency } from '@/contexts/CurrencyContext';
import { ChevronDown } from 'lucide-react';

export default function CurrencySelector() {
  const { currency, setCurrency, fxRate, fxTimestamp, isLoading } = useCurrency();

  return (
    <div className="relative group">
      <button
        className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        aria-label="Select currency"
      >
        <span>{currency}</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {/* Dropdown */}
      <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="py-1">
          <button
            onClick={() => setCurrency('USD')}
            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
              currency === 'USD' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
            }`}
          >
            USD - US Dollar
          </button>
          <button
            onClick={() => setCurrency('AUD')}
            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
              currency === 'AUD' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
            }`}
          >
            AUD - Australian Dollar
          </button>
        </div>

        {/* FX Rate Info */}
        {currency === 'AUD' && (
          <div className="border-t border-gray-200 px-4 py-2 text-xs text-gray-500">
            {isLoading ? (
              <span>Loading rate...</span>
            ) : (
              <>
                <div>Rate: 1 USD = {fxRate.toFixed(4)} AUD</div>
                {fxTimestamp && (
                  <div className="text-gray-400">
                    Updated: {fxTimestamp.toLocaleTimeString()}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}