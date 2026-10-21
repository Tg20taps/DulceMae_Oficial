// Achica y comprime la foto en el mismo celular antes de subirla: una foto de
// 4 MB queda en unos 150 KB y la página carga rápido aunque la señal sea mala.

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('No se pudo leer la foto. Prueba con otra.'));
    image.src = url;
  });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise(resolve => canvas.toBlob(resolve, type, quality));
}

export async function comprimirFoto(file, { ladoMaximo = 1400, calidad = 0.82 } = {}) {
  if (!file || !file.type.startsWith('image/')) {
    throw new Error('Eso no es una foto. Elige una imagen.');
  }

  const url = URL.createObjectURL(file);
  try {
    // El navegador ya endereza la foto según cómo se tomó con el celular.
    const image = await loadImage(url);
    const escala = Math.min(1, ladoMaximo / Math.max(image.naturalWidth, image.naturalHeight));
    const ancho = Math.round(image.naturalWidth * escala);
    const alto = Math.round(image.naturalHeight * escala);

    const canvas = document.createElement('canvas');
    canvas.width = ancho;
    canvas.height = alto;
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, ancho, alto);
    context.drawImage(image, 0, 0, ancho, alto);

    // Safari antiguo no sabe generar WebP: en ese caso, JPEG.
    let blob = await canvasToBlob(canvas, 'image/webp', calidad);
    if (!blob || blob.type !== 'image/webp') blob = await canvasToBlob(canvas, 'image/jpeg', 0.85);
    if (!blob) throw new Error('No se pudo preparar la foto. Prueba con otra.');

    return {
      blob,
      extension: blob.type === 'image/webp' ? 'webp' : 'jpg',
      previewUrl: URL.createObjectURL(blob),
      ancho,
      alto,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}
