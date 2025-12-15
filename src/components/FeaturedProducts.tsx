'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Product } from '@/types/product';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useMetalPrices } from '@/contexts/MetalPricesContext';
import { calculateBulkPricingFromCache } from '@/lib/pricing/priceCalculations';
import { MetalSymbol } from '@/lib/metals-api/metalsApi';

interface FeaturedProductsProps {
  products: Product[];
}

export default function FeaturedProducts({ products }: FeaturedProductsProps) {
  const { formatPrice, currency } = useCurrency();
  const { prices: metalPrices, isLoading: loadingPrices } = useMetalPrices();
  const [livePrices, setLivePrices] = useState<Map<string, number>>(new Map());

  // Calculate live prices when metal prices update
  useEffect(() => {
    if (loadingPrices || !metalPrices || metalPrices.length === 0) {
      return;
    }

    const metalPriceMap = new Map<MetalSymbol, number>(
      metalPrices.map(price => [price.symbol, price.price])
    );

    const priceMap = calculateBulkPricingFromCache(products, metalPriceMap);

    const newLivePrices = new Map<string, number>();
    priceMap.forEach((priceInfo, productId) => {
      newLivePrices.set(productId, priceInfo.calculatedPrice);
    });

    setLivePrices(newLivePrices);
  }, [products, metalPrices, loadingPrices]);

  const getProductPrice = (product: Product): number => {
    return livePrices.get(product.id) ?? product.price;
  };

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">
            <span className="gold-shimmer bg-clip-text text-transparent">Featured Products</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover our top precious metals with market-based pricing
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div 
              key={product.id} 
              className="bg-card rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-border hover:border-primary/50"
            >
              {/* Product Image */}
              <div className="relative h-48 bg-muted">
                <Image
                  src={product.image_url || '/anblogo.png'}
                  alt={product.name}
                  fill
                  className="object-contain p-4"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                />
              </div>

              {/* Product Details */}
              <div className="p-6">
                <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2 min-h-[3.5rem]">
                  {product.name}
                </h3>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Weight:</span>
                    <span className="font-semibold text-primary">{product.weight}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Purity:</span>
                    <span className="font-semibold text-primary">{product.purity}</span>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-4 pt-4 border-t border-border">
                  <div className="text-2xl font-bold text-foreground">
                    {formatPrice(getProductPrice(product))}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {currency}
                    {loadingPrices && <span className="ml-1">⟳</span>}
                  </div>
                </div>

                {/* Buttons */}
                <div className='grid grid-cols-2 gap-2'>
                  <Link
                    href={`/cart?add=${product.id}`}
                    className="block w-full text-center px-4 py-3 rounded-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-colors shadow-gold"
                  >
                    Add to Cart
                  </Link>
                  <Link
                    href={`/products/${product.id}`}
                    className="block w-full text-center px-4 py-3 rounded-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-colors shadow-gold"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <Link
            href="/products"
            className="inline-flex items-center justify-center px-8 py-4 rounded-lg font-semibold text-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-colors shadow-gold"
          >
            View All Products
            <svg className="ml-2 h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14"/>
              <path d="m12 5 7 7-7 7"/>
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
