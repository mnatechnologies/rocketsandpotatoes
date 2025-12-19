'use client';

import { useState, useMemo, useEffect } from 'react';
import { Product } from '@/types/product';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useMetalPrices } from '@/contexts/MetalPricesContext';
import { MetalSymbol } from '@/lib/metals-api/metalsApi';
import { calculateBulkPricingFromCache } from '@/lib/pricing/priceCalculations';
import { ShoppingCartIcon } from "lucide-react";
import { createLogger } from '@/lib/utils/logger'
import { useCurrency } from '@/contexts/CurrencyContext'
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';

const logger = createLogger('PRODUCT_CLIENT')

interface ProductsClientProps {
    products: Product[];
    categoryNames: Record<string, string>;
}

interface ProductWithDynamicPrice extends Product {
    calculated_price?: number;
    price_difference?: number;
    spot_price_per_gram?: number;
}

export default function ProductsClient({ products, categoryNames }: ProductsClientProps) {
    const searchParams = useSearchParams();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'name'>('price-asc');
    const [productsWithPricing, setProductsWithPricing] = useState<ProductWithDynamicPrice[]>(products);
    const [selectedFormType, setSelectedFormType] = useState<string>('all');

    // Use shared metal prices from context
    const { prices: metalPrices, isLoading: loadingPrices, error, lastUpdated } = useMetalPrices();
    const priceError = error ? 'Using static prices' : null;

    // Read URL query parameters and set filters on mount/URL change
    useEffect(() => {
        const categoryParam = searchParams.get('category');
        const formTypeParam = searchParams.get('formType');

        if (categoryParam) {
            setSelectedCategory(categoryParam);
        }

        if (formTypeParam) {
            setSelectedFormType(formTypeParam);
        }
    }, [searchParams]);

    // Calculate product prices when metal prices change
    useEffect(() => {
        if (loadingPrices || !metalPrices || metalPrices.length === 0) {
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
                    price_difference: 0,
                };
            }

            const priceDifference = priceInfo.calculatedPrice - product.price;

            return {
                ...product,
                calculated_price: priceInfo.calculatedPrice,
                price_difference: Math.round(priceDifference * 100) / 100,
                spot_price_per_gram: priceInfo.spotPricePerGram,
            };
        });

        setProductsWithPricing(productsWithCalculatedPrices);
    }, [products, metalPrices, loadingPrices]);

    // Get unique categories from products
    const categories = useMemo(() => {
        const cats = new Set(productsWithPricing.map(p => p.category || 'other'));
        return Array.from(cats);
    }, [productsWithPricing]);

    // Filter and sort products
    const filteredProducts = useMemo(() => {
        let filtered = productsWithPricing;

        // Filter by search query
        if (searchQuery) {
            filtered = filtered.filter(product =>
              product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              product.description?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Filter by category
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(product => (product.category || 'other') === selectedCategory);
        }
        
        if (selectedCategory === 'Gold' && selectedFormType !== 'all') {
            filtered = filtered.filter(p => p.form_type === selectedFormType);
        }

        // Sort products - use calculated_price if available
        const sorted = [...filtered].sort((a, b) => {
            const priceA = a.calculated_price ?? a.price;
            const priceB = b.calculated_price ?? b.price;

            switch (sortBy) {
                case 'price-asc':
                    return priceA - priceB;
                case 'price-desc':
                    return priceB - priceA;
                case 'name':
                    return a.name.localeCompare(b.name);
                default:
                    return 0;
            }
        });

        return sorted;
    }, [productsWithPricing, searchQuery, selectedCategory, sortBy, selectedFormType]);

    // Group by category for display
    const productsByCategory = useMemo(() => {
        return filteredProducts.reduce((acc, product) => {
            const category = product.category || 'other';

            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(product);
            return acc;
        }, {} as Record<string, ProductWithDynamicPrice[]>);
    }, [filteredProducts]);

    return (
      <>
          {/* Price Loading/Error Banner */}
          {loadingPrices && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                <p className="text-blue-800">Loading live metal prices...</p>
            </div>
          )}

          {priceError && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                <p className="text-yellow-800">⚠️ {priceError}</p>
            </div>
          )}

          {/* Search and Filter Controls */}
          <div className="mb-8 space-y-4">
              {/* Search Bar */}
              <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      />
                  </div>

                  {/* Sort Dropdown */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="cursor-pointer px-4 py-2 border border-gray-300 text-primary rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  >
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                      <option value="name">Name: A-Z</option>
                  </select>
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                      selectedCategory === 'all'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                      All Products
                  </button>
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                        selectedCategory === category
                          ? 'bg-yellow-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                        {categoryNames[category] || category}
                    </button>
                  ))}
              </div>

              {selectedCategory === 'Gold' && (
                <div className="flex gap-2 ml-4">
                    <button 
                    onClick={() => setSelectedFormType('all')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                      selectedFormType === 'all'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    >
                        All Gold</button>
                    <button 
                    onClick={() => setSelectedFormType('cast')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                      selectedFormType === 'cast'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    >
                        Cast Bars</button>
                    <button 
                    onClick={() => setSelectedFormType('minted')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                      selectedFormType === 'minted'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    >
                        Minted Tablets</button>
                </div>
            )}

              {/* Results Count */}
              <div className="text-gray-600">
                  Showing {filteredProducts.length} of {productsWithPricing.length} products
              </div>
          </div>

          {/* Products Display */}
          {Object.entries(productsByCategory).map(([category, categoryProducts]) => (
            <div key={category} className="mb-16">
                <h2 className="text-3xl font-bold text-primary mb-6 border-b-2 border-yellow-500 pb-2">
                    {categoryNames[category] || category}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {categoryProducts.map((product) => (
                      <ProductCard key={product.id} product={product} loadingPrices={loadingPrices} lastUpdated={lastUpdated as Date} />
                    ))}
                </div>
            </div>
          ))}

          {filteredProducts.length === 0 && (
            <div className="text-center py-8 sm:py-12 max-w-md mx-auto px-4">
                <div className="mb-6">
                    <div className="text-5xl sm:text-6xl mb-4">🔍</div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                        No products found
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600">
                        We couldn&apos;t find any products matching your criteria.
                    </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 sm:p-6 mb-6">
                    <p className="text-sm font-semibold text-gray-700 mb-3">
                        Try the following:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-2 text-left">
                        <li className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            <span>Clear your filters or search query</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            <span>Browse all categories</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            <span>Check back later for new inventory</span>
                        </li>
                    </ul>
                </div>

                <button
                    onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('all');
                        setSelectedFormType('all');
                    }}
                    className="px-6 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition-colors shadow-md text-sm sm:text-base w-full sm:w-auto"
                >
                    Clear All Filters
                </button>
            </div>
          )}
      </>
    );
}


