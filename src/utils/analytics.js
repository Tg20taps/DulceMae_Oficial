/* ══════════════════════════════════════════════════════════════
   analytics.js — Módulo de analítica separado
   
   RAZÓN: Vite Fast Refresh requiere que los archivos con
   componentes React SOLO exporten componentes. Mezclar
   exports de utilidades con componentes rompe HMR y causa
   pantallas en blanco en desarrollo.
   
   Solución: extraer trackEvent aquí → App.jsx solo exporta App.
══════════════════════════════════════════════════════════════ */
// Por ahora los eventos sólo se ven en desarrollo (consola). En producción no
// se envían a ningún lado: conectar aquí un servicio cuando haga falta.
export function trackEvent(eventName, properties = {}) {
  if (!import.meta.env.DEV) return;
  console.log('%c[DulceMae Analytics]', 'color:#be185d;font-weight:bold;', {
    event: eventName,
    page: window.location.pathname,
    ...properties,
  });
}
