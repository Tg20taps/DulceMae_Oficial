import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchCatalog } from '../lib/catalog';

const CatalogContext = createContext(null);

export const useCatalog = () => useContext(CatalogContext);

// Carga una sola vez productos, zonas de delivery y fotos de la página; los
// comparten portada, catálogo, "Sobre nosotros" y carro.
export function CatalogProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', products: [], zones: [], sitePhotos: [] });

  const load = useCallback(async () => {
    setState(prev => ({ ...prev, status: 'loading' }));
    try {
      const { products, zones, sitePhotos, configured } = await fetchCatalog();
      setState({ status: configured ? 'ready' : 'unconfigured', products, zones, sitePhotos });
    } catch {
      setState(prev => ({ ...prev, status: 'error' }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const value = useMemo(() => {
    const categories = [];
    for (const product of state.products) {
      if (!categories.includes(product.category)) categories.push(product.category);
    }
    return { ...state, categories, reload: load };
  }, [state, load]);

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}
