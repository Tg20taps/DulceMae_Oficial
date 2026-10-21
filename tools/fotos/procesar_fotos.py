#!/usr/bin/env python3
"""
Procesa fotos de producto para catálogos web.

Para cada foto: corrige la orientación del celular, pasa los colores a sRGB,
quita el fondo, recorta al producto, lo centra en un lienzo de tamaño fijo
sobre un fondo uniforme y lo guarda en WebP liviano. Además revisa la foto y
avisa cuando conviene pedirla de nuevo (chica, movida, oscura, producto
cortado o fondo que no se pudo separar).

Ejemplos:
    python procesar_fotos.py originales/ listas/
    python procesar_fotos.py originales/ listas/ --perfil dulcemae
    python procesar_fotos.py originales/ listas/ --perfil rymelite --png
    python procesar_fotos.py ambiente/ listas/ --perfil instagram --solo-recortar

La primera vez que se quita un fondo se descarga el modelo (~180 MB).
"""
from __future__ import annotations

import argparse
import csv
import io
import re
import sys
import time
import unicodedata
from dataclasses import dataclass, field, replace
from pathlib import Path

import numpy as np
from PIL import Image, ImageCms, ImageColor, ImageFilter, ImageOps

try:
    import pillow_heif

    pillow_heif.register_heif_opener()
    EXTENSIONES_HEIC = {".heic", ".heif"}
except ImportError:
    EXTENSIONES_HEIC = set()

EXTENSIONES = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tif", ".tiff"} | EXTENSIONES_HEIC

SRGB = ImageCms.createProfile("sRGB")

# Alfa mínimo para contar un píxel como producto y no como borde difuso.
UMBRAL_ALFA = 16

# Por debajo de esto la foto se ve borrosa en un celular de gama media.
LADO_CORTO_MINIMO = 800

# Varianza del laplaciano (con la foto a 1000 px como máximo) bajo la cual se
# considera movida o desenfocada. Calibrado con fotos de comida: una nítida da
# entre 20 y 30 y la misma con un desenfoque leve ya baja de 5. La comida tiene
# poca textura, así que el umbral es bajo a propósito.
NITIDEZ_MINIMA = 8.0


@dataclass(frozen=True)
class Perfil:
    ancho: int
    alto: int
    fondo: tuple[int, int, int] | None  # None = fondo transparente
    margen: float  # fracción del lienzo que queda libre en cada borde
    sombra: bool
    alinear: str  # "centro" o "base"
    calidad: int = 82
    peso_max_kb: int | None = None


PERFILES = {
    # Genérico para cualquier cliente: blanco, cuadrado.
    "catalogo": Perfil(1200, 1200, (255, 255, 255), 0.10, True, "centro"),
    # Rosado muy suave de la marca; las tortas se ven cálidas y no flotan.
    "dulcemae": Perfil(1200, 1200, (255, 245, 247), 0.10, True, "centro"),
    # Especificación RYM Elite §20.9-20.10: tarjeta 1:1, grafito claro,
    # producto recortado; imagen principal bajo 150 KB (§20.2).
    "rymelite": Perfil(1600, 1600, (33, 35, 39), 0.08, False, "centro", peso_max_kb=150),
    # Publicación vertical 4:5 de Instagram.
    "instagram": Perfil(1080, 1350, (255, 255, 255), 0.10, True, "centro"),
}

NOMBRES_COLOR = {"blanco": "#FFFFFF", "negro": "#000000", "gris": "#F4F4F5"}

# Marca que --fondo no se indicó (None ya significa "transparente").
FONDO_DEL_PERFIL = object()


class FotoInvalida(Exception):
    """La foto no se puede procesar; el mensaje explica qué pedirle al cliente."""


@dataclass
class Resultado:
    origen: Path
    destino: Path | None = None
    kb: float = 0.0
    avisos: list[str] = field(default_factory=list)
    error: str | None = None
    omitida: bool = False


# ── Lectura ──────────────────────────────────────────────────────────────


def abrir_foto(ruta: Path) -> Image.Image:
    """Abre la foto derecha y en sRGB, en modo RGB o RGBA."""
    img = Image.open(ruta)
    icc = img.info.get("icc_profile")
    # Los celulares guardan la foto acostada y anotan el giro en el EXIF.
    img = ImageOps.exif_transpose(img)
    return a_srgb(img, icc)


