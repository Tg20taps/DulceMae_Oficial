import React, { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useInView } from 'framer-motion';
import { Heart, Sparkles, Award, Star, TrendingUp, Leaf, HandHeart, Palette } from 'lucide-react';
import OptimizedImage from './OptimizedImage';

/* ══════════════════════════════════════════════════════════════
   About.jsx — Fase 3: Storytelling Visual Premium
   
   MEJORAS:
   • Fondo 100% transparente → blobs globales visibles
   • Tipografía Serif generosa para títulos
   • Layout visual de 2 columnas: texto + "polaroids" decorativos
   • Stats con iconografía más rica
   • Cita final con diseño editorial
   • Micro-animaciones escalonadas por elemento
══════════════════════════════════════════════════════════════ */

/* ── Número que cuenta desde 0 hasta target al entrar en vista ── */
function AnimatedNumber({ value, delay = 0 }) {
  /* Extrae prefijo/sufijo ('+', '.', etc.) */
  const isFloat  = value.includes('.');
  const hasPlus  = value.startsWith('+');
  const numeric  = parseFloat(value.replace(/[^0-9.]/g, ''));

  const count    = useMotionValue(0);
  const spring   = useSpring(count, { stiffness: 55, damping: 18, mass: 0.8 });
  const display  = useTransform(spring, (v) => {
    const n = Math.min(v, numeric);
    return (hasPlus ? '+' : '') + (isFloat ? n.toFixed(1) : Math.round(n).toString());
  });

  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-10%' });

  useEffect(() => {
    if (inView) {
      setTimeout(() => count.set(numeric), delay * 1000);
    }
  }, [inView, count, numeric, delay]);

  return (
    <span ref={ref} className="font-serif font-bold text-3xl text-[#be185d] relative z-10 leading-none">
      <motion.span>{display}</motion.span>
    </span>
  );
}

const STATS = [
  { Icon: TrendingUp, value: '+200', label: 'Pedidos entregados', delay: 0 },
  { Icon: Star,       value: '4.9',  label: 'Calificación promedio', delay: 0.1 },
  { Icon: Award,      value: '3+',   label: 'Años de experiencia', delay: 0.2 },
];

// Imágenes polaroid decorativas — float & rotate distintos
const POLAROIDS = [
  {
    src: 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?auto=format&fit=crop&q=80&w=400',
    rotate: '-6deg',
    y: 0,
    label: 'Cada detalle cuenta ✨',
    delay: 0.2,
  },
  {
    src: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=400',
    rotate: '4deg',
    y: 32,
    label: 'Hecho con amor 🍓',
    delay: 0.35,
  },
  {
    src: 'https://images.unsplash.com/photo-1535141192574-5d4897c12636?auto=format&fit=crop&q=80&w=400',
    rotate: '-3deg',
    y: 64,
    label: 'Arte comestible 🌸',
    delay: 0.5,
  },
];

function StatCard({ stat }) {
  const { Icon, value, label, delay } = stat;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: 0.5 + delay, type: 'spring', bounce: 0.35 }}
      whileHover={{ y: -4, scale: 1.04 }}
      className="flex flex-col items-center gap-2 p-5 rounded-3xl relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.72) 0%, rgba(252,231,243,0.60) 100%)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(249,168,212,0.35)',
        boxShadow: '0 4px 24px rgba(190,24,93,0.08)',
      }}
    >
      <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{ background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.5) 0%, transparent 60%)' }} />
      <div className="w-10 h-10 rounded-2xl flex items-center justify-center relative z-10" style={{ background: 'linear-gradient(135deg, rgba(249,168,212,0.30), rgba(252,231,243,0.50))', border: '1px solid rgba(249,168,212,0.30)' }}>
        <Icon className="w-5 h-5 text-[#be185d]" strokeWidth={1.75} />
      </div>
      {/* Número animado — cuenta desde 0 */}
      <AnimatedNumber value={value} delay={0.5 + delay} />
      <span className="text-xs text-[#3f2128]/55 font-semibold text-center leading-tight relative z-10">{label}</span>
    </motion.div>
  );
}

