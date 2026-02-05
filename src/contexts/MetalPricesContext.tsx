'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  default_base_fee: number;
  brand_base_fees?: Record<string, number>;
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

export function MetalPricesProvider({ children }: { children: ReactNode }) {
  const [prices, setPrices] = useState<MetalPrice[]>([]);
  const [pricingConfig, setPricingConfig] = useState<PricingConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [dataTimestamp, setDataTimestamp] = useState<Date | null>(null)

  const fetchPrices = async () => {
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
      if (configResponse.ok) {
        const configResult = await configResponse.json();
        if (configResult.success && configResult.data) {
          setPricingConfig({
            markup_percentage: configResult.data.markup_percentage,
            default_base_fee: configResult.data.default_base_fee,
            brand_base_fees: configResult.data.brand_base_fees || {},
          });
        }
      } else {
        // Use defaults if pricing config fetch fails
        setPricingConfig({
          markup_percentage: 10,
          default_base_fee: 10,
          brand_base_fees: {},
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch prices');
      // Set default pricing config on error
      setPricingConfig({
        markup_percentage: 10,
        default_base_fee: 10,
        brand_base_fees: {},
      });
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
          logger.log('📊 Markets OPEN - Starting price polling (every 5 minutes)');
          priceInterval = setInterval(fetchPrices, UPDATE_INTERVAL_OPEN);
        }
      } else {
        // Markets are closed - stop polling to save API quota
        if (priceInterval) {
          logger.log('🔴 Markets CLOSED - Stopping price polling');
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
    <MetalPricesContext.Provider value={{ prices, pricingConfig, isLoading, error, lastUpdated, dataTimestamp, refetch: fetchPrices }}>
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