def a_srgb(img: Image.Image, icc: bytes | None) -> Image.Image:
    """Convierte a sRGB usando el perfil embebido (los iPhone usan Display P3)."""
    tiene_alfa = img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info)
    alfa = img.convert("RGBA").getchannel("A") if tiene_alfa else None
    base = img if img.mode in ("RGB", "CMYK") else img.convert("RGB")
    if icc:
        try:
            perfil_origen = ImageCms.ImageCmsProfile(io.BytesIO(icc))
            base = ImageCms.profileToProfile(base, perfil_origen, SRGB, outputMode="RGB")
        except (OSError, ValueError, ImageCms.PyCMSError):
            base = base.convert("RGB")
    else:
        base = base.convert("RGB")
    if alfa is not None:
        base.putalpha(alfa)
    return base


def ya_viene_recortada(img: Image.Image) -> bool:
    """True si la foto ya trae fondo transparente (por ejemplo, un PNG recortado)."""
    if img.mode != "RGBA":
        return False
    alfa = np.asarray(img.getchannel("A"))
    return (alfa < UMBRAL_ALFA).mean() > 0.02


# ── Fondo y máscara ──────────────────────────────────────────────────────


class Recortador:
    """Envuelve rembg y reutiliza la sesión entre fotos: cargar el modelo es lo lento."""

    def __init__(self, modelo: str, bordes_finos: bool):
        try:
            from rembg import new_session, remove
        except ImportError as exc:
            raise SystemExit(
                "Falta rembg. Instala las dependencias con:\n"
                "    pip install -r requirements.txt\n"
                "o usa --solo-recortar si no necesitas quitar fondos."
            ) from exc
        self._remove = remove
        self._sesion = new_session(modelo)
        self._bordes_finos = bordes_finos

    def quitar_fondo(self, img: Image.Image) -> Image.Image:
        recorte = self._remove(
            img.convert("RGB"),
            session=self._sesion,
            post_process_mask=True,
            alpha_matting=self._bordes_finos,
        )
        return recorte.convert("RGBA")


def limpiar_motas(rgba: Image.Image) -> Image.Image:
    """Borra restos sueltos del fondo para que no agranden el recorte.

    Conserva toda pieza de al menos el 2 % del área de la pieza más grande,
    así un producto de varias partes (seis alfajores, un par de zapatillas)
    queda completo.
    """
    from scipy import ndimage

    alfa = np.asarray(rgba.getchannel("A"))
    etiquetas, cantidad = ndimage.label(alfa >= UMBRAL_ALFA)
    if cantidad <= 1:
        return rgba
    areas = np.bincount(etiquetas.ravel())[1:]
    conservar = np.flatnonzero(areas >= areas.max() * 0.02) + 1
    limpio = np.where(np.isin(etiquetas, conservar), alfa, 0).astype(np.uint8)
    salida = rgba.copy()
    salida.putalpha(Image.fromarray(limpio))
    return salida


def limpiar_borde(rgba: Image.Image) -> Image.Image:
    """Quita el halo que deja el fondo original en el contorno del producto.

    Achica la máscara un píxel y pinta los píxeles semitransparentes del borde
    con el color del interior cercano, para que una torta fotografiada sobre
    una mesa oscura no quede con una línea gris al ponerla sobre fondo claro.
    """
    from scipy import ndimage

    alfa = np.asarray(rgba.getchannel("A").filter(ImageFilter.MinFilter(3)))
    rgb = np.asarray(rgba.convert("RGB"), dtype=np.float32)
    radio = max(2, round(max(rgba.size) / 400))
    interior = ndimage.binary_erosion(alfa >= 250, iterations=radio)
    if interior.any():
        # Color del interior suavizado, para no copiar un solo píxel con ruido.
        peso = ndimage.gaussian_filter(interior.astype(np.float32), radio)
        color = ndimage.gaussian_filter(rgb * interior[..., None], (radio, radio, 0))
        suave = color / np.maximum(peso, 1e-6)[..., None]
        # Cada píxel del borde toma el color del punto interior más cercano.
        _, (filas, columnas) = ndimage.distance_transform_edt(~interior, return_indices=True)
        borde = (alfa > 0) & ~interior
        rgb[borde] = suave[filas[borde], columnas[borde]]
    salida = Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8))
    salida.putalpha(Image.fromarray(alfa))
    return salida


