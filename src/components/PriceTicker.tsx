"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getMetalInfo, type MetalSymbol } from "@/lib/metals-api/metalsApi";
import { useMetalPrices } from '@/contexts/MetalPricesContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { TrendingUp, ChevronUp, ChevronDown } from 'lucide-react';

interface TickerPrice {
  metal: string;
  symbol: MetalSymbol;
  price: number;
  change: number;
  changePercent: number;
}

const TROY_OZ_TO_GRAMS = 31.1035;

export default function PriceTicker() {
  const { prices: contextPrices, isLoading, lastUpdated } = useMetalPrices();
  const { currency, exchangeRate, convertPrice } = useCurrency();
  const [nextRefreshCountdown, setNextRefreshCountdown] = useState('');
  const [headerHeight, setHeaderHeight] = useState(80);
  const [tickerCollapsed, setTickerCollapsed] = useState(false);

  // Observe header height to position ticker below it
  useEffect(() => {
    const headerEl = document.querySelector('[data-header]') as HTMLElement;
    if (!headerEl) return;

    const observer = new ResizeObserver(() => {
      setHeaderHeight(headerEl.offsetHeight);
    });
    observer.observe(headerEl);
    return () => observer.disconnect();
  }, []);

  const prices: TickerPrice[] = contextPrices.map((quote) => {
    const metalInfo = getMetalInfo(quote.symbol as MetalSymbol);
    const priceInCurrency = convertPrice(quote.price);
    return {
      metal: metalInfo.label,
      symbol: quote.symbol as MetalSymbol,
      price: priceInCurrency,
      change: quote.change,
      changePercent: quote.changePercent
    };
  });

  useEffect(() => {
    const interval = setInterval(() => {
      // Update refresh countdown
      if (lastUpdated) {
        const nextRefresh = new Date(lastUpdated.getTime() + 5 * 60 * 1000);
        const now = new Date();
        const diff = nextRefresh.getTime() - now.getTime();
        if (diff > 0) {
          const mins = Math.floor(diff / 60000);
          const secs = Math.floor((diff % 60000) / 1000);
          setNextRefreshCountdown(`0${mins}:${secs.toString().padStart(2, '0')}`);
        } else {
          setNextRefreshCountdown('0:00');
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  const formatPrice = (value: number) =>
    '$' + new Intl.NumberFormat("en-AU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  const formatGramPrice = (value: number) =>
    '$' + new Intl.NumberFormat("en-AU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value / TROY_OZ_TO_GRAMS);

  if (isLoading) {
    return (
      <div className="fixed left-0 right-0 z-30 bg-ticker-bg border-b border-ticker-border" style={{ top: `${headerHeight}px` }} data-ticker>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 md:grid-cols-7 gap-0">
            {[1,2,3,4,5,6,7].map(i => (
              <div key={i} className={`bg-muted/50 px-3 py-2 border-r border-ticker-border/60 last:border-r-0 animate-pulse rounded-sm ${i > 3 && i <= 6 ? 'hidden md:block' : ''}`}>
                <div className="h-3 w-14 bg-muted rounded mb-1.5" />
                <div className="h-5 w-20 bg-muted rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed left-0 right-0 z-30 bg-ticker-bg border-b border-ticker-border" style={{ top: `${headerHeight}px` }} data-ticker>
      <div className="container mx-auto px-4">
        {/* Mobile collapsed view — auto-scrolling marquee */}
        {tickerCollapsed && (
          <button
            onClick={() => setTickerCollapsed(false)}
            className="md:hidden flex items-center w-full py-2 overflow-hidden"
          >
            <div className="flex-1 overflow-hidden" style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif', fontVariantNumeric: 'tabular-nums' }}>
              <div className="flex animate-ticker-scroll w-max gap-6">
                {/* Duplicate prices for seamless loop */}
                {[...prices, ...prices].map((price, i) => (
                  <span key={`${price.metal}-${i}`} className="text-[11px] text-ticker-foreground font-medium whitespace-nowrap">
                    <span className="text-ticker-muted">{price.metal}</span> {currency} {formatPrice(price.price)}
                    <span className={`ml-1 ${price.change >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {price.change >= 0 ? '+' : ''}{price.changePercent.toFixed(2)}%
                    </span>
                  </span>
                ))}
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-ticker-muted flex-shrink-0 ml-2" />
          </button>
        )}

        {/* Full ticker — always shown on desktop, togglable on mobile */}
        <div className={`${tickerCollapsed ? 'hidden md:grid' : 'grid'} grid-cols-3 md:grid-cols-7`}>
          {/* 4 Metal Price Columns */}
          {prices.map((price, index) => {
            const category = price.metal.charAt(0).toUpperCase() + price.metal.slice(1);
            return (
            <Link
              key={price.metal}
              href={`/products?category=${encodeURIComponent(category)}`}
              className={`px-3 py-2.5 md:py-5 border-ticker-border/40 border-r transition-colors hover:brightness-110 ${
                index < 3 ? 'border-b md:border-b-0' : ''
              }`}
              aria-label={`View ${category} products`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] md:text-[11px] font-semibold text-ticker-muted uppercase tracking-wider">
                  {price.metal}
                </span>
                <div className={`flex items-center ${
                  price.change >= 0 ? 'text-success' : 'text-destructive'
                }`}>
                  <svg
                    className="h-2.5 w-3 md:h-3 md:w-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    {price.change >= 0 ? (
                      <path d="M12 4l-8 8h5v8h6v-8h5z" />
                    ) : (
                      <path d="M12 20l8-8h-5V4H9v8H4z" />
                    )}
                  </svg>
                </div>
              </div>
              <div className="text-base md:text-xl font-semibold text-ticker-foreground tracking-tight leading-tight" style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif', fontVariantNumeric: 'tabular-nums' }}>
                {currency} {formatPrice(price.price)} <span className="text-[9px] md:text-[10px] font-medium text-ticker-muted">/ oz</span>
              </div>
              <div className="mt-1.5 md:mt-2.5 text-xs md:text-base font-semibold tracking-tight leading-tight bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 bg-clip-text text-transparent" style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif', fontVariantNumeric: 'tabular-nums' }}>
                {currency} {formatGramPrice(price.price)} <span className="text-[9px] md:text-[10px] font-medium">/ g</span>
              </div>
            </Link>
          )})}

          {/* 5th Column: Timer */}
          <div className="px-3 py-2 md:py-2.5 border-ticker-border/40 border-r border-b md:border-b-0">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] md:text-[11px] font-semibold text-ticker-muted uppercase tracking-wider" style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif', fontVariantNumeric: 'tabular-nums' }}>
                Next Update
              </span>
              <svg className="h-3 w-3 md:h-3.5 md:w-3.5 text-red-500/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-red-500 tracking-tight leading-tight" style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif', fontVariantNumeric: 'tabular-nums' }}>
              {nextRefreshCountdown || '5:00'}
            </div>
          </div>

          {/* 6th Column: FX Rate (on mobile, includes Live Pricing link) */}
          <div className="px-3 py-2 md:py-2.5 md:border-r border-ticker-border/40">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] md:text-[11px] font-semibold text-ticker-muted uppercase tracking-wider" style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif', fontVariantNumeric: 'tabular-nums' }}>
                FX Rate
              </span>
              <svg className="h-3 w-3 md:h-3.5 md:w-3.5 text-ticker-muted/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div className="text-lg md:text-xl font-semibold text-ticker-foreground tracking-tight leading-tight" style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif', fontVariantNumeric: 'tabular-nums' }}>
              {currency === 'USD' ? exchangeRate.toFixed(2) : (1 / exchangeRate).toFixed(4)}
            </div>
            {/* Live Pricing link - mobile only (desktop has its own column) */}
            <Link
              href="/charts"
              className="md:hidden inline-flex items-center gap-1 text-[10px] font-medium text-primary hover:text-primary/80 transition-colors mt-0.5"
            >
              <TrendingUp className="h-2.5 w-2.5" />
              Live Pricing
            </Link>
          </div>

          {/* 7th Column: Live Pricing (desktop only) */}
          <Link
            href="/charts"
            className="hidden md:flex flex-col px-3 py-2.5 border-ticker-border/40 hover:brightness-110 transition-colors"
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              <span className="text-[11px] font-semibold text-primary uppercase tracking-wider" style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif', fontVariantNumeric: 'tabular-nums' }}>
                Live Pricing
              </span>
            </div>
            <span className="text-base font-semibold text-ticker-muted tracking-tight leading-tight" style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif', fontVariantNumeric: 'tabular-nums' }}>
              Charts & History
            </span>
          </Link>
        </div>

        {/* Mobile collapse toggle */}
        {!tickerCollapsed && (
          <button
            onClick={() => setTickerCollapsed(true)}
            className="md:hidden flex items-center justify-center w-full py-1 border-t border-ticker-border/30"
          >
            <ChevronUp className="h-3.5 w-3.5 text-ticker-muted" />
          </button>
        )}
      </div>
    </div>
  );
}
