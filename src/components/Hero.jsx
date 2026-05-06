import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence, useInView } from 'framer-motion';
import { trackEvent } from '../utils/analytics';
import OptimizedImage from './OptimizedImage';
import { useTheme } from '../context/ThemeContext';

/* ══════════════════════════════════════════════════════════════
   SLIDES — Datos del carrusel
   `catalogId` corresponde al `id` del producto en Catalog.jsx.
   Al hacer clic en la card activa → scroll + highlight.
══════════════════════════════════════════════════════════════ */
const SLIDES = [
  {
    id: 0, catalogId: 1,
    src: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=85',
    label: 'Tortas Artesanales', sublabel: 'Desde $25.000',
    accent: '#ff69b4', accentDark: '#be185d',
  },
  {
    id: 1, catalogId: 2,
    src: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&q=85',
    label: 'Kuchen Tradicional', sublabel: 'Desde $14.000',
    accent: '#fb8fbd', accentDark: '#e11d72',
  },
  {
    id: 2, catalogId: 3,
    src: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800&q=85',
    label: 'Alfajores Premium', sublabel: 'Desde $12.000',
    accent: '#e879f9', accentDark: '#c026d3',
  },
  {
    id: 3, catalogId: 6,
    src: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=85',
    label: 'Postres Gourmet', sublabel: 'Desde $22.000',
    accent: '#f472b6', accentDark: '#db2777',
  },
];

const SPRING = { type: 'spring', stiffness: 280, damping: 28, mass: 0.9 };
const DRAG_THRESHOLD = 55;
const HERO_THEME_MAP = ['default', 'honey', 'berries', 'caramel'];

/* ══════════════════════════════════════════════════════════════
   SCROLL TO CATALOG PRODUCT
   Hace smooth scroll al catálogo y despacha el evento
   'highlightProduct' para que Catalog.jsx haga el highlight.
   Requiere que Catalog.jsx escuche este evento (ver Fase 3).
══════════════════════════════════════════════════════════════ */
function scrollToCatalogProduct(catalogId) {
  const catalogEl = document.getElementById('catalogo');
  if (!catalogEl) return;
  const top = catalogEl.getBoundingClientRect().top + window.scrollY - 90;
  window.scrollTo({ top, behavior: 'smooth' });
  // Delay para que el scroll avance antes del highlight
  setTimeout(() => {
    window.dispatchEvent(
      new CustomEvent('highlightProduct', { detail: { productId: catalogId } })
    );
  }, 680);
}

