import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
const CART_KEY = 'dulcemae_cart_v1';

function readStoredCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(item => item && item.id != null && item.name && Number(item.price) > 0)
      .map(item => ({
        ...item,
        price: Number(item.price),
        quantity: Math.max(1, Number(item.quantity) || 1),
      }));
  } catch {
    return [];
  }
}

export const useCart = () => useContext(CartContext);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(readStoredCart);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    const syncCart = (event) => {
      if (event.key === CART_KEY) setCartItems(readStoredCart());
    };
    window.addEventListener('storage', syncCart);
    return () => window.removeEventListener('storage', syncCart);
  }, []);

  const addToCart = useCallback((product) => {
    setCartItems((prev) => {
      const existing = prev.find(item => item.id === product.id);
      return existing
        ? prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
        : [...prev, { ...product, quantity: 1 }];
    });

    window.dispatchEvent(new CustomEvent('itemAdded'));
  }, []);

  const removeItem = useCallback((id) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id, qty) => {
    if (qty < 1) {
      removeItem(id);
      return;
    }
    setCartItems(prev => prev.map(item => item.id === id ? { ...item, quantity: qty } : item));
  }, [removeItem]);

  const clearCart = useCallback(() => setCartItems([]), []);
  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  const { cartCount, cartTotal } = useMemo(() => {
    let count = 0;
    let total = 0;

    for (const item of cartItems) {
      count += item.quantity;
      total += item.price * item.quantity;
    }

    return { cartCount: count, cartTotal: total };
  }, [cartItems]);

  const value = useMemo(() => ({
    cartItems,
    addToCart,
    removeItem,
    updateQuantity,
    clearCart,
    cartCount,
    itemCount: cartCount,
    cartTotal,
    isCartOpen,
    openCart,
    closeCart,
  }), [
    cartItems,
    addToCart,
    removeItem,
    updateQuantity,
    clearCart,
    cartCount,
    cartTotal,
    isCartOpen,
    openCart,
    closeCart,
  ]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
