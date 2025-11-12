
"use client";

import { useEffect, useState } from "react";
import { getMetalInfo, type MetalSymbol } from "@/lib/metals-api/metalsApi";

interface TickerPrice {
  metal: string;
  price: number;
  change: number;
  changePercent: number;
}

export default function PriceTicker() {
  const [prices, setPrices] = useState<TickerPrice[]>([
    { metal: "GOLD", price: 0, change: 0, changePercent: 0 },
    { metal: "SILVER", price: 0, change: 0, changePercent: 0 },
    { metal: "PLATINUM", price: 0, change: 0, changePercent: 0 },
    { metal: "PALLADIUM", price: 0, change: 0, changePercent: 0 },
  ]);

  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

   const fetchPrices = async () => {
    try {
      const response = await fetch('/api/metals?baseCurrency=USD');
      const result = await response.json();

      console.log('API Response:', result); // Debug log

      if (result.success && result.data) {
        const newPrices: TickerPrice[] = result.data.map((quote: any) => {
          console.log('Quote data:', quote); // Debug log
          const metalInfo = getMetalInfo(quote.symbol as MetalSymbol);
          return {
            metal: metalInfo.ticker,
            price: quote.price,
            change: quote.change,
            changePercent: quote.changePercent
          };
        });

        console.log('Mapped prices:', newPrices); // Debug log
        setPrices(newPrices);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error fetching prices:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 600000); // 5 minutes
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const formatPrice = (value: number) =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);

  if (isLoading) {
    return (
        <div className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-primary/12 via-primary/6 to-primary/12 backdrop-blur-sm" data-ticker>
          <div className="py-3">
            <div className="container mx-auto px-4 text-center">
              <span className="text-sm text-muted-foreground">Loading prices...</span>
            </div>
          </div>
        </div>
    );
  }

  return (
      <div
          className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
              isScrolled
                  ? 'bg-gradient-to-r from-primary/25 via-primary/15 to-primary/25 backdrop-blur-sm shadow-sm'
                  : 'bg-gradient-to-r from-primary/12 via-primary/6 to-primary/12 backdrop-blur-sm'
          }`}
          data-ticker
      >
        <div className="py-3">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center overflow-x-auto">
              <div className="flex items-center space-x-3 md:space-x-6 text-sm">
              <span className="text-primary font-semibold text-xs uppercase tracking-wide whitespace-nowrap">
                Live Prices
              </span>
                {prices.map((price) => (
                    <div key={price.metal} className="flex items-center space-x-2 whitespace-nowrap">
                      <span className="font-bold text-foreground">{price.metal}</span>
                      <span className="text-foreground font-semibold">{formatPrice(price.price)}</span>
                      <div className={`flex items-center space-x-1 ${price.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          {price.change >= 0 ? (
                              <polyline points="18 15 12 9 6 15" />
                          ) : (
                              <polyline points="6 9 12 15 18 9" />
                          )}
                        </svg>
                        <span className="text-xs font-medium">
                      {price.changePercent >= 0 ? "+" : ""}
                          {price.changePercent.toFixed(2)}%
                    </span>
                      </div>
                    </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}