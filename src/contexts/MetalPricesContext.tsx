'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
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

const FETCH_INTERVAL_MS = 300000; // 5 minutes

export function MetalPricesProvider({ children }: { children: ReactNode }) {
  const [prices, setPrices] = useState<MetalPrice[]>([]);
  const [pricingConfig, setPricingConfig] = useState<PricingConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [dataTimestamp, setDataTimestamp] = useState<Date | null>(null)
  const lastFetchedAt = useRef<number>(0);

  const fetchPrices = async (force = false) => {
    // Enforce strict 5-minute minimum between fetches
    const now = Date.now();
    if (!force && lastFetchedAt.current && now - lastFetchedAt.current < FETCH_INTERVAL_MS) {
      logger.log('Skipping fetch — last fetch was', Math.round((now - lastFetchedAt.current) / 1000), 's ago');
      return;
    }

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
        lastFetchedAt.current = Date.now();
        setLastUpdated(new Date());

        if (pricesResult.timestamp) {
          setDataTimestamp(new Date(pricesResult.timestamp));
        }
      } else {
        throw new Error('Invalid response format');
      }

      // Fetch pricing config (non-blocking - use defaults if it fails)
      if (configResponse.ok) {
        const configResult = await configResponse.json();
        if (configResult.success && configResult.data) {
          setPricingConfig({
            markup_percentage: configResult.data.markup_percentage,
            default_base_fee_percentage: configResult.data.default_base_fee_percentage,
            brand_base_fee_percentages: configResult.data.brand_base_fee_percentages || {},
          });
        }
      } else {
        // Use defaults if pricing config fetch fails
        setPricingConfig({
          markup_percentage: 10,
          default_base_fee_percentage: 2,
          brand_base_fee_percentages: {},
        });
      }
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
  };

  useEffect(() => {
    // Initial fetch on mount (throttled — skips if data is fresh)
    fetchPrices();

    // Strict 5-minute polling — market hours checked inside the tick
    const priceInterval = setInterval(() => {
      const marketStatus = getMarketStatus();
      if (marketStatus.isOpen) {
        fetchPrices(true);
      }
    }, FETCH_INTERVAL_MS);

    return () => clearInterval(priceInterval);
  }, []);

  return (
    <MetalPricesContext.Provider value={{ prices, pricingConfig, isLoading, error, lastUpdated, dataTimestamp, refetch: () => fetchPrices() }}>
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