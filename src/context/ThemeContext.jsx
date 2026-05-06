import React, { createContext, useState, useContext, useCallback, useEffect, useMemo } from 'react';

/* ══════════════════════════════════════════════════════════════
   ThemeContext — Sistema de Colores Atmosférico Global
   
   Cada "tema" define:
   • bgBase      → gradiente base del BackgroundCanvas
   • blob[A-D]   → colores de los 4 blobs principales
   • accent      → color de acentos (botones, hovers, separadores)
   • accentLight → versión translúcida del acento
   
   Filosofía: todo el site "respira" en armonía con la imagen
   activa del carrusel o la sección visible.
══════════════════════════════════════════════════════════════ */

export const THEMES = {
  /* ── Default: Rosa DulceMae clásico ─────────────────────── */
  default: {
    id: 'default',
    bgBase: 'linear-gradient(150deg, #fff1f8 0%, #ffb8dc 44%, #fff7fc 100%)',
    blobA: 'rgba(236,72,153,0.62)',
    blobB: 'rgba(255,145,195,0.70)',
    blobC: 'rgba(255,232,244,0.82)',
    blobD: 'rgba(219,39,119,0.54)',
    accent: '#d61f69',
    accentLight: 'rgba(214,31,105,0.17)',
    particleColor: '#f9d4e8',
    shimmer: 'rgba(253,224,138,0.7)',
    label: 'Rosa DulceMae',
  },

  /* ── Chocolate: cacao profundo + ámbar ──────────────────── */
  chocolate: {
    id: 'chocolate',
    bgBase: 'linear-gradient(150deg, #fff1f4 0%, #ffc1d1 38%, #ead7ca 100%)',
    blobA: 'rgba(136,19,55,0.46)',
    blobB: 'rgba(180,83,9,0.36)',
    blobC: 'rgba(120,38,57,0.28)',
    blobD: 'rgba(255,181,205,0.58)',
    accent: '#9f1239',
    accentLight: 'rgba(159,18,57,0.18)',
    particleColor: '#f9a8d4',
    shimmer: 'rgba(255,182,213,0.78)',
    label: 'Chocolate Ámbar',
  },

  /* ── Red Velvet: carmesí y crema ────────────────────────── */
  redVelvet: {
    id: 'redVelvet',
    bgBase: 'linear-gradient(150deg, #fff0f2 0%, #ff9dad 46%, #ffe5d8 100%)',
    blobA: 'rgba(225,29,72,0.56)',
    blobB: 'rgba(251,113,133,0.66)',
    blobC: 'rgba(190,24,93,0.28)',
    blobD: 'rgba(251,146,60,0.34)',
    accent: '#e11d48',
    accentLight: 'rgba(225,29,72,0.18)',
    particleColor: '#fca5a5',
    shimmer: 'rgba(220,38,38,0.65)',
    label: 'Red Velvet',
  },

  /* ── Frutos Rojos: magenta y violeta ────────────────────── */
  berries: {
    id: 'berries',
    bgBase: 'linear-gradient(150deg, #f7edff 0%, #d8b4fe 42%, #ffe1f6 100%)',
    blobA: 'rgba(124,58,237,0.56)',
    blobB: 'rgba(192,38,211,0.58)',
    blobC: 'rgba(236,72,153,0.40)',
    blobD: 'rgba(167,139,250,0.48)',
    accent: '#7c3aed',
    accentLight: 'rgba(124,58,237,0.18)',
    particleColor: '#e879f9',
    shimmer: 'rgba(192,38,211,0.70)',
    label: 'Frutos Rojos',
  },

  /* ── Kuchen/Manzana: miel y canela ──────────────────────── */
  honey: {
    id: 'honey',
    bgBase: 'linear-gradient(150deg, #fff7ed 0%, #ffd08a 42%, #ffd6e8 100%)',
    blobA: 'rgba(249,115,22,0.48)',
    blobB: 'rgba(245,158,11,0.58)',
    blobC: 'rgba(255,205,229,0.56)',
    blobD: 'rgba(251,113,133,0.38)',
    accent: '#d97706',
    accentLight: 'rgba(217,119,6,0.18)',
    particleColor: '#f9a8d4',
    shimmer: 'rgba(255,214,234,0.82)',
    label: 'Miel y Canela',
  },

  /* ── Alfajores: neutro cálido + caramelo ────────────────── */
  caramel: {
    id: 'caramel',
    bgBase: 'linear-gradient(150deg, #fff4ee 0%, #f8c37e 40%, #ffd0df 100%)',
    blobA: 'rgba(180,83,9,0.44)',
    blobB: 'rgba(251,146,60,0.48)',
    blobC: 'rgba(219,39,119,0.30)',
    blobD: 'rgba(253,186,116,0.52)',
    accent: '#b45309',
    accentLight: 'rgba(180,83,9,0.18)',
    particleColor: '#f9a8d4',
    shimmer: 'rgba(255,205,229,0.78)',
    label: 'Caramelo',
  },
};

/* ── Mapeo rápido de categoryId → themeId ────────────────── */
export const CATEGORY_THEME_MAP = {
  'default':   'default',
  'Tortas':    'chocolate',   // tortas chocolate → cacao
  'Kuchen':    'honey',       // kuchens → miel
  'Alfajores': 'caramel',     // alfajores → caramelo
  'Postres':   'berries',     // postres → frutos rojos
};

/* ── Mapeo de producto específico → themeId ─────────────────
   Por nombre de producto (toLowerCase incluye) → tema exacto */
export const PRODUCT_THEME_MAP = [
  { match: 'chocolate',  theme: 'chocolate' },
  { match: 'red velvet', theme: 'redVelvet' },
  { match: 'frambuesa',  theme: 'berries'   },
  { match: 'frutos',     theme: 'berries'   },
  { match: 'cheesecake', theme: 'berries'   },
  { match: 'manzana',    theme: 'honey'     },
  { match: 'nuez',       theme: 'honey'     },
  { match: 'alfajor',    theme: 'caramel'   },
];

export function resolveProductTheme(productName) {
  if (!productName) return 'default';
  const lower = productName.toLowerCase();
  for (const { match, theme } of PRODUCT_THEME_MAP) {
    if (lower.includes(match)) return theme;
  }
  return 'default';
}

/* ══════════════════════════════════════════════════════════════
   Context API
══════════════════════════════════════════════════════════════ */
const ThemeContext = createContext();

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState('default');

  const setTheme = useCallback((id) => {
    setThemeId(THEMES[id] ? id : 'default');
  }, []);

  const currentTheme = THEMES[themeId] ?? THEMES.default;

  /* ── Sincroniza body background con el tema activo ──────────
     Fuerza que toda la página (incluido el espacio bajo el
     BackgroundCanvas) cambie de color. Transición CSS en body
     en lugar de JS para no bloquear el hilo principal.
  ──────────────────────────────────────────────── */
  useEffect(() => {
    const base = currentTheme.bgBase;
    // Extrae el primer color del gradiente para el body fallback
    const match = base.match(/#[0-9a-f]{6}|rgba?\([^)]+\)/i);
    const fallback = match ? match[0] : '#fff8fb';
    document.body.style.transition = 'background-color 0.85s ease';
    document.body.style.backgroundColor = fallback;
    return () => { document.body.style.backgroundColor = ''; };
  }, [currentTheme]);

  const value = useMemo(() => ({
    themeId,
    currentTheme,
    setTheme,
    THEMES,
  }), [themeId, currentTheme, setTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
