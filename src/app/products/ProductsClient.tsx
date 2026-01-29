'use client';

import { useState, useMemo, useEffect } from 'react';
import { Product } from '@/types/product';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMetalPrices } from '@/contexts/MetalPricesContext';
import { MetalSymbol } from '@/lib/metals-api/metalsApi';
import { calculateBulkPricingFromCache } from '@/lib/pricing/priceCalculations';
import { ShoppingCartIcon, Filter, X } from "lucide-react";
import { useCurrency } from '@/contexts/CurrencyContext'
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';
import { generateSlug } from '@/lib/utils/slug';

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
    const router = useRouter();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'name'>('price-asc');
    const [productsWithPricing, setProductsWithPricing] = useState<ProductWithDynamicPrice[]>(products);
    const [selectedFormType, setSelectedFormType] = useState<string>('all');
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    const { prices: metalPrices, isLoading: loadingPrices } = useMetalPrices();

    // Read URL query parameters
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

        const metalPriceMap = new Map<MetalSymbol, number>(
            metalPrices.map(price => [price.symbol, price.price])
        );

        const priceMap = calculateBulkPricingFromCache(products, metalPriceMap);

        const productsWithCalculatedPrices: ProductWithDynamicPrice[] = products.map(product => {
            const priceInfo = priceMap.get(product.id);
            
            if (!priceInfo) {
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

        if (searchQuery) {
            filtered = filtered.filter(product =>
              product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              product.description?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (selectedCategory !== 'all') {
            filtered = filtered.filter(product => (product.category || 'other') === selectedCategory);
        }
        
        if (selectedCategory === 'Gold' && selectedFormType !== 'all') {
            filtered = filtered.filter(p => p.form_type === selectedFormType);
        }

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

    const handleCategoryChange = (category: string) => {
        setSelectedCategory(category);
        setSelectedFormType('all');
        
        // Update URL
        const params = new URLSearchParams();
        if (category !== 'all') {
            params.set('category', category);
        }
        router.push(`/products${params.toString() ? `?${params.toString()}` : ''}`);
    };

    const handleFormTypeChange = (formType: string) => {
        setSelectedFormType(formType);
        
        // Update URL
        const params = new URLSearchParams();
        if (selectedCategory !== 'all') {
            params.set('category', selectedCategory);
        }
        if (formType !== 'all') {
            params.set('formType', formType);
        }
        router.push(`/products${params.toString() ? `?${params.toString()}` : ''}`);
    };

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedCategory('all');
        setSelectedFormType('all');
        router.push('/products');
    };

    // Sub-nav categories
    const subNavItems = [
        { name: 'All Products', category: 'all' },
        { name: 'Gold', category: 'Gold' },
        { name: 'Silver', category: 'Silver' },
        { name: 'Platinum', category: 'Platinum' },
        { name: 'Palladium', category: 'Palladium' },
    ];

    return (
      <div className="flex flex-col">
          {/* Sub Navigation Bar */}
          <div className="bg-card border-b border-border -mx-4 px-4 mb-8 shadow-sm">
              <div className="flex items-center gap-1 overflow-x-auto py-2">
                  {subNavItems.map((item) => (
                      <button
                          key={item.category}
                          onClick={() => handleCategoryChange(item.category)}
                          className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                              selectedCategory === item.category
                                  ? 'bg-primary text-primary-foreground'
                                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          }`}
                      >
                          {item.name}
                      </button>
                  ))}
              </div>

              {/* Form Type Sub-nav (when Gold selected) */}
              {selectedCategory === 'Gold' && (
                  <div className="flex items-center gap-1 pb-2 border-t border-border/50 pt-2">
                      <span className="text-xs text-muted-foreground mr-2">Type:</span>
                      <button
                          onClick={() => handleFormTypeChange('all')}
                          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                              selectedFormType === 'all'
                                  ? 'bg-primary/20 text-primary'
                                  : 'text-muted-foreground hover:text-foreground'
                          }`}
                      >
                          All
                      </button>
                      <button
                          onClick={() => handleFormTypeChange('cast')}
                          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                              selectedFormType === 'cast'
                                  ? 'bg-primary/20 text-primary'
                                  : 'text-muted-foreground hover:text-foreground'
                          }`}
                      >
                          Cast Bars
                      </button>
                      <button
                          onClick={() => handleFormTypeChange('minted')}
                          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                              selectedFormType === 'minted'
                                  ? 'bg-primary/20 text-primary'
                                  : 'text-muted-foreground hover:text-foreground'
                          }`}
                      >
                          Minted
                      </button>
                  </div>
              )}
          </div>

          <div className="flex gap-8">
              {/* Left Sidebar Filters - Desktop */}
              <aside className="hidden lg:block w-64 flex-shrink-0">
                  <div className="sticky top-[160px] space-y-6">
                      {/* Search */}
                      <div>
                          <label className="block text-sm font-medium text-foreground mb-2">Search</label>
                          <input
                              type="text"
                              placeholder="Search products..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                          />
                      </div>

                      {/* Sort */}
                      <div>
                          <label className="block text-sm font-medium text-foreground mb-2">Sort By</label>
                          <select
                              value={sortBy}
                              onChange={(e) => setSortBy(e.target.value as any)}
                              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                          >
                              <option value="price-asc">Price: Low to High</option>
                              <option value="price-desc">Price: High to Low</option>
                              <option value="name">Name: A-Z</option>
                          </select>
                      </div>

                      {/* Categories */}
                      <div>
                          <label className="block text-sm font-medium text-foreground mb-2">Categories</label>
                          <div className="space-y-1">
                              <button
                                  onClick={() => handleCategoryChange('all')}
                                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                      selectedCategory === 'all'
                                          ? 'bg-primary/10 text-primary font-medium'
                                          : 'text-muted-foreground hover:bg-muted'
                                  }`}
                              >
                                  All Products
                              </button>
                              {categories.map(category => (
                                  <button
                                      key={category}
                                      onClick={() => handleCategoryChange(category)}
                                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                          selectedCategory === category
                                              ? 'bg-primary/10 text-primary font-medium'
                                              : 'text-muted-foreground hover:bg-muted'
                                      }`}
                                  >
                                      {categoryNames[category] || category}
                                  </button>
                              ))}
                          </div>
                      </div>

                      {/* Clear Filters */}
                      {(searchQuery || selectedCategory !== 'all' || selectedFormType !== 'all') && (
                          <button
                              onClick={clearFilters}
                              className="w-full px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                              <X className="h-4 w-4" />
                              Clear All Filters
                          </button>
                      )}

                      {/* Results Count */}
                      <div className="text-sm text-muted-foreground pt-4 border-t border-border">
                          Showing {filteredProducts.length} of {productsWithPricing.length} products
                      </div>
                  </div>
              </aside>

              {/* Mobile Filter Button */}
              <button
                  onClick={() => setShowMobileFilters(true)}
                  className="lg:hidden fixed bottom-4 right-4 z-40 bg-primary text-primary-foreground px-4 py-3 rounded-full shadow-lg flex items-center gap-2"
              >
                  <Filter className="h-5 w-5" />
                  Filters
              </button>

              {/* Mobile Filters Modal */}
              {showMobileFilters && (
                  <div className="lg:hidden fixed inset-0 z-50 bg-background">
                      <div className="flex items-center justify-between p-4 border-b border-border">
                          <h2 className="text-lg font-semibold">Filters</h2>
                          <button
                              onClick={() => setShowMobileFilters(false)}
                              className="p-2 hover:bg-muted rounded-lg"
                          >
                              <X className="h-5 w-5" />
                          </button>
                      </div>
                      <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-140px)]">
                          {/* Search */}
                          <div>
                              <label className="block text-sm font-medium text-foreground mb-2">Search</label>
                              <input
                                  type="text"
                                  placeholder="Search products..."
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                              />
                          </div>

                          {/* Sort */}
                          <div>
                              <label className="block text-sm font-medium text-foreground mb-2">Sort By</label>
                              <select
                                  value={sortBy}
                                  onChange={(e) => setSortBy(e.target.value as any)}
                                  className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                              >
                                  <option value="price-asc">Price: Low to High</option>
                                  <option value="price-desc">Price: High to Low</option>
                                  <option value="name">Name: A-Z</option>
                              </select>
                          </div>

                          {/* Categories */}
                          <div>
                              <label className="block text-sm font-medium text-foreground mb-2">Categories</label>
                              <div className="flex flex-wrap gap-2">
                                  <button
                                      onClick={() => handleCategoryChange('all')}
                                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                          selectedCategory === 'all'
                                              ? 'bg-primary text-primary-foreground'
                                              : 'bg-muted text-foreground'
                                      }`}
                                  >
                                      All
                                  </button>
                                  {categories.map(category => (
                                      <button
                                          key={category}
                                          onClick={() => handleCategoryChange(category)}
                                          className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                              selectedCategory === category
                                                  ? 'bg-primary text-primary-foreground'
                                                  : 'bg-muted text-foreground'
                                          }`}
                                      >
                                          {categoryNames[category] || category}
                                      </button>
                                  ))}
                              </div>
                          </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-background">
                          <div className="flex gap-3">
                              <button
                                  onClick={clearFilters}
                                  className="flex-1 px-4 py-3 border border-border rounded-lg font-medium"
                              >
                                  Clear All
                              </button>
                              <button
                                  onClick={() => setShowMobileFilters(false)}
                                  className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium"
                              >
                                  Show {filteredProducts.length} Products
                              </button>
                          </div>
                      </div>
                  </div>
              )}

              {/* Products Grid */}
              <div className="flex-1">
                  {loadingPrices && (
                      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-center text-sm">
                          <p className="text-blue-800 dark:text-blue-200">Loading live prices...</p>
                      </div>
                  )}

                  {filteredProducts.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                          {filteredProducts.map((product) => (
                              <ProductCard key={product.id} product={product} loadingPrices={loadingPrices} />
                          ))}
                      </div>
                  ) : (
                      <div className="text-center py-16">
                          <div className="text-5xl mb-4">🔍</div>
                          <h3 className="text-xl font-bold text-foreground mb-2">No products found</h3>
                          <p className="text-muted-foreground mb-6">Try adjusting your filters</p>
                          <button
                              onClick={clearFilters}
                              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium"
                          >
                              Clear Filters
                          </button>
                      </div>
                  )}
              </div>
          </div>
      </div>
    );
}