def caja_producto(rgba: Image.Image) -> tuple[int, int, int, int]:
    caja = rgba.getchannel("A").point(lambda a: 255 if a >= UMBRAL_ALFA else 0).getbbox()
    if caja is None:
        raise FotoInvalida(
            "No se encontró el producto: el fondo se llevó toda la foto. "
            "Pedir otra con el producto sobre un fondo liso que contraste."
        )
    return caja


# ── Revisión de calidad ──────────────────────────────────────────────────


def nitidez(img: Image.Image, mascara: Image.Image | None = None) -> float:
    """Varianza del laplaciano: baja si la foto está movida o desenfocada.

    Se mide sólo sobre el producto: un fondo desenfocado a propósito no cuenta.
    """
    escala = min(1.0, 1000 / max(img.size))
    tam = (max(1, round(img.width * escala)), max(1, round(img.height * escala)))
    gris = np.asarray(img.convert("L").resize(tam, Image.BILINEAR), dtype=np.float32)
    lap = (
        gris[:-2, 1:-1] + gris[2:, 1:-1] + gris[1:-1, :-2] + gris[1:-1, 2:]
        - 4 * gris[1:-1, 1:-1]
    )
    if mascara is not None:
        # Se achica la máscara para no medir el borde recortado, que siempre es nítido.
        dentro = mascara.resize(tam, Image.NEAREST).filter(ImageFilter.MinFilter(9))
        dentro = np.asarray(dentro)[1:-1, 1:-1] >= 128
        if dentro.sum() > 500:
            lap = lap[dentro]
    return float(lap.var())


def revisar_foto(img: Image.Image, tam_original: tuple[int, int]) -> list[str]:
    avisos = []
    if min(tam_original) < LADO_CORTO_MINIMO:
        avisos.append(
            f"Foto chica ({tam_original[0]}x{tam_original[1]}): se verá borrosa. "
            "Pedir el archivo original, no una captura de pantalla ni una foto reenviada."
        )
    luz = np.asarray(img.convert("L"), dtype=np.float32).mean()
    if luz < 55:
        avisos.append("Foto oscura: tomarla de día, junto a una ventana, sin flash.")
    return avisos


def revisar_recorte(rgba: Image.Image, caja: tuple[int, int, int, int]) -> list[str]:
    avisos = []
    ancho, alto = rgba.size
    alfa = np.asarray(rgba.getchannel("A"))
    cobertura = (alfa >= UMBRAL_ALFA).mean()
    if cobertura > 0.92:
        avisos.append(
            "Casi toda la foto quedó como producto: el fondo no se pudo separar. "
            "Pedir otra sobre fondo liso que contraste con el producto."
        )
    elif cobertura < 0.02:
        avisos.append("Se detectó muy poco producto: revisar que no se haya borrado una parte.")

    margen = 2
    lados = []
    if caja[0] <= margen:
        lados.append("izquierdo")
    if caja[1] <= margen:
        lados.append("superior")
    if caja[2] >= ancho - margen:
        lados.append("derecho")
    if caja[3] >= alto - margen:
        lados.append("inferior")
    if lados and cobertura <= 0.92:
        avisos.append(
            f"El producto toca el borde {', '.join(lados)} de la foto: puede venir cortado. "
            "Pedir otra con más espacio alrededor."
        )
    return avisos


# ── Composición ──────────────────────────────────────────────────────────


def escalar_rgba(img: Image.Image, tam: tuple[int, int]) -> Image.Image:
    # Se escala con alfa premultiplicado para que no aparezcan halos oscuros en el borde.
    return img.convert("RGBa").resize(tam, Image.LANCZOS).convert("RGBA")


