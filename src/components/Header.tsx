"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Image from "next/image";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [tickerHeight, setTickerHeight] = useState(56); 

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    const calculateTickerHeight = () => {
      const ticker = document.querySelector('[data-ticker]') as HTMLElement;
      if (ticker) {
        setTickerHeight(ticker.offsetHeight);
      }
    };

    calculateTickerHeight();
    setTimeout(calculateTickerHeight, 0); 
    setTimeout(calculateTickerHeight, 50); 
    setTimeout(calculateTickerHeight, 100); 
    
    window.addEventListener('resize', calculateTickerHeight);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', calculateTickerHeight);
    };
  }, []);

  const navItems = [
    { name: "Products", href: "/#products" },
    { name: "Pricing", href: "/#pricing" },
    { name: "About", href: "/#about" },
    { name: "Contact", href: "/#contact" },
  ];

  return (
    <nav 
      className={`fixed left-0 right-0 z-30 backdrop-blur-md border-b border-border transition-all duration-300 ${
        isScrolled ? 'bg-background/95 shadow-lg' : 'bg-background/60'
      }`}
      style={{ 
        top: `${tickerHeight}px`,
        // CSS fallback for initial load
        '--fallback-top': '60px'
      } as React.CSSProperties & { '--fallback-top': string }}
      data-header
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <Image
              src="/anb-logo-enhanced.png"
              alt="Australian National Bullion Logo"
              width={48}
              height={48}
              className="h-12 w-auto drop-shadow-sm"
            />
            <span className="hidden sm:block text-lg font-bold text-foreground">
              Australian National Bullion
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-foreground hover:text-primary transition-colors duration-200 font-medium"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-3">
            <button className="inline-flex items-center justify-center h-9 px-3 rounded-md border border-border text-foreground hover:bg-muted/30 transition-smooth">
              Cart (0)
            </button>
            <button className="inline-flex items-center justify-center h-9 px-3 rounded-md border border-border text-foreground hover:bg-muted/30 transition-smooth">
              Login
            </button>
            <button className="inline-flex items-center justify-center h-9 px-3 rounded-md bg-primary text-primary-foreground shadow-gold transition-smooth hover:opacity-95">
              Sign Up
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-border text-foreground hover:bg-muted/30 transition-smooth"
              onClick={() => setIsMenuOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {isMenuOpen ? (
                  <path d="M18 6L6 18M6 6l12 12" />
                ) : (
                  <>
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border">
            <div className="py-4 space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block text-foreground hover:text-primary transition-colors duration-200 font-medium py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="pt-4 space-y-2">
                <button className="w-full inline-flex items-center justify-center h-9 px-3 rounded-md border border-border text-foreground hover:bg-muted/30 transition-smooth">
                  Login
                </button>
                <button className="w-full inline-flex items-center justify-center h-9 px-3 rounded-md bg-primary text-primary-foreground shadow-gold transition-smooth hover:opacity-95">
                  Sign Up
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
