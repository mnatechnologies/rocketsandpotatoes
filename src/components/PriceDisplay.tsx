
"use client";
import { getMetalInfo, type MetalSymbol } from "@/lib/metals-api/metalsApi";
import { useMetalPrices } from '@/contexts/MetalPricesContext';
import {useEffect, useState} from "react";

interface MetalPrice {
  metal: string;
  price: number;
  change: number;
  changePercent: number;
}

function getMarketStatus() {
  const now = new Date();
  const utcDay = now.getUTCDay();
  const utcHour = now.getUTCHours();

  if (utcDay === 0 || utcDay === 6) {
    return { isOpen: false, reason: 'Weekend' };
  }

  if (utcDay === 5 && utcHour >= 21) {
    return { isOpen: false, reason: 'Weekend' };
  }

  if (utcDay === 1 && utcHour < 22) {
    return { isOpen: false, reason: 'Weekend' };
  }

  return { isOpen: true, reason: 'Live' };
}

export default function MetalsPricing() {
  // Use shared prices from context - no more individual fetching!
  const { prices: contextPrices, isLoading, error, lastUpdated, refetch } = useMetalPrices();
  const [marketStatus, setMarketStatus] = useState(getMarketStatus())

  useEffect(() => {
    const interval = setInterval(() => {
      setMarketStatus(getMarketStatus());
    }, 60000);
    return () => clearInterval(interval)
  }, []);

  // Transform context prices to match the component's expected format
  const prices: MetalPrice[] = contextPrices.map((quote) => {
    const metalInfo = getMetalInfo(quote.symbol as MetalSymbol);
    return {
      metal: metalInfo.ticker,
      price: quote.price,
      change: quote.change,
      changePercent: quote.changePercent
    };
  });

  const formatPrice = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  const formatDateTime = (date: Date) => {
    return date.toLocaleString("en-AU", {
      timeZone: 'Australia/Sydney',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
      timeZoneName: 'short'
     })
  }


  if (error) {
    return (
      <div className="bg-black text-white p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 text-center">
            <h2 className="text-xl font-bold text-red-500 mb-2">Error Loading Prices</h2>
            <p className="text-red-300">{error}</p>
            <button
              onClick={refetch}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id= 'pricing' className="bg-black text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <div className="flex items-center justify-center gap-3 mb-3">
            <h1 className="text-3xl md:text-5xl font-bold">
              {marketStatus.isOpen ? 'Live' : 'Latest'} Precious Metals Pricing
            </h1>
            {!marketStatus.isOpen && (
              <span className="px-3 py-1 bg-orange-500/20 text-orange-500 rounded-full text-sm font-medium">
                Markets Closed
              </span>
            )}
          </div>
          <p suppressHydrationWarning={true} className="text-gray-500 text-sm">
            {isLoading ? (
              "Loading prices..."
            ) : lastUpdated ? (
              marketStatus.isOpen ? (
                <>Last updated: {formatDateTime(lastUpdated)} • Updates every 5 minutes</>
              ) : (
                <>Prices from: {formatDateTime(lastUpdated)} • Markets closed for weekend</>
              )
            ) : (
              "Real-time market data"
            )}
          </p>
        </div>

        {/* Price Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {prices.map((metal) => (
            <div
              key={metal.metal}
              className={`bg-zinc-900 rounded-lg p-6 border border-zinc-800 transition-opacity ${
                isLoading ? 'opacity-50' : 'opacity-100'
              }`}
            >
              {/* Metal Name and Unit */}
              <div className="flex items-start justify-between mb-6">
                <h2 className="text-lg font-semibold">{metal.metal}</h2>
                <span className="text-xs text-gray-500">USD/oz</span>
              </div>

              {/* Price */}
              <div className="mb-4">
                <p className="text-3xl font-bold">
                  {isLoading && metal.price === 0 ? (
                    <span className="text-gray-600">Loading...</span>
                  ) : (
                    formatPrice(metal.price)
                  )}
                </p>
              </div>

              {/* Change */}
              <div
                className={`flex items-center space-x-1 text-sm ${
                  metal.change >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                <svg
                  className="h-3 w-3"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {metal.change >= 0 ? (
                    <polyline points="18 15 12 9 6 15" />
                  ) : (
                    <polyline points="6 9 12 15 18 9" />
                  )}
                </svg>
                <span className="font-medium">
                  {metal.change >= 0 ? "+" : ""}${Math.abs(metal.change).toFixed(2)} (
                  {metal.changePercent >= 0 ? "+" : ""}
                  {metal.changePercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}