// Polaroid foto artístico
function Polaroid({ item, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotate: 0 }}
      whileInView={{ opacity: 1, y: item.y, rotate: item.rotate }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay: item.delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{
        y: item.y - 8,
        rotate: '0deg',
        zIndex: 10,
        scale: 1.04,
        transition: { duration: 0.3 },
      }}
      className="relative rounded-2xl overflow-hidden cursor-pointer"
      style={{
        width: 180,
        background: 'white',
        padding: '10px 10px 36px 10px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)',
        transformOrigin: 'center center',
        zIndex: index + 1,
      }}
    >
      <div className="rounded-xl overflow-hidden" style={{ height: 160 }}>
        <OptimizedImage
          src={item.src}
          alt={item.label}
          sizes="180px"
          className="w-full h-full object-cover"
          style={{ filter: 'saturate(1.1) contrast(1.02)' }}
        />
      </div>
      <p className="text-center text-[10px] font-semibold text-[#3f2128]/60 mt-2 font-serif italic leading-tight">
        {item.label}
      </p>
    </motion.div>
  );
}

const About = () => {
  return (
    <section id="nosotros" className="pt-8 pb-10 px-8 lg:px-14 w-full relative">

      {/* ── Encabezado centrado ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '0px 0px 22% 0px' }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="text-center mb-8"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1, type: 'spring' }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
          style={{
            background: 'rgba(249,168,212,0.25)',
            border: '1px solid rgba(249,168,212,0.50)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <span className="text-xs font-bold tracking-widest uppercase text-[#be185d]">
            Nuestra historia
          </span>
        </motion.div>

        <h2 className="font-serif text-5xl md:text-7xl xl:text-8xl font-bold text-[#3f2128] leading-tight mb-4 drop-shadow-sm">
          Sobre{' '}
          <span className="text-transparent bg-clip-text"
            style={{ backgroundImage: 'linear-gradient(135deg, #be185d, #f472b6)' }}>
            Nosotros
          </span>
        </h2>

        {/* Línea decorativa */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-24 h-1 mx-auto rounded-full"
          style={{
            background: 'linear-gradient(90deg, #be185d, #f472b6)',
            transformOrigin: 'left',
          }}
        />
      </motion.div>

      {/* ── Layout principal 2 columnas ── */}
      <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center mb-14">

        {/* Columna texto — storytelling */}
        <motion.div
          initial={{ opacity: 0, x: -32 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '0px 0px 20% 0px' }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-8"
        >
          {/* Párrafo principal */}
          <div
            className="rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.65) 0%, rgba(252,231,243,0.50) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(249,168,212,0.30)',
              boxShadow: '0 8px 40px rgba(190,24,93,0.07)',
            }}
          >
            {/* Decorativo esquina */}
            <div
              className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(249,168,212,0.3) 0%, transparent 70%)',
                transform: 'translate(30%, -30%)',
              }}
            />

            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2, type: 'spring', bounce: 0.4 }}
              className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #fce7f3, #fff)',
                border: '1px solid rgba(249,168,212,0.40)',
              }}
            >
              <Heart className="w-7 h-7 text-[#be185d]" fill="#be185d" />
            </motion.div>

            <p className="text-lg md:text-xl text-[#3f2128]/85 leading-relaxed font-medium relative z-10">
              En <strong className="text-[#be185d]">DulceMae</strong>, creemos que cada celebración
              merece un toque mágico. Nuestra pastelería nace de la pasión por transformar ingredientes
              simples en{' '}
              <em className="font-serif text-[#be185d] not-italic">obras de arte comestibles</em>.
            </p>
          </div>

          {/* Segunda tarjeta */}
          <div
            className="rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.55) 0%, rgba(255,237,213,0.35) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(249,168,212,0.20)',
            }}
          >
            <p className="text-base md:text-lg text-[#3f2128]/75 leading-relaxed font-medium">
              Trabajamos con dedicación, seleccionando cuidadosamente la materia prima para garantizar
              que cada bocado no solo sea visualmente impresionante, sino también una explosión de
              sabores <strong className="text-[#3f2128]">inolvidables</strong>.
            </p>

            {/* Divider pequeño */}
            <div
              className="my-6 h-px"
              style={{ background: 'linear-gradient(90deg, rgba(249,168,212,0.5), transparent)' }}
            />

            {/* Cita signature */}
            <div className="relative pl-5">
              <div
                className="absolute left-0 top-0 bottom-0 w-1 rounded-full"
                style={{ background: 'linear-gradient(180deg, #be185d, #f472b6)' }}
              />
              <p className="font-serif italic text-xl md:text-2xl text-[#be185d] font-semibold leading-relaxed">
                "Hecho con amor, para endulzar tus momentos."
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4">
            {STATS.map((stat, i) => (
              <StatCard key={i} stat={stat} index={i} />
            ))}
          </div>
        </motion.div>

        {/* Columna polaroids — galería artística escalonada */}
        <motion.div
          initial={{ opacity: 0, x: 32 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '0px 0px 20% 0px' }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="relative hidden lg:flex items-start justify-center"
          style={{ minHeight: 440 }}
        >
          {/* Fondo circular decorativo */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle at center, rgba(249,168,212,0.15) 0%, transparent 70%)',
              transform: 'scale(1.2)',
            }}
          />

          {/* Polaroids apilados */}
          <div className="relative flex gap-4 items-start justify-center pt-8">
            {POLAROIDS.map((item, i) => (
              <Polaroid key={i} item={item} index={i} />
            ))}
          </div>

          {/* Award badge flotante */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2.5 rounded-2xl shadow-xl"
            style={{
              background: 'linear-gradient(135deg, #be185d, #e11d72)',
              boxShadow: '0 8px 28px rgba(190,24,93,0.35)',
            }}
          >
            <Award className="w-4 h-4 text-white" />
            <span className="text-white text-xs font-bold tracking-wide">Calidad Premium</span>
          </motion.div>

          {/* Stars badge */}
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            className="absolute top-0 left-0 flex items-center gap-1.5 px-3 py-2 rounded-2xl shadow-lg"
            style={{
              background: 'rgba(255,255,255,0.90)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(249,168,212,0.40)',
            }}
          >
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3 h-3 text-yellow-400" fill="#facc15" />
            ))}
            <span className="text-[11px] font-bold text-[#3f2128] ml-0.5">4.9</span>
          </motion.div>
        </motion.div>
      </div>

      {/* ── Valores en fila — mobile-first ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '0px 0px 20% 0px' }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {[
          {
            Icon: Leaf,
            title: 'Ingredientes Seleccionados',
            desc: 'Solo trabajamos con la mejor materia prima, elegida con criterio artesanal.',
            accent: '#22c55e',
            glow: 'rgba(34,197,94,0.28)',
          },
          {
            Icon: HandHeart,
            title: 'Elaboración Artesanal',
            desc: 'Cada pieza se crea a mano, con técnica y dedicación en cada paso.',
            accent: '#be185d',
            glow: 'rgba(190,24,93,0.28)',
          },
          {
            Icon: Palette,
            title: 'Diseño Personalizado',
            desc: 'Tu visión se convierte en una obra de arte única, irrepetible y tuya.',
            accent: '#7c3aed',
            glow: 'rgba(124,58,237,0.28)',
          },
        ].map((val, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 + i * 0.12, duration: 0.55, ease: 'easeOut' }}
            whileHover={{ y: -6, transition: { duration: 0.25 } }}
            className="flex flex-col items-center text-center gap-5 p-8 rounded-3xl relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.60) 0%, rgba(252,231,243,0.45) 100%)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(249,168,212,0.25)',
              boxShadow: '0 4px 20px rgba(190,24,93,0.06)',
            }}
          >
            {/* Icono con brillo dorado al hover */}
            <motion.div
              whileHover={{
                scale: 1.18,
                rotate: [0, -6, 6, -3, 0],
                filter: `drop-shadow(0 0 10px ${val.glow}) drop-shadow(0 0 4px rgba(253,224,138,0.60))`,
              }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                background: `linear-gradient(135deg, ${val.accent}18, ${val.accent}10)`,
                border: `1.5px solid ${val.accent}30`,
                boxShadow: `0 4px 16px ${val.glow}`,
              }}
            >
              <val.Icon
                className="w-6 h-6"
                style={{ color: val.accent }}
                strokeWidth={1.6}
              />
            </motion.div>

            <div className="flex flex-col items-center gap-2">
              <h3 className="font-serif text-xl font-bold text-[#3f2128]">{val.title}</h3>
              <p className="text-sm text-[#3f2128]/60 font-medium leading-relaxed max-w-[220px]">{val.desc}</p>
            </div>

            {/* Shimmer corner */}
            <div
              className="absolute top-0 right-0 w-32 h-32 pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(255,255,255,0.35) 0%, transparent 70%)',
                transform: 'translate(20%, -20%)',
              }}
            />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
};

export default About;
