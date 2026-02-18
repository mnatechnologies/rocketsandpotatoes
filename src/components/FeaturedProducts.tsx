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
    <section className="py-16 lg:py-20 bg-muted/20">
      <div className="container mx-auto px-4 lg:px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-3 text-foreground tracking-tight">
            Featured Products
          </h2>
          <p className="text-base text-muted-foreground max-w-lg mx-auto">
            Discover our curated selection of premium precious metals
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/products/${generateSlug(product.name)}`}
              className="group block"
            >
              <div className="overflow-hidden transition-all duration-200 hover:-translate-y-0.5">
                {/* Product Image */}
                <div className="relative aspect-square">
                  <Image
                    src={product.image_url || '/anblogo.png'}
                    alt={product.name}
                    fill
                    className="object-contain p-5 group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </div>

                {/* Product Title */}
                <div className="p-4 text-center">
                  <h3 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {product.name}
                  </h3>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-10">
          <Link
            href="/products"
            className="inline-flex items-center justify-center px-7 py-3.5 rounded-lg font-semibold text-base bg-primary hover:bg-primary/90 text-primary-foreground transition-colors shadow-gold"
          >
            View All Products
            <svg className="ml-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14"/>
              <path d="m12 5 7 7-7 7"/>
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
