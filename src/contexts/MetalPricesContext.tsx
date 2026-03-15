'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { MetalSymbol } from '@/lib/metals-api/metalsApi';
import { createLogger} from "@/lib/utils/logger";

const logger = createLogger('METALS_PRICING_CONTEXT')
interface MetalPrice {
  symbol: MetalSymbol;
  price: number;
  change: number;
  changePercent: number;
  timestamp?: string;
}

interface PricingConfig {
  markup_percentage: number;
  default_base_fee_percentage: number;
  brand_base_fee_percentages?: Record<string, number>;
}

interface MetalPricesContextType {
  prices: MetalPrice[];
  pricingConfig: PricingConfig | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  dataTimestamp: Date | null;
  nextUpdateTime: Date;
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

const FETCH_INTERVAL_MS = 300000; // 5 minutes

/** Returns the next wall-clock 5-minute mark (:00, :05, :10, :15, ...) */
function getNextUpdateTime(): Date {
  const now = new Date();
  const mins = now.getMinutes();
  const nextMark = Math.ceil((mins + 1) / 5) * 5;
  const next = new Date(now);
  next.setMinutes(nextMark, 0, 0);
  return next;
}

/** Returns ms until the next 5-minute wall-clock mark */
function msUntilNextUpdate(): number {
  return Math.max(0, getNextUpdateTime().getTime() - Date.now());
}

export function MetalPricesProvider({ children }: { children: ReactNode }) {
  const [prices, setPrices] = useState<MetalPrice[]>([]);
  const [pricingConfig, setPricingConfig] = useState<PricingConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [dataTimestamp, setDataTimestamp] = useState<Date | null>(null);
  const [nextUpdateTime, setNextUpdateTime] = useState<Date>(getNextUpdateTime());

  const fetchPrices = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch both metal prices and pricing config in parallel
      const [pricesResponse, configResponse] = await Promise.all([
        fetch('/api/metals?baseCurrency=AUD'),
        fetch('/api/admin/pricing')
      ]);

      if (!pricesResponse.ok) throw new Error(`HTTP error! status: ${pricesResponse.status}`);

      const pricesResult = await pricesResponse.json();

      if (pricesResult.success && pricesResult.data) {
        setPrices(pricesResult.data);
        setLastUpdated(new Date());

        if (pricesResult.timestamp) {
          setDataTimestamp(new Date(pricesResult.timestamp));
        }
      } else {
        throw new Error('Invalid response format');
      }

      // Fetch pricing config (non-blocking - use defaults if it fails)
      let resolvedConfig: PricingConfig;
      if (configResponse.ok) {
        const configResult = await configResponse.json();
        if (configResult.success && configResult.data) {
          resolvedConfig = {
            markup_percentage: configResult.data.markup_percentage,
            default_base_fee_percentage: configResult.data.default_base_fee_percentage,
            brand_base_fee_percentages: configResult.data.brand_base_fee_percentages || {},
          };
        } else {
          resolvedConfig = { markup_percentage: 10, default_base_fee_percentage: 2, brand_base_fee_percentages: {} };
        }
      } else {
        resolvedConfig = { markup_percentage: 10, default_base_fee_percentage: 2, brand_base_fee_percentages: {} };
      }
      setPricingConfig(resolvedConfig);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch prices');
      // Set default pricing config on error
      setPricingConfig({
        markup_percentage: 10,
        default_base_fee_percentage: 2,
        brand_base_fee_percentages: {},
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch immediately on mount
    fetchPrices();

    // Schedule next fetch at the wall-clock 5-minute mark, then repeat every 5 minutes
    const initialDelay = msUntilNextUpdate();
    logger.log('Next price update in', Math.round(initialDelay / 1000), 's (at', getNextUpdateTime().toLocaleTimeString(), ')');

    let intervalId: NodeJS.Timeout | null = null;

    const timeoutId = setTimeout(() => {
      const marketStatus = getMarketStatus();
      if (marketStatus.isOpen) {
        fetchPrices();
      }
      setNextUpdateTime(getNextUpdateTime());

      // Then repeat every 5 minutes, aligned to the clock
      intervalId = setInterval(() => {
        const status = getMarketStatus();
        if (status.isOpen) {
          fetchPrices();
        }
        setNextUpdateTime(getNextUpdateTime());
      }, FETCH_INTERVAL_MS);
    }, initialDelay);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [fetchPrices]);

  return (
    <MetalPricesContext.Provider value={{ prices, pricingConfig, isLoading, error, lastUpdated, dataTimestamp, nextUpdateTime, refetch: fetchPrices }}>
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