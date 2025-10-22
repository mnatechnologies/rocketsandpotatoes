import { createServerSupabase } from '@/lib/supabase/server';
import { Product } from '@/types/product';
import Link from 'next/link';
import Image from 'next/image';

// Testing flag - set to true to enable console logging
const TESTING_MODE = process.env.TESTING_MODE === 'true' || true;

function log(...args: any[]) {
  if (TESTING_MODE) {
    console.log('[PRODUCTS_PAGE]', ...args);
  }
}

export default async function ProductsPage() {
  const supabase = createServerSupabase();
  
  log('Fetching products from database');
  
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .eq('stock', true)
    .order('category', { ascending: true })
    .order('price', { ascending: true });

  if (error) {
    log('Error fetching products:', error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Products</h1>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    );
  }

  log(`Successfully fetched ${products?.length || 0} products`);

  // Group products by category
  const productsByCategory = products?.reduce((acc, product) => {
    const category = product.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(product);
    return acc;
  }, {} as Record<string, Product[]>) || {};

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Precious Metals Products
          </h1>
          <p className="text-xl text-gray-600">
            Premium bullion from Australia's most trusted mints
          </p>
        </div>

        {Object.entries(productsByCategory).map(([category, categoryProducts]) => (
          <div key={category} className="mb-16">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b-2 border-yellow-500 pb-2">
              {categoryNames[category] || category}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {categoryProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        ))}

        {products?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600">No products available at this time.</p>
            <p className="text-gray-500 mt-2">Please check back soon.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
      <div className="relative h-48 bg-gray-100">
        <Image
          src={product.image_url || '/images/placeholder-product.jpg'}
          alt={product.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
        />
        {!product.in_stock && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white text-xl font-bold">Out of Stock</span>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {product.name}
        </h3>
        
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Weight:</span>
            <span className="font-medium">{product.weight}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Purity:</span>
            <span className="font-medium">{product.purity}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Rating:</span>
            <span className="font-medium">⭐ {product.rating}/5</span>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {product.description}
        </p>

        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              ${product.price.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-gray-500">AUD</div>
          </div>
          
          <Link
            href={`/cart?add=${product.id}`}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              product.in_stock
                ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {product.in_stock ? 'Add to Cart' : 'Unavailable'}
          </Link>
        </div>
      </div>
    </div>
  );
}
