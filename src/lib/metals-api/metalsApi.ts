const API_HOST = "https://api.metalpriceapi.com/v1";
import { getCachedData, setCachedData } from './cache';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('METALS_API');

const METALS = [
  {symbol: "XAU", label: "gold", ticker: "GOLD"},
  {symbol: "XAG", label: "silver", ticker: "SILVER"},
  {symbol: "XPT", label: "platinum", ticker: "PLATINUM"},
  {symbol: "XPD", label: "palladium", ticker: "PALLADIUM"},
] as const;

export type MetalSymbol = (typeof METALS)[number]["symbol"];
export type MetalInfo = (typeof METALS)[number];

const METAL_LOOKUP: Record<MetalSymbol, MetalInfo> = METALS.reduce(
  (acc, metal) => {
    acc[metal.symbol] = metal;
    return acc;
  },
  {} as Record<MetalSymbol, MetalInfo>
);

interface metalsQuote {
  symbol: MetalSymbol;
  price: number;
  change: number;
  changePercent: number;
  timestamp?: string;
  lastUpdated?: string
}

const getHistoricalDates = (days = 14) => {
  const results: string[] = [];
  const today = new Date()
  //has to start at 2 for data to pull from the day before yesterday to account for time zone differences.
  for (let i = 2; i < days; i++) {
    const cursor = new Date(today)
    cursor.setDate(cursor.getDate() - i);
    results.push(cursor.toISOString().split('T')[0]);
  }
  return results;
}

const fetchJson = async <T>(url: string) => {
  const cached = getCachedData(url);
  if (cached) {
    logger.log('✓ Using cached data for:', url);
    return cached as T;
  }

  const res = await fetch(url, { next: { revalidate: 300 } });



  if (!res.ok) {
    const errorText = await res.text();
    logger.error('❌ HTTP Error Response:', errorText);
    throw new Error(`HTTP ${res.status} from MetalpriceAPI: ${errorText}`);
  }

  const data = await res.json();

  if (!data.success) {
    const errorInfo = data.error?.info || data.error?.message || JSON.stringify(data.error);
    logger.error('❌ API Error:', errorInfo);
    throw new Error(`MetalpriceAPI error: ${errorInfo}`);
  }
  setCachedData(url, data)
  return data as T;
};

interface FetchMetalsQuotesOptions {
  symbols?: MetalSymbol[];
  baseCurrency?: string;
}

export const fetchMetalsQuotes = async (
  options?: FetchMetalsQuotesOptions
): Promise<metalsQuote[]> => {
  const { baseCurrency = "USD", symbols = METALS.map(m => m.symbol) } = options ?? {};
  const apiKey = process.env.METALPRICEAPI_API_KEY;

  if (!apiKey) {
    throw new Error('METALPRICEAPI_API_KEY environment variable is not set');
  }

  logger.log('🔑 API Key present:', apiKey ? 'Yes' : 'No');
  logger.log('💱 Base currency:', baseCurrency);
  logger.log('🏅 Symbols requested:', symbols);

  const params = new URLSearchParams({
    api_key: apiKey,
    base: baseCurrency,
    currencies: symbols.join(","),
  });

  logger.log('📊 Fetching latest rates...');
  const latest = await fetchJson<{
    success: boolean;
    base: string;
    rates: Record<MetalSymbol, number>
    timestamp?: number
  }>(`${API_HOST}/latest?${params}`);
  logger.log('✓ Latest rates received:', latest.rates);

  const dataTimestamp = latest.timestamp
    ? new Date(latest.timestamp * 1000).toISOString()
    : new Date().toISOString();
  logger.log('📅 Data timestamp:', dataTimestamp);


  let previousRates: Record<MetalSymbol, number> | null = null;

  logger.log('📅 Attempting to fetch historical data...');
  for (const date of getHistoricalDates()) {
    try {
      logger.log(`  Trying date: ${date}`);
      const historical = await fetchJson<{
        success: boolean;
        rates: Record<MetalSymbol, number>;
      }>(`${API_HOST}/${date}?${params}`);
      previousRates = historical.rates;
      logger.log(`✓ Historical data found for ${date}:`, historical.rates);
      break;
    } catch (error) {
      logger.log(`✗ Failed for ${date}:`, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  if (!previousRates) {
    logger.warn('⚠️ WARNING: No historical data available - all changes will show as 0%');
  }

  return symbols.map(symbol => {
    const rate = latest.rates?.[symbol];
    if (typeof rate !== "number") {
      throw new Error(`Missing ${symbol} rate`);
    }
    const price = 1 / rate;

    const previousRate = previousRates?.[symbol];
    const previous = previousRate ? 1 / previousRate : price;
    const change = price - previous;
    const changePercent = previous ? (change / previous) * 100 : 0;

    logger.log(`${symbol}: $${price.toFixed(2)} | Change: ${change >= 0 ? '+' : ''}${change.toFixed(2)} (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)`);

    return {
      symbol,
      price,
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      lastUpdated: dataTimestamp
    }
  })
}

export const getMetalInfo = (symbol: MetalSymbol): MetalInfo => METAL_LOOKUP[symbol];