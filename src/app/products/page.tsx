import { createServerSupabase } from '@/lib/supabase/server';
import ProductsClient from './ProductsClient';
import { createLogger } from '@/lib/utils/logger';
/* eslint-disable  */

const logger = createLogger('PRODUCTS_PAGE');

export default async function ProductsPage() {
  const supabase = await createServerSupabase();

  logger.log('Fetching products from database');

  const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('stock', true)
      .order('category', { ascending: true })
      .order('price', { ascending: true });

  // Check for error BEFORE using products
  if (error) {
    logger.error('Error fetching products:', error);
    return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Products</h1>
            <p className="text-gray-600">{error.message}</p>
          </div>
        </div>
    );
  }

  // Now transform products with URLs
  const productsWithUrls = products?.map(product => {
    const trimmedImageUrl = product.image_url?.trim();
    const imageUrl = trimmedImageUrl
        ? supabase.storage.from('Images').getPublicUrl(`gold/${trimmedImageUrl}`).data.publicUrl
        : null;

    logger.log('Product:', product.name, 'Image URL:', imageUrl);

    return {
      ...product,
      image_url: imageUrl
    };
  });

  logger.log(`Successfully fetched ${productsWithUrls?.length || 0} products with images`);

  const categoryNames: Record<string, string> = {
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
              Premium bullion from Australia's most trusted mints
            </p>
          </div>

          <ProductsClient products={productsWithUrls || []} categoryNames={categoryNames} />
        </div>
      </div>
  );
}