'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Product } from '@/types/product';
import { useCart } from '@/contexts/CartContext';
import { useMetalPrices } from '@/contexts/MetalPricesContext';
import { calculateBulkPricingFromCache } from '@/lib/pricing/priceCalculations';
import { getMetalInfo, type MetalSymbol } from '@/lib/metals-api/metalsApi';
import {toUpperCase} from "uri-js/dist/esnext/util";

interface ProductDetailClientProps {
  product: Product;
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const router = useRouter();
  const { addToCart } = useCart();

  // Use shared metal prices from context - same as ProductsClient
  const { prices: metalPrices, isLoading: loadingPrices, error, lastUpdated } = useMetalPrices();

  const [quantity, setQuantity] = useState(1);
  const [livePrice, setLivePrice] = useState<number>(product.price);
  const [spotPricePerGram, setSpotPricePerGram] = useState<number>(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'details' | 'specs' | 'shipping'>('details');

  // Calculate product price when metal prices change - same logic as ProductsClient
  useEffect(() => {
    if (loadingPrices || !metalPrices || metalPrices.length === 0) {
      return;
    }

    // Create a map of metal prices (price per troy ounce) for calculateBulkPricingFromCache
    const metalPriceMap = new Map<MetalSymbol, number>(
      metalPrices.map(price => [price.symbol, price.price])
    );

    // Use centralized pricing calculation from priceCalculations.ts
    const priceMap = calculateBulkPricingFromCache([product], metalPriceMap);

    // Get the calculated price for this product
    const priceInfo = priceMap.get(product.id);

    if (priceInfo) {
      setLivePrice(priceInfo.calculatedPrice);
      setSpotPricePerGram(priceInfo.spotPricePerGram);
      console.log('[PRODUCT_DETAIL] Live price calculated:', priceInfo.calculatedPrice);
    } else {
      // Fallback to base price if calculation failed
      setLivePrice(product.price);
    }
  }, [product, metalPrices, loadingPrices]);

  const handleAddToCart = async () => {
    setAddingToCart(true);
    try {

      const productWithLivePrice = {
        ...product,
        price: livePrice
      };
      addToCart(productWithLivePrice, quantity);
      console.log('[PRODUCT_DETAIL] Added to cart:', product.name, 'Qty:', quantity, 'Price:', livePrice);

      // Show success message and redirect to cart
      setTimeout(() => {
        router.push('/cart');
      }, 500);
    } catch (error) {
      console.error('[PRODUCT_DETAIL] Error adding to cart:', error);
      alert('Failed to add item to cart. Please try again.');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    setAddingToCart(true);
    try {
      const productWithLivePrice = {
        ...product,
        price: livePrice
      };
      addToCart(productWithLivePrice, quantity);
      router.push('/checkout');
    } catch (error) {
      console.error('[PRODUCT_DETAIL] Error in buy now:', error);
      alert('Failed to proceed to checkout. Please try again.');
    } finally {
      setAddingToCart(false);
    }
  };

  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => Math.max(1, prev - 1));

  const totalPrice = livePrice * quantity;
  const hasLivePrice = !loadingPrices && livePrice !== product.price;

  // Extract metal type for display

  const metalInfo = product.metal_type ? getMetalInfo(product.metal_type as MetalSymbol) : null;
  const metalDisplayName = metalInfo ? metalInfo.ticker : (product.metal_type?.toUpperCase() || 'PRECIOUS METAL');


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


  return (
  <div className="min-h-screen bg-background py-12 mt-16">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Price Loading/Error Banner */}
      {loadingPrices && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
          <p className="text-blue-800">Loading live metal prices...</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
          <p className="text-yellow-800">⚠️ Using static prices</p>
        </div>
      )}

