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
  dataTimestamp: Date | null
  refetch: () => Promise<void>;
}

const MetalPricesContext = createContext<MetalPricesContextType | undefined>(undefined);

// Precious metals market hours checker
function getMarketStatus() {
  const now = new Date();
  const utcDay = now.getUTCDay(); // 0 = Sunday, 6 = Saturday
  const utcHour = now.getUTCHours();

  // Precious metals markets: Open Sunday 6pm ET (23:00 UTC), Close Friday 5pm ET (22:00 UTC)

  // Saturday - closed all day
  if (utcDay === 6) {
    return { isOpen: false, reason: 'Weekend' };
  }

  // Friday after 10pm UTC (5pm ET) - closed
  if (utcDay === 5 && utcHour >= 22) {
    return { isOpen: false, reason: 'Weekend' };
  }

  // Sunday before 11pm UTC (6pm ET) - closed
  if (utcDay === 0 && utcHour < 23) {
    return { isOpen: false, reason: 'Weekend' };
  }

  // Otherwise markets are open (Sunday 11pm UTC - Friday 10pm UTC)
  return { isOpen: true, reason: 'Live' };
}

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
    // Initial fetch on mount
    fetchPrices();

    // Industry best practice: Only poll when markets are OPEN
    // JM Bullion approach: Static prices when markets closed
    const UPDATE_INTERVAL_OPEN = 300000; // 5 minutes when markets are open
    const STATUS_CHECK_INTERVAL = 60000; // Check market status every minute

    let priceInterval: NodeJS.Timeout | null = null;
    let statusInterval: NodeJS.Timeout | null = null;

    const setupPolling = () => {
      const marketStatus = getMarketStatus();

      if (marketStatus.isOpen) {
        // Markets are open - poll for price updates every 5 minutes
        if (!priceInterval) {
          console.log('📊 Markets OPEN - Starting price polling (every 5 minutes)');
          priceInterval = setInterval(fetchPrices, UPDATE_INTERVAL_OPEN);
        }
      } else {
        // Markets are closed - stop polling to save API quota
        if (priceInterval) {
          console.log('🔴 Markets CLOSED - Stopping price polling');
          clearInterval(priceInterval);
          priceInterval = null;
        }
      }
    };

    // Set up initial polling based on current market status
    setupPolling();

    // Check market status every minute to detect open/close transitions
    statusInterval = setInterval(() => {
      setupPolling();
    }, STATUS_CHECK_INTERVAL);

    // Cleanup
    return () => {
      if (priceInterval) clearInterval(priceInterval);
      if (statusInterval) clearInterval(statusInterval);
    };
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