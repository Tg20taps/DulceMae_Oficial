import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Instagram, MessageCircle, Plus, RefreshCw, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCatalog } from '../context/CatalogContext';
import { trackEvent } from '../utils/analytics';
import { useTheme, CATEGORY_THEME_MAP, resolveProductTheme } from '../context/ThemeContext';
import { NEGOCIO, enlaceWhatsApp } from '../config/negocio';
import ProductImage from './ProductImage';

const fmt = (n) => `$${Number(n || 0).toLocaleString('es-CL')}`;

function priceLabel(product) {
  return product.options.length > 1 ? `Desde ${fmt(product.price)}` : fmt(product.price);
}

function ProductCard({ product, index, onOpen, onAdd, highlighted, onHoverStart, onHoverEnd }) {
  const hasOptions = product.options.length > 0;

  return (
    <motion.article
      data-product-id={product.id}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px 15% 0px' }}
      transition={{ duration: 0.4, delay: Math.min(index, 6) * 0.04 }}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      style={{ scrollMarginTop: 112 }}
      className={`group flex flex-col overflow-hidden rounded-3xl border bg-white/90 shadow-[0_6px_24px_rgba(190,24,93,0.08)] transition-shadow hover:shadow-[0_18px_48px_rgba(190,24,93,0.16)] ${
        highlighted ? 'border-[#be185d] ring-4 ring-[#be185d]/15' : 'border-white/60'
      }`}
    >
      <button
        type="button"
        onClick={() => onOpen(product)}
        className="relative block aspect-square w-full overflow-hidden"
        aria-label={`Ver ${product.name}`}
      >
        <ProductImage
          product={product}
          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
          loading={index < 4 ? 'eager' : 'lazy'}
          fetchpriority={index < 2 ? 'high' : 'auto'}
          className="transition-transform duration-500 group-hover:scale-105"
        />
        {!product.available && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/55 backdrop-blur-[2px]">
            <span className="rounded-full bg-[#3f2128] px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">Agotado</span>
          </span>
        )}
      </button>

      <div className="flex flex-1 flex-col p-3 sm:p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#be185d]/70 sm:text-xs">{product.category}</p>
        <button type="button" onClick={() => onOpen(product)} className="mt-1 text-left">
          <h3 className="line-clamp-2 font-serif text-base font-bold leading-snug text-[#3f2128] sm:text-xl">{product.name}</h3>
        </button>
        {product.description && (
          <p className="mt-1 line-clamp-2 hidden text-sm text-[#3f2128]/60 sm:block">{product.description}</p>
        )}
        <p className="mt-2 text-sm font-bold text-[#3f2128] sm:text-lg">{priceLabel(product)}</p>

        <div className="mt-auto pt-3">
          {product.available ? (
            <button
              type="button"
              onClick={() => (hasOptions ? onOpen(product) : onAdd(product))}
              data-add-to-cart={product.id}
              className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-2xl bg-[#be185d] px-3 text-sm font-bold text-white shadow-md shadow-[#be185d]/25 transition-colors hover:bg-[#9f1239]"
            >
              {!hasOptions && <Plus className="h-4 w-4" strokeWidth={3} />}
              {hasOptions ? 'Elegir tamaño' : 'Agregar'}
            </button>
          ) : (
            <span className="flex min-h-[44px] w-full items-center justify-center rounded-2xl bg-[#3f2128]/8 px-3 text-sm font-bold text-[#3f2128]/50">
              Agotado por ahora
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
}

// Ficha en hoja inferior: descripción completa y, si tiene, la elección de tamaño.
function ProductSheet({ product, onClose, onAdd }) {
  const hasOptions = product.options.length > 0;

  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[240] flex items-end justify-center bg-[#2b1620]/45 sm:items-center" onClick={onClose}>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        onClick={(event) => event.stopPropagation()}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] bg-white shadow-2xl sm:rounded-[2rem]"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <ProductImage product={product} sizes="(min-width: 640px) 512px, 100vw" loading="eager" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-[#3f2128] shadow-md"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5 pb-8">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#be185d]/70">{product.category}</p>
          <h3 className="mt-1 font-serif text-2xl font-bold text-[#3f2128]">{product.name}</h3>
          {product.description && (
            <p className="mt-2 text-sm leading-relaxed text-[#3f2128]/70">{product.description}</p>
          )}

          {!product.available ? (
            <p className="mt-5 rounded-2xl bg-[#3f2128]/6 px-4 py-3 text-center text-sm font-bold text-[#3f2128]/60">
              Agotado por ahora. Escríbenos si lo necesitas para más adelante.
            </p>
          ) : hasOptions ? (
            <div className="mt-5">
              <p className="mb-2 text-sm font-bold text-[#3f2128]">Elige el tamaño</p>
              <div className="grid gap-2">
                {product.options.map(option => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => onAdd(product, option)}
                    className="flex min-h-[56px] items-center justify-between gap-3 rounded-2xl border-2 border-pink-100 bg-[#fff7fb] px-4 py-3 text-left transition hover:border-[#be185d]/50"
                  >
                    <span className="font-bold text-[#3f2128]">{option.label}</span>
                    <span className="flex items-center gap-2 font-bold text-[#be185d]">
                      {fmt(option.price)}
                      <Plus className="h-5 w-5" strokeWidth={3} />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onAdd(product)}
              className="mt-5 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#be185d] px-4 text-base font-bold text-white shadow-lg shadow-[#be185d]/25"
            >
              <Plus className="h-5 w-5" strokeWidth={3} />
              Agregar · {fmt(product.price)}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function CatalogMessage({ title, detail, children }) {
  return (
    <div className="mx-auto max-w-lg rounded-3xl border border-white/60 bg-white/80 p-6 text-center shadow-[0_10px_40px_rgba(190,24,93,0.10)] backdrop-blur">
      <h3 className="font-serif text-2xl font-bold text-[#3f2128]">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[#3f2128]/65">{detail}</p>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">{children}</div>
    </div>
  );
}

function WhatsAppButton({ text }) {
  return (
    <a
      href={enlaceWhatsApp(text)}
      target="_blank"
      rel="noreferrer"
      className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-[#16a34a] px-5 text-sm font-bold text-white shadow-md"
    >
      <MessageCircle className="h-5 w-5" />
      Pedir por WhatsApp
    </a>
  );
}

function CatalogSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4" aria-label="Cargando catálogo">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-3xl border border-white/60 bg-white/70">
          <div className="aspect-square animate-pulse bg-pink-100/70" />
          <div className="space-y-2 p-4">
            <div className="h-3 w-1/3 animate-pulse rounded bg-pink-100" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-pink-100" />
            <div className="h-10 animate-pulse rounded-2xl bg-pink-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

const Catalog = () => {
  const { status, products, categories, reload } = useCatalog();
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [highlightedProductId, setHighlightedProductId] = useState(null);
  const [openProduct, setOpenProduct] = useState(null);
  const { addToCart, openCart } = useCart();
  const { setTheme } = useTheme();

  const filteredProducts = activeCategory === 'Todos'
    ? products
    : products.filter(p => p.category === activeCategory);

  useEffect(() => {
    if (activeCategory !== 'Todos' && !categories.includes(activeCategory)) setActiveCategory('Todos');
  }, [activeCategory, categories]);

  function handleCategoryChange(category) {
    setActiveCategory(category);
    setTheme(CATEGORY_THEME_MAP[category] ?? 'default');
    trackEvent('catalog_filter', {
      category,
      result_count: category === 'Todos' ? products.length : products.filter(p => p.category === category).length,
    });
  }

  function handleOpenProduct(product) {
    setOpenProduct(product);
    trackEvent('product_open', { product_id: product.id, product_name: product.name });
  }

  function handleAddToCart(product, option = null) {
    addToCart(product, option);
    setOpenProduct(null);
    openCart();
    trackEvent('add_to_cart', {
      product_id: product.id,
      product_name: product.name,
      option_label: option?.label ?? null,
      category: product.category,
      price_clp: option ? option.price : product.price,
    });
  }

  useEffect(() => {
    function handleHighlightProduct(event) {
      const productId = event.detail?.productId;
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
  }, [products, setTheme]);

  let content;
  if (status === 'loading' && !products.length) {
    content = <CatalogSkeleton />;
  } else if (status === 'error' && !products.length) {
    content = (
      <CatalogMessage
        title="No pudimos cargar el catálogo"
        detail="Puede ser la conexión. Vuelve a intentar o haz tu pedido directo por WhatsApp."
      >
        <button
          type="button"
          onClick={reload}
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-pink-200 bg-white px-5 text-sm font-bold text-[#3f2128]"
        >
          <RefreshCw className="h-4 w-4" />
          Reintentar
        </button>
        <WhatsAppButton text={`Hola ${NEGOCIO.nombre}, quiero hacer un pedido.`} />
      </CatalogMessage>
    );
  } else if (!products.length) {
    content = (
      <CatalogMessage
        title="Muy pronto, nuestro catálogo"
        detail="Estamos subiendo nuestros productos. Mientras tanto, mira lo que hacemos en Instagram y pídenos por WhatsApp."
      >
        <a
          href={NEGOCIO.instagram}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-pink-200 bg-white px-5 text-sm font-bold text-[#3f2128]"
        >
          <Instagram className="h-5 w-5 text-[#be185d]" />
          {NEGOCIO.instagramUsuario}
        </a>
        <WhatsAppButton text={`Hola ${NEGOCIO.nombre}, quiero hacer un pedido.`} />
      </CatalogMessage>
    );
  } else {
    content = (
      <>
        {categories.length > 1 && (
          <div className="-mx-4 mb-6 overflow-x-auto px-4 pb-2 sm:mx-0 sm:mb-10 sm:px-0">
            <div className="flex w-max gap-2 sm:mx-auto sm:flex-wrap sm:justify-center sm:gap-3">
              {['Todos', ...categories].map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => handleCategoryChange(category)}
                  className={`min-h-[44px] whitespace-nowrap rounded-full px-5 text-sm font-semibold transition-all ${
                    activeCategory === category
                      ? 'bg-[#be185d] text-white shadow-lg shadow-[#be185d]/30'
                      : 'bg-white/80 text-[#3f2128] hover:bg-rose-50'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {filteredProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              index={index}
              onOpen={handleOpenProduct}
              onAdd={handleAddToCart}
              highlighted={highlightedProductId === product.id}
              onHoverStart={() => setTheme(resolveProductTheme(product.name))}
              onHoverEnd={() => setTheme(CATEGORY_THEME_MAP[activeCategory] ?? 'default')}
            />
          ))}
        </div>
      </>
    );
  }

  return (
    <section className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <div className="mb-8 text-center sm:mb-12">
        <h2 className="mb-3 font-serif text-4xl font-bold text-[#3f2128] drop-shadow-sm md:text-6xl">
          Nuestro catálogo
        </h2>
        <p className="mx-auto max-w-md text-sm font-medium leading-relaxed text-[#3f2128]/60 sm:text-base">
          Elige, agrega al carro y envía tu pedido por WhatsApp. Pedidos con {NEGOCIO.anticipacionDias * 24} horas de anticipación.
        </p>
      </div>

      {content}

      <AnimatePresence>
        {openProduct && (
          <ProductSheet product={openProduct} onClose={() => setOpenProduct(null)} onAdd={handleAddToCart} />
        )}
      </AnimatePresence>
    </section>
  );
};

export default Catalog;
