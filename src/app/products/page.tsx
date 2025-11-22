'use client';

import { useEffect, useState } from 'react';
import ProductsClient from './ProductsClient';
import { createLogger } from '@/lib/utils/logger';

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
        const productsWithUrls = data.map((product: { image_url: string; }) => {
          const trimmedImageUrl = product.image_url?.trim();
          const imageUrl = trimmedImageUrl
            ? `https://vlvejjyyvzrepccgmsvo.supabase.co/storage/v1/object/public/Images/gold/${trimmedImageUrl}`
            : null;
          return { ...product, image_url: imageUrl };
        });

        setProducts(productsWithUrls);
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
      <div className="min-h-screen flex items-center justify-center">
        Loading products...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Products</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  const categoryNames = {
    gold_bars: 'Gold Bars',
    gold_coins: 'Gold Coins',
    silver_bars: 'Silver Bars',
    silver_coins: 'Silver Coins',
    platinum_bars: 'Platinum Bars',
    platinum_coins: 'Platinum Coins',
    palladium_bars: 'Palladium Bars',
    other: 'Other Products',
  };

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
        <ProductsClient products={products} categoryNames={categoryNames} />
      </div>
    </div>
  );
}