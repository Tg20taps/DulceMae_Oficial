import React, { Suspense, lazy, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';
import Header from './components/Header';
import Hero from './components/Hero';
import FloatingCart from './components/FloatingCart';
import Footer from './components/Footer';
import GlazePreloader from './components/GlazePreloader';
import SectionWrapper from './components/SectionWrapper';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { trackEvent } from './utils/analytics';

const About = lazy(() => import('./components/About'));
const Catalog = lazy(() => import('./components/Catalog'));
const Location = lazy(() => import('./components/Location'));
const CartModal = lazy(() => import('./components/CartModal'));
const AdminShell = lazy(() => import('./components/admin/AdminShell'));

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

function AdminErrorFallback({ error }) {
  const errorMessage = error?.message || '';

  return (
    <main className="min-h-screen bg-[#fff7fb] px-4 py-10 text-[#321b24]">
      <section className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col justify-center rounded-[2rem] border border-pink-100 bg-white/84 p-7 shadow-[0_24px_80px_rgba(190,24,93,0.14)]">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#be185d]/60">Panel privado</p>
        <h1 className="mt-3 font-serif text-3xl font-bold text-[#3f2128]">No pudimos abrir el panel</h1>
        <p className="mt-3 text-sm font-medium leading-7 text-[#3f2128]/62">
          Puede pasar si acabamos de publicar cambios y el navegador quedo con archivos antiguos. Recarga el
          panel para traer la version nueva.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-7 rounded-2xl bg-[#3f2128] px-5 py-4 text-sm font-extrabold text-white shadow-[0_18px_50px_rgba(63,33,40,0.22)] transition hover:bg-[#2c171d]"
        >
          Recargar panel
        </button>
        {errorMessage && (
          <p className="mt-4 rounded-2xl border border-pink-100 bg-[#fff7fb] px-4 py-3 text-xs font-semibold leading-5 text-[#3f2128]/56">
            Detalle tecnico: {errorMessage}
          </p>
        )}
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-[#be185d]/70">
          Si sigue pasando, revisar:
        </p>
        <div className="mt-3 grid gap-3 text-xs font-bold text-[#be185d]">
          <code className="rounded-2xl border border-pink-100 bg-[#fff7fb] px-4 py-3">VITE_SUPABASE_URL</code>
          <code className="rounded-2xl border border-pink-100 bg-[#fff7fb] px-4 py-3">VITE_SUPABASE_ANON_KEY</code>
          <code className="rounded-2xl border border-pink-100 bg-[#fff7fb] px-4 py-3">VITE_ADMIN_ALLOWED_EMAILS</code>
        </div>
      </section>
    </main>
  );
}

class AdminErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error) {
    console.error('DulceMae admin failed to load', error);
  }

  render() {
    if (this.state.hasError) return <AdminErrorFallback error={this.state.error} />;
    return this.props.children;
  }
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
    let frameId = 0;

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
        frameId = window.requestAnimationFrame(updateTheme);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    updateTheme();
    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
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
      {!preloading && (
        <>
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

      <Suspense fallback={null}>
        <CartModal />
      </Suspense>
      <FloatingCart />

      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ y: -18, opacity: 0, scale: 0.96, x: '-50%' }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -12, opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', bounce: 0.35, duration: 0.45 }}
            className="fixed left-1/2 top-24 z-[240] flex w-[calc(100%-2rem)] max-w-sm items-center gap-3 rounded-2xl border border-white/70 px-4 py-3.5 shadow-[0_18px_60px_rgba(190,24,93,0.20)] backdrop-blur-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.94), rgba(255,241,248,0.88))',
              color: '#3f2128',
            }}
          >
            <span className="rounded-full bg-[#be185d]/10 p-1.5">
              <Check className="h-4 w-4 text-[#be185d]" strokeWidth={3} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold tracking-wide text-[#3f2128]">Añadido al carrito</p>
              <p className="mt-0.5 text-xs font-semibold text-[#3f2128]/50">Tu selección quedó guardada.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
        </>
      )}
    </>
  );
}

export default function App() {
  const isAdminRoute = window.location.pathname.startsWith('/admin');

  return (
    <ThemeProvider>
      {isAdminRoute ? (
        <AdminErrorBoundary>
          <Suspense fallback={<SectionFallback />}>
            <AdminShell />
          </Suspense>
        </AdminErrorBoundary>
      ) : (
        <AppInterior />
      )}
    </ThemeProvider>
  );
}
