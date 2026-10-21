# Plan por semanas — dos carriles

Desde el 21 de octubre de 2026. Supone unas **10 horas a la semana** para el
carril 1 y **un bloque fijo de 2 a 3 horas** para el carril 2. RYM Elite sigue
aparte; si una semana se come el tiempo, se corre el plan completo una semana,
no se saltan pasos.

Regla: **el carril 1 manda hasta la primera venta del paquete.** El carril 2
tiene su bloque protegido, pero no crece hasta entonces.

## Carril 1 — Dulce Mae y el paquete

### Semana 0 · 21 al 25 de octubre — limpiar y conseguir material

- [ ] Archivar o dejar privados los dos repositorios antiguos de Dulce Mae.
- [ ] Sentarse una hora con tu mamá y salir con: lista real de productos,
      tamaños y precios; horario real; zonas y costo de delivery; si la
      dirección exacta va publicada o no; cifras reales (pedidos, años).
- [ ] Sesión de fotos el fin de semana, de día, con la guía (`docs/GUIA_FOTOS.md`).
- [ ] Pasar las fotos por `tools/fotos` con `--perfil dulcemae` y repetir las marcadas.

**Listo cuando:** hay una planilla con productos y precios reales, y una
carpeta con fotos procesadas sin avisos.

### Semana 1 · 26 de octubre al 1 de noviembre — Dulce Mae creíble

- [ ] Catálogo real con fotos propias (aún escrito en el código está bien).
- [ ] Quitar cifras sin respaldo; poner las reales.
- [ ] Un archivo de configuración del negocio: horario, zonas, WhatsApp. Se
      acaban las contradicciones de horario y precio.
- [ ] Catálogo justo después de la portada; grilla de dos columnas en celular.
- [ ] Endurecer la política de inserción de pedidos en Supabase.
- [ ] Título, descripción e imagen para la vista previa al compartir.
- [ ] Tres pedidos de prueba de familia o amigos, desde celulares distintos.

**Listo cuando:** un desconocido entra desde el celular, pide una torta y a tu
mamá le llega el pedido completo sin tener que preguntar nada.

### Semana 2 · 2 al 8 de noviembre — catálogo editable y lanzamiento

- [ ] Productos en Supabase, editables desde el admin: nombre, foto, precio,
      tamaños, disponible o agotado.
- [ ] Total del pedido recalculado en la base con los precios de la tabla.
- [ ] Costos y stock fuera del navegador (a Supabase) o escondidos.
- [ ] Hosting comercial (Cloudflare Pages o Netlify), dominio `.cl` y perfil
      de empresa en Google.
- [ ] Productos de Navidad cargados y "pedidos de Navidad abiertos" publicado
      en Instagram, estados de WhatsApp y link en la bio.

**Listo cuando:** tu mamá cambia un precio sola desde su celular y entra el
primer pedido de alguien que no es conocido.

### Semana 3 · 9 al 15 de noviembre — de proyecto a producto

- [ ] Plantilla: todo lo propio de Dulce Mae (marca, colores, logo, textos,
      WhatsApp, zonas, horario) sale a configuración. Repositorio nuevo y
      privado para la plantilla.
- [ ] Un mismo proyecto Supabase para varios clientes (columna de cliente en
      cada tabla).
- [ ] Carga de un cliente nuevo desde una planilla de productos + carpeta de fotos.
- [ ] Página propia de una sección con los planes y precios (`docs/PAQUETE_PYMES.md`).
- [ ] Lista de 40 prospectos.

**Listo cuando:** montar una demo para un negocio nuevo con 5 productos toma
menos de 2 horas.

### Semana 4 · 16 al 22 de noviembre — salir a vender

- [ ] 10 mensajes por día hábil (50 en la semana) con el texto del paquete.
- [ ] 3 a 5 demos en 48 horas cada una, mostradas en el celular del cliente.
- [ ] Anotar cada objeción tal cual la dijeron.

**Meta:** primer cliente cerrado con el precio de lanzamiento.

