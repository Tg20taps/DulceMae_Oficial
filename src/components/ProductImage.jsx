import React, { useState } from 'react';
import { CakeSlice } from 'lucide-react';
import OptimizedImage from './OptimizedImage';

// Foto del producto o, mientras no haya (o si no carga), un fondo de marca con
// el nombre: el catálogo se ve ordenado aunque las fotos lleguen después.
export default function ProductImage({ product, className = '', sizes, loading = 'lazy', fetchpriority }) {
  const [failedSrc, setFailedSrc] = useState(null);

  if (product.image && failedSrc !== product.image) {
    return (
      <OptimizedImage
        src={product.image}
        alt={product.name}
        sizes={sizes}
        loading={loading}
        fetchpriority={fetchpriority}
        onError={() => setFailedSrc(product.image)}
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={product.name}
      className={`flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#fde7f1] via-[#fff5f7] to-[#fbcfe8] p-3 text-center ${className}`}
    >
      <CakeSlice className="h-8 w-8 text-[#be185d]/45" strokeWidth={1.5} />
      <span className="line-clamp-2 font-serif text-sm font-bold leading-tight text-[#be185d]/60">{product.name}</span>
    </div>
  );
}
