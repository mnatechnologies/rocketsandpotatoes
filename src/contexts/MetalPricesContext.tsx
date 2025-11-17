'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MetalSymbol } from '@/lib/metals-api/metalsApi';

interface MetalPrice {
  symbol: MetalSymbol;
  price: number;
  change: number;
  changePercent: number;
  timestamp?: string;
}

interface MetalPricesContextType {
  prices: MetalPrice[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  dataTimeStamp: Date | null
  refetch: () => Promise<void>;
}

const MetalPricesContext = createContext<MetalPricesContextType | undefined>(undefined);

export function MetalPricesProvider({ children }: { children: ReactNode }) {
  const [prices, setPrices] = useState<MetalPrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [dataTimestamp, setDataTimestamp] = useState<Date | null>(null)

  const fetchPrices = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/metals?baseCurrency=USD');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();

      if (result.success && result.data) {
        setPrices(result.data);
        setLastUpdated(new Date());

      if (result.timestamp) {
        setDataTimestamp(new Date(result.timestamp));
      }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch prices');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();

    // Refresh every 5 minutes - ONLY ONCE for entire app
    const interval = setInterval(fetchPrices, 300000);
    return () => clearInterval(interval);
  }, []);

  return (
    <MetalPricesContext.Provider value={{ prices, isLoading, error, lastUpdated, dataTimestamp, refetch: fetchPrices }}>
  {children}
  </MetalPricesContext.Provider>
);
}

export function useMetalPrices() {
  const context = useContext(MetalPricesContext);
  if (!context) {
    throw new Error('useMetalPrices must be used within MetalPricesProvider');
  }
  return context;
}