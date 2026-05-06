import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ExternalLink, MapPin, Navigation, Phone, Store } from 'lucide-react';

const STORE = {
  name: 'DulceMae',
  address: 'Pje. Nueva 1, Casa 117, Alerce, Puerto Montt',
  region: 'Chile',
  hours: 'Lun - Sáb · 9:00 - 20:00',
  openHour: 9,
  closeHour: 20,
  closedDays: [0],
  phone: '+56 9 7556 2291',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=-41.399373%2C-72.906800',
  embedUrl: 'https://maps.google.com/maps?ll=-41.399373,-72.906800&z=17&t=m&output=embed',
};

function LiveStatusBadge() {
  function getStatus() {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Santiago' }));
    const day = now.getDay();
    const hour = now.getHours();
    const min = now.getMinutes();
    const isClosed = STORE.closedDays.includes(day);
    const isOpen = !isClosed && hour >= STORE.openHour && hour < STORE.closeHour;
    const opensIn = !isOpen && !isClosed && hour < STORE.openHour;
    const minutesToOpen = opensIn ? (STORE.openHour - hour) * 60 - min : 0;
    const minutesToClose = isOpen ? (STORE.closeHour - hour) * 60 - min : 0;
    return { isOpen, minutesToOpen, minutesToClose };
  }

  const [status, setStatus] = useState(getStatus);

  useEffect(() => {
    const id = setInterval(() => setStatus(getStatus()), 60_000);
    return () => clearInterval(id);
  }, []);

  let label;
  let color;
  let dotColor;

  if (status.isOpen && status.minutesToClose <= 60) {
    label = `Cierra en ${status.minutesToClose} min`;
    color = '#d97706';
    dotColor = '#f59e0b';
  } else if (status.isOpen) {
    label = 'Abierto ahora';
    color = '#16a34a';
    dotColor = '#22c55e';
  } else if (status.minutesToOpen > 0) {
    const h = Math.floor(status.minutesToOpen / 60);
    const m = status.minutesToOpen % 60;
    label = `Abre en ${h > 0 ? h + 'h ' : ''}${m > 0 ? m + 'min' : ''}`;
    color = '#be185d';
    dotColor = '#f472b6';
  } else {
    label = 'Cerrado hoy';
    color = '#6b7280';
    dotColor = '#9ca3af';
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={label}
        initial={{ opacity: 0, scale: 0.9, y: 4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1"
        style={{ background: `${dotColor}18`, border: `1px solid ${dotColor}40` }}
      >
        <motion.span
          animate={{ scale: [1, 1.45, 1], opacity: [1, 0.45, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: dotColor }}
        />
        <span className="text-[0.7rem] font-bold" style={{ color }}>
          {label}
        </span>
      </motion.div>
    </AnimatePresence>
  );
}

function InfoPill({ icon: Icon, text, accent = false }) {
  return (
    <div
      className="flex items-center gap-3 rounded-2xl border px-4 py-3"
      style={{
        background: accent ? 'rgba(253,242,248,0.82)' : 'rgba(255,255,255,0.58)',
        borderColor: accent ? 'rgba(249,168,212,0.58)' : 'rgba(255,255,255,0.68)',
      }}
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
        style={{ background: accent ? 'rgba(190,24,93,0.10)' : '#fdf2f8' }}
      >
        <Icon className={`h-4 w-4 ${accent ? 'text-[#be185d]' : 'text-pink-400'}`} />
      </div>
      <span className="text-sm font-medium leading-tight text-[#3f2128]/80">{text}</span>
    </div>
  );
}

function MapButton({ url }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileTap={{ scale: 0.96 }}
      animate={{
        boxShadow: hovered
          ? '0 16px 48px rgba(190,24,93,0.40), 0 0 0 2px rgba(190,24,93,0.25)'
          : '0 6px 24px rgba(190,24,93,0.20)',
      }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl px-6 py-4 text-sm font-bold text-white"
      style={{
        background: hovered
          ? 'linear-gradient(135deg, #9f1239, #be185d, #f472b6)'
          : 'linear-gradient(135deg, #be185d, #e11d72)',
      }}
    >
      <motion.span
        animate={{ x: hovered ? '200%' : '-100%' }}
        transition={{ duration: 0.55, ease: 'easeInOut' }}
        className="pointer-events-none absolute inset-0 w-1/3"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)', transform: 'skewX(-20deg)' }}
      />
      <motion.div animate={{ rotate: hovered ? -12 : 0, scale: hovered ? 1.2 : 1 }}>
        <Navigation className="h-5 w-5" />
      </motion.div>
      <span>Cómo llegar</span>
      <motion.div animate={{ x: hovered ? 4 : 0, opacity: hovered ? 1 : 0.65 }}>
        <ExternalLink className="h-4 w-4" />
      </motion.div>
    </motion.a>
  );
}

function DulceMaeMapPin({ hovered }) {
  return (
    <motion.div
      animate={{ y: hovered ? -8 : [0, -6, 0], scale: hovered ? 1.05 : 1 }}
      transition={
        hovered
          ? { type: 'spring', stiffness: 340, damping: 20 }
          : { duration: 3.2, repeat: Infinity, ease: 'easeInOut' }
      }
      className="relative flex flex-col items-center"
    >
      <motion.div
        animate={{
          boxShadow: hovered
            ? '0 22px 58px rgba(190,24,93,0.38), 0 0 0 8px rgba(190,24,93,0.10)'
            : '0 18px 42px rgba(190,24,93,0.24), 0 0 0 5px rgba(255,255,255,0.62)',
        }}
        className="relative flex h-20 w-20 items-center justify-center rounded-full border border-white/85 p-2 backdrop-blur-md"
        style={{ background: 'linear-gradient(145deg, #be185d, #e11d72)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.28)' }}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/80 bg-white shadow-inner">
          <Store className="h-7 w-7 text-[#be185d]" strokeWidth={1.65} />
        </div>
      </motion.div>

      <div
        className="-mt-2 h-5 w-5 rotate-45 rounded-br-[6px] border-b border-r border-white/80 bg-[#e11d72]"
        style={{ boxShadow: '8px 8px 24px rgba(190,24,93,0.20)' }}
      />
      <motion.div
        animate={{ scale: hovered ? 1.18 : [1, 1.08, 1], opacity: hovered ? 0.24 : [0.18, 0.28, 0.18] }}
        transition={{ duration: 2.4, repeat: hovered ? 0 : Infinity, ease: 'easeInOut' }}
        className="mt-1 h-3 w-20 rounded-full bg-[#be185d]"
        style={{ filter: 'blur(10px)' }}
      />
    </motion.div>
  );
}

function MapPreview() {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.a
      href={STORE.mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Abrir DulceMae en Google Maps"
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileTap={{ scale: 0.985 }}
      className="group relative block h-72 min-h-[340px] w-full overflow-hidden rounded-[2rem] border border-pink-200/60 md:h-full"
      style={{
        background: '#fff7fb',
        boxShadow: hovered
          ? 'inset 0 1px 0 rgba(255,255,255,0.92), 0 28px 82px rgba(190,24,93,0.18)'
          : 'inset 0 1px 0 rgba(255,255,255,0.92), 0 22px 70px rgba(190,24,93,0.12)',
      }}
    >
      <iframe
        title="Mapa DulceMae Puerto Montt"
        src={STORE.embedUrl}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="absolute inset-0 h-full w-full border-0"
        style={{
          pointerEvents: 'none',
          filter: hovered ? 'saturate(1.02) contrast(1.02)' : 'saturate(0.96) contrast(0.99)',
          transition: 'filter 0.4s ease',
        }}
      />

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(63,33,40,0.04), transparent 30%, rgba(255,247,251,0.20) 100%)',
        }}
      />

      <div className="absolute left-5 top-5 rounded-2xl border border-white/80 bg-white/84 px-4 py-3 shadow-sm backdrop-blur-md">
        <p className="text-[10px] font-bold uppercase text-[#be185d]/55">DulceMae</p>
        <p className="mt-0.5 text-sm font-bold leading-none text-[#3f2128]/75">{STORE.address}</p>
      </div>

      <div
        className="pointer-events-none absolute"
        style={{
          left: '45%',
          top: '47%',
          transform: 'translate(-50%, -86%)',
        }}
      >
        <DulceMaeMapPin hovered={hovered} />
      </div>

      <motion.div
        animate={{ y: hovered ? -2 : 0 }}
        className="absolute bottom-5 right-5 inline-flex items-center gap-2 rounded-2xl border border-white/80 bg-white/90 px-4 py-3 text-sm font-bold text-[#be185d] shadow-lg backdrop-blur-md"
      >
        <Navigation className="h-4 w-4" />
        <span>Abrir mapa</span>
        <ExternalLink className="h-3.5 w-3.5 opacity-70" />
      </motion.div>
    </motion.a>
  );
}

