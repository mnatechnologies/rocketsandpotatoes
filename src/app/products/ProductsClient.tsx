'use client';

import { useState, useMemo, useEffect } from 'react';
import { Product } from '@/types/product';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMetalPrices } from '@/contexts/MetalPricesContext';
import { MetalSymbol } from '@/lib/metals-api/metalsApi';
import { calculateBulkPricingFromCache } from '@/lib/pricing/priceCalculations';
import { ShoppingCartIcon, Filter, X, ChevronDown, Minus, Plus } from "lucide-react";
import { useCurrency } from '@/contexts/CurrencyContext'
import { useCart } from '@/contexts/CartContext';
import { getVolumeDiscount } from '@/lib/pricing/priceCalculations';
import { toast } from 'sonner';
import { generateSlug } from '@/lib/utils/slug';

interface ProductsClientProps {
    products: Product[];
}

interface ProductWithDynamicPrice extends Product {
    calculated_price?: number;
    price_difference?: number;
    spot_price_per_gram?: number;
}

export default function ProductsClient({ products }: ProductsClientProps) {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'name'>('price-asc');
    const [productsWithPricing, setProductsWithPricing] = useState<ProductWithDynamicPrice[]>(products);
    const [selectedFormType, setSelectedFormType] = useState<string>('all');
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [selectedWeight, setSelectedWeight] = useState<string>('All Weights');
    const [collapsedSections, setCollapsedSections] = useState({
        search: false,
        sort: false,
        categories: false,
        weight: false,
    });

    const { prices: metalPrices, pricingConfig, isLoading: loadingPrices } = useMetalPrices();

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
        if (loadingPrices || !metalPrices || metalPrices.length === 0 || !pricingConfig) {
            return;
        }

        const metalPriceMap = new Map<MetalSymbol, number>(
            metalPrices.map(price => [price.symbol, price.price])
        );

        // Transform pricingConfig to match the expected format
        const config = {
            markup_percentage: pricingConfig.markup_percentage,
            base_fee: pricingConfig.default_base_fee,
            brand_base_fees: pricingConfig.brand_base_fees,
        };

        const priceMap = calculateBulkPricingFromCache(products, metalPriceMap, config);

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
    }, [products, metalPrices, pricingConfig, loadingPrices]);

    // Get unique categories from products
    const categories = useMemo(() => {
        const cats = new Set(productsWithPricing.map(p => p.category || 'other'));
        return Array.from(cats);
    }, [productsWithPricing]);

    const categoryNames: Record<string, string> = {
        Gold: 'Gold',
        Silver: 'Silver',
        Platinum: 'Platinum',
        Palladium: 'Palladium',
        other: 'Other Products',
    };

    const handleCategoryChange = (category: string) => {
        setSelectedCategory(category);
        setSelectedFormType('all');
        setSelectedWeight('All Weights');

        // Update URL
        const params = new URLSearchParams();
        if (category !== 'all') {
            params.set('category', category);
        }
        router.push(`/products${params.toString() ? `?${params.toString()}` : ''}`);
    };

    // Get unique weights from products (dynamically filtered by category and form type)
    const weights = useMemo(() => {
        let filtered = productsWithPricing;

        // Apply search filter
        if (searchQuery) {
            filtered = filtered.filter(product =>
              product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              product.description?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Apply category filter
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(product => (product.category || 'other') === selectedCategory);
        }

        // Apply form type filter (for Gold)
        if (selectedCategory === 'Gold' && selectedFormType !== 'all') {
            filtered = filtered.filter(p => p.form_type === selectedFormType);
        }

        // Extract unique weights from filtered products
        const weightSet = new Set(filtered.map(p => p.weight).filter(Boolean));
        return ['All Weights', ...Array.from(weightSet).sort((a, b) => {
            // Extract numeric value for sorting
            const numA = parseFloat(a as string);
            const numB = parseFloat(b as string);
            return numA - numB;
        })];
    }, [productsWithPricing, searchQuery, selectedCategory, selectedFormType]);

    // Reset weight filter when available weights change
    useEffect(() => {
        // Check if current selected weight is still available
        if (selectedWeight !== 'All Weights' && !weights.includes(selectedWeight)) {
            setSelectedWeight('All Weights');
        }
    }, [weights, selectedWeight]);

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

        // Weight filter (exact match from database)
        if (selectedWeight !== 'All Weights') {
            filtered = filtered.filter(p => p.weight === selectedWeight);
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
    }, [productsWithPricing, searchQuery, selectedCategory, sortBy, selectedFormType, selectedWeight]);

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedCategory('all');
        setSelectedFormType('all');
        setSelectedWeight('All Weights');
        router.push('/products');
    };

    const toggleSection = (section: keyof typeof collapsedSections) => {
        setCollapsedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    return (
      <div className="flex flex-col">
          <div className="flex gap-8">
              {/* Left Sidebar Filters - Desktop */}
              <aside className="hidden lg:block w-60 flex-shrink-0">
                  <div className="sticky top-[160px] space-y-4 bg-card p-5 rounded-lg border border-border shadow-card">
                      {/* Search */}
                      <div>
                          <button
                              onClick={() => toggleSection('search')}
                              className="w-full flex items-center justify-between text-sm font-semibold text-foreground mb-2"
                          >
                              Search
                              <ChevronDown className={`h-4 w-4 transition-transform text-muted-foreground ${collapsedSections.search ? '' : 'rotate-180'}`} />
                          </button>
                          {!collapsedSections.search && (
                              <input
                                  type="text"
                                  placeholder="Search products..."
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  className="w-full px-3 py-2 bg-background border border-border rounded-md focus:ring-2 focus:ring-ring/50 focus:border-transparent text-sm text-foreground placeholder:text-muted-foreground"
                              />
                          )}
                      </div>

                      {/* Sort */}
                      <div>
                          <button
                              onClick={() => toggleSection('sort')}
                              className="w-full flex items-center justify-between text-sm font-semibold text-foreground mb-2"
                          >
                              Sort By
                              <ChevronDown className={`h-4 w-4 transition-transform text-muted-foreground ${collapsedSections.sort ? '' : 'rotate-180'}`} />
                          </button>
                          {!collapsedSections.sort && (
                              <select
                                  value={sortBy}
                                  onChange={(e) => setSortBy(e.target.value as any)}
                                  className="w-full px-3 py-2 bg-background border border-border rounded-md focus:ring-2 focus:ring-ring/50 focus:border-transparent text-sm text-foreground"
                              >
                                  <option value="price-asc">Price: Low to High</option>
                                  <option value="price-desc">Price: High to Low</option>
                                  <option value="name">Name: A-Z</option>
                              </select>
                          )}
                      </div>

                      {/* Categories */}
                      <div>
                          <button
                              onClick={() => toggleSection('categories')}
                              className="w-full flex items-center justify-between text-sm font-semibold text-foreground mb-2"
                          >
                              Categories
                              <ChevronDown className={`h-4 w-4 transition-transform text-muted-foreground ${collapsedSections.categories ? '' : 'rotate-180'}`} />
                          </button>
                          {!collapsedSections.categories && (
                              <div className="space-y-0.5">
                                  <button
                                      onClick={() => handleCategoryChange('all')}
                                      className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
                                          selectedCategory === 'all'
                                              ? 'bg-primary text-primary-foreground font-medium'
                                              : 'text-foreground/70 hover:bg-muted/50 hover:text-foreground'
                                      }`}
                                  >
                                      All Products
                                  </button>
                                  {categories.map(category => (
                                      <button
                                          key={category}
                                          onClick={() => handleCategoryChange(category)}
                                          className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
                                              selectedCategory === category
                                                  ? 'bg-primary text-primary-foreground font-medium'
                                                  : 'text-foreground/70 hover:bg-muted/50 hover:text-foreground'
                                          }`}
                                      >
                                          {categoryNames[category] || category}
                                      </button>
                                  ))}
                              </div>
                          )}
                      </div>

                      {/* Weight Filter */}
                      <div>
                          <button
                              onClick={() => toggleSection('weight')}
                              className="w-full flex items-center justify-between text-sm font-semibold text-foreground mb-2"
                          >
                              Weight
                              <ChevronDown className={`h-4 w-4 transition-transform text-muted-foreground ${collapsedSections.weight ? '' : 'rotate-180'}`} />
                          </button>
                          {!collapsedSections.weight && (
                              <div className="space-y-0.5">
                                  {weights.map(weight => (
                                      <button
                                          key={weight}
                                          onClick={() => setSelectedWeight(weight as string)}
                                          className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
                                              selectedWeight === weight
                                                  ? 'bg-primary text-primary-foreground font-medium'
                                                  : 'text-foreground/70 hover:bg-muted/50 hover:text-foreground'
                                          }`}
                                      >
                                          {weight}
                                      </button>
                                  ))}
                              </div>
                          )}
                      </div>

                      {/* Clear Filters */}
                      {(searchQuery || selectedCategory !== 'all' || selectedFormType !== 'all' || selectedWeight !== 'All Weights') && (
                          <button
                              onClick={clearFilters}
                              className="w-full px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors flex items-center justify-center gap-2"
                          >
                              <X className="h-4 w-4" />
                              Clear All Filters
                          </button>
                      )}

                      {/* Results Count */}
                      <div className="text-xs text-muted-foreground pt-4 border-t border-border">
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
                      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
                          <h2 className="text-lg font-semibold text-foreground">Filters</h2>
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

                          {/* Weight Filter */}
                          <div>
                              <label className="block text-sm font-medium text-foreground mb-2">Weight</label>
                              <div className="flex flex-wrap gap-2">
                                  {weights.map(weight => (
                                      <button
                                          key={weight}
                                          onClick={() => setSelectedWeight(weight as string)}
                                          className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                              selectedWeight === weight
                                                  ? 'bg-primary text-primary-foreground'
                                                  : 'bg-muted text-foreground dark:text-zinc-200'
                                          }`}
                                      >
                                          {weight}
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
    const { addToCartById, cart, removeFromCart, updateQuantity } = useCart();

    const displayPrice = product.calculated_price ?? product.price;

    const cartItem = cart.find(item => item.product.id === product.id);
    const quantity = cartItem?.quantity || 0;
    const { discountPercentage } = getVolumeDiscount(quantity);

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

    const handleIncrement = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        updateQuantity(product.id, quantity + 1);
    };

    const handleDecrement = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (quantity <= 1) {
            removeFromCart(product.id);
        } else {
            updateQuantity(product.id, quantity - 1);
        }
    };

    return (
        <Link
            href={`/products/${generateSlug(product.name)}`}
            className="group block"
        >
            <div className="bg-card rounded-lg overflow-hidden border border-border hover:border-primary/30 transition-all duration-200 shadow-card hover:shadow-card-hover hover:-translate-y-0.5">
                {/* Product Image */}
                <div className="relative aspect-square bg-muted/30">
                    <Image
                        src={product.image_url || '/anblogo.png'}
                        alt={product.name}
                        fill
                        className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    />
                </div>

                {/* Product Info */}
                <div className="p-4">
                    <h3 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 text-sm mb-1 min-h-[2.5rem]">
                        {product.name}
                    </h3>

                    {/* Weight & Purity */}
                    <p className="text-xs text-muted-foreground mb-2 truncate">
                        {[product.weight, product.purity].filter(Boolean).join(' | ')}
                    </p>

                    {/* Price + Cart Controls */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {loadingPrices ? (
                                <div className="h-6 w-20 bg-muted animate-pulse rounded" />
                            ) : (
                                <div className="text-lg font-bold text-foreground">
                                    {formatPrice(displayPrice)}
                                </div>
                            )}
                            {discountPercentage > 0 && (
                                <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-success/15 text-success-foreground">
                                    {discountPercentage}% off
                                </span>
                            )}
                        </div>

                        {quantity === 0 ? (
                            <button
                                onClick={handleAddToCart}
                                className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                                aria-label="Add to cart"
                            >
                                <ShoppingCartIcon className="h-4 w-4" />
                            </button>
                        ) : (
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={handleDecrement}
                                    className="w-7 h-7 rounded-md bg-muted hover:bg-muted/80 flex items-center justify-center text-foreground transition-colors"
                                    aria-label="Decrease quantity"
                                >
                                    <Minus className="h-3 w-3" />
                                </button>
                                <span className="w-6 text-center text-sm font-semibold text-foreground">{quantity}</span>
                                <button
                                    onClick={handleIncrement}
                                    className="w-7 h-7 rounded-md bg-muted hover:bg-muted/80 flex items-center justify-center text-foreground transition-colors"
                                    aria-label="Increase quantity"
                                >
                                    <Plus className="h-3 w-3" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}
