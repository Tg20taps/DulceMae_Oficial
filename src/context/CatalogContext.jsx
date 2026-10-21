import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchCatalog } from '../lib/catalog';

const CatalogContext = createContext(null);

export const useCatalog = () => useContext(CatalogContext);

// Carga una sola vez productos y zonas de delivery; los comparten portada,
// catálogo y carro.
export function CatalogProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', products: [], zones: [] });

  const load = useCallback(async () => {
    setState(prev => ({ ...prev, status: 'loading' }));
    try {
      const { products, zones, configured } = await fetchCatalog();
      setState({ status: configured ? 'ready' : 'unconfigured', products, zones });
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
