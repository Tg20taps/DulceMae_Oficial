import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';

const FloatingCart = () => {
  const { cartCount, openCart } = useCart();

  return (
    <AnimatePresence>
      {cartCount > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          className="fixed bottom-8 right-6 z-[220] md:bottom-10 md:right-10"
        >
          <button 
            onClick={openCart}
            data-floating-cart
            aria-label="Abrir carrito"
            className="relative flex items-center justify-center rounded-full bg-[#be185d] p-5 text-white shadow-[0_18px_54px_rgba(190,24,93,0.46)] transition-colors hover:bg-[#9f1239] md:p-6"
          >
            <ShoppingBag className="h-8 w-8 md:h-9 md:w-9" />
            <motion.span 
              key={cartCount}
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm font-bold text-[#be185d] shadow-md md:h-8 md:w-8"
            >
              {cartCount}
            </motion.span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FloatingCart;
