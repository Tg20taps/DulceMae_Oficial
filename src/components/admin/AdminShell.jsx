import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  BarChart3,
  Ban,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Copy,
  CopyCheck,
  Eye,
  EyeOff,
  ExternalLink,
  Lock,
  LogOut,
  Mail,
  MessageCircle,
  PackageCheck,
  PhoneCall,
  RefreshCw,
  ReceiptText,
  Send,
  ShieldCheck,
  Sparkles,
  Truck,
  UserRound,
  X,
} from 'lucide-react';
import {
  adminAllowedEmails,
  isAllowedAdminEmail,
  isSupabaseConfigured,
  supabase,
} from '../../lib/supabaseClient';

const STATUS_LABELS = {
  pending: 'Nuevo',
  confirmed: 'Confirmado',
  preparing: 'En preparación',
  ready: 'Listo',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }));

const ORDER_FILTERS = [
  { value: 'all', label: 'Todos', statuses: null },
  { value: 'pending', label: 'Nuevo', statuses: ['pending'] },
  { value: 'confirmed', label: 'Confirmado', statuses: ['confirmed'] },
  { value: 'preparing', label: 'Preparación', statuses: ['preparing'] },
  { value: 'ready', label: 'Listo', statuses: ['ready'] },
  { value: 'delivered', label: 'Entregado', statuses: ['delivered'] },
  { value: 'cancelled', label: 'Cancelado', statuses: ['cancelled'] },
];

const STATUS_STYLES = {
  pending: {
    badge: 'border-amber-100 bg-amber-50 text-amber-700',
    dot: 'bg-amber-400',
  },
  confirmed: {
    badge: 'border-sky-100 bg-sky-50 text-sky-700',
    dot: 'bg-sky-400',
  },
  preparing: {
    badge: 'border-fuchsia-100 bg-fuchsia-50 text-fuchsia-700',
    dot: 'bg-fuchsia-400',
  },
  ready: {
    badge: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    dot: 'bg-emerald-400',
  },
  delivered: {
    badge: 'border-stone-100 bg-stone-50 text-stone-700',
    dot: 'bg-stone-400',
  },
  cancelled: {
    badge: 'border-red-100 bg-red-50 text-red-600',
    dot: 'bg-red-400',
  },
};

const STATUS_ACTIONS = [
  { value: 'pending', label: 'Nuevo', Icon: Clock3 },
  { value: 'confirmed', label: 'Confirmar', Icon: CheckCircle2 },
  { value: 'preparing', label: 'Preparación', Icon: PackageCheck },
  { value: 'ready', label: 'Listo', Icon: CheckCircle2 },
  { value: 'delivered', label: 'Entregado', Icon: PackageCheck },
];

const CANCELLATION_REASONS = [
  {
    value: 'test_order',
    label: 'Pedido de prueba',
    detail: 'Para pedidos ficticios o pruebas internas.',
  },
  {
    value: 'client_not_confirmed',
    label: 'Cliente no confirmo',
    detail: 'Se pidio confirmacion y no hubo respuesta.',
  },
  {
    value: 'out_of_zone',
    label: 'Fuera de zona',
    detail: 'La entrega no estaba disponible para ese sector.',
  },
  {
    value: 'no_availability',
    label: 'Sin disponibilidad',
    detail: 'No habia cupo para la fecha u hora solicitada.',
  },
  {
    value: 'product_unavailable',
    label: 'Producto no disponible',
    detail: 'Faltaba stock, ingrediente o preparacion posible.',
  },
  {
    value: 'duplicate',
    label: 'Pedido duplicado',
    detail: 'Ya existia otro pedido igual o corregido.',
  },
  {
    value: 'other',
    label: 'Otro motivo',
    detail: 'Usar nota para dejar contexto.',
  },
];

const CANCELLATION_REASON_LABELS = Object.fromEntries(
  CANCELLATION_REASONS.map(reason => [reason.value, reason.label])
);

function formatCLP(value) {
  const numeric = Number(value) || 0;
  return `$${numeric.toLocaleString('es-CL')}`;
}

function getOrderTotal(order) {
  return (
    order?.total_clp ??
    order?.summary?.total_clp ??
    order?.total ??
    order?.amount ??
    0
  );
}

function getCustomerName(order) {
  return order?.customer_name ?? order?.customer?.name ?? order?.name ?? 'Cliente sin nombre';
}

function getCustomerPhone(order) {
  return order?.customer_phone ?? order?.customer?.phone ?? '';
}

function getOrderDate(order) {
  return order?.delivery_date ?? order?.customer?.delivery_date ?? order?.created_at ?? null;
}

function getPreferredTime(order) {
  return order?.preferred_time ?? order?.customer?.preferred_time ?? '';
}

function getFulfillmentSummary(order) {
  const label = order?.fulfillment_label ?? order?.fulfillment?.label ?? '';
  const zone = order?.delivery_zone_label ?? order?.fulfillment?.delivery_zone_label ?? '';
  return [label, zone].filter(Boolean).join(' · ');
}

function getOrderItemsPreview(order) {
  const items = Array.isArray(order?.items)
    ? order.items
    : Array.isArray(order?.payload?.items)
      ? order.payload.items
      : [];

  if (!items.length) return 'Sin detalle de productos';

  return items
    .map(item => `${item.quantity ?? 1}x ${item.name}`)
    .join(', ');
}

function getStatus(order) {
  return order?.status ?? order?.order_status ?? 'pending';
}

function getCancellationReason(order) {
  const reason = order?.cancel_reason ?? order?.cancellation_reason ?? '';
  return order?.cancel_reason_label ?? CANCELLATION_REASON_LABELS[reason] ?? '';
}

function getOrderKey(order) {
  return order?.id ?? order?.order_id ?? `${getCustomerName(order)}-${getOrderDate(order)}`;
}

function getOrderReference(order) {
  return order?.order_id ?? order?.id ?? 'Sin referencia';
}

function getOrderItems(order) {
  if (Array.isArray(order?.items)) return order.items;
  if (Array.isArray(order?.payload?.items)) return order.payload.items;
  return [];
}

