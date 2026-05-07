import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { Plus } from 'lucide-react';
import { trackEvent } from '../utils/analytics';
import { useTheme, CATEGORY_THEME_MAP, resolveProductTheme } from '../context/ThemeContext';
import OptimizedImage from './OptimizedImage';

const MotionImage = motion(OptimizedImage);

const categories = ['Todos', 'Tortas', 'Kuchen', 'Alfajores', 'Postres'];

const products = [
  {
    id: 1,
    name: 'Torta de Chocolate y Frambuesa',
    category: 'Tortas',
    price: 25000,
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=600',
    description: 'Bizcocho húmedo de cacao con relleno de ganache y mermelada artesanal de frambuesa.',
  },
  {
    id: 2,
    name: 'Kuchen de Nuez',
    category: 'Kuchen',
    price: 15000,
    image: 'https://images.unsplash.com/photo-1519869325930-281384150729?auto=format&fit=crop&q=80&w=600',
    description: 'Tradicional receta del sur, masa suave con abundante relleno de nueces y manjar.',
  },
  {
    id: 3,
    name: 'Caja de Alfajores Premium',
    category: 'Alfajores',
    price: 12000,
    image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&q=80&w=600',
    description: '6 alfajores de maicena artesanales bañados en chocolate belga semiamargo.',
  },
  {
    id: 4,
    name: 'Torta Red Velvet',
    category: 'Tortas',
    price: 28000,
    image: 'https://images.unsplash.com/photo-1616541823729-00fe0aacd32c?auto=format&fit=crop&q=80&w=600',
    description: 'Clásica torta aterciopelada con nuestro frosting especial de queso crema.',
  },
  {
    id: 5,
    name: 'Kuchen de Manzana',
    category: 'Kuchen',
    price: 14000,
    image: 'https://images.unsplash.com/photo-1568430462989-44163eb17ab2?auto=format&fit=crop&q=80&w=600',
    description: 'Manzanas caramelizadas con canela sobre masa crujiente y migas dulces.',
  },
  {
    id: 6,
    name: 'Cheesecake de Frutos Rojos',
    category: 'Postres',
    price: 22000,
    image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&q=80&w=600',
    description: 'Suave y cremoso sobre base de galleta, coronado con coulis de frutos del bosque.',
  },
];

/* ── ProductCard — 3D Tilt + Magnetic Text + Zoom ───────────── */
const CATEGORY_ACCENTS = {
  Tortas: '#be185d',
  Kuchen: '#f9739c',
  Alfajores: '#db2777',
  Postres: '#c026d3',
};

const PRODUCT_NOTES = [
  { match: 'chocolate', notes: ['Cacao intenso', 'Ganache sedosa', 'Frambuesa real'] },
  { match: 'red velvet', notes: ['Miga aterciopelada', 'Frosting fresco', 'Color ceremonial'] },
  { match: 'nuez', notes: ['Nuez tostada', 'Manjar lento', 'Masa surena'] },
  { match: 'manzana', notes: ['Canela tibia', 'Manzana dorada', 'Migas crujientes'] },
  { match: 'alfajor', notes: ['Maicena fina', 'Bano brillante', 'Manjar artesanal'] },
  { match: 'cheesecake', notes: ['Queso crema', 'Coulis rojo', 'Base crocante'] },
];

function getProductNotes(product) {
  const name = product.name.toLowerCase();
  return PRODUCT_NOTES.find(item => name.includes(item.match))?.notes
    ?? ['Hecho a mano', '48h de oficio', 'Ingredientes selectos'];
}

