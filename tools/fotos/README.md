# Procesador de fotos de producto

Deja las fotos de un catálogo parejas y livianas, sin editar una por una:

1. Endereza la foto del celular y pasa los colores a sRGB.
2. Quita el fondo con [rembg](https://github.com/danielgatis/rembg).
3. Limpia el borde (sin halo del fondo original) y borra restos sueltos.
4. Centra el producto en un lienzo de tamaño fijo, con el mismo margen y una sombra suave.
5. Guarda en WebP (30 a 50 KB por foto a 1200 px).
6. Revisa cada foto y avisa cuál conviene pedir de nuevo: chica, movida, oscura,
   producto cortado o fondo que no se pudo separar.

Sirve para Dulce Mae, RYM Elite y cualquier cliente del paquete.

## Instalación (una vez)

Windows (PowerShell), desde esta carpeta:

```powershell
py -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

macOS o Linux:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

La primera vez que quita un fondo descarga el modelo (unos 180 MB). Después
funciona sin internet. Para fotos `.HEIC` de iPhone, instalar además `pillow-heif`.

## Uso

```bash
# Genérico: 1200x1200, fondo blanco
python procesar_fotos.py originales/ listas/

# Dulce Mae: fondo rosado muy suave de la marca
python procesar_fotos.py originales/ listas/ --perfil dulcemae --miniaturas 480

# RYM Elite: 1600x1600 sobre grafito claro, máximo 150 KB (especificación §20)
python procesar_fotos.py originales/ listas/ --perfil rymelite --recursivo

# Fondo transparente (la web pone el color) y recorte en PNG para reusar
python procesar_fotos.py originales/ listas/ --fondo transparente --png

# Fotos de ambiente (mesa puesta, local): no quita fondo, sólo encuadra y comprime
python procesar_fotos.py ambiente/ listas/ --perfil instagram --solo-recortar
```

| Perfil | Lienzo | Fondo | Uso |
|---|---|---|---|
| `catalogo` | 1200×1200 | blanco | Cualquier cliente |
| `dulcemae` | 1200×1200 | `#FFF5F7` | Catálogo de Dulce Mae |
| `rymelite` | 1600×1600 | `#212327`, máx. 150 KB | Tarjeta 1:1 de RYM Elite |
| `instagram` | 1080×1350 | blanco | Publicación vertical 4:5 |

Cualquier valor del perfil se puede cambiar: `--ancho`, `--alto`, `--fondo`,
`--margen`, `--alinear base`, `--no-sombra`, `--calidad`, `--peso-max`.
`python procesar_fotos.py --help` muestra todo.

Detalles útiles:

- Los nombres quedan listos para la web: `Torta Tres Leches (1).JPG` → `torta-tres-leches-1.webp`.
- Con `--recursivo` respeta subcarpetas (`originales/tortas/` → `listas/tortas/`).
- Si se corre de nuevo, salta las fotos que ya están listas. `--forzar` las rehace.
- Una foto rota no detiene el lote; queda anotada como error.
- `--alinear base` deja todos los productos apoyados a la misma altura: se ve
  mejor en una grilla de zapatillas o botellas.
- `--bordes-finos` mejora pelos, hilos o cintas; es más lento.

## Flujo con un cliente

1. El cliente manda las fotos siguiendo la [guía de fotos](../../docs/GUIA_FOTOS.md),
   como **archivo** o por Google Drive (no como foto de WhatsApp, que la comprime).
2. Se guardan en `originales/<cliente>/`, una por producto, con el nombre del producto.
3. Se corre el script.
4. Se abre `listas/<cliente>/reporte.csv` en Excel: las filas en estado `revisar`
   dicen exactamente qué pedir de nuevo.

`originales/` y `listas/` están en `.gitignore`: las fotos de clientes no se suben al repositorio.

## Tiempo

En un notebook sin tarjeta gráfica, entre 1 y 5 segundos por foto. Cincuenta
fotos, unos 3 minutos.

## Pruebas

```bash
python -m pytest test_procesar_fotos.py
```

No necesitan el modelo; corren en segundos.