export default function Location() {
  return (
    <section id="ubicacion" className="px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px 0px 22% 0px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-14 text-center"
        >
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-pink-200 bg-pink-50/60 px-4 py-1.5 text-xs font-bold uppercase text-[#be185d]">
            <MapPin className="h-3 w-3" />
            Visítanos
          </span>
          <h2 className="mt-2 font-serif text-5xl font-bold leading-tight text-[#3f2128] md:text-6xl">
            Encuéntranos
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base font-medium leading-relaxed text-[#3f2128]/55">
            Ven por tus dulces favoritos y coordina tu pedido con calma.{' '}
            <span className="text-[#be185d]">Te esperamos con algo rico.</span>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px 0px 20% 0px' }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="grid items-stretch gap-6 md:grid-cols-2"
        >
          <div className="order-2 md:order-1">
            <MapPreview />
          </div>

          <div className="order-1 flex flex-col gap-4 rounded-[2rem] border border-white/70 bg-white/60 p-6 shadow-xl backdrop-blur-xl md:order-2">
            <div className="border-b border-pink-100/60 pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-bold uppercase text-pink-400">Nuestra tienda</p>
                <LiveStatusBadge />
              </div>
              <h3 className="mt-1 font-serif text-3xl font-bold text-[#3f2128]">{STORE.name}</h3>
              <p className="mt-0.5 text-sm font-medium text-[#3f2128]/50">{STORE.region}</p>
            </div>

            <div className="flex flex-col gap-2.5">
              <InfoPill icon={MapPin} text={STORE.address} accent />
              <InfoPill icon={Clock} text={STORE.hours} />
              <InfoPill icon={Phone} text={STORE.phone} />
            </div>

            <div className="flex-1" />

            <p className="text-[11px] font-medium leading-relaxed text-[#3f2128]/40">
              También puedes hacer tu pedido por WhatsApp y coordinar retiro o entrega en sectores cercanos.
            </p>

            <MapButton url={STORE.mapsUrl} />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
