"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
} from '@clerk/nextjs';
import {ShoppingCartIcon} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import CurrencySelector from "@/components/CurrencySelector";


export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [tickerHeight, setTickerHeight] = useState(56);
  const { getCartCount } = useCart();
  const cartCount = getCartCount();
  const { user } = useUser();
  
  // Check if user has admin role
  const isAdmin = user?.publicMetadata?.role === 'admin';



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

  useEffect(() => {

    const updateHeaderHeight = () => {
      const ticker = document.querySelector('[data-ticker]') as HTMLElement;
      const header = document.querySelector('[data-header]') as HTMLElement;

      if (ticker && header) {
        const totalHeight = ticker.offsetHeight + header.offsetHeight;
        document.documentElement.style.setProperty('--header-total-height', `${totalHeight}px`);
      }
    };

    updateHeaderHeight();
    // Update on resize and after a short delay to ensure everything is rendered
    setTimeout(updateHeaderHeight, 0);
    setTimeout(updateHeaderHeight, 100);

    window.addEventListener('resize', updateHeaderHeight);

    return () => {
      window.removeEventListener('resize', updateHeaderHeight);
    };
  }, [tickerHeight]);

  const navItems = useMemo(() => {
    const items = [
      { name: "Products", href: "/products" },
      { name: "Pricing", href: "/#pricing" },
      { name: "About", href: "/#about" },
      { name: "Contact", href: "/#contact" },
    ];
    
    // Only show Admin link to users with admin role
    if (isAdmin) {
      items.push({ name: "Admin", href: '/admin' });
    }
    
    return items;
  }, [isAdmin]);

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
                  src="/anblogo.png"
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
            <div className="hidden md:flex items-center space-x-3 " >
              <CurrencySelector />
              <Link href={'/cart'}>
                <button className=" mt-2 relative cursor-pointer inline-flex items-center...">
                  <ShoppingCartIcon/>
                  {cartCount > 0 && (
                    <span
                      className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                  )}
                </button>
              </Link>

              {/* Clerk Authentication Components */}
              <SignedOut>
                <SignInButton>
                  <button className="bg-[#6c47ff] text-white rounded-full font-medium text-sm h-9 px-4 cursor-pointer hover:opacity-95 transition-opacity">
                    Login
                  </button>
                </SignInButton>
                <SignUpButton>
                  <button className="bg-[#6c47ff] text-white rounded-full font-medium text-sm h-9 px-4 cursor-pointer hover:opacity-95 transition-opacity">
                    Sign Up
                  </button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                  className=" cursor-pointer inline-flex items-center justify-center h-9 w-9 rounded-md border border-border text-foreground hover:bg-muted/30 transition-smooth"
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
                  <div className="py-2">
                  <CurrencySelector />
                </div>

                  <Link href={'/cart'}>
                    <button className=" cursor-pointer inline-flex items-center justify-center h-9 px-3 rounded-md border border-border text-foreground hover:bg-muted/30 transition-smooth">
                      <ShoppingCartIcon/>
                      {cartCount > 0 && (
                        <span
                          className= "bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                      )}
                    </button>
                  </Link>
                  {/* Mobile Authentication */}
                  <div className="pt-4 space-y-2">
                    <SignedOut>
                      <SignInButton>
                        <button className="w-full inline-flex items-center justify-center h-9 px-3 rounded-md border border-border text-foreground hover:bg-muted/30 transition-smooth">
                          Login
                        </button>
                      </SignInButton>
                      <SignUpButton>
                        <button className="w-full inline-flex items-center justify-center h-9 px-3 rounded-md bg-[#6c47ff] text-white transition-smooth hover:opacity-95">
                          Sign Up
                        </button>
                      </SignUpButton>
                    </SignedOut>
                    <SignedIn>
                      <div className="flex justify-center">
                        <UserButton />
                      </div>
                    </SignedIn>
                  </div>
                </div>
              </div>
          )}
        </div>
      </nav>
  );
}