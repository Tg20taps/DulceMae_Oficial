import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Lock, LogOut, Mail, RefreshCw, ShieldCheck } from 'lucide-react';
import { signInAdmin, signOutAdmin } from '../../lib/adminApi';

export function AdminFrame({ children }) {
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

export function AdminUnavailable() {
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

export function LoginPanel({ onLogin }) {
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

export function AccessDenied({ session, onSignOut }) {
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
