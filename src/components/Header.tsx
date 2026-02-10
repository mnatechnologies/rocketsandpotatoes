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
        href: "/products?category=Gold"
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
      {
        name: "All Products",
        href: "/products"
      },
      {
        name: "Resources",
        href: "#",
        dropdown: [
          { name: "Charts", href: "/charts", description: "Live & historical metal prices" },
          { name: "About", href: "/about", description: "Learn about our company" },
          { name: "Contact", href: "/contact", description: "Get in touch with us" },
          { name: "FAQ", href: "/faq", description: "Frequently asked questions" },
        ]
      }
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
        ref={dropdownRef}
        className={`fixed top-0 left-0 right-0 z-40 border-b border-border/60 transition-all duration-300 ${
          isScrolled
            ? 'bg-background/95 backdrop-blur-xl shadow-md'
            : 'bg-background/80 backdrop-blur-md'
        }`}
        data-header
      >
        <div className="container mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between h-20 lg:h-[5.5rem]">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-4 hover:opacity-90 transition-opacity">
              <Image
                src="/anblogo.png"
                alt="Australian National Bullion Logo"
                width={64}
                height={64}
                className="h-14 lg:h-16 w-auto"
              />
              <div className="hidden sm:block">
                <span className="block text-lg lg:text-xl font-bold text-foreground leading-tight tracking-tight">
                  Australian National
                </span>
                <span className="block text-base lg:text-lg font-semibold text-primary leading-tight">
                  Bullion
                </span>
              </div>
            </Link>

            {/* Desktop Navigation with Dropdowns */}
            <div className="hidden lg:flex items-center gap-0.5">
              {navItems.map((item) => (
                <div key={item.name} className="relative">
                  {item.dropdown ? (
                    <button
                      onClick={() => handleDropdownToggle(item.name)}
                      onMouseEnter={() => setActiveDropdown(item.name)}
                      className={`flex items-center gap-1 px-3 py-2 text-base font-medium text-foreground hover:text-primary transition-colors duration-150 rounded-md hover:bg-muted/50 ${
                        activeDropdown === item.name ? 'text-primary bg-muted/50' : ''
                      }`}
                    >
                      {item.name}
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-150 ${activeDropdown === item.name ? 'rotate-180' : ''}`} />
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      className="px-3 py-2 text-base font-medium text-foreground hover:text-primary transition-colors duration-150 rounded-md hover:bg-muted/50"
                    >
                      {item.name}
                    </Link>
                  )}

                  {/* Dropdown Menu */}
                  {item.dropdown && activeDropdown === item.name && (
                    <div
                      className="absolute top-full left-0 mt-1 w-60 bg-card border border-border rounded-lg shadow-lg py-1.5 z-50"
                      onMouseLeave={() => setActiveDropdown(null)}
                    >
                      {item.dropdown.map((dropItem) => (
                        <Link
                          key={dropItem.name}
                          href={dropItem.href}
                          className="block px-4 py-2.5 hover:bg-muted/50 transition-colors"
                          onClick={() => setActiveDropdown(null)}
                        >
                          <span className="block text-sm font-medium text-foreground">{dropItem.name}</span>
                          {dropItem.description && (
                            <span className="block text-xs text-muted-foreground mt-0.5">{dropItem.description}</span>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center gap-2">
              <ThemeToggle />
              <Link href={'/cart'} aria-label={`Shopping cart with ${cartCount} items`}>
                <button
                  className="relative cursor-pointer inline-flex items-center justify-center h-9 w-9 rounded-md text-foreground/70 hover:text-foreground hover:bg-muted/50 transition-all"
                  aria-label={`View shopping cart (${cartCount} items)`}
                >
                  <ShoppingCartIcon className="h-[18px] w-[18px]" aria-hidden="true" />
                  {cartCount > 0 && (
                    <span
                      className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4.5 w-4.5 flex items-center justify-center min-w-[18px] min-h-[18px]"
                      aria-label={`${cartCount} items in cart`}
                    >
                      {cartCount}
                    </span>
                  )}
                </button>
              </Link>

              <div className="w-px h-6 bg-border mx-1" />

              <SignedOut>
                <SignInButton>
                  <button
                    className="text-sm font-medium text-foreground/80 hover:text-foreground px-3 py-1.5 rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
                    aria-label="Sign in to your account"
                  >
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton>
                  <button
                    className="bg-primary text-primary-foreground rounded-md font-medium text-sm h-9 px-4 cursor-pointer hover:bg-primary/90 transition-colors"
                    aria-label="Create a new account"
                  >
                    Get Started
                  </button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </div>

            {/* Mobile Actions */}
            <div className="lg:hidden flex items-center gap-1.5">
              <ThemeToggle />

              <Link href={'/cart'} aria-label={`Shopping cart with ${cartCount} items`}>
                <button
                  className="relative cursor-pointer inline-flex items-center justify-center h-9 w-9 rounded-md text-foreground/70 hover:text-foreground hover:bg-muted/50 transition-all"
                  aria-label={`View shopping cart (${cartCount} items)`}
                >
                  <ShoppingCartIcon className="h-[18px] w-[18px]" aria-hidden="true" />
                  {cartCount > 0 && (
                    <span
                      className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-[18px] min-h-[18px] flex items-center justify-center"
                      aria-label={`${cartCount} items in cart`}
                    >
                      {cartCount}
                    </span>
                  )}
                </button>
              </Link>

              <button
                className="cursor-pointer inline-flex items-center justify-center h-9 w-9 rounded-md text-foreground/70 hover:text-foreground hover:bg-muted/50 transition-all"
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
            <div className="lg:hidden border-t border-border/60">
              <div className="py-3 space-y-0.5">
                {navItems.map((item) => (
                  <div key={item.name}>
                    {item.dropdown ? (
                      <div>
                        <button
                          onClick={() => handleDropdownToggle(item.name)}
                          className="w-full flex items-center justify-between text-foreground hover:text-primary transition-colors duration-150 font-medium py-2.5 px-3 rounded-md hover:bg-muted/50 text-sm"
                        >
                          {item.name}
                          <ChevronDown className={`h-4 w-4 transition-transform ${activeDropdown === item.name ? 'rotate-180' : ''}`} />
                        </button>
                        {activeDropdown === item.name && (
                          <div className="pl-4 space-y-0.5 mt-0.5">
                            {item.dropdown.map((dropItem) => (
                              <Link
                                key={dropItem.name}
                                href={dropItem.href}
                                className="block py-2 px-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-md transition-colors"
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
                        className="block text-foreground hover:text-primary transition-colors duration-150 font-medium py-2.5 px-3 rounded-md hover:bg-muted/50 text-sm"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    )}
                  </div>
                ))}

                {/* Mobile Authentication */}
                <div className="pt-3 space-y-2 border-t border-border/60 mt-3">
                  <SignedOut>
                    <SignInButton>
                      <button className="w-full inline-flex items-center justify-center h-10 px-3 rounded-md text-sm font-medium text-foreground/80 hover:text-foreground border border-border hover:bg-muted/30 transition-all">
                        Sign In
                      </button>
                    </SignInButton>
                    <SignUpButton>
                      <button className="w-full inline-flex items-center justify-center h-10 px-3 rounded-md text-sm font-medium bg-primary text-primary-foreground transition-all hover:bg-primary/90">
                        Get Started
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
