'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface FeaturedProduct {
  id: string;
  name: string;
  category: string;
  weight: string;
  purity: string;
  image_url: string | null;
  base_price: number;
  calculated_price: number;
  price_difference: number;
}

export default function FeaturedProducts() {
  const [products, setProducts] = useState<FeaturedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all products and take the first 4 as featured
        const response = await fetch('/api/products/pricing');
        
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }

        const data = await response.json();

        if (data.success && data.data) {
          // Take first 4 products as featured
          setProducts(data.data.slice(0, 4));
        } else {
          throw new Error(data.error || 'Unknown error');
        }
      } catch (err) {
        console.error('Error fetching featured products:', err);
        setError(err instanceof Error ? err.message : 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  if (error) {
    return (
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-red-500">Error loading featured products: {error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">
            <span className="gold-shimmer bg-clip-text text-transparent">Featured Products</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover our top precious metals with live pricing
          </p>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-card rounded-lg shadow-md p-6 animate-pulse">
                <div className="bg-muted h-48 rounded-lg mb-4"></div>
                <div className="bg-muted h-6 rounded mb-2"></div>
                <div className="bg-muted h-4 rounded mb-4"></div>
                <div className="bg-muted h-8 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
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
                      {formatPrice(product.calculated_price)}
                    </div>
                    <div className="text-xs text-muted-foreground">AUD</div>
                    {product.price_difference !== 0 && (
                      <div className={`text-xs font-medium mt-1 ${
                        product.price_difference > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {product.price_difference > 0 ? '↑' : '↓'}
                        {formatPrice(Math.abs(product.price_difference))} from base
                      </div>
                    )}
                  </div>

                  {/* Add to Cart Button */}
                  <Link
                    href={`/cart?add=${product.id}`}
                    className="block w-full text-center px-4 py-3 rounded-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-colors shadow-gold"
                  >
                    Add to Cart
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

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
