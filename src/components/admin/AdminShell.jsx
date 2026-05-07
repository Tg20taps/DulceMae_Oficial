import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  Lock,
  LogOut,
  Mail,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react';
import {
  adminAllowedEmails,
  isAllowedAdminEmail,
  isSupabaseConfigured,
  supabase,
} from '../../lib/supabaseClient';

const STATUS_LABELS = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  preparing: 'En obrador',
  ready: 'Listo',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

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

function getOrderDate(order) {
  return order?.delivery_date ?? order?.customer?.delivery_date ?? order?.created_at ?? null;
}

function getStatus(order) {
  return order?.status ?? order?.order_status ?? 'pending';
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
    <div className="rounded-3xl border border-pink-100 bg-white/78 p-5 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#be185d]/54">{label}</p>
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#be185d]/10">
          <Icon className="h-4 w-4 text-[#be185d]" />
        </span>
      </div>
      <p className="mt-4 font-serif text-3xl font-bold text-[#3f2128]">{value}</p>
    </div>
  );
}

function OrdersTable({ orders, loading, error, onRefresh }) {
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
          className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-bold text-amber-900 shadow-sm"
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
        <p className="mt-4 font-serif text-2xl font-bold text-[#3f2128]">Sin pedidos todavía</p>
        <p className="mt-2 max-w-md text-sm font-medium leading-6 text-[#3f2128]/52">
          Cuando conectemos el webhook o la escritura directa a Supabase, los pedidos aparecerán aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-pink-100 bg-white/82 shadow-sm backdrop-blur">
      <div className="grid grid-cols-[1.2fr_1fr_0.8fr_0.7fr] gap-4 border-b border-pink-100 px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-[#be185d]/50">
        <span>Cliente</span>
        <span>Fecha</span>
        <span>Estado</span>
        <span className="text-right">Total</span>
      </div>
      <div className="divide-y divide-pink-50">
        {orders.map(order => {
          const status = getStatus(order);
          return (
            <article key={order.id ?? order.order_id ?? `${getCustomerName(order)}-${getOrderDate(order)}`} className="grid grid-cols-[1.2fr_1fr_0.8fr_0.7fr] items-center gap-4 px-5 py-4 text-sm">
              <div className="min-w-0">
                <p className="truncate font-bold text-[#3f2128]">{getCustomerName(order)}</p>
                <p className="mt-1 truncate text-xs font-semibold text-[#3f2128]/42">{order.order_id ?? order.id ?? 'Pedido sin referencia'}</p>
              </div>
              <p className="font-semibold text-[#3f2128]/62">{getOrderDate(order) ?? 'Sin fecha'}</p>
              <span className="w-fit rounded-full bg-[#be185d]/10 px-3 py-1 text-xs font-bold text-[#be185d]">
                {STATUS_LABELS[status] ?? status}
              </span>
              <p className="text-right font-serif text-lg font-bold text-[#3f2128]">{formatCLP(getOrderTotal(order))}</p>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function Dashboard({ session }) {
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState('');

  const loadOrders = useCallback(async () => {
    setLoadingOrders(true);
    setOrdersError('');

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

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
    const pending = orders.filter(order => getStatus(order) === 'pending').length;
    const confirmed = orders.filter(order => ['confirmed', 'preparing', 'ready'].includes(getStatus(order))).length;
    const revenue = orders.reduce((sum, order) => sum + Number(getOrderTotal(order) || 0), 0);
    return { pending, confirmed, revenue };
  }, [orders]);

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  return (
    <AdminFrame>
      <header className="mb-6 flex flex-col gap-4 rounded-[2rem] border border-white/70 bg-white/72 px-5 py-5 shadow-sm backdrop-blur-xl md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#be185d]/10">
            <Sparkles className="h-5 w-5 text-[#be185d]" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#be185d]/60">Panel privado</p>
            <h1 className="mt-1 font-serif text-3xl font-bold text-[#3f2128]">DulceMae Admin</h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-2xl border border-pink-100 bg-white px-4 py-2 text-xs font-bold text-[#3f2128]/62">
            <UserRound className="h-4 w-4 text-[#be185d]" />
            {session.user.email}
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

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Pendientes" value={metrics.pending} Icon={Clock3} />
        <MetricCard label="En proceso" value={metrics.confirmed} Icon={PackageCheck} />
        <MetricCard label="Ventas visibles" value={formatCLP(metrics.revenue)} Icon={BarChart3} />
      </section>

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
        <OrdersTable orders={orders} loading={loadingOrders} error={ordersError} onRefresh={loadOrders} />
      </section>
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
