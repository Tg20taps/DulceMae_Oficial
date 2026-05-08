/* ══════════════════════════════════════════════════════════════
   analytics.js — Módulo de analítica separado
   
   RAZÓN: Vite Fast Refresh requiere que los archivos con
   componentes React SOLO exporten componentes. Mezclar
   exports de utilidades con componentes rompe HMR y causa
   pantallas en blanco en desarrollo.
   
   Solución: extraer trackEvent aquí → App.jsx solo exporta App.
══════════════════════════════════════════════════════════════ */
export function trackEvent(eventName, properties = {}) {
  const payload = {
    event: eventName,
    timestamp: new Date().toISOString(),
    session_id: sessionStorage.getItem('dm_session_id') || (() => {
      const id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem('dm_session_id', id);
      return id;
    })(),
    page: window.location.pathname,
    ...properties,
  };
  if (import.meta.env.DEV) {
    console.log('%c[DulceMae Analytics]', 'color:#be185d;font-weight:bold;', payload);
  }
  /*
  // ── Activar cuando tengas el webhook listo ──────────────
  try {
    await fetch('https://tu-webhook.com/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn('[Analytics] Error enviando evento:', err);
  }
  */
}
