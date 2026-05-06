import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ══════════════════════════════════════════════════════════════
   GlazePreloader — "El Telón de Azúcar"

   DECISIÓN DE DIRECTOR DE ARTE:
   El glaseado rosa cae en 5 "cortinas" desfasadas que cubren
   la pantalla de abajo→arriba como frosting cayendo sobre un
   pastel. Se retiran como un telón de teatro, revelando la
   página con un whoosh.

   • Solo aparece la primera vez (sessionStorage flag).
   • 5 columnas SVG con paths orgánicos y timing desfasado.
   • Cero JavaScript pesado — todo CSS transforms + Framer.
   • Al terminar dispara onComplete para unmount.
══════════════════════════════════════════════════════════════ */

/* Paths SVG para el borde superior de cada cortina.
   Formas irregulares que simulan glaseado fluyendo. */
const DRIP_PATHS = [
  "M0,0 L200,0 C180,20 160,8 140,24 C120,40 110,16 90,28 C70,40 60,12 40,22 C20,32 10,8 0,18 Z",
  "M0,0 L200,0 C190,14 175,28 155,18 C135,8 120,32 100,22 C80,12 65,30 45,20 C25,10 12,26 0,14 Z",
  "M0,0 L200,0 C185,22 168,10 148,26 C128,42 112,14 92,24 C72,34 58,8 38,18 C18,28 8,10 0,20 Z",
  "M0,0 L200,0 C192,18 176,6 156,22 C136,38 118,12 98,28 C78,44 62,16 42,26 C22,36 10,14 0,24 Z",
  "M0,0 L200,0 C188,26 170,12 150,28 C130,44 115,18 95,30 C75,42 60,10 40,24 C20,38 8,16 0,28 Z",
];

/* Colores de cada cortina — gradiente de marcas */
const CURTAIN_COLORS = [
  { from: '#fce7f3', to: '#f9a8d4' },
  { from: '#fdf2f8', to: '#f472b6' },
  { from: '#fce7f3', to: '#e879a0' },
  { from: '#fdf2f8', to: '#be185d' },
  { from: '#fff1f5', to: '#f9a8d4' },
];

function GlazeCurtain({ index, onDone }) {
  const delay  = index * 0.055;
  const width  = `${100 / 5}%`;
  const left   = `${(index / 5) * 100}%`;
  const path   = DRIP_PATHS[index];
  const colors = CURTAIN_COLORS[index];

  return (
    <motion.div
      style={{
        position: 'fixed',
        top: 0, bottom: 0,
        left, width,
        zIndex: 9999,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
      /* ENTRADA: cae desde arriba (translateY -100% → 0) */
      initial={{ y: '-100%' }}
      animate={{ y: 0 }}
      transition={{ duration: 0.55, delay, ease: [0.76, 0, 0.24, 1] }}
    >
      {/* Fondo sólido de la cortina */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(180deg, ${colors.from} 0%, ${colors.to} 100%)`,
        }}
      />

      {/* Borde inferior orgánico — simula glaseado */}
      <svg
        viewBox="0 0 200 44"
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          bottom: -1,
          left: 0,
          width: '100%',
          height: 44,
        }}
      >
        <defs>
          <linearGradient id={`drip-grad-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor={colors.to}   stopOpacity="1" />
            <stop offset="100%" stopColor={colors.from}  stopOpacity="0.6" />
          </linearGradient>
        </defs>
        <path d={path} fill={`url(#drip-grad-${index})`} />
      </svg>
    </motion.div>
  );
}

function GlazeLogo() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.82, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -18 }}
      transition={{ delay: 0.38, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        gap: 12,
      }}
    >
      <span
        style={{
          fontFamily: 'Georgia, serif',
          fontSize: 'clamp(2.8rem, 7vw, 5rem)',
          fontWeight: 800,
          color: '#be185d',
          letterSpacing: '-0.01em',
          lineHeight: 1,
          textShadow: '0 2px 32px rgba(190,24,93,0.22)',
        }}
      >
        DulceMae
      </span>
      <span
        style={{
          fontSize: '0.72rem',
          fontWeight: 700,
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
          color: '#be185d',
          opacity: 0.6,
        }}
      >
        Pastelería Artesanal · Puerto Montt
      </span>

      {/* Animación de puntos de carga */}
      <div style={{ display: 'flex', gap: 6, marginTop: 16 }}>
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            animate={{ y: [0, -8, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.8, delay: i * 0.18, repeat: 2, ease: 'easeInOut' }}
            style={{
              width: 7, height: 7,
              borderRadius: '50%',
              background: '#be185d',
              opacity: 0.4,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

export default function GlazePreloader({ onComplete }) {
  const TOTAL_DURATION = 1900; // ms antes de salida

  useEffect(() => {
    const t = setTimeout(onComplete, TOTAL_DURATION);
    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <>
      {/* 5 Cortinas de glaseado */}
      {CURTAIN_COLORS.map((_, i) => (
        <GlazeCurtain key={i} index={i} />
      ))}

      {/* Logo centrado sobre las cortinas */}
      <GlazeLogo />
    </>
  );
}
