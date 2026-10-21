// Fotos del catálogo: se recortan y comprimen en el mismo celular antes de
// subirlas. Una foto de 4 MB queda en unos 150 KB, todas con la misma forma,
// y la página carga rápido aunque la señal sea mala.

export const LADO_FOTO = 1200;
export const LADO_MINIATURA = 480;
// Bajo esto, la foto se ve borrosa en la ficha del producto.
export const LADO_MINIMO_RECOMENDADO = 700;

const CARPETA_PUBLICA = '/storage/v1/object/public/productos/';

// Brillo, contraste y color un poco arriba: ayuda a fotos de cocina con poca luz.
export const FILTRO_LUZ = 'brightness(1.07) contrast(1.05) saturate(1.08)';
export const PUEDE_FILTRAR = typeof CanvasRenderingContext2D !== 'undefined'
  && 'filter' in CanvasRenderingContext2D.prototype;

export function leerFoto(file) {
  if (!file || !file.type.startsWith('image/')) {
    return Promise.reject(new Error('Eso no es una foto. Elige una imagen.'));
  }
  const url = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const imagen = new Image();
    // El navegador endereza la foto según cómo se tomó con el celular.
    imagen.onload = () => resolve({ imagen, url });
    imagen.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo leer la foto. Prueba con otra.'));
    };
    imagen.src = url;
  });
}

function canvasABlob(canvas, tipo, calidad) {
  return new Promise(resolve => canvas.toBlob(resolve, tipo, calidad));
}

async function codificar(canvas, formato) {
  if (formato === 'jpeg') return canvasABlob(canvas, 'image/jpeg', 0.86);
  // Safari antiguo no sabe generar WebP: en ese caso, JPEG.
  const webp = await canvasABlob(canvas, 'image/webp', 0.82);
  if (webp && webp.type === 'image/webp') return webp;
  return canvasABlob(canvas, 'image/jpeg', 0.85);
}

// Recorta el rectángulo (en píxeles de la foto original) y devuelve la foto
// lista y, si se pide, su miniatura para las tarjetas del catálogo.
export async function exportarRecorte(imagen, { sx, sy, sw, sh }, { ancho, alto, luz = false, formato = 'webp', miniatura = true }) {
  // Nunca agrandar: una foto chica agrandada pesa más y se ve igual de borrosa.
  const escala = Math.min(1, sw / ancho);
  const salidaAncho = Math.round(ancho * escala);
  const salidaAlto = Math.round(alto * escala);

  const canvas = document.createElement('canvas');
  canvas.width = salidaAncho;
  canvas.height = salidaAlto;
  const contexto = canvas.getContext('2d');
  contexto.fillStyle = '#ffffff';
  contexto.fillRect(0, 0, salidaAncho, salidaAlto);
  if (luz && PUEDE_FILTRAR) contexto.filter = FILTRO_LUZ;
  contexto.imageSmoothingQuality = 'high';
  contexto.drawImage(imagen, sx, sy, sw, sh, 0, 0, salidaAncho, salidaAlto);

  const blob = await codificar(canvas, formato);
  if (!blob) throw new Error('No se pudo preparar la foto. Prueba con otra.');
  const extension = blob.type === 'image/webp' ? 'webp' : 'jpg';

  let miniaturaBlob = null;
  if (miniatura) {
    const lado = Math.min(LADO_MINIATURA, salidaAncho);
    const chico = document.createElement('canvas');
    chico.width = lado;
    chico.height = Math.round(lado * (salidaAlto / salidaAncho));
    const contextoChico = chico.getContext('2d');
    contextoChico.imageSmoothingQuality = 'high';
    contextoChico.drawImage(canvas, 0, 0, chico.width, chico.height);
    miniaturaBlob = await canvasABlob(chico, blob.type, 0.8);
  }

  return {
    blob,
    miniaturaBlob,
    extension,
    previewUrl: URL.createObjectURL(blob),
    ancho: salidaAncho,
    alto: salidaAlto,
  };
}

// Las fotos subidas desde el admin tienen una versión chica al lado:
// .../2026-10/abc.webp  ->  .../2026-10/abc-480.webp
export function esFotoPropia(url) {
  return Boolean(url && url.includes(CARPETA_PUBLICA) && !url.includes('/sitio/') && /\.(webp|jpg)$/.test(url));
}

export function urlMiniatura(url) {
  return esFotoPropia(url) ? url.replace(/\.(webp|jpg)$/, `-${LADO_MINIATURA}.$1`) : url;
}

export function rutaMiniatura(path) {
  return path ? path.replace(/\.(webp|jpg)$/, `-${LADO_MINIATURA}.$1`) : null;
}
