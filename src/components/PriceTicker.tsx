
"use client";

import { useEffect, useState } from "react";
import { getMetalInfo, type MetalSymbol } from "@/lib/metals-api/metalsApi";
import { useMetalPrices } from '@/contexts/MetalPricesContext';

interface TickerPrice {
  metal: string;
  price: number;
  change: number;
  changePercent: number;
}

function getMarketStatus() {
  const now = new Date();

  // Convert to Australian Eastern Time
  const australiaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Australia/Sydney' }));
  const utcDay = now.getUTCDay(); // 0 = Sunday, 6 = Saturday

  // Markets are closed on weekends (Saturday and Sunday in US time)
  if (utcDay === 0 || utcDay === 6) {
    return {
      isOpen: false,
      reason: 'Weekend',
      nextOpen: getNextMarketOpen(now)
    };
  }

  // Friday evening US time = Saturday morning Australia
  if (utcDay === 5) {
    const utcHour = now.getUTCHours();
    if (utcHour >= 21) { // 5pm ET Friday
      return {
        isOpen: false,
        reason: 'Weekend',
        nextOpen: getNextMarketOpen(now)
      };
    }
  }

  // Sunday evening US time = Monday morning Australia
  if (utcDay === 1) {
    const utcHour = now.getUTCHours();
    if (utcHour < 22) { // Before 6pm ET Sunday
      return {
        isOpen: false,
        reason: 'Weekend',
        nextOpen: getNextMarketOpen(now)
      };
    }
  }

  return { isOpen: true, reason: 'Live', nextOpen: null };
}
function getNextMarketOpen(now: Date): string {
  const utcDay = now.getUTCDay();
  const utcHour = now.getUTCHours();

  // If it's Friday evening or Saturday, market opens Sunday 6pm ET (Monday morning AEDT)
  if (utcDay === 5 || utcDay === 6) {
    const daysUntilSunday = utcDay === 5 ? 2 : 1;
    const nextOpen = new Date(now);
    nextOpen.setUTCDate(now.getUTCDate() + daysUntilSunday);
    nextOpen.setUTCHours(22, 0, 0, 0); // 6pm ET = 22:00 UTC (10am AEDT Monday)

    return nextOpen.toLocaleString('en-AU', {
      timeZone: 'Australia/Sydney',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  }

  // If it's Sunday before market open
  if (utcDay === 0 || (utcDay === 1 && utcHour < 22)) {
    const nextOpen = new Date(now);
    if (utcDay === 0) {
      nextOpen.setUTCDate(now.getUTCDate() + 1);
    }
    nextOpen.setUTCHours(22, 0, 0, 0);

    return nextOpen.toLocaleString('en-AU', {
      timeZone: 'Australia/Sydney',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  }

  return '';
}

export default function PriceTicker() {
  // Use shared prices from context - no more individual fetching!
  const { prices: contextPrices, isLoading, error, dataTimestamp } = useMetalPrices();
  const [marketStatus, setMarketStatus] = useState(getMarketStatus());
  const [isScrolled, setIsScrolled] = useState(false);


  // Transform context prices to match the component's expected format
  const prices: TickerPrice[] = contextPrices.map((quote) => {
    const metalInfo = getMetalInfo(quote.symbol as MetalSymbol);
    return {
      metal: metalInfo.ticker,
      price: quote.price,
      change: quote.change,
      changePercent: quote.changePercent
    };
  });



  /* ===== COMMENTED OUT - Now using shared context instead of individual fetch =====
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
  ===== END COMMENTED OUT CODE ===== */

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setMarketStatus(getMarketStatus)
    }, 60000);
    return () => clearInterval(interval)
  }, []);

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
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };



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
                <div className="flex items-center space-x-2">
                  <span className="text-primary font-semibold text-xs uppercase tracking-wide whitespace-nowrap">
                    {marketStatus.isOpen ? 'Live Prices' : 'Last Prices'}
                  </span>
                  {!marketStatus.isOpen && (
                    <span className="px-2 py-0.5 bg-orange-500/20 text-orange-600 rounded text-xs font-medium">
                      {marketStatus.reason}
                    </span>
                  )}
                </div>

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
                {dataTimestamp && (
                  <span className="text-xs text-muted-foreground ml-2 whitespace-nowrap">
                    {marketStatus.isOpen ? (
                      <>Updated {formatDateTime(dataTimestamp)}</>
                    ) : (
                      <>From {formatDateTime(dataTimestamp)}</>
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}