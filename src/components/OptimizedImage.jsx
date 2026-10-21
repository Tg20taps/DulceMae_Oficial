import React, { forwardRef } from 'react';
import { esFotoPropia, LADO_FOTO, LADO_MINIATURA, urlMiniatura } from '../lib/imagenes';

const WIDTHS = [360, 520, 760, 1040, 1400];

// Las fotos subidas desde el admin vienen en dos tamaños: el celular baja la
// chica y el computador la grande.
function sources(src) {
  if (esFotoPropia(src)) {
    return {
      srcSet: `${urlMiniatura(src)} ${LADO_MINIATURA}w, ${src} ${LADO_FOTO}w`,
      fallback: src,
    };
  }
  return {
    srcSet: WIDTHS.map(width => `${imageUrl(src, width)} ${width}w`).join(', '),
    fallback: imageUrl(src, 760),
  };
}

function imageUrl(src, width) {
  try {
    const url = new URL(src);
    if (url.hostname.includes('images.unsplash.com')) {
      url.searchParams.set('auto', 'format');
      url.searchParams.set('fit', 'crop');
      url.searchParams.set('q', '82');
      url.searchParams.set('w', String(width));
      return url.toString();
    }
  } catch {
    return src;
  }
  return src;
}

const OptimizedImage = forwardRef(function OptimizedImage(
  {
    src,
    alt,
    sizes = '(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw',
    loading = 'lazy',
    className = '',
    fetchPriority,
    fetchpriority,
    ...props
  },
  ref
) {
  const { srcSet, fallback } = sources(src);
  const priority = fetchpriority ?? fetchPriority;

  return (
    <img
      ref={ref}
      src={fallback}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      loading={loading}
      decoding="async"
      // React 18 no reconoce fetchPriority; en minúscula llega tal cual al HTML.
      // eslint-disable-next-line react/no-unknown-property
      fetchpriority={priority}
      className={className}
      {...props}
    />
  );
});

export default OptimizedImage;
