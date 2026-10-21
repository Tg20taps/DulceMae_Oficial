import { buildSupabaseRestUrl, isSupabaseConfigured, supabaseAnonKey } from './supabaseConfig';

const PRODUCT_FIELDS = [
  'id',
  'name',
  'category',
  'description',
  'price_clp',
  'image_url',
  'is_available',
  'is_featured',
  'suggest_in_cart',
  'sort_order',
  'product_options(id,label,price_clp,sort_order)',
].join(',');

export function normalizeProduct(row) {
  const options = (row.product_options ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(option => ({ id: option.id, label: option.label, price: option.price_clp }));

  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description ?? '',
    price: options.length ? Math.min(...options.map(option => option.price)) : row.price_clp,
    image: row.image_url || null,
    available: row.is_available !== false,
    featured: Boolean(row.is_featured),
    suggestInCart: Boolean(row.suggest_in_cart),
    options,
  };
}

export function normalizeZone(row) {
  return {
    value: row.id,
    label: row.label,
    note: row.note ?? '',
    fee: row.fee_clp,
    feeKnown: row.fee_known,
  };
}

async function getJson(path) {
  const response = await fetch(buildSupabaseRestUrl(path), {
    headers: { apikey: supabaseAnonKey },
  });
  if (!response.ok) throw new Error(`Error ${response.status}`);
  return response.json();
}

export async function fetchCatalog() {
  if (!isSupabaseConfigured) {
    return { products: [], zones: [], configured: false };
  }

  const productParams = new URLSearchParams({
    select: PRODUCT_FIELDS,
    is_visible: 'eq.true',
    order: 'sort_order.asc,name.asc',
  });
  const zoneParams = new URLSearchParams({
    select: 'id,label,note,fee_clp,fee_known,sort_order',
    is_active: 'eq.true',
    order: 'sort_order.asc',
  });

  const [products, zones] = await Promise.all([
    getJson(`products?${productParams}`),
    getJson(`delivery_zones?${zoneParams}`),
  ]);

  return {
    products: products.map(normalizeProduct),
    zones: zones.map(normalizeZone),
    configured: true,
  };
}
