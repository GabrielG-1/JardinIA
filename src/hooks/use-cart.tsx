
"use client";

import { createContext, useContext, useState, useMemo, useEffect } from 'react';
import type { CartItem } from '@/types/cart';
import type { Product } from '@/services/catalog-service';

type CartContextType = {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateItemQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getItem: (productId: string) => CartItem | undefined;
  totalItems: number;
  totalPrice: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

// Helper to safely get from localStorage
const getInitialState = (): CartItem[] => {
    // Prevent localStorage access on server
    if (typeof window === 'undefined') {
        return [];
    }
    try {
        const item = window.localStorage.getItem('cart');
        return item ? JSON.parse(item) : [];
    } catch (error) {
        console.warn("Could not parse cart from localStorage", error);
        return [];
    }
};

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(getInitialState);

  // Persist cart to localStorage whenever it changes, only on client
  useEffect(() => {
    if (typeof window !== 'undefined') {
        try {
            window.localStorage.setItem('cart', JSON.stringify(items));
        } catch (error) {
            console.error("Could not save cart to localStorage", error);
        }
    }
  }, [items]);

  const addItem = (product: Product) => {
    if (!product.id) return; // Safety check
    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevItems, { ...product, id: product.id!, quantity: 1 }];
    });
  };

  const removeItem = (productId: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  const updateItemQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getItem = (productId: string) => {
    return items.find(item => item.id === productId);
  };
  
  const totalItems = useMemo(() => {
    return items.reduce((total, item) => total + item.quantity, 0);
  }, [items]);

  const totalPrice = useMemo(() => {
    return items.reduce((total, item) => {
        const priceNumber = parseInt(item.price.replace(/[^0-9]/g, ''), 10);
        return total + (priceNumber * item.quantity);
    }, 0);
  }, [items]);

  const value = {
    items,
    addItem,
    removeItem,
    updateItemQuantity,
    clearCart,
    getItem,
    totalItems,
    totalPrice
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