function getItemSubtotal(item) {
  return item?.subtotal ?? (Number(item?.unit_price ?? item?.price ?? 0) * Number(item?.quantity ?? 1));
}

function getSubtotalProducts(order) {
  return order?.subtotal_products_clp ?? order?.summary?.subtotal_products_clp ?? 0;
}

function getDeliveryFee(order) {
  return order?.delivery_fee_clp ?? order?.summary?.delivery_fee_clp ?? 0;
}

function getFulfillmentType(order) {
  return order?.fulfillment_type ?? order?.fulfillment?.type ?? order?.payload?.fulfillment?.type ?? '';
}

function getFulfillmentLabel(order) {
  return order?.fulfillment_label ?? order?.fulfillment?.label ?? order?.payload?.fulfillment?.label ?? '';
}

function getDeliveryZoneLabel(order) {
  return order?.delivery_zone_label ?? order?.fulfillment?.delivery_zone_label ?? order?.payload?.fulfillment?.delivery_zone_label ?? '';
}

function getDeliveryAddress(order) {
  return order?.address ?? order?.fulfillment?.address ?? order?.payload?.fulfillment?.address ?? '';
}

function getPaymentLabel(order) {
  return order?.payment_label ?? order?.payment?.label ?? order?.payload?.payment?.label ?? '';
}

function getOrderComments(order) {
  return order?.comments ?? order?.customer?.comments ?? order?.payload?.customer?.comments ?? '';
}

function formatOrderDate(value, options = {}) {
  if (!value) return 'Sin fecha';

  const date = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T12:00:00`)
    : new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString('es-CL', {
    weekday: options.long ? 'long' : 'short',
    day: 'numeric',
    month: options.long ? 'long' : 'short',
    year: options.long ? 'numeric' : undefined,
  });
}

function formatTimeMeridiem(value) {
  if (!value) return '';
  const [hourText, minuteText = '00'] = String(value).split(':');
  const hour = Number(hourText);
  if (!Number.isFinite(hour)) return String(value);

  const minute = String(Number(minuteText) || 0).padStart(2, '0');
  const hour12 = hour % 12 || 12;
  const suffix = hour < 12 ? 'a.m.' : 'p.m.';
  return `${hour12}:${minute} ${suffix}`;
}

function formatOrderTime(value) {
  if (!value) return 'Sin hora';
  const readable = formatTimeMeridiem(value);
  return readable ? `${value} (${readable})` : value;
}

function getFulfillmentText(order) {
  const type = getFulfillmentType(order);
  const label = getFulfillmentLabel(order);
  const zone = getDeliveryZoneLabel(order);

  if (type === 'delivery') return ['Delivery', zone].filter(Boolean).join(' - ');
  if (type === 'pickup') return 'Retiro';
  return getFulfillmentSummary(order) || [label, zone].filter(Boolean).join(' - ') || 'Sin entrega definida';
}

function normalizeWhatsAppPhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';

  let phone = digits;
  if (phone.startsWith('0056')) phone = phone.slice(2);
  if (phone.startsWith('56')) return phone;
  if (phone.startsWith('09') && phone.length === 10) phone = phone.slice(1);
  if (phone.length === 9 && phone.startsWith('9')) return `56${phone}`;
  if (phone.length === 8) return `569${phone}`;
  return phone;
}

function buildCustomerWhatsAppUrl(order, message = '') {
  const phone = normalizeWhatsAppPhone(getCustomerPhone(order));
  if (!phone) return '';
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${phone}${text}`;
}

function buildQuickMessages(order) {
  const firstName = getCustomerName(order).split(' ').filter(Boolean)[0] || '';
  const greeting = firstName ? `Hola ${firstName}` : 'Hola';
  const reference = getOrderReference(order);
  const items = getOrderItemsPreview(order);
  const date = formatOrderDate(getOrderDate(order), { long: true });
  const time = getPreferredTime(order);
  const when = [date, time ? `a las ${time}` : ''].filter(Boolean).join(' ');
  const total = formatCLP(getOrderTotal(order));
  const fulfillment = getFulfillmentText(order).toLowerCase();
  const address = getDeliveryAddress(order);
  const readyDetail = getFulfillmentType(order) === 'delivery'
    ? `Coordinemos el delivery${address ? ` a ${address}` : ''} por este chat.`
    : 'Puedes coordinar el retiro por este chat.';

  return [
    {
      key: 'confirm',
      label: 'Confirmar pedido',
      detail: 'Para dejarlo claro y reservado.',
      text: [
        `${greeting}, te confirmo tu pedido ${reference}.`,
        `Pedido: ${items}.`,
        `Fecha: ${when}.`,
        `Modalidad: ${fulfillment}.`,
        `Total: ${total}.`,
        'Gracias por elegir DulceMae.',
      ].join('\n'),
    },
    {
      key: 'payment',
      label: 'Pedir abono o transferencia',
      detail: 'Para reservar con comprobante.',
      text: [
        `${greeting}, para reservar tu pedido ${reference} puedes hacer un abono o transferencia.`,
        `Total estimado: ${total}.`,
        'Cuando puedas, enviame el comprobante por aqui y lo dejo marcado como confirmado.',
      ].join('\n'),
    },
    {
      key: 'preparing',
      label: 'Avisar preparación',
      detail: 'Cuando ya se está preparando.',
      text: [
        `${greeting}, tu pedido ${reference} ya está en preparación.`,
        'Te aviso por este mismo chat cuando este listo.',
      ].join('\n'),
    },
    {
      key: 'ready',
      label: 'Avisar que esta listo',
      detail: 'Para retiro o delivery.',
      text: [
        `${greeting}, tu pedido ${reference} ya esta listo.`,
        readyDetail,
        'Muchas gracias.',
      ].join('\n'),
    },
  ];
}