def componer(producto: Image.Image, perfil: Perfil) -> tuple[Image.Image, float]:
    """Ubica el producto recortado (RGBA) en el lienzo del perfil.

    Devuelve la imagen final y la escala aplicada (mayor que 1 = se agrandó).
    """
    ancho, alto = perfil.ancho, perfil.alto
    util_ancho = ancho * (1 - 2 * perfil.margen)
    util_alto = alto * (1 - 2 * perfil.margen)
    escala = min(util_ancho / producto.width, util_alto / producto.height)
    tam = (max(1, round(producto.width * escala)), max(1, round(producto.height * escala)))
    producto = escalar_rgba(producto, tam)

    x = (ancho - tam[0]) // 2
    if perfil.alinear == "base":
        y = alto - round(alto * perfil.margen) - tam[1]
    else:
        y = (alto - tam[1]) // 2

    fondo = (*perfil.fondo, 255) if perfil.fondo else (0, 0, 0, 0)
    lienzo = Image.new("RGBA", (ancho, alto), fondo)

    if perfil.sombra:
        sombra = Image.new("RGBA", tam, (0, 0, 0, 0))
        sombra.putalpha(producto.getchannel("A").point(lambda a: round(a * 0.22)))
        capa = Image.new("RGBA", (ancho, alto), (0, 0, 0, 0))
        capa.paste(sombra, (x, y + round(alto * 0.012)))
        capa = capa.filter(ImageFilter.GaussianBlur(max(2, round(ancho * 0.018))))
        lienzo = Image.alpha_composite(lienzo, capa)

    capa = Image.new("RGBA", (ancho, alto), (0, 0, 0, 0))
    capa.paste(producto, (x, y))
    lienzo = Image.alpha_composite(lienzo, capa)
    return (lienzo if perfil.fondo is None else lienzo.convert("RGB")), escala


def encuadrar(img: Image.Image, perfil: Perfil) -> tuple[Image.Image, float]:
    """Sin quitar fondo: recorta al centro para llenar el lienzo (fotos de ambiente)."""
    escala = max(perfil.ancho / img.width, perfil.alto / img.height)
    lienzo = ImageOps.fit(img.convert("RGB"), (perfil.ancho, perfil.alto), Image.LANCZOS)
    return lienzo, escala


# ── Guardado ─────────────────────────────────────────────────────────────


def guardar_webp(img: Image.Image, ruta: Path, calidad: int, peso_max_kb: int | None) -> float:
    """Guarda en WebP. Si hay peso máximo, baja la calidad hasta cumplirlo (mínimo 50)."""
    while True:
        datos = io.BytesIO()
        img.save(datos, "WEBP", quality=calidad, method=6)
        kb = datos.tell() / 1024
        if peso_max_kb is None or kb <= peso_max_kb or calidad <= 50:
            break
        calidad = max(50, calidad - 6)
    ruta.parent.mkdir(parents=True, exist_ok=True)
    ruta.write_bytes(datos.getvalue())
    return kb


def nombre_limpio(texto: str) -> str:
    """'Torta Tres Leches (1)' -> 'torta-tres-leches-1': sirve como URL y nombre de archivo."""
    sin_tildes = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode()
    limpio = re.sub(r"[^a-z0-9]+", "-", sin_tildes.lower()).strip("-")
    return limpio or "foto"


# ── Proceso ──────────────────────────────────────────────────────────────


def procesar_foto(
    ruta: Path,
    destino: Path,
    perfil: Perfil,
    recortador: Recortador | None,
    guardar_png: bool,
    miniaturas: list[int],
) -> Resultado:
    resultado = Resultado(ruta, destino)
    destino.parent.mkdir(parents=True, exist_ok=True)
    trabajo = abrir_foto(ruta)
    tam_original = trabajo.size
    # Con el doble del lienzo sobra detalle y quitar el fondo es varias veces más rápido.
    lado_max = 2 * max(perfil.ancho, perfil.alto)
    trabajo.thumbnail((lado_max, lado_max), Image.LANCZOS)
    resultado.avisos += revisar_foto(trabajo, tam_original)

    if recortador is None:
        final, escala = encuadrar(trabajo, perfil)
        mascara = None
    else:
        if ya_viene_recortada(trabajo):
            # Un PNG ya recortado suele venir ajustado al producto: tocar el borde es normal.
            rgba = limpiar_motas(trabajo)
            caja = caja_producto(rgba)
        else:
            rgba = limpiar_borde(limpiar_motas(recortador.quitar_fondo(trabajo)))
            caja = caja_producto(rgba)
            resultado.avisos += revisar_recorte(rgba, caja)
        producto = rgba.crop(caja)
        mascara = producto.getchannel("A")
        final, escala = componer(producto, perfil)
        if guardar_png:
            producto.save(destino.with_suffix(".png"), optimize=True)

    # La escala es sobre la foto de trabajo; se lleva a píxeles de la original.
    agrandado = escala * trabajo.width / tam_original[0]
    if agrandado > 1.25:
        resultado.avisos.append(
            f"El producto se agrandó x{agrandado:.1f}: puede verse borroso. "
            "Acercar el celular al producto en vez de usar zoom."
        )
    fuente_nitidez = producto if recortador is not None else trabajo
    if nitidez(fuente_nitidez, mascara) < NITIDEZ_MINIMA:
        resultado.avisos.append("Foto movida o desenfocada: apoyar el celular y tocar la pantalla para enfocar.")

    resultado.kb = guardar_webp(final, destino, perfil.calidad, perfil.peso_max_kb)
    for lado in miniaturas:
        mini = final.copy()
        mini.thumbnail((lado, lado), Image.LANCZOS)
        guardar_webp(mini, destino.with_name(f"{destino.stem}-{lado}.webp"), perfil.calidad, None)
    return resultado