function ProductCard({ product, loadingPrices, lastUpdated }: { product: ProductWithDynamicPrice; loadingPrices: boolean; lastUpdated: Date }) {
    const { formatPrice, currency } = useCurrency();
    const { addToCartById } = useCart();

    const displayPrice = product.calculated_price ?? product.price;

    const handleAddToCart = async (e: React.MouseEvent) => {
        e.preventDefault();
        const success = await addToCartById(product.id);
        if (success) {
            toast.success('Added to cart!', {
                description: product.name,
            });
        } else {
            toast.error('Failed to add to cart');
        }
    };

    const formatDateTime = (date: Date) => {
        return date.toLocaleString("en-AU", {
            timeZone: 'Australia/Sydney',
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
        });
    };

    // Format category name
    const formatCategoryName = (category: string): string => {
        return category
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    // Format form type (subcategory)
    const formatFormType = (formType: 'cast' | 'minted' | null | undefined): string | null => {
        if (!formType) return null;
        return formType === 'cast' ? 'Cast' : 'Minted';
    };

    return (
      <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
          <div className="relative h-48 bg-gray-100">
              <Image
                src={product.image_url || '/anblogo.png'}
                alt={product.name}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              />
              {/* Category Badge Overlay */}
              <div className="absolute top-2 left-2 flex flex-col gap-1">
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-white/95 text-primary border border-primary/20 shadow-sm">
                      {formatCategoryName(product.category)}
                  </span>
                  {product.form_type && (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-blue-500/95 text-white shadow-sm">
                          {formatFormType(product.form_type)}
                      </span>
                  )}
              </div>
              {/*{!product.stock && (*/}
              {/*  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">*/}
              {/*      <span className="text-white text-xl font-bold">Out of Stock</span>*/}
              {/*  </div>*/}
              {/*)}*/}
          </div>

          <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {product.name}
              </h3>

              <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Weight:</span>
                      <span className="font-bold text-primary">{product.weight}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Purity:</span>
                      <span className="font-medium text-primary">{product.purity}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Rating:</span>
                      <span className="font-medium text-primary">⭐ {product.rating}/5</span>
                  </div>
                  {product.spot_price_per_gram && (
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>Spot/gram:</span>
                        <span>{formatPrice(product.spot_price_per_gram)}</span>
                    </div>
                  )}
              </div>

              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {product.description}
              </p>

              <Link
                href={`/products/${product.id}`}
                className="block w-full text-center px-4 py-3 rounded-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-colors shadow-gold"
              >
                  View Details
              </Link>

              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div>
                      {loadingPrices ? (
                        <div className="text-2xl font-bold text-gray-400 animate-pulse">
                            Loading...
                        </div>
                      ) : (
                        <>
                            <div className="text-2xl font-bold text-gray-900">
                                {formatPrice(displayPrice)} {currency}
                            </div>
                            <div className="text-xs text-green-600 font-medium mt-1">
                                ✓ Live Market Price
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                Updated {formatDateTime(lastUpdated)}
                            </div>
                        </>
                      )}
                  </div>

                  <button
                    onClick={handleAddToCart}
                    className="px-4 py-2 rounded-lg font-semibold transition-colors bg-yellow-500 hover:bg-yellow-600 text-white cursor-pointer"
                    aria-label="Add to cart"
                  >
                      <ShoppingCartIcon/>
                  </button>
              </div>
          </div>
      </div>
    );
}