### Semana 5 · 23 al 29 de noviembre — entregar y seguir

- [ ] Entregar al cliente 1 en 7 días hábiles.
- [ ] Segunda ronda de mensajes con el gancho de Navidad: "tu catálogo de
      Navidad listo antes del 15 de diciembre".

**Meta:** segundo cliente cerrado.

### Semana 6 · 30 de noviembre al 6 de diciembre — aprender y ajustar

- [ ] Entregar al cliente 2.
- [ ] Pedir testimonios y permiso para mostrar sus páginas.
- [ ] Revisión honesta: horas reales por entrega, objeciones repetidas, qué
      plan eligieron. Ajustar precios y contenido de los planes.

### Diciembre — operar Navidad

Dulce Mae y los clientes reciben pedidos de Navidad. Soporte rápido,
cero funcionalidades nuevas. En enero: decidir el siguiente escalón (más
clientes de comida, o el plan con pago en línea usando lo aprendido en RYM Elite).

## Carril 2 — proyecto propio de portafolio

### Recomendación: astronomía con datos chilenos

**Clasificador de estrellas variables con curvas de luz de ZTF, usando ALeRCE.**

Por qué este y no otro:

- **Datos públicos y ya etiquetados.** El conjunto etiquetado del
  clasificador de ALeRCE (Sánchez-Sáez et al.) está en
  [Zenodo](https://zenodo.org/record/4279622), con etiquetas tomadas de
  catálogos independientes (ASAS-SN, Catalina, Gaia), no de otro modelo.
- **Es chileno y está vigente.** ALeRCE es un desarrollo chileno y ya procesa
  las alertas del Observatorio Vera C. Rubin, que opera en Cerro Pachón
  ([anuncio](https://community.lsst.org/t/alerce-is-now-live-processing-rubin-alerts/11632)).
  El proyecto conversa directo con el ecosistema de datos astronómicos de Chile.
- **Se termina.** Es un problema acotado: 6 semanas a 3 horas por semana.
- **Muestra lo que se pide en ciencia de datos:** series de tiempo
  irregulares, ingeniería de variables, clases desbalanceadas y validación honesta.

La bioinformática queda como segundo proyecto. El ángulo local fuerte es la
salmonicultura (patógenos, piojo de mar), con empleo en Puerto Montt, pero la
barrera de dominio es mayor y conviene llegar con un proyecto terminado primero.

### Paso concreto para este domingo (2 a 3 horas)

1. Crear el repositorio público `clasificador-variables-ztf` con un README de
   tres líneas: objetivo, datos, estado.
2. Descargar `labeled_set_lc_classifier_SanchezSaez_2020.csv` desde Zenodo.
3. Notebook `01_exploracion`: cuántos objetos hay por clase y elegir cinco
   clases periódicas (RR Lyrae, Cefeidas, binarias eclipsantes, Delta Scuti,
   variables de período largo).
4. Con `pip install alerce`, bajar las detecciones de un objeto por clase
   (`Alerce().query_detections(oid, format="pandas")`; si el nombre cambió,
   revisar la [documentación del cliente](https://alerce.readthedocs.io/)) y
   graficar cada curva de luz plegada por su período (Lomb-Scargle de `astropy`).
5. Subir el notebook con las cinco figuras.

**Listo cuando:** el repositorio tiene un notebook que corre de principio a
fin y muestra las cinco curvas plegadas.

### Las semanas siguientes

| Semana | Entregable |
|---|---|
| 2 | Curvas de luz de unos 300 objetos por clase descargadas y guardadas en local |
| 3 | Variables propias: período, amplitud, color g−r, asimetría, cantidad de detecciones |
| 4 | Modelo base con validación estratificada; F1 macro y matriz de confusión |
| 5 | Análisis de errores: qué clases confunde y por qué, con curvas de ejemplo |
| 6 | README de portafolio con figuras y un post en LinkedIn contando qué aprendiste |

Un post corto en LinkedIn en las semanas 1 y 6 basta: "empecé" y "terminé, esto aprendí".
