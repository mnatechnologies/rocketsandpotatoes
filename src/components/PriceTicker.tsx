"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { getMetalInfo, type MetalSymbol } from "@/lib/metals-api/metalsApi";
import { useMetalPrices } from '@/contexts/MetalPricesContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { ChevronDown, Phone } from 'lucide-react';

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

export default function PriceTicker() {
  const { prices: contextPrices, isLoading, lastUpdated } = useMetalPrices();
  const { currency, setCurrency, exchangeRate, convertPrice, fxRate, fxTimestamp, isLoading: fxLoading } = useCurrency();
  const [marketStatus, setMarketStatus] = useState(getMarketStatus());
  const [nextRefreshCountdown, setNextRefreshCountdown] = useState('');
  const [currencyOpen, setCurrencyOpen] = useState(false);
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

  if (isLoading) {
    return (
      <div className="fixed top-0 left-0 right-0 z-40 bg-card border-b border-border" data-ticker>
        <div className="container mx-auto px-4 py-3">
          <div className="grid grid-cols-5 gap-0">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="bg-muted/50 p-3 border-r border-border last:border-r-0 animate-pulse rounded-sm">
                <div className="h-3 w-14 bg-muted rounded mb-2" />
                <div className="h-5 w-20 bg-muted rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-card border-b border-border" data-ticker>
      <div className="container mx-auto px-4">
        {/* 5-Column Grid: 4 metals + timer */}
        <div className="grid grid-cols-3 md:grid-cols-5">
          {prices.map((price, index) => {
            const category = price.metal.charAt(0).toUpperCase() + price.metal.slice(1);
            return (
            <Link
              key={price.metal}
              href={`/products?category=${encodeURIComponent(category)}`}
              className={`bg-card p-3 md:p-4 border-border/60 border-r transition-colors hover:bg-muted/40 ${
                index < 3 ? 'border-b md:border-b-0' : ''
              }`}
              aria-label={`View ${category} products`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {price.metal}
                </span>
                <div className={`flex items-center ${
                  price.change >= 0 ? 'text-success' : 'text-destructive'
                }`}>
                  <svg
                    className="h-3 w-4"
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
              <div className="text-lg md:text-xl font-bold text-foreground tracking-tight">
                {formatPrice(price.price)}
              </div>
            </Link>
          )})}

          {/* 5th Column: Timer */}
          <div className="bg-card p-3 md:p-4 border-border/60 col-span-2 md:col-span-1 border-t md:border-t-0">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[11px] font-semibold text-primary/80 uppercase tracking-wider">
                Next Update
              </span>
              <svg className="h-3.5 w-3.5 text-primary/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className="text-lg md:text-xl font-bold text-primary font-mono tracking-tight">
              {nextRefreshCountdown || '5:00'}
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between py-2 border-t border-border/40 text-xs text-muted-foreground">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${marketStatus.isOpen ? 'bg-success' : 'bg-orange-500'}`} />
              <span className="font-medium">{marketStatus.isOpen ? 'Markets Open' : 'Markets Closed'}</span>
            </div>
            {lastUpdated && (
              <>
                <span className="text-border hidden sm:inline">|</span>
                <span className="hidden sm:inline">
                  Updated {lastUpdated.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Phone Number */}
            <a
              href="tel:1300783190"
              className="hidden md:flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Phone className="h-3.5 w-3.5" />
              <span className="font-medium">1300 783 190</span>
            </a>

            {/* Currency Selector */}
            <div className="relative" ref={currencyRef}>
              <button
                onClick={() => setCurrencyOpen(!currencyOpen)}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-foreground bg-muted border border-border rounded hover:bg-muted/80 transition-colors"
              >
                <span>{currency}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${currencyOpen ? 'rotate-180' : ''}`} />
              </button>

              {currencyOpen && (
                <div className="absolute right-0 bottom-full mb-1 w-44 bg-card border border-border rounded shadow-lg z-50">
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
    </div>
  );
}
