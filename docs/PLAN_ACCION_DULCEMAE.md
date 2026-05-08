# Plan de accion DulceMae

Objetivo: convertir la pagina actual en un sistema simple, bonito y util para que una persona que trabaja sola pueda vender por WhatsApp, controlar pedidos, calcular costos y dejar datos limpios para Excel y analisis futuro.

## Estado actual del proyecto

La base actual ya sirve como primer MVP visual y comercial:

- Frontend en React + Vite + Tailwind.
- Identidad visual premium con fondo dinamico por seccion.
- Catalogo con productos y categorias.
- Carrito con persistencia en localStorage.
- Modal de pedido con nombre, telefono, fecha, hora y comentarios.
- Mensaje de WhatsApp generado desde el carrito.
- Payload interno de pedido listo para enviar a un webhook.
- Analytics local con `trackEvent`, hoy imprime eventos en consola.

El punto importante: ya existe el flujo cliente -> carrito -> formulario -> WhatsApp. Antes de backend, conviene ordenar los datos y la experiencia.

## Meta regalo Dia de la Madre

Objetivo emocional y practico: entregar a la mama una pagina bonita, confiable y simple de usar para empezar a recibir y organizar pedidos reales, sin que necesite entender tecnologia.

Version entregable minima:

- Web publica funcionando en celular y computador.
- Catalogo visible aunque luego se reemplace por fotos y productos reales.
- Carrito fluido.
- Checkout claro con nombre, telefono, fecha, hora, retiro/delivery, pago y comentarios.
- WhatsApp con mensaje cercano, ordenado y util.
- Pedido guardado en Supabase.
- `/admin` privado con login.
- Admin muestra pedidos nuevos.
- Admin permite cambiar estado.
- Admin permite cancelar con motivo sin borrar datos.
- Ventas visibles no cuenta cancelados.
- Flujo validado con pedidos de prueba en celular.

Calidad esperada antes de entregarla:

- Mobile-first: la mama debe poder usarlo desde el telefono.
- Textos no tecnicos.
- Acciones grandes y claras.
- Sin pantallas en blanco.
- Sin datos sensibles expuestos.
- Si algo falla, el cliente igualmente puede enviar WhatsApp.
- La experiencia debe sentirse pro, no como demo.

Lo que puede quedar para despues de la entrega:

- Chatbot/asesor.
- Login de clientes.
- Puntos y cupones.
- Dashboard avanzado.
- Calculadora completa de costos.
- Catalogo totalmente editable.
- IA generativa.

Regla de trabajo:

- Trabajar por fases cortas.
- Evitar sobrecargar el chat.
- Mantener calidad visual premium.
- Compilar y probar antes de subir.
- No romper checkout, WhatsApp, Supabase ni admin.
- Documentar cada fase importante para poder continuar en una pestana nueva.

Vision de datos:

- Cada pedido debe alimentar datos utiles.
- Las cancelaciones deben guardar motivo.
- Los cambios de estado deben servir para medir operacion.
- Los productos reales y variantes deben permitir analizar demanda.
- Los graficos deben ayudar a responder: que se vende, cuando se vende, que se cancela, cuanto entra, cuanto cuesta y que conviene mejorar.

## Checkpoint para continuar en una pestaña nueva

Fecha de trabajo: 2026-05-07.

Prioridad inmediata:

- Guardado de pedidos en Supabase resuelto.
- El problema detectado no es que `/admin` sea otro link: es RLS/politicas de `orders`.
- La tabla `public.orders` existe, pero despues de pruebas seguia en `0` pedidos.
- El fix correcto debe resetear todas las policies antiguas de `public.orders` y recrear:
  - Insert publico para checkout.
  - Select/update/delete solo para admin autenticado.
