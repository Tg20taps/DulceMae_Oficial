import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, Minus, Plus, Trash2, Calendar, User, ArrowRight, Sparkles, ChevronLeft, Phone, Clock3, MessageSquare, AlertCircle, MapPin, CreditCard, Home } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { trackEvent } from '../utils/analytics';
import OptimizedImage from './OptimizedImage';

/* ── Keyframes para sello lacre + ilustración vacío ── */
const CART_KEYFRAMES = `
@keyframes sealFall {
  0%   { opacity:0; transform: scale(0.65) translateY(-22px) rotate(-8deg); }
  55%  { opacity:1; transform: scale(1.07) translateY(4px)  rotate(2deg);  }
  75%  { transform: scale(0.96) translateY(-2px) rotate(-1deg); }
  100% { opacity:1; transform: scale(1)    translateY(0px)  rotate(0deg);  }
}
@keyframes sealShimmer {
  0%   { background-position: -200% center; }
  100% { background-position:  300% center; }
}
@keyframes whiskerSpin {
  0%,100% { transform: rotate(-12deg) scaleY(0.92); }
  50%      { transform: rotate( 12deg) scaleY(1.06); }
}
@keyframes steamRise {
  0%   { opacity:0;   transform: translateY(0)   scaleX(1);    }
  40%  { opacity:0.7; transform: translateY(-10px) scaleX(1.1); }
  100% { opacity:0;   transform: translateY(-24px) scaleX(0.8); }
}
@keyframes bowlBob {
  0%,100% { transform: translateY(0px);  }
  50%      { transform: translateY(-5px); }
}
`;

/* ────────────────────────────────────────────────────────────
   SEAL STAMP — Sello circular lacre "Tu Pedido" con rebote
──────────────────────────────────────────────────────────── */
function SealStamp({ label }) {
  return (
    <>
      <style>{CART_KEYFRAMES}</style>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap: 6 }}>
        {/* Sello principal */}
        <div
          style={{
            width: 88, height: 88,
            borderRadius: '50%',
            background: 'linear-gradient(145deg, #9f1239 0%, #be185d 45%, #e11d72 100%)',
            boxShadow: '0 6px 28px rgba(190,24,93,0.45), 0 0 0 3px rgba(190,24,93,0.18), inset 0 1px 0 rgba(255,255,255,0.22)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            position: 'relative', overflow: 'hidden',
            animation: 'sealFall 0.65s cubic-bezier(0.34,1.56,0.64,1) both',
          }}
        >
          {/* Anillo interior punteado */}
          <div style={{
            position:'absolute', inset: 6, borderRadius:'50%',
            border: '1.5px dashed rgba(255,255,255,0.35)',
            pointerEvents:'none',
          }} />
          {/* Shimmer metálico */}
          <div style={{
            position:'absolute', inset:0, borderRadius:'50%',
            background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.28) 50%, transparent 70%)',
            backgroundSize: '200% 100%',
            animation: 'sealShimmer 2.6s ease-in-out infinite',
            pointerEvents:'none',
          }} />
          {/* Texto sello */}
          <div style={{ position:'relative', textAlign:'center', zIndex:1 }}>
            <div style={{ fontSize:'0.38rem', letterSpacing:'0.22em', color:'rgba(255,255,255,0.70)', textTransform:'uppercase', fontWeight:700 }}>✦ dulcemae ✦</div>
            <div style={{ fontSize:'0.95rem', fontFamily:'Georgia,serif', fontWeight:700, color:'#fff', lineHeight:1.1, marginTop:2 }}>{label}</div>
            <div style={{ fontSize:'0.38rem', letterSpacing:'0.18em', color:'rgba(255,255,255,0.60)', textTransform:'uppercase', fontWeight:700, marginTop:3 }}>artesanal</div>
          </div>
        </div>
        {/* Línea bajo el sello */}
        <div style={{ width:48, height:1.5, borderRadius:999, background:'linear-gradient(90deg,transparent,rgba(190,24,93,0.5),transparent)' }} />
      </div>
    </>
  );
}