/* ══════════════════════════════════════════════════════════════
   DOT INDICATORS
══════════════════════════════════════════════════════════════ */
function Dots({ total, active, onSelect, accent }) {
  return (
    <div className="flex items-center gap-2.5 justify-center" role="tablist">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          role="tab"
          aria-selected={i === active}
          aria-label={`Ir al slide ${i + 1}`}
          onClick={() => onSelect(i)}
          style={{ width: 32, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <motion.span
            animate={{
              width: i === active ? 28 : 8,
              backgroundColor: i === active ? accent : 'rgba(253,164,175,0.55)',
              opacity: i === active ? 1 : 0.5,
            }}
            transition={{ ...SPRING, stiffness: 420, damping: 30 }}
            style={{ height: 8, borderRadius: 99, display: 'block' }}
          />
        </button>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   CAROUSEL CARD
   Click en card inactiva → se activa.
   Click en card activa → scroll al producto en catálogo.
══════════════════════════════════════════════════════════════ */
function CarouselCard({ slide, isActive, onActivate, onProductClick }) {
  const cardRef = useRef(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const rotateX = useSpring(useTransform(rawY, [-1, 1], [7, -7]), { stiffness: 180, damping: 18 });
  const rotateY = useSpring(useTransform(rawX, [-1, 1], [-7, 7]), { stiffness: 180, damping: 18 });
  const [pressing, setPressing] = useState(false);

  function handleMouseMove(e) {
    if (!isActive || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    rawX.set((e.clientX - rect.left - rect.width / 2) / (rect.width / 2));
    rawY.set((e.clientY - rect.top - rect.height / 2) / (rect.height / 2));
  }
  function handleMouseLeave() { rawX.set(0); rawY.set(0); }

  function handleClick() {
    if (!isActive) { onActivate(); }
    else { onProductClick(); }
  }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onMouseDown={() => setPressing(true)}
      onMouseUp={() => setPressing(false)}
      style={{
        rotateX: isActive ? rotateX : 0,
        rotateY: isActive ? rotateY : 0,
        transformStyle: 'preserve-3d',
        perspective: 900,
        cursor: 'pointer',
      }}
      animate={{
        scale: isActive ? 1 : 0.86,
        opacity: isActive ? 1 : 0.42,
        filter: isActive ? 'brightness(1)' : 'brightness(0.85) saturate(0.7)',
      }}
      whileTap={{ scale: isActive ? 0.97 : 0.88 }}
      transition={SPRING}
      className="relative h-full w-full select-none overflow-hidden rounded-[1.5rem]"
    >
      <OptimizedImage
        src={slide.src}
        alt={slide.label}
        sizes="(min-width: 768px) 48vw, 92vw"
        loading={isActive ? 'eager' : 'lazy'}
        draggable={false}
        className="w-full h-full object-cover pointer-events-none"
        style={{ transform: 'translateZ(0)' }}
      />

      {/* Gradient overlay */}
      <div
        className="absolute inset-0 rounded-[1.5rem]"
        style={{ background: 'linear-gradient(170deg, transparent 35%, rgba(0,0,0,0.52) 100%)' }}
      />

      {/* Glow ring */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            key="glow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="absolute inset-0 rounded-[1.5rem] pointer-events-none"
            style={{ boxShadow: `0 0 0 2.5px ${slide.accent}, 0 12px 56px ${slide.accent}66` }}
          />
        )}
      </AnimatePresence>

      {/* Label + CTA hint */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            key="label"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-4 left-4 right-4 flex items-end justify-between"
          >
            <div className="flex flex-col gap-1">
              <span
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full
                           text-white text-xs font-bold tracking-widest uppercase
                           backdrop-blur-md border border-white/20 w-fit"
                style={{ background: `${slide.accent}cc` }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                {slide.label}
              </span>
              <span className="text-white/75 text-xs font-semibold pl-1">{slide.sublabel}</span>
            </div>

            {/* CTA micro-botón */}
            <motion.div
              animate={{ opacity: pressing ? 0.65 : 1, scale: pressing ? 0.94 : 1 }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl
                         bg-white/20 backdrop-blur-sm border border-white/30
                         text-white text-xs font-bold"
            >
              Ver →
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hint para slides inactivos */}
      {!isActive && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white/40 text-xs font-semibold tracking-wider uppercase">Tap</span>
        </div>
      )}
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   HERO — Componente principal
   Sin fondo sólido — transparente sobre BackgroundCanvas.
══════════════════════════════════════════════════════════════ */
export default function Hero() {
  const [active, setActive] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [stackHover, setStackHover] = useState(false);
  const dragStart = useRef(0);
  const autoRef  = useRef(null);
  const sectionRef = useRef(null);
  const heroInView = useInView(sectionRef, { margin: '-20% 0px -35% 0px' });
  const { setTheme } = useTheme();

  /* ── Parallax de profundidad — mouse sobre la sección ─────────────
     El texto y el carrusel se mueven en capas opuestas:
     texto: -x, carrusel: +x → sensación de diorama 3D.
  ──────────────────────────────────────────────── */
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 45, damping: 22 });
  const smoothY = useSpring(mouseY, { stiffness: 45, damping: 22 });
  /* Texto: se mueve OPUESTO al cursor (-8px máx) */
  const textX  = useTransform(smoothX, [-0.5, 0.5], [8,  -8]);
  const textY  = useTransform(smoothY, [-0.5, 0.5], [5,  -5]);
  /* Carrusel: se mueve CON el cursor (+8px máx) */
  const slideX = useTransform(smoothX, [-0.5, 0.5], [-8,  8]);
  const slideY = useTransform(smoothY, [-0.5, 0.5], [-5,  5]);

  function handleSectionMouseMove(e) {
    if (!sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width  - 0.5);
    mouseY.set((e.clientY - rect.top)  / rect.height - 0.5);
  }
  function handleSectionMouseLeave() {
    mouseX.set(0); mouseY.set(0);
  }

  /* ── Auto-advance ─────────────────────────────────────────── */
  const resetAuto = useCallback(() => {
    clearInterval(autoRef.current);
    autoRef.current = setInterval(
      () => setActive(prev => (prev + 1) % SLIDES.length),
      4500
    );
  }, []);

  useEffect(() => {
    resetAuto();
    return () => clearInterval(autoRef.current);
  }, [resetAuto]);

  useEffect(() => {
    if (heroInView) {
      setTheme(HERO_THEME_MAP[active] ?? 'default');
    }
  }, [active, heroInView, setTheme]);

  function goTo(index) {
    setActive(index);
    resetAuto();
    trackEvent('carousel_navigate', {
      method: 'control',
      from: active, to: index,
      slide_label: SLIDES[index].label,
    });
  }

  /* ── Drag handlers ─────────────────────────────────────────── */
  function onDragStart(e) {
    setDragging(true);
    dragStart.current = e.touches ? e.touches[0].clientX : e.clientX;
  }
  function onDragEnd(e) {
    setDragging(false);
    const endX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const delta = dragStart.current - endX;
    if (Math.abs(delta) > DRAG_THRESHOLD) {
      const next = delta > 0
        ? (active + 1) % SLIDES.length
        : (active - 1 + SLIDES.length) % SLIDES.length;
      goTo(next);
      trackEvent('carousel_navigate', {
        method: 'swipe',
        direction: delta > 0 ? 'left' : 'right',
        slide_label: SLIDES[next].label,
      });
    }
  }

  /* ── Click en imagen activa → navega al producto ─────────── */
  function handleProductClick(slide) {
    trackEvent('carousel_product_click', {
      slide_id: slide.id,
      catalog_id: slide.catalogId,
      slide_label: slide.label,
      accent: slide.accent,
      timestamp: new Date().toISOString(),
    });
    scrollToCatalogProduct(slide.catalogId);
  }

  /* ── Botón "Ver Catálogo" ─────────────────────────────────── */
  function handleCatalogClick() {
    trackEvent('button_click', {
      button_id: 'ver_catalogo',
      button_label: 'Ver Catálogo',
      variant: 'gradient_primary',
      section: 'hero',
      active_slide: SLIDES[active].label,
      slide_index: active,
      timestamp: new Date().toISOString(),
    });
    const el = document.getElementById('catalogo');
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }
  const accent = SLIDES[active].accent;
  const accentDark = SLIDES[active].accentDark;

  return (
    <section
      ref={sectionRef}
      id="inicio"
      className="relative flex min-h-[calc(100vh-2rem)] items-center overflow-visible pb-12 pt-24"
      onMouseMove={handleSectionMouseMove}
      onMouseLeave={handleSectionMouseLeave}
    >
      <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-8 px-5 md:grid-cols-2 lg:gap-14 lg:px-8">

        {/* ── TEXTO — capa frontal del diorama ─────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="dm-gpu flex flex-col gap-5 md:gap-6"
          style={{ x: textX, y: textY }}
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.52 }}
            className="inline-flex w-fit items-center gap-2 rounded-full px-4 py-1.5
                       border border-pink-200/80 bg-white/55 backdrop-blur-sm"
          >
            <motion.span
              animate={{ backgroundColor: accent, boxShadow: `0 0 8px ${accent}` }}
              transition={{ duration: 0.65, ease: 'easeOut' }}
              className="h-2 w-2 shrink-0 rounded-full"
            />
            <span className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#be185d]">
              Pastelería Premium · Puerto Montt
            </span>
          </motion.div>

          {/* Headline grande y audaz */}
          <div className="leading-[0.9] flex flex-col gap-2">
            <motion.h1
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0, color: accentDark }}
              transition={{ delay: 0.26, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="font-serif text-5xl font-bold sm:text-6xl lg:text-7xl xl:text-8xl"
            >
              Momentos
            </motion.h1>
            <motion.h1
              key={accent + 'dulces'}
              initial={{ opacity: 0.5, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.34, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="font-serif text-5xl font-bold sm:text-6xl lg:text-7xl xl:text-8xl"
              style={{ color: accent }}
            >
              Dulces
            </motion.h1>
          </div>

          {/* Descripción */}
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.44, duration: 0.62 }}
            className="max-w-sm text-sm font-medium leading-relaxed text-[#3f2128]/60 md:text-base lg:text-lg"
          >
            Descubre nuestra selección de pasteles artesanales, creados con amor
            y los mejores ingredientes para tus celebraciones.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.5 }}
            className="flex flex-wrap items-center gap-4"
          >
            <motion.button
              onClick={handleCatalogClick}
              data-ab-variant="gradient_primary"
              className="btn-primary"
              style={{
                background: `linear-gradient(135deg, #be185d, ${accent})`,
                boxShadow: `0 8px 32px ${accent}50`,
                fontSize: '0.92rem',
                padding: '0.86rem 1.65rem',
              }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 380, damping: 22 }}
            >
              Ver Catálogo
            </motion.button>

            {/* Slide counter */}
            <div className="flex items-center gap-1.5 text-sm font-mono text-[#3f2128]/40">
              <motion.span
                key={active}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22 }}
                className="font-bold text-[#3f2128]/60"
              >
                0{active + 1}
              </motion.span>
              <span className="tracking-widest">/ 0{SLIDES.length}</span>
            </div>
          </motion.div>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.82, duration: 0.65 }}
            className="flex items-center gap-3"
          >
            <div className="flex -space-x-2.5">
              {['🧁', '🎂', '🍰'].map((emoji, i) => (
                <div key={i}
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-white/80 text-sm shadow-sm">
                  {emoji}
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs font-bold text-[#3f2128]/65">+200 clientes felices</p>
              <p className="text-[10px] text-[#3f2128]/40 font-medium">en Puerto Montt · ⭐ 4.9</p>
            </div>
          </motion.div>
        </motion.div>

        {/* ── CARRUSEL — capa trasera del diorama ───────────────── */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
          className="dm-gpu relative flex flex-col items-center gap-5"
          style={{ x: slideX, y: slideY }}
        >
          {/* Superficie de drag + Magnetic Stack hover */}
          <div
            className="relative w-full"
            style={{ height: 460, cursor: dragging ? 'grabbing' : 'grab' }}
            onMouseDown={onDragStart}
            onMouseUp={onDragEnd}
            onTouchStart={onDragStart}
            onTouchEnd={onDragEnd}
            onMouseEnter={() => setStackHover(true)}
            onMouseLeave={() => setStackHover(false)}
          >
            {/* Stacked cards — Magnetic Stack Effect */}
            <div className="relative w-full h-full" style={{ perspective: 1100 }}>
              {SLIDES.map((slide, i) => {
                const offset = i - active;
                if (Math.abs(offset) > 1) return null;
                /* Stack displacement al hover: la card de fondo se
                   asoma desde su lado revelando profundidad */
                const stackX = stackHover && offset !== 0
                  ? `${offset * 18}%`
                  : `${offset * 10}%`;
                const stackRotate = stackHover && offset !== 0
                  ? offset * 5
                  : 0;
                const stackScale = stackHover && offset !== 0
                  ? 0.91
                  : offset === 0 ? 1 : 0.86;
                return (
                  <motion.div
                    key={slide.id}
                    animate={{
                      x: stackX,
                      rotate: stackRotate,
                      scale: stackScale,
                      opacity: offset === 0 ? 1 : stackHover ? 0.65 : 0.42,
                      zIndex: offset === 0 ? 10 : 5,
                    }}
                    transition={{ ...SPRING, rotate: { type: 'spring', stiffness: 180, damping: 22 } }}
                    className="absolute inset-0"
                    style={{ willChange: 'transform', transformOrigin: offset < 0 ? 'right center' : 'left center' }}
                  >
                    <CarouselCard
                      slide={slide}
                      isActive={offset === 0}
                      onActivate={() => { setActive(i); resetAuto(); }}
                      onProductClick={() => handleProductClick(slide)}
                    />
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* ── CONTROLES — con gap generoso para evitar colisión ── */}
          <div className="flex w-full flex-col items-center gap-3.5">
            {/* Swipe hint — separado de los dots por gap-5 */}
            <motion.p
              animate={{ opacity: dragging ? 0 : 0.42 }}
              transition={{ duration: 0.2 }}
              className="text-[10px] tracking-[0.22em] text-[#be185d]/50 uppercase font-bold"
            >
              ← Desliza para explorar →
            </motion.p>

            {/* Dots — bien separados del hint */}
            <Dots total={SLIDES.length} active={active} onSelect={goTo} accent={accent} />

            {/* Arrows */}
            <div className="flex gap-2.5">
              {[{ arrow: '←', dir: -1, label: 'Anterior' }, { arrow: '→', dir: 1, label: 'Siguiente' }]
                .map(({ arrow, dir, label }) => (
                  <motion.button
                    key={arrow}
                    aria-label={label}
                    onClick={() => goTo((active + dir + SLIDES.length) % SLIDES.length)}
                    className="h-10 w-10 rounded-xl border border-pink-200/80
                               bg-white/65 backdrop-blur-sm text-[#be185d] font-bold
                               hover:bg-pink-50/90 hover:border-pink-300
                               hover:shadow-[0_0_18px_rgba(244,114,182,0.28)]
                               transition-colors duration-200"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >
                    {arrow}
                  </motion.button>
                ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