function getNextStatusAction(order) {
  const status = getStatus(order);
  if (status === 'pending') return { value: 'confirmed', label: 'Confirmar pedido', Icon: CheckCircle2 };
  if (status === 'confirmed') return { value: 'preparing', label: 'Pasar a preparación', Icon: PackageCheck };
  if (status === 'preparing') return { value: 'ready', label: 'Marcar listo', Icon: CheckCircle2 };
  if (status === 'ready') return { value: 'delivered', label: 'Marcar entregado', Icon: PackageCheck };
  return null;
}

function AdminFrame({ children }) {
  return (
    <main className="min-h-screen bg-[#fff7fb] text-[#321b24]">
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(190,24,93,0.14),transparent_28%),radial-gradient(circle_at_86%_12%,rgba(249,168,212,0.22),transparent_26%),linear-gradient(180deg,#fff7fb_0%,#fff1f8_48%,#ffffff_100%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#be185d]/30 to-transparent" />
      </div>
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        {children}
      </div>
    </main>
  );
}

function AdminUnavailable() {
  return (
    <AdminFrame>
      <div className="flex flex-1 items-center justify-center py-12">
        <section className="w-full max-w-xl rounded-[2rem] border border-pink-100 bg-white/82 p-8 shadow-[0_24px_80px_rgba(190,24,93,0.14)] backdrop-blur-xl">
          <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#be185d]/10">
            <Lock className="h-6 w-6 text-[#be185d]" />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#be185d]/60">Admin privado</p>
          <h1 className="mt-3 font-serif text-3xl font-bold text-[#3f2128]">Configura Supabase para entrar</h1>
          <p className="mt-3 text-sm font-medium leading-7 text-[#3f2128]/58">
            Esta zona queda cerrada hasta definir las variables de entorno en Vercel y en local.
          </p>
          <div className="mt-7 grid gap-3 text-sm font-semibold text-[#3f2128]/70">
            {['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'VITE_ADMIN_ALLOWED_EMAILS'].map(key => (
              <code key={key} className="rounded-2xl border border-pink-100 bg-[#fff7fb] px-4 py-3 text-xs text-[#be185d]">
                {key}
              </code>
            ))}
          </div>
        </section>
      </div>
    </AdminFrame>
  );
}