- El checkout debe insertar con `Prefer: return=minimal`; no debe pedir `return=representation`, porque el cliente anonimo no tiene permiso para leer filas protegidas por RLS.
- Archivo principal para correr en Supabase SQL Editor: `supabase/fix_orders_access.sql`.
- Al correrlo, usar Run sobre todo el script, no solo "Run selected" con las consultas de conteo.
- Despues de correrlo, probar con un pedido nuevo. Los pedidos enviados antes del fix no apareceran porque Supabase los bloqueo.
- Confirmado: el pedido nuevo ya aparece en el panel administrador.

Estado de admin:

- Login admin con `claudiamancilla1978@gmail.com`.
- Pedidos recientes lee la tabla `orders`.
- Cancelar pedido no borra: cambia estado a `cancelled`, guarda motivo, nota y fecha.
- Motivos de cancelacion listos para analisis:
  - Pedido de prueba.
  - Cliente no confirmo.
  - Fuera de zona.
  - Sin disponibilidad.
  - Producto no disponible.
  - Pedido duplicado.
  - Otro motivo.
- Ventas visibles excluye pedidos cancelados.

Estado de checkout:

- Horario permitido: 10:00 a 22:00.
- Campo hora usa formato 24 h por compatibilidad nativa.
- Se debe mostrar ayuda clara: `15:30 = 3:30 p.m.` y, cuando hay hora elegida, su equivalente a.m./p.m.
- El mensaje de WhatsApp debe mantener tono cercano y llevar datos estructurados.
- Version importante desplegada para guardado: commit `a92dd1c`.

## Fase 1 - Cerrar identidad visual y UX publica

Meta: dejar la pagina lista para clientes reales, fluida y coherente.

Tareas:

- Definir paleta oficial: rosa DulceMae, berry, violeta, miel/caramelo y verde WhatsApp.
- Crear una fuente unica para estilos de marca: botones, badges, iconos, cards, hover y patron.
- Reemplazar fotos temporales por fotos reales con direccion visual consistente.
- Mejorar el footer y redes sociales hasta que se sientan parte de la marca.
- Agregar una mini franja funcional en Inicio: hecho a mano, pedidos con anticipacion, retiro/entrega.
- Afinar copy de confianza: tiempos, zona de entrega, medios de pago y forma de encargo.

Por que mejora la pagina:

- Reduce la sensacion de vacio sin meter elementos pesados.
- Hace que la marca sea recordable.
- Prepara al cliente para pedir sin tener que preguntar todo por WhatsApp.

## Fase 2 - WhatsApp como centro del negocio

Meta: que el pedido llegue a WhatsApp claro y casi listo para confirmar.

Campos que debe pedir el checkout:

- Nombre.
- Telefono.
- Fecha requerida.
- Hora preferida.
- Tipo de entrega: retiro o delivery.
- Direccion si es delivery.
- Metodo de pago: transferencia o efectivo.
- Comentarios: dedicatoria, alergias, colores, diseno, referencia.

Regla de delivery:

- Si el cliente elige delivery, calcular un costo sugerido.
- Partir con una tarifa simple: $3.500 base para sectores cercanos.
- En una segunda version, cobrar por distancia o zona.
- Mostrarlo separado: subtotal productos, delivery, total final.

Delivery recomendado por etapas:

- Version 1: retiro o delivery con costo fijo editable.
- Version 2: zonas predefinidas, por ejemplo Alerce, centro, Mirasol, Puerto Montt.
- Version 3: calculo por distancia con mapa/API.

Para una persona que trabaja sola, la mejor primera version es costo sugerido + boton para editarlo. Asi el sistema ayuda, pero no obliga.

Mensaje WhatsApp recomendado:

- Codigo de pedido.
- Datos del cliente.
- Productos con cantidades.
- Subtotal.
- Costo delivery si aplica.
- Total.
- Fecha y hora.
- Metodo de pago.
- Comentarios.
- Texto final: "Quedo atento/a a confirmacion de disponibilidad."

Por que mejora la pagina:

- Tu mama recibe menos mensajes desordenados.
- El cliente entiende el total antes de escribir.
- Los datos quedan estructurados desde el primer contacto.

## Fase 3 - Guardar datos para Excel y dashboard

Meta: cada pedido debe transformarse en datos limpios.

Primera solucion recomendada: Google Sheets + webhook.

Motivo:

- Es barato.
- Es facil de revisar.
- Sirve para Excel y ciencia de datos.
- No obliga a construir un backend grande al inicio.

Tablas iniciales:

### Pedidos

- order_id
- fecha_creacion
- estado
- nombre_cliente
- telefono
- fecha_entrega
- hora_entrega
- tipo_entrega
- direccion
- metodo_pago
- subtotal_productos
- costo_delivery
- total
- comentarios

### DetallePedido

- order_id
- product_id
- producto
- categoria
- cantidad
- precio_unitario
- subtotal

### Productos

- product_id
- nombre
- categoria
- precio_venta
- activo
- tiempo_preparacion
- notas

### Insumos

- ingredient_id
- nombre
- unidad
- costo_compra
- cantidad_compra
- costo_por_unidad
- stock_actual

### Recetas

- product_id
- ingredient_id
- cantidad_usada
- costo_calculado

Por que mejora la pagina:

- Cada venta alimenta datos.
- Luego puedes hacer graficos reales.
- Permite calcular utilidad y no vender al azar.

## Fase 4 - Admin simple para tu mama

Meta: un panel muy intuitivo, no tecnico.

Regla de diseno:

- Botones grandes.
- Textos claros.
- Pocas opciones por pantalla.
- Estados con colores.
- Nada de tablas gigantes como primera vista.

Vistas del admin:

- Hoy: pedidos de hoy y proximos.
- Pedidos: lista por estado.
- Nuevo pedido manual: para pedidos que entran directo por WhatsApp.
- Clientes: personas frecuentes, telefonos, direccion habitual y notas.
- Cuentas por cobrar: clientes que deben, abonos y total pendiente.
- Productos: editar precio, foto, disponibilidad.
- Costos: calcular costo de producto.
- Insumos: registrar compras.
- Reportes: ventas, utilidad estimada y productos mas vendidos.

Estados de pedido:

- Nuevo.
- Confirmado.
- En preparacion.
- Listo.
- Entregado.
- Cancelado.

Cancelaciones profesionales:

- No borrar automaticamente al rechazar un pedido.
- Cambiar primero el estado a Cancelado.
- Guardar motivo de cancelacion para analisis:
  - Pedido de prueba.
  - Cliente no confirmo.
  - Fuera de zona.
  - Sin disponibilidad.
  - Producto no disponible.
  - Pedido duplicado.
  - Otro motivo.
- Guardar nota opcional y fecha de cancelacion.
- Excluir cancelados de ventas visibles.
- Mas adelante agregar filtro para ocultar/mostrar cancelados.
- Mas adelante agregar limpieza controlada de cancelados antiguos, por ejemplo 60 dias.
- Boton de eliminar definitivo solo para casos especiales y con confirmacion clara.

Por que mejora el negocio:

- Tu mama no depende de memoria.
- Puede saber que hacer hoy.
- Puede avisar estado al cliente con menos esfuerzo.
- Puede ver rapido quien debe y cuanto debe.
- Puede sumar pedidos frecuentes sin calcular a mano.

Regla mobile-first:

- El admin debe estar pensado primero para celular.
- Cada pantalla debe responder una sola pregunta: que hago ahora, quien pidio, cuanto falta, quien debe.
- Los botones principales deben ser grandes: confirmar, preparar, listo, entregado, copiar mensaje, abrir WhatsApp.
- Las tablas grandes deben convertirse en tarjetas simples en celular.

## Fase 5 - Calculadora de costos

Meta: que el precio no sea al azar.

Formula base:

Costo producto =

- costo ingredientes
- empaque
- gas/luz estimado
- mano de obra
- perdida o merma

