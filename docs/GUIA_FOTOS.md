# Guía de fotos para clientes

Para que el catálogo se vea profesional no hace falta cámara: basta un celular
y seguir estos puntos. Después las fotos pasan por el procesador
(`tools/fotos`), que quita el fondo y las deja todas iguales.

> **Dulce Mae** no necesita el procesador: el admin encuadra cada foto al subirla
> (cuadrada, mismo tamaño, opción "Dar más luz") y trae esta misma guía adentro,
> más una sección para sacar fotos desde Instagram y otra con ideas para
> "Sobre nosotros". El procesador sirve para cargar muchas fotos de una vez o
> para otros clientes.

## Texto para mandar por WhatsApp

Listo para copiar y pegar:

```text
¡Hola! Para armar tu catálogo necesito una foto de cada producto. Con el celular basta, sólo sigue esto:

1. Luz natural: de día, junto a una ventana. Sin flash y sin luz amarilla de ampolleta.
2. Fondo liso: mesa, cartulina o sábana de un solo color, que contraste con el producto (producto oscuro, fondo claro; producto claro, fondo oscuro o de color).
3. Celular horizontal y a la altura del producto, levemente desde arriba (como lo vería alguien sentado a la mesa).
4. Producto al centro, completo, con espacio alrededor. Nada cortado en los bordes.
5. Sólo el producto: sin manos, sin otros objetos, sin decoraciones encima del fondo.
6. Sin zoom: acércate con el celular. Toca la pantalla sobre el producto para enfocar y espera un segundo antes de disparar.
7. Una foto por producto, y nómbrala con el nombre del producto (ej: "Torta tres leches").

Para enviarlas: como DOCUMENTO por WhatsApp (clip > Documento) o por Google Drive. Si las mandas como foto normal, WhatsApp les baja la calidad.

Si tienes fotos lindas de ambiente (mesa puesta, el local, tú trabajando), mándalas también: sirven para la portada.
```

## Por qué cada punto

| Punto | Qué pasa si no se cumple |
|---|---|
| Luz natural, sin flash | Colores falsos y brillos que no se pueden arreglar después |
| Fondo liso que contraste | El quitafondos confunde el producto con el fondo |
| Celular horizontal | Deja aire a los lados para centrar sin cortar el producto |
| Producto completo y con espacio | Si sale cortado, no hay cómo inventar lo que falta |
| Sin zoom, enfocar tocando | El zoom digital y el movimiento dejan la foto borrosa |
| Enviar como documento | Como foto normal, WhatsApp la achica y la comprime |

## Qué revisa el procesador

Al correr `tools/fotos/procesar_fotos.py`, el `reporte.csv` marca como
`revisar` las fotos que conviene pedir de nuevo, con el motivo en palabras
simples: foto chica, movida, oscura, producto que toca el borde o fondo que no
se pudo separar. Esa frase se puede reenviar tal cual al cliente.

## Si el cliente no puede sacar fotos

Ofrecer la sesión en su local como extra (ver `docs/PAQUETE_PYMES.md`): se
lleva un fondo de cartulina blanca y otro de color, y se fotografía junto a la
ventana con el mismo celular. Con 25 productos son unas dos horas.
