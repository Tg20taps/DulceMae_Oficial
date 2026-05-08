import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  BarChart3,
  Ban,
  Calculator,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
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
  TrendingUp,
  Truck,
  UserRound,
  X,
} from 'lucide-react';
import {
  fetchAdminOrders,
  getStoredAdminSession,
  signInAdmin,
  signOutAdmin,
  updateAdminOrder,
} from '../../lib/adminApi';
import {
  adminAllowedEmails,
  isAllowedAdminEmail,
  isSupabaseConfigured,
} from '../../lib/supabaseConfig';

const STATUS_LABELS = {
  pending: 'Nuevo',
  confirmed: 'Confirmado',
  preparing: 'En preparación',
  ready: 'Listo',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }));
const ACTIVE_ORDER_STATUSES = ['pending', 'confirmed', 'preparing', 'ready'];
const HISTORY_ORDER_STATUSES = ['delivered', 'cancelled'];
const ORDER_FETCH_LIMIT = 200;
const HISTORY_VISIBLE_DAYS = 30;

const ORDER_FILTERS = [
  { value: 'active', label: 'Activos', statuses: ACTIVE_ORDER_STATUSES },
  { value: 'pending', label: 'Nuevo', statuses: ['pending'] },
  { value: 'confirmed', label: 'Confirmado', statuses: ['confirmed'] },
  { value: 'preparing', label: 'En preparación', statuses: ['preparing'] },
  { value: 'ready', label: 'Listo', statuses: ['ready'] },
  { value: 'delivered', label: 'Entregado', statuses: ['delivered'] },
  { value: 'cancelled', label: 'Cancelado', statuses: ['cancelled'] },
  { value: 'history', label: 'Historial', statuses: HISTORY_ORDER_STATUSES },
];

const ADMIN_TABS = [
  { value: 'orders', label: 'Pedidos', detail: 'Atender y responder', Icon: ClipboardList },
  { value: 'insights', label: 'Análisis', detail: 'Día, semana y mes', Icon: BarChart3 },
  { value: 'costs', label: 'Costos', detail: 'Calcular precios', Icon: Calculator },
];

const COST_DRAFT_KEY = 'dulcemae_cost_calculator_v1';
const COST_SAVED_KEY = 'dulcemae_saved_cost_calculations_v1';

const COST_PRESETS = [
  {
    key: 'pan_amasado',
    label: 'Pan amasado',
    productName: 'Pan amasado familiar',
    servings: 12,
    salePrice: 6000,
    targetMargin: 45,
    packagingCost: 500,
    decorationCost: 0,
    ingredients: [
      { id: 'pan_1', name: 'Harina', quantity: '1 kg', cost: 1200 },
      { id: 'pan_2', name: 'Manteca / aceite', quantity: 'por tanda', cost: 700 },
      { id: 'pan_3', name: 'Levadura, sal y azúcar', quantity: 'por tanda', cost: 450 },
    ],
  },
  {
    key: 'kuchen',
    label: 'Kuchen',
    productName: 'Kuchen casero',
    servings: 10,
    salePrice: 15000,
    targetMargin: 48,
    packagingCost: 1400,
    decorationCost: 500,
    ingredients: [
      { id: 'kuchen_1', name: 'Masa base', quantity: '1 molde', cost: 2600 },
      { id: 'kuchen_2', name: 'Relleno fruta / nuez', quantity: '1 relleno', cost: 4200 },
      { id: 'kuchen_3', name: 'Crema o cobertura', quantity: 'terminación', cost: 1800 },
    ],
  },
  {
    key: 'cake_15',
    label: 'Torta 15 personas',
    productName: 'Torta personalizada 15 personas',
    servings: 15,
    salePrice: 26000,
    targetMargin: 45,
    packagingCost: 1800,
    decorationCost: 2500,
    ingredients: [
      { id: 'cake_15_1', name: 'Bizcocho e insumos base', quantity: '1 torta', cost: 5200 },
      { id: 'cake_15_2', name: 'Relleno', quantity: '2 capas', cost: 4200 },
      { id: 'cake_15_3', name: 'Cobertura', quantity: '1 terminación', cost: 3800 },
    ],
  },
  {
    key: 'cake_25',
    label: 'Torta 25 personas',
    productName: 'Torta personalizada 25 personas',
    servings: 25,
    salePrice: 38000,
    targetMargin: 48,
    packagingCost: 2400,
    decorationCost: 3800,
    ingredients: [
      { id: 'cake_25_1', name: 'Bizcocho e insumos base', quantity: '1 torta', cost: 7600 },
      { id: 'cake_25_2', name: 'Relleno', quantity: '2 a 3 capas', cost: 6200 },
      { id: 'cake_25_3', name: 'Cobertura', quantity: '1 terminación', cost: 5200 },
    ],
  },
  {
    key: 'cake_35',
    label: 'Torta 35 personas',
    productName: 'Torta personalizada 35 personas',
    servings: 35,
    salePrice: 52000,
    targetMargin: 50,
    packagingCost: 3200,
    decorationCost: 5200,
    ingredients: [
      { id: 'cake_35_1', name: 'Bizcocho e insumos base', quantity: '1 torta grande', cost: 10800 },
      { id: 'cake_35_2', name: 'Relleno', quantity: '3 capas', cost: 8200 },
      { id: 'cake_35_3', name: 'Cobertura', quantity: '1 terminación', cost: 6800 },
    ],
  },
  {
    key: 'alfajores',
    label: 'Caja de alfajores',
    productName: 'Caja de alfajores premium',
    servings: 6,
    salePrice: 12000,
    targetMargin: 52,
    packagingCost: 1200,
    decorationCost: 500,
    ingredients: [
      { id: 'alf_1', name: 'Masa e insumos', quantity: '6 unidades', cost: 2100 },
      { id: 'alf_2', name: 'Manjar / relleno', quantity: '6 unidades', cost: 1200 },
      { id: 'alf_3', name: 'Cobertura o coco', quantity: 'decoración', cost: 700 },
    ],
  },
  {
    key: 'cheesecake',
    label: 'Cheesecake',
    productName: 'Cheesecake de frutos rojos',
    servings: 10,
    salePrice: 22000,
    targetMargin: 47,
    packagingCost: 1600,
    decorationCost: 1800,
    ingredients: [
      { id: 'cheese_1', name: 'Base de galleta', quantity: '1 molde', cost: 1800 },
      { id: 'cheese_2', name: 'Queso crema y lácteos', quantity: '1 mezcla', cost: 6200 },
      { id: 'cheese_3', name: 'Frutos rojos', quantity: 'cobertura', cost: 3200 },
    ],
  },
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
  { value: 'preparing', label: 'En preparación', Icon: PackageCheck },
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

function toPositiveNumber(value) {
  return Math.max(0, Number(value) || 0);
}

function roundToNearest(value, step = 500) {
  if (!value) return 0;
  return Math.ceil(value / step) * step;
}

function createCostDraftId() {
  return `calc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function createCostItem(overrides = {}) {
  return {
    id: overrides.id ?? `cost_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: overrides.name ?? '',
    quantity: overrides.quantity ?? '',
    cost: toPositiveNumber(overrides.cost),
  };
}