Precio sugerido =

- costo total / (1 - margen deseado)

Ejemplo:

- Costo total: $12.000
- Margen deseado: 45%
- Precio sugerido: 12000 / 0.55 = $21.818

Campos simples:

- Producto.
- Ingredientes usados.
- Cantidad usada.
- Costo calculado.
- Horas de trabajo.
- Costo de empaque.
- Margen deseado.
- Precio sugerido.

Por que mejora el negocio:

- Evita perder plata.
- Da claridad para subir precios.
- Permite comparar productos rentables vs productos que consumen mucho.

## Fase 6 - Dashboard y datos

Meta: claridad total sin saturar.

Graficos utiles:

- Ventas por semana.
- Ventas por mes.
- Pedidos por estado.
- Total por cobrar.
- Clientes con deuda.
- Abonos recibidos.
- Productos mas pedidos.
- Total vendido.
- Utilidad estimada.
- Delivery acumulado.
- Delivery por zona/distancia.
- Pedidos por metodo de pago.
- Dias con mas pedidos.
- Promedio de ticket.

KPIs principales:

- Pedidos pendientes.
- Total vendido este mes.
- Utilidad estimada.
- Producto estrella.
- Proximo pedido urgente.

Por que mejora el negocio:

- Convierte WhatsApp y Excel en informacion.
- Ayuda a tomar decisiones.
- Da base para tu trabajo futuro como cientifico de datos.

## Backlog importante para siguientes fases

Estas ideas quedan registradas para retomarlas por etapas sin sobrecargar el sistema:

### Delivery y calculo de zonas

- Mantener ahora zonas simples: Alerce cercano, Puerto Montt / sectores y fuera de zona.
- Siguiente version: tabla editable de zonas con nombre, costo, nota y estado activo/inactivo.
- Version avanzada: calcular costo por distancia o mapa, pero solo cuando el flujo base ya este estable.
- En delivery, permitir dos modos:
  - Escribir direccion o pegar link de Google Maps.
  - Enviar ubicacion directamente desde WhatsApp, dejando el campo libre en el checkout.

### Productos frecuentes y atajos de pedido

- Crear productos editables desde el admin: nombre, categoria, precio, descripcion, foto y disponibilidad.
- Crear atajos de productos frecuentes para no escribir lo mismo muchas veces.
- Ejemplos de atajos:
  - Torta base + tamano + relleno.
  - Kuchen familiar.
  - Alfajores x6 / x12.
  - Insumos o compras recurrentes, si mas adelante se registra inventario.
- Permitir cantidades rapidas y variantes frecuentes para que tu mama no tenga que repetir datos manualmente.

### Asesor de pedidos / chat bot

Idea: agregar un asistente dentro de la pagina para responder dudas comunes y guiar al cliente antes de WhatsApp.

Problemas reales que debe resolver:

- Preguntas por porciones: torta para 15, 25, 35 personas.
- Precios variables por tamano, relleno, decoracion, pisos y urgencia.
- Dudas sobre anticipacion, horarios, retiro, delivery y pagos.
- Recomendaciones segun ocasion: cumpleanos, aniversario, regalo, once familiar.
- Alergias, dedicatorias, colores, referencias de diseno.
- Preguntas repetidas que hoy terminan sobrecargando WhatsApp.

Recomendacion por etapas:

- Version 1: asistente guiado sin IA generativa.
  - Boton flotante "Ayuda para elegir".
  - Preguntas frecuentes con botones: porciones, precios, anticipacion, delivery, pagos.
  - Respuestas controladas desde un archivo o tabla editable.
  - CTA final: "Armar pedido" o "Consultar por WhatsApp".
- Version 2: cotizador guiado.
  - Cliente elige tipo: torta, kuchen, alfajores, regalo.
  - Cliente elige porciones o tamano.
  - Sistema muestra rango estimado: "desde $X, puede variar por decoracion".
  - Nunca promete disponibilidad automaticamente.
