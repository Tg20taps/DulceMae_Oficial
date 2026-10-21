# Lanzamiento de Dulce Mae

Estado al 21 de octubre de 2026: **la programación está lista para lanzar.** Falta
contenido (productos, precios, fotos) y aplicar el cambio en Supabase.

## Qué cambió

| Parte | Antes | Ahora |
|---|---|---|
| Catálogo | 6 productos escritos en el código, fotos de Unsplash | Tu mamá agrega y edita productos desde `/admin` → Catálogo: foto (se achica sola en el celular), categoría, precio o tamaños, mostrar/ocultar, agotado, portada, sugerir en el carro, orden |
| Precio del pedido | Lo calculaba el navegador; cualquiera podía insertar cualquier monto | `create_order()` toma precios, tamaños y delivery de la base. Si algo está agotado o es inválido, se le explica al cliente y no se abre WhatsApp |
| Sin conexión con Supabase | El pedido se perdía en silencio | El cliente igual envía el pedido por WhatsApp con el total estimado |
| Fin del pedido | Se abría WhatsApp y nada más | Pantalla de confirmación con código de pedido y botón para reabrir WhatsApp |
| Costos | Calculadora con montos a mano, guardada sólo en ese navegador | Ingredientes (cómo se compran y a cuánto) + recetas (cuánto se usa y cuánto tiempo toma) → costo, precio sugerido y semáforo en palabras. En Supabase |
| Stock | Cantidades y umbrales, sólo en ese navegador | "Hay / Queda poco / Se acabó" por ingrediente, y una lista de compras que se copia o se manda por WhatsApp |
| Admin en celular | Pestañas que se deslizaban de lado | Barra fija abajo: Pedidos, Catálogo, Costos, Resumen. Campos de 16 px (el iPhone no hace zoom) |
| Página | Catálogo después de "Sobre nosotros"; una tarjeta por pantalla; "+200 clientes ⭐4.9" | Catálogo justo después de la portada, dos columnas, elegir tamaño, "Agotado"; sin cifras inventadas |
| Datos del negocio | Repetidos y contradictorios (horario, teléfono) | Un solo archivo: `src/config/negocio.js` |
| Compartir el link | Sin texto ni descripción | Título y descripción para WhatsApp, Instagram y Google |

Los cálculos guardados antes en el navegador no se pierden: al abrir **Costos** en el
mismo equipo aparece un aviso para pasarlos a la nube.

## Cómo se probó

- `npm test`: 6 pruebas. La de la base corre la migración real sobre Postgres en
  memoria y revisa permisos, precios, tamaños, delivery, rechazos y recetas.
- Recorrido completo en un celular simulado contra un Supabase de prueba:
  1. El admin edita un producto con tamaños y foto real (llega como WebP).
  2. Crea otro sin foto.
  3. Arma ingredientes y una receta.
  4. Un cliente pide con tamaño y delivery: el total ($46.000) lo calcula la base.
  5. Un producto agotado se rechaza con mensaje claro.
  6. El pedido aparece en el admin.
- `npm run lint` ahora revisa también los `.jsx` (antes se los saltaba) y queda limpio.

## Pasos para publicar (en este orden, el mismo día)

1. **Reactivar Supabase.** El proyecto `dulcemae-db` está pausado por inactividad
   (plan gratis). En supabase.com → proyecto → *Restore project*. Toma unos minutos.
2. **Correr la migración.** SQL Editor → pegar completo `supabase/catalogo_y_costos.sql`
   → *Run* (sobre todo el script). Se puede correr de nuevo sin problema.
3. **Revisar** en Table Editor: `products` con 6 productos ocultos, `delivery_zones`
   con 3 zonas; en Storage, el bucket `productos`.
4. **Cerrar el registro público.** Authentication → Sign In / Providers → desactivar
   *Allow new users to sign up*. Sólo entra tu mamá, con su usuario ya creado.
5. **Publicar el código.** Merge de esta rama a `main`; Vercel despliega solo. Hacerlo
   el mismo día que el paso 2: la versión anterior del checkout guardaba directo en
   `orders` y la migración le quita ese permiso (WhatsApp igual funciona, pero esos
   pedidos no quedarían guardados).
6. **Pedido de prueba** desde un celular. Debe aparecer en `/admin` → Pedidos.
   Cancelarlo con el motivo "Pedido de prueba".
7. **Tu mamá carga su catálogo** en `/admin` → Catálogo: edita los ejemplos o los
   borra y crea los suyos, y los muestra. Sin fotos también se ve bien (fondo de marca
   con el nombre).

## Pendiente (contenido y decisiones, no programación)

- [ ] Productos reales, tamaños y precios (desde el admin).
- [ ] Fotos reales: con la guía (`docs/GUIA_FOTOS.md`) y `tools/fotos`, o tomándolas
      directo desde el admin con el celular.
- [ ] Confirmar el horario real. Hoy dice "Todos los días · 10:00 a 22:00" en
      `src/config/negocio.js` (el checkout usa el mismo).
- [ ] Decidir si se publica la dirección exacta (`direccion` en `src/config/negocio.js`)
      o sólo "Alerce, Puerto Montt".
- [ ] Zonas y costos de delivery: hoy Alerce cercano $3.000, Puerto Montt $5.500,
      fuera de zona por coordinar. Se cambian en Supabase → Table Editor →
      `delivery_zones` (todavía no hay pantalla en el admin).
- [ ] Fotos de "Sobre nosotros": siguen siendo de Unsplash (en `About.jsx`).
      Las de la portada se reemplazan solas cuando haya 2 o más productos con foto
      marcados "Mostrar en la portada".
- [ ] Imagen para compartir el link (`og:image` en `index.html`): una foto real de 1200×630.
- [ ] Hosting comercial: el plan Hobby de Vercel es sólo para uso no comercial.
      `public/_redirects` ya está listo para Cloudflare Pages o Netlify (plan gratis).
- [ ] Supabase gratis pausa el proyecto tras 7 días sin uso. Con tu mamá abriendo el
      admin seguido no debería pasar; si pasa, el sitio y WhatsApp siguen andando,
      pero los pedidos no se guardan hasta reactivarlo.