function buildCostDraft(preset = COST_PRESETS[0]) {
  return {
    id: createCostDraftId(),
    updatedAt: new Date().toISOString(),
    productName: preset.productName,
    servings: preset.servings,
    salePrice: preset.salePrice,
    targetMargin: preset.targetMargin,
    packagingCost: preset.packagingCost,
    decorationCost: preset.decorationCost,
    ingredients: preset.ingredients.map(item => createCostItem(item)),
  };
}

function buildBlankCostDraft() {
  return {
    id: createCostDraftId(),
    updatedAt: new Date().toISOString(),
    productName: 'Nuevo producto',
    servings: 1,
    salePrice: 0,
    targetMargin: 45,
    packagingCost: 0,
    decorationCost: 0,
    ingredients: [
      createCostItem({ name: 'Insumo principal', quantity: 'cantidad usada', cost: 0 }),
    ],
  };
}

function sanitizeCostDraft(value) {
  const fallback = buildCostDraft();
  if (!value || typeof value !== 'object') return fallback;

  return {
    ...fallback,
    ...value,
    id: value.id || createCostDraftId(),
    updatedAt: value.updatedAt || new Date().toISOString(),
    productName: value.productName || fallback.productName,
    servings: toPositiveNumber(value.servings) || fallback.servings,
    salePrice: toPositiveNumber(value.salePrice),
    targetMargin: Math.min(85, Math.max(5, Number(value.targetMargin) || fallback.targetMargin)),
    packagingCost: toPositiveNumber(value.packagingCost),
    decorationCost: toPositiveNumber(value.decorationCost),
    ingredients: Array.isArray(value.ingredients) && value.ingredients.length
      ? value.ingredients.map(item => createCostItem(item))
      : fallback.ingredients,
  };
}

function readStoredCostDraft() {
  if (typeof localStorage === 'undefined') return buildCostDraft();

  try {
    const raw = localStorage.getItem(COST_DRAFT_KEY);
    return raw ? sanitizeCostDraft(JSON.parse(raw)) : buildCostDraft();
  } catch {
    return buildCostDraft();
  }
}

function readStoredCostDrafts() {
  if (typeof localStorage === 'undefined') return [buildCostDraft()];

  try {
    const raw = localStorage.getItem(COST_SAVED_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed) && parsed.length) {
      return parsed.map(item => sanitizeCostDraft(item));
    }
  } catch {
    // Fall back to legacy draft below.
  }

  return [sanitizeCostDraft(readStoredCostDraft())];
}

function getCostDraftLabel(draft) {
  return draft?.productName?.trim() || 'Producto sin nombre';
}

