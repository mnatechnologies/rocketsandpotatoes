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
} from '@/lib/pricing/pricingTimer';
import { createLogger } from '@/lib/utils/logger';
import { useCurrency } from '@/contexts/CurrencyContext';
import { applyVolumeDiscount } from '@/lib/pricing/priceCalculations';
import { toast } from 'sonner';

const logger = createLogger('CART_CONTEXT');

export interface CartItem {
  product: Product;
  quantity: number;
  addedAt: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  addToCartById: (productId: string) => Promise<boolean>;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: (currentPrices?: Map<string, number>) => number;
  getCartDiscount: (currentPrices?: Map<string, number>) => number;
  getCartCount: () => number;
  getLockedPriceForProduct: (productId: string) => number | null;
  isLoading: boolean;
  timerRemaining: number;
  timerFormatted: string;
  isTimerExpired: boolean;
  customerId: string | null;
  customerEmail: string | null;
  sessionId: string | null;
  lockPricesOnServer: ( products: Product[], currency:string) => Promise<any>;
  startTimer: () => void;

}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'cart';
const SESSION_ID_KEY = 'cart_session_id'

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { currency } = useCurrency();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timerRemaining, setTimerRemaining] = useState(0);
  const [timerFormatted, setTimerFormatted] = useState('00:00');
  const [isTimerExpired, setIsTimerExpired] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);


  // Fetch customer ID from Supabase when user is loaded
  useEffect(() => {
    const fetchCustomerId = async () => {
      if (!user) {
        setCustomerId(null);
        return;
      }

      logger.log('Fetching customer ID for Clerk user:', user.id);
      try {
        const response = await fetch('/api/customer');
        if (response.ok) {
          const data = await response.json();
          logger.log('Customer data fetched:', data.id);
          setCustomerId(data.id);
        } else {
          logger.log('Customer not found, may need to wait for webhook');
          setCustomerId(null);
        }
      } catch (error) {
        logger.error('Error fetching customer ID:', error);
        setCustomerId(null);
      }
    };

    if (isUserLoaded) {
      fetchCustomerId();
    }
  }, [user, isUserLoaded]);

  useEffect(() => {
    let id = localStorage.getItem(SESSION_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_ID_KEY, id);
    }
    setSessionId(id);
  }, []);

  // Load cart from localStorage on mount
  useEffect(() => {
    const loadCart = () => {
      try {
        const savedCart = localStorage.getItem(CART_STORAGE_KEY);
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          setCart(parsedCart);
          logger.log('Cart loaded:', parsedCart.length, 'items');
        }
      } catch (error) {
        logger.error('Error loading cart:', error);
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

      window.dispatchEvent(new Event('cartUpdated'));
      logger.log(' Cart saved to localStorage:', cart.length, 'items');
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

      const expired = !active && remaining === 0;
      setIsTimerExpired(expired);

      if (expired && !isTimerExpired) {
        logger.log(' Timer expired - clearing locked prices');
        clearPricingTimer()
      }
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [cart.length, isTimerExpired]);

  const lockPricesOnServer = useCallback(async (products: Product[], currency: string) => {
    if (!sessionId || products.length === 0) return null;

    try {
      const response = await fetch('/api/products/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          customerId: customerId || undefined,
          products: products.map(p => ({ productId: p.id })),
          currency,  // ✅ Pass currency to lock prices in user's selected currency
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to lock prices');
      }

      const data = await response.json();
      logger.log('Server price lock created:', data);

      // Update local locked prices with server values
      if (data.lockedPrices) {
        lockPrices(data.lockedPrices.map((lp: { productId: any; price: any; priceUSD: any; priceAUD: any; currency: any; }) => ({
          productId: lp.productId,
          price: lp.price,
          priceUSD: lp.priceUSD,
          priceAUD: lp.priceAUD,
          currency: lp.currency,

        })));
      }

      return data;
    } catch (error) {
      logger.error('Error locking prices on server:', error);
      return null;
    }
  }, [sessionId, customerId]);

  const addToCart = useCallback(async (product: Product, quantity: number = 1) => {
    if (product.sales_halted) {
      toast.error('This product is temporarily unavailable');
      return;
    }

    const timerActive = isTimerActive();
    const isNewProduct = !cart.some((item) => item.product.id === product.id);

    setCart((prevCart) => {
      const existingItemIndex = prevCart.findIndex(
        (item) => item.product.id === product.id
      );

      let newCart: CartItem[];

      if (existingItemIndex > -1) {
        // Update quantity of existing item
        newCart = [...prevCart];
        newCart[existingItemIndex].quantity += quantity;
        logger.log(` Updated quantity for ${product.name}:`, newCart[existingItemIndex].quantity);
      } else {
        // Add new item to cart
        const newItem: CartItem = {
          product,
          quantity,
          addedAt: Date.now(),
        };
        newCart = [...prevCart, newItem];
        logger.log(` Added new item to cart:`, product.name);
      }

      return newCart;
    });

    if (timerActive && isNewProduct) {
      logger.log(' Timer active- locking new product:', product.name);
      await lockPricesOnServer([product], currency);
    }
  }, [cart, lockPricesOnServer, currency]);

  const addToCartById = useCallback(async (productId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/products/${productId}`);
      if (!response.ok) {
        throw new Error('Product not found');
      }
      const product: Product = await response.json();

      if (product.sales_halted) {
        toast.error('This product is temporarily unavailable');
        return false;
      }

      const trimmedImageUrl = product.image_url?.trim();
      const fullImageUrl = trimmedImageUrl
        ? `https://vlvejjyyvzrepccgmsvo.supabase.co/storage/v1/object/public/Images/${product.category.toLowerCase()}/${product.form_type ?`${product.form_type}/` : ''}${trimmedImageUrl}`
        : '/anblogo.png';

      const productWithUrl: Product = {
        ...product,
        image_url: fullImageUrl
      };

      addToCart(productWithUrl, 1);
      return true;
    } catch (error) {
      logger.error('Error adding product by ID:', error);
      return false;
    }
  }, [addToCart]);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prevCart) => {
      const filtered = prevCart.filter((item) => item.product.id !== productId);
      logger.log(` Removed product ${productId} from cart`);

      // Clear timer if cart becomes empty
      if (filtered.length === 0) {
        clearPricingTimer();
        logger.log( 'Cart empty, timer cleared');
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
    logger.log(` Updated quantity for product ${productId} to ${quantity}`);
  }, [removeFromCart]);

  const clearCart = useCallback( async () => {
    setCart([]);
    localStorage.removeItem(CART_STORAGE_KEY);
    sessionStorage.removeItem(CART_STORAGE_KEY);
    clearPricingTimer();
    if (sessionId) {
      try {
        await fetch('/api/products/pricing', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
      } catch (error) {
        logger.error('Error clearing server locks:', error);
      }
    }
    
    logger.log('Cart cleared');
  }, [sessionId]);

  const getCartTotal = useCallback((currentPrices?: Map<string, number>) => {
    return cart.reduce((total, item) => {
      let price: number;

      // Priority: passed-in current prices > locked price > database price
      if (currentPrices && currentPrices.has(item.product.id)) {
        price = currentPrices.get(item.product.id)!;
      } else {
        const locked = getLockedPrice(item.product.id);
        if (locked) {
          price = currency === 'AUD' ? locked.priceAUD : locked.priceUSD;
        } else {
          price = item.product.price;
        }
      }

      const { discountedUnitPrice } = applyVolumeDiscount(price, item.quantity);
      return total + discountedUnitPrice * item.quantity;
    }, 0);
  }, [cart, currency]);

  const getCartDiscount = useCallback((currentPrices?: Map<string, number>) => {
    return cart.reduce((totalDiscount, item) => {
      let price: number;

      if (currentPrices && currentPrices.has(item.product.id)) {
        price = currentPrices.get(item.product.id)!;
      } else {
        const locked = getLockedPrice(item.product.id);
        if (locked) {
          price = currency === 'AUD' ? locked.priceAUD : locked.priceUSD;
        } else {
          price = item.product.price;
        }
      }

      const { totalSavings } = applyVolumeDiscount(price, item.quantity);
      return totalDiscount + totalSavings;
    }, 0);
  }, [cart, currency]);

  const getCartCount = useCallback(() => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  }, [cart]);

  const getLockedPriceForProduct = useCallback((productId: string): number | null => {
    const locked = getLockedPrice(productId);
    if (!locked) return null;
    // ✅ Return price in current currency (already locked at same FX rate)
    return currency === 'AUD' ? locked.priceAUD : locked.priceUSD;
  }, [currency]);

  const startTimer = useCallback(() => {
    startPricingTimer();  // Updates localStorage
    setIsTimerExpired(false);  // Immediately sync React state
    setTimerRemaining(15 * 60 * 1000);
    setTimerFormatted('15:00');
  }, []);


  const value: CartContextType = {
    cart,
    addToCart,
    addToCartById,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartDiscount,
    getCartCount,
    getLockedPriceForProduct,
    isLoading,
    timerRemaining,
    timerFormatted,
    isTimerExpired,
    customerId,
    customerEmail: user?.primaryEmailAddress?.emailAddress ?? null,
    sessionId,
    lockPricesOnServer,
    startTimer
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