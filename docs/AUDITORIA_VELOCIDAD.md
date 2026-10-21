# Auditoría de velocidad

21 de octubre de 2026. La página se sentía lenta. Antes de cambiar nada se midió.
Después se volvió a medir con las mismas condiciones, comparando la versión publicada
(`main`) con la nueva.

## Cómo se midió

- **Lighthouse 12** en modo celular: 4G lenta simulada y procesador 4 veces más lento.
  Dos corridas por versión; se informa la mediana.
- **Trabajo en reposo**: con la portada quieta durante 10 segundos, cuánto tiempo pasa
  ocupado el procesador. El carrusel cambia solo cada 4,5 s y con él cambia el color
  del fondo.
- **Fluidez**: cuadros por segundo al bajar y subir la página completa en 8 segundos,
  con el procesador 4 veces más lento.
- Las tres pruebas usan un celular de 390 px de ancho. La versión nueva corrió contra
  un Supabase de prueba local, con el catálogo vacío (estado de lanzamiento).

## Resultados

| Medida | Antes (`main`) | Ahora | Qué significa |
|---|---|---|---|
| Puntaje Lighthouse | 81 | **92** | De 100 |
| Primer contenido visible | 2,5 s | **2,3 s** | Cuándo aparece algo en pantalla |
| Contenido principal visible (LCP) | 3,6 s | **2,7 s** | Cuándo se ve el título de la portada. Google lo usa para posicionar |
| Índice de velocidad | 4,7 s | **2,3 s** | Qué tan rápido se completa lo que se ve |
| Trabajo del procesador | 3,4 s | **1,9 s** | Total durante la carga |
| Trabajo en reposo (10 s) | 1.372 ms | **411 ms** | −70 %. Menos batería y menos calor en el celular |
| Fluidez al deslizar | 54 cuadros/s | **58 cuadros/s** | 60 es lo ideal |

## Qué la hacía lenta y qué se hizo

| Problema | Por qué pesaba | Cambio |
|---|---|---|
| Pantalla de carga "telón de azúcar" | La página no mostraba nada durante 1,9 s en la primera visita. Era lo que más retrasaba lo primero que ve un cliente nuevo | Eliminada (`GlazePreloader.jsx`) |
| Fondo de toda la página animado | Cada cambio de color (cada 4,5 s en la portada y en cada sección) recalculaba y repintaba 4 degradados de pantalla completa con filtro de color, cuadro por cuadro durante casi un segundo | Una capa fija por tema; el cambio sólo cruza la opacidad, que la tarjeta gráfica hace sin repintar |
| Google Fonts | 3 familias en 12 variantes, desde otro servidor y bloqueando la página. Una (Great Vibes) no se usaba en ningún lado | Montserrat y Playfair servidas desde la misma página (`@fontsource-variable`), sólo los pesos y caracteres que se usan |
| Desenfoque en las secciones | Cada sección aparecía desenfocada (`blur(10px)`) y se enfocaba al entrar: obliga a repintar la sección entera en cada cuadro | Sólo opacidad y movimiento |
| Desenfoque detrás de tarjetas (`backdrop-filter`) | Tarjetas de productos, "Sobre nosotros", ubicación, pie de página y menú. Como el fondo es fijo y las tarjetas se mueven al deslizar, el desenfoque se recalcula en cada cuadro | Quitado. Las tarjetas ya eran casi opacas: se subió un poco el blanco y se ven igual. El encabezado mantiene un desenfoque suave |
| Animaciones infinitas en JavaScript | Íconos del pie de página, pin y sombra del mapa, punto de "abierto". JavaScript calculaba cada cuadro para siempre | Pasadas a CSS (`dm-float`, `dm-blink`, `dm-shadow`), que las resuelve la tarjeta gráfica y se apagan con "reducir movimiento" |
| Carro de compras | Se descargaba y armaba al abrir la página, compitiendo con la portada | Se descarga cuando el navegador queda libre y se arma al abrirlo por primera vez |
| Título de la portada | Entraba desde transparente con medio segundo de retraso: Google contaba la carga recién ahí | Visible desde el primer cuadro. Los demás detalles mantienen su entrada |
| Tarjetas de atrás del carrusel | Se apagaban con un filtro sobre la foto, repintada en cada cuadro | Una capa oscura encima que sólo cambia de opacidad |
| Filtro sobre el mapa | Un filtro de color casi imperceptible sobre el mapa de Google, que obligaba a componerlo aparte | Quitado |
| Fotos | Las fotos de 1200 px se bajaban igual en un celular | Cada foto subida desde el admin tiene una versión de 480 px; el celular baja esa |

## Código que sobraba

- `GlazePreloader.jsx` (177 líneas) y su uso en `App.jsx`.
- Clases CSS sin uso: `glass-card`, `glass-crisp`, `bg-dots`, `animation-delay-*`,
  `dm-blur`, `text-gradient-pink`; la animación `blob` y el color `brand-pink` de
  Tailwind; la familia `font-script`.
- Analítica: armaba cada evento con un identificador de sesión y no lo mandaba a
  ningún lado. Ahora sólo escribe en la consola en desarrollo; el bloque comentado
  del webhook se eliminó.
- Ids repetidos: `inicio`, `nosotros` y `ubicacion` estaban dos veces cada uno
  (sección y contenedor). HTML inválido; ahora sólo los lleva el contenedor.
- Fotos de stock de "Sobre nosotros" (Unsplash) presentadas como propias.

## Qué queda (no urgente)

- **El código principal pesa 100 KB comprimido** (React, Framer Motion y la portada).
  Es lo que fija hoy el primer contenido en ~2,3 s con 4G lenta. Bajarlo exige
  reescribir las animaciones con una librería más liviana; no vale la pena antes del
  lanzamiento.
- **Fotos de referencia de la portada** (Unsplash): se usan sólo mientras no haya dos
  productos con foto. Cuando existan, borrar el `preconnect` a `images.unsplash.com`
  de `index.html`.
- **Mapa de Google**: carga sólo al acercarse a la sección, pero trae todo el código
  de Google Maps. Si algún día molesta, reemplazarlo por una imagen con botón
  "Abrir en Google Maps".
- Medir otra vez con la página publicada y el catálogo real, en
  [PageSpeed Insights](https://pagespeed.web.dev/).
