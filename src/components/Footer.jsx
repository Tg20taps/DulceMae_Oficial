import React, { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Cake, Heart, Instagram, MessageCircle, Music2, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const SOCIALS = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/dulcemaeoficial/',
    Icon: Instagram,
    color: '#dd2a7b',
    glow: 'rgba(221,42,123,0.36)',
    hoverBg: 'linear-gradient(135deg, #f58529 0%, #dd2a7b 52%, #8134af 100%)',
    badgeBg: 'linear-gradient(135deg, #f58529 0%, #dd2a7b 52%, #8134af 100%)',
    softBg: 'rgba(221,42,123,0.10)',
  },
  {
    label: 'TikTok',
    href: 'https://www.tiktok.com/@claudia.andrea2',
    Icon: Music2,
    color: '#ff0050',
    glow: 'rgba(255,0,80,0.34)',
    hoverBg: 'linear-gradient(135deg, #111827 0%, #ff0050 58%, #00f2ea 100%)',
    badgeBg: 'linear-gradient(135deg, #111827 0%, #ff0050 58%, #00f2ea 100%)',
    softBg: 'rgba(255,0,80,0.10)',
  },
  {
    label: 'WhatsApp',
    href: 'https://wa.me/56975562291',
    Icon: MessageCircle,
    color: '#16a34a',
    glow: 'rgba(22,163,74,0.34)',
    hoverBg: 'linear-gradient(135deg, #075e54 0%, #128c7e 45%, #25d366 100%)',
    badgeBg: 'linear-gradient(135deg, #128c7e 0%, #25d366 100%)',
    softBg: 'rgba(22,163,74,0.10)',
  },
];

const FOOTER_MOTIFS = [
  { Icon: Sparkles, label: 'Brillo fino' },
  { Icon: Cake, label: 'Pastel artesanal' },
  { Icon: Heart, label: 'Hecho con carino' },
];

function CraftMotif() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-8% 0px' });
  const { currentTheme } = useTheme();
  const accent = currentTheme.accent ?? '#be185d';

  return (
    <div ref={ref} className="flex min-h-[6.5rem] flex-col items-center justify-center">
      <p className="mb-2.5 text-[9px] font-bold uppercase tracking-[0.24em]" style={{ color: accent, opacity: 0.62 }}>
        Hecho a mano en Puerto Montt
      </p>

      <motion.div
        className="relative flex items-center gap-3 rounded-[1.5rem] border border-white/70 bg-white/48 px-4 py-3 shadow-[0_18px_64px_rgba(190,24,93,0.10)] backdrop-blur-xl"
        initial={{ opacity: 0, y: 18, scale: 0.94 }}
        animate={inView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 18, scale: 0.94 }}
        transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          className="absolute inset-0 rounded-[2rem]"
          style={{ background: `radial-gradient(circle at 50% 0%, ${accent}1f, transparent 68%)` }}
        />
        {FOOTER_MOTIFS.map(({ Icon, label }, index) => (
          <motion.div
            key={label}
            className="relative z-10 flex h-11 w-11 items-center justify-center rounded-xl border border-white/80 bg-white/78"
            animate={inView ? { y: [0, index === 1 ? -5 : 4, 0] } : undefined}
            transition={{ duration: 3.2 + index * 0.35, repeat: Infinity, ease: 'easeInOut' }}
            title={label}
            style={{
              color: index === 1 ? '#be185d' : accent,
              boxShadow: `0 10px 28px ${accent}18`,
            }}
          >
            <Icon className="h-5 w-5" strokeWidth={1.65} fill={Icon === Heart ? 'currentColor' : 'none'} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

function SocialLink({ social }) {
  const [hovered, setHovered] = useState(false);
  const { label, href, Icon, color, glow, hoverBg, badgeBg, softBg } = social;

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ y: -4, scale: 1.025 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 360, damping: 24 }}
      className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-[1.2rem] border py-2 pl-2 pr-4 text-[0.88rem] font-bold backdrop-blur-md"
      style={{
        color: hovered ? '#ffffff' : '#3f2128',
        background: hovered ? hoverBg : `linear-gradient(135deg, rgba(255,255,255,0.84), ${softBg})`,
        borderColor: hovered ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.82)',
        boxShadow: hovered
          ? `0 20px 46px ${glow}, 0 0 0 1px rgba(255,255,255,0.42) inset`
          : `0 10px 26px ${glow}, 0 1px 0 rgba(255,255,255,0.78) inset`,
      }}
    >
      <motion.span
        className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2"
        animate={{ x: hovered ? '330%' : '0%' }}
        transition={{ duration: 0.55, ease: 'easeInOut' }}
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)', transform: 'skewX(-18deg)' }}
      />
      <motion.span
        className="relative z-10 flex h-10 w-10 items-center justify-center overflow-hidden rounded-[14px]"
        animate={{ rotate: hovered ? -5 : 0, scale: hovered ? 1.05 : 1 }}
        transition={{ type: 'spring', stiffness: 360, damping: 22 }}
        style={{
          background: hovered ? 'rgba(255,255,255,0.20)' : badgeBg,
          color: '#ffffff',
          border: '1px solid rgba(255,255,255,0.42)',
          boxShadow: hovered
            ? '0 12px 28px rgba(0,0,0,0.16), 0 0 0 5px rgba(255,255,255,0.18)'
            : `0 12px 28px ${glow}, 0 0 0 5px rgba(255,255,255,0.46)`,
        }}
      >
        <span
          className="absolute -left-5 -top-7 h-12 w-12 rounded-full bg-white/30 blur-sm"
        />
        <Icon
          className="relative h-5 w-5"
          strokeWidth={2.35}
          style={{
            filter: label === 'TikTok' && !hovered
              ? 'drop-shadow(-1px 0 #00f2ea) drop-shadow(1px 0 #ff0050)'
              : 'drop-shadow(0 2px 5px rgba(0,0,0,0.18))',
          }}
        />
      </motion.span>
      <span className="relative z-10 pr-1.5">{label}</span>
    </motion.a>
  );
}

