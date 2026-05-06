import React, { forwardRef } from 'react';

const WIDTHS = [360, 520, 760, 1040, 1400];

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
    ...props
  },
  ref
) {
  const srcSet = WIDTHS.map(width => `${imageUrl(src, width)} ${width}w`).join(', ');
  const fallback = imageUrl(src, 760);

  return (
    <img
      ref={ref}
      src={fallback}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      loading={loading}
      decoding="async"
      className={className}
      {...props}
    />
  );
});

export default OptimizedImage;
