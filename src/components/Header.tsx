"use client";

import Link from "next/link";
import { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
} from '@clerk/nextjs';
import { ShoppingCartIcon, ChevronDown } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import CurrencySelector from "@/components/CurrencySelector";
import ThemeToggle from "@/components/ThemeToggle";

interface DropdownItem {
  name: string;
  href: string;
  description?: string;
}

interface NavItem {
  name: string;
  href: string;
  dropdown?: DropdownItem[];
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [tickerHeight, setTickerHeight] = useState(100);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { getCartCount } = useCart();
  const cartCount = getCartCount();
  const { user } = useUser();
  
  const isAdmin = user?.publicMetadata?.role === 'admin';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);

    const tickerEl = document.querySelector('[data-ticker]') as HTMLElement;
    const headerEl = document.querySelector('[data-header]') as HTMLElement;

    if (!tickerEl || !headerEl) return;

    const observer = new ResizeObserver(() => {
      const newTickerHeight = tickerEl.offsetHeight;
      const newHeaderHeight = headerEl.offsetHeight;
      setTickerHeight(newTickerHeight);
      document.documentElement.style.setProperty('--header-total-height', `${newTickerHeight + newHeaderHeight}px`);
    });

    observer.observe(tickerEl);
    observer.observe(headerEl);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems: NavItem[] = useMemo(() => {
    const items: NavItem[] = [
      { 
        name: "Buy Gold", 
        href: "/products?category=Gold",
        dropdown: [
          { name: "All Gold", href: "/products?category=Gold", description: "Browse all gold products" },
          { name: "Cast Bars", href: "/products?category=Gold&formType=cast", description: "Traditional cast gold bars" },
          { name: "Minted Bars", href: "/products?category=Gold&formType=minted", description: "Premium minted tablets" },
        ]
      },
      { 
        name: "Buy Silver", 
        href: "/products?category=Silver"
      },
      { 
        name: "Buy Platinum", 
        href: "/products?category=Platinum" 
      },
      { 
        name: "Buy Palladium", 
        href: "/products?category=Palladium" 
      },
      { name: "About", href: "/about" },
      { name: "Contact", href: "/contact" },
    ];

    if (isAdmin) {
      items.push({ name: "Admin", href: '/admin' });
    }

    return items;
  }, [isAdmin]);

  const handleDropdownToggle = (name: string) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  return (
    <>
      {/* Main Header */}
      <nav
        className={`fixed left-0 right-0 z-30 backdrop-blur-md border-b border-border transition-all duration-300 ${
          isScrolled ? 'bg-background/95 shadow-lg' : 'bg-background/80'
        }`}
        style={{
          top: `${tickerHeight}px`,
        }}
        data-header
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo - Larger */}
            <Link href="/" className="flex items-center space-x-4 hover:opacity-80 transition-opacity">
              <Image
                src="/anblogo.png"
                alt="Australian National Bullion Logo"
                width={64}
                height={64}
                className="h-16 w-auto drop-shadow-sm"
              />
              <div className="hidden sm:block">
                <span className="block text-xl font-bold text-foreground leading-tight">
                  Australian National
                </span>
                <span className="block text-lg font-semibold text-primary">
                  Bullion
                </span>
              </div>
            </Link>

            {/* Desktop Navigation with Dropdowns */}
            <div className="hidden lg:flex items-center space-x-1" ref={dropdownRef}>
              {navItems.map((item) => (
                <div key={item.name} className="relative">
                  {item.dropdown ? (
                    <button
                      onClick={() => handleDropdownToggle(item.name)}
                      onMouseEnter={() => setActiveDropdown(item.name)}
                      className={`flex items-center gap-1 px-4 py-2 text-foreground hover:text-primary transition-colors duration-200 font-medium rounded-md hover:bg-muted/50 ${
                        activeDropdown === item.name ? 'text-primary bg-muted/50' : ''
                      }`}
                    >
                      {item.name}
                      <ChevronDown className={`h-4 w-4 transition-transform ${activeDropdown === item.name ? 'rotate-180' : ''}`} />
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      className="px-4 py-2 text-foreground hover:text-primary transition-colors duration-200 font-medium rounded-md hover:bg-muted/50"
                    >
                      {item.name}
                    </Link>
                  )}

                  {/* Dropdown Menu */}
                  {item.dropdown && activeDropdown === item.name && (
                    <div 
                      className="absolute top-full left-0 mt-1 w-64 bg-background border border-border rounded-lg shadow-xl py-2 z-50"
                      onMouseLeave={() => setActiveDropdown(null)}
                    >
                      {item.dropdown.map((dropItem) => (
                        <Link
                          key={dropItem.name}
                          href={dropItem.href}
                          className="block px-4 py-3 hover:bg-muted/50 transition-colors"
                          onClick={() => setActiveDropdown(null)}
                        >
                          <span className="block font-medium text-foreground">{dropItem.name}</span>
                          {dropItem.description && (
                            <span className="block text-sm text-muted-foreground mt-0.5">{dropItem.description}</span>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-3">
              <ThemeToggle />
              <CurrencySelector />
              <Link href={'/cart'} aria-label={`Shopping cart with ${cartCount} items`}>
                <button
                  className="relative cursor-pointer inline-flex items-center justify-center h-10 w-10 rounded-md border border-border text-foreground hover:bg-muted/30 transition-all"
                  aria-label={`View shopping cart (${cartCount} items)`}
                >
                  <ShoppingCartIcon className="h-5 w-5" aria-hidden="true" />
                  {cartCount > 0 && (
                    <span
                      className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
                      aria-label={`${cartCount} items in cart`}
                    >
                      {cartCount}
                    </span>
                  )}
                </button>
              </Link>

              <SignedOut>
                <SignInButton>
                  <button
                    className="bg-primary/10 text-primary border border-primary/20 rounded-md font-medium text-sm h-10 px-4 cursor-pointer hover:bg-primary/20 transition-colors"
                    aria-label="Sign in to your account"
                  >
                    Login
                  </button>
                </SignInButton>
                <SignUpButton>
                  <button
                    className="bg-primary text-primary-foreground rounded-md font-medium text-sm h-10 px-4 cursor-pointer hover:opacity-90 transition-opacity"
                    aria-label="Create a new account"
                  >
                    Sign Up
                  </button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </div>

            {/* Mobile Actions */}
            <div className="lg:hidden flex items-center gap-2">
              <ThemeToggle />
              <CurrencySelector />

              <Link href={'/cart'} aria-label={`Shopping cart with ${cartCount} items`}>
                <button
                  className="relative cursor-pointer inline-flex items-center justify-center h-9 w-9 rounded-md border border-border text-foreground hover:bg-muted/30 transition-smooth"
                  aria-label={`View shopping cart (${cartCount} items)`}
                >
                  <ShoppingCartIcon className="h-5 w-5" aria-hidden="true" />
                  {cartCount > 0 && (
                    <span
                      className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
                      aria-label={`${cartCount} items in cart`}
                    >
                      {cartCount}
                    </span>
                  )}
                </button>
              </Link>

              <button
                className="cursor-pointer inline-flex items-center justify-center h-9 w-9 rounded-md border border-border text-foreground hover:bg-muted/30 transition-smooth"
                onClick={() => setIsMenuOpen((v) => !v)}
                aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={isMenuOpen}
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
            <div className="lg:hidden border-t border-border">
              <div className="py-4 space-y-1">
                {navItems.map((item) => (
                  <div key={item.name}>
                    {item.dropdown ? (
                      <div>
                        <button
                          onClick={() => handleDropdownToggle(item.name)}
                          className="w-full flex items-center justify-between text-foreground hover:text-primary transition-colors duration-200 font-medium py-3 px-2 rounded-md hover:bg-muted/50"
                        >
                          {item.name}
                          <ChevronDown className={`h-4 w-4 transition-transform ${activeDropdown === item.name ? 'rotate-180' : ''}`} />
                        </button>
                        {activeDropdown === item.name && (
                          <div className="pl-4 space-y-1 mt-1">
                            {item.dropdown.map((dropItem) => (
                              <Link
                                key={dropItem.name}
                                href={dropItem.href}
                                className="block py-2 px-3 text-muted-foreground hover:text-primary hover:bg-muted/30 rounded-md transition-colors"
                                onClick={() => {
                                  setIsMenuOpen(false);
                                  setActiveDropdown(null);
                                }}
                              >
                                {dropItem.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Link
                        href={item.href}
                        className="block text-foreground hover:text-primary transition-colors duration-200 font-medium py-3 px-2 rounded-md hover:bg-muted/50"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    )}
                  </div>
                ))}
                
                {/* Mobile Authentication */}
                <div className="pt-4 space-y-2 border-t border-border mt-4">
                  <SignedOut>
                    <SignInButton>
                      <button className="w-full inline-flex items-center justify-center h-10 px-3 rounded-md border border-border text-foreground hover:bg-muted/30 transition-smooth">
                        Login
                      </button>
                    </SignInButton>
                    <SignUpButton>
                      <button className="w-full inline-flex items-center justify-center h-10 px-3 rounded-md bg-primary text-primary-foreground transition-smooth hover:opacity-95">
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
    </>
  );
}
