import React, { Suspense, lazy, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';
import Header from './components/Header';
import Hero from './components/Hero';
import CartModal from './components/CartModal';
import FloatingCart from './components/FloatingCart';
import Footer from './components/Footer';
import GlazePreloader from './components/GlazePreloader';
import SectionWrapper from './components/SectionWrapper';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { trackEvent } from './utils/analytics';

const About = lazy(() => import('./components/About'));
const Catalog = lazy(() => import('./components/Catalog'));
const Location = lazy(() => import('./components/Location'));

function BackgroundCanvas() {
  const { currentTheme } = useTheme();

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      <motion.div
        className="absolute inset-0"
        animate={{ background: currentTheme.bgBase }}
        transition={{ duration: 0.85, ease: 'easeInOut' }}
      />

      <motion.div
        className="absolute inset-0"
        animate={{
          background: `
            radial-gradient(circle at 15% 22%, ${currentTheme.blobA} 0%, transparent 32%),
            radial-gradient(circle at 86% 28%, ${currentTheme.blobB} 0%, transparent 34%),
            radial-gradient(circle at 50% 78%, ${currentTheme.blobD} 0%, transparent 38%)
          `,
        }}
        transition={{ duration: 0.9, ease: 'easeInOut' }}
        style={{
          filter: 'saturate(1.08)',
          opacity: 0.72,
        }}
      />

      <div className="absolute inset-0 dm-pattern-veil">
        <motion.div
          className="absolute inset-0 dm-pastry-pattern"
          animate={{ backgroundColor: currentTheme.accent }}
          transition={{ duration: 0.85, ease: 'easeInOut' }}
        />
      </div>

      <motion.div
        className="absolute inset-0"
        animate={{
          background: `
            linear-gradient(180deg, rgba(255,255,255,0.34), rgba(255,255,255,0.10) 42%, rgba(255,246,251,0.36)),
            radial-gradient(circle, ${currentTheme.accentLight} 1px, transparent 1px)
          `,
        }}
        transition={{ duration: 0.9, ease: 'easeInOut' }}
        style={{ backgroundSize: 'auto, 28px 28px' }}
      />
    </div>
  );
}

function SectionFallback() {
  return (
    <div className="flex min-h-[18rem] items-center justify-center">
      <div className="h-2 w-28 overflow-hidden rounded-full bg-white/50">
        <motion.div
          className="h-full rounded-full bg-[#be185d]"
          animate={{ x: ['-100%', '120%'] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </div>
  );
}

function AppInterior() {
  const [showToast, setShowToast] = useState(false);
  const [preloading, setPreloading] = useState(() => !sessionStorage.getItem('dm_visited'));
  const { setTheme } = useTheme();

  useEffect(() => {
    const handleItemAdded = () => {
      setShowToast(true);
      window.setTimeout(() => setShowToast(false), 2600);
    };

    window.addEventListener('itemAdded', handleItemAdded);
    trackEvent('page_view', { page_title: document.title });
    return () => window.removeEventListener('itemAdded', handleItemAdded);
  }, []);

  useEffect(() => {
    const sectionThemes = [
      ['inicio', 'default'],
      ['nosotros', 'redVelvet'],
      ['catalogo', 'berries'],
      ['ubicacion', 'honey'],
      ['footer', 'caramel'],
    ];
    let ticking = false;

    const updateTheme = () => {
      ticking = false;
      const probe = window.innerHeight * 0.38;
      let activeTheme = 'default';

      for (const [id, theme] of sectionThemes) {
        const el = id === 'footer' ? document.getElementById(id) : document.querySelector(`main > [id="${id}"]`);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= probe && rect.bottom > probe) {
          activeTheme = theme;
          break;
        }
      }

      setTheme(activeTheme);
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateTheme);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    updateTheme();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [setTheme]);

  function handlePreloaderDone() {
    sessionStorage.setItem('dm_visited', '1');
    setPreloading(false);
  }

  return (
    <>
      <AnimatePresence>{preloading && <GlazePreloader onComplete={handlePreloaderDone} />}</AnimatePresence>
      <BackgroundCanvas />

      <div className="relative z-[1] flex min-h-screen flex-col overflow-x-hidden">
        <Header />

        <main className="flex-grow">
          <SectionWrapper id="inicio">
            <Hero />
          </SectionWrapper>

          <SectionWrapper id="nosotros" delay={0.05}>
            <Suspense fallback={<SectionFallback />}>
              <About />
            </Suspense>
          </SectionWrapper>

          <SectionWrapper id="catalogo" delay={0.05}>
            <Suspense fallback={<SectionFallback />}>
              <Catalog />
            </Suspense>
          </SectionWrapper>

          <SectionWrapper id="ubicacion" delay={0.05}>
            <Suspense fallback={<SectionFallback />}>
              <Location />
            </Suspense>
          </SectionWrapper>
        </main>

        <Footer />
      </div>

      <CartModal />
      <FloatingCart />

      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ y: 60, opacity: 0, scale: 0.92 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 18, opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', bounce: 0.35, duration: 0.45 }}
            className="fixed bottom-28 right-6 z-[240] flex items-center gap-3 rounded-2xl border border-white/35 px-5 py-4 shadow-2xl md:right-10"
            style={{ background: 'linear-gradient(135deg, #be185d, #e11d72)' }}
          >
            <span className="rounded-full bg-white/22 p-1.5">
              <Check className="h-4 w-4 text-white" strokeWidth={3} />
            </span>
            <div>
              <p className="text-sm font-bold tracking-wide text-white">Anadido al carrito</p>
              <p className="mt-0.5 text-xs text-white/72">Tu pedido queda guardado.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInterior />
    </ThemeProvider>
  );
}
