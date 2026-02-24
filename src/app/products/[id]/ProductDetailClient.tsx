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
import { ShoppingCart, Minus, Plus, Shield, Clock, Award, ChevronLeft, ChevronRight, Mail } from 'lucide-react';
import { generateSlug } from '@/lib/utils/slug';

interface ProductDetailClientProps {
  product: Product;
  relatedProducts?: Product[];
}

export default function ProductDetailClient({ product, relatedProducts = [] }: ProductDetailClientProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { formatPrice, currency } = useCurrency();
  const { prices: metalPrices, pricingConfig, isLoading: loadingPrices, lastUpdated } = useMetalPrices();

  const [quantity, setQuantity] = useState(1);
  const [livePrice, setLivePrice] = useState<number>(product.price);
  const [relatedPrices, setRelatedPrices] = useState<Map<string, number>>(new Map());
  const [addingToCart, setAddingToCart] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Build the full image list: primary image + additional images from the images array
  const allImages = (() => {
    const imgs: string[] = [];
    if (product.image_url && product.image_url !== '/anblogo.png') {
      imgs.push(product.image_url);
    }
    if (product.images && product.images.length > 0) {
      for (const img of product.images) {
        if (img && !imgs.includes(img)) {
          imgs.push(img);
        }
      }
    }
    return imgs.length > 0 ? imgs : ['/anblogo.png'];
  })();

  const hasMultipleImages = allImages.length > 1;

  // Calculate product price when metal prices change
  useEffect(() => {
    if (loadingPrices || !metalPrices || metalPrices.length === 0 || !pricingConfig) {
      return;
    }

    const metalPriceMap = new Map<MetalSymbol, number>(
      metalPrices.map(price => [price.symbol, price.price])
    );

    const config = {
      markup_percentage: pricingConfig.markup_percentage,
      base_fee_percentage: pricingConfig.default_base_fee_percentage,
      brand_base_fee_percentages: pricingConfig.brand_base_fee_percentages,
    };

    const allProducts = [product, ...relatedProducts];
    const priceMap = calculateBulkPricingFromCache(allProducts, metalPriceMap, config);

    const priceInfo = priceMap.get(product.id);
    if (priceInfo) {
      setLivePrice(priceInfo.calculatedPrice);
    } else {
      setLivePrice(product.price);
    }

    const newRelatedPrices = new Map<string, number>();
    for (const related of relatedProducts) {
      const relatedInfo = priceMap.get(related.id);
      if (relatedInfo) {
        newRelatedPrices.set(related.id, relatedInfo.calculatedPrice);
      }
    }
    setRelatedPrices(newRelatedPrices);
  }, [product, relatedProducts, metalPrices, pricingConfig, loadingPrices]);

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
          {/* Left: Product Image Gallery */}
          <div className="space-y-3">
            {/* Main Image */}
            <div className="relative aspect-square bg-card rounded-2xl overflow-hidden border border-border group">
              <Image
                src={allImages[selectedImageIndex]}
                alt={`${product.name} - Image ${selectedImageIndex + 1}`}
                fill
                className="object-contain p-8"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
                unoptimized
              />
              {!product.stock && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white text-xl font-bold">
                    {product.brand === 'PAMP Suisse' ? 'Contact to Order' : 'Out of Stock'}
                  </span>
                </div>
              )}
              {/* Navigation Arrows */}
              {hasMultipleImages && (
                <>
                  <button
                    onClick={() => setSelectedImageIndex(i => i === 0 ? allImages.length - 1 : i - 1)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setSelectedImageIndex(i => i === allImages.length - 1 ? 0 : i + 1)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  {/* Image Counter */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-background/80 border border-border rounded-full px-3 py-1 text-xs font-medium text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    {selectedImageIndex + 1} / {allImages.length}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail Strip */}
            {hasMultipleImages && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {allImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      index === selectedImageIndex
                        ? 'border-primary ring-1 ring-primary/30'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} - Thumbnail ${index + 1}`}
                      fill
                      className="object-contain p-1"
                      sizes="80px"
                      unoptimized
                    />
                  </button>
                ))}
              </div>
            )}
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
                    : product.brand === 'PAMP Suisse'
                      ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      : 'border-destructive/30 bg-destructive/10 text-destructive dark:border-destructive/40 dark:bg-destructive/20 dark:text-destructive-foreground'
                }`}>
                  {product.stock ? 'In Stock' : product.brand === 'PAMP Suisse' ? 'Contact to Order' : 'Out of Stock'}
                </span>
                {(() => {
                  if (!product.metal_type || !product.purity) return null;
                  if (product.metal_type === 'XPD') {
                    return (
                      <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        GST May Apply
                      </span>
                    );
                  }
                  const purityNum = parseFloat(product.purity.replace(/[^0-9.]/g, ''));
                  if (isNaN(purityNum)) return null;
                  const meetsGSTThreshold =
                    (product.metal_type === 'XAU' && purityNum >= 99.5) ||
                    (product.metal_type === 'XAG' && purityNum >= 99.9) ||
                    (product.metal_type === 'XPT' && purityNum >= 99.0);
                  if (meetsGSTThreshold) {
                    return (
                      <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        GST-Free (Investment Grade)
                      </span>
                    );
                  }
                  return null;
                })()}
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
                  <p className="text-xs text-muted-foreground mt-2">
                    Prices are indicative and subject to market movement. Your price is locked for 15 minutes at checkout.
                  </p>
                </>
              )}
            </div>

            {/* Specifications */}
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              <h3 className="font-semibold text-foreground text-sm px-5 py-3 border-b border-border bg-muted/30">
                Specifications
              </h3>
              <div className="divide-y divide-border">
                {metalInfo && (
                  <div className="flex items-center justify-between px-5 py-3">
                    <span className="text-sm text-muted-foreground">Metal Type</span>
                    <span className="text-sm font-medium text-foreground capitalize">{metalInfo.label}</span>
                  </div>
                )}
                {product.weight && (
                  <div className="flex items-center justify-between px-5 py-3">
                    <span className="text-sm text-muted-foreground">Weight</span>
                    <span className="text-sm font-medium text-foreground">{product.weight}</span>
                  </div>
                )}
                {product.purity && (
                  <div className="flex items-center justify-between px-5 py-3">
                    <span className="text-sm text-muted-foreground">Purity</span>
                    <span className="text-sm font-medium text-foreground">{product.purity}</span>
                  </div>
                )}
                {product.form_type && (
                  <div className="flex items-center justify-between px-5 py-3">
                    <span className="text-sm text-muted-foreground">Form</span>
                    <span className="text-sm font-medium text-foreground capitalize">{product.form_type}</span>
                  </div>
                )}
                {product.brand && (
                  <div className="flex items-center justify-between px-5 py-3">
                    <span className="text-sm text-muted-foreground">Brand / Refiner</span>
                    <span className="text-sm font-medium text-foreground">{product.brand}</span>
                  </div>
                )}
              </div>
              <div className="px-5 py-2.5 text-xs text-muted-foreground bg-muted/20">
                Weight and purity as specified by manufacturer
              </div>
            </div>

            {/* Quantity & Total */}
            <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
              <div className="flex items-center justify-between mb-3">
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

              {/* Bulk Purchase Presets */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs text-muted-foreground mr-1">Bulk:</span>
                {DEFAULT_VOLUME_DISCOUNT_TIERS.map((tier) => (
                  <button
                    key={tier.threshold}
                    onClick={() => setQuantity(tier.threshold)}
                    className={`px-3 cursor-pointer py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      quantity === tier.threshold
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted border border-border text-muted-foreground hover:text-foreground hover:border-primary/40'
                    }`}
                  >
                    {tier.threshold}x
                    <span className="ml-1 opacity-75">(-{tier.discount_percentage}%)</span>
                  </button>
                ))}
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

            {/* Action Buttons */}
            <div className="space-y-3">
              {!product.stock && product.brand === 'PAMP Suisse' ? (
                <a
                  href={`mailto:sales@australiannationalbullion.com.au?subject=Order Enquiry: ${encodeURIComponent(product.name)}&body=${encodeURIComponent(`Hi,\n\nI am interested in ordering the following product:\n\n${product.name}\n\nPlease provide availability and pricing.\n\nThank you.`)}`}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 px-6 rounded-xl transition-colors text-lg flex items-center justify-center gap-2"
                >
                  <Mail className="h-5 w-5" />
                  Contact to Order
                </a>
              ) : (
                <>
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
                </>
              )}
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

            {/* Collection Info */}
            <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Collection: Sydney CBD office, by appointment only</span>
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

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-foreground mb-6">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
              {relatedProducts.map((related) => (
                <Link
                  key={related.id}
                  href={`/products/${generateSlug(related.name)}`}
                  className="group block"
                >
                  <div className="bg-card rounded-lg overflow-hidden border border-border hover:border-primary/30 transition-all duration-200 shadow-card hover:shadow-card-hover hover:-translate-y-0.5">
                    <div className="relative aspect-square bg-muted/30">
                      <Image
                        src={related.image_url || '/anblogo.png'}
                        alt={related.name}
                        fill
                        className="object-contain p-4 group-hover:scale-105 transition-transform duration-300 mix-blend-multiply dark:mix-blend-normal"
                        sizes="(max-width: 768px) 50vw, 25vw"
                        unoptimized
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 text-sm mb-1 min-h-[2.5rem]">
                        {related.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-2 truncate">
                        {[related.weight, related.purity].filter(Boolean).join(' | ')}
                      </p>
                      <div className="text-lg font-bold text-foreground">
                        {formatPrice(relatedPrices.get(related.id) ?? related.price)}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
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
