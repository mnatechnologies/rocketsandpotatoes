"use client";
import Link from 'next/link'
import Image from "next/image";
import { useMetalPrices } from '@/contexts/MetalPricesContext';
import { getMetalInfo, type MetalSymbol } from "@/lib/metals-api/metalsApi";
import { useCurrency } from "@/contexts/CurrencyContext";
import { createLogger } from "@/lib/utils/logger";


const logger = createLogger('HERO');

interface MetalPrice {
  metal: string;
  price: number;
  change: number;
  changePercent: number;
}

export default function Hero() {
  // Use shared prices from context
  const { prices: contextPrices, isLoading, error } = useMetalPrices();
  const { formatPrice, currency } = useCurrency();

  const prices: MetalPrice[] = contextPrices.map((quote) => {
    const metalInfo = getMetalInfo(quote.symbol as MetalSymbol);
    return {
      metal: metalInfo.ticker,
      price: quote.price,
      change: quote.change,
      changePercent: quote.changePercent
    };
  });

  // Get Gold and Silver prices (prices are in USD from API)
  const goldPrice = prices.find(p => p.metal === 'GOLD')?.price || 0;
  const silverPrice = prices.find(p => p.metal === 'SILVER')?.price || 0;

  logger.log('Hero prices:', { goldPrice, silverPrice, currency, isLoading });

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-32 lg:pt-40">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/hero-bullion.jpg"
          alt="Premium bullion and precious metals"
          fill
          priority
          className="object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/60 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center lg:text-left">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                <span className="block">Premium</span>
                <span className="block gold-shimmer bg-clip-text text-transparent">Bullion Store</span>
                <span className="block">Australia</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-xl">
                Secure your wealth with certified precious metals. Live pricing, guaranteed authenticity,
                and expert guidance for your investment journey.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/products" className="inline-flex items-center justify-center px-6 py-3 rounded-md bg-primary text-primary-foreground shadow-gold transition-smooth hover:opacity-95">
                Shop Now
                <svg className="ml-2 h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </Link>
              <a href="#pricing" className="inline-flex items-center justify-center px-6 py-3 rounded-md border border-border text-foreground hover:bg-muted/30 transition-smooth">
                View Live Prices
              </a>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-8">
              <div className="text-center lg:text-left">
                <div className="flex justify-center lg:justify-start mb-2">
                  <svg className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <h3 className="font-semibold mb-1">Secure Storage</h3>
                <p className="text-sm text-muted-foreground">Bank-grade security</p>
              </div>
              <div className="text-center lg:text-left">
                <div className="flex justify-center lg:justify-start mb-2">
                  <svg className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10"/><path d="M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
                </div>
                <h3 className="font-semibold mb-1">Live Pricing</h3>
                <p className="text-sm text-muted-foreground">Real-time updates</p>
              </div>
              <div className="text-center lg:text-left">
                <div className="flex justify-center lg:justify-start mb-2">
                  <svg className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h18"/><path d="M18 3v3"/><path d="M6 3v3"/><path d="M3 9h18"/><path d="M10 13l-3 3 3 3"/><path d="M14 13l3 3-3 3"/></svg>
                </div>
                <h3 className="font-semibold mb-1">Certified Quality</h3>
                <p className="text-sm text-muted-foreground">Guaranteed authenticity</p>
              </div>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-gold rounded-full blur-3xl opacity-20 scale-75" />
              <div className="relative bg-card/10 backdrop-blur-sm rounded-2xl p-8 border border-primary/20">
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold mb-2">Market Overview</h3>
                    <p className="text-muted-foreground">Live Spot Prices</p>
                  </div>

                  {error ? (
                    <div className="text-center text-destructive text-sm">
                      Unable to load prices
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="bg-card/50 rounded-lg p-4">
                        <div className={`text-2xl font-bold text-primary ${isLoading ? 'animate-pulse' : ''}`}>
                          {isLoading ? '---' : formatPrice(goldPrice)}
                        </div>
                        <div className="text-sm text-muted-foreground">Gold/oz</div>
                        {!isLoading && goldPrice > 0 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {currency}
                          </div>
                        )}
                      </div>
                      <div className="bg-card/50 rounded-lg p-4">
                        <div className={`text-2xl font-bold text-secondary ${isLoading ? 'animate-pulse' : ''}`}>
                          {isLoading ? '---' : formatPrice(silverPrice)}
                        </div>
                        <div className="text-sm text-muted-foreground">Silver/oz</div>
                        {!isLoading && silverPrice > 0 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {currency}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="text-center">
                    <a href="#pricing" className="inline-flex items-center justify-center px-6 py-3 rounded-md bg-primary text-primary-foreground shadow-gold transition-smooth hover:opacity-95 w-full">
                      View Full Pricing
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      {/*<div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">*/}
      {/*  <div className="w-6 h-10 border-2 border-primary/30 rounded-full flex justify-center">*/}
      {/*    <div className="w-1 h-3 bg-primary rounded-full mt-2"></div>*/}
      {/*  </div>*/}
      {/*</div>*/}
    </section>
  );
}