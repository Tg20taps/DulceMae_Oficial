export const STATUS_LABELS = {
  pending: 'Nuevo',
  confirmed: 'Confirmado',
  preparing: 'En preparación',
  ready: 'Listo',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

export const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }));
export const ACTIVE_ORDER_STATUSES = ['pending', 'confirmed', 'preparing', 'ready'];
export const HISTORY_ORDER_STATUSES = ['delivered', 'cancelled'];
export const ORDER_FETCH_LIMIT = 200;
export const HISTORY_VISIBLE_DAYS = 30;

export const ORDER_FILTERS = [
  { value: 'active', label: 'Activos', statuses: ACTIVE_ORDER_STATUSES },
  { value: 'pending', label: 'Nuevo', statuses: ['pending'] },
  { value: 'confirmed', label: 'Confirmado', statuses: ['confirmed'] },
  { value: 'preparing', label: 'En preparación', statuses: ['preparing'] },
  { value: 'ready', label: 'Listo', statuses: ['ready'] },
  { value: 'delivered', label: 'Entregado', statuses: ['delivered'] },
  { value: 'cancelled', label: 'Cancelado', statuses: ['cancelled'] },
  { value: 'history', label: 'Historial', statuses: HISTORY_ORDER_STATUSES },
];

export const STATUS_STYLES = {
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

export const CANCELLATION_REASONS = [
  {
    value: 'test_order',
    label: 'Pedido de prueba',
    detail: 'Para pedidos ficticios o pruebas internas.',
  },
  {
    value: 'client_not_confirmed',
    label: 'Cliente no confirmo',
    detail: 'Se pidió confirmación y no hubo respuesta.',
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
    detail: 'Faltaba stock, un ingrediente o tiempo para prepararlo.',
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

export const CANCELLATION_REASON_LABELS = Object.fromEntries(
  CANCELLATION_REASONS.map(reason => [reason.value, reason.label])
);

export function formatCLP(value) {
  const numeric = Number(value) || 0;
  return `$${numeric.toLocaleString('es-CL')}`;
}

export function toOrderDate(value) {
  if (!value) return null;

  const date = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T12:00:00`)
    : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

export function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function startOfWeek(date) {
  const copy = startOfDay(date);
  const mondayOffset = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - mondayOffset);
  return copy;
}

export function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function addMonths(date, months) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

export function isDateInRange(date, start, end) {
  return date >= start && date < end;
}

export function getHistoryDate(order) {
  return (
    toOrderDate(order?.cancelled_at) ??
    toOrderDate(order?.delivered_at) ??
    toOrderDate(order?.updated_at) ??
    toOrderDate(getOrderDate(order)) ??
    toOrderDate(order?.created_at)
  );
}

export function isVisibleHistoryOrder(order) {
  if (!HISTORY_ORDER_STATUSES.includes(getStatus(order))) return true;
  const historyDate = getHistoryDate(order);
  if (!historyDate) return true;
  return historyDate >= addDays(startOfDay(new Date()), -HISTORY_VISIBLE_DAYS);
}

export function getOrderTotal(order) {
  return (
    order?.total_clp ??
    order?.summary?.total_clp ??
    order?.total ??
    order?.amount ??
    0
  );
}

export function getCustomerName(order) {
  return order?.customer_name ?? order?.customer?.name ?? order?.name ?? 'Cliente sin nombre';
}

export function getCustomerPhone(order) {
  return order?.customer_phone ?? order?.customer?.phone ?? '';
}

export function getOrderDate(order) {
  return order?.delivery_date ?? order?.customer?.delivery_date ?? order?.created_at ?? null;
}

export function getPreferredTime(order) {
  return order?.preferred_time ?? order?.customer?.preferred_time ?? '';
}

export function getFulfillmentSummary(order) {
  const label = order?.fulfillment_label ?? order?.fulfillment?.label ?? '';
  const zone = order?.delivery_zone_label ?? order?.fulfillment?.delivery_zone_label ?? '';
  return [label, zone].filter(Boolean).join(' · ');
}

export function getOrderItemsPreview(order) {
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

export function getStatus(order) {
  return order?.status ?? order?.order_status ?? 'pending';
}

export function getCancellationReason(order) {
  const reason = order?.cancel_reason ?? order?.cancellation_reason ?? '';
  return order?.cancel_reason_label ?? CANCELLATION_REASON_LABELS[reason] ?? '';
}

export function getOrderKey(order) {
  return order?.id ?? order?.order_id ?? `${getCustomerName(order)}-${getOrderDate(order)}`;
}

export function getOrderReference(order) {
  return order?.order_id ?? order?.id ?? 'Sin referencia';
}

export function getOrderItems(order) {
  if (Array.isArray(order?.items)) return order.items;
  if (Array.isArray(order?.payload?.items)) return order.payload.items;
  return [];
}

export function getItemSubtotal(item) {
  return item?.subtotal ?? (Number(item?.unit_price ?? item?.price ?? 0) * Number(item?.quantity ?? 1));
}

export function getSubtotalProducts(order) {
  return order?.subtotal_products_clp ?? order?.summary?.subtotal_products_clp ?? 0;
}

export function getDeliveryFee(order) {
  return order?.delivery_fee_clp ?? order?.summary?.delivery_fee_clp ?? 0;
}

export function getFulfillmentType(order) {
  return order?.fulfillment_type ?? order?.fulfillment?.type ?? order?.payload?.fulfillment?.type ?? '';
}

export function getFulfillmentLabel(order) {
  return order?.fulfillment_label ?? order?.fulfillment?.label ?? order?.payload?.fulfillment?.label ?? '';
}

export function getDeliveryZoneLabel(order) {
  return order?.delivery_zone_label ?? order?.fulfillment?.delivery_zone_label ?? order?.payload?.fulfillment?.delivery_zone_label ?? '';
}

export function getDeliveryAddress(order) {
  return order?.address ?? order?.fulfillment?.address ?? order?.payload?.fulfillment?.address ?? '';
}

export function getPaymentLabel(order) {
  return order?.payment_label ?? order?.payment?.label ?? order?.payload?.payment?.label ?? '';
}

export function getOrderComments(order) {
  return order?.comments ?? order?.customer?.comments ?? order?.payload?.customer?.comments ?? '';
}

export function formatOrderDate(value, options = {}) {
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

export function formatTimeMeridiem(value) {
  if (!value) return '';
  const [hourText, minuteText = '00'] = String(value).split(':');
  const hour = Number(hourText);
  if (!Number.isFinite(hour)) return String(value);

  const minute = String(Number(minuteText) || 0).padStart(2, '0');
  const hour12 = hour % 12 || 12;
  const suffix = hour < 12 ? 'a.m.' : 'p.m.';
  return `${hour12}:${minute} ${suffix}`;
}

export function formatOrderTime(value) {
  if (!value) return 'Sin hora';
  const readable = formatTimeMeridiem(value);
  return readable ? `${value} (${readable})` : value;
}

export function getFulfillmentText(order) {
  const type = getFulfillmentType(order);
  const label = getFulfillmentLabel(order);
  const zone = getDeliveryZoneLabel(order);

  if (type === 'delivery') return ['Delivery', zone].filter(Boolean).join(' - ');
  if (type === 'pickup') return 'Retiro';
  return getFulfillmentSummary(order) || [label, zone].filter(Boolean).join(' - ') || 'Sin entrega definida';
}

export function normalizeWhatsAppPhone(value) {
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

export function buildCustomerWhatsAppUrl(order, message = '') {
  const phone = normalizeWhatsAppPhone(getCustomerPhone(order));
  if (!phone) return '';
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${phone}${text}`;
}

export function buildQuickMessages(order) {
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

export const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export function getOrderAnalysisDate(order) {
  return toOrderDate(getOrderDate(order)) ?? toOrderDate(order?.created_at);
}

export function buildAdminInsights(orders) {
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