/* ────────────────────────────────────────────────────────────
   EMPTY CART ILLUSTRATION — Batidor animado + vapor
──────────────────────────────────────────────────────────── */
function EmptyCartIllustration() {
  return (
    <div style={{ position:'relative', width:110, height:110, marginBottom: 8 }}>
      {/* Vapor 1 */}
      <div style={{ position:'absolute', top:0, left:'38%', width:6, height:14, borderRadius:999,
        background:'rgba(190,24,93,0.18)', animation:'steamRise 2.2s ease-in-out infinite', animationDelay:'0s' }} />
      {/* Vapor 2 */}
      <div style={{ position:'absolute', top:0, left:'55%', width:5, height:12, borderRadius:999,
        background:'rgba(190,24,93,0.13)', animation:'steamRise 2.2s ease-in-out infinite', animationDelay:'0.7s' }} />
      {/* Vapor 3 */}
      <div style={{ position:'absolute', top:0, left:'25%', width:4, height:10, borderRadius:999,
        background:'rgba(190,24,93,0.10)', animation:'steamRise 2.2s ease-in-out infinite', animationDelay:'1.4s' }} />

      {/* Tazón que sube y baja */}
      <div style={{ animation:'bowlBob 2.8s ease-in-out infinite', marginTop:18 }}>
        {/* Batidor */}
        <div style={{ fontSize:'4.2rem', textAlign:'center', lineHeight:1,
          animation:'whiskerSpin 1.6s ease-in-out infinite', display:'block' }}>
          🥣
        </div>
      </div>

      {/* Brillo radial de fondo */}
      <div style={{
        position:'absolute', inset:0, borderRadius:'50%',
        background:'radial-gradient(circle at 50% 60%, rgba(249,168,212,0.22) 0%, transparent 70%)',
        pointerEvents:'none',
      }} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   CartModal.jsx — Fase 3: Experiencia de Lujo
   
   MEJORAS:
   • Título "Tu Pedido" — Serif artístico, centrado, generoso
   • Layout con más aire: padding generoso, respiración visual
   • Botones +/- elegantes, no simples caracteres
   • CTA "Continuar" con gradiente premium + shimmer effect
   • handleTrackClick en botón de finalizar pedido
   • Mensaje WhatsApp bien estructurado y profesional
   • UX: estado vacío más expressivo
══════════════════════════════════════════════════════════════ */

/* ── Upsell products ─────────────────────────────────────────── */
const UPSELL_ITEMS = [
  {
    id: 'upsell-velas',
    name: 'Velas Decorativas',
    subtitle: 'Set de 3 · Con encendedor',
    price: 3500,
    emoji: '🕯️',
    accent: '#f97316',
    gradientFrom: '#fff7ed',
    gradientTo: '#ffedd5',
    border: 'rgba(249,115,22,0.25)',
    borderHover: 'rgba(249,115,22,0.7)',
    tag: 'Más pedido',
  },
  {
    id: 'upsell-alfajores',
    name: 'Alfajores x6',
    subtitle: 'Maicena · Manjar artesanal',
    price: 6900,
    emoji: '🍪',
    accent: '#be185d',
    gradientFrom: '#fff0f5',
    gradientTo: '#fce7f3',
    border: 'rgba(190,24,93,0.2)',
    borderHover: 'rgba(190,24,93,0.6)',
    tag: '⭐ Favorito',
  },
  {
    id: 'upsell-caja',
    name: 'Caja Regalo',
    subtitle: 'Lazo + tarjeta personalizada',
    price: 4200,
    emoji: '🎁',
    accent: '#7c3aed',
    gradientFrom: '#f5f3ff',
    gradientTo: '#ede9fe',
    border: 'rgba(124,58,237,0.2)',
    borderHover: 'rgba(124,58,237,0.6)',
    tag: 'Nuevo',
  },
];

function formatCLP(n) {
  return `$${n.toLocaleString('es-CL')}`;
}

const ALERCE_DELIVERY_FEE_CLP = 3000;
const PUERTO_MONTT_DELIVERY_FEE_CLP = 5500;
const DEFAULT_DELIVERY_ZONE = 'alerce_cercano';
const DELIVERY_ZONES = [
  {
    value: DEFAULT_DELIVERY_ZONE,
    label: 'Alerce cercano',
    detail: `Suma ${formatCLP(ALERCE_DELIVERY_FEE_CLP)}`,
    fee: ALERCE_DELIVERY_FEE_CLP,
    feeKnown: true,
    note: 'Costo fijo para sectores cercanos de Alerce.',
  },
  {
    value: 'puerto_montt',
    label: 'Puerto Montt / sectores',
    detail: `Suma ${formatCLP(PUERTO_MONTT_DELIVERY_FEE_CLP)}`,
    fee: PUERTO_MONTT_DELIVERY_FEE_CLP,
    feeKnown: true,
    note: 'Costo fijo para Puerto Montt y sectores disponibles.',
  },
  {
    value: 'fuera_zona',
    label: 'Fuera de zona',
    detail: 'Coordinar disponibilidad',
    fee: 0,
    feeKnown: false,
    note: 'Se coordina disponibilidad y costo antes de confirmar el pedido.',
  },
];

function getDeliveryZone(value) {
  return DELIVERY_ZONES.find(zone => zone.value === value) ?? DELIVERY_ZONES[0];
}

function formatDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getMinCheckoutDate() {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + 2);
  return formatDateInputValue(date);
}

function isMobileViewport() {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
}

/* ── DATA SCIENCE — Payload builder ──────────────────────────
   Fuente única de verdad para webhook y WhatsApp.
   - created_at ISO 8601 → Sheets lo parsea como fecha nativa
   - delivery_date YYYY-MM-DD → filtrable/ordenable
   - subtotal pre-calculado → SUM() sin fórmulas extra
   - total_clp número limpio → sin símbolos que rompan fórmulas
─────────────────────────────────────────────────────────────── */
function getAtelierPromise(cartItems) {
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const hasSignatureCake = cartItems.some(item =>
    String(item.name).toLowerCase().includes('torta') ||
    String(item.name).toLowerCase().includes('cheesecake')
  );
  const prepHours = Math.min(96, 48 + Math.max(0, itemCount - 1) * 6 + (hasSignatureCake ? 8 : 0));
  const prepDays = Math.ceil(prepHours / 24);

  return {
    window: prepDays <= 2 ? '48h' : `${prepDays} días`,
    title: hasSignatureCake ? 'Mesa de decoración asignada' : 'Tanda artesanal reservada',
    detail: 'Reservamos tiempo real de obrador para que tu pedido salga con textura, empaque y presencia impecables.',
    stages: hasSignatureCake
      ? ['Bizcocho', 'Reposo', 'Decoracion']
      : ['Mezcla', 'Reposo', 'Empaque'],
  };
}

function buildOrderPayload(cartItems, productSubtotal, formData) {
  const isDelivery = formData.fulfillment === 'delivery';
  const deliveryZone = isDelivery ? getDeliveryZone(formData.deliveryZone) : null;
  const deliveryFee = isDelivery && deliveryZone.feeKnown ? deliveryZone.fee : 0;
  const deliveryFeePending = isDelivery && !deliveryZone.feeKnown;
  const total = productSubtotal + deliveryFee;

  return {
    order_id: `DM-${Date.now()}`,
    created_at: new Date().toISOString(),
    channel: 'whatsapp_web',
    customer: {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      delivery_date: formData.date,
      preferred_time: formData.time,
      comments: formData.comments.trim(),
    },
    fulfillment: {
      type: formData.fulfillment,
      label: isDelivery ? 'Delivery' : 'Retiro',
      address: isDelivery ? formData.address.trim() : '',
      delivery_zone: deliveryZone?.value ?? '',
      delivery_zone_label: deliveryZone?.label ?? '',
      delivery_fee_clp: deliveryFee,
      delivery_fee_known: !isDelivery || !deliveryFeePending,
      delivery_note: isDelivery ? deliveryZone.note : '',
    },
    payment: {
      method: formData.paymentMethod,
      label: formData.paymentMethod === 'cash' ? 'Efectivo' : 'Transferencia',
    },
    items: cartItems.map(item => ({
      id: item.id,
      name: item.name,
      unit_price: item.price,
      quantity: item.quantity,
      subtotal: item.price * item.quantity,
    })),
    summary: {
      item_count: cartItems.reduce((s, i) => s + i.quantity, 0),
      subtotal_products_clp: productSubtotal,
      delivery_fee_clp: deliveryFee,
      delivery_fee_pending: deliveryFeePending,
      total_clp: total,
    },
  };
}

/* ── Botón cantidad con glow ring al hover ───────────────────── */
function QtyButton({ onClick, children, label, reducedMotion = false }) {
  const [hov, setHov] = useState(false);
  return (
    <motion.button
      whileTap={{ scale: 0.82 }}
      onHoverStart={reducedMotion ? undefined : () => setHov(true)}
      onHoverEnd={reducedMotion ? undefined : () => setHov(false)}
      animate={reducedMotion ? undefined : {
        scale: hov ? 1.14 : 1,
        boxShadow: hov
          ? '0 0 0 3px rgba(190,24,93,0.22), 0 2px 10px rgba(190,24,93,0.20)'
          : '0 0 0 0px rgba(190,24,93,0)',
      }}
      transition={reducedMotion ? { duration: 0.16 } : { type: 'spring', stiffness: 420, damping: 22 }}
      onClick={onClick}
      aria-label={label}
      className="w-8 h-8 rounded-xl flex items-center justify-center"
      style={{
        background: hov ? 'rgba(190,24,93,0.14)' : 'rgba(190,24,93,0.07)',
        border: `1px solid ${hov ? 'rgba(190,24,93,0.40)' : 'rgba(190,24,93,0.18)'}`,
        color: '#be185d',
        transition: 'background 0.2s, border-color 0.2s',
      }}
    >
      {children}
    </motion.button>
  );
}

/* ── CartItemRow — Tarjeta de producto con identidad propia ──── */
function CartItemRow({ item, index, onRemove, onQty, reducedMotion = false }) {
  const [hov, setHov] = useState(false);

  return (
    <motion.div
      layout={!reducedMotion}
      key={item.id}
      initial={reducedMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, x: 40, scale: 0.93 }}
      transition={reducedMotion ? { duration: 0.18 } : { delay: index * 0.05, layout: { type: 'spring', stiffness: 320, damping: 28 } }}
      onHoverStart={reducedMotion ? undefined : () => setHov(true)}
      onHoverEnd={reducedMotion ? undefined : () => setHov(false)}
      className="flex gap-4 p-4 rounded-2xl"
      style={{
        background: hov
          ? 'rgba(255,255,255,0.88)'
          : 'rgba(255,255,255,0.70)',
        backdropFilter: 'blur(14px)',
        border: hov
          ? '1px solid rgba(190,24,93,0.30)'
          : '1px solid rgba(249,168,212,0.25)',
        boxShadow: hov
          ? '0 8px 28px rgba(190,24,93,0.12)'
          : '0 2px 12px rgba(190,24,93,0.06)',
        transition: 'background 0.25s, border-color 0.25s, box-shadow 0.25s',
      }}
    >
      {/* Imagen / Emoji con lift sutil al hover */}
      <motion.div
        animate={reducedMotion ? undefined : { scale: hov ? 1.05 : 1, rotate: hov ? -2 : 0 }}
        transition={reducedMotion ? { duration: 0.16 } : { type: 'spring', stiffness: 340, damping: 22 }}
        className="shrink-0"
      >
        {item.image ? (
          <OptimizedImage
            src={item.image}
            alt={item.name}
            sizes="80px"
            className="w-20 h-20 object-cover rounded-xl shadow-sm"
          />
        ) : (
          <div
            className="w-20 h-20 rounded-xl flex items-center justify-center text-3xl shadow-sm"
            style={{
              background: 'linear-gradient(135deg, #fce7f3, #fff7fb)',
              border: '1px solid rgba(249,168,212,0.35)',
            }}
          >
            {item.emoji ?? '🎂'}
          </div>
        )}
      </motion.div>

      {/* Info */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div className="flex justify-between items-start gap-2">
          <h4 className="font-serif font-bold text-[#3f2128] leading-tight text-base truncate">
            {item.name}
          </h4>
          {/* Botón eliminar — aparece suave al hover de la card */}
          <motion.button
            whileTap={{ scale: 0.82 }}
            animate={{ opacity: hov ? 1 : 0.35 }}
            onClick={() => onRemove(item.id)}
            aria-label={`Eliminar ${item.name}`}
            className="p-1.5 rounded-xl text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </motion.button>
        </div>

        <div className="flex justify-between items-center mt-3">
          {/* ── Precio con Digit Flip — split-flap display ── */}
          <div className="flex items-center gap-0.5 tabular-nums" aria-label={formatCLP(item.price * item.quantity)}>
            {reducedMotion ? (
              <span className="text-base font-bold leading-[1.4] text-[#be185d]">
                {formatCLP(item.price * item.quantity)}
              </span>
            ) : (
              formatCLP(item.price * item.quantity).split('').map((char, ci) => (
                <div
                  key={ci}
                  style={{ position: 'relative', overflow: 'hidden', height: '1.4em', minWidth: char === '.' || char === ',' ? '0.35em' : '0.6em' }}
                >
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={`${ci}-${char}`}
                      initial={{ y: '-100%', opacity: 0 }}
                      animate={{ y: '0%', opacity: 1 }}
                      exit={{ y: '100%', opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 380, damping: 28, mass: 0.6 }}
                      style={{
                        display: 'block',
                        fontWeight: 700,
                        fontSize: '1rem',
                        color: '#be185d',
                        lineHeight: 1.4,
                      }}
                    >
                      {char}
                    </motion.span>
                  </AnimatePresence>
                </div>
              ))
            )}
          </div>

          {/* Controles Qty */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-2xl"
            style={{
              background: 'rgba(255,255,255,0.85)',
              border: '1px solid rgba(190,24,93,0.14)',
            }}
          >
            <QtyButton
              onClick={() => onQty(item.id, item.quantity - 1)}
              label="Reducir cantidad"
              reducedMotion={reducedMotion}
            >
              <Minus className="w-3 h-3" />
            </QtyButton>

            {/* Número con rebote al cambiar */}
            {reducedMotion ? (
              <span className="w-5 text-center text-sm font-bold tabular-nums text-[#3f2128]">
                {item.quantity}
              </span>
            ) : (
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={item.quantity}
                  initial={{ scale: 1.4, opacity: 0, y: -6 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.7, opacity: 0, y: 6 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                  className="text-sm font-bold w-5 text-center tabular-nums"
                  style={{ color: '#3f2128' }}
                >
                  {item.quantity}
                </motion.span>
              </AnimatePresence>
            )}

            <QtyButton
              onClick={() => onQty(item.id, item.quantity + 1)}
              label="Aumentar cantidad"
              reducedMotion={reducedMotion}
            >
              <Plus className="w-3 h-3" />
            </QtyButton>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Upsell Card ─────────────────────────────────────────────── */
function UpsellCard({ item, onAdd, added, reducedMotion = false }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      onHoverStart={reducedMotion ? undefined : () => setHovered(true)}
      onHoverEnd={reducedMotion ? undefined : () => setHovered(false)}
      animate={reducedMotion ? undefined : { scale: hovered ? 1.02 : 1, y: hovered ? -2 : 0 }}
      transition={reducedMotion ? { duration: 0.16 } : { type: 'spring', stiffness: 380, damping: 26 }}
      className="relative flex items-center gap-3 p-3.5 rounded-2xl"
      style={{
        background: `linear-gradient(135deg, ${item.gradientFrom}, ${item.gradientTo})`,
        border: `1.5px solid ${hovered ? item.borderHover : item.border}`,
        boxShadow: hovered ? `0 8px 24px ${item.accent}22` : '0 2px 8px rgba(0,0,0,0.05)',
        transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
      }}
    >
      <span
        className="absolute -top-2.5 left-3 text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full text-white"
        style={{ backgroundColor: item.accent }}
      >
        {item.tag}
      </span>
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
        style={{ background: `${item.accent}15`, border: `1px solid ${item.accent}20` }}
      >
        {item.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-[#3f2128] leading-tight truncate">{item.name}</p>
        <p className="text-[11px] text-[#3f2128]/50 mt-0.5 truncate">{item.subtitle}</p>
        <p className="text-sm font-bold mt-1" style={{ color: item.accent }}>{formatCLP(item.price)}</p>
      </div>
      <motion.button
        onClick={() => onAdd(item)}
        whileTap={{ scale: 0.85 }}
        animate={{ backgroundColor: added ? '#22c55e' : hovered ? item.accent : `${item.accent}cc` }}
        transition={{ duration: 0.28 }}
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white shadow-sm"
        aria-label={`Agregar ${item.name}`}
      >
        <AnimatePresence mode="wait">
          {added ? (
            <motion.span key="check" initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }} className="font-bold text-base leading-none">✓</motion.span>
          ) : (
            <motion.div key="plus" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
              <Plus className="w-4 h-4" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </motion.div>
  );
}

/* ── Botón CTA con shimmer ───────────────────────────────────── */
function PrimaryButton({ onClick, disabled, type = 'button', form, children, variant = 'pink' }) {
  const [hovered, setHovered] = useState(false);

  const bg = variant === 'dark'
    ? (hovered ? 'linear-gradient(135deg, #1f1f1f, #3f2128)' : 'linear-gradient(135deg, #3f2128, #1f1f1f)')
    : (hovered ? 'linear-gradient(135deg, #9f1239, #be185d, #f472b6)' : 'linear-gradient(135deg, #be185d, #e11d72)');

  return (
    <motion.button
      type={type}
      form={form}
      onClick={onClick}
      disabled={disabled}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileTap={{ scale: 0.97 }}
      animate={{
        boxShadow: hovered
          ? variant === 'dark'
            ? '0 12px 36px rgba(63,33,40,0.45), 0 0 0 1px rgba(63,33,40,0.2)'
            : '0 12px 40px rgba(190,24,93,0.50), 0 0 0 1px rgba(190,24,93,0.2)'
          : variant === 'dark'
            ? '0 4px 16px rgba(63,33,40,0.25)'
            : '0 4px 20px rgba(190,24,93,0.30)',
        y: hovered ? -2 : 0,
      }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className="relative flex-1 py-4 px-6 rounded-2xl font-bold text-white text-sm tracking-wide overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ background: bg, transition: 'background 0.35s ease' }}
    >
      {/* Shimmer sweep */}
      <motion.span
        animate={{ x: hovered ? '200%' : '-100%' }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
        className="absolute inset-0 w-1/3 pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)',
          transform: 'skewX(-20deg)',
        }}
      />
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </motion.button>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN CartModal
════════════════════════════════════════════════════════════════ */
const CartModal = () => {
  const {
    isCartOpen, closeCart,
    cartItems, addToCart, updateQuantity, removeItem,
  } = useCart();
  const prefersReducedMotion = useReducedMotion();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    date: '',
    time: '',
    fulfillment: 'pickup',
    deliveryZone: DEFAULT_DELIVERY_ZONE,
    address: '',
    paymentMethod: 'transfer',
    comments: '',
  });
  const [errors, setErrors] = useState({});
  const [recentlyAdded, setRecentlyAdded] = useState({});

  const reduceCartMotion = useMemo(
    () => Boolean(prefersReducedMotion || isMobileViewport()),
    [prefersReducedMotion]
  );
  const minCheckoutDate = useMemo(() => getMinCheckoutDate(), []);
  const orderSummary = useMemo(() => {
    const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const productSubtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryZone = getDeliveryZone(formData.deliveryZone);
    const deliveryFee = formData.fulfillment === 'delivery' && deliveryZone.feeKnown ? deliveryZone.fee : 0;
    const deliveryFeePending = formData.fulfillment === 'delivery' && !deliveryZone.feeKnown;

    return {
      itemCount,
      productSubtotal,
      deliveryZone,
      deliveryFee,
      deliveryFeePending,
      total: productSubtotal + deliveryFee,
    };
  }, [cartItems, formData.fulfillment, formData.deliveryZone]);
  const {
    itemCount,
    productSubtotal,
    deliveryZone: checkoutDeliveryZone,
    deliveryFee: checkoutDeliveryFee,
    deliveryFeePending: checkoutDeliveryFeePending,
    total: checkoutTotal,
  } = orderSummary;

  const handleClose = () => {
    closeCart();
    setTimeout(() => setStep(1), 350);
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validateCheckout = () => {
    const nextErrors = {};
    const phoneDigits = formData.phone.replace(/\D/g, '');

    if (formData.name.trim().length < 3) nextErrors.name = 'Ingresa tu nombre completo.';
    if (phoneDigits.length < 8) nextErrors.phone = 'Agrega un teléfono válido para confirmar.';
    if (!formData.date) nextErrors.date = 'Elige una fecha de entrega.';
    if (formData.date && formData.date < minCheckoutDate) {
      nextErrors.date = 'Elige una fecha con al menos 48 horas de anticipación.';
    }
    if (!formData.time) nextErrors.time = 'Indica una hora preferida.';
    if (formData.fulfillment === 'delivery' && formData.address.trim().length < 8) {
      nextErrors.address = 'Agrega una dirección clara para confirmar delivery.';
    }
    if (formData.fulfillment === 'delivery' && !formData.deliveryZone) {
      nextErrors.deliveryZone = 'Elige un sector para coordinar el delivery.';
    }
    if (!formData.paymentMethod) nextErrors.paymentMethod = 'Elige transferencia o efectivo.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  /* ── DATA SCIENCE — Finalizar pedido ───────────────────────
     trackEvent imprime el JSON en consola para analítica.
     El try/catch del webhook está listo para activar.
  ─────────────────────────────────────────────────────────── */
  const handleWhatsAppOrder = async (e) => {
    e.preventDefault();
    if (!validateCheckout()) return;

    const payload = buildOrderPayload(cartItems, productSubtotal, formData);

    // 📊 DATA SCIENCE — Click event del botón de finalizar
    trackEvent('checkout_complete', {
      order_id: payload.order_id,
      customer_name: payload.customer.name,
      delivery_date: payload.customer.delivery_date,
      preferred_time: payload.customer.preferred_time,
      fulfillment_type: payload.fulfillment.type,
      delivery_zone: payload.fulfillment.delivery_zone,
      delivery_fee_known: payload.fulfillment.delivery_fee_known,
      payment_method: payload.payment.method,
      delivery_fee_clp: payload.summary.delivery_fee_clp,
      item_count: payload.summary.item_count,
      total_clp: payload.summary.total_clp,
      items: payload.items.map(i => ({ id: i.id, name: i.name, qty: i.quantity })),
    });

    // 🔗 Webhook — Activa reemplazando WEBHOOK_URL con tu endpoint Make.com / Zapier
    // Trigger: "Custom Webhook" → "Google Sheets: Add Row" → mapea campos del payload
    /*
    try {
      const WEBHOOK_URL = 'https://hook.eu1.make.com/TU_WEBHOOK_ID_AQUI';
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      console.info('[DulceMae] Webhook OK:', payload.order_id);
    } catch (err) {
      // Silencioso intencional — loguea para debug, nunca bloquea al cliente
      console.warn('[DulceMae] Webhook no disponible, pedido continúa:', err.message);
    }
    */

    // 📱 Mensaje WhatsApp — version final limpia para enviar al cliente.
    const dateFormatted = new Date(payload.customer.delivery_date + 'T12:00:00')
      .toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const cleanItemLines = payload.items
      .map(i => `- ${i.quantity}x ${i.name} | ${formatCLP(i.subtotal)}`)
      .join('\n');

    const deliveryLines = payload.fulfillment.type === 'delivery'
      ? [
          `Modalidad: Delivery`,
          `Sector: ${payload.fulfillment.delivery_zone_label}`,
          `Dirección: ${payload.fulfillment.address}`,
          payload.fulfillment.delivery_fee_known
            ? `Delivery: ${formatCLP(payload.summary.delivery_fee_clp)}`
            : `Delivery: por coordinar`,
        ]
      : [
          `Modalidad: Retiro`,
          `Retiro: coordinar retiro en DulceMae`,
        ];

    const totalLine = payload.summary.delivery_fee_pending
      ? `*Total parcial productos: ${formatCLP(payload.summary.total_clp)}* (delivery por confirmar)`
      : `*Total estimado: ${formatCLP(payload.summary.total_clp)}*`;

    const finalWhatsAppMessage = [
      `Hola DulceMae, soy *${payload.customer.name}* y quiero hacer un pedido.`,
      ``,
      `*Pedido*`,
      cleanItemLines,
      ``,
      `*Datos del pedido*`,
      `Teléfono: ${payload.customer.phone}`,
      `Fecha deseada: ${dateFormatted}`,
      `Hora preferida: ${payload.customer.preferred_time}`,
      ...deliveryLines,
      `Pago: ${payload.payment.label}`,
      payload.customer.comments ? `Comentarios: ${payload.customer.comments}` : null,
      ``,
      `*Resumen*`,
      `Subtotal productos: ${formatCLP(payload.summary.subtotal_products_clp)}`,
      payload.summary.delivery_fee_clp > 0 ? `Delivery: ${formatCLP(payload.summary.delivery_fee_clp)}` : null,
      totalLine,
      payload.fulfillment.delivery_note ? `_Nota: ${payload.fulfillment.delivery_note}_` : null,
      ``,
      `Referencia: ${payload.order_id}`,
      ``,
      `Quedo atenta a su confirmación. Muchas gracias.`,
    ].filter(Boolean).join('\n');

    window.open(`https://wa.me/56975562291?text=${encodeURIComponent(finalWhatsAppMessage)}`, '_blank');
  };

  function handleUpsellAdd(upsellItem) {
    addToCart({
      id: upsellItem.id,
      name: upsellItem.name,
      price: upsellItem.price,
      image: null,
      emoji: upsellItem.emoji,
    });
    setRecentlyAdded(prev => ({ ...prev, [upsellItem.id]: true }));
    setTimeout(() => setRecentlyAdded(prev => ({ ...prev, [upsellItem.id]: false })), 1800);

    // 📊 Analytics — upsell añadido
    trackEvent('upsell_added', { item_id: upsellItem.id, item_name: upsellItem.name, price: upsellItem.price });
  }

  const visibleUpsells = useMemo(
    () => UPSELL_ITEMS.filter(u => !cartItems.some(i => i.id === u.id)),
    [cartItems]
  );
  const atelierPromise = useMemo(
    () => (cartItems.length > 0 ? getAtelierPromise(cartItems) : null),
    [cartItems]
  );

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/45 backdrop-blur-[3px] z-[210]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%', opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0.5 }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="fixed top-0 right-0 h-full w-full max-w-md shadow-2xl z-[230] flex flex-col"
            style={{
              background: 'linear-gradient(160deg, rgba(255,255,255,0.92) 0%, rgba(252,231,243,0.88) 100%)',
              backdropFilter: 'blur(28px) saturate(180%)',
              WebkitBackdropFilter: 'blur(28px) saturate(180%)',
              borderLeft: '1px solid rgba(249,168,212,0.35)',
            }}
          >
            {/* ── HEADER ─────────────────────────────────────────── */}
            <div className="relative px-8 pt-7 pb-5 border-b border-pink-100/70">
              {/* Franja decorativa superior */}
              <div
                className="absolute top-0 left-0 right-0 h-[3px]"
                style={{ background: 'linear-gradient(90deg, transparent, #be185d 20%, #f472b6 50%, #be185d 80%, transparent)' }}
              />

              {/* Layout: centrado con botón X absoluto a la derecha */}
              <div className="flex flex-col items-center text-center">
                {/* ── SELLO LACRE — cae con rebote al abrir ── */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, scale: 0.7, y: -16, rotate: -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 8 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.05 }}
                  >
                    <SealStamp label={step === 1 ? 'Tu Pedido' : 'Finalizar'} />
                  </motion.div>
                </AnimatePresence>

                {/* Badge cantidad */}
                <AnimatePresence mode="wait">
                  {itemCount > 0 ? (
                    <motion.p
                      key={itemCount}
                      initial={{ scale: 0.75, opacity: 0, y: 4 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.75, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                      className="mt-2 font-semibold"
                      style={{ color: '#be185d', fontSize: '0.88rem' }}
                    >
                      {itemCount} {itemCount === 1 ? 'producto seleccionado' : 'productos seleccionados'}
                    </motion.p>
                  ) : (
                    <motion.p
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-2 text-sm font-medium text-[#3f2128]/40"
                    >
                      Tu carrito está vacío
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Botón cerrar — círculo glassmorphism con rotación hover */}
              <motion.button
                whileTap={{ scale: 0.88 }}
                whileHover={{ rotate: 90, scale: 1.08 }}
                transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                onClick={handleClose}
                aria-label="Cerrar carrito"
                className="absolute top-1/2 right-7 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  background: 'rgba(255,255,255,0.60)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(190,24,93,0.18)',
                  boxShadow: '0 2px 12px rgba(190,24,93,0.10)',
                }}
              >
                <X className="w-4 h-4" style={{ color: '#3f2128', strokeWidth: 1.75 }} />
              </motion.button>
            </div>

            {/* ── BODY ───────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-8 py-6" style={{ scrollbarWidth: 'thin' }}>

              {/* ── STEP 1: Carrito ── */}
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col gap-6"
                >
                  {/* Estado vacío */}
                  {cartItems.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center justify-center py-14 text-center"
                      style={{ position:'relative' }}
                    >
                      {/* Ilustración animada — tazón con vapor */}
                      <EmptyCartIllustration />

                      <p className="font-serif text-2xl font-bold text-[#3f2128] mb-2">
                        Tu carrito espera
                      </p>
                      <p className="text-sm text-[#3f2128]/45 max-w-xs leading-relaxed font-medium">
                        Explora nuestro catálogo y añade las delicias que te enamoren 🍰
                      </p>

                      {/* Partículas decorativas de fondo */}
                      {['✦','·','✦','·','✦'].map((s,i) => (
                        <motion.span
                          key={i}
                          animate={{ y: [0,-8,0], opacity:[0.15,0.4,0.15] }}
                          transition={{ duration: 2.5+i*0.4, repeat:Infinity, delay: i*0.5 }}
                          style={{
                            position:'absolute',
                            left: `${15 + i*17}%`,
                            top: `${20 + (i%2)*30}%`,
                            fontSize: i%2===0 ? '0.5rem' : '0.35rem',
                            color:'#be185d',
                            pointerEvents:'none',
                            userSelect:'none',
                          }}
                        >{s}</motion.span>
                      ))}
                    </motion.div>
                  ) : (
                    /* Items del carrito */
                    <div className="flex flex-col gap-4">
                      {cartItems.map((item, index) => (
                        <CartItemRow
                          key={item.id}
                          item={item}
                          index={index}
                          onRemove={removeItem}
                          onQty={updateQuantity}
                          reducedMotion={reduceCartMotion}
                        />
                      ))}
                    </div>
                  )}

                  {/* Upsells */}
                  {visibleUpsells.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                    >
                      <div className="flex items-center gap-2 mb-4 mt-2">
                        <Sparkles className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                        <span className="text-[11px] font-bold tracking-widest uppercase text-pink-400 whitespace-nowrap">
                          Completa tu pedido
                        </span>
                        <div className="flex-1 h-px bg-gradient-to-r from-pink-200/80 to-transparent" />
                      </div>
                      <div className="flex flex-col gap-4">
                        {visibleUpsells.map((item, i) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.18 + i * 0.07 }}
                          >
                            <UpsellCard item={item} onAdd={handleUpsellAdd} added={!!recentlyAdded[item.id]} reducedMotion={reduceCartMotion} />
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* ── STEP 2: Checkout ── */}
              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <form id="checkout-form" onSubmit={handleWhatsAppOrder} className="space-y-6">
                    {/* Resumen total — destacado */}
                    <div
                      className="p-6 rounded-3xl relative overflow-hidden"
                      style={{
                        background: 'linear-gradient(135deg, rgba(190,24,93,0.08) 0%, rgba(244,114,182,0.12) 100%)',
                        border: '1px solid rgba(190,24,93,0.18)',
                      }}
                    >
                      <div
                        className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
                        style={{
                          background: 'radial-gradient(circle, rgba(244,114,182,0.15) 0%, transparent 70%)',
                          transform: 'translate(30%, -30%)',
                        }}
                      />
                      <p className="text-xs font-bold tracking-widest uppercase text-[#be185d]/60 mb-1">
                        {checkoutDeliveryFeePending ? 'Total parcial' : 'Total a pagar'}
                      </p>
                      <motion.p
                        key={checkoutTotal}
                        initial={{ scale: 1.05 }}
                        animate={{ scale: 1 }}
                        className="font-serif text-4xl font-bold text-[#3f2128]"
                      >
                        {formatCLP(checkoutTotal)}
                      </motion.p>
                      <div className="mt-2 space-y-1 text-xs font-medium text-[#3f2128]/48">
                        <p>{itemCount} {itemCount === 1 ? 'producto' : 'productos'} · productos {formatCLP(productSubtotal)}</p>
                        {formData.fulfillment === 'delivery' && <p>Sector {checkoutDeliveryZone.label}</p>}
                        {checkoutDeliveryFee > 0 && <p>Delivery estimado {formatCLP(checkoutDeliveryFee)}</p>}
                        {checkoutDeliveryFeePending && <p>Delivery por confirmar según sector</p>}
                      </div>
                    </div>

                    {/* Campos */}
                    <div className="space-y-4">
                      {/* Nombre */}
                      <div>
                        <label className="block text-sm font-bold text-[#3f2128]/70 mb-2 ml-1">
                          Nombre Completo
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <User className="w-4 h-4 text-pink-300" />
                          </div>
                          <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => updateField('name', e.target.value)}
                            className="min-h-[48px] w-full pl-11 pr-4 py-3.5 rounded-2xl outline-none transition-all placeholder-gray-400 text-sm font-medium"
                            style={{
                              background: 'rgba(255,255,255,0.75)',
                              border: '1.5px solid rgba(249,168,212,0.35)',
                              color: '#3f2128',
                            }}
                            onFocus={(e) => e.target.style.border = '1.5px solid rgba(190,24,93,0.50)'}
                            onBlur={(e) => e.target.style.border = '1.5px solid rgba(249,168,212,0.35)'}
                            placeholder="Ej. Camila Rojas"
                          />
                        </div>
                        {errors.name && (
                          <p className="mt-2 ml-1 flex items-center gap-1.5 text-xs font-semibold text-red-500">
                            <AlertCircle className="h-3.5 w-3.5" /> {errors.name}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-[#3f2128]/70 mb-2 ml-1">
                          Teléfono
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Phone className="w-4 h-4 text-pink-300" />
                          </div>
                          <input
                            type="tel"
                            required
                            value={formData.phone}
                            onChange={(e) => updateField('phone', e.target.value)}
                            className="min-h-[48px] w-full pl-11 pr-4 py-3.5 rounded-2xl outline-none transition-all placeholder-gray-400 text-sm font-medium"
                            style={{
                              background: 'rgba(255,255,255,0.75)',
                              border: errors.phone ? '1.5px solid rgba(239,68,68,0.55)' : '1.5px solid rgba(249,168,212,0.35)',
                              color: '#3f2128',
                            }}
                            placeholder="+56 9 1234 5678"
                          />
                        </div>
                        {errors.phone && (
                          <p className="mt-2 ml-1 flex items-center gap-1.5 text-xs font-semibold text-red-500">
                            <AlertCircle className="h-3.5 w-3.5" /> {errors.phone}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-[#3f2128]/70 mb-2 ml-1">
                          Retiro o delivery
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { value: 'pickup', label: 'Retiro', Icon: Home, detail: 'Sin costo' },
                            { value: 'delivery', label: 'Delivery', Icon: MapPin, detail: `Desde ${formatCLP(ALERCE_DELIVERY_FEE_CLP)}` },
                          ].map(({ value, label, Icon, detail }) => {
                            const active = formData.fulfillment === value;
                            return (
                              <button
                                key={value}
                                type="button"
                                onClick={() => updateField('fulfillment', value)}
                                className="min-h-[54px] rounded-2xl border px-3 py-3 text-left transition"
                                style={{
                                  background: active ? 'rgba(190,24,93,0.10)' : 'rgba(255,255,255,0.70)',
                                  borderColor: active ? 'rgba(190,24,93,0.42)' : 'rgba(249,168,212,0.32)',
                                }}
                              >
                                <span className="flex items-center gap-2 text-sm font-bold text-[#3f2128]">
                                  <Icon className="h-4 w-4 text-[#be185d]" />
                                  {label}
                                </span>
                                <span className="mt-1 block text-xs font-semibold text-[#3f2128]/45">{detail}</span>
                              </button>
                            );
                          })}
                        </div>
                        {formData.fulfillment === 'delivery' && (
                          <p className="mt-2 ml-1 text-xs font-medium leading-snug text-[#3f2128]/42">
                            El costo se calcula según el sector elegido antes de enviar el pedido.
                          </p>
                        )}
                      </div>

                      {formData.fulfillment === 'delivery' && (
                        <div>
                          <label className="block text-sm font-bold text-[#3f2128]/70 mb-2 ml-1">
                            Sector de delivery
                          </label>
                          <div className="grid gap-2">
                            {DELIVERY_ZONES.map(zone => {
                              const active = formData.deliveryZone === zone.value;
                              return (
                                <button
                                  key={zone.value}
                                  type="button"
                                  onClick={() => updateField('deliveryZone', zone.value)}
                                  className="flex min-h-[54px] items-center justify-between gap-3 rounded-2xl border px-3 py-3 text-left transition"
                                  style={{
                                    background: active ? 'rgba(190,24,93,0.10)' : 'rgba(255,255,255,0.70)',
                                    borderColor: active ? 'rgba(190,24,93,0.42)' : 'rgba(249,168,212,0.32)',
                                  }}
                                >
                                  <span>
                                    <span className="block text-sm font-bold text-[#3f2128]">{zone.label}</span>
                                    <span className="mt-0.5 block text-xs font-semibold text-[#3f2128]/45">{zone.note}</span>
                                  </span>
                                  <span className="shrink-0 rounded-full bg-white/70 px-3 py-1 text-[11px] font-bold text-[#be185d]">
                                    {zone.detail}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                          {errors.deliveryZone && (
                            <p className="mt-2 ml-1 flex items-center gap-1.5 text-xs font-semibold text-red-500">
                              <AlertCircle className="h-3.5 w-3.5" /> {errors.deliveryZone}
                            </p>
                          )}
                        </div>
                      )}

                      {formData.fulfillment === 'delivery' && (
                        <div>
                          <label className="block text-sm font-bold text-[#3f2128]/70 mb-2 ml-1">
                            Dirección de entrega
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                              <MapPin className="w-4 h-4 text-pink-300" />
                            </div>
                            <input
                              type="text"
                              required
                              value={formData.address}
                              onChange={(e) => updateField('address', e.target.value)}
                              className="min-h-[48px] w-full pl-11 pr-4 py-3.5 rounded-2xl outline-none transition-all placeholder-gray-400 text-sm font-medium"
                              style={{
                                background: 'rgba(255,255,255,0.75)',
                                border: errors.address ? '1.5px solid rgba(239,68,68,0.55)' : '1.5px solid rgba(249,168,212,0.35)',
                                color: '#3f2128',
                              }}
                              placeholder="Calle, número, sector o referencia"
                            />
                          </div>
                          {errors.address && (
                            <p className="mt-2 ml-1 flex items-center gap-1.5 text-xs font-semibold text-red-500">
                              <AlertCircle className="h-3.5 w-3.5" /> {errors.address}
                            </p>
                          )}
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-bold text-[#3f2128]/70 mb-2 ml-1">
                          Método de pago
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { value: 'transfer', label: 'Transferencia' },
                            { value: 'cash', label: 'Efectivo' },
                          ].map(({ value, label }) => {
                            const active = formData.paymentMethod === value;
                            return (
                              <button
                                key={value}
                                type="button"
                                onClick={() => updateField('paymentMethod', value)}
                                className="flex min-h-[52px] items-center gap-2 rounded-2xl border px-3 py-3 text-sm font-bold transition"
                                style={{
                                  background: active ? 'rgba(190,24,93,0.10)' : 'rgba(255,255,255,0.70)',
                                  borderColor: active ? 'rgba(190,24,93,0.42)' : 'rgba(249,168,212,0.32)',
                                  color: '#3f2128',
                                }}
                              >
                                <CreditCard className="h-4 w-4 text-[#be185d]" />
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Fecha */}
                      <div>
                        <label className="block text-sm font-bold text-[#3f2128]/70 mb-2 ml-1">
                          Fecha de Entrega
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Calendar className="w-4 h-4 text-pink-300" />
                          </div>
                          <input
                            type="date"
                            required
                            min={minCheckoutDate}
                            value={formData.date}
                            onChange={(e) => updateField('date', e.target.value)}
                            className="min-h-[48px] w-full pl-11 pr-4 py-3.5 rounded-2xl outline-none transition-all text-sm font-medium"
                            style={{
                              background: 'rgba(255,255,255,0.75)',
                              border: errors.date ? '1.5px solid rgba(239,68,68,0.55)' : '1.5px solid rgba(249,168,212,0.35)',
                              color: '#3f2128',
                            }}
                            onFocus={(e) => e.target.style.border = '1.5px solid rgba(190,24,93,0.50)'}
                            onBlur={(e) => e.target.style.border = errors.date ? '1.5px solid rgba(239,68,68,0.55)' : '1.5px solid rgba(249,168,212,0.35)'}
                          />
                        </div>
                        <p className="text-xs text-[#3f2128]/38 mt-2 ml-1 font-medium leading-snug">
                          ✦ Los pedidos requieren un mínimo de 48 horas de anticipación.
                        </p>
                        {errors.date && (
                          <p className="mt-2 ml-1 flex items-center gap-1.5 text-xs font-semibold text-red-500">
                            <AlertCircle className="h-3.5 w-3.5" /> {errors.date}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-[#3f2128]/70 mb-2 ml-1">
                          Hora preferida
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Clock3 className="w-4 h-4 text-pink-300" />
                          </div>
                          <input
                            type="time"
                            required
                            value={formData.time}
                            onChange={(e) => updateField('time', e.target.value)}
                            className="min-h-[48px] w-full pl-11 pr-4 py-3.5 rounded-2xl outline-none transition-all text-sm font-medium"
                            style={{
                              background: 'rgba(255,255,255,0.75)',
                              border: errors.time ? '1.5px solid rgba(239,68,68,0.55)' : '1.5px solid rgba(249,168,212,0.35)',
                              color: '#3f2128',
                            }}
                          />
                        </div>
                        {errors.time && (
                          <p className="mt-2 ml-1 flex items-center gap-1.5 text-xs font-semibold text-red-500">
                            <AlertCircle className="h-3.5 w-3.5" /> {errors.time}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-[#3f2128]/70 mb-2 ml-1">
                          Comentarios
                        </label>
                        <div className="relative">
                          <div className="absolute top-3.5 left-0 pl-4 pointer-events-none">
                            <MessageSquare className="w-4 h-4 text-pink-300" />
                          </div>
                          <textarea
                            rows={3}
                            value={formData.comments}
                            onChange={(e) => updateField('comments', e.target.value)}
                            className="w-full resize-none pl-11 pr-4 py-3.5 rounded-2xl outline-none transition-all placeholder-gray-400 text-sm font-medium"
                            style={{
                              background: 'rgba(255,255,255,0.75)',
                              border: '1.5px solid rgba(249,168,212,0.35)',
                              color: '#3f2128',
                            }}
                            placeholder="Dedicatoria, alergias, retiro, entrega o detalles del diseño."
                          />
                        </div>
                      </div>
                    </div>
                  </form>
                </motion.div>
              )}
            </div>

            {/* ── FOOTER ─────────────────────────────────────────── */}
            <div
              className="px-8 py-5 border-t"
              style={{
                borderColor: 'rgba(249,168,212,0.35)',
                background: 'rgba(255,255,255,0.55)',
                backdropFilter: 'blur(20px)',
              }}
            >
              {step === 1 ? (
                <div className="space-y-4">
                  {/* Total premium con barra decorativa animada */}
                  <div className="relative flex justify-between items-center py-3 px-4 rounded-2xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(190,24,93,0.05), rgba(244,114,182,0.08))',
                      border: '1px solid rgba(190,24,93,0.12)',
                    }}
                  >
                    {/* Borde izq decorativo */}
                    <div style={{ position:'absolute', left:0, top:'20%', bottom:'20%', width:3, borderRadius:999,
                      background:'linear-gradient(to bottom, #be185d, #f472b6)' }} />
                    <div className="pl-2">
                      <p className="text-[10px] font-bold tracking-widest uppercase text-[#be185d]/50 mb-0.5">Total estimado</p>
                      <span className="font-serif text-lg font-bold text-[#3f2128]">Tu pedido</span>
                    </div>
                    <motion.span
                      key={productSubtotal}
                      initial={{ scale: 1.18, color: '#f472b6', y: -4 }}
                      animate={{ scale: 1, color: '#be185d', y: 0 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 18 }}
                      className="font-serif text-2xl font-bold tabular-nums"
                    >
                      {formatCLP(productSubtotal)}
                    </motion.span>
                  </div>

                  {atelierPromise && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="relative overflow-hidden rounded-2xl px-4 py-3"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.84), rgba(255,247,237,0.56) 48%, rgba(252,231,243,0.64))',
                        border: '1px solid rgba(190,24,93,0.14)',
                        boxShadow: '0 8px 28px rgba(190,24,93,0.08), inset 0 1px 0 rgba(255,255,255,0.74)',
                      }}
                    >
                      <div
                        className="absolute -right-8 -top-10 h-24 w-24 rounded-full pointer-events-none"
                        style={{ background: 'radial-gradient(circle, rgba(253,224,138,0.34), transparent 70%)' }}
                      />
                      <div className="relative flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#be185d]/10"
                          style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)' }}>
                          <Sparkles className="h-4 w-4 text-[#be185d]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#be185d]/60">
                              {atelierPromise.title}
                            </p>
                            <span className="rounded-full bg-white/70 px-2.5 py-1 text-[10px] font-bold text-[#be185d]">
                              {atelierPromise.window}
                            </span>
                          </div>
                          <p className="mt-1 text-xs font-medium leading-relaxed text-[#3f2128]/48">
                            {atelierPromise.detail}
                          </p>
                          <div className="mt-3 grid grid-cols-3 gap-2">
                            {atelierPromise.stages.map((stage, stageIndex) => (
                              <div
                                key={stage}
                                className="rounded-xl border border-white/70 bg-white/58 px-2 py-1.5 text-center"
                              >
                                <span className="block text-[9px] font-bold text-[#be185d]/38">
                                  0{stageIndex + 1}
                                </span>
                                <span className="block text-[10px] font-bold text-[#3f2128]/62">
                                  {stage}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* CTA con aura pulsante */}
                  <div className="relative">
                    {/* Aura exterior pulsante cuando hay items */}
                    {cartItems.length > 0 && (
                      <motion.div
                        animate={{ scale: [1, 1.04, 1], opacity: [0.35, 0.12, 0.35] }}
                        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute inset-0 rounded-2xl pointer-events-none"
                        style={{ background: 'linear-gradient(135deg,#3f2128,#1f1f1f)', filter: 'blur(12px)' }}
                      />
                    )}
                    <PrimaryButton
                      variant="dark"
                      onClick={() => cartItems.length > 0 && setStep(2)}
                      disabled={cartItems.length === 0}
                    >
                      <span>Continuar al pago</span>
                      <ArrowRight className="w-4 h-4" />
                    </PrimaryButton>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ backgroundColor: 'rgba(249,168,212,0.20)' }}
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-5 py-4 rounded-2xl font-bold text-[#3f2128]/60 transition-colors flex items-center gap-1.5 shrink-0"
                    style={{ border: '1.5px solid rgba(190,24,93,0.18)' }}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="text-sm">Atrás</span>
                  </motion.button>

                  {/* CTA WhatsApp con aura verde */}
                  <div className="relative flex-1">
                    <motion.div
                      animate={{ scale: [1, 1.05, 1], opacity: [0.30, 0.10, 0.30] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute inset-0 rounded-2xl pointer-events-none"
                      style={{ background: 'linear-gradient(135deg,#be185d,#e11d72)', filter: 'blur(14px)' }}
                    />
                    <PrimaryButton variant="pink" type="submit" form="checkout-form">
                      <span>Pedir por WhatsApp</span>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                    </PrimaryButton>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartModal;
