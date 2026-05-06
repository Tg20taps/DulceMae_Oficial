import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Cake, Menu, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { trackEvent } from '../utils/analytics';

const NAV_LINKS = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Sobre Nosotros', href: '#nosotros' },
  { label: 'Catalogo', href: '#catalogo' },
  { label: 'Encuentranos', href: '#ubicacion' },
];

function scrollTo(href) {
  const el = document.getElementById(href.replace('#', ''));
  if (!el) return window.scrollTo({ top: 0, behavior: 'smooth' });
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 84, behavior: 'smooth' });
}

export default function Header() {
  const { currentTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeLink, setActiveLink] = useState('#inicio');
  const accent = currentTheme.accent ?? '#be185d';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    let ticking = false;

    const updateActive = () => {
      ticking = false;
      const probe = window.innerHeight * 0.36;
      let next = '#inicio';

      for (const { href } of NAV_LINKS) {
        const id = href.replace('#', '');
        const el = document.querySelector(`main > [id="${id}"]`);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= probe && rect.bottom > probe) {
          next = href;
          break;
        }
      }

      setActiveLink(next);
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateActive);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    updateActive();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  function handleNav(href) {
    trackEvent('nav_click', { target: href, source: menuOpen ? 'mobile_menu' : 'desktop_nav' });
    setMenuOpen(false);
    window.setTimeout(() => scrollTo(href), menuOpen ? 260 : 0);
  }

  return (
    <>
      <motion.header
        className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center pt-5"
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.nav
          animate={{
            background: scrolled ? 'rgba(255,255,255,0.93)' : 'rgba(255,255,255,0.80)',
            boxShadow: scrolled ? `0 18px 48px ${accent}24` : `0 8px 28px ${accent}10`,
            borderColor: scrolled ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.78)',
          }}
          className="pointer-events-auto relative mx-5 flex w-full max-w-6xl items-center justify-between gap-4 rounded-[1.35rem] border px-5 py-3 backdrop-blur-2xl md:px-6"
        >
          <div
            className="pointer-events-none absolute inset-0 rounded-[1.35rem]"
            style={{
              background: `radial-gradient(circle at 14% 50%, ${accent}10, transparent 32%), radial-gradient(circle at 86% 50%, ${accent}12, transparent 34%)`,
            }}
          />

          <motion.button
            onClick={() => handleNav('#inicio')}
            className="relative z-10 flex shrink-0 items-center gap-2.5"
            aria-label="DulceMae - Ir al inicio"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <span
              className="flex h-10 w-10 items-center justify-center rounded-2xl shadow-[0_10px_28px_rgba(190,24,93,0.20)]"
              style={{ background: `linear-gradient(135deg, #f472b6, ${accent})` }}
            >
              <Cake className="h-5 w-5 text-white" strokeWidth={1.8} />
            </span>
            <span className="select-none font-serif text-xl font-bold leading-none tracking-tight text-[#3f2128]">
              Dulce<span style={{ color: accent }}>Mae</span>
            </span>
          </motion.button>

          <ul className="relative z-10 hidden items-center gap-1.5 rounded-[1.15rem] border border-pink-100/60 bg-white/42 p-1.5 md:flex">
            {NAV_LINKS.map(({ label, href }) => {
              const active = activeLink === href;
              return (
                <li key={href}>
                  <button
                    onClick={() => handleNav(href)}
                    className="relative min-w-[6.5rem] overflow-hidden rounded-[0.95rem] px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-white/70"
                    style={{ color: active ? accent : 'rgba(63,33,40,0.72)' }}
                  >
                    {active && (
                      <motion.span
                        layoutId="active-nav-pill"
                        className="absolute inset-0 rounded-[0.95rem] border bg-white/84 shadow-[0_10px_26px_rgba(190,24,93,0.10)]"
                        style={{ borderColor: `${accent}2e` }}
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    )}
                    <span className="relative z-10">{label}</span>
                    {active && (
                      <motion.span
                        layoutId="active-nav-dot"
                        className="absolute bottom-1.5 left-1/2 z-10 h-1 w-1 -translate-x-1/2 rounded-full"
                        style={{ background: accent, boxShadow: `0 0 12px ${accent}` }}
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          <motion.button
            onClick={() => setMenuOpen(true)}
            className="relative z-10 flex h-10 w-10 items-center justify-center rounded-xl border border-pink-200/80 bg-white/70 text-[#be185d] transition-colors hover:bg-pink-50 md:hidden"
            aria-label="Abrir menu"
            whileTap={{ scale: 0.92 }}
          >
            <Menu className="h-5 w-5" />
          </motion.button>
        </motion.nav>
      </motion.header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-[200] flex flex-col"
            initial={{ opacity: 0, scale: 1.03, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.02, filter: 'blur(8px)' }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{
              background: 'rgba(255,242,250,0.92)',
              backdropFilter: 'blur(36px) saturate(190%)',
              WebkitBackdropFilter: 'blur(36px) saturate(190%)',
            }}
          >
            <div className="flex items-center justify-between border-b border-pink-200/50 px-6 pb-5 pt-6">
              <span className="font-serif text-2xl font-bold text-[#3f2128]">
                Dulce<span style={{ color: accent }}>Mae</span>
              </span>
              <motion.button
                onClick={() => setMenuOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-pink-200 bg-white/70 text-[#be185d]"
                aria-label="Cerrar menu"
                whileTap={{ scale: 0.9 }}
              >
                <X className="h-5 w-5" />
              </motion.button>
            </div>

            <motion.ul
              className="flex flex-1 flex-col justify-center gap-3 px-6"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
            >
              {NAV_LINKS.map(({ label, href }, index) => (
                <motion.li
                  key={href}
                  variants={{
                    hidden: { opacity: 0, y: 24 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.36 } },
                  }}
                >
                  <button
                    onClick={() => handleNav(href)}
                    className={`flex w-full items-center gap-5 rounded-2xl border px-6 py-5 text-left transition ${
                      activeLink === href
                        ? 'border-pink-300/70 bg-white/82 shadow-[0_4px_24px_rgba(190,24,93,0.12)]'
                        : 'border-white/60 bg-white/42'
                    }`}
                  >
                    <span className="w-7 shrink-0 font-mono text-xs font-bold tracking-widest text-pink-400/60">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="font-serif text-2xl font-bold" style={{ color: activeLink === href ? accent : '#3f2128' }}>
                      {label}
                    </span>
                  </button>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