      {/* Breadcrumb */}
      <nav className="mb-8 text-sm">
        <ol className="flex items-center space-x-2 text-muted-foreground">
          <li>
            <Link href="/" className="hover:text-primary transition-colors">
              Home
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link href="/products" className="hover:text-primary transition-colors">
              Products
            </Link>
          </li>
          <li>/</li>
          <li className="text-foreground font-medium">{product.name}</li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Image */}
        <div className="space-y-4">
          <div className="relative aspect-square bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <Image
              src={product.image_url || '/anblogo.png'}
              alt={product.name}
              fill
              className="object-contain p-8"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
            {!product.stock && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">Out of Stock</span>
              </div>
            )}
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="text-2xl mb-1">✓</div>
              <div className="font-semibold text-foreground">Authentic</div>
              <div className="text-muted-foreground text-xs">Certified Products</div>
            </div>
            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="text-2xl mb-1">🔒</div>
              <div className="font-semibold text-foreground">Secure</div>
              <div className="text-muted-foreground text-xs">Insured Shipping</div>
            </div>
            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="text-2xl mb-1">⭐</div>
              <div className="font-semibold text-foreground">{product.rating}/5</div>
              <div className="text-muted-foreground text-xs">Customer Rating</div>
            </div>
          </div>
        </div>

        {/* Product Information */}
        <div className="space-y-6">
          {/* Product Title & Category */}
          <div>
            <div className="text-sm text-primary font-semibold mb-2">
              {metalDisplayName}
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4">
              {product.name}
            </h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className={product.stock ? 'text-green-600' : 'text-red-600'}>
                  {product.stock ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>
          </div>

          {/* Price Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border-2 border-primary/20">
            {loadingPrices ? (
              <div className="text-2xl font-bold text-gray-400 animate-pulse">
                Loading...
              </div>
            ) : (
              <>
                <div className="text-4xl font-bold text-foreground mb-2">
                  ${livePrice.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-sm text-muted-foreground">USD</div>
                {hasLivePrice && (
                  <>
                    <div className="text-xs text-green-600 font-medium mt-1">
                      ✓ Live Market Price
                    </div>
                    {spotPricePerGram > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        Spot/gram: ${spotPricePerGram.toFixed(2)}
                      </div>
                    )}
                  </>
                )}
                {lastUpdated && (
                  <div className="text-xs text-gray-500 mt-1">
                    Updated {formatDateTime(lastUpdated as Date)}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Key Specifications */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
              <div className="text-sm text-muted-foreground mb-1">Weight</div>
              <div className="text-lg font-bold text-primary">{product.weight}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
              <div className="text-sm text-muted-foreground mb-1">Purity</div>
              <div className="text-lg font-bold text-primary">{product.purity}</div>
            </div>
            {product.weight_grams && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                <div className="text-sm text-muted-foreground mb-1">Weight (grams)</div>
                <div className="text-lg font-bold text-primary">{product.weight_grams}g</div>
              </div>
            )}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
              <div className="text-sm text-muted-foreground mb-1">Category</div>
              <div className="text-lg font-bold text-primary">{product.category}</div>
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
            <label className="block text-sm font-semibold text-foreground mb-3">
              Quantity
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={decrementQuantity}
                disabled={quantity <= 1}
                className="w-12 h-12 rounded-lg border-2 border-gray-300 hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed font-bold text-xl"
              >
                −
              </button>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
              />
              <button
                onClick={incrementQuantity}
                className="w-12 h-12 rounded-lg border-2 border-gray-300 hover:border-primary font-bold text-xl"
              >
                +
              </button>
              <div className="ml-auto text-right">
                <div className="text-sm text-muted-foreground">Total</div>
                <div className="text-2xl font-bold text-primary">
                  ${totalPrice.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleBuyNow}
              disabled={!product.stock || addingToCart || loadingPrices}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {addingToCart ? 'Processing...' : 'Buy Now'}
            </button>
            <button
              onClick={handleAddToCart}
              disabled={!product.stock || addingToCart || loadingPrices}
              className="w-full bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-foreground font-bold py-4 px-6 rounded-lg border-2 border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {addingToCart ? 'Adding...' : 'Add to Cart'}
            </button>
          </div>

          {/* Security Notice */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="text-blue-600 text-xl">🔒</div>
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <div className="font-semibold mb-1">Secure Transaction</div>
                <div>All purchases are protected by our secure payment system and comply with Australian regulations.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="mt-16">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex gap-8">
            <button
              onClick={() => setSelectedTab('details')}
              className={`pb-4 px-2 font-semibold transition-colors ${
                selectedTab === 'details'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Product Details
            </button>
            <button
              onClick={() => setSelectedTab('specs')}
              className={`pb-4 px-2 font-semibold transition-colors ${
                selectedTab === 'specs'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Specifications
            </button>
            <button
              onClick={() => setSelectedTab('shipping')}
              className={`pb-4 px-2 font-semibold transition-colors ${
                selectedTab === 'shipping'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Shipping & Returns
            </button>
          </nav>
        </div>

        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg p-8 shadow">
          {selectedTab === 'details' && (
            <div className="prose dark:prose-invert max-w-none">
              <h2 className="text-2xl font-bold text-foreground mb-4">About This Product</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {product.description || `High-quality ${product.name} from Australian National Bullion. This premium ${metalDisplayName} product is perfect for investors and collectors alike.`}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Features</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>✓ Certified authentic {metalDisplayName.toLowerCase()}</li>
                    <li>✓ Secure packaging and delivery</li>
                    <li>✓ Investment grade quality</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Compliance</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>✓ AML/CTF compliant</li>
                    <li>✓ AUSTRAC registered</li>
                    <li>✓ Secure transaction processing</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'specs' && (
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">Technical Specifications</h2>

              {/* Primary Specifications - Most Important */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <span className="text-xl">⚖️</span> Product Details
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                    <span className="font-semibold text-foreground">Metal Type</span>
                    <span className="text-muted-foreground font-medium">{metalInfo?.label || product.metal_type}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                    <span className="font-semibold text-foreground">Purity</span>
                    <span className="text-muted-foreground font-medium">{product.purity}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                    <span className="font-semibold text-foreground">Weight</span>
                    <span className="text-muted-foreground">{product.weight} ({product.weight_grams}g)</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                    <span className="font-semibold text-foreground">Category</span>
                    <span className="text-muted-foreground">{product.category.replace('_', ' ').toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                    <span className="font-semibold text-foreground">Product Rating</span>
                    <span className="text-muted-foreground">⭐ {product.rating}/5</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                    <span className="font-semibold text-foreground">Stock Status</span>
                    <span className={product.stock ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
            {product.stock ? '✓ In Stock' : '✗ Out of Stock'}
          </span>
                  </div>
                </div>
              </div>

              {/* Market Pricing Information */}
              {!loadingPrices && spotPricePerGram > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <span className="text-xl">💰</span> Market Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                      <span className="font-semibold text-foreground">Current Spot Price</span>
                      <span className="text-muted-foreground">${spotPricePerGram.toFixed(2)}/gram</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                      <span className="font-semibold text-foreground">Spot Value of Product</span>
                      <span className="text-muted-foreground">${(spotPricePerGram * product.weight_grams).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                      <span className="font-semibold text-foreground">Your Price</span>
                      <span className="text-green-600 font-bold text-lg">${livePrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                      <span className="font-semibold text-foreground">Currency</span>
                      <span className="text-muted-foreground">{product.currency}</span>
                    </div>
                  </div>

                  {/* Subtle value proposition instead of premium percentage */}
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="text-sm text-green-800 dark:text-green-100">
                      <span className="font-semibold">✓ Competitive Pricing</span> - Includes secure shipping, insurance, and authentication guarantee
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Information */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="text-blue-600 text-xl">ℹ️</div>
                  <div className="text-sm text-blue-900 dark:text-blue-100">
                    <div className="font-semibold mb-1">Investment Grade Quality</div>
                    <div>All products are certified authentic and meet international standards for investment-grade precious metals.</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {selectedTab === 'shipping' && (
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">Shipping & Returns</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <span className="text-xl">📦</span> Shipping Information
                  </h3>
                  <ul className="space-y-2 text-muted-foreground ml-7">
                    <li>• Free insured shipping on orders over $5,000 AUD</li>
                    <li>• Standard shipping: 2-5 business days</li>
                    <li>• Express shipping available at checkout</li>
                    <li>• All shipments are fully insured</li>
                    <li>• Signature required on delivery</li>
                    <li>• Tracking information provided</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <span className="text-xl">🔄</span> Returns Policy
                  </h3>
                  <ul className="space-y-2 text-muted-foreground ml-7">
                    <li>• 30-day return policy on unopened products</li>
                    <li>• Products must be in original sealed packaging</li>
                    <li>• Return shipping costs apply</li>
                    <li>• Refunds processed within 5-7 business days</li>
                    <li>• Contact support for return authorization</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <span className="text-xl">🛡️</span> Security & Insurance
                  </h3>
                  <ul className="space-y-2 text-muted-foreground ml-7">
                    <li>• All shipments fully insured for declared value</li>
                    <li>• Discreet packaging for security</li>
                    <li>• Secure courier services only</li>
                    <li>• Real-time tracking available</li>
                    <li>• Claims process available if needed</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mt-6">
                  <div className="flex items-start gap-3">
                    <div className="text-yellow-600 text-xl">⚠️</div>
                    <div className="text-sm text-yellow-900 dark:text-yellow-100">
                      <div className="font-semibold mb-1">Important Notice</div>
                      <div>Precious metal purchases may require identity verification (KYC) for compliance with Australian regulations. Large transactions are reported to AUSTRAC as required by law.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Back to Products */}
      <div className="mt-12 text-center">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-semibold transition-colors"
        >
          <span>←</span>
          <span>Back to All Products</span>
        </Link>
      </div>
    </div>
  </div>
);
}