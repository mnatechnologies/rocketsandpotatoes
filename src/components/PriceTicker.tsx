"use client";

import { useEffect, useState } from "react";

interface TickerPrice {
  metal: string;
  price: number;
  change: number;
  changePercent: number;
}

export default function PriceTicker() {
  const [prices, setPrices] = useState<TickerPrice[]>([
    { metal: "GOLD", price: 2850.25, change: 12.5, changePercent: 0.44 },
    { metal: "SILVER", price: 42.18, change: -0.82, changePercent: -1.91 },
    { metal: "PLATINUM", price: 1248.75, change: 8.25, changePercent: 0.67 },
    { metal: "PALLADIUM", price: 1156.5, change: -15.3, changePercent: -1.31 },
  ]);
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  
  const handleScroll = () => {
    setIsScrolled(window.scrollY > 50);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
  
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  
  useEffect(() => {
    const interval = setInterval(() => {
      setPrices((prev) =>
        prev.map((p) => {
          const changeAmount = (Math.random() - 0.5) * 10;
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
    }, 5000);
    return () => clearInterval(interval);
  }, []);

 
  useEffect(() => {
    const scrollInterval = setInterval(() => {
      setScrollPosition((prev) => {
        const screenWidth = window.innerWidth;
        const itemWidth = 204;
        const spacing = 24; 
        const totalContentWidth = (4 * itemWidth) + (3 * spacing); 
        
        const maxScroll = Math.max(0, totalContentWidth - screenWidth + 50);
        
        if (maxScroll <= 0) {
          return 0; 
        }
        
        if (prev >= maxScroll) {
          return 0; 
        }
        return prev + 1; 
      });
    }, 50); 

    return () => clearInterval(scrollInterval);
  }, []); 


  const formatPrice = (value: number) =>
    new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  return (

    <div className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${isScrolled ? 'bg-gradient-to-r from-primary/25 via-primary/15 to-primary/25 backdrop-blur-sm shadow-sm' : 'bg-gradient-to-r from-primary/12 via-primary/6 to-primary/12 backdrop-blur-sm'}`} data-ticker>
      <div className="py-3">
        <div className="hidden xl:block">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-3 text-sm">
                <span className="text-primary font-semibold text-xs uppercase tracking-wide">Live Prices</span>
                {prices.map((price) => (
                  <div key={price.metal} className="flex items-center space-x-2 whitespace-nowrap">
                    <span className="font-bold text-foreground">{price.metal}</span>
                    <span className="text-foreground font-semibold">{formatPrice(price.price)}</span>
                    <div className={`flex items-center space-x-1 ${price.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {price.change >= 0 ? (
                          <polyline points="23 4 23 10 17 10" />
                        ) : (
                          <polyline points="1 20 1 14 7 14" />
                        )}
                      </svg>
                      <span className="text-xs font-medium">
                        {price.change >= 0 ? "+" : ""}
                        {price.change} ({price.changePercent >= 0 ? "+" : ""}
                        {price.changePercent}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

         {/* Mobile/Tablet layout */}
        <div className="xl:hidden">
          <div className="relative overflow-hidden">
            <div 
              className="flex items-center space-x-6 py-3 transition-transform duration-75 ease-linear"
              style={{ transform: `translateX(-${scrollPosition}px)` }}
            >
              {/* Duplicate content for seamless loop */}
              {[...prices, ...prices].map((price, index) => (
                <div key={`${price.metal}-${index}`} className="flex items-center space-x-2 whitespace-nowrap flex-shrink-0">
                  <span className="font-bold text-foreground text-sm">{price.metal}</span>
                  <span className="text-foreground font-semibold text-sm">{formatPrice(price.price)}</span>
                  <div className={`flex items-center space-x-1 ${price.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {price.change >= 0 ? (
                        <polyline points="23 4 23 10 17 10" />
                      ) : (
                        <polyline points="1 20 1 14 7 14" />
                      )}
                    </svg>
                    <span className="text-xs font-medium">
                      {price.change >= 0 ? "+" : ""}
                      {price.change} ({price.changePercent >= 0 ? "+" : ""}
                      {price.changePercent}%)
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
