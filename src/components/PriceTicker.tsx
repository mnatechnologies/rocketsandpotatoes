"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMetalInfo, type MetalSymbol } from "@/lib/metals-api/metalsApi";
import { useMetalPrices } from '@/contexts/MetalPricesContext';
import { useCurrency } from '@/contexts/CurrencyContext';

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
  const { currency, exchangeRate } = useCurrency();
  const [marketStatus, setMarketStatus] = useState(getMarketStatus());
  const [nextRefreshCountdown, setNextRefreshCountdown] = useState('');

  const prices: TickerPrice[] = contextPrices.map((quote) => {
    const metalInfo = getMetalInfo(quote.symbol as MetalSymbol);
    const priceInCurrency = currency === 'AUD' ? quote.price * exchangeRate : quote.price;
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
          setNextRefreshCountdown(`${mins}:${secs.toString().padStart(2, '0')}`);
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
      <div className="fixed top-0 left-0 right-0 z-40 bg-zinc-950" data-ticker>
        <div className="container mx-auto px-4 py-4">
          <div className="grid grid-cols-5 gap-0">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="bg-zinc-900 p-4 border-r border-zinc-800 last:border-r-0 animate-pulse">
                <div className="h-4 w-16 bg-zinc-800 rounded mb-2" />
                <div className="h-6 w-24 bg-zinc-800 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-zinc-950" data-ticker>
      <div className="container mx-auto px-4">
        {/* 6-Column Grid: 4 metals + timer + fx rate */}
        <div className="grid grid-cols-3 md:grid-cols-6">
          {prices.map((price, index) => {
            const category = price.metal.charAt(0).toUpperCase() + price.metal.slice(1);
            return (
            <Link
              key={price.metal}
              href={`/products?category=${encodeURIComponent(category)}`}
              className={`bg-zinc-900 p-4 md:p-4 border-zinc-800 border-r transition-colors hover:bg-zinc-800 ${
                index < 3 ? 'border-b md:border-b-0' : ''
              }`}
              aria-label={`View ${category} products`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
                  {price.metal}
                </span>
                <div className={`flex items-center ${
                  price.change >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  <svg
                    className="h-3.5 w-5"
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
              <div className="text-xl md:text-2xl font-bold text-white tracking-tight">
                {formatPrice(price.price)}
              </div>
            </Link>
          )})}

          {/* 5th Column: Timer */}
          <div className="bg-zinc-900 p-4 md:p-5 border-zinc-800 border-r border-b md:border-b-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                Next Update
              </span>
              <svg className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className="text-xl md:text-2xl font-bold text-primary font-mono tracking-tight">
              {nextRefreshCountdown || '5:00'}
            </div>
          </div>

          {/* 6th Column: FX Rate */}
          <div className="bg-zinc-900 p-4 md:p-5 col-span-2 md:col-span-1 border-t md:border-t-0 border-zinc-800">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                FX Rate
              </span>
              <svg className="h-4 w-4 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div className="text-xl md:text-2xl font-bold text-white tracking-tight">
              {currency === 'USD' ? exchangeRate.toFixed(2) : (1 / exchangeRate).toFixed(4)}
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              {currency === 'USD'
                ? `1 USD = ${exchangeRate.toFixed(2)} AUD`
                : `1 AUD = ${(1 / exchangeRate).toFixed(4)} USD`
              }
            </div>
          </div>
        </div>

        {/* Status Bar - Bigger font */}
        <div className="flex items-center justify-between py-3 border-t border-zinc-800 text-sm text-zinc-400">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${marketStatus.isOpen ? 'bg-green-500' : 'bg-orange-500'}`} />
              <span className="font-medium">{marketStatus.isOpen ? 'Markets Open' : 'Markets Closed'}</span>
            </div>
            <span className="text-zinc-600">•</span>
            <span>{currency}</span>
            {lastUpdated && (
              <>
                <span className="text-zinc-600">•</span>
                <span>
                  Updated {lastUpdated.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