function toOrderDate(value) {
  if (!value) return null;

  const date = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T12:00:00`)
    : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function startOfWeek(date) {
  const copy = startOfDay(date);
  const mondayOffset = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - mondayOffset);
  return copy;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function addMonths(date, months) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function isDateInRange(date, start, end) {
  return date >= start && date < end;
}

function getHistoryDate(order) {
  return (
    toOrderDate(order?.cancelled_at) ??
    toOrderDate(order?.delivered_at) ??
    toOrderDate(order?.updated_at) ??
    toOrderDate(getOrderDate(order)) ??
    toOrderDate(order?.created_at)
  );
}

function isVisibleHistoryOrder(order) {
  if (!HISTORY_ORDER_STATUSES.includes(getStatus(order))) return true;
  const historyDate = getHistoryDate(order);
  if (!historyDate) return true;
  return historyDate >= addDays(startOfDay(new Date()), -HISTORY_VISIBLE_DAYS);
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

  const date = toOrderDate(value);
  if (!date) return String(value);

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
        'Cuando puedas, envíame el comprobante por aquí y lo dejo marcado como confirmado.',
      ].join('\n'),
    },
    {
      key: 'preparing',
      label: 'Avisar que está en preparación',
      detail: 'Cuando el pedido ya se está preparando.',
      text: [
        `${greeting}, tu pedido ${reference} ya está en preparación.`,
        'Te aviso por este mismo chat cuando esté listo.',
      ].join('\n'),
    },
    {
      key: 'ready',
      label: 'Avisar que está listo',
      detail: 'Para retiro o delivery.',
      text: [
        `${greeting}, tu pedido ${reference} ya está listo.`,
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

const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function getOrderAnalysisDate(order) {
  return toOrderDate(getOrderDate(order)) ?? toOrderDate(order?.created_at);
}

function buildAdminInsights(orders) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const tomorrowStart = addDays(todayStart, 1);
  const weekStart = startOfWeek(now);
  const nextWeekStart = addDays(weekStart, 7);
  const monthStart = startOfMonth(now);
  const nextMonthStart = addMonths(monthStart, 1);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  const weekdays = WEEKDAY_LABELS.map(label => ({ label, orders: 0, revenue: 0 }));
  const monthDays = Array.from({ length: daysInMonth }, (_, index) => ({
    label: String(index + 1),
    orders: 0,
    revenue: 0,
  }));
  const fulfillment = [
    { label: 'Delivery', value: 0 },
    { label: 'Retiro', value: 0 },
  ];
  const timeSlots = [
    { label: '10-12', orders: 0, revenue: 0 },
    { label: '12-15', orders: 0, revenue: 0 },
    { label: '15-18', orders: 0, revenue: 0 },
    { label: '18-22', orders: 0, revenue: 0 },
  ];
  const paymentMap = new Map();
  const productMap = new Map();
  const zoneMap = new Map();
  const summary = {
    todayOrders: 0,
    todayRevenue: 0,
    weekOrders: 0,
    weekRevenue: 0,
    monthOrders: 0,
    monthRevenue: 0,
    activeOrders: 0,
    readyOrders: 0,
    cancelledOrders: 0,
    completedOrders: 0,
    averageTicketMonth: 0,
    cancellationRate: 0,
  };

  for (const order of orders) {
    const status = getStatus(order);
    if (ACTIVE_ORDER_STATUSES.includes(status)) summary.activeOrders += 1;
    if (status === 'ready') summary.readyOrders += 1;
    if (status === 'cancelled') {
      summary.cancelledOrders += 1;
      continue;
    }
    summary.completedOrders += 1;

    const date = getOrderAnalysisDate(order);
    if (!date) continue;

    const total = Number(getOrderTotal(order) || 0);
    const weekdayIndex = (date.getDay() + 6) % 7;
    weekdays[weekdayIndex].orders += 1;
    weekdays[weekdayIndex].revenue += total;

    if (date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()) {
      monthDays[date.getDate() - 1].orders += 1;
      monthDays[date.getDate() - 1].revenue += total;
    }

    if (isDateInRange(date, todayStart, tomorrowStart)) {
      summary.todayOrders += 1;
      summary.todayRevenue += total;
    }

    if (isDateInRange(date, weekStart, nextWeekStart)) {
      summary.weekOrders += 1;
      summary.weekRevenue += total;
    }

    if (isDateInRange(date, monthStart, nextMonthStart)) {
      summary.monthOrders += 1;
      summary.monthRevenue += total;
    }

    const hour = Number(String(getPreferredTime(order) || '').split(':')[0]);
    const slot = Number.isFinite(hour)
      ? timeSlots.find(item => {
          const [from, to] = item.label.split('-').map(Number);
          return hour >= from && (hour < to || (to === 22 && hour <= to));
        })
      : null;
    if (slot) {
      slot.orders += 1;
      slot.revenue += total;
    }

    const fulfillmentType = getFulfillmentType(order);
    if (fulfillmentType === 'delivery') fulfillment[0].value += 1;
    if (fulfillmentType === 'pickup') fulfillment[1].value += 1;

    const zone = getDeliveryZoneLabel(order);
    if (zone) {
      const current = zoneMap.get(zone) ?? { label: zone, orders: 0, revenue: 0 };
      current.orders += 1;
      current.revenue += total;
      zoneMap.set(zone, current);
    }

    const payment = getPaymentLabel(order) || 'Sin pago';
    paymentMap.set(payment, (paymentMap.get(payment) ?? 0) + 1);

    for (const item of getOrderItems(order)) {
      const label = item?.name || 'Producto sin nombre';
      const quantity = Number(item?.quantity ?? 1) || 1;
      const subtotal = Number(getItemSubtotal(item) || 0);
      const current = productMap.get(label) ?? { label, orders: 0, quantity: 0, revenue: 0 };
      current.orders += 1;
      current.quantity += quantity;
      current.revenue += subtotal;
      productMap.set(label, current);
    }
  }

  const strongestWeekday = weekdays.reduce((best, day) => (
    day.orders > best.orders ? day : best
  ), weekdays[0]);
  const hasWeekdayOrders = weekdays.some(day => day.orders > 0);
  summary.averageTicketMonth = summary.monthOrders ? Math.round(summary.monthRevenue / summary.monthOrders) : 0;
  summary.cancellationRate = orders.length ? Math.round((summary.cancelledOrders / orders.length) * 100) : 0;

  return {
    ...summary,
    weekdays,
    monthDays,
    fulfillment,
    timeSlots,
    payments: Array.from(paymentMap, ([label, value]) => ({ label, value })),
    topProducts: Array.from(productMap.values()).sort((a, b) => b.quantity - a.quantity).slice(0, 5),
    topZones: Array.from(zoneMap.values()).sort((a, b) => b.orders - a.orders).slice(0, 5),
    strongestWeekday: hasWeekdayOrders ? strongestWeekday : null,
  };
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

function LoginPanel({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    const { session, error: signInError } = await signInAdmin(email.trim(), password);

    if (signInError) {
      setError(signInError);
    } else {
      onLogin(session);
    }
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
    <div className="rounded-3xl border border-[#efc6d8] bg-white p-3 shadow-[0_16px_38px_rgba(63,33,40,0.08)] backdrop-blur sm:p-5">
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
    <section className="mt-4 rounded-3xl border border-[#efc6d8] bg-white p-4 shadow-[0_16px_38px_rgba(63,33,40,0.08)] backdrop-blur sm:p-5">
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
                  style={{ width: count ? `${Math.max(7, (count / max) * 100)}%` : '0%' }}
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

function InsightCard({ label, value, detail, Icon }) {
  return (
    <div className="rounded-3xl border border-[#efc6d8] bg-white p-4 shadow-[0_16px_38px_rgba(63,33,40,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#be185d]/62">{label}</p>
          <p className="mt-2 font-serif text-2xl font-bold text-[#3f2128]">{value}</p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#be185d]/12">
          <Icon className="h-4 w-4 text-[#be185d]" />
        </span>
      </div>
      <p className="mt-2 text-xs font-semibold leading-5 text-[#3f2128]/56">{detail}</p>
    </div>
  );
}

function MiniBarChart({ title, detail, data, valueKey = 'orders', formatValue = value => value }) {
  const max = Math.max(1, ...data.map(item => Number(item[valueKey]) || 0));

  return (
    <section className="rounded-3xl border border-[#efc6d8] bg-white p-4 shadow-[0_16px_38px_rgba(63,33,40,0.08)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-xl font-bold text-[#3f2128]">{title}</h3>
          <p className="mt-1 text-xs font-semibold leading-5 text-[#3f2128]/52">{detail}</p>
        </div>
        <BarChart3 className="h-5 w-5 shrink-0 text-[#be185d]" />
      </div>
      <div className="grid gap-3">
        {data.map(item => {
          const value = Number(item[valueKey]) || 0;
          return (
            <div key={item.label} className="grid grid-cols-[3.2rem_1fr_4.5rem] items-center gap-3 text-xs font-bold text-[#3f2128]/62">
              <span className="truncate">{item.label}</span>
              <span className="h-3 overflow-hidden rounded-full bg-[#f7dce8]">
                <span
                  className="block h-full rounded-full bg-[#be185d]"
                  style={{ width: `${value ? Math.max(7, (value / max) * 100) : 0}%` }}
                />
              </span>
              <span className="text-right text-[#3f2128]">{formatValue(value)}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function VerticalBarChart({ title, detail, data, valueKey = 'orders', formatValue = value => value }) {
  const max = Math.max(1, ...data.map(item => Number(item[valueKey]) || 0));

  return (
    <section className="rounded-3xl border border-[#efc6d8] bg-white p-4 shadow-[0_16px_38px_rgba(63,33,40,0.08)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-xl font-bold text-[#3f2128]">{title}</h3>
          <p className="mt-1 text-xs font-semibold leading-5 text-[#3f2128]/52">{detail}</p>
        </div>
        <TrendingUp className="h-5 w-5 shrink-0 text-[#be185d]" />
      </div>
      <div className="flex h-52 items-end gap-2 overflow-x-auto rounded-3xl bg-[#fff7fb] px-3 pb-3 pt-5">
        {data.map(item => {
          const value = Number(item[valueKey]) || 0;
          const barHeight = value ? Math.max(10, (value / max) * 100) : 0;
          return (
            <div key={item.label} className="flex min-w-[2.65rem] flex-1 flex-col items-center justify-end gap-2">
              <span className={`text-[10px] font-bold ${value ? 'text-[#3f2128]' : 'text-[#3f2128]/40'}`}>
                {formatValue(value)}
              </span>
              <span className="flex h-32 w-full items-end justify-center rounded-2xl border border-[#f1d3df] bg-white/74 px-1.5 pb-1.5">
                {value ? (
                  <span
                    className="block w-full rounded-2xl bg-gradient-to-t from-[#be185d] to-[#f472b6] shadow-[0_10px_20px_rgba(190,24,93,0.20)]"
                    style={{ height: `${barHeight}%` }}
                  />
                ) : (
                  <span className="mb-0.5 block h-1.5 w-7 rounded-full bg-[#efd0dc]" />
                )}
              </span>
              <span className="max-w-[3rem] truncate text-[10px] font-bold text-[#3f2128]/62">{item.label}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SplitBarChart({ title, detail, data }) {
  const total = Math.max(1, data.reduce((sum, item) => sum + item.value, 0));

  return (
    <section className="rounded-3xl border border-[#efc6d8] bg-white p-4 shadow-[0_16px_38px_rgba(63,33,40,0.08)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-xl font-bold text-[#3f2128]">{title}</h3>
          <p className="mt-1 text-xs font-semibold leading-5 text-[#3f2128]/52">{detail}</p>
        </div>
        <ReceiptText className="h-5 w-5 shrink-0 text-[#be185d]" />
      </div>
      <div className="grid gap-3">
        {data.length ? data.map(item => (
          <div key={item.label} className="grid grid-cols-[5.5rem_1fr_2rem] items-center gap-3 text-xs font-bold text-[#3f2128]/62">
            <span className="truncate">{item.label}</span>
            <span className="h-3 overflow-hidden rounded-full bg-[#f7dce8]">
              <span
                className="block h-full rounded-full bg-[#3f2128]"
                style={{ width: item.value ? `${Math.max(8, (item.value / total) * 100)}%` : '0%' }}
              />
            </span>
            <span className="text-right text-[#3f2128]">{item.value}</span>
          </div>
        )) : (
          <p className="rounded-2xl bg-[#fff7fb] px-4 py-3 text-sm font-semibold text-[#3f2128]/52">
            Aún no hay datos suficientes.
          </p>
        )}
      </div>
    </section>
  );
}

function RankingList({ title, detail, data, valueLabel }) {
  const max = Math.max(1, ...data.map(item => item.quantity ?? item.orders ?? item.value ?? 0));

  return (
    <section className="rounded-3xl border border-[#efc6d8] bg-white p-4 shadow-[0_16px_38px_rgba(63,33,40,0.08)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-xl font-bold text-[#3f2128]">{title}</h3>
          <p className="mt-1 text-xs font-semibold leading-5 text-[#3f2128]/52">{detail}</p>
        </div>
        <PackageCheck className="h-5 w-5 shrink-0 text-[#be185d]" />
      </div>
      <div className="grid gap-3">
        {data.length ? data.map(item => {
          const value = item.quantity ?? item.orders ?? item.value ?? 0;
          return (
            <div key={item.label} className="rounded-2xl bg-[#fff7fb] px-3 py-3">
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 truncate text-sm font-bold text-[#3f2128]">{item.label}</p>
                <p className="shrink-0 text-xs font-bold text-[#be185d]">{valueLabel(item)}</p>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#f7dce8]">
                <span
                  className="block h-full rounded-full bg-[#be185d]"
                  style={{ width: value ? `${Math.max(8, (value / max) * 100)}%` : '0%' }}
                />
              </div>
            </div>
          );
        }) : (
          <p className="rounded-2xl bg-[#fff7fb] px-4 py-3 text-sm font-semibold text-[#3f2128]/52">
            Aún no hay datos suficientes.
          </p>
        )}
      </div>
    </section>
  );
}

function AdminInsights({ insights }) {
  const monthDaysWithOrders = insights.monthDays.filter(day => day.orders > 0);
  const visibleMonthDays = monthDaysWithOrders.length ? monthDaysWithOrders : insights.monthDays.slice(0, 10);

  return (
    <section>
      <div className="mb-3">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#be185d]/62">Lectura del negocio</p>
        <h2 className="mt-1 font-serif text-2xl font-bold text-[#3f2128]">Datos para decidir mejor</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <InsightCard
          label="Hoy"
          value={`${insights.todayOrders} pedidos`}
          detail={`Ventas visibles: ${formatCLP(insights.todayRevenue)}`}
          Icon={CalendarDays}
        />
        <InsightCard
          label="Esta semana"
          value={`${insights.weekOrders} pedidos`}
          detail={`Ventas visibles: ${formatCLP(insights.weekRevenue)}`}
          Icon={BarChart3}
        />
        <InsightCard
          label="Este mes"
          value={`${insights.monthOrders} pedidos`}
          detail={`Ticket promedio: ${formatCLP(insights.averageTicketMonth)}`}
          Icon={ReceiptText}
        />
        <InsightCard
          label="Cancelación"
          value={`${insights.cancellationRate}%`}
          detail={`${insights.cancelledOrders} cancelados en los datos cargados`}
          Icon={Ban}
        />
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-2">
        <VerticalBarChart
          title="Semana por pedidos"
          detail={`Día más fuerte: ${insights.strongestWeekday?.label ?? 'sin datos'}`}
          data={insights.weekdays}
        />
        <VerticalBarChart
          title="Mes por ventas"
          detail="Días del mes con movimiento visible."
          data={visibleMonthDays}
          valueKey="revenue"
          formatValue={formatCLP}
        />
        <MiniBarChart
          title="Horarios fuertes"
          detail="Ayuda a preparar producción y respuestas por tramo horario."
          data={insights.timeSlots}
        />
        <SplitBarChart
          title="Retiro o delivery"
          detail="Ayuda a ver qué modalidad se usa más."
          data={insights.fulfillment}
        />
        <SplitBarChart
          title="Forma de pago"
          detail="Conteo simple por método registrado."
          data={insights.payments}
        />
        <RankingList
          title="Productos más pedidos"
          detail="Base para decidir stock, fotos y catálogo real."
          data={insights.topProducts}
          valueLabel={item => `${item.quantity} uds · ${formatCLP(item.revenue)}`}
        />
        <RankingList
          title="Zonas de delivery"
          detail="Sirve para entender rutas y posibles costos."
          data={insights.topZones}
          valueLabel={item => `${item.orders} pedidos`}
        />
      </div>
    </section>
  );
}

function AdminTabs({ activeTab, onChange }) {
  return (
    <div className="mb-5 overflow-x-auto pb-1">
      <div className="grid min-w-[42rem] grid-cols-3 gap-2 rounded-[1.6rem] border border-[#efc6d8] bg-white/78 p-2 shadow-[0_16px_42px_rgba(63,33,40,0.08)]">
        {ADMIN_TABS.map(({ value, label, detail, Icon }) => {
          const active = activeTab === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => onChange(value)}
              className={`flex min-h-[64px] items-center gap-3 rounded-[1.25rem] px-4 py-3 text-left transition ${
                active
                  ? 'bg-[#be185d] text-white shadow-[0_14px_30px_rgba(190,24,93,0.22)]'
                  : 'bg-white text-[#3f2128] hover:bg-[#fff7fb]'
              }`}
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${active ? 'bg-white/18' : 'bg-[#be185d]/10'}`}>
                <Icon className={`h-4 w-4 ${active ? 'text-white' : 'text-[#be185d]'}`} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold">{label}</span>
                <span className={`mt-0.5 block truncate text-xs font-semibold ${active ? 'text-white/74' : 'text-[#3f2128]/50'}`}>{detail}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CostsPlanningPanel() {
  const [savedDrafts, setSavedDrafts] = useState(readStoredCostDrafts);
  const [draft, setDraft] = useState(() => savedDrafts[0] ?? readStoredCostDraft());
  const [costNotice, setCostNotice] = useState('');

  useEffect(() => {
    localStorage.setItem(COST_DRAFT_KEY, JSON.stringify(draft));
  }, [draft]);

  useEffect(() => {
    localStorage.setItem(COST_SAVED_KEY, JSON.stringify(savedDrafts));
  }, [savedDrafts]);

  useEffect(() => {
    if (!costNotice) return undefined;
    const timeoutId = window.setTimeout(() => setCostNotice(''), 2600);
    return () => window.clearTimeout(timeoutId);
  }, [costNotice]);

  const totals = useMemo(() => {
    const ingredientTotal = draft.ingredients.reduce((sum, item) => sum + toPositiveNumber(item.cost), 0);
    const packagingCost = toPositiveNumber(draft.packagingCost);
    const decorationCost = toPositiveNumber(draft.decorationCost);
    const totalCost = ingredientTotal + packagingCost + decorationCost;
    const salePrice = toPositiveNumber(draft.salePrice);
    const targetMargin = Math.min(85, Math.max(5, Number(draft.targetMargin) || 45));
    const suggestedPrice = roundToNearest(totalCost / (1 - targetMargin / 100));
    const profit = salePrice - totalCost;
    const margin = salePrice ? Math.round((profit / salePrice) * 100) : 0;
    const costPerServing = toPositiveNumber(draft.servings) ? Math.round(totalCost / toPositiveNumber(draft.servings)) : 0;
    const pricePerServing = toPositiveNumber(draft.servings) ? Math.round(salePrice / toPositiveNumber(draft.servings)) : 0;
    const status = margin < targetMargin - 4
      ? { label: 'Precio bajo', detail: 'Conviene subir precio o revisar costos.', tone: 'danger' }
      : margin > targetMargin + 8
        ? { label: 'Buen margen', detail: 'El precio deja espacio saludable.', tone: 'good' }
        : { label: 'Cerca del objetivo', detail: 'El precio está dentro de un rango razonable.', tone: 'ok' };

    return {
      ingredientTotal,
      totalCost,
      suggestedPrice,
      profit,
      margin,
      costPerServing,
      pricePerServing,
      status,
      breakdown: [
        { label: 'Ingredientes', value: ingredientTotal, color: 'bg-[#be185d]' },
        { label: 'Empaque', value: packagingCost, color: 'bg-[#3f2128]' },
        { label: 'Decoración', value: decorationCost, color: 'bg-[#f472b6]' },
      ],
    };
  }, [draft]);

  const maxBreakdown = Math.max(1, ...totals.breakdown.map(item => item.value));

  function updateDraftField(field, value) {
    setDraft(prev => ({ ...prev, [field]: value }));
  }

  function updateIngredient(id, field, value) {
    setDraft(prev => ({
      ...prev,
      ingredients: prev.ingredients.map(item => (
        item.id === id
          ? { ...item, [field]: field === 'cost' ? toPositiveNumber(value) : value }
          : item
      )),
    }));
  }

  function addIngredient() {
    setDraft(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, createCostItem({ name: 'Nuevo insumo', quantity: 'cantidad', cost: 0 })],
    }));
  }

  function removeIngredient(id) {
    setDraft(prev => ({
      ...prev,
      ingredients: prev.ingredients.length > 1
        ? prev.ingredients.filter(item => item.id !== id)
        : prev.ingredients,
    }));
  }

  function applyPreset(preset) {
    setDraft(buildCostDraft(preset));
    setCostNotice(`Plantilla "${preset.label}" cargada. Ajusta los datos y guarda el cálculo.`);
  }

  function saveCurrentDraft() {
    const cleanDraft = sanitizeCostDraft({
      ...draft,
      productName: getCostDraftLabel(draft),
      updatedAt: new Date().toISOString(),
    });

    setDraft(cleanDraft);
    setSavedDrafts(prev => {
      const exists = prev.some(item => item.id === cleanDraft.id);
      const next = exists
        ? prev.map(item => item.id === cleanDraft.id ? cleanDraft : item)
        : [cleanDraft, ...prev];
      return next.slice(0, 40);
    });
    setCostNotice(`Guardado como "${getCostDraftLabel(cleanDraft)}".`);
  }

  function startNewDraft() {
    setDraft(buildBlankCostDraft());
    setCostNotice('Nuevo cálculo listo para completar.');
  }

  function loadSavedDraft(savedDraft) {
    setDraft(sanitizeCostDraft(savedDraft));
    setCostNotice(`Cargado: "${getCostDraftLabel(savedDraft)}".`);
  }

  function duplicateDraft() {
    const copy = sanitizeCostDraft({
      ...draft,
      id: createCostDraftId(),
      productName: `Copia de ${getCostDraftLabel(draft)}`,
      updatedAt: new Date().toISOString(),
    });
    setDraft(copy);
    setCostNotice('Copia creada. Ajusta el nombre y guarda.');
  }

  function deleteSavedDraft(id) {
    const next = savedDrafts.filter(item => item.id !== id);
    setSavedDrafts(next);
    if (draft.id === id) setDraft(next[0] ? sanitizeCostDraft(next[0]) : buildBlankCostDraft());
    setCostNotice('Cálculo eliminado de guardados.');
  }

  const statusClass = {
    danger: 'border-red-100 bg-red-50 text-red-600',
    good: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    ok: 'border-amber-100 bg-amber-50 text-amber-700',
  }[totals.status.tone];

  return (
    <section>
      <div className="mb-4 overflow-hidden rounded-[2rem] border border-[#efc6d8] bg-white shadow-[0_20px_54px_rgba(63,33,40,0.10)]">
        <div className="grid gap-4 bg-[linear-gradient(135deg,#fff_0%,#fff7fb_45%,#fce7f3_100%)] p-5 lg:grid-cols-[1.1fr_0.9fr] lg:p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#be185d]/62">Costos internos</p>
            <h2 className="mt-2 font-serif text-3xl font-bold leading-tight text-[#3f2128]">Calculadora de precios</h2>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#3f2128]/58">
              Estima ingredientes, empaque, decoración, margen y precio sugerido antes de vender.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-3xl border border-white/80 bg-white/82 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#be185d]/58">Precio sugerido</p>
              <p className="mt-2 font-serif text-2xl font-bold text-[#3f2128]">{formatCLP(totals.suggestedPrice)}</p>
            </div>
            <div className={`rounded-3xl border p-4 ${statusClass}`}>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] opacity-70">Lectura</p>
              <p className="mt-2 text-lg font-bold">{totals.status.label}</p>
            </div>
          </div>
        </div>
      </div>

      {costNotice && (
        <p className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          {costNotice}
        </p>
      )}

      <section className="mb-4 grid gap-3 lg:grid-cols-3">
        {[
          ['1', 'Elige o crea', 'Usa una plantilla, abre un cálculo guardado o empieza uno nuevo.'],
          ['2', 'Completa costos', 'Anota insumos, empaque y decoración sin llenar datos innecesarios.'],
          ['3', 'Revisa el precio', 'Mira el margen y guarda el cálculo para consultarlo después.'],
        ].map(([number, title, detail]) => (
          <div key={number} className="rounded-3xl border border-[#efc6d8] bg-white p-4 shadow-[0_12px_30px_rgba(63,33,40,0.07)]">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#be185d] text-sm font-bold text-white">
                {number}
              </span>
              <div>
                <h3 className="text-sm font-bold text-[#3f2128]">{title}</h3>
                <p className="mt-1 text-xs font-semibold leading-5 text-[#3f2128]/56">{detail}</p>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="mb-4 rounded-[2rem] border border-[#efc6d8] bg-white p-4 shadow-[0_16px_38px_rgba(63,33,40,0.08)]">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#be185d]/58">Guardados</p>
            <h3 className="mt-1 font-serif text-2xl font-bold text-[#3f2128]">Mis cálculos</h3>
            <p className="mt-1 text-xs font-semibold text-[#3f2128]/52">Se guardan en este navegador por ahora.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <button
              type="button"
              onClick={startNewDraft}
              className="rounded-2xl border border-[#efc6d8] bg-white px-4 py-2 text-xs font-bold text-[#3f2128]"
            >
              Nuevo
            </button>
            <button
              type="button"
              onClick={duplicateDraft}
              className="rounded-2xl border border-[#efc6d8] bg-[#fff7fb] px-4 py-2 text-xs font-bold text-[#be185d]"
            >
              Duplicar
            </button>
            <button
              type="button"
              onClick={saveCurrentDraft}
              className="col-span-2 rounded-2xl bg-[#be185d] px-4 py-2 text-xs font-bold text-white shadow-[0_12px_26px_rgba(190,24,93,0.18)] sm:col-span-1"
            >
              Guardar cálculo
            </button>
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {savedDrafts.length ? savedDrafts.map(savedDraft => {
            const active = draft.id === savedDraft.id;
            return (
              <div
                key={savedDraft.id}
                className={`rounded-3xl border p-3 transition ${
                  active
                    ? 'border-[#be185d]/45 bg-[#fff1f8] shadow-[0_12px_28px_rgba(190,24,93,0.10)]'
                    : 'border-[#efc6d8] bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[#3f2128]">{getCostDraftLabel(savedDraft)}</p>
                    <p className="mt-1 text-xs font-semibold text-[#3f2128]/48">
                      {formatCLP(savedDraft.salePrice)} · {savedDraft.servings} porciones
                    </p>
                  </div>
                  {active && (
                    <span className="rounded-full bg-[#be185d] px-2 py-1 text-[10px] font-bold text-white">Activo</span>
                  )}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => loadSavedDraft(savedDraft)}
                    className="rounded-2xl border border-[#efc6d8] bg-white px-3 py-2 text-xs font-bold text-[#be185d]"
                  >
                    Abrir
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteSavedDraft(savedDraft.id)}
                    className="rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold text-red-500"
                  >
                    Borrar
                  </button>
                </div>
              </div>
            );
          }) : (
            <p className="rounded-3xl border border-dashed border-[#efc6d8] bg-[#fff7fb] px-4 py-5 text-sm font-semibold text-[#3f2128]/54 md:col-span-2 xl:col-span-3">
              Todavía no hay cálculos guardados. Completa un producto y toca Guardar cálculo.
            </p>
          )}
        </div>
      </section>

      <section className="mb-4 rounded-[2rem] border border-[#efc6d8] bg-white p-4 shadow-[0_16px_38px_rgba(63,33,40,0.08)]">
        <div className="mb-3">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#be185d]/58">Plantillas rápidas</p>
          <h3 className="mt-1 font-serif text-2xl font-bold text-[#3f2128]">Partir desde un producto parecido</h3>
          <p className="mt-1 text-xs font-semibold text-[#3f2128]/52">Cargar una plantilla no borra tus guardados; úsala como base y luego guarda.</p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {COST_PRESETS.map(preset => (
            <button
              key={preset.key}
              type="button"
              onClick={() => applyPreset(preset)}
              className="rounded-2xl border border-[#efc6d8] bg-white px-4 py-3 text-left text-xs font-bold text-[#3f2128] shadow-[0_10px_24px_rgba(63,33,40,0.06)] transition hover:-translate-y-0.5 hover:border-[#be185d]/35"
            >
              <span className="block">{preset.label}</span>
              <span className="mt-0.5 block font-semibold text-[#be185d]/62">{formatCLP(preset.salePrice)}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-4">
          <section className="rounded-[2rem] border border-[#efc6d8] bg-white p-5 shadow-[0_16px_38px_rgba(63,33,40,0.08)]">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#be185d]/58">Producto</p>
                <h3 className="mt-1 font-serif text-2xl font-bold text-[#3f2128]">Datos de venta</h3>
                <p className="mt-1 text-xs font-semibold leading-5 text-[#3f2128]/52">
                  Completa lo que se cobra al cliente y cuántas porciones o unidades salen.
                </p>
              </div>
              <Calculator className="h-5 w-5 text-[#be185d]" />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="md:col-span-2">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#3f2128]/54">Nombre del producto</span>
                <input
                  value={draft.productName}
                  onChange={(event) => updateDraftField('productName', event.target.value)}
                  className="min-h-[48px] w-full rounded-2xl border border-[#efc6d8] bg-[#fff7fb] px-4 py-3 text-sm font-bold text-[#3f2128] outline-none transition focus:border-[#be185d]/45"
                />
              </label>
              {[
                ['servings', 'Porciones', 'number'],
                ['salePrice', 'Precio actual', 'number'],
                ['targetMargin', 'Margen objetivo %', 'number'],
              ].map(([field, label, type]) => (
                <label key={field}>
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#3f2128]/54">{label}</span>
                  <input
                    type={type}
                    min="0"
                    step="1"
                    value={draft[field]}
                    onChange={(event) => updateDraftField(field, event.target.value)}
                    className="min-h-[48px] w-full rounded-2xl border border-[#efc6d8] bg-[#fff7fb] px-4 py-3 text-sm font-bold text-[#3f2128] outline-none transition focus:border-[#be185d]/45"
                  />
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-[#efc6d8] bg-white p-5 shadow-[0_16px_38px_rgba(63,33,40,0.08)]">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#be185d]/58">Receta base</p>
                <h3 className="mt-1 font-serif text-2xl font-bold text-[#3f2128]">Insumos</h3>
                <p className="mt-1 text-xs font-semibold leading-5 text-[#3f2128]/52">
                  En costo escribe solo lo que se ocupa en este producto, no necesariamente el paquete completo.
                </p>
              </div>
              <button
                type="button"
                onClick={addIngredient}
                className="rounded-2xl bg-[#be185d] px-4 py-2 text-xs font-bold text-white shadow-[0_12px_26px_rgba(190,24,93,0.18)]"
              >
                Agregar
              </button>
            </div>

            <div className="grid gap-3">
              {draft.ingredients.map(item => (
                <div key={item.id} className="grid gap-2 rounded-3xl border border-[#f1d3df] bg-[#fff7fb] p-3 md:grid-cols-[1.35fr_0.9fr_0.75fr_auto] md:items-end">
                  <label>
                    <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#3f2128]/48">Insumo</span>
                    <input
                      value={item.name}
                      onChange={(event) => updateIngredient(item.id, 'name', event.target.value)}
                      className="min-h-[42px] w-full rounded-2xl border border-transparent bg-white px-3 py-2 text-sm font-bold text-[#3f2128] outline-none focus:border-[#be185d]/35"
                    />
                  </label>
                  <label>
                    <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#3f2128]/48">Cantidad</span>
                    <input
                      value={item.quantity}
                      onChange={(event) => updateIngredient(item.id, 'quantity', event.target.value)}
                      className="min-h-[42px] w-full rounded-2xl border border-transparent bg-white px-3 py-2 text-sm font-bold text-[#3f2128] outline-none focus:border-[#be185d]/35"
                    />
                  </label>
                  <label>
                    <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#3f2128]/48">Costo</span>
                    <input
                      type="number"
                      min="0"
                      value={item.cost}
                      onChange={(event) => updateIngredient(item.id, 'cost', event.target.value)}
                      className="min-h-[42px] w-full rounded-2xl border border-transparent bg-white px-3 py-2 text-sm font-bold text-[#3f2128] outline-none focus:border-[#be185d]/35"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => removeIngredient(item.id)}
                    disabled={draft.ingredients.length <= 1}
                    className="min-h-[42px] rounded-2xl border border-red-100 bg-white px-3 py-2 text-xs font-bold text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Quitar
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-[#efc6d8] bg-white p-5 shadow-[0_16px_38px_rgba(63,33,40,0.08)]">
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#be185d]/58">Gastos</p>
              <h3 className="mt-1 font-serif text-2xl font-bold text-[#3f2128]">Empaque y decoración</h3>
              <p className="mt-1 text-xs font-semibold leading-5 text-[#3f2128]/52">
                Por ahora dejamos solo estos dos gastos para que el cálculo sea simple y fácil de usar.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {[
                ['packagingCost', 'Empaque'],
                ['decorationCost', 'Decoración'],
              ].map(([field, label]) => (
                <label key={field}>
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#3f2128]/54">{label}</span>
                  <input
                    type="number"
                    min="0"
                    value={draft[field]}
                    onChange={(event) => updateDraftField(field, event.target.value)}
                    className="min-h-[48px] w-full rounded-2xl border border-[#efc6d8] bg-[#fff7fb] px-4 py-3 text-sm font-bold text-[#3f2128] outline-none transition focus:border-[#be185d]/45"
                  />
                </label>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-5 xl:self-start">
          <section className="overflow-hidden rounded-[2rem] border border-[#efc6d8] bg-white shadow-[0_22px_58px_rgba(63,33,40,0.12)]">
            <div className="bg-[linear-gradient(135deg,#3f2128_0%,#6b2b3a_55%,#be185d_100%)] p-5 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/58">Resultado</p>
              <h3 className="mt-2 font-serif text-3xl font-bold">{draft.productName || 'Producto'}</h3>
              <p className="mt-2 text-sm font-semibold text-white/72">{totals.status.detail}</p>
            </div>

            <div className="grid gap-3 p-5">
              {[
                ['Costo total', formatCLP(totals.totalCost)],
                ['Precio actual', formatCLP(draft.salePrice)],
                ['Ganancia estimada', formatCLP(totals.profit)],
                ['Margen actual', `${totals.margin}%`],
                ['Costo por porción', formatCLP(totals.costPerServing)],
                ['Precio por porción', formatCLP(totals.pricePerServing)],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3 rounded-2xl bg-[#fff7fb] px-4 py-3">
                  <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#3f2128]/52">{label}</span>
                  <span className="font-serif text-lg font-bold text-[#3f2128]">{value}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-[#efc6d8] bg-white p-5 shadow-[0_16px_38px_rgba(63,33,40,0.08)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#be185d]/58">Desglose</p>
                <h3 className="mt-1 font-serif text-2xl font-bold text-[#3f2128]">Dónde se va el costo</h3>
              </div>
              <ReceiptText className="h-5 w-5 text-[#be185d]" />
            </div>
            <div className="grid gap-3">
              {totals.breakdown.map(item => (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between gap-3 text-xs font-bold text-[#3f2128]/58">
                    <span>{item.label}</span>
                    <span>{formatCLP(item.value)}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-[#f7dce8]">
                    <span
                      className={`block h-full rounded-full ${item.color}`}
                      style={{ width: item.value ? `${Math.max(8, (item.value / maxBreakdown) * 100)}%` : '0%' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-[#efc6d8] bg-white p-5 shadow-[0_16px_38px_rgba(63,33,40,0.08)]">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#be185d]/10">
                <BarChart3 className="h-5 w-5 text-[#be185d]" />
              </span>
              <div>
                <h3 className="font-serif text-2xl font-bold text-[#3f2128]">Siguiente mejora</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#3f2128]/58">
                  En la próxima pasada podemos guardar recetas reales en Supabase y comparar precio vendido contra costo real por pedido.
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}

function WorkspaceCard({ eyebrow, title, detail, Icon, muted = false }) {
  return (
    <div className="rounded-3xl border border-[#efc6d8] bg-white p-4 shadow-[0_16px_38px_rgba(63,33,40,0.08)] backdrop-blur sm:p-5">
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
                  : 'border-[#efc6d8] bg-white text-[#3f2128]/76 shadow-[0_8px_22px_rgba(63,33,40,0.06)]'
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
  const readyMessage = status === 'ready'
    ? buildQuickMessages(order).find(message => message.key === 'ready')?.text ?? ''
    : '';
  const whatsappUrl = buildCustomerWhatsAppUrl(order, readyMessage);
  const isBusy = updatingStatusId === order.id || cancellingOrderId === order.id;

  return (
    <article className="rounded-3xl border border-[#efc6d8] bg-white p-4 shadow-[0_18px_44px_rgba(63,33,40,0.09)] backdrop-blur transition hover:border-[#be185d]/30 sm:p-5">
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
            {status === 'ready' ? 'Avisar listo' : 'WhatsApp'}
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
function Dashboard({ session, onSignOut }) {
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState('');
  const [statusError, setStatusError] = useState('');
  const [statusNotice, setStatusNotice] = useState('');
  const [activeTab, setActiveTab] = useState('orders');
  const [activeFilter, setActiveFilter] = useState('active');
  const [selectedOrderKey, setSelectedOrderKey] = useState(null);
  const [copiedMessageKey, setCopiedMessageKey] = useState('');
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [cancelDraft, setCancelDraft] = useState(null);
  const [cancelError, setCancelError] = useState('');

  const loadOrders = useCallback(async () => {
    setLoadingOrders(true);
    setOrdersError('');

    const { data, error } = await fetchAdminOrders(session, ORDER_FETCH_LIMIT);

    if (error) {
      setOrders([]);
      setOrdersError(error);
    } else {
      setOrders(Array.isArray(data) ? data : []);
    }

    setLoadingOrders(false);
  }, [session]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    if (!statusNotice) return undefined;
    const timeoutId = window.setTimeout(() => setStatusNotice(''), 4200);
    return () => window.clearTimeout(timeoutId);
  }, [statusNotice]);

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
        ? orders.filter(order => (
            filter.statuses.includes(getStatus(order)) && isVisibleHistoryOrder(order)
          )).length
        : orders.filter(isVisibleHistoryOrder).length;
      return acc;
    }, {})
  ), [orders]);

  const currentFilter = ORDER_FILTERS.find(filter => filter.value === activeFilter) ?? ORDER_FILTERS[0];
  const insights = useMemo(() => buildAdminInsights(orders), [orders]);

  const filteredOrders = useMemo(() => {
    const visibleOrders = orders.filter(isVisibleHistoryOrder);
    if (!currentFilter.statuses) return visibleOrders;
    return visibleOrders.filter(order => currentFilter.statuses.includes(getStatus(order)));
  }, [orders, currentFilter]);

  const selectedOrder = useMemo(() => (
    selectedOrderKey
      ? orders.find(order => getOrderKey(order) === selectedOrderKey) ?? null
      : null
  ), [orders, selectedOrderKey]);

  async function handleSignOut() {
    await signOutAdmin(session);
    onSignOut();
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
    setStatusNotice('');
    setUpdatingStatusId(order.id);
    setOrders(prev => prev.map(item => item.id === order.id ? { ...item, ...updatePayload } : item));

    const { error } = await updateAdminOrder(session, order.id, updatePayload);

    if (error) {
      setOrders(previousOrders);
      setStatusError(error);
    } else if (nextStatus === 'ready') {
      setStatusNotice('Pedido marcado como listo. Ahora puedes avisar al cliente desde WhatsApp.');
    } else if (nextStatus === 'delivered') {
      setSelectedOrderKey(null);
      setStatusNotice('Pedido entregado. Quedó guardado en Historial y salió de Activos.');
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
    setStatusNotice('');
    setCancellingOrderId(cancelDraft.order.id);
    setOrders(prev => prev.map(item => (
      item.id === cancelDraft.order.id
        ? { ...item, ...updatePayload }
        : item
    )));

    const { error } = await updateAdminOrder(session, cancelDraft.order.id, updatePayload);

    if (error) {
      setOrders(previousOrders);
      setCancelError(error);
    } else {
      setCancelDraft(null);
      setSelectedOrderKey(null);
      setStatusNotice('Pedido cancelado con motivo. Quedó guardado en Historial.');
    }

    setCancellingOrderId(null);
  }

  return (
    <AdminFrame>
      <header className="mb-5 flex flex-col gap-4 rounded-[2rem] border border-[#efc6d8] bg-white/92 px-4 py-4 shadow-[0_18px_48px_rgba(63,33,40,0.09)] backdrop-blur-xl sm:px-5 sm:py-5 md:flex-row md:items-center md:justify-between">
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

      <AdminTabs activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'orders' && (
        <>
          <section className="mb-4 grid gap-3 md:grid-cols-2">
            <WorkspaceCard
              eyebrow="Pedidos"
              title="Operación del día"
              detail="Atiende solo lo que necesita acción: nuevo, confirmado, preparación y listo."
              Icon={PackageCheck}
            />
            <WorkspaceCard
              eyebrow="WhatsApp"
              title="Respuestas rápidas"
              detail="Abre el chat del cliente o copia mensajes para confirmar, pedir abono y avisar avances."
              Icon={MessageCircle}
              muted
            />
          </section>

          <section className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
            <MetricCard label="Nuevos" value={metrics.counts.pending ?? 0} Icon={Clock3} />
            <MetricCard label="Confirmados" value={metrics.counts.confirmed ?? 0} Icon={CheckCircle2} />
            <MetricCard label="En preparación" value={metrics.counts.preparing ?? 0} Icon={PackageCheck} />
            <MetricCard label="Listos" value={metrics.counts.ready ?? 0} Icon={PackageCheck} />
          </section>

          <section className="mt-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#be185d]/54">Operación</p>
                <h2 className="mt-1 font-serif text-2xl font-bold text-[#3f2128]">Pedidos recientes</h2>
                <p className="mt-1 text-xs font-semibold leading-5 text-[#3f2128]/50">
                  Historial, entregados y cancelados muestran solo los últimos {HISTORY_VISIBLE_DAYS} días. No se borran de Supabase.
                </p>
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
            {statusNotice && (
              <p className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                {statusNotice}
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
              emptyDetail={orders.length ? `Cambia el filtro para revisar pedidos recientes. Los cerrados de más de ${HISTORY_VISIBLE_DAYS} días quedan ocultos de esta vista.` : 'Los nuevos pedidos apareceran aqui despues de enviarse por WhatsApp. Si acabas de hacer una prueba, espera unos segundos y toca Actualizar.'}
            />
          </section>
        </>
      )}

      {activeTab === 'insights' && (
        <>
          <section className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
            <MetricCard label="Activos" value={insights.activeOrders} Icon={PackageCheck} />
            <MetricCard label="Listos" value={insights.readyOrders} Icon={CheckCircle2} />
            <MetricCard label="Entregados" value={metrics.counts.delivered ?? 0} Icon={Truck} />
            <MetricCard label="Cancelados" value={metrics.counts.cancelled ?? 0} Icon={Ban} />
            <MetricCard label="Ticket mes" value={formatCLP(insights.averageTicketMonth)} Icon={ReceiptText} />
            <MetricCard label="Ventas visibles" value={formatCLP(metrics.revenue)} Icon={BarChart3} />
          </section>

          <StatusBars counts={metrics.counts} />
          <section className="mt-5">
            <AdminInsights insights={insights} />
          </section>
        </>
      )}

      {activeTab === 'costs' && <CostsPlanningPanel />}

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

function AccessDenied({ session, onSignOut }) {
  async function handleSignOut() {
    await signOutAdmin(session);
    onSignOut();
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

    getStoredAdminSession().then(({ session: storedSession }) => {
      if (!mounted) return;
      setSession(storedSession ?? null);
      setBooting(false);
    }).catch(() => {
      if (!mounted) return;
      setSession(null);
      setBooting(false);
    });

    return () => {
      mounted = false;
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

  if (!session) return <LoginPanel onLogin={setSession} />;

  if (!isAllowedAdminEmail(session.user.email)) {
    return <AccessDenied session={session} onSignOut={() => setSession(null)} />;
  }

  return <Dashboard session={session} onSignOut={() => setSession(null)} />;
}
