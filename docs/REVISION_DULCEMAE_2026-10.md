# Revisión Dulce Mae — octubre 2026

Fecha: 2026-10-21. Revisión del código, del sitio corriendo (celular 390 px y
escritorio 1440 px) y de los otros repositorios de Dulce Mae.

## Cuál repositorio es el bueno

| Repositorio | Qué es | Decisión |
|---|---|---|
| `Tg20taps/DulceMae_Oficial` | React + Vite + Tailwind + Supabase. Mayo 2026, 35 commits. Catálogo, carro, checkout a WhatsApp, pedidos guardados, admin con pedidos, costos y stock. | **Se sigue aquí.** |
| `BzTTY/dulcemae` | Proyecto de ramo en grupo (julio 2025): HTML + Bootstrap + Express + MongoDB, login y registro. | Archivar. No hay nada que rescatar: las imágenes son de internet. |
| `Tg20taps/Dulcemae` | Copia de tres commits del anterior, con `node_modules` versionado. | Archivar (o borrar). |

## Estado verificado

- `npm run lint` y `npm run build` pasan. Carga inicial: 99 KB comprimidos de JS;
  el admin se carga aparte.
- El flujo completo existe: catálogo → carro → checkout → WhatsApp con mensaje
  ordenado → pedido guardado en Supabase → admin con estados y cancelación con motivo.
- La seguridad por fila (RLS) está bien planteada: el público sólo inserta, el
  admin lee y actualiza. `Prefer: return=minimal` está bien usado.

La base es buena. Lo que falta no es técnica: es contenido real y confianza.

## Prioridades

### P0 — antes de mostrarlo a un cliente o usarlo de portafolio

1. **Catálogo de muestra.** Seis productos escritos en el código con fotos de
   Unsplash. Hay que reemplazarlos por los productos, tamaños y precios reales,
   con fotos propias (guía en `docs/GUIA_FOTOS.md`, procesador en `tools/fotos`).
2. **Cifras de confianza sin respaldo.** Portada: "+200 clientes felices · 4.9".
   Sobre nosotros: "+200 pedidos entregados", "4.9", "3+ años". Si no son
   reales, se sacan: es publicidad engañosa (Ley 19.496) y es lo primero que
   preguntará un cliente del paquete. Reemplazar por cifras reales o por
   reseñas reales de Google o Instagram.
3. **Datos que se contradicen.**
   - Horario: "Lun – Sáb · 9:00 – 20:00" en Encuéntranos; el checkout acepta
     10:00 a 22:00 todos los días.
   - Alfajores x6: $6.900 en la sugerencia del carro y $12.000 en el catálogo.
   - Solución: un solo archivo de configuración del negocio (horario, zonas,
     WhatsApp, productos) que lean todas las secciones.
4. **El navegador define el monto del pedido.** El total se calcula en el
   navegador y la política de inserción acepta cualquier fila
   (`with check (true)`). Con la clave pública, que es pública por diseño,
   cualquiera puede crear pedidos con total $1, estado "entregado" o llenar la
   tabla de basura. Hoy no hay pérdida porque todo se confirma por WhatsApp,
   pero las ventas del admin suman esos totales.
   - Ahora: endurecer la política de inserción (`status = 'pending'`, campos de
     cancelación nulos, largos máximos, al menos un producto).
   - Con el catálogo en la base: una función que recalcule precios y total
     desde la tabla de productos.
5. **Costos y stock se guardan en el navegador** (`localStorage`). Lo que tu
   mamá anote ahí desaparece si cambia de celular, borra datos o abre el admin
   en otro equipo. Moverlos a Supabase o esconder esos módulos hasta hacerlo.

### P1 — diseño y conversión

1. **El catálogo está enterrado.** En celular aparece después de unas cuatro
   pantallas (portada de pantalla y media + Sobre nosotros completo). Orden
   propuesto: portada corta → catálogo → cómo pedir en 3 pasos → sobre
   nosotros → ubicación.
2. **Tarjetas gigantes en celular.** Hoy cabe un producto por pantalla. Grilla
   de dos columnas con foto cuadrada, nombre, "desde $X" y botón. Con 20
   productos o más es indispensable.
3. **Tamaños por producto** (15, 25, 35 porciones). En pastelería el precio
   depende del tamaño; hoy cada producto tiene un solo precio.
4. **Catálogo editable desde el admin**: productos, precios, fotos, agotado o
   disponible. Le da independencia a tu mamá y es la pieza central del paquete
   para pymes.
5. **Vista previa al compartir.** No hay `description` ni etiquetas Open Graph:
   el link pegado en WhatsApp o Instagram sale sin foto ni texto. Agregar
   título, descripción e imagen de 1200×630.
6. **Animaciones.** Inclinación 3D, precargador y fondos que cambian por
   sección se ven bien en un computador, pero pesan en un celular de gama
   media. Dejar sólo las que ayudan a entender.
7. **Dirección de la casa publicada** con pasaje y número. Decidir con tu mamá
   si mostrar sólo "Alerce, Puerto Montt" y dar la dirección exacta al confirmar.
8. **Dominio propio** (`dulcemae.cl`) y **perfil de empresa en Google** (gratis):
   mucha gente busca "tortas Puerto Montt" en Google Maps.

### P2 — cuando haya pedidos reales

- Separar `CartModal.jsx` (1.746 líneas) en armado del mensaje, validación y vista.
- Mensajes rápidos de WhatsApp desde el admin (confirmar, pedir abono, avisar listo).
- Registrar pedidos que llegan directo por WhatsApp.
- Asistente y cotizador: después, como ya dice el plan de acción.

## Infraestructura

- **Vercel Hobby es sólo para uso no comercial** según sus propias reglas. Un
  sitio que vende necesita Pro o moverse a Cloudflare Pages o Netlify, que
  tienen plan gratuito sin esa restricción.
- **Supabase gratis pausa el proyecto tras 7 días sin actividad** y permite
  dos proyectos activos. Si pasa una semana sin pedidos y sin que nadie abra el
  admin, el sitio y WhatsApp siguen funcionando, pero el pedido no se guarda
  hasta reactivar el proyecto en el panel de Supabase. Para el paquete conviene un solo proyecto con todos
  los clientes (una columna de cliente en cada tabla) y pasarlo a Pro cuando
  haya ingresos.

## Siguiente paso

El orden de trabajo semana a semana está en `docs/PLAN_SEMANAS.md`.
