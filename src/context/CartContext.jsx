import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
// v2: los productos vienen de Supabase (ids uuid) y pueden tener tamaño.
const CART_KEY = 'dulcemae_cart_v2';

export function getCartItemId(productId, optionId) {
  return optionId ? `${productId}:${optionId}` : String(productId);
}

function readStoredCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(item => item && item.productId && item.name && Number(item.price) > 0)
      .map(item => ({
        ...item,
        id: getCartItemId(item.productId, item.optionId),
        price: Number(item.price),
        quantity: Math.min(50, Math.max(1, Number(item.quantity) || 1)),
      }));
  } catch {
    return [];
  }
}

function writeStoredCart(items) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch {
    // Sin almacenamiento el carro igual funciona mientras la pestaña esté abierta.
  }
}

export const useCart = () => useContext(CartContext);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(readStoredCart);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    writeStoredCart(cartItems);
  }, [cartItems]);

  useEffect(() => {
    const syncCart = (event) => {
      if (event.key === CART_KEY) setCartItems(readStoredCart());
    };
    window.addEventListener('storage', syncCart);
    return () => window.removeEventListener('storage', syncCart);
  }, []);

  // `option` es el tamaño elegido, si el producto tiene tamaños.
  const addToCart = useCallback((product, option = null) => {
    const id = getCartItemId(product.id, option?.id);

    setCartItems((prev) => {
      const existing = prev.find(item => item.id === id);
      if (existing) {
        return prev.map(item => item.id === id ? { ...item, quantity: Math.min(50, item.quantity + 1) } : item);
      }
      return [...prev, {
        id,
        productId: product.id,
        optionId: option?.id ?? null,
        optionLabel: option?.label ?? null,
        name: option ? `${product.name} (${option.label})` : product.name,
        price: option ? option.price : product.price,
        image: product.image,
        category: product.category,
        quantity: 1,
      }];
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
    setCartItems(prev => prev.map(item => item.id === id ? { ...item, quantity: Math.min(50, qty) } : item));
  }, [removeItem]);

  // Con el catálogo cargado: saca lo que ya no se vende y actualiza nombres,
  // fotos y precios guardados de una visita anterior.
  const syncWithCatalog = useCallback((products) => {
    const byId = new Map(products.map(product => [product.id, product]));

    setCartItems(prev => {
      const next = [];
      for (const item of prev) {
        const product = byId.get(item.productId);
        if (!product || !product.available) continue;
        const option = item.optionId ? product.options.find(o => o.id === item.optionId) : null;
        if (product.options.length && !option) continue;
        if (!product.options.length && item.optionId) continue;
        next.push({
          ...item,
          optionLabel: option?.label ?? null,
          name: option ? `${product.name} (${option.label})` : product.name,
          price: option ? option.price : product.price,
          image: product.image,
          category: product.category,
        });
      }
      const changed = next.length !== prev.length || next.some((item, i) => (
        item.price !== prev[i].price || item.name !== prev[i].name || item.image !== prev[i].image
      ));
      return changed ? next : prev;
    });
  }, []);

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
    syncWithCatalog,
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
    syncWithCatalog,
    clearCart,
    cartCount,
    cartTotal,
    isCartOpen,
    openCart,
    closeCart,
  ]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
