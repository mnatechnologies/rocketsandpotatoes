
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('CURRENCY');

type Currency = 'USD' | 'AUD';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  exchangeRate: number;
  isLoadingRate: boolean;
  formatPrice: (usdPrice: number) => string;
  convertPrice: (usdPrice: number) => number;
  fxRate: number;
  fxTimestamp: Date | null;
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  // ✅ Default to AUD (Australian business serving Australian customers)
  const [currency, setCurrency] = useState<Currency>('AUD');
  const [exchangeRate, setExchangeRate] = useState<number>(1.52); // Will be updated on mount
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  const [fxTimestamp, setFxTimestamp] = useState<Date | null>(null);


  // Fetch exchange rate when currency changes
  useEffect(() => {
    const fetchRate = async () => {
      if (currency === 'USD') {
        setExchangeRate(1);
        setFxTimestamp(new Date());
        return;
      }

      setIsLoadingRate(true);
      try {
        logger.log(`Fetching exchange rate: USD → ${currency}`);

        // Call our API route instead of the metals API directly
        const response = await fetch(`/api/fx-rate?from=USD&to=${currency}`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch exchange rate');
        }

        logger.log(`✓ Exchange rate USD/${currency}: ${data.rate.toFixed(4)}`);
        setExchangeRate(data.rate);
        setFxTimestamp(new Date(data.timestamp));
      } catch (error) {
        logger.error('Failed to fetch FX rate:', error);
        // API and database both failed - use last known rate or 1.52 as reasonable default
        const fallbackRate = currency === 'AUD' ? (exchangeRate !== 1.57 ? exchangeRate : 1.52) : 1;
        logger.warn(`Using fallback rate: ${fallbackRate} (last known: ${exchangeRate})`);
        setExchangeRate(fallbackRate);
        setFxTimestamp(new Date());
      } finally {
        setIsLoadingRate(false);
      }
    };

    fetchRate();
  }, [currency]);

  const convertPrice = useCallback(
    (usdPrice: number): number => {
      return usdPrice * exchangeRate;
    },
    [exchangeRate]
  );

  const reverseConvertPrice = useCallback(
    (audPrice: number): number => {
      return audPrice * exchangeRate;
    },
    [exchangeRate]
  );

  const formatPrice = useCallback(
    (usdPrice: number): string => {
      const convertedPrice = convertPrice(usdPrice);
      return `$${convertedPrice.toLocaleString('en-AU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    },
    [convertPrice]
  );

  const value: CurrencyContextType = {
    currency,
    setCurrency,
    exchangeRate,
    isLoadingRate,
    formatPrice,
    convertPrice,
    fxRate: exchangeRate,
    fxTimestamp,
    isLoading: isLoadingRate,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}