export default function Footer() {
  const { currentTheme } = useTheme();
  const accent = currentTheme.accent ?? '#be185d';

  return (
    <motion.footer
      id="footer"
      className="relative mt-8 overflow-hidden border-t border-white/60 py-10"
      animate={{
        background: `
          linear-gradient(180deg, rgba(255,255,255,0.64), rgba(255,255,255,0.34)),
          radial-gradient(circle at 12% 18%, ${currentTheme.blobA} 0%, transparent 34%),
          radial-gradient(circle at 86% 72%, ${currentTheme.blobB} 0%, transparent 36%),
          ${currentTheme.bgBase}
        `,
      }}
      transition={{ duration: 0.85, ease: 'easeInOut' }}
      style={{ backdropFilter: 'blur(22px)' }}
    >
      <div className="absolute inset-0 dm-pattern-veil opacity-45" aria-hidden="true">
        <motion.div
          className="absolute inset-0 dm-pastry-pattern"
          animate={{ backgroundColor: accent }}
          transition={{ duration: 0.85, ease: 'easeInOut' }}
        />
      </div>
      <div className="absolute inset-x-0 top-0 h-px bg-white/80" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center gap-6 px-5 text-center">
        <div>
          <span className="block font-serif text-3xl font-bold text-[#3f2128] md:text-4xl">
            Dulce<span style={{ color: accent }}>Mae</span>
          </span>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: accent, opacity: 0.66 }}>
            Pastelería artesanal · Puerto Montt
          </p>
        </div>

        <CraftMotif />

        <div className="flex flex-wrap justify-center gap-2.5">
          {SOCIALS.map((social) => <SocialLink key={social.label} social={social} />)}
        </div>

        <div className="flex w-full flex-col items-center justify-between gap-2 border-t border-pink-100/70 pt-5 text-[11px] text-[#3f2128]/45 md:flex-row">
          <p>© {new Date().getFullYear()} DulceMae Online. Todos los derechos reservados.</p>
          <p className="italic">Diseñado para endulzar tus momentos.</p>
        </div>
      </div>
    </motion.footer>
  );
}
