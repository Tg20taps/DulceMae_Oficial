# Auditoría técnica DulceMae

Fecha: 2026-05-08

Objetivo: dejar una base limpia para seguir construyendo sin romper el regalo principal: web pública bonita, checkout confiable, WhatsApp, pedidos en Supabase y admin simple.

## Estado verificado

- `src/lib/orders.js` mantiene `Prefer: return=minimal`. Esto no se debe cambiar porque el checkout público puede insertar pedidos, pero no debe leer filas protegidas por RLS.
- No se detectaron dependencias claramente sobrantes en `package.json`. Las librerías actuales cumplen roles concretos: React/Vite, Tailwind, Framer Motion, Lucide y Supabase.
- `npm.cmd run lint` pasa correctamente.
- `npm.cmd run build` pasa correctamente. Tamaños principales del build:
  - `assets/index-DX1n8Qah.js`: 305.11 kB, gzip 98.64 kB.
  - `assets/CartModal-CgQ7ftWL.js`: 46.78 kB, gzip 13.21 kB.
  - `assets/AdminShell-DytlGA8p.js`: 257.21 kB, gzip 65.61 kB.
- El admin ya está separado por carga diferida, así que ese bloque grande no afecta directamente la primera carga de la web pública.

## Cambios aplicados en esta pasada

- WhatsApp del checkout: se eliminaron emojis del mensaje prellenado porque en WhatsApp Desktop/Web de Windows pueden aparecer como caracteres rotos. El mensaje quedó más limpio, con secciones simples y formato compatible con PC y celular.
- Admin: las métricas por estado y ventas visibles ahora se calculan en una sola pasada sobre los pedidos. Esto evita filtros repetidos cuando crezca la cantidad de órdenes.
- Header público: se unificó el trabajo de scroll en un solo listener con `requestAnimationFrame`, reduciendo trabajo repetido en navegación.
- Efectos de scroll: se cancela el frame pendiente al desmontar en navegación y cambio de tema, evitando actualizaciones tardías si cambia la ruta.
- Carrito: `cartCount` y `cartTotal` quedaron memoizados y calculados juntos para evitar reducciones repetidas en cada render.

## Hallazgos con lupa

### Prioridad alta

- `src/components/CartModal.jsx` y `src/components/admin/AdminShell.jsx` son los dos archivos más grandes del proyecto. Funcionan, pero concentran UI, reglas de negocio, formateo, mensajes y acciones externas en un solo lugar. Esto vuelve más lento entenderlos y aumenta el riesgo al tocar detalles pequeños.
- La mejor limpieza futura es dividirlos por responsabilidad, sin cambiar comportamiento:
  - `checkout/messageBuilder.js` para el mensaje de WhatsApp.
  - `checkout/orderPayload.js` para payload y validaciones.
  - `admin/orderFormatters.js` para nombres, teléfonos, totales y fechas.
  - `admin/OrderCard.jsx`, `admin/OrderDetail.jsx`, `admin/StatusActions.jsx` para bajar tamaño del panel.
- Esta división conviene hacerla en una fase separada y con pruebas manuales, porque toca la parte más sensible del negocio.

### Prioridad media

- Hay comentarios antiguos y bloques desactivados de webhook/analytics que no afectan producción, pero sí hacen más pesada la lectura del código. Conviene convertirlos en documentación o quitarlos cuando ya no se usen.
- Algunas etiquetas internas usan texto técnico o nombres históricos. El admin ya debe hablar en simple: "Nuevo", "Confirmado", "En preparación", "Listo", "Entregado", "Cancelado".
- La web usa varias animaciones. El build está bien, pero en celulares antiguos conviene seguir evitando animaciones nuevas innecesarias y priorizar imágenes optimizadas.

### Prioridad baja

- Los títulos visibles y textos de apoyo pueden pulirse con acentos y lenguaje más consistente. Esto no mejora rendimiento, pero sí percepción profesional.
- El proyecto tiene una buena separación de Supabase en `src/lib`, pero el checkout todavía mezcla experiencia visual con reglas operativas. No es urgente para regalarlo, pero sí para escalar catálogo, variantes y cotizador.

## Qué no conviene tocar antes de entregar

- No cambiar el contrato de `orders.js`.
- No cambiar RLS ni SQL si el guardado público y el admin ya funcionan.
- No mover todavía todo el checkout a múltiples archivos si no hay tiempo para probarlo completo en PC y celular.
- No agregar dashboard avanzado, catálogo editable, chatbot, cupones ni costos hasta que el flujo diario de pedidos esté estable.

## Siguiente refactor recomendado

1. Extraer el constructor del mensaje de WhatsApp y probarlo con pedidos de retiro, delivery conocido, delivery por coordinar y comentarios extra.
2. Separar el admin en componentes chicos, manteniendo la misma UI actual.
3. Agregar una prueba mínima de formato de pedido/mensaje cuando el proyecto esté listo para sumar testing.
4. Revisar comentarios antiguos y dejar solo los que explican decisiones reales, como `Prefer: return=minimal` o el motivo de no usar emojis en WhatsApp.

## Criterio de calidad para seguir

La regla principal: cada fase debe mejorar claridad o confianza sin tocar varias zonas sensibles al mismo tiempo. Para DulceMae hoy importa más que mamá entienda el admin y que ningún pedido se pierda, antes que una refactorización grande que se vea bonita por dentro pero arriesgue el checkout.
