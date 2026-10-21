import { useCallback, useEffect, useState } from 'react';

export function MetricCard({ label, value, Icon }) {
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

export function WorkspaceCard({ eyebrow, title, detail, Icon, muted = false }) {
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
// ── Piezas comunes del admin ─────────────────────────────────────────────
// Pensadas para usar con el pulgar: áreas de toque de 48 px o más, texto de
// 16 px en los campos (en iPhone, menos de eso hace zoom al escribir) y
// palabras en vez de íconos sueltos.

export function SectionTitle({ title, subtitle, action }) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="font-serif text-3xl font-bold text-[#3f2128]">{title}</h2>
        {subtitle && <p className="mt-1 max-w-xl text-sm font-medium leading-6 text-[#3f2128]/60">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function PrimaryButton({ children, className = '', ...props }) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-[#be185d] px-5 text-base font-bold text-white shadow-[0_12px_28px_rgba(190,24,93,0.22)] transition hover:bg-[#a31550] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, className = '', ...props }) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-[#efc6d8] bg-white px-4 text-sm font-bold text-[#3f2128] transition hover:border-[#be185d]/40 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export function TextField({ label, hint, className = '', multiline = false, ...props }) {
  const Input = multiline ? 'textarea' : 'input';
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-bold text-[#3f2128]/75">{label}</span>
      <Input
        {...props}
        className="min-h-[52px] w-full rounded-2xl border border-[#efc6d8] bg-[#fff7fb] px-4 py-3 text-base font-semibold text-[#3f2128] outline-none transition placeholder:font-medium placeholder:text-[#3f2128]/30 focus:border-[#be185d]/50 focus:bg-white"
      />
      {hint && <span className="mt-1 block text-xs font-medium text-[#3f2128]/50">{hint}</span>}
    </label>
  );
}

// Campo de plata: acepta "25.000", "25000" o "$25.000" y guarda el número.
export function MoneyField({ label, value, onChange, hint, placeholder = '0', className = '' }) {
  const shown = value === '' || value === null || value === undefined ? '' : Number(value).toLocaleString('es-CL');
  return (
    <label className={`block ${className}`}>
      {label && <span className="mb-1.5 block text-sm font-bold text-[#3f2128]/75">{label}</span>}
      <span className="relative block">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base font-bold text-[#3f2128]/40">$</span>
        <input
          inputMode="numeric"
          value={shown}
          placeholder={placeholder}
          onChange={(event) => {
            const digits = event.target.value.replace(/\D/g, '').slice(0, 9);
            onChange(digits === '' ? '' : Number(digits));
          }}
          className="min-h-[52px] w-full min-w-0 rounded-2xl border border-[#efc6d8] bg-[#fff7fb] py-3 pl-8 pr-4 text-base font-bold text-[#3f2128] outline-none transition placeholder:text-[#3f2128]/30 focus:border-[#be185d]/50 focus:bg-white"
        />
      </span>
      {hint && <span className="mt-1 block text-xs font-medium text-[#3f2128]/50">{hint}</span>}
    </label>
  );
}

export function NumberField({ label, value, onChange, suffix, hint, className = '', decimals = false }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="mb-1.5 block text-sm font-bold text-[#3f2128]/75">{label}</span>}
      <span className="relative block">
        <input
          inputMode={decimals ? 'decimal' : 'numeric'}
          value={value}
          onChange={(event) => {
            const clean = decimals
              ? event.target.value.replace(',', '.').replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1')
              : event.target.value.replace(/\D/g, '');
            onChange(clean);
          }}
          className="min-h-[52px] w-full min-w-0 rounded-2xl border border-[#efc6d8] bg-[#fff7fb] px-4 py-3 pr-14 text-base font-bold text-[#3f2128] outline-none transition focus:border-[#be185d]/50 focus:bg-white"
        />
        {suffix && (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#be185d]/60">{suffix}</span>
        )}
      </span>
      {hint && <span className="mt-1 block text-xs font-medium text-[#3f2128]/50">{hint}</span>}
    </label>
  );
}

export function Switch({ checked, onChange, label, detail, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex min-h-[56px] w-full items-center justify-between gap-4 rounded-2xl border border-[#efc6d8] bg-white px-4 py-3 text-left disabled:opacity-50"
    >
      <span className="min-w-0">
        <span className="block text-base font-bold text-[#3f2128]">{label}</span>
        {detail && <span className="mt-0.5 block text-xs font-medium leading-snug text-[#3f2128]/55">{detail}</span>}
      </span>
      <span className={`relative h-8 w-14 shrink-0 rounded-full transition ${checked ? 'bg-[#16a34a]' : 'bg-[#3f2128]/15'}`}>
        <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${checked ? 'left-7' : 'left-1'}`} />
      </span>
    </button>
  );
}

// Hoja a pantalla completa en celular y ventana centrada en computador.
export function Sheet({ title, onClose, children, footer }) {
  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center bg-[#3f2128]/40 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className="flex h-[100dvh] w-full max-w-2xl flex-col bg-[#fffafc] shadow-[0_24px_80px_rgba(63,33,40,0.25)] sm:h-auto sm:max-h-[92vh] sm:rounded-[2rem]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-[#f3d7e3] px-4 py-3 sm:px-6">
          <h3 className="font-serif text-2xl font-bold text-[#3f2128]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] rounded-2xl px-4 text-sm font-bold text-[#3f2128]/60 hover:bg-[#3f2128]/5"
          >
            Cerrar
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">{children}</div>
        {footer && (
          <div className="border-t border-[#f3d7e3] bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:rounded-b-[2rem] sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function ConfirmDialog({ title, detail, confirmLabel, onConfirm, onCancel, busy = false, danger = true }) {
  return (
    <div className="fixed inset-0 z-[320] flex items-end justify-center bg-[#3f2128]/45 p-3 sm:items-center" onClick={onCancel}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md rounded-[2rem] bg-white p-5 shadow-[0_24px_80px_rgba(63,33,40,0.25)]"
      >
        <h3 className="font-serif text-2xl font-bold text-[#3f2128]">{title}</h3>
        {detail && <p className="mt-2 text-sm font-medium leading-6 text-[#3f2128]/65">{detail}</p>}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <SecondaryButton onClick={onCancel} disabled={busy}>Volver</SecondaryButton>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`min-h-[48px] rounded-2xl px-4 text-sm font-bold text-white disabled:opacity-60 ${danger ? 'bg-red-500' : 'bg-[#be185d]'}`}
          >
            {busy ? 'Un momento...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// Aviso flotante que se cierra solo: "Guardado", "No se pudo guardar..."
export function Toast({ notice, onDone }) {
  const visible = Boolean(notice?.text);
  const tone = notice?.tone === 'error'
    ? 'border-red-200 bg-red-50 text-red-700'
    : 'border-emerald-200 bg-emerald-50 text-emerald-800';

  if (!visible) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[400] flex justify-center px-3">
      <button
        type="button"
        onClick={onDone}
        className={`pointer-events-auto max-w-md rounded-2xl border px-4 py-3 text-left text-sm font-bold shadow-lg ${tone}`}
      >
        {notice.text}
      </button>
    </div>
  );
}

export function EmptyState({ Icon, title, detail, children }) {
  return (
    <div className="rounded-[2rem] border border-dashed border-[#efc6d8] bg-white/70 px-5 py-10 text-center">
      {Icon && (
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#be185d]/10">
          <Icon className="h-6 w-6 text-[#be185d]" />
        </span>
      )}
      <h3 className="mt-3 font-serif text-2xl font-bold text-[#3f2128]">{title}</h3>
      {detail && <p className="mx-auto mt-2 max-w-sm text-sm font-medium leading-6 text-[#3f2128]/60">{detail}</p>}
      {children && <div className="mt-5 flex flex-col items-center gap-2">{children}</div>}
    </div>
  );
}

export function useNotice() {
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    if (!notice) return undefined;
    const timeoutId = window.setTimeout(() => setNotice(null), notice.tone === 'error' ? 7000 : 3200);
    return () => window.clearTimeout(timeoutId);
  }, [notice]);

  const show = useCallback((text, tone = 'ok') => setNotice({ text, tone, at: Date.now() }), []);
  const clear = useCallback(() => setNotice(null), []);
  return { notice, show, clear };
}
