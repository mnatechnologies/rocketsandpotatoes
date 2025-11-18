'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { Product } from '@/types/product';
import {
  startPricingTimer,
  getRemainingTime,
  formatRemainingTime,
  lockPrices,
  getLockedPrice,
  clearPricingTimer,
  isTimerActive,
  type LockedPrice
} from '@/lib/pricing/pricingTimer';

export interface CartItem {
  product: Product;
  quantity: number;
  addedAt: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
  getLockedPriceForProduct: (productId: string) => number | null;
  isLoading: boolean;
  timerRemaining: number;
  timerFormatted: string;
  isTimerExpired: boolean;
  customerId: string | null;
  customerEmail: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timerRemaining, setTimerRemaining] = useState(0);
  const [timerFormatted, setTimerFormatted] = useState('00:00');
  const [isTimerExpired, setIsTimerExpired] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);

  // Fetch customer ID from Supabase when user is loaded
  useEffect(() => {
    const fetchCustomerId = async () => {
      if (!user) {
        setCustomerId(null);
        return;
      }

      console.log('[CART_CONTEXT] Fetching customer ID for Clerk user:', user.id);
      try {
        const response = await fetch('/api/customer');
        if (response.ok) {
          const data = await response.json();
          console.log('[CART_CONTEXT] Customer data fetched:', data.id);
          setCustomerId(data.id);
        } else {
          console.log('[CART_CONTEXT] Customer not found, may need to wait for webhook');
          setCustomerId(null);
        }
      } catch (error) {
        console.error('[CART_CONTEXT] Error fetching customer ID:', error);
        setCustomerId(null);
      }
    };

    if (isUserLoaded) {
      fetchCustomerId();
    }
  }, [user, isUserLoaded]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const loadCart = () => {
      try {
        const savedCart = localStorage.getItem(CART_STORAGE_KEY);
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          setCart(parsedCart);
          console.log('[CART_CONTEXT] Cart loaded from localStorage:', parsedCart.length, 'items');
        }
      } catch (error) {
        console.error('[CART_CONTEXT] Error loading cart:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCart();
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      // Dispatch custom event for other components to listen to
      window.dispatchEvent(new Event('cartUpdated'));
      console.log('[CART_CONTEXT] Cart saved to localStorage:', cart.length, 'items');
    }
  }, [cart, isLoading]);

  // Timer update effect
  useEffect(() => {
    if (cart.length === 0) {
      setTimerRemaining(0);
      setTimerFormatted('00:00');
      setIsTimerExpired(false);
      return;
    }

    const updateTimer = () => {
      const remaining = getRemainingTime();
      const formatted = formatRemainingTime();
      const active = isTimerActive();

      setTimerRemaining(remaining);
      setTimerFormatted(formatted);
      setIsTimerExpired(!active && remaining === 0);

      if (!active && remaining === 0) {
        console.log('[CART_CONTEXT] Timer expired');
      }
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [cart.length]);

  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    setCart((prevCart) => {
      const existingItemIndex = prevCart.findIndex(
        (item) => item.product.id === product.id
      );

      let newCart: CartItem[];

      if (existingItemIndex > -1) {
        // Update quantity of existing item
        newCart = [...prevCart];
        newCart[existingItemIndex].quantity += quantity;
        console.log(`[CART_CONTEXT] Updated quantity for ${product.name}:`, newCart[existingItemIndex].quantity);
      } else {
        // Add new item to cart
        const newItem: CartItem = {
          product,
          quantity,
          addedAt: Date.now(),
        };
        newCart = [...prevCart, newItem];
        console.log(`[CART_CONTEXT] Added new item to cart:`, product.name);

        // Start timer when first item is added
        if (prevCart.length === 0) {
          startPricingTimer();
          console.log('[CART_CONTEXT] Pricing timer started');
        }
      }

      return newCart;
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prevCart) => {
      const filtered = prevCart.filter((item) => item.product.id !== productId);
      console.log(`[CART_CONTEXT] Removed product ${productId} from cart`);

      // Clear timer if cart becomes empty
      if (filtered.length === 0) {
        clearPricingTimer();
        console.log('[CART_CONTEXT] Cart empty, timer cleared');
      }

      return filtered;
    });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      )
    );
    console.log(`[CART_CONTEXT] Updated quantity for product ${productId} to ${quantity}`);
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
    localStorage.removeItem(CART_STORAGE_KEY);
    clearPricingTimer();
    console.log('[CART_CONTEXT] Cart cleared');
  }, []);

  const getCartTotal = useCallback(() => {
    return cart.reduce((total, item) => {
      // Try to get locked price first, fallback to product price
      const lockedPrice = getLockedPrice(item.product.id);
      const price = lockedPrice?.price ?? item.product.price;
      return total + price * item.quantity;
    }, 0);
  }, [cart]);

  const getCartCount = useCallback(() => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  }, [cart]);

  const getLockedPriceForProduct = useCallback((productId: string): number | null => {
    const lockedPrice = getLockedPrice(productId);
    return lockedPrice?.price ?? null;
  }, []);

  const value: CartContextType = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount,
    getLockedPriceForProduct,
    isLoading,
    timerRemaining,
    timerFormatted,
    isTimerExpired,
    customerId,
    customerEmail: user?.primaryEmailAddress?.emailAddress ?? null,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}