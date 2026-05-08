import { motion } from 'framer-motion';
import { AlertCircle, Ban, CalendarDays, CheckCircle2, Clock3, Copy, CopyCheck, ExternalLink, MessageCircle, PackageCheck, PhoneCall, ReceiptText, RefreshCw, Send, Truck, X } from 'lucide-react';
import { MetricCard, WorkspaceCard } from './AdminUi';
import { buildCustomerWhatsAppUrl, buildQuickMessages, formatCLP, formatOrderDate, formatOrderTime, getCancellationReason, getCustomerName, getCustomerPhone, getDeliveryAddress, getDeliveryFee, getFulfillmentText, getItemSubtotal, getOrderComments, getOrderDate, getOrderItems, getOrderItemsPreview, getOrderKey, getOrderReference, getOrderTotal, getPaymentLabel, getPreferredTime, getStatus, getSubtotalProducts, HISTORY_VISIBLE_DAYS, ORDER_FILTERS, STATUS_LABELS, STATUS_OPTIONS, STATUS_STYLES } from './adminData';

const STATUS_ACTIONS = [
  { value: 'pending', label: 'Nuevo', Icon: Clock3 },
  { value: 'confirmed', label: 'Confirmar', Icon: CheckCircle2 },
  { value: 'preparing', label: 'En preparacion', Icon: PackageCheck },
  { value: 'ready', label: 'Listo', Icon: CheckCircle2 },
  { value: 'delivered', label: 'Entregado', Icon: PackageCheck },
];

function getNextStatusAction(order) {
  const status = getStatus(order);
  if (status === 'pending') return { value: 'confirmed', label: 'Confirmar pedido', Icon: CheckCircle2 };
  if (status === 'confirmed') return { value: 'preparing', label: 'Pasar a preparacion', Icon: PackageCheck };
  if (status === 'preparing') return { value: 'ready', label: 'Marcar listo', Icon: CheckCircle2 };
  if (status === 'ready') return { value: 'delivered', label: 'Marcar entregado', Icon: PackageCheck };
  return null;
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

export function OrderDetailSheet({
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

export default function AdminOrders({
  metrics,
  filterCounts,
  activeFilter,
  onFilterChange,
  statusError,
  statusNotice,
  loadOrders,
  orders,
  filteredOrders,
  currentFilter,
  loadingOrders,
  ordersError,
  onOpenDetails,
  onStatusChange,
  onRequestCancel,
  updatingStatusId,
  cancellingOrderId,
}) {
  return (
    <>
      <section className="mb-4 grid gap-3 md:grid-cols-2">
        <WorkspaceCard
          eyebrow="Pedidos"
          title="Operacion del dia"
          detail="Atiende solo lo que necesita accion: nuevo, confirmado, preparacion y listo."
          Icon={PackageCheck}
        />
        <WorkspaceCard
          eyebrow="WhatsApp"
          title="Respuestas rapidas"
          detail="Abre el chat del cliente o copia mensajes para confirmar, pedir abono y avisar avances."
          Icon={MessageCircle}
          muted
        />
      </section>

      <section className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
        <MetricCard label="Nuevos" value={metrics.counts.pending ?? 0} Icon={Clock3} />
        <MetricCard label="Confirmados" value={metrics.counts.confirmed ?? 0} Icon={CheckCircle2} />
        <MetricCard label="En preparacion" value={metrics.counts.preparing ?? 0} Icon={PackageCheck} />
        <MetricCard label="Listos" value={metrics.counts.ready ?? 0} Icon={PackageCheck} />
      </section>

      <section className="mt-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#be185d]/54">Operacion</p>
            <h2 className="mt-1 font-serif text-2xl font-bold text-[#3f2128]">Pedidos recientes</h2>
            <p className="mt-1 text-xs font-semibold leading-5 text-[#3f2128]/50">
              Historial, entregados y cancelados muestran solo los ultimos {HISTORY_VISIBLE_DAYS} dias. No se borran de Supabase.
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
          <OrdersFilters activeFilter={activeFilter} counts={filterCounts} onChange={onFilterChange} />
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
          onOpenDetails={onOpenDetails}
          onStatusChange={onStatusChange}
          onRequestCancel={onRequestCancel}
          updatingStatusId={updatingStatusId}
          cancellingOrderId={cancellingOrderId}
          emptyTitle={orders.length ? `Sin pedidos en ${currentFilter.label.toLowerCase()}` : 'Sin pedidos todavia'}
          emptyDetail={orders.length ? `Cambia el filtro para revisar pedidos recientes. Los cerrados de mas de ${HISTORY_VISIBLE_DAYS} dias quedan ocultos de esta vista.` : 'Los nuevos pedidos apareceran aqui despues de enviarse por WhatsApp. Si acabas de hacer una prueba, espera unos segundos y toca Actualizar.'}
        />
      </section>
    </>
  );
}
