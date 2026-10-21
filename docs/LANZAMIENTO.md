# Lanzamiento de Dulce Mae

Estado al 21 de octubre de 2026: **la programación está lista para lanzar.** Supabase
ya está reactivado. Falta aplicar la migración, publicar en un hosting que permita uso
comercial y cargar el contenido (productos, precios, fotos).

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
| Compartir el link | Sin texto ni descripción | Título, descripción y foto para WhatsApp, Instagram y Google. La foto se sube desde el admin |
| Fotos | Se subían tal cual | Al elegir una foto se encuadra con el dedo (mover, acercar, "Dar más luz"). Todas quedan cuadradas, de 1200 px, con una versión de 480 px para el celular. Avisa si la foto es muy chica |
| Guía de fotos | Sólo en `docs/` | Dentro del admin: "¿Cómo sacar una buena foto?", "Desde Instagram" y "Sobre nosotros" |
| "Sobre nosotros" | Fotos de stock de Unsplash presentadas como propias, y sólo en computador | Hasta 3 fotos de tu mamá con su texto, subidas en Catálogo → Fotos de la página. Se ven también en el celular. Sin fotos, se muestra sólo el texto |
| Velocidad | Pantalla de carga de 1,9 s, fondo y desenfoques que se repintaban en cada cuadro | Lighthouse 81 → 92, contenido principal 3,6 s → 2,7 s, −70 % de trabajo en reposo. Detalle en `docs/AUDITORIA_VELOCIDAD.md` |

Los cálculos guardados antes en el navegador no se pierden: al abrir **Costos** en el
mismo equipo aparece un aviso para pasarlos a la nube.

## Cómo se probó

- `npm test`: 6 pruebas. La de la base corre la migración real sobre Postgres en
  memoria y revisa permisos, precios, tamaños, delivery, rechazos, recetas y fotos
  de la página.
- Recorrido completo en un celular simulado contra un Supabase de prueba:
  1. El admin edita un producto con tamaños y foto real: la encuadra con zoom y
     arrastre, y llega como WebP (45 KB) con su miniatura (13 KB).
  2. Crea otro sin foto.
  3. Sube una foto de "Sobre nosotros" y la foto para compartir; abre la guía.
  4. Arma ingredientes y una receta.
  5. Un cliente ve la foto en "Sobre nosotros" y pide con tamaño y delivery: el
     total ($46.000) lo calcula la base.
  6. Un producto agotado se rechaza con mensaje claro.
  7. El pedido aparece en el admin.
- `npm run lint` ahora revisa también los `.jsx` (antes se los saltaba) y queda limpio.

## Pasos para publicar (en este orden, el mismo día)

1. **Supabase activo.** Reactivado el 21 de octubre. Si vuelve a pausarse (7 días sin
   uso en el plan gratis): supabase.com → proyecto → *Restore project*.
2. **Correr la migración.** SQL Editor → pegar completo `supabase/catalogo_y_costos.sql`
   → *Run* (sobre todo el script). Se puede correr de nuevo sin problema.
3. **Revisar** en Table Editor: `products` con 6 productos ocultos, `delivery_zones`
   con 3 zonas; en Storage, el bucket `productos`.
4. **Cerrar el registro público.** Authentication → Sign In / Providers → desactivar
   *Allow new users to sign up*. Sólo entra tu mamá, con su usuario ya creado.
5. **Publicar el código.** Merge de esta rama a `main`. Hacerlo el mismo día que el
   paso 2: la versión anterior del checkout guardaba directo en `orders` y la
   migración le quita ese permiso (WhatsApp igual funciona, pero esos pedidos no
   quedarían guardados). Para el hosting, ver "Hosting" más abajo.
6. **Pedido de prueba** desde un celular. Debe aparecer en `/admin` → Pedidos.
   Cancelarlo con el motivo "Pedido de prueba".
7. **Tu mamá carga su catálogo** en `/admin` → Catálogo: edita los ejemplos o los
   borra y crea los suyos, y los muestra. Sin fotos también se ve bien (fondo de marca
   con el nombre).
8. **Fotos de la página**: `/admin` → Catálogo → Fotos de la página. Hasta 3 fotos
   para "Sobre nosotros" y la foto para compartir el link.

## Hosting

El plan gratis de Vercel (Hobby) es sólo para uso personal y no comercial, y una
tienda cuenta como comercial aunque no tenga pago en línea: su objetivo es vender.
Opciones:

| Opción | Costo | Comentario |
|---|---|---|
| **Cloudflare Pages** (recomendada) | Gratis, permite uso comercial | `public/_redirects` ya está listo para que `/admin` funcione. Build: `npm run build`, carpeta `dist`, mismas variables `VITE_*` |
| Netlify | Gratis con límites | También lee `public/_redirects` |
| Vercel Pro | US$20 al mes | Sin cambios técnicos |

## Pendiente (contenido y decisiones, no programación)

- [ ] Productos reales, tamaños y precios (desde el admin).
- [ ] Fotos de productos: en el admin, con la guía que trae ("¿Cómo sacar una buena
      foto?" y "Desde Instagram"). Para muchas fotos de una vez, `tools/fotos`.
- [ ] Fotos de "Sobre nosotros" (hasta 3) y foto para compartir el link: en el admin,
      Catálogo → Fotos de la página. Ideas en el botón "Ideas para estas fotos".
- [x] Horario: "Todos los días · 10:00 a 22:00" (`src/config/negocio.js`, el checkout
      usa el mismo).
- [x] Dirección: se publica la de la casa (`direccion` en `src/config/negocio.js`), con
      mapa y botón "Cómo llegar".
- [ ] Zonas y costos de delivery: hoy Alerce cercano $3.000, Puerto Montt $5.500,
      fuera de zona por coordinar. Se cambian en Supabase → Table Editor →
      `delivery_zones` (todavía no hay pantalla en el admin).
- [ ] La portada usa fotos de referencia hasta que haya 2 o más productos con foto
      (primero los marcados "Mostrar en la portada"). Después, borrar el `preconnect`
      a `images.unsplash.com` en `index.html`.
- [ ] Hosting comercial (ver arriba).
- [ ] Dominio propio (opcional, un `.cl` en NIC Chile cuesta ~$9.940 + IVA al año) y ficha de
      Google Business con el link y la dirección.
- [ ] Supabase gratis pausa el proyecto tras 7 días sin uso. Con tu mamá abriendo el
      admin seguido no debería pasar; si pasa, el sitio y WhatsApp siguen andando,
      pero los pedidos no se guardan hasta reactivarlo.
