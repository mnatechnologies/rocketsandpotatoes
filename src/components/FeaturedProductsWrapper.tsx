'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/types/product';
import FeaturedProducts from './FeaturedProducts';
import { useMetalPrices } from '@/contexts/MetalPricesContext';
import { MetalSymbol } from '@/lib/metals-api/metalsApi';
import { calculateBulkPricingFromCache } from '@/lib/pricing/priceCalculations';

interface FeaturedProductsWrapperProps {
  products: Product[];
}

interface ProductWithDynamicPrice extends Product {
  calculated_price?: number;
}

export default function FeaturedProductsWrapper({ products }: FeaturedProductsWrapperProps) {
  const [productsWithPricing, setProductsWithPricing] = useState<ProductWithDynamicPrice[]>(products);
  
  // Use shared metal prices from context
  const { prices: metalPrices, isLoading: loadingPrices } = useMetalPrices();

  // Calculate product prices when metal prices change
  useEffect(() => {
    if (loadingPrices || !metalPrices || metalPrices.length === 0) {
      // Use static prices while loading
      setProductsWithPricing(products);
      return;
    }

    // Create a map of metal prices (price per troy ounce) for calculateBulkPricingFromCache
    const metalPriceMap = new Map<MetalSymbol, number>(
      metalPrices.map(price => [price.symbol, price.price])
    );

    // Use centralized pricing calculation from priceCalculations.ts
    const priceMap = calculateBulkPricingFromCache(products, metalPriceMap);

    // Map the results back to products with pricing
    const productsWithCalculatedPrices: ProductWithDynamicPrice[] = products.map(product => {
      const priceInfo = priceMap.get(product.id);
      
      if (!priceInfo) {
        // Fallback to base price if calculation failed
        return {
          ...product,
          calculated_price: product.price,
        };
      }

      return {
        ...product,
        calculated_price: priceInfo.calculatedPrice,
      };
    });

    setProductsWithPricing(productsWithCalculatedPrices);
  }, [products, metalPrices, loadingPrices]);

  // Pass products with calculated prices to FeaturedProducts
  // Map calculated_price to price so FeaturedProducts can use it
  const productsForDisplay = productsWithPricing.map(product => ({
    ...product,
    price: product.calculated_price ?? product.price,
  }));

  return <FeaturedProducts products={productsForDisplay} />;
}