def buscar_fotos(entrada: Path, recursivo: bool) -> list[Path]:
    if entrada.is_file():
        return [entrada]
    patron = "**/*" if recursivo else "*"
    return sorted(
        p for p in entrada.glob(patron)
        if p.is_file() and p.suffix.lower() in EXTENSIONES and not p.name.startswith(".")
    )


def asignar_destinos(fotos: list[Path], entrada: Path, salida: Path) -> list[Path]:
    """Nombre limpio por foto, conservando subcarpetas y sin pisar nombres repetidos."""
    base = entrada if entrada.is_dir() else entrada.parent
    usados: dict[Path, int] = {}
    destinos = []
    for foto in fotos:
        carpeta = salida / foto.parent.relative_to(base)
        candidato = carpeta / f"{nombre_limpio(foto.stem)}.webp"
        usados[candidato] = usados.get(candidato, 0) + 1
        if usados[candidato] > 1:
            candidato = candidato.with_name(f"{candidato.stem}-{usados[candidato]}.webp")
        destinos.append(candidato)
    return destinos


def escribir_reporte(resultados: list[Resultado], salida: Path) -> Path:
    ruta = salida / "reporte.csv"
    salida.mkdir(parents=True, exist_ok=True)
    # utf-8-sig para que Excel muestre bien las tildes.
    with ruta.open("w", newline="", encoding="utf-8-sig") as archivo:
        tabla = csv.writer(archivo, delimiter=";")
        tabla.writerow(["original", "resultado", "estado", "kb", "avisos"])
        for r in resultados:
            estado = "error" if r.error else "omitida" if r.omitida else "revisar" if r.avisos else "ok"
            tabla.writerow([
                r.origen.name,
                r.destino.name if r.destino else "",
                estado,
                f"{r.kb:.0f}" if r.kb else "",
                r.error or " | ".join(r.avisos),
            ])
    return ruta


def leer_color(valor: str) -> tuple[int, int, int] | None:
    valor = valor.strip().lower()
    if valor in ("transparente", "ninguno"):
        return None
    try:
        return ImageColor.getrgb(NOMBRES_COLOR.get(valor, valor))[:3]
    except ValueError:
        raise argparse.ArgumentTypeError(
            f"Color no válido: {valor!r}. Usa #RRGGBB, blanco o transparente."
        ) from None


def leer_argumentos(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Quita el fondo, centra y comprime fotos de producto a WebP.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="Perfiles: " + ", ".join(
            f"{n} ({p.ancho}x{p.alto})" for n, p in PERFILES.items()
        ),
    )
    parser.add_argument("entrada", type=Path, help="Foto o carpeta con fotos originales")
    parser.add_argument("salida", type=Path, help="Carpeta donde quedan las fotos listas")
    parser.add_argument("--perfil", choices=PERFILES, default="catalogo")
    parser.add_argument("--ancho", type=int, help="Ancho del lienzo en px")
    parser.add_argument("--alto", type=int, help="Alto del lienzo en px")
    parser.add_argument("--fondo", type=leer_color, default=FONDO_DEL_PERFIL,
                        help="#RRGGBB, blanco o transparente")
    parser.add_argument("--margen", type=float, help="Espacio libre por borde, de 0 a 0.4 (0.10 = 10%%)")
    parser.add_argument("--alinear", choices=["centro", "base"], help="base: todos apoyados a la misma altura")
    parser.add_argument("--sombra", action=argparse.BooleanOptionalAction, default=None)
    parser.add_argument("--calidad", type=int, help="Calidad WebP, 1 a 100")
    parser.add_argument("--peso-max", type=int, metavar="KB", help="Peso máximo por foto")
    parser.add_argument("--miniaturas", type=int, nargs="+", default=[], metavar="PX",
                        help="Además guarda versiones chicas, por ejemplo: --miniaturas 400 800")
    parser.add_argument("--png", action="store_true", help="Guarda también el recorte transparente en PNG")
    parser.add_argument("--solo-recortar", action="store_true",
                        help="No quita el fondo: sólo encuadra y comprime (fotos de ambiente)")
    parser.add_argument("--modelo", default="isnet-general-use",
                        help="Modelo de rembg (isnet-general-use, u2net, birefnet-general)")
    parser.add_argument("--bordes-finos", action="store_true",
                        help="Mejor borde en cosas finas (más lento)")
    parser.add_argument("--recursivo", action="store_true", help="Incluye subcarpetas")
    parser.add_argument("--forzar", action="store_true", help="Reprocesa aunque ya exista el resultado")
    args = parser.parse_args(argv)

    if args.margen is not None and not 0 <= args.margen <= 0.4:
        parser.error("--margen debe estar entre 0 y 0.4")
    if args.calidad is not None and not 1 <= args.calidad <= 100:
        parser.error("--calidad debe estar entre 1 y 100")
    return args


