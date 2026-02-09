'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Product } from '@/types/product';
import { useCart } from '@/contexts/CartContext';
import { useMetalPrices } from '@/contexts/MetalPricesContext';
import { calculateBulkPricingFromCache, getVolumeDiscount, applyVolumeDiscount, DEFAULT_VOLUME_DISCOUNT_TIERS } from '@/lib/pricing/priceCalculations';
import { getMetalInfo, type MetalSymbol } from '@/lib/metals-api/metalsApi';
import { useCurrency } from "@/contexts/CurrencyContext";
import Breadcrumb, { BreadcrumbItem } from '@/components/Breadcrumb';
import { toast } from 'sonner';
import { ShoppingCart, Minus, Plus, Shield, Clock, Award } from 'lucide-react';

interface ProductDetailClientProps {
  product: Product;
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { formatPrice, currency } = useCurrency();
  const { prices: metalPrices, pricingConfig, isLoading: loadingPrices, lastUpdated } = useMetalPrices();

  const [quantity, setQuantity] = useState(1);
  const [livePrice, setLivePrice] = useState<number>(product.price);
  const [addingToCart, setAddingToCart] = useState(false);

  // Calculate product price when metal prices change
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

    const priceMap = calculateBulkPricingFromCache([product], metalPriceMap, config);
    const priceInfo = priceMap.get(product.id);

    if (priceInfo) {
      setLivePrice(priceInfo.calculatedPrice);
    } else {
      setLivePrice(product.price);
    }
  }, [product, metalPrices, pricingConfig, loadingPrices]);

  const handleAddToCart = async () => {
    setAddingToCart(true);
    try {
      const productWithLivePrice = {
        ...product,
        price: livePrice
      };
      addToCart(productWithLivePrice, quantity);
      toast.success('Added to cart!', {
        description: `${quantity}x ${product.name}`,
      });
      setTimeout(() => {
        router.push('/cart');
      }, 500);
    } catch (error) {
      toast.error('Failed to add item to cart');
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
      toast.success('Proceeding to checkout...');
      router.push('/checkout');
    } catch (error) {
      toast.error('Failed to proceed to checkout');
    } finally {
      setAddingToCart(false);
    }
  };

  const volumeDiscount = applyVolumeDiscount(livePrice, quantity);
  const totalPrice = volumeDiscount.discountedUnitPrice * quantity;
  const { nextTier } = getVolumeDiscount(quantity);
  const metalInfo = product.metal_type ? getMetalInfo(product.metal_type as MetalSymbol) : null;

  // Format category name
  const formatCategoryName = (category: string): string => {
    return category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // Build breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/products' },
    ...(product.category ? [{ label: formatCategoryName(product.category), href: `/products?category=${product.category}` }] : []),
    { label: product.name }
  ];

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-8">
          {/* Left: Product Image */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-card rounded-2xl overflow-hidden border border-border">
              <Image
                src={product.image_url || '/anblogo.png'}
                alt={product.name}
                fill
                className="object-contain p-8 mix-blend-multiply dark:mix-blend-normal"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
              {!product.stock && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white text-xl font-bold">Out of Stock</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Product Info */}
          <div className="space-y-6">
            {/* Title */}
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
                {product.name}
              </h1>
              <div className="flex items-center gap-3 text-sm ">
                <span className={`inline-flex items-center rounded-full border px-3 py-1 text-base font-semibold tracking-tight ${
                  product.stock
                    ? 'border-success/30 bg-success/10 text-success-foreground dark:border-success/40 dark:bg-success/20 dark:text-success-foreground'
                    : 'border-destructive/30 bg-destructive/10 text-destructive dark:border-destructive/40 dark:bg-destructive/20 dark:text-destructive-foreground'
                }`}>
                  {product.stock ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>
            </div>

            {/* Price Box */}
            <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
              {loadingPrices ? (
                <div className="h-10 w-40 bg-muted animate-pulse rounded" />
              ) : (
                <>
                  <div className="text-4xl font-bold text-foreground tracking-tight">
                    {formatPrice(livePrice)}
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-sm font-medium text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Live Market Price
                    {lastUpdated && (
                      <span className="text-xs">
                        • Updated {lastUpdated.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Specs */}
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-card rounded-lg p-4 border border-border shadow-sm">
                <div className="text-sm text-muted-foreground">Purity</div>
                <div className="text-lg font-semibold text-foreground">{product.purity}</div>
              </div>
            </div>

            {/* Quantity & Total */}
            <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="font-medium text-foreground">Quantity</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="w-10 h-10 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="text-xl font-bold w-12 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {volumeDiscount.discountPercentage > 0 && (
                <div className="flex items-center justify-between py-2 text-sm">
                  <span className="text-success-foreground font-medium">Bulk discount ({volumeDiscount.discountPercentage}%)</span>
                  <span className="text-success-foreground font-medium">-{formatPrice(volumeDiscount.totalSavings)}</span>
                </div>
              )}
              {nextTier && (
                <p className="text-xs text-muted-foreground mb-2">
                  Add {nextTier.threshold - quantity} more for {nextTier.discount_percentage}% off each
                </p>
              )}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <span className="font-medium text-foreground">Total</span>
                <span className="text-2xl font-bold text-primary">{formatPrice(totalPrice)}</span>
              </div>
            </div>

            {/* Bulk Pricing Tiers */}
            <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
              <h3 className="font-semibold text-foreground mb-3 text-sm">Bulk Pricing</h3>
              <div className="space-y-1.5">
                {DEFAULT_VOLUME_DISCOUNT_TIERS.map((tier) => {
                  const isActive = quantity >= tier.threshold;
                  return (
                    <div
                      key={tier.threshold}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                        isActive
                          ? 'bg-success/10 text-success-foreground font-medium'
                          : 'text-muted-foreground'
                      }`}
                    >
                      <span>{tier.threshold}+ units</span>
                      <span>{tier.discount_percentage}% off per unit</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleBuyNow}
                disabled={!product.stock || addingToCart || loadingPrices}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg flex items-center justify-center gap-2"
              >
                Buy Now
              </button>
              <button
                onClick={handleAddToCart}
                disabled={!product.stock || addingToCart || loadingPrices}
                className="w-full bg-muted hover:bg-muted/80 text-foreground font-bold py-4 px-6 rounded-xl border border-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg flex items-center justify-center gap-2"
              >
                <ShoppingCart className="h-5 w-5" />
                Add to Cart
              </button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div className="text-xs font-medium text-foreground">Authentic</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div className="text-xs font-medium text-foreground">Fast Pickup</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <div className="text-xs font-medium text-foreground">Certified</div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Description */}
        {product.description && (
          <div className="mt-16 max-w-4xl bg-card rounded-2xl p-8 border border-border shadow-sm">
            <h2 className="text-2xl font-bold text-foreground mb-4">About This Product</h2>
            <div className="prose prose-zinc dark:prose-invert max-w-none">
              <p className="text-base text-foreground/80 leading-relaxed">
                {product.description}
              </p>
            </div>
          </div>
        )}

        {/* Back to Products */}
        <div className="mt-12">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors"
          >
            <span>←</span>
            <span>Back to Products</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
