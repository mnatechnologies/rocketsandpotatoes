import { getMetalInfo, type MetalSymbol} from "@/lib/metals-api/metalsApi";
import { fetchMetalsQuotes} from "@/lib/metals-api/metalsApi";
import {error} from "next/dist/build/output/log";
import { createLogger } from "@/lib/utils/logger";

const logger = createLogger('PRICING');

interface PricingConfig {
  markup_percentage: number;
  base_fee: number;
  brand_base_fees?: Record<string, number>;
  //unsure what else may be added here
  volume_discounts?: {
    threshold: number;
    discount_percentage: number;
  }[];
}

const DEFAULT_CONFIG: PricingConfig = {
  markup_percentage: 10,
  base_fee: 10,
  brand_base_fees: {},
  volume_discounts: [
    {threshold: 100, discount_percentage: 2},
    {threshold: 500, discount_percentage: 5},
    {threshold: 1000, discount_percentage: 8},
  ],
}

// Helper function to get the base fee for a product based on brand
function getBaseFee(config: PricingConfig, brand?: string): number {
  if (brand && config.brand_base_fees && config.brand_base_fees[brand] !== undefined) {
    return config.brand_base_fees[brand];
  }
  return config.base_fee;
}

export interface ProductWithPricing {
  id: string;
  name: string;
  metal_type: MetalSymbol;
  weight_grams: number;
  base_price?: number;
  calculated_price: number;
  spot_price_per_gram: number;
  markup_amount: number;
}

function extractMetalType(product: any): MetalSymbol | null {

  if (product.metal_type) {
    const metalType = product.metal_type.toUpperCase();

    const metalMap: Record<string, MetalSymbol> = {
      'GOLD': "XAU",
      'XAU': 'XAU',
      'SILVER': 'XAG',
      'XAG': 'XAG',
      'PLATINUM': 'XPT',
      'XPT': 'XPT',
      'PALLADIUM': 'XPD',
      'XPD': 'XPD'
   }

   if (metalMap[metalType]) {
     return metalMap[metalType]
   }
  }

  // try to extract from category or name
  const searchText = (product.category || product.name || '').toLowerCase();

  if (searchText.includes('gold')) return 'XAU';
  if (searchText.includes('silver')) return 'XAG';
  if (searchText.includes('platinum')) return 'XPT';
  if (searchText.includes('palladium')) return 'XPD';

  return null;
}

function extractWeightGrams(product: any): number {
  if (product.weight_grams) {
    return product.weight_grams;
  }

  if (product.weight) {
    const weightStr = product.weight.toLowerCase();

    const kgMatch = weightStr.match(/(\d+(?:\.\d+)?)\s*kg/);
    if (kgMatch) {
      return parseFloat(kgMatch[1]) * 1000; // Convert kg to grams
    }

    const ozMatch = weightStr.match(/(\d+(?:\.\d+)?)\s*(?:troy\s*)?oz/);
    if (ozMatch) {
      return parseFloat(ozMatch[1]) * 31.1035; // Convert troy oz to grams
    }

    const gramMatch = weightStr.match(/(\d+(?:\.\d+)?)\s*g/);
    if (gramMatch) {
      return parseFloat(gramMatch[1]);
    }
  }

  // Default to 1 troy ounce if we can't determine
  return 31.1035;
}