def armar_perfil(args: argparse.Namespace) -> Perfil:
    opciones = {
        "ancho": args.ancho,
        "alto": args.alto,
        "margen": args.margen,
        "alinear": args.alinear,
        "sombra": args.sombra,
        "calidad": args.calidad,
        "peso_max_kb": args.peso_max,
    }
    cambios = {k: v for k, v in opciones.items() if v is not None}
    if args.fondo is not FONDO_DEL_PERFIL:
        cambios["fondo"] = args.fondo
    return replace(PERFILES[args.perfil], **cambios)


def main(argv: list[str] | None = None) -> int:
    # La consola de Windows a veces no acepta tildes ni símbolos; mejor un "?" que una caída.
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")

    args = leer_argumentos(argv)
    perfil = armar_perfil(args)
    if not args.entrada.exists():
        print(f"No existe: {args.entrada}")
        return 2

    fotos = buscar_fotos(args.entrada, args.recursivo)
    if not fotos:
        print(f"No hay fotos en {args.entrada} ({', '.join(sorted(EXTENSIONES))}).")
        return 2
    destinos = asignar_destinos(fotos, args.entrada, args.salida)

    fondo = "transparente" if perfil.fondo is None else "#%02X%02X%02X" % perfil.fondo
    print(f"{len(fotos)} fotos · {perfil.ancho}x{perfil.alto} · fondo {fondo} · margen {perfil.margen:.0%}")

    recortador = None
    if not args.solo_recortar:
        print(f"Cargando modelo {args.modelo}...")
        recortador = Recortador(args.modelo, args.bordes_finos)

    resultados = []
    for i, (foto, destino) in enumerate(zip(fotos, destinos), start=1):
        prefijo = f"[{i}/{len(fotos)}] {foto.name}"
        if not args.forzar and destino.exists() and destino.stat().st_mtime >= foto.stat().st_mtime:
            print(f"{prefijo} · ya estaba lista")
            resultados.append(Resultado(foto, destino, omitida=True))
            continue
        inicio = time.perf_counter()
        try:
            resultado = procesar_foto(foto, destino, perfil, recortador, args.png, args.miniaturas)
        except FotoInvalida as exc:
            print(f"{prefijo} ✗ {exc}")
            resultados.append(Resultado(foto, error=str(exc)))
            continue
        except Exception as exc:  # una foto rota no debe detener el lote completo
            mensaje = f"No se pudo procesar ({type(exc).__name__}: {exc})"
            print(f"{prefijo} ✗ {mensaje}")
            resultados.append(Resultado(foto, error=mensaje))
            continue
        segundos = time.perf_counter() - inicio
        print(f"{prefijo} → {destino.name} · {resultado.kb:.0f} KB · {segundos:.1f} s")
        for aviso in resultado.avisos:
            print(f"    ⚠ {aviso}")
        resultados.append(resultado)

    reporte = escribir_reporte(resultados, args.salida)
    listas = sum(1 for r in resultados if not r.error and not r.omitida)
    revisar = sum(1 for r in resultados if r.avisos)
    errores = sum(1 for r in resultados if r.error)
    omitidas = sum(1 for r in resultados if r.omitida)
    print(f"\nListas: {listas} · Para revisar: {revisar} · Con error: {errores} · Ya estaban: {omitidas}")
    print(f"Reporte: {reporte}")
    return 1 if errores else 0


if __name__ == "__main__":
    sys.exit(main())