- Version 3: asistente con IA controlada.
  - IA solo responde usando catalogo, reglas y FAQ guardadas.
  - Si no sabe, deriva a WhatsApp.
  - No inventa precios, disponibilidad ni ingredientes.
  - Puede sugerir preguntas utiles: cantidad de personas, fecha, sabor, presupuesto.
- Version 4: IA conectada al admin.
  - Lee productos activos, precios, zonas, horarios y reglas desde Supabase.
  - Ayuda a crear un borrador de pedido.
  - Guarda datos para analisis de preguntas frecuentes y demanda no cubierta.

Dificultad estimada:

- Asistente guiado: baja/media. Muy recomendable como siguiente mejora publica.
- Cotizador por reglas: media. Necesita tabla de tamanos, precios base y extras.
- IA generativa segura: media/alta. Requiere backend o funcion segura, no exponer claves en frontend.
- IA conectada al admin: alta. Conviene despues de catalogo editable y reglas de precios.

Reglas de seguridad:

- No poner claves privadas de IA en React/Vite.
- No dejar que el bot invente precios.
- Mostrar siempre "precio estimado" cuando dependa de decoracion o tamano.
- Para pedidos especiales, cerrar con WhatsApp.
- Guardar preguntas anonimas para saber que productos o tamanos agregar al catalogo.

### Una sola experiencia / un solo link

- Mantener la web publica y el admin dentro del mismo dominio.
- Usar `/admin` como panel privado, no como segunda pagina separada.
- Mas adelante evaluar login de clientes dentro del mismo sitio:
  - Historial de pedidos.
  - Datos guardados.
  - Puntos o cupones de descuento.
  - Recompensas para clientes frecuentes.
- Esta fase debe venir despues de pedidos, catalogo editable y admin basico, porque requiere datos sensibles y reglas claras.

### Admin para tu mama

- Prioridad mobile-first.
- Pantallas simples, con acciones grandes y pocas decisiones por vista.
- Modulo siguiente recomendado: catalogo administrable con fotos y productos.
- Luego: pedidos manuales para registrar encargos que lleguen directo por WhatsApp.
- Ideas de mejora para pedirle a la IA en siguientes sesiones:
  - Vista "Hoy" con pedidos urgentes primero.
  - Filtros simples: Nuevo, En preparacion, Listo, Entregado, Cancelado.
  - Busqueda por nombre, telefono o referencia.
  - Botones de mensaje rapido para WhatsApp: confirmar, pedir abono, avisar listo, pedir ubicacion.
  - Vista detalle de pedido con productos, comentarios, direccion, pago y botones grandes.
  - Registro de pedido manual para pedidos que entren directo por WhatsApp.
  - Catalogo editable con foto, precio, categoria, disponibilidad y producto destacado.
  - Atajos de productos frecuentes y variantes para no repetir escritura.
  - Estadisticas simples: productos mas vendidos, cancelaciones por motivo, zonas con mas delivery, dias fuertes.
  - Alerta de capacidad diaria para no aceptar mas pedidos de los que se pueden preparar.
  - Exportacion CSV/Excel para analisis.
  - Modo "limpio para mama": ocultar textos tecnicos y mostrar solo acciones claras.

## Fase 7 - Automatizacion WhatsApp sin pago online

Meta: ayudar a responder, no reemplazar completamente a tu mama.

Opcion inicial recomendada:

- Generar mensajes listos para copiar/enviar:
  - Confirmar pedido.
  - Pedir transferencia.
  - Avisar "en preparacion".
  - Avisar "listo para retiro".
  - Avisar "pedido entregado".

Opcion mas avanzada:

- Integrar WhatsApp Business API o un proveedor externo.
- Usar plantillas aprobadas.
- Enviar cambios de estado automaticamente.

Recomendacion:

- Primero hacer botones que generen mensajes.
- Despues automatizar envios reales cuando el flujo ya este probado.

Por que mejora el negocio:

- Menos tipeo.
- Menos errores.
- Mantiene control humano, importante para una persona que trabaja sola.

## Orden recomendado de implementacion

1. Estabilizar pedidos guardados en Supabase y admin basico.
2. Pulir checkout publico: hora, fecha, textos, mobile y mensajes WhatsApp.
3. Admin de pedidos: detalle, filtros, cancelar con motivo, cambiar estado y mensajes rapidos.
4. Catalogo editable desde admin: productos, fotos, precios, disponibilidad y categorias.
5. Productos frecuentes, variantes y tamanos: porciones, rellenos, extras y rangos de precio.
6. Asesor de pedidos guiado: FAQ, porciones, anticipacion, delivery, pagos y CTA a WhatsApp.
7. Cotizador por reglas para tortas y pedidos especiales.
8. Dashboard real: ventas, estados, cancelaciones, productos, zonas y horarios.
9. Calculadora de costos e insumos.
10. Login de clientes, puntos/cupones y experiencia unificada.
11. IA generativa controlada o automatizacion avanzada de WhatsApp.

## Prompt recomendado para una nueva pestana

Usar este prompt para continuar desde cero sin perder contexto:

```text
Proyecto DulceMae en C:\Users\Tg20taps\Desktop\Proyecto mai.
Es un sitio React/Vite/Tailwind desplegado en Vercel y conectado a Supabase.
El checkout ya guarda pedidos en public.orders y el panel /admin ya muestra pedidos para claudiamancilla1978@gmail.com.
Mantener la estetica premium y mobile-first.

Lee primero:
- docs/PLAN_ACCION_DULCEMAE.md
- docs/SUPABASE_ADMIN_SETUP.md
- src/components/CartModal.jsx
- src/components/admin/AdminShell.jsx
- src/lib/orders.js
- supabase/orders.sql
- supabase/fix_orders_access.sql

Estado clave:
- El guardado publico funciona porque src/lib/orders.js usa Prefer: return=minimal.
- No cambiar a return=representation porque rompe RLS.
- Supabase debe mantener insert publico y lectura/update/delete solo para admin autenticado.
- El admin ya tiene cancelacion con motivo y no debe borrar pedidos automaticamente.

Siguiente fase recomendada:
Meta entrega Dia de la Madre: mejorar el admin de pedidos para mi mama hasta que sea usable en el dia a dia. Quiero vista mobile-first, tarjetas claras, filtros por estado, detalle de pedido, cambiar estado, cancelar con motivo, abrir WhatsApp del cliente y botones para copiar mensajes de WhatsApp. No hagas aun login de clientes ni IA generativa. Primero deja el flujo de pedidos profesional, simple y confiable para poder entregarle la pagina.

Tambien considera en el plan futuro:
- Catalogo editable con fotos, precios y disponibilidad.
- Variantes de tortas por porciones: 15, 25, 35 personas.
- Rangos de precio por tamano, relleno, decoracion y urgencia.
- Asesor de pedidos guiado tipo chatbot sin IA generativa al inicio.
- Cotizador por reglas antes de una IA real.

Antes de editar, revisa el estado del repo y el plan.
Implementa por partes, compila con npm.cmd run build, corre lint si aplica, y resume cambios.
No rompas checkout, WhatsApp ni Supabase.
```

## Prompt corto para seguir trabajando por partes

Usar este prompt cuando quieras avanzar sin gastar tokens de mas:

"Revisa el estado actual del proyecto DulceMae y trabaja solo la siguiente fase: [NOMBRE DE FASE]. Mantén la identidad visual premium actual, prioriza fluidez, evita animaciones pesadas, no rompas el flujo de WhatsApp y deja datos estructurados para futuro dashboard/Excel. Antes de editar, identifica los archivos involucrados; despues implementa, compila con npm run build y resume cambios."
