"""Pruebas de procesar_fotos.py. No necesitan el modelo de rembg: corren en segundos.

    python -m pytest test_procesar_fotos.py
"""
import csv

import numpy as np
import pytest
from PIL import Image, ImageDraw, ImageFilter

import procesar_fotos as pf

BLANCO = (255, 255, 255)


def perfil(**cambios):
    base = pf.Perfil(400, 400, BLANCO, 0.10, False, "centro")
    return pf.replace(base, **cambios)


def producto_rojo(ancho=200, alto=100):
    return Image.new("RGBA", (ancho, alto), (200, 30, 30, 255))


def caja_no_fondo(img, fondo=BLANCO):
    diferencia = np.any(np.asarray(img.convert("RGB")) != fondo, axis=2)
    filas, columnas = np.nonzero(diferencia)
    return columnas.min(), filas.min(), columnas.max() + 1, filas.max() + 1


def test_componer_centra_y_respeta_el_margen():
    final, escala = pf.componer(producto_rojo(), perfil())
    assert final.size == (400, 400)
    assert final.mode == "RGB"
    assert escala == pytest.approx(1.6)  # 320 px útiles / 200 px de producto
    x0, y0, x1, y1 = caja_no_fondo(final)
    assert (x0, x1) == (40, 360)
    assert (y0 + y1) / 2 == pytest.approx(200, abs=1)


def test_componer_alinea_a_la_base():
    final, _ = pf.componer(producto_rojo(), perfil(alinear="base"))
    _, _, _, y1 = caja_no_fondo(final)
    assert y1 == 360  # 400 - 10 % de margen


def test_componer_con_fondo_transparente_conserva_alfa():
    final, _ = pf.componer(producto_rojo(), perfil(fondo=None))
    assert final.mode == "RGBA"
    alfa = np.asarray(final.getchannel("A"))
    assert alfa[0, 0] == 0
    assert alfa[200, 200] == 255


def test_sombra_queda_bajo_el_producto():
    final, _ = pf.componer(producto_rojo(), perfil(sombra=True))
    gris = np.asarray(final.convert("L"), dtype=int)
    # El producto va de y=120 a y=280; la sombra cae hacia abajo.
    bajo, sobre = gris[284, 200], gris[116, 200]
    assert bajo < 255
    assert bajo < sobre


def test_nombre_limpio():
    assert pf.nombre_limpio("Torta Tres Leches (1)") == "torta-tres-leches-1"
    assert pf.nombre_limpio("Kúchen de Ñuñoa") == "kuchen-de-nunoa"
    assert pf.nombre_limpio("###") == "foto"


def test_asignar_destinos_no_pisa_nombres_y_conserva_subcarpetas(tmp_path):
    entrada = tmp_path / "originales"
    (entrada / "tortas").mkdir(parents=True)
    fotos = [entrada / "tortas" / "Alfajor.jpg", entrada / "tortas" / "alfajor.png", entrada / "x.jpg"]
    destinos = pf.asignar_destinos(fotos, entrada, tmp_path / "listas")
    assert [d.relative_to(tmp_path / "listas").as_posix() for d in destinos] == [
        "tortas/alfajor.webp",
        "tortas/alfajor-2.webp",
        "x.webp",
    ]


def test_limpiar_motas_borra_restos_sueltos_pero_no_piezas_parecidas():
    img = Image.new("RGBA", (300, 200), (0, 0, 0, 0))
    dibujo = ImageDraw.Draw(img)
    dibujo.rectangle((20, 50, 100, 150), fill=(150, 90, 40, 255))  # alfajor 1
    dibujo.rectangle((180, 50, 260, 150), fill=(150, 90, 40, 255))  # alfajor 2
    dibujo.rectangle((290, 5, 292, 7), fill=(90, 90, 90, 255))  # mota del fondo
    limpio = pf.limpiar_motas(img)
    assert pf.caja_producto(limpio) == (20, 50, 261, 151)


def test_limpiar_borde_quita_el_halo_oscuro():
    img = Image.new("RGBA", (200, 200), (30, 30, 30, 0))
    ImageDraw.Draw(img).ellipse((40, 40, 160, 160), fill=(240, 240, 240, 255))
    # Borde semitransparente y oscuro, como deja una mesa negra al recortar.
    alfa = img.getchannel("A").filter(ImageFilter.GaussianBlur(3))
    solido = alfa.point(lambda a: 255 if a > 200 else 0)
    rgb = Image.composite(img.convert("RGB"), Image.new("RGB", img.size, (30, 30, 30)), solido)
    sucio = rgb.copy()
    sucio.putalpha(alfa)
    limpio = pf.limpiar_borde(sucio)
    arr, a = np.asarray(limpio), np.asarray(limpio.getchannel("A"))
    borde = (a > 20) & (a < 200)
    assert arr[..., :3][borde].mean() > 200


