import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Award, Clock, MapPin, Leaf, HandHeart, Palette } from 'lucide-react';
import OptimizedImage from './OptimizedImage';
import { NEGOCIO } from '../config/negocio';
import { useCatalog } from '../context/CatalogContext';

/* ══════════════════════════════════════════════════════════════
   About.jsx — Fase 3: Storytelling Visual Premium
   
   MEJORAS:
   • Fondo 100% transparente → blobs globales visibles
   • Tipografía Serif generosa para títulos
   • Layout visual de 2 columnas: texto + polaroids con las fotos que
     se suben desde el admin (si no hay fotos, sólo el texto)
   • Stats con iconografía más rica
   • Cita final con diseño editorial
   • Micro-animaciones escalonadas por elemento
══════════════════════════════════════════════════════════════ */

// Datos verificables del negocio. Cuando haya cifras reales (pedidos
// entregados, reseñas de Google), pueden reemplazar a estas.
const STATS = [
  { Icon: HandHeart, value: 'A mano', label: 'Cada pedido se hace desde cero', delay: 0 },
  { Icon: Clock, value: `${NEGOCIO.anticipacionDias * 24} h`, label: 'De anticipación para pedir', delay: 0.1 },
  { Icon: MapPin, value: NEGOCIO.sector.split(',')[0], label: 'Retiro o delivery', delay: 0.2 },
];

// Inclinación y desfase de cada polaroid, para que se vean sueltas sobre la mesa.
const POLAROID_POSE = [
  { rotate: '-6deg', offset: 'mt-0', delay: 0.2 },
  { rotate: '4deg', offset: 'mt-5 lg:mt-8', delay: 0.35 },
  { rotate: '-3deg', offset: 'mt-10 lg:mt-16', delay: 0.5 },
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
      className="flex flex-col items-center gap-2 px-2 py-4 sm:p-5 rounded-3xl relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.86) 0%, rgba(252,231,243,0.72) 100%)',
        border: '1px solid rgba(249,168,212,0.35)',
        boxShadow: '0 4px 24px rgba(190,24,93,0.08)',
      }}
    >
      <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{ background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.5) 0%, transparent 60%)' }} />
      <div className="w-10 h-10 rounded-2xl flex items-center justify-center relative z-10" style={{ background: 'linear-gradient(135deg, rgba(249,168,212,0.30), rgba(252,231,243,0.50))', border: '1px solid rgba(249,168,212,0.30)' }}>
        <Icon className="w-5 h-5 text-[#be185d]" strokeWidth={1.75} />
      </div>
      <span className="whitespace-nowrap font-serif font-bold text-xl sm:text-2xl text-[#be185d] relative z-10 leading-none">{value}</span>
      <span className="text-xs text-[#3f2128]/55 font-semibold text-center leading-tight relative z-10">{label}</span>
    </motion.div>
  );
}

// Las fotos las sube la dueña desde el admin (Catálogo → Fotos de la página).
function Polaroid({ photo, index }) {
  const pose = POLAROID_POSE[index % POLAROID_POSE.length];
  return (
    <motion.figure
      initial={{ opacity: 0, y: 32, rotate: 0 }}
      whileInView={{ opacity: 1, y: 0, rotate: pose.rotate }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay: pose.delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ rotate: '0deg', scale: 1.04, zIndex: 10, transition: { duration: 0.3 } }}
      className={`relative w-[31%] max-w-[180px] shrink-0 rounded-2xl bg-white p-1.5 pb-6 shadow-[0_12px_40px_rgba(0,0,0,0.14),0_2px_8px_rgba(0,0,0,0.06)] sm:p-2.5 sm:pb-9 ${pose.offset}`}
      style={{ zIndex: index + 1 }}
    >
      <div className="aspect-square overflow-hidden rounded-xl bg-[#fde7f1]">
        <OptimizedImage
          src={photo.image}
          alt={photo.caption || 'Foto de DulceMae'}
          sizes="(min-width: 1024px) 180px, 31vw"
          className="h-full w-full object-cover"
        />
      </div>
      {photo.caption && (
        <figcaption className="mt-1.5 text-center font-serif text-[9px] font-semibold italic leading-tight text-[#3f2128]/60 sm:mt-2 sm:text-[11px]">
          {photo.caption}
        </figcaption>
      )}
    </motion.figure>
  );
}

const About = () => {
  const { sitePhotos } = useCatalog();
  const photos = sitePhotos.slice(0, POLAROID_POSE.length);
  const hasPhotos = photos.length > 0;

  return (
    <section className="pt-8 pb-10 px-5 sm:px-8 lg:px-14 w-full relative">

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
      <div className={`mb-14 grid grid-cols-1 items-center gap-10 lg:gap-20 ${hasPhotos ? 'lg:grid-cols-2' : 'mx-auto max-w-3xl'}`}>

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
              background: 'linear-gradient(135deg, rgba(255,255,255,0.80) 0%, rgba(252,231,243,0.62) 100%)',
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
              background: 'linear-gradient(135deg, rgba(255,255,255,0.74) 0%, rgba(255,237,213,0.48) 100%)',
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
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {STATS.map((stat, i) => (
              <StatCard key={i} stat={stat} index={i} />
            ))}
          </div>
        </motion.div>

        {/* Columna polaroids: sólo si hay fotos reales. */}
        {hasPhotos && (
          <div className="relative flex flex-col items-center gap-6 lg:min-h-[440px] lg:justify-center">
            <div className="relative flex w-full items-start justify-center gap-2 sm:gap-4">
              {photos.map((photo, i) => (
                <Polaroid key={photo.slot} photo={photo} index={i} />
              ))}
            </div>

            <span className="flex items-center gap-2 rounded-2xl bg-gradient-to-br from-[#be185d] to-[#e11d72] px-4 py-2.5 shadow-[0_8px_28px_rgba(190,24,93,0.35)] lg:absolute lg:bottom-4 lg:right-4">
              <Award className="h-4 w-4 text-white" />
              <span className="text-xs font-bold tracking-wide text-white">Calidad Premium</span>
            </span>
          </div>
        )}
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
              background: 'linear-gradient(135deg, rgba(255,255,255,0.80) 0%, rgba(252,231,243,0.58) 100%)',
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
