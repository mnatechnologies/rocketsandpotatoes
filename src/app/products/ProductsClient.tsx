'use client';

import { useState, useMemo, useEffect } from 'react';
import { Product } from '@/types/product';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMetalPrices } from '@/contexts/MetalPricesContext';
import { MetalSymbol } from '@/lib/metals-api/metalsApi';
import { calculateBulkPricingFromCache } from '@/lib/pricing/priceCalculations';
import { ShoppingCartIcon, Filter, X, ChevronDown, Minus, Plus, LayoutGrid, List } from "lucide-react";
import { useCurrency } from '@/contexts/CurrencyContext'
import { useCart } from '@/contexts/CartContext';
import { DEFAULT_VOLUME_DISCOUNT_TIERS } from '@/lib/pricing/priceCalculations';
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
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedWeight, setSelectedWeight] = useState<string>('All Weights');
    const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
    const BRAND_OPTIONS = ['Ainslie', 'Perth Mint', 'ABC Bullion', 'PAMP'];
    const FILTER_CATEGORIES = ['Gold', 'Silver', 'Platinum', 'Palladium', 'Coins'] as const;
    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
        categories: false,
        type: true,
        brand: true,
        weight: true,
        sort: true,
    });

    const toggleSection = (section: string) => {
        setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const { prices: metalPrices, pricingConfig, isLoading: loadingPrices } = useMetalPrices();

    const formTypeLabels: Record<string, string> = {
        cast: 'Cast Bars',
        minted: 'Minted Tablets',
        coin: 'Coins',
    };

    // Determine available form types for the selected category (contextual Type filter)
    const availableFormTypes = useMemo(() => {
        if (selectedCategory === 'all' || selectedCategory === 'Coins') return [];
        const categoryProducts = productsWithPricing.filter(p =>
            (p.category || 'other') === selectedCategory
        );
        const formTypes = [...new Set(categoryProducts.map(p => p.form_type).filter(Boolean))] as string[];
        return formTypes;
    }, [productsWithPricing, selectedCategory]);

    const showTypeFilter = availableFormTypes.length > 1;

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
            base_fee_percentage: pricingConfig.default_base_fee_percentage,
            brand_base_fee_percentages: pricingConfig.brand_base_fee_percentages,
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
        Coins: 'Coins',
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
            if (selectedCategory === 'Coins') {
                filtered = filtered.filter(product => product.form_type === 'coin');
            } else {
                filtered = filtered.filter(product => (product.category || 'other') === selectedCategory);
            }
        }

        // Apply form type filter (contextual - any category with multiple types)
        if (selectedCategory !== 'all' && selectedCategory !== 'Coins' && selectedFormType !== 'all') {
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
            if (selectedCategory === 'Coins') {
                filtered = filtered.filter(product => product.form_type === 'coin');
            } else {
                filtered = filtered.filter(product => (product.category || 'other') === selectedCategory);
            }
        }

        if (selectedCategory === 'Gold' && selectedFormType !== 'all') {
            filtered = filtered.filter(p => p.form_type === selectedFormType);
        }

        // Brand filter (multi-select)
        if (selectedBrands.length > 0) {
            filtered = filtered.filter(product =>
                product.brand && selectedBrands.includes(product.brand)
            );
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
    }, [productsWithPricing, searchQuery, selectedCategory, sortBy, selectedFormType, selectedWeight, selectedBrands]);

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedCategory('all');
        setSelectedFormType('all');
        setSelectedWeight('All Weights');
        setSelectedBrands([]);
        router.push('/products');
    };


    return (
      <div className="flex flex-col">
          {/* View Toggle */}
          <div className="flex items-center justify-end mb-4 gap-1">
              <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
                  aria-label="Grid view"
              >
                  <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
                  aria-label="List view"
              >
                  <List className="h-4 w-4" />
              </button>
          </div>

          <div className="flex gap-8">
              {/* Left Sidebar Filters - Desktop */}
              <aside className="hidden lg:block w-64 flex-shrink-0">
                  <div className="bg-filter-bg p-4 rounded-lg border border-filter-border shadow-card">
                      {/* Search */}
                      <div className="mb-4">
                          <input
                              type="text"
                              placeholder="Search products..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full px-3 py-2 bg-background border border-border rounded-md focus:ring-2 focus:ring-ring/50 focus:border-transparent text-sm text-foreground placeholder:text-muted-foreground"
                          />
                      </div>

                      {/* Category Blocks with Inline Sub-filters */}
                      <div className="space-y-1.5">
                          {/* All Products Block */}
                          <button
                              onClick={() => handleCategoryChange('all')}
                              className={`w-full px-4 py-3 text-sm font-semibold transition-colors text-left ${
                                  selectedCategory === 'all'
                                      ? 'bg-filter-active-bg text-filter-active-text'
                                      : 'text-filter-text hover:bg-filter-hover-bg hover:text-filter-heading'
                              }`}
                          >
                              All Products
                          </button>

                          {/* Category Blocks - each with inline accordion sub-filters */}
                          {FILTER_CATEGORIES.map(category => (
                              <div key={category}>
                                  {/* Category Block */}
                                  <button
                                      onClick={() => handleCategoryChange(category)}
                                      className={`w-full px-4 py-3 text-sm font-semibold transition-colors text-left ${
                                          selectedCategory === category
                                              ? 'bg-filter-active-bg text-filter-active-text'
                                              : 'text-filter-text hover:bg-filter-hover-bg hover:text-filter-heading'
                                      }`}
                                  >
                                      {categoryNames[category] || category}
                                  </button>

                                  {/* Inline Sub-filters - appear directly below selected category */}
                                  {selectedCategory === category && (
                                      <div className="ml-3 mr-1 mt-1.5 mb-1 pl-3 border-l-2 border-filter-active-bg/40 space-y-1">
                                          {/* Type sub-filter (contextual) */}
                                          {showTypeFilter && (
                                              <div>
                                                  <button
                                                      onClick={() => toggleSection('type')}
                                                      className="w-full flex items-center justify-between text-xs font-semibold text-filter-heading py-1.5 uppercase tracking-wide"
                                                  >
                                                      Type
                                                      <ChevronDown className={`h-3.5 w-3.5 transition-transform text-filter-text-muted ${collapsedSections.type ? '' : 'rotate-180'}`} />
                                                  </button>
                                                  {!collapsedSections.type && (
                                                      <div className="space-y-0.5 pb-1">
                                                          <button
                                                              onClick={() => setSelectedFormType('all')}
                                                              className={`w-full text-left px-2.5 py-1 text-xs transition-colors ${
                                                                  selectedFormType === 'all'
                                                                      ? 'bg-filter-active-bg text-filter-active-text font-medium'
                                                                      : 'text-filter-text-muted hover:bg-filter-hover-bg hover:text-filter-text'
                                                              }`}
                                                          >
                                                              All Types
                                                          </button>
                                                          {availableFormTypes.map(type => (
                                                              <button
                                                                  key={type}
                                                                  onClick={() => setSelectedFormType(type)}
                                                                  className={`w-full text-left px-2.5 py-1 text-xs transition-colors ${
                                                                      selectedFormType === type
                                                                          ? 'bg-filter-active-bg text-filter-active-text font-medium'
                                                                          : 'text-filter-text-muted hover:bg-filter-hover-bg hover:text-filter-text'
                                                                  }`}
                                                              >
                                                                  {formTypeLabels[type] || type}
                                                              </button>
                                                          ))}
                                                      </div>
                                                  )}
                                              </div>
                                          )}

                                          {/* Brand sub-filter */}
                                          <div>
                                              <button
                                                  onClick={() => toggleSection('brand')}
                                                  className="w-full flex items-center justify-between text-xs font-semibold text-filter-heading py-1.5 uppercase tracking-wide"
                                              >
                                                  Brand
                                                  <ChevronDown className={`h-3.5 w-3.5 transition-transform text-filter-text-muted ${collapsedSections.brand ? '' : 'rotate-180'}`} />
                                              </button>
                                              {!collapsedSections.brand && (
                                                  <div className="space-y-0.5 pb-1">
                                                      {BRAND_OPTIONS.map(brand => (
                                                          <label
                                                              key={brand}
                                                              className="flex items-center gap-2 px-2.5 py-1 text-xs cursor-pointer hover:bg-filter-hover-bg transition-colors"
                                                          >
                                                              <input
                                                                  type="checkbox"
                                                                  checked={selectedBrands.includes(brand)}
                                                                  onChange={(e) => {
                                                                      if (e.target.checked) {
                                                                          setSelectedBrands([...selectedBrands, brand]);
                                                                      } else {
                                                                          setSelectedBrands(selectedBrands.filter(b => b !== brand));
                                                                      }
                                                                  }}
                                                                  className="rounded border-border text-filter-active-bg focus:ring-ring/50 h-3 w-3"
                                                              />
                                                              <span className={selectedBrands.includes(brand) ? 'text-filter-heading font-medium' : 'text-filter-text-muted'}>
                                                                  {brand}
                                                              </span>
                                                          </label>
                                                      ))}
                                                  </div>
                                              )}
                                          </div>

                                          {/* Weight sub-filter */}
                                          <div>
                                              <button
                                                  onClick={() => toggleSection('weight')}
                                                  className="w-full flex items-center justify-between text-xs font-semibold text-filter-heading py-1.5 uppercase tracking-wide"
                                              >
                                                  Weight
                                                  <ChevronDown className={`h-3.5 w-3.5 transition-transform text-filter-text-muted ${collapsedSections.weight ? '' : 'rotate-180'}`} />
                                              </button>
                                              {!collapsedSections.weight && (
                                                  <div className="flex flex-wrap gap-1 pb-1">
                                                      {weights.map(weight => (
                                                          <button
                                                              key={weight}
                                                              onClick={() => setSelectedWeight(weight as string)}
                                                              className={`px-2 py-0.5 text-[11px] font-medium transition-colors ${
                                                                  selectedWeight === weight
                                                                      ? 'bg-filter-active-bg text-filter-active-text'
                                                                      : 'text-filter-text-muted hover:bg-filter-hover-bg hover:text-filter-text'
                                                              }`}
                                                          >
                                                              {weight}
                                                          </button>
                                                      ))}
                                                  </div>
                                              )}
                                          </div>
                                      </div>
                                  )}
                              </div>
                          ))}
                      </div>

                      {/* Sort */}
                      <div className="pt-3 mt-3 border-t border-filter-border">
                          <button
                              onClick={() => toggleSection('sort')}
                              className="w-full flex items-center justify-between text-sm font-semibold text-filter-heading py-1.5"
                          >
                              Sort By
                              <ChevronDown className={`h-4 w-4 transition-transform text-filter-text-muted ${collapsedSections.sort ? '' : 'rotate-180'}`} />
                          </button>
                          {!collapsedSections.sort && (
                              <select
                                  value={sortBy}
                                  onChange={(e) => setSortBy(e.target.value as any)}
                                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-md focus:ring-2 focus:ring-ring/50 focus:border-transparent text-sm text-foreground"
                              >
                                  <option value="price-asc">Price: Low to High</option>
                                  <option value="price-desc">Price: High to Low</option>
                                  <option value="name">Name: A-Z</option>
                              </select>
                          )}
                      </div>

                      {/* Clear Filters */}
                      {(searchQuery || selectedCategory !== 'all' || selectedFormType !== 'all' || selectedWeight !== 'All Weights' || selectedBrands.length > 0) && (
                          <button
                              onClick={clearFilters}
                              className="w-full px-3 py-2 mt-3 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors flex items-center justify-center gap-2"
                          >
                              <X className="h-4 w-4" />
                              Clear All Filters
                          </button>
                      )}

                      {/* Results Count */}
                      <div className="text-xs text-filter-text-muted pt-3 mt-3 border-t border-filter-border">
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
                  <div className="lg:hidden fixed inset-0 z-50 bg-filter-bg">
                      <div className="flex items-center justify-between p-4 border-b border-filter-border">
                          <h2 className="text-lg font-semibold text-filter-heading">Filters</h2>
                          <button
                              onClick={() => setShowMobileFilters(false)}
                              className="p-2 hover:bg-filter-hover-bg text-filter-text"
                          >
                              <X className="h-5 w-5" />
                          </button>
                      </div>
                      <div className="p-4 space-y-3 overflow-y-auto max-h-[calc(100vh-140px)]">
                          {/* Search */}
                          <div>
                              <input
                                  type="text"
                                  placeholder="Search products..."
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  className="w-full px-3 py-2.5 bg-background border border-filter-border text-sm text-foreground placeholder:text-filter-text-muted"
                              />
                          </div>

                          {/* Category Blocks with Inline Sub-filters */}
                          <div className="space-y-2">
                              {/* All Products Block */}
                              <button
                                  onClick={() => handleCategoryChange('all')}
                                  className={`w-full px-4 py-3.5 text-sm font-semibold transition-colors text-left ${
                                      selectedCategory === 'all'
                                          ? 'bg-filter-active-bg text-filter-active-text'
                                          : 'text-filter-text hover:bg-filter-hover-bg hover:text-filter-heading'
                                  }`}
                              >
                                  All Products
                              </button>

                              {/* Category Blocks with inline accordion sub-filters */}
                              {FILTER_CATEGORIES.map(category => (
                                  <div key={category}>
                                      {/* Category Block */}
                                      <button
                                          onClick={() => handleCategoryChange(category)}
                                          className={`w-full px-4 py-3.5 text-sm font-semibold transition-colors text-left ${
                                              selectedCategory === category
                                                  ? 'bg-filter-active-bg text-filter-active-text'
                                                  : 'text-filter-text hover:bg-filter-hover-bg hover:text-filter-heading'
                                          }`}
                                      >
                                          {categoryNames[category] || category}
                                      </button>

                                      {/* Inline Sub-filters - appear directly below selected category */}
                                      {selectedCategory === category && (
                                          <div className="ml-3 mr-1 mt-2 mb-1 pl-3 border-l-2 border-filter-active-bg/40 space-y-2">
                                              {/* Type sub-filter (contextual) */}
                                              {showTypeFilter && (
                                                  <div>
                                                      <button
                                                          onClick={() => toggleSection('type')}
                                                          className="w-full flex items-center justify-between text-xs font-semibold text-filter-heading py-1.5 uppercase tracking-wide"
                                                      >
                                                          Type
                                                          <ChevronDown className={`h-3.5 w-3.5 transition-transform text-filter-text-muted ${collapsedSections.type ? '' : 'rotate-180'}`} />
                                                      </button>
                                                      {!collapsedSections.type && (
                                                          <div className="flex flex-wrap gap-1.5 pb-1">
                                                              <button
                                                                  onClick={() => setSelectedFormType('all')}
                                                                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                                                                      selectedFormType === 'all'
                                                                          ? 'bg-filter-active-bg text-filter-active-text'
                                                                          : 'text-filter-text-muted hover:bg-filter-hover-bg hover:text-filter-text'
                                                                  }`}
                                                              >
                                                                  All Types
                                                              </button>
                                                              {availableFormTypes.map(type => (
                                                                  <button
                                                                      key={type}
                                                                      onClick={() => setSelectedFormType(type)}
                                                                      className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                                                                          selectedFormType === type
                                                                              ? 'bg-filter-active-bg text-filter-active-text'
                                                                              : 'text-filter-text-muted hover:bg-filter-hover-bg hover:text-filter-text'
                                                                      }`}
                                                                  >
                                                                      {formTypeLabels[type] || type}
                                                                  </button>
                                                              ))}
                                                          </div>
                                                      )}
                                                  </div>
                                              )}

                                              {/* Brand sub-filter */}
                                              <div>
                                                  <button
                                                      onClick={() => toggleSection('brand')}
                                                      className="w-full flex items-center justify-between text-xs font-semibold text-filter-heading py-1.5 uppercase tracking-wide"
                                                  >
                                                      Brand
                                                      <ChevronDown className={`h-3.5 w-3.5 transition-transform text-filter-text-muted ${collapsedSections.brand ? '' : 'rotate-180'}`} />
                                                  </button>
                                                  {!collapsedSections.brand && (
                                                      <div className="flex flex-wrap gap-1.5 pb-1">
                                                          {BRAND_OPTIONS.map(brand => (
                                                              <button
                                                                  key={brand}
                                                                  onClick={() => {
                                                                      if (selectedBrands.includes(brand)) {
                                                                          setSelectedBrands(selectedBrands.filter(b => b !== brand));
                                                                      } else {
                                                                          setSelectedBrands([...selectedBrands, brand]);
                                                                      }
                                                                  }}
                                                                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                                                                      selectedBrands.includes(brand)
                                                                          ? 'bg-filter-active-bg text-filter-active-text'
                                                                          : 'text-filter-text-muted hover:bg-filter-hover-bg hover:text-filter-text'
                                                                  }`}
                                                              >
                                                                  {brand}
                                                              </button>
                                                          ))}
                                                      </div>
                                                  )}
                                              </div>

                                              {/* Weight sub-filter */}
                                              <div>
                                                  <button
                                                      onClick={() => toggleSection('weight')}
                                                      className="w-full flex items-center justify-between text-xs font-semibold text-filter-heading py-1.5 uppercase tracking-wide"
                                                  >
                                                      Weight
                                                      <ChevronDown className={`h-3.5 w-3.5 transition-transform text-filter-text-muted ${collapsedSections.weight ? '' : 'rotate-180'}`} />
                                                  </button>
                                                  {!collapsedSections.weight && (
                                                      <div className="flex flex-wrap gap-1.5 pb-1">
                                                          {weights.map(weight => (
                                                              <button
                                                                  key={weight}
                                                                  onClick={() => setSelectedWeight(weight as string)}
                                                                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                                                                      selectedWeight === weight
                                                                          ? 'bg-filter-active-bg text-filter-active-text'
                                                                          : 'text-filter-text-muted hover:bg-filter-hover-bg hover:text-filter-text'
                                                                  }`}
                                                              >
                                                                  {weight}
                                                              </button>
                                                          ))}
                                                      </div>
                                                  )}
                                              </div>
                                          </div>
                                      )}
                                  </div>
                              ))}
                          </div>

                          {/* Sort */}
                          <div className="pt-2 border-t border-filter-border">
                              <label className="block text-sm font-medium text-filter-heading mb-2">Sort By</label>
                              <select
                                  value={sortBy}
                                  onChange={(e) => setSortBy(e.target.value as any)}
                                  className="w-full px-3 py-2.5 bg-background border border-filter-border text-sm text-foreground"
                              >
                                  <option value="price-asc">Price: Low to High</option>
                                  <option value="price-desc">Price: High to Low</option>
                                  <option value="name">Name: A-Z</option>
                              </select>
                          </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-filter-border bg-filter-bg">
                          <div className="flex gap-3">
                              <button
                                  onClick={clearFilters}
                                  className="flex-1 px-4 py-3 border border-filter-border text-filter-text font-medium"
                              >
                                  Clear All
                              </button>
                              <button
                                  onClick={() => setShowMobileFilters(false)}
                                  className="flex-1 px-4 py-3 bg-filter-active-bg text-filter-active-text font-medium"
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
                      viewMode === 'grid' ? (
                          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                              {filteredProducts.map((product) => (
                                  <ProductCard key={product.id} product={product} loadingPrices={loadingPrices} />
                              ))}
                          </div>
                      ) : (
                          <div className="flex flex-col gap-3">
                              {filteredProducts.map((product) => (
                                  <ProductListItem key={product.id} product={product} loadingPrices={loadingPrices} />
                              ))}
                          </div>
                      )
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

    const handlePresetClick = (e: React.MouseEvent, qty: number) => {
        e.preventDefault();
        e.stopPropagation();
        if (quantity === 0) {
            addToCartById(product.id).then((success) => {
                if (success) {
                    updateQuantity(product.id, qty);
                    toast.success(`Added ${qty}x to cart!`, { description: product.name });
                }
            });
        } else {
            updateQuantity(product.id, qty);
        }
    };

    return (
        <Link
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
                        <div>
                            {loadingPrices ? (
                                <div className="h-6 w-20 bg-muted animate-pulse rounded" />
                            ) : (
                                <div className="text-lg font-bold text-foreground">
                                    {formatPrice(displayPrice)}
                                </div>
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

                    {/* Bulk Purchase Presets */}
                    <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/50">
                        <span className="text-[10px] text-muted-foreground mr-0.5">Bulk:</span>
                        {DEFAULT_VOLUME_DISCOUNT_TIERS.map((tier) => (
                            <button
                                key={tier.threshold}
                                onClick={(e) => handlePresetClick(e, tier.threshold)}
                                className={`px-1.5 cursor-pointer py-0.5 rounded text-[10px] font-medium transition-colors ${
                                    quantity === tier.threshold
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                                }`}
                                aria-label={`Set quantity to ${tier.threshold} for ${tier.discount_percentage}% discount`}
                            >
                                {tier.threshold}x
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </Link>
    );
}

function ProductListItem({ product, loadingPrices }: { product: ProductWithDynamicPrice; loadingPrices: boolean }) {
    const { formatPrice } = useCurrency();
    const { addToCartById, cart, removeFromCart, updateQuantity } = useCart();

    const displayPrice = product.calculated_price ?? product.price;

    const cartItem = cart.find(item => item.product.id === product.id);
    const quantity = cartItem?.quantity || 0;

    const handleAddToCart = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const success = await addToCartById(product.id);
        if (success) {
            toast.success('Added to cart!', { description: product.name });
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

    const handlePresetClick = (e: React.MouseEvent, qty: number) => {
        e.preventDefault();
        e.stopPropagation();
        if (quantity === 0) {
            addToCartById(product.id).then((success) => {
                if (success) {
                    updateQuantity(product.id, qty);
                    toast.success(`Added ${qty}x to cart!`, { description: product.name });
                }
            });
        } else {
            updateQuantity(product.id, qty);
        }
    };

    return (
        <Link
            href={`/products/${generateSlug(product.name)}`}
            className="group block"
        >
            <div className="overflow-hidden transition-all duration-200 flex items-center gap-4 p-3 sm:p-4 border-b border-border/30">
                {/* Product Image */}
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-md overflow-hidden bg-muted/30">
                    <Image
                        src={product.image_url || '/anblogo.png'}
                        alt={product.name}
                        fill
                        className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                        sizes="100px"
                    />
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground group-hover:text-primary transition-colors text-sm sm:text-base line-clamp-1">
                        {product.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {[product.weight, product.purity].filter(Boolean).join(' | ')}
                    </p>
                    {product.brand && (
                        <p className="text-xs text-muted-foreground mt-0.5">{product.brand}</p>
                    )}

                    {/* Bulk Presets - mobile */}
                    <div className="flex items-center gap-1 mt-1.5 sm:hidden">
                        <span className="text-[10px] text-muted-foreground mr-0.5">Bulk:</span>
                        {DEFAULT_VOLUME_DISCOUNT_TIERS.map((tier) => (
                            <button
                                key={tier.threshold}
                                onClick={(e) => handlePresetClick(e, tier.threshold)}
                                className={`px-1.5 cursor-pointer py-0.5 rounded text-[10px] font-medium transition-colors ${
                                    quantity === tier.threshold
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                                }`}
                                aria-label={`Set quantity to ${tier.threshold}`}
                            >
                                {tier.threshold}x
                            </button>
                        ))}
                    </div>
                </div>

                {/* Price & Controls */}
                <div className="flex-shrink-0 flex items-center gap-3 sm:gap-4">
                    {/* Bulk Presets - desktop */}
                    <div className="hidden sm:flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground mr-0.5">Bulk:</span>
                        {DEFAULT_VOLUME_DISCOUNT_TIERS.map((tier) => (
                            <button
                                key={tier.threshold}
                                onClick={(e) => handlePresetClick(e, tier.threshold)}
                                className={`px-1.5 cursor-pointer py-0.5 rounded text-[10px] font-medium transition-colors ${
                                    quantity === tier.threshold
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                                }`}
                                aria-label={`Set quantity to ${tier.threshold}`}
                            >
                                {tier.threshold}x
                            </button>
                        ))}
                    </div>

                    {/* Price */}
                    <div className="text-right">
                        {loadingPrices ? (
                            <div className="h-6 w-20 bg-muted animate-pulse rounded" />
                        ) : (
                            <div className="text-base sm:text-lg font-bold text-foreground">
                                {formatPrice(displayPrice)}
                            </div>
                        )}
                    </div>

                    {/* Cart Controls */}
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
        </Link>
    );
}