function ProductCard({ product, index, onAdd, onHoverStart, onHoverEnd, highlighted = false }) {
  /* Motion values para el tilt */
 

  /* Motion values para el texto magnético */
 

  const [hov, setHov] = useState(false);

  function handleMouseLeave() {
    setHov(false);
    onHoverEnd?.();
  }

  const fmt = (n) => `$${n.toLocaleString('es-CL')}`;
  const accent = CATEGORY_ACCENTS[product.category] ?? '#be185d';
  const notes = getProductNotes(product);

  return (
    <motion.div
      data-product-id={product.id}
      layout
      key={product.id}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px 20% 0px' }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      onMouseEnter={() => { setHov(true); onHoverStart?.(); }}
      onMouseLeave={handleMouseLeave}
      style={{
        scrollMarginTop: 112,
      }}
      className="group flex flex-col rounded-3xl overflow-hidden"
    >
      {/* Card interior */}
      <div
        className="relative flex flex-col h-full rounded-3xl overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(16px)',
          border: highlighted ? `2px solid ${accent}` : '1px solid rgba(255,255,255,0.40)',
          boxShadow: highlighted
            ? `0 0 0 8px ${accent}18, 0 26px 72px ${accent}33`
            : hov
            ? '0 20px 60px rgba(190,24,93,0.18), 0 1px 0 rgba(255,255,255,0.6) inset'
            : '0 4px 24px rgba(190,24,93,0.07), 0 1px 0 rgba(255,255,255,0.5) inset',
          transition: 'box-shadow 0.35s ease, border-color 0.35s ease',
        }}
      >
        <motion.div
          aria-hidden="true"
          className="absolute z-0 rounded-full pointer-events-none blur-2xl"
          animate={{ opacity: hov ? 0.75 : 0 }}
          transition={{ duration: 0.3 }}
          style={{
            left: '50%',
            top: '28%',
            width: 190,
            height: 190,
            x: '-50%',
            y: '-50%',
            background: `radial-gradient(circle, ${accent}33 0%, transparent 70%)`,
          }}
        />
        {/* Image con zoom */}
        <div className="relative z-10 w-full h-72 overflow-hidden">
          <MotionImage
            src={product.image}
            alt={product.name}
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            loading={index < 2 ? 'eager' : 'lazy'}
            fetchPriority={index < 2 ? 'high' : 'auto'}
            animate={{ scale: hov ? 1.10 : 1 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="w-full h-full object-cover"
            style={{ willChange: 'transform' }}
          />
          {/* Overlay gradiente al hover */}
          <motion.div
            animate={{ opacity: hov ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(160deg, rgba(190,24,93,0.12) 0%, transparent 60%)' }}
          />
          <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-[#be185d] uppercase tracking-wider shadow-sm">
            {product.category}
          </div>
          <AnimatePresence>
            {hov && (
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="absolute left-4 right-4 bottom-4 flex flex-wrap gap-2"
              >
                {notes.map((note, noteIndex) => (
                  <motion.span
                    key={note}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: noteIndex * 0.04 }}
                    className="rounded-full border border-white/40 bg-white/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.13em] text-[#3f2128]/75 shadow-sm backdrop-blur-md"
                  >
                    {note}
                  </motion.span>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col flex-1 p-7 bg-gradient-to-b from-white/40 to-rose-50/50">
          {/* Título magnético */}
          <motion.h3
            className="font-serif text-2xl font-bold text-[#3f2128] mb-2 leading-tight"
          >
            {product.name}
          </motion.h3>

          <p className="text-gray-600 text-sm mb-6 flex-1 line-clamp-3">
            {product.description}
          </p>

          <div className="flex items-center justify-between mt-auto pt-4 border-t border-rose-100/50">
            {/* Precio magnético */}
            <motion.span
              className="font-bold text-xl text-[#3f2128]"
            >
              {fmt(product.price)}
            </motion.span>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onAdd(product)}
              data-add-to-cart={product.id}
              className="w-12 h-12 flex items-center justify-center bg-[#be185d] text-white rounded-full hover:bg-[#9f1239] transition-colors shadow-lg shadow-[#be185d]/40"
              title="Añadir al carrito"
            >
              <Plus className="w-6 h-6" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const Catalog = () => {
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [highlightedProductId, setHighlightedProductId] = useState(null);
  const { addToCart, openCart } = useCart();
  const { setTheme } = useTheme();

  const filteredProducts = activeCategory === 'Todos'
    ? products
    : products.filter(p => p.category === activeCategory);

  function handleCategoryChange(category) {
    setActiveCategory(category);
    // Actualiza tema atmosférico según categoría
    setTheme(CATEGORY_THEME_MAP[category] ?? 'default');
    trackEvent('catalog_filter', { category, result_count: category === 'Todos' ? products.length : products.filter(p => p.category === category).length });
  }

  function handleAddToCart(product) {
    addToCart(product);
    openCart();
    trackEvent('add_to_cart', {
      product_id: product.id,
      product_name: product.name,
      category: product.category,
      price_clp: product.price,
    });
  }

  useEffect(() => {
    function handleHighlightProduct(event) {
      const productId = Number(event.detail?.productId);
      const product = products.find(item => item.id === productId);
      if (!product) return;

      setActiveCategory(product.category);
      setTheme(CATEGORY_THEME_MAP[product.category] ?? 'default');
      setHighlightedProductId(productId);

      window.setTimeout(() => {
        document
          .querySelector(`[data-product-id="${productId}"]`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 120);

      window.setTimeout(() => {
        setHighlightedProductId(current => (current === productId ? null : current));
      }, 2600);
    }

    window.addEventListener('highlightProduct', handleHighlightProduct);
    return () => window.removeEventListener('highlightProduct', handleHighlightProduct);
  }, [setTheme]);

  return (
    <section id="catalogo" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-dots relative">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <h2 className="font-serif text-5xl md:text-6xl font-bold text-[#3f2128] mb-4 drop-shadow-sm">
          Nuestras Delicias
        </h2>
        <p className="text-[#3f2128]/55 text-base max-w-md mx-auto leading-relaxed font-medium mb-6">
          Cada pieza elaborada a mano, con ingredientes seleccionados y mucho amor.
        </p>
        <div className="w-24 h-1 bg-gradient-to-r from-[#be185d] to-[#f472b6] mx-auto rounded-full" />
      </motion.div>

      {/* Categories */}
      <div className="flex flex-wrap justify-center gap-4 mb-14">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => handleCategoryChange(category)}
            className={`px-6 py-2.5 rounded-full font-medium transition-all duration-300 border border-transparent ${activeCategory === category
              ? 'bg-[#be185d] text-white shadow-lg shadow-[#be185d]/30'
              : 'bg-white/70 text-[#3f2128] hover:bg-rose-50 hover:border-rose-200 backdrop-blur-sm'
              }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        <AnimatePresence>
          {filteredProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              index={index}
              onAdd={handleAddToCart}
              highlighted={highlightedProductId === product.id}
              onHoverStart={() => setTheme(resolveProductTheme(product.name))}
              onHoverEnd={() => setTheme(CATEGORY_THEME_MAP[activeCategory] ?? 'default')}
            />
          ))}
        </AnimatePresence>
      </motion.div>
    </section>
  );
};

export default Catalog;
