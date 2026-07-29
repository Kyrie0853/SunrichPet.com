"use client";

import { useState, useEffect, useCallback } from "react";

export interface CartItem {
  product_id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

const STORAGE_KEY = "guest_cart";

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function useGuestCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  // 初始化加载
  useEffect(() => {
    setItems(loadCart());
    setReady(true);
  }, []);

  // 监听其他标签页的 storage 变化
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) {
        setItems(loadCart());
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const addItem = useCallback((item: Omit<CartItem, "quantity">) => {
    setItems(prev => {
      const existing = prev.find(i => i.product_id === item.product_id);
      let next: CartItem[];
      if (existing) {
        next = prev.map(i =>
          i.product_id === item.product_id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      } else {
        next = [...prev, { ...item, quantity: 1 }];
      }
      saveCart(next);
      return next;
    });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItems(prev => {
      if (quantity <= 0) {
        const next = prev.filter(i => i.product_id !== productId);
        saveCart(next);
        return next;
      }
      const next = prev.map(i =>
        i.product_id === productId ? { ...i, quantity } : i
      );
      saveCart(next);
      return next;
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems(prev => {
      const next = prev.filter(i => i.product_id !== productId);
      saveCart(next);
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    saveCart([]);
  }, []);

  const clearItems = useCallback((productIds: string[]) => {
    setItems(prev => {
      const next = prev.filter(i => !productIds.includes(i.product_id));
      saveCart(next);
      return next;
    });
  }, []);

  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return {
    items,
    ready,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    clearItems,
    totalCount,
    totalPrice,
  };
}
