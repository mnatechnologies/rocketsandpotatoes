"use client";
import { useEffect, useState } from "react";

interface MetalPrice {
  metal: string;
  price: number;
  change: number;
  changePercent: number;
}

export default function MetalsPricing() {
    // temporary until api linkage
  const [prices, setPrices] = useState<MetalPrice[]>([
    { metal: "Gold", price: 2650.45, change: 15.32, changePercent: 0.58 },
    { metal: "Silver", price: 31.22, change: -0.45, changePercent: -1.42 },
    { metal: "Platinum", price: 985.50, change: 8.75, changePercent: 0.9 },
    { metal: "Palladium", price: 1125.80, change: -12.30, changePercent: -1.08 },
  ]);

  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setPrices((prev) =>
        prev.map((p) => {
          const changeAmount = (Math.random() - 0.5) * 20;
          const newPrice = Math.max(0, p.price + changeAmount);
          const newChange = changeAmount;
          const newChangePercent = (changeAmount / p.price) * 100;
          return {
            ...p,
            price: parseFloat(newPrice.toFixed(2)),
            change: parseFloat(newChange.toFixed(2)),
            changePercent: parseFloat(newChangePercent.toFixed(2)),
          };
        })
      );
      setLastUpdated(new Date());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className=" bg-black text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-5xl font-bold mb-3">
            Live Precious Metals Pricing
          </h1>
          <p suppressHydrationWarning={true} className="text-gray-500 text-sm">
            Last updated: {formatTime(lastUpdated)} • Updates every 5 minutes
          </p>
        </div>

        {/* Price Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {prices.map((metal) => (
            <div
              key={metal.metal}
              className="bg-zinc-900 rounded-lg p-6 border border-zinc-800"
            >
              {/* Metal Name and Unit */}
              <div className="flex items-start justify-between mb-6">
                <h2 className="text-lg font-semibold">{metal.metal}</h2>
                <span className="text-xs text-gray-500">USD/oz</span>
              </div>

              {/* Price */}
              <div className="mb-4">
                <p className="text-3xl font-bold">
                  {formatPrice(metal.price)}
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
                  {metal.changePercent}%)
                </span>
              </div>
            </div>
          ))}
        </div>

      
      </div>
    </div>
  );
}