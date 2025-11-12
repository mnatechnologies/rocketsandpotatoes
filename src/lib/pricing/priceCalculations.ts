import { getMetalInfo, type MetalSymbol} from "@/lib/metals-api/metalsApi";
import { fetchMetalsQuotes} from "@/lib/metals-api/metalsApi";
import {error} from "next/dist/build/output/log";

interface PricingConfig {
  markup_percentage: number;
  base_fee: number;
  //unsure what else may be added here
  volume_discounts?: {
    threshold: number;
    discount_percentage: number;
  }[];
}

const DEFAULT_CONFIG: PricingConfig = {
  markup_percentage: 5,
  base_fee: 10,
  volume_discounts: [
    {threshold: 100, discount_percentage: 2},
    {threshold: 500, discount_percentage: 5},
    {threshold: 1000, discount_percentage: 8},
  ],
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

  // Try to extract from category or name
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

export async function calculateProductPrice(
  metalType: MetalSymbol,
  weightGrams: number,
  config: PricingConfig = DEFAULT_CONFIG
): Promise<{
  calculatedPrice: number;
  spotPricePerGram: number;
  markupAmount: number;
  breakdown: {
    spotCost: number;
    markup: number;
    baseFee: number;
    total: number;
  }
}> {
  try {
    const quotes = await fetchMetalsQuotes({
      baseCurrency: 'USD',
      symbols: [metalType]
    });

    const metalData = quotes.find(quote => quote.symbol === metalType);

    if (!metalData) {
      throw new Error(`Price not found for ${metalType}`);
    }
    // prices are coming in via troy ounce (31.1035g)

    const GRAMS_PER_TROY_OUNCE = 31.1035;
    const spotPricePerGram = metalData.price / GRAMS_PER_TROY_OUNCE

    const spotCost = spotPricePerGram * weightGrams;

    const markupAmount = spotCost *  (config.markup_percentage / 100);

    const calculatedPrice = spotCost + markupAmount + config.base_fee;

    return {
      calculatedPrice: Math.round(calculatedPrice * 100) / 100,
      spotPricePerGram: Math.round(spotPricePerGram * 100) / 100,
      markupAmount: Math.round(markupAmount * 100) / 100,
      breakdown: {
        spotCost: Math.round(spotCost * 100) / 100,
        markup: Math.round(markupAmount * 100) / 100,
        baseFee: config.base_fee,
        total: Math.round(calculatedPrice * 100) / 100
      },
    }
  } catch (error) {
    console.error('Error calculating price:', error )
    throw error
  }
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

  const groupedByMetal = processedProducts.reduce((acc, product) => {
    if (!acc[product.metal_type]) {
      acc[product.metal_type] = [];
    }
    acc[product.metal_type].push(product);
    return acc
  }, {} as Record<MetalSymbol, typeof processedProducts>);

  for (const [metalType, metalProducts] of Object.entries(groupedByMetal)) {
    for (const product of metalProducts) {
      try {
        const { calculatedPrice } = await calculateProductPrice(
          metalType as MetalSymbol,
          product.weight_grams,
          config
        );
        priceMap.set(product.id, calculatedPrice);
      } catch (error) {
        console.error(`Error pricing product ${product.id}:`, error);
        const basePrice = product.original.price || product.original.base_price || 0;

        priceMap.set(product.id, basePrice)
      }
    }
  }
  return priceMap
}