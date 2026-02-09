'use client';

import { useEffect, useState, Suspense } from 'react';
import ProductsClient from './ProductsClient';
import { createLogger } from '@/lib/utils/logger';
import ProductCardSkeleton from '@/components/skeletons/ProductCardSkeleton';

const logger = createLogger('PRODUCTS_PAGE');

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch('/api/products');
        if (!response.ok) throw new Error('Failed to fetch products');
        const data = await response.json();

        // Transform with image URLs
        const productsWithUrls = data.map((product:  { category: string; image_url: string; form_type: string; }) => {
          const trimmedImageUrl = product.image_url?.trim();
          const imageUrl = trimmedImageUrl
          ? `https://vlvejjyyvzrepccgmsvo.supabase.co/storage/v1/object/public/Images/${product.category.toLowerCase()}/${product.form_type ?`${product.form_type}/` : ''}${trimmedImageUrl}`            : null;
          return { ...product, image_url: imageUrl };
        });

        setProducts(productsWithUrls);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        logger.error('Error fetching products:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-primary my-4">
              Precious Metals Products
            </h1>
            <p className="text-xl text-secondary">
              Premium bullion from Australia&#39;s most trusted mints
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Products</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  const categoryNames: Record<string, string> = {
    Gold: 'Gold',
    Silver: 'Silver',
    Platinum: 'Platinum',
    Palladium: 'Palladium',
    other: 'Other Products',
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-foreground my-4 tracking-tight">
            Precious Metals Products
          </h1>
          <p className="text-base text-muted-foreground">
            Premium bullion from Australia&#39;s most trusted mints
          </p>
        </div>
        <Suspense fallback={<div className="text-center">Loading filters...</div>}>
          <ProductsClient products={products} categoryNames={categoryNames} />
        </Suspense>
      </div>
    </div>
  );
}