"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { getMetalInfo, type MetalSymbol } from "@/lib/metals-api/metalsApi";
import { useMetalPrices } from '@/contexts/MetalPricesContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { ChevronDown, Phone, TrendingUp } from 'lucide-react';

interface TickerPrice {
  metal: string;
  symbol: MetalSymbol;
  price: number;
  change: number;
  changePercent: number;
}

function getMarketStatus() {
  const now = new Date();
  const utcDay = now.getUTCDay();
  const utcHour = now.getUTCHours();

  if (utcDay === 6) return { isOpen: false };
  if (utcDay === 5 && utcHour >= 22) return { isOpen: false };
  if (utcDay === 0 && utcHour < 23) return { isOpen: false };

  return { isOpen: true };
}

const TROY_OZ_TO_GRAMS = 31.1035;

export default function PriceTicker() {
  const { prices: contextPrices, isLoading, lastUpdated } = useMetalPrices();
  const { currency, setCurrency, exchangeRate, convertPrice, fxRate, fxTimestamp, isLoading: fxLoading } = useCurrency();
  const [marketStatus, setMarketStatus] = useState(getMarketStatus());
  const [nextRefreshCountdown, setNextRefreshCountdown] = useState('');
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(80);
  const currencyRef = useRef<HTMLDivElement>(null);

  // Close currency dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (currencyRef.current && !currencyRef.current.contains(event.target as Node)) {
        setCurrencyOpen(false);
      }
    }
    if (currencyOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [currencyOpen]);

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
      setMarketStatus(getMarketStatus());

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
    new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  const formatGramPrice = (value: number) =>
    new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: currency,
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
        {/* Desktop: 7 columns (4 metals + timer + FX rate + Live Pricing) */}
        {/* Mobile: 3 cols x 2 rows (4 metals + timer + FX/Live merged) */}
        <div className="grid grid-cols-3 md:grid-cols-7">
          {/* 4 Metal Price Columns */}
          {prices.map((price, index) => {
            const category = price.metal.charAt(0).toUpperCase() + price.metal.slice(1);
            return (
            <Link
              key={price.metal}
              href={`/products?category=${encodeURIComponent(category)}`}
              className={`px-3 py-2 md:py-2.5 border-ticker-border/40 border-r transition-colors hover:brightness-110 ${
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
              <div className="text-lg md:text-xl font-semibold text-ticker-foreground tracking-tight leading-tight" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                {formatPrice(price.price)} <span className="text-[9px] md:text-[10px] font-medium text-ticker-muted">/ oz</span>
              </div>
              <div className="text-xs md:text-sm text-ticker-muted tracking-tight leading-tight" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                {formatGramPrice(price.price)} <span className="text-[9px] md:text-[10px] font-medium">/ g</span>
              </div>
            </Link>
          )})}

          {/* 5th Column: Timer */}
          <div className="px-3 py-2 md:py-2.5 border-ticker-border/40 border-r border-b md:border-b-0">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] md:text-[11px] font-semibold text-ticker-muted uppercase tracking-wider" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                Next Update
              </span>
              <svg className="h-3 w-3 md:h-3.5 md:w-3.5 text-red-500/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-red-500 tracking-tight leading-tight" style={{ fontFamily: 'var(--font-playfair), serif' }}>
              {nextRefreshCountdown || '5:00'}
            </div>
          </div>

          {/* 6th Column: FX Rate (on mobile, includes Live Pricing link) */}
          <div className="px-3 py-2 md:py-2.5 md:border-r border-ticker-border/40">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] md:text-[11px] font-semibold text-ticker-muted uppercase tracking-wider" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                FX Rate
              </span>
              <svg className="h-3 w-3 md:h-3.5 md:w-3.5 text-ticker-muted/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div className="text-lg md:text-xl font-semibold text-ticker-foreground tracking-tight leading-tight" style={{ fontFamily: 'var(--font-playfair), serif' }}>
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
              <span className="text-[11px] font-semibold text-primary uppercase tracking-wider" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                Live Pricing
              </span>
            </div>
            <span className="text-base font-semibold text-ticker-muted tracking-tight leading-tight" style={{ fontFamily: 'var(--font-playfair), serif' }}>
              Charts & History
            </span>
          </Link>
        </div>

        {/* Status bar: market status, phone, currency toggle */}
        <div className="flex items-center justify-between py-1.5 border-t border-ticker-border/40 text-[10px] text-ticker-muted">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${marketStatus.isOpen ? 'bg-success' : 'bg-orange-500'}`} />
              <span className="font-medium">{marketStatus.isOpen ? 'Markets Open' : 'Markets Closed'}</span>
            </div>
            <a href="tel:1300783190" className="flex items-center gap-1 text-ticker-muted hover:text-ticker-foreground transition-colors">
              <Phone className="h-2.5 w-2.5" />
              <span className="font-medium">1300 783 190</span>
            </a>
          </div>
          <div className="relative" ref={currencyRef}>
            <button
              onClick={() => setCurrencyOpen(!currencyOpen)}
              className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-ticker-foreground bg-white/10 border border-ticker-border rounded hover:bg-white/15 transition-colors"
            >
              <span>{currency}</span>
              <ChevronDown className={`w-2.5 h-2.5 transition-transform ${currencyOpen ? 'rotate-180' : ''}`} />
            </button>

            {currencyOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-card border border-border rounded shadow-lg z-50">
                <div className="py-1">
                  <button
                    onClick={() => { setCurrency('USD'); setCurrencyOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-muted ${
                      currency === 'USD' ? 'bg-muted text-primary font-medium' : 'text-foreground'
                    }`}
                  >
                    USD - US Dollar
                  </button>
                  <button
                    onClick={() => { setCurrency('AUD'); setCurrencyOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-muted ${
                      currency === 'AUD' ? 'bg-muted text-primary font-medium' : 'text-foreground'
                    }`}
                  >
                    AUD - Australian Dollar
                  </button>
                </div>
                {currency === 'AUD' && (
                  <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
                    {fxLoading ? (
                      <span>Loading rate...</span>
                    ) : (
                      <>
                        <div>1 USD = {fxRate.toFixed(4)} AUD</div>
                        {fxTimestamp && (
                          <div className="text-muted-foreground/70">
                            Updated: {fxTimestamp.toLocaleTimeString()}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
