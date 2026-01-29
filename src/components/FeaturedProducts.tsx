'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types/product';
import { generateSlug } from '@/lib/utils/slug';

interface FeaturedProductsProps {
  products: Product[];
}

export default function FeaturedProducts({ products }: FeaturedProductsProps) {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">
            <span className="gold-shimmer bg-clip-text text-transparent">Featured Products</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover our top precious metals
          </p>
        </div>

        {/* Products Grid - Simplified: Image + Title only */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/products/${generateSlug(product.name)}`}
              className="group block"
            >
              <div className="bg-card rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                {/* Product Image */}
                <div className="relative aspect-square bg-muted">
                  <Image
                    src={product.image_url || '/anblogo.png'}
                    alt={product.name}
                    fill
                    className="object-contain p-6 group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </div>

                {/* Product Title */}
                <div className="p-4 text-center">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {product.name}
                  </h3>
                </div>
              </div>
            </Link>
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