function LoginPanel() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) setError(signInError.message);
    setLoading(false);
  }

  return (
    <AdminFrame>
      <div className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden lg:block">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#be185d]/58">DulceMae Studio</p>
          <h1 className="mt-5 max-w-xl font-serif text-5xl font-bold leading-tight text-[#3f2128]">
            Operación privada con el mismo cuidado que tus pedidos.
          </h1>
          <div className="mt-8 grid max-w-xl gap-3">
            {[
              ['Pedidos', 'Vista lista para confirmar, preparar y entregar.'],
              ['Clientes', 'Base protegida por Supabase y reglas RLS.'],
              ['Catálogo', 'Preparada para edición futura sin tocar el home.'],
            ].map(([title, detail]) => (
              <div key={title} className="flex items-start gap-3 rounded-2xl border border-white/70 bg-white/62 px-4 py-3 shadow-sm backdrop-blur">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#be185d]" />
                <div>
                  <p className="text-sm font-bold text-[#3f2128]">{title}</p>
                  <p className="mt-0.5 text-xs font-medium text-[#3f2128]/52">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto w-full max-w-md rounded-[2rem] border border-pink-100 bg-white/86 p-7 shadow-[0_24px_80px_rgba(190,24,93,0.16)] backdrop-blur-xl"
        >
          <div className="mb-7 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#be185d]/60">Acceso seguro</p>
              <h2 className="mt-2 font-serif text-3xl font-bold text-[#3f2128]">Admin DulceMae</h2>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#be185d]/10">
              <ShieldCheck className="h-5 w-5 text-[#be185d]" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-2 ml-1 block text-sm font-bold text-[#3f2128]/70">Correo</span>
              <span className="relative block">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-pink-300" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="min-h-[50px] w-full rounded-2xl border border-pink-100 bg-[#fff7fb] py-3 pl-11 pr-4 text-sm font-semibold text-[#3f2128] outline-none transition focus:border-[#be185d]/45"
                  placeholder="admin@dulcemae.cl"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-2 ml-1 block text-sm font-bold text-[#3f2128]/70">Clave</span>
              <span className="relative block">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-pink-300" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="min-h-[50px] w-full rounded-2xl border border-pink-100 bg-[#fff7fb] py-3 pl-11 pr-12 text-sm font-semibold text-[#3f2128] outline-none transition focus:border-[#be185d]/45"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-[#be185d] transition hover:bg-[#be185d]/8"
                  aria-label={showPassword ? 'Ocultar clave' : 'Mostrar clave'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
            </label>

            {error && (
              <p className="flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-bold text-red-500">
                <AlertCircle className="h-4 w-4" />
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#3f2128] to-[#1f1f1f] px-5 py-3 text-sm font-bold text-white shadow-[0_14px_34px_rgba(63,33,40,0.24)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              Entrar al panel
            </button>
          </form>
        </motion.section>
      </div>
    </AdminFrame>
  );
}

function MetricCard({ label, value, Icon }) {
  return (
    <div className="rounded-3xl border border-pink-100 bg-white/78 p-3 shadow-sm backdrop-blur sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-bold uppercase leading-snug tracking-[0.12em] text-[#be185d]/54 sm:text-xs sm:tracking-[0.16em]">{label}</p>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-[#be185d]/10 sm:h-10 sm:w-10">
          <Icon className="h-3.5 w-3.5 text-[#be185d] sm:h-4 sm:w-4" />
        </span>
      </div>
      <p className="mt-3 font-serif text-2xl font-bold text-[#3f2128] sm:mt-4 sm:text-3xl">{value}</p>
    </div>
  );
}

function StatusBars({ counts }) {
  const visibleStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
  const max = Math.max(1, ...visibleStatuses.map(status => counts[status] ?? 0));

  return (
    <section className="mt-4 rounded-3xl border border-pink-100 bg-white/76 p-4 shadow-sm backdrop-blur sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#be185d]/50">Resumen visual</p>
          <h2 className="mt-1 font-serif text-xl font-bold text-[#3f2128]">Estados de pedidos</h2>
        </div>
        <BarChart3 className="h-5 w-5 text-[#be185d]" />
      </div>
      <div className="grid gap-3">
        {visibleStatuses.map(status => {
          const count = counts[status] ?? 0;
          const style = STATUS_STYLES[status] ?? STATUS_STYLES.pending;
          return (
            <div key={status} className="grid grid-cols-[7.5rem_1fr_2rem] items-center gap-3 text-xs font-bold text-[#3f2128]/64">
              <span className="truncate">{STATUS_LABELS[status]}</span>
              <span className="h-2.5 overflow-hidden rounded-full bg-[#fff1f8]">
                <span
                  className={`block h-full rounded-full ${style.dot}`}
                  style={{ width: `${Math.max(5, (count / max) * 100)}%`, opacity: count ? 1 : 0.28 }}
                />
              </span>
              <span className="text-right text-[#3f2128]">{count}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function WorkspaceCard({ eyebrow, title, detail, Icon, muted = false }) {
  return (
    <div className="rounded-3xl border border-pink-100 bg-white/72 p-4 shadow-sm backdrop-blur sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#be185d]/10">
          <Icon className="h-4 w-4 text-[#be185d]" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#be185d]/50">{eyebrow}</p>
          <h3 className="mt-1 text-sm font-bold text-[#3f2128]">{title}</h3>
          <p className={`mt-1 text-xs font-medium leading-5 ${muted ? 'text-[#3f2128]/42' : 'text-[#3f2128]/58'}`}>
            {detail}
          </p>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.pending;
  const label = STATUS_OPTIONS.find(option => option.value === status)?.label ?? STATUS_LABELS[status] ?? 'Estado';

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold ${style.badge}`}>
      <span className={`h-2 w-2 rounded-full ${style.dot}`} />
      {label}
    </span>
  );
}

function OrdersFilters({ activeFilter, counts, onChange }) {
  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-1">
      <div className="flex min-w-max gap-2">
        {ORDER_FILTERS.map(filter => {
          const active = activeFilter === filter.value;
          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => onChange(filter.value)}
              className={`inline-flex min-h-[44px] items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-bold transition ${
                active
                  ? 'border-[#be185d]/35 bg-[#be185d] text-white shadow-[0_12px_26px_rgba(190,24,93,0.18)]'
                  : 'border-pink-100 bg-white/82 text-[#3f2128]/68 shadow-sm'
              }`}
            >
              {filter.label}
              <span className={`rounded-full px-2 py-0.5 text-[11px] ${active ? 'bg-white/20 text-white' : 'bg-[#fff7fb] text-[#be185d]'}`}>
                {counts[filter.value] ?? 0}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StatusActionButtons({
  order,
  onStatusChange,
  onRequestCancel,
  updatingStatusId,
  cancellingOrderId,
}) {
  const currentStatus = getStatus(order);
  const isBusy = updatingStatusId === order.id || cancellingOrderId === order.id;

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {STATUS_ACTIONS.map(({ value, label, Icon }) => {
        const active = currentStatus === value;
        return (
          <button
            key={value}
            type="button"
            disabled={!order.id || isBusy || active}
            onClick={() => onStatusChange(order, value)}
            className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
              active
                ? 'border-[#be185d]/24 bg-[#be185d]/10 text-[#be185d]'
                : 'border-pink-100 bg-white text-[#3f2128]/70 hover:-translate-y-0.5 hover:border-[#be185d]/24'
            }`}
          >
            {updatingStatusId === order.id && !active ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Icon className="h-4 w-4 text-[#be185d]" />
            )}
            {label}
          </button>
        );
      })}
      {currentStatus !== 'cancelled' && (
        <button
          type="button"
          disabled={!order.id || isBusy}
          onClick={() => onRequestCancel(order)}
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-3 py-3 text-sm font-bold text-red-500 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {cancellingOrderId === order.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
          Cancelar
        </button>
      )}
    </div>
  );
}

function OrderCard({
  order,
  onOpenDetails,
  onStatusChange,
  onRequestCancel,
  updatingStatusId,
  cancellingOrderId,
}) {
  const status = getStatus(order);
  const nextAction = getNextStatusAction(order);
  const whatsappUrl = buildCustomerWhatsAppUrl(order);
  const isBusy = updatingStatusId === order.id || cancellingOrderId === order.id;

  return (
    <article className="rounded-3xl border border-pink-100 bg-white/86 p-4 shadow-sm backdrop-blur sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <StatusBadge status={status} />
          <h3 className="mt-3 truncate font-serif text-2xl font-bold text-[#3f2128]">{getCustomerName(order)}</h3>
          <p className="mt-1 truncate text-xs font-bold text-[#3f2128]/42">{getOrderReference(order)}</p>
        </div>
        <p className="shrink-0 text-right font-serif text-xl font-bold text-[#3f2128]">{formatCLP(getOrderTotal(order))}</p>
      </div>

      <p className="mt-3 line-clamp-2 text-sm font-semibold leading-6 text-[#3f2128]/64">
        {getOrderItemsPreview(order)}
      </p>

      <div className="mt-4 grid gap-2 text-xs font-bold text-[#3f2128]/56">
        <p className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-[#be185d]" />
          {formatOrderDate(getOrderDate(order))} - {formatOrderTime(getPreferredTime(order))}
        </p>
        <p className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-[#be185d]" />
          {getFulfillmentText(order)}
        </p>
        <p className="flex items-center gap-2">
          <PhoneCall className="h-4 w-4 text-[#be185d]" />
          {getCustomerPhone(order) || 'Sin telefono'}
        </p>
      </div>

      {status === 'cancelled' && getCancellationReason(order) && (
        <p className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold text-red-500">
          Cancelado: {getCancellationReason(order)}
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onOpenDetails(order)}
          className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl border border-pink-100 bg-[#fff7fb] px-3 py-3 text-sm font-bold text-[#be185d]"
        >
          <ReceiptText className="h-4 w-4" />
          Detalle
        </button>
        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl bg-[#25d366] px-3 py-3 text-sm font-bold text-white shadow-[0_12px_26px_rgba(37,211,102,0.20)]"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl bg-stone-100 px-3 py-3 text-sm font-bold text-stone-400"
          >
            <MessageCircle className="h-4 w-4" />
            Sin WhatsApp
          </button>
        )}
      </div>

      {nextAction && (
        <button
          type="button"
          disabled={!order.id || isBusy}
          onClick={() => onStatusChange(order, nextAction.value)}
          className="mt-3 inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#3f2128] to-[#1f1f1f] px-4 py-3 text-sm font-bold text-white shadow-[0_14px_30px_rgba(63,33,40,0.18)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {updatingStatusId === order.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <nextAction.Icon className="h-4 w-4" />}
          {nextAction.label}
        </button>
      )}

      {status !== 'cancelled' && status !== 'delivered' && (
        <button
          type="button"
          disabled={!order.id || isBusy}
          onClick={() => onRequestCancel(order)}
          className="mt-2 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {cancellingOrderId === order.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
          Cancelar con motivo
        </button>
      )}
    </article>
  );
}

function DetailField({ label, value, Icon }) {
  if (!value) return null;

  return (
    <div className="rounded-2xl border border-pink-100 bg-[#fff7fb] px-4 py-3">
      <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#be185d]/52">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-bold leading-6 text-[#3f2128]/76">{value}</p>
    </div>
  );
}

function QuickMessageCard({ message, order, copied, onCopy }) {
  const whatsappUrl = buildCustomerWhatsAppUrl(order, message.text);

  return (
    <div className="rounded-2xl border border-pink-100 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[#3f2128]">{message.label}</p>
          <p className="mt-0.5 text-xs font-semibold text-[#3f2128]/45">{message.detail}</p>
        </div>
        {copied && <CopyCheck className="h-5 w-5 shrink-0 text-emerald-500" />}
      </div>
      <p className="mt-3 whitespace-pre-line rounded-2xl bg-[#fff7fb] px-3 py-2 text-xs font-semibold leading-5 text-[#3f2128]/58">
        {message.text}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onCopy(message.text, `${getOrderKey(order)}-${message.key}`)}
          className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-2xl border border-pink-100 bg-white px-3 py-2 text-xs font-bold text-[#be185d]"
        >
          {copied ? <CopyCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-2xl bg-[#25d366] px-3 py-2 text-xs font-bold text-white"
          >
            <Send className="h-4 w-4" />
            WhatsApp
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-2xl bg-stone-100 px-3 py-2 text-xs font-bold text-stone-400"
          >
            <Send className="h-4 w-4" />
            Sin telefono
          </button>
        )}
      </div>
    </div>
  );
}

function OrderDetailSheet({
  order,
  onClose,
  onStatusChange,
  onRequestCancel,
  onCopyMessage,
  copiedMessageKey,
  updatingStatusId,
  cancellingOrderId,
}) {
  if (!order) return null;

  const items = getOrderItems(order);
  const quickMessages = buildQuickMessages(order);
  const whatsappUrl = buildCustomerWhatsAppUrl(order);
  const deliveryAddress = getDeliveryAddress(order);
  const comments = getOrderComments(order);

  return (
    <div className="fixed inset-0 z-[250] flex items-end justify-center bg-[#3f2128]/36 px-3 py-4 backdrop-blur-sm sm:items-center">
      <motion.section
        initial={{ opacity: 0, y: 22, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.22 }}
        className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-[2rem] border border-pink-100 bg-white shadow-[0_24px_80px_rgba(63,33,40,0.22)]"
      >
        <div className="sticky top-0 z-10 border-b border-pink-100 bg-white/96 px-4 py-4 backdrop-blur sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <StatusBadge status={getStatus(order)} />
              <h3 className="mt-2 truncate font-serif text-2xl font-bold text-[#3f2128] sm:text-3xl">
                {getCustomerName(order)}
              </h3>
              <p className="mt-1 text-xs font-bold text-[#3f2128]/42">{getOrderReference(order)}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-pink-100 bg-[#fff7fb] text-[#be185d]"
              aria-label="Cerrar detalle"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-[#fff7fb] px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#be185d]/52">Total</p>
              <p className="mt-1 font-serif text-xl font-bold text-[#3f2128]">{formatCLP(getOrderTotal(order))}</p>
            </div>
            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[58px] items-center justify-center gap-2 rounded-2xl bg-[#25d366] px-4 py-3 text-sm font-bold text-white shadow-[0_12px_26px_rgba(37,211,102,0.20)]"
              >
                <MessageCircle className="h-4 w-4" />
                Abrir WhatsApp
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex min-h-[58px] items-center justify-center gap-2 rounded-2xl bg-stone-100 px-4 py-3 text-sm font-bold text-stone-400"
              >
                <MessageCircle className="h-4 w-4" />
                Sin telefono
              </button>
            )}
          </div>
        </div>

        <div className="max-h-[calc(92vh-12rem)] overflow-y-auto px-4 py-5 sm:px-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailField label="Telefono" value={getCustomerPhone(order) || 'Sin telefono'} Icon={PhoneCall} />
            <DetailField
              label="Entrega"
              value={`${formatOrderDate(getOrderDate(order), { long: true })} - ${formatOrderTime(getPreferredTime(order))}`}
              Icon={CalendarDays}
            />
            <DetailField label="Modalidad" value={getFulfillmentText(order)} Icon={Truck} />
            <DetailField label="Pago" value={getPaymentLabel(order) || 'Sin metodo'} Icon={ReceiptText} />
            {deliveryAddress && <DetailField label="Direccion" value={deliveryAddress} Icon={Truck} />}
            {comments && <DetailField label="Comentarios" value={comments} Icon={MessageCircle} />}
          </div>

          <section className="mt-5 rounded-3xl border border-pink-100 bg-[#fff7fb] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h4 className="font-serif text-xl font-bold text-[#3f2128]">Pedido</h4>
              <span className="text-xs font-bold text-[#be185d]/58">{items.length || 0} items</span>
            </div>
            {items.length ? (
              <div className="grid gap-2">
                {items.map((item, index) => (
                  <div key={`${item.id ?? item.name}-${index}`} className="flex items-start justify-between gap-3 rounded-2xl bg-white px-4 py-3">
                    <div className="min-w-0">
                      <p className="font-bold text-[#3f2128]">{item.quantity ?? 1}x {item.name ?? 'Producto'}</p>
                      <p className="mt-0.5 text-xs font-semibold text-[#3f2128]/42">
                        Unitario {formatCLP(item.unit_price ?? item.price ?? 0)}
                      </p>
                    </div>
                    <p className="shrink-0 font-serif text-base font-bold text-[#3f2128]">{formatCLP(getItemSubtotal(item))}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#3f2128]/52">
                Sin detalle de productos.
              </p>
            )}

            <div className="mt-3 grid gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#3f2128]/68">
              <p className="flex justify-between gap-3"><span>Productos</span><span>{formatCLP(getSubtotalProducts(order))}</span></p>
              <p className="flex justify-between gap-3"><span>Delivery</span><span>{formatCLP(getDeliveryFee(order))}</span></p>
              <p className="flex justify-between gap-3 border-t border-pink-100 pt-2 text-[#3f2128]">
                <span>Total</span><span>{formatCLP(getOrderTotal(order))}</span>
              </p>
            </div>
          </section>

          <section className="mt-5">
            <div className="mb-3 flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-[#be185d]" />
              <h4 className="font-serif text-xl font-bold text-[#3f2128]">Mensajes rapidos</h4>
            </div>
            <div className="grid gap-3">
              {quickMessages.map(message => (
                <QuickMessageCard
                  key={message.key}
                  message={message}
                  order={order}
                  copied={copiedMessageKey === `${getOrderKey(order)}-${message.key}`}
                  onCopy={onCopyMessage}
                />
              ))}
            </div>
          </section>

          <section className="mt-5">
            <div className="mb-3 flex items-center gap-2">
              <PackageCheck className="h-4 w-4 text-[#be185d]" />
              <h4 className="font-serif text-xl font-bold text-[#3f2128]">Cambiar estado</h4>
            </div>
            <StatusActionButtons
              order={order}
              onStatusChange={onStatusChange}
              onRequestCancel={onRequestCancel}
              updatingStatusId={updatingStatusId}
              cancellingOrderId={cancellingOrderId}
            />
          </section>
        </div>
      </motion.section>
    </div>
  );
}

function OrdersTable({
  orders,
  loading,
  error,
  onRefresh,
  onOpenDetails,
  onStatusChange,
  onRequestCancel,
  updatingStatusId,
  cancellingOrderId,
  emptyTitle = 'Sin pedidos todavia',
  emptyDetail = 'Los nuevos pedidos apareceran aqui despues de enviarse por WhatsApp. Si acabas de hacer una prueba, espera unos segundos y toca Actualizar.',
}) {
  if (loading) {
    return (
      <div className="flex min-h-[20rem] items-center justify-center rounded-3xl border border-pink-100 bg-white/76">
        <RefreshCw className="h-6 w-6 animate-spin text-[#be185d]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-amber-100 bg-amber-50/80 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 text-amber-600" />
          <div>
            <p className="text-sm font-bold text-amber-900">No se pudo leer la tabla de pedidos</p>
            <p className="mt-1 text-sm font-medium leading-6 text-amber-800/72">{error}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-bold text-amber-900 shadow-sm"
        >
          <RefreshCw className="h-4 w-4" />
          Reintentar
        </button>
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="flex min-h-[20rem] flex-col items-center justify-center rounded-3xl border border-dashed border-pink-200 bg-white/64 px-6 text-center">
        <PackageCheck className="h-9 w-9 text-[#be185d]" />
        <p className="mt-4 font-serif text-2xl font-bold text-[#3f2128]">{emptyTitle}</p>
        <p className="mt-2 max-w-md text-sm font-medium leading-6 text-[#3f2128]/52">{emptyDetail}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {orders.map(order => (
        <OrderCard
          key={getOrderKey(order)}
          order={order}
          onOpenDetails={onOpenDetails}
          onStatusChange={onStatusChange}
          onRequestCancel={onRequestCancel}
          updatingStatusId={updatingStatusId}
          cancellingOrderId={cancellingOrderId}
        />
      ))}
    </div>
  );
}
function Dashboard({ session }) {
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState('');
  const [statusError, setStatusError] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedOrderKey, setSelectedOrderKey] = useState(null);
  const [copiedMessageKey, setCopiedMessageKey] = useState('');
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [cancelDraft, setCancelDraft] = useState(null);
  const [cancelError, setCancelError] = useState('');

  const loadOrders = useCallback(async () => {
    setLoadingOrders(true);
    setOrdersError('');

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      setOrders([]);
      setOrdersError(error.message);
    } else {
      setOrders(Array.isArray(data) ? data : []);
    }

    setLoadingOrders(false);
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const metrics = useMemo(() => {
    const counts = Object.fromEntries(STATUS_OPTIONS.map(option => [option.value, 0]));
    let revenue = 0;

    for (const order of orders) {
      const status = getStatus(order);
      counts[status] = (counts[status] ?? 0) + 1;
      if (status !== 'cancelled') revenue += Number(getOrderTotal(order) || 0);
    }

    return { counts, revenue };
  }, [orders]);

  const filterCounts = useMemo(() => (
    ORDER_FILTERS.reduce((acc, filter) => {
      acc[filter.value] = filter.statuses
        ? filter.statuses.reduce((sum, status) => sum + (metrics.counts[status] ?? 0), 0)
        : orders.length;
      return acc;
    }, {})
  ), [metrics.counts, orders.length]);

  const currentFilter = ORDER_FILTERS.find(filter => filter.value === activeFilter) ?? ORDER_FILTERS[0];

  const filteredOrders = useMemo(() => {
    if (!currentFilter.statuses) return orders;
    return orders.filter(order => currentFilter.statuses.includes(getStatus(order)));
  }, [orders, currentFilter]);

  const selectedOrder = useMemo(() => (
    selectedOrderKey
      ? orders.find(order => getOrderKey(order) === selectedOrderKey) ?? null
      : null
  ), [orders, selectedOrderKey]);

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  function handleOpenDetails(order) {
    setSelectedOrderKey(getOrderKey(order));
  }

  async function handleCopyMessage(text, key) {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      setStatusError('No se pudo copiar automaticamente. Puedes seleccionar el texto del mensaje.');
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageKey(key);
      window.setTimeout(() => {
        setCopiedMessageKey(prev => (prev === key ? '' : prev));
      }, 1800);
    } catch (error) {
      setStatusError(`No se pudo copiar el mensaje: ${error.message}`);
    }
  }

  async function handleStatusChange(order, nextStatus) {
    if (!order.id || nextStatus === getStatus(order)) return;
    if (nextStatus === 'cancelled') {
      openCancelOrder(order);
      return;
    }

    const previousOrders = orders;
    const updatePayload = {
      status: nextStatus,
      ...(getStatus(order) === 'cancelled'
        ? {
            cancel_reason: null,
            cancel_reason_label: null,
            cancel_note: null,
            cancelled_at: null,
          }
        : {}),
    };

    setStatusError('');
    setUpdatingStatusId(order.id);
    setOrders(prev => prev.map(item => item.id === order.id ? { ...item, ...updatePayload } : item));

    const { error } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', order.id);

    if (error) {
      setOrders(previousOrders);
      setStatusError(error.message);
    }

    setUpdatingStatusId(null);
  }

  function openCancelOrder(order) {
    setCancelError('');
    setCancelDraft({
      order,
      reason: order.cancel_reason || CANCELLATION_REASONS[0].value,
      note: order.cancel_note || '',
    });
  }

  function closeCancelOrder() {
    if (cancellingOrderId) return;
    setCancelDraft(null);
    setCancelError('');
  }

  async function handleCancelOrder(event) {
    event.preventDefault();
    if (!cancelDraft?.order?.id || cancellingOrderId) return;

    const reasonLabel = CANCELLATION_REASON_LABELS[cancelDraft.reason] || 'Otro motivo';
    const cancelNote = cancelDraft.note.trim();
    const previousOrders = orders;
    const cancelledAt = new Date().toISOString();
    const updatePayload = {
      status: 'cancelled',
      cancel_reason: cancelDraft.reason,
      cancel_reason_label: reasonLabel,
      cancel_note: cancelNote || null,
      cancelled_at: cancelledAt,
    };

    setCancelError('');
    setStatusError('');
    setCancellingOrderId(cancelDraft.order.id);
    setOrders(prev => prev.map(item => (
      item.id === cancelDraft.order.id
        ? { ...item, ...updatePayload }
        : item
    )));

    const { error } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', cancelDraft.order.id);

    if (error) {
      setOrders(previousOrders);
      setCancelError(error.message);
    } else {
      setCancelDraft(null);
    }

    setCancellingOrderId(null);
  }

  return (
    <AdminFrame>
      <header className="mb-5 flex flex-col gap-4 rounded-[2rem] border border-white/70 bg-white/72 px-4 py-4 shadow-sm backdrop-blur-xl sm:px-5 sm:py-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#be185d]/10 sm:h-12 sm:w-12">
            <Sparkles className="h-5 w-5 text-[#be185d]" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#be185d]/60">Panel privado</p>
            <h1 className="mt-1 font-serif text-2xl font-bold text-[#3f2128] sm:text-3xl">DulceMae Admin</h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex max-w-full items-center gap-2 rounded-2xl border border-pink-100 bg-white px-4 py-2 text-xs font-bold text-[#3f2128]/62">
            <UserRound className="h-4 w-4 text-[#be185d]" />
            <span className="truncate">{session.user.email}</span>
          </span>
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#3f2128] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:-translate-y-0.5"
          >
            <LogOut className="h-4 w-4" />
            Salir
          </button>
        </div>
      </header>

      {!adminAllowedEmails.length && (
        <div className="mb-5 rounded-3xl border border-amber-100 bg-amber-50/80 px-5 py-4 text-sm font-semibold text-amber-900">
          Agrega <code>VITE_ADMIN_ALLOWED_EMAILS</code> en Vercel para ocultar el panel a correos no autorizados desde la interfaz.
        </div>
      )}

      <section className="mb-4 grid gap-3 md:grid-cols-2">
        <WorkspaceCard
          eyebrow="Pedidos"
          title="Ordenes del dia"
          detail="Revisa clientes, entrega, total y estado sin entrar a Supabase."
          Icon={PackageCheck}
        />
        <WorkspaceCard
          eyebrow="WhatsApp"
          title="Mensajes listos"
          detail="Abre el chat del cliente o copia respuestas para confirmar y avisar avances."
          Icon={MessageCircle}
          muted
        />
      </section>

      <section className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="Nuevos" value={metrics.counts.pending ?? 0} Icon={Clock3} />
        <MetricCard label="Confirmados" value={metrics.counts.confirmed ?? 0} Icon={CheckCircle2} />
        <MetricCard label="Preparación" value={metrics.counts.preparing ?? 0} Icon={PackageCheck} />
        <MetricCard label="Listos" value={metrics.counts.ready ?? 0} Icon={PackageCheck} />
        <MetricCard label="Entregados" value={metrics.counts.delivered ?? 0} Icon={Truck} />
        <MetricCard label="Ventas visibles" value={formatCLP(metrics.revenue)} Icon={BarChart3} />
      </section>

      <StatusBars counts={metrics.counts} />

      <section className="mt-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#be185d]/54">Operación</p>
            <h2 className="mt-1 font-serif text-2xl font-bold text-[#3f2128]">Pedidos recientes</h2>
          </div>
          <button
            type="button"
            onClick={loadOrders}
            className="inline-flex items-center gap-2 rounded-2xl border border-pink-100 bg-white px-4 py-2 text-sm font-bold text-[#be185d] shadow-sm"
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </button>
        </div>
        <div className="mb-4">
          <OrdersFilters activeFilter={activeFilter} counts={filterCounts} onChange={setActiveFilter} />
        </div>
        {statusError && (
          <p className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-500">
            No se pudo actualizar el estado: {statusError}
          </p>
        )}
        <OrdersTable
          orders={filteredOrders}
          loading={loadingOrders}
          error={ordersError}
          onRefresh={loadOrders}
          onOpenDetails={handleOpenDetails}
          onStatusChange={handleStatusChange}
          onRequestCancel={openCancelOrder}
          updatingStatusId={updatingStatusId}
          cancellingOrderId={cancellingOrderId}
          emptyTitle={orders.length ? `Sin pedidos en ${currentFilter.label.toLowerCase()}` : 'Sin pedidos todavia'}
          emptyDetail={orders.length ? 'Cambia el filtro para revisar otros pedidos recientes.' : 'Los nuevos pedidos apareceran aqui despues de enviarse por WhatsApp. Si acabas de hacer una prueba, espera unos segundos y toca Actualizar.'}
        />
      </section>

      {selectedOrder && (
        <OrderDetailSheet
          order={selectedOrder}
          onClose={() => setSelectedOrderKey(null)}
          onStatusChange={handleStatusChange}
          onRequestCancel={openCancelOrder}
          onCopyMessage={handleCopyMessage}
          copiedMessageKey={copiedMessageKey}
          updatingStatusId={updatingStatusId}
          cancellingOrderId={cancellingOrderId}
        />
      )}

      {cancelDraft && (
        <div className="fixed inset-0 z-[260] flex items-end justify-center bg-[#3f2128]/32 px-3 py-4 backdrop-blur-sm sm:items-center">
          <motion.form
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.22 }}
            onSubmit={handleCancelOrder}
            className="w-full max-w-xl rounded-[2rem] border border-red-100 bg-white p-5 shadow-[0_24px_80px_rgba(63,33,40,0.22)] sm:p-6"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50">
                <Ban className="h-5 w-5 text-red-500" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-400">Cancelar pedido</p>
                <h3 className="mt-1 font-serif text-2xl font-bold text-[#3f2128]">
                  {getCustomerName(cancelDraft.order)}
                </h3>
                <p className="mt-1 text-xs font-semibold text-[#3f2128]/48">
                  {cancelDraft.order.order_id ?? cancelDraft.order.id} · {formatCLP(getOrderTotal(cancelDraft.order))}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-2">
              {CANCELLATION_REASONS.map(reason => {
                const active = cancelDraft.reason === reason.value;
                return (
                  <button
                    key={reason.value}
                    type="button"
                    onClick={() => setCancelDraft(prev => ({ ...prev, reason: reason.value }))}
                    className={`rounded-2xl border px-4 py-3 text-left transition ${
                      active
                        ? 'border-red-200 bg-red-50 text-red-700'
                        : 'border-pink-100 bg-[#fff7fb] text-[#3f2128]'
                    }`}
                  >
                    <span className="block text-sm font-bold">{reason.label}</span>
                    <span className="mt-0.5 block text-xs font-medium opacity-60">{reason.detail}</span>
                  </button>
                );
              })}
            </div>

            <label className="mt-4 block">
              <span className="mb-2 ml-1 block text-sm font-bold text-[#3f2128]/70">Nota opcional</span>
              <textarea
                rows={3}
                value={cancelDraft.note}
                onChange={(event) => setCancelDraft(prev => ({ ...prev, note: event.target.value }))}
                placeholder="Ej. era una prueba, cliente pidio cancelar o no hubo cupo."
                className="w-full resize-none rounded-2xl border border-pink-100 bg-[#fff7fb] px-4 py-3 text-sm font-semibold text-[#3f2128] outline-none transition focus:border-red-200"
              />
            </label>

            {cancelError && (
              <p className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-500">
                No se pudo cancelar: {cancelError}
              </p>
            )}

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={closeCancelOrder}
                disabled={Boolean(cancellingOrderId)}
                className="min-h-[46px] rounded-2xl border border-pink-100 bg-white px-4 py-3 text-sm font-bold text-[#3f2128]/62 disabled:opacity-60"
              >
                Volver
              </button>
              <button
                type="submit"
                disabled={Boolean(cancellingOrderId)}
                className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl bg-red-500 px-4 py-3 text-sm font-bold text-white shadow-[0_14px_34px_rgba(239,68,68,0.22)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cancellingOrderId ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
                Cancelar pedido
              </button>
            </div>
          </motion.form>
        </div>
      )}
    </AdminFrame>
  );
}

function AccessDenied({ session }) {
  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  return (
    <AdminFrame>
      <div className="flex flex-1 items-center justify-center py-12">
        <section className="w-full max-w-lg rounded-[2rem] border border-red-100 bg-white/84 p-8 shadow-[0_24px_80px_rgba(190,24,93,0.12)]">
          <AlertCircle className="h-10 w-10 text-red-500" />
          <h1 className="mt-5 font-serif text-3xl font-bold text-[#3f2128]">Acceso no autorizado</h1>
          <p className="mt-3 text-sm font-medium leading-7 text-[#3f2128]/58">
            {session.user.email} inició sesión, pero no está en la lista privada del panel.
          </p>
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#3f2128] px-5 py-3 text-sm font-bold text-white"
          >
            <LogOut className="h-4 w-4" />
            Salir
          </button>
        </section>
      </div>
    </AdminFrame>
  );
}

export default function AdminShell() {
  const [session, setSession] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setBooting(false);
      return undefined;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setBooting(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setBooting(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (!isSupabaseConfigured) return <AdminUnavailable />;

  if (booting) {
    return (
      <AdminFrame>
        <div className="flex flex-1 items-center justify-center">
          <RefreshCw className="h-7 w-7 animate-spin text-[#be185d]" />
        </div>
      </AdminFrame>
    );
  }

  if (!session) return <LoginPanel />;

  if (!isAllowedAdminEmail(session.user.email)) return <AccessDenied session={session} />;

  return <Dashboard session={session} />;
}
