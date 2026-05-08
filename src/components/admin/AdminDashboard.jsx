import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Ban,
  BarChart3,
  Calculator,
  ClipboardList,
  LogOut,
  RefreshCw,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { fetchAdminOrders, signOutAdmin, updateAdminOrder } from '../../lib/adminApi';
import { adminAllowedEmails } from '../../lib/supabaseConfig';
import { AdminFrame } from './AdminAuth';
import AdminCosts from './AdminCosts';
import AdminInsights from './AdminInsights';
import AdminOrders, { OrderDetailSheet } from './AdminOrders';
import {
  buildAdminInsights,
  CANCELLATION_REASON_LABELS,
  CANCELLATION_REASONS,
  formatCLP,
  getCustomerName,
  getOrderKey,
  getOrderTotal,
  getStatus,
  isVisibleHistoryOrder,
  ORDER_FETCH_LIMIT,
  ORDER_FILTERS,
  STATUS_OPTIONS,
} from './adminData';

const ADMIN_TABS = [
  { value: 'orders', label: 'Pedidos', detail: 'Atender y responder', Icon: ClipboardList },
  { value: 'insights', label: 'Analisis', detail: 'Dia, semana y mes', Icon: BarChart3 },
  { value: 'costs', label: 'Costos', detail: 'Calcular precios', Icon: Calculator },
];

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

export default function AdminDashboard({ session, onSignOut }) {
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
      setStatusNotice('Pedido entregado. Quedo guardado en Historial y salio de Activos.');
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
      setStatusNotice('Pedido cancelado con motivo. Quedo guardado en Historial.');
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
        <AdminOrders
          metrics={metrics}
          filterCounts={filterCounts}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          statusError={statusError}
          statusNotice={statusNotice}
          loadOrders={loadOrders}
          orders={orders}
          filteredOrders={filteredOrders}
          currentFilter={currentFilter}
          loadingOrders={loadingOrders}
          ordersError={ordersError}
          onOpenDetails={handleOpenDetails}
          onStatusChange={handleStatusChange}
          onRequestCancel={openCancelOrder}
          updatingStatusId={updatingStatusId}
          cancellingOrderId={cancellingOrderId}
        />
      )}

      {activeTab === 'insights' && <AdminInsights insights={insights} metrics={metrics} />}
      {activeTab === 'costs' && <AdminCosts />}

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
                  {cancelDraft.order.order_id ?? cancelDraft.order.id} - {formatCLP(getOrderTotal(cancelDraft.order))}
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
