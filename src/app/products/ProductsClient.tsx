'use client';

import { useState, useMemo } from 'react';
import { Product } from '@/types/product';
import Link from 'next/link';
import Image from 'next/image';

interface ProductsClientProps {
    products: Product[];
    categoryNames: Record<string, string>;
}

export default function ProductsClient({ products, categoryNames }: ProductsClientProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'name'>('price-asc');

    // Get unique categories from products
    const categories = useMemo(() => {
        const cats = new Set(products.map(p => p.category || 'other'));
        return Array.from(cats);
    }, [products]);

    // Filter and sort products
    const filteredProducts = useMemo(() => {
        let filtered = products;

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

        // Sort products
        const sorted = [...filtered].sort((a, b) => {
            switch (sortBy) {
                case 'price-asc':
                    return a.price - b.price;
                case 'price-desc':
                    return b.price - a.price;
                case 'name':
                    return a.name.localeCompare(b.name);
                default:
                    return 0;
            }
        });

        return sorted;
    }, [products, searchQuery, selectedCategory, sortBy]);

    // Group by category for display
    const productsByCategory = useMemo(() => {
        return filteredProducts.reduce((acc, product) => {
            const category = product.category || 'other';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(product);
            return acc;
        }, {} as Record<string, Product[]>);
    }, [filteredProducts]);

    return (
        <>
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
                        className=" cursor-pointer px-4 py-2 border border-gray-300 text-primary  rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
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
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
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

                {/* Results Count */}
                <div className="text-gray-600">
                    Showing {filteredProducts.length} of {products.length} products
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
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </div>
            ))}

            {filteredProducts.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-xl text-gray-600">No products found matching your criteria.</p>
                    <p className="text-gray-500 mt-2">Try adjusting your search or filters.</p>
                </div>
            )}
        </>
    );
}

function ProductCard({ product }: { product: Product }) {
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
                {!product.stock && (
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
                            product.stock
                                ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                        {product.stock ? 'Add to Cart' : 'Unavailable'}
                    </Link>
                </div>
            </div>
        </div>
    );
}