export async function calculateBulkPricing(
  products: Array<{
    id: string;
    price?: number;
    base_price?: number;
    metal_type?: string;
    weight?: string;
    weight_grams?: number;
    category?: string;
    name?: string;
    brand?: string;
  }>,
  //   id: string;
  //   metal_type: MetalSymbol;
  //   weight_grams: number;
  //
  config?: PricingConfig
): Promise<Map<string, number>> {
  const priceMap = new Map<string, number>();

  const processedProducts = products.map(product => ({
    id: product.id,
    metal_type: extractMetalType(product),
    weight_grams: extractWeightGrams(product),
    original: product
  })).filter(p => p.metal_type !== null);

  // Get unique metal types needed
  const uniqueMetals = Array.from(new Set(
    processedProducts.map(p => p.metal_type).filter(Boolean)
  )) as MetalSymbol[];

  // ⚡ FETCH ONCE for all metals
  const quotes = await fetchMetalsQuotes({
    baseCurrency: 'USD',
    symbols: uniqueMetals
  });

  // Create a lookup map
  const metalPrices = new Map(
    quotes.map(q => [q.symbol, q.price / 31.1035]) // price per gram
  );

  // Calculate prices for all products using cached metal prices
  for (const product of processedProducts) {
    try {
      if (!product.metal_type) continue;

      const spotPricePerGram = metalPrices.get(product.metal_type);
      if (!spotPricePerGram) continue;

      const spotCost = spotPricePerGram * product.weight_grams;
      const cfg = config || DEFAULT_CONFIG;
      const markupAmount = spotCost * (cfg.markup_percentage / 100);
      const baseFee = getBaseFee(cfg, product.original.brand);
      const calculatedPrice = spotCost + markupAmount + baseFee;

      priceMap.set(product.id, Math.round(calculatedPrice * 100) / 100);
    } catch (error) {
      logger.error(`Error pricing product ${product.id}:`, error);
      const basePrice = product.original.price || product.original.base_price || 0;
      priceMap.set(product.id, basePrice);
    }
  }

  return priceMap;
}

/**
 * Client-side version of calculateBulkPricing that uses metal prices from MetalPricesContext
 * instead of fetching them from the API. This avoids duplicate API calls.
 */
export function calculateBulkPricingFromCache(
  products: Array<{
    id: string;
    price?: number;
    base_price?: number;
    metal_type?: string;
    weight?: string;
    weight_grams?: number;
    category?: string;
    name?: string;
    brand?: string;
  }>,
  metalPrices: Map<MetalSymbol, number>, // price per troy ounce
  config?: PricingConfig
): Map<string, { calculatedPrice: number; spotPricePerGram: number }> {
  const priceMap = new Map<string, { calculatedPrice: number; spotPricePerGram: number }>();

  const processedProducts = products.map(product => ({
    id: product.id,
    metal_type: extractMetalType(product),
    weight_grams: extractWeightGrams(product),
    original: product
  })).filter(p => p.metal_type !== null);

  logger.log('🔍 Processed products:', processedProducts.map(p => ({
    id: p.id,
    metal_type: p.metal_type,
    weight_grams: p.weight_grams,
    original_metal_type: p.original.metal_type,
    original_category: p.original.category
  })));

  // Convert metal prices from per troy ounce to per gram
  const metalPricesPerGram = new Map(
    Array.from(metalPrices.entries()).map(([symbol, pricePerOz]) => 
      [symbol, pricePerOz / 31.1035]
    )
  );

  // Calculate prices for all products using cached metal prices
  for (const product of processedProducts) {
    try {
      if (!product.metal_type) continue;

      const spotPricePerGram = metalPricesPerGram.get(product.metal_type);
      if (!spotPricePerGram) continue;

      const spotCost = spotPricePerGram * product.weight_grams;
      const cfg = config || DEFAULT_CONFIG;
      const markupAmount = spotCost * (cfg.markup_percentage / 100);
      const baseFee = getBaseFee(cfg, product.original.brand);
      const calculatedPrice = spotCost + markupAmount + baseFee;

      priceMap.set(product.id, {
        calculatedPrice: Math.round(calculatedPrice * 100) / 100,
        spotPricePerGram: Math.round(spotPricePerGram * 100) / 100
      });
    } catch (error) {
      logger.error(`Error pricing product ${product.id}:`, error);
      const basePrice = product.original.price || product.original.base_price || 0;
      priceMap.set(product.id, {
        calculatedPrice: basePrice,
        spotPricePerGram: 0
      });
    }
  }

  return priceMap;
}