def test_caja_producto_sin_producto_explica_que_pedir():
    with pytest.raises(pf.FotoInvalida, match="fondo liso"):
        pf.caja_producto(Image.new("RGBA", (50, 50), (0, 0, 0, 0)))


def test_revisar_recorte_avisa_producto_cortado():
    img = Image.new("RGBA", (200, 200), (0, 0, 0, 0))
    ImageDraw.Draw(img).rectangle((50, 60, 199, 150), fill=(200, 0, 0, 255))
    avisos = pf.revisar_recorte(img, pf.caja_producto(img))
    assert any("borde derecho" in a for a in avisos)


def test_revisar_recorte_avisa_fondo_no_separado():
    img = Image.new("RGBA", (100, 100), (10, 10, 10, 255))
    avisos = pf.revisar_recorte(img, pf.caja_producto(img))
    assert any("no se pudo separar" in a for a in avisos)


def test_nitidez_baja_con_foto_movida():
    ruido = np.random.default_rng(1).integers(0, 255, (600, 600, 3), dtype=np.uint8)
    nitida = Image.fromarray(ruido).filter(ImageFilter.GaussianBlur(1))
    movida = nitida.filter(ImageFilter.GaussianBlur(6))
    assert pf.nitidez(nitida) > pf.NITIDEZ_MINIMA > pf.nitidez(movida)


def test_abrir_foto_endereza_segun_exif(tmp_path):
    ruta = tmp_path / "celular.jpg"
    exif = Image.Exif()
    exif[0x0112] = 6  # girar 90° al mostrar
    Image.new("RGB", (400, 300), "white").save(ruta, exif=exif)
    assert pf.abrir_foto(ruta).size == (300, 400)


def test_guardar_webp_respeta_el_peso_maximo(tmp_path):
    ruido = np.random.default_rng(2).integers(0, 255, (1200, 1200, 3), dtype=np.uint8)
    textura = Image.fromarray(ruido).filter(ImageFilter.GaussianBlur(1.5))
    sin_limite = pf.guardar_webp(textura, tmp_path / "a.webp", 95, None)
    con_limite = pf.guardar_webp(textura, tmp_path / "b.webp", 95, 150)
    assert sin_limite > 150
    assert con_limite <= 150
    assert (tmp_path / "b.webp").stat().st_size / 1024 == pytest.approx(con_limite)


def test_leer_color():
    assert pf.leer_color("blanco") == BLANCO
    assert pf.leer_color("#FFF5F7") == (255, 245, 247)
    assert pf.leer_color("transparente") is None


def test_armar_perfil_permite_cambiar_y_quitar_el_fondo():
    args = pf.leer_argumentos(["a", "b", "--perfil", "dulcemae", "--ancho", "800"])
    assert pf.armar_perfil(args).ancho == 800
    assert pf.armar_perfil(args).fondo == (255, 245, 247)
    args = pf.leer_argumentos(["a", "b", "--perfil", "dulcemae", "--fondo", "transparente"])
    assert pf.armar_perfil(args).fondo is None


def test_main_solo_recortar_procesa_reporta_y_no_repite(tmp_path, capsys):
    entrada, salida = tmp_path / "originales", tmp_path / "listas"
    entrada.mkdir()
    foto = Image.new("RGB", (1600, 1200), "white")
    ImageDraw.Draw(foto).ellipse((500, 300, 1100, 900), fill=(190, 60, 90))
    foto.save(entrada / "Torta Frambuesa.jpg", quality=92)
    (entrada / "rota.jpg").write_text("no es una imagen")

    codigo = pf.main([str(entrada), str(salida), "--solo-recortar", "--miniaturas", "300"])
    assert codigo == 1  # hubo una foto con error
    assert Image.open(salida / "torta-frambuesa.webp").size == (1200, 1200)
    assert Image.open(salida / "torta-frambuesa-300.webp").size == (300, 300)
    with (salida / "reporte.csv").open(encoding="utf-8-sig") as archivo:
        filas = {f["original"]: f for f in csv.DictReader(archivo, delimiter=";")}
    assert filas["Torta Frambuesa.jpg"]["estado"] == "ok"
    assert filas["rota.jpg"]["estado"] == "error"

    capsys.readouterr()
    pf.main([str(entrada), str(salida), "--solo-recortar"])
    assert "ya estaba lista" in capsys.readouterr().out