function ProductCard({ product, loadingPrices }: { product: ProductWithDynamicPrice; loadingPrices: boolean }) {
    const { formatPrice } = useCurrency();
    const { addToCartById } = useCart();

    const displayPrice = product.calculated_price ?? product.price;

    const handleAddToCart = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const success = await addToCartById(product.id);
        if (success) {
            toast.success('Added to cart!', {
                description: product.name,
            });
        } else {
            toast.error('Failed to add to cart');
        }
    };

    return (
        <Link
            href={`/products/${generateSlug(product.name)}`}
            className="group block"
        >
            <div className="bg-card rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg shadow-sm">
                {/* Product Image */}
                <div className="relative aspect-square bg-muted/30">
                    <Image
                        src={product.image_url || '/anblogo.png'}
                        alt={product.name}
                        fill
                        className="object-contain p-4 group-hover:scale-105 transition-transform duration-300 mix-blend-multiply dark:mix-blend-normal"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    />
                </div>

                {/* Product Info */}
                <div className="p-4">
                    <h3 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 text-sm mb-2 min-h-[2.5rem]">
                        {product.name}
                    </h3>

                    {/* Price */}
                    <div className="flex items-center justify-between">
                        <div>
                            {loadingPrices ? (
                                <div className="h-6 w-20 bg-muted animate-pulse rounded" />
                            ) : (
                                <div className="text-lg font-bold text-foreground">
                                    {formatPrice(displayPrice)}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleAddToCart}
                            className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                            aria-label="Add to cart"
                        >
                            <ShoppingCartIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </Link>
    );
}
