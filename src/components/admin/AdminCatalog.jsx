import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Camera, ImageOff, Plus, RefreshCw, Store, Trash2 } from 'lucide-react';
import { adminRest, adminRpc, deleteProductImage, uploadProductImage } from '../../lib/adminApi';
import { comprimirFoto } from '../../lib/imagenes';
import {
  ConfirmDialog,
  EmptyState,
  MoneyField,
  PrimaryButton,
  SecondaryButton,
  SectionTitle,
  Sheet,
  Switch,
  TextField,
} from './AdminUi';
import { formatCLP } from './adminData';

const DEFAULT_CATEGORIES = ['Tortas', 'Kuchen', 'Alfajores', 'Postres', 'Galletas', 'Panadería', 'Navidad'];

const PRODUCT_SELECT = [
  'id', 'name', 'category', 'description', 'price_clp', 'image_url', 'image_path',
  'is_visible', 'is_available', 'is_featured', 'suggest_in_cart', 'sort_order',
  'product_options(id,label,price_clp,sort_order)',
].join(',');

const FILTERS = [
  { value: 'all', label: 'Todos', test: () => true },
  { value: 'visible', label: 'En la página', test: p => p.visible },
  { value: 'hidden', label: 'Ocultos', test: p => !p.visible },
  { value: 'soldout', label: 'Agotados', test: p => !p.available },
];

function fromRow(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description ?? '',
    price: row.price_clp,
    imageUrl: row.image_url,
    imagePath: row.image_path,
    visible: row.is_visible,
    available: row.is_available,
    featured: row.is_featured,
    suggest: row.suggest_in_cart,
    sortOrder: row.sort_order,
    options: (row.product_options ?? [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(option => ({ key: option.id, label: option.label, price: option.price_clp })),
  };
}

let optionKeySeed = 0;
const newOptionKey = () => `nuevo-${Date.now()}-${optionKeySeed++}`;

function newDraft() {
  return {
    id: null,
    name: '',
    category: '',
    description: '',
    priceMode: 'single',
    price: '',
    options: [
      { key: newOptionKey(), label: '', price: '' },
      { key: newOptionKey(), label: '', price: '' },
    ],
    visible: true,
    available: true,
    featured: false,
    suggest: false,
    imageUrl: null,
    imagePath: null,
    newPhoto: null,
    removePhoto: false,
  };
}

function draftFrom(product) {
  return {
    ...newDraft(),
    ...product,
    priceMode: product.options.length ? 'sizes' : 'single',
    price: product.options.length ? '' : product.price,
    options: product.options.length ? product.options : newDraft().options,
  };
}

function priceSummary(product) {
  if (!product.options.length) return formatCLP(product.price);
  if (product.options.length === 1) return `${product.options[0].label} · ${formatCLP(product.price)}`;
  return `${product.options.length} tamaños · desde ${formatCLP(product.price)}`;
}

function validateDraft(draft) {
  if (draft.name.trim().length < 2) return 'Escribe el nombre del producto.';
  if (draft.priceMode === 'single') {
    if (!(Number(draft.price) > 0)) return 'Escribe el precio.';
    return '';
  }
  const filled = draft.options.filter(o => o.label.trim() || o.price !== '');
  if (!filled.length) return 'Agrega al menos un tamaño con su precio.';
  if (filled.some(o => !o.label.trim())) return 'A un tamaño le falta el nombre (ej. "15 personas").';
  if (filled.some(o => !(Number(o.price) > 0))) return 'A un tamaño le falta el precio.';
  return '';
}

function Thumbnail({ url, name, className = 'h-16 w-16' }) {
  const [failedUrl, setFailedUrl] = useState(null);
  return url && failedUrl !== url ? (
    <img src={url} alt={name} loading="lazy" onError={() => setFailedUrl(url)} className={`${className} shrink-0 rounded-2xl object-cover`} />
  ) : (
    <span className={`${className} flex shrink-0 items-center justify-center rounded-2xl bg-[#fde7f1]`}>
      <ImageOff className="h-5 w-5 text-[#be185d]/40" />
    </span>
  );
}

function StateChip({ on, onLabel, offLabel, onClick, busy, offTone = 'gray' }) {
  const offClass = offTone === 'amber'
    ? 'border-amber-200 bg-amber-50 text-amber-800'
    : 'border-[#3f2128]/12 bg-[#3f2128]/5 text-[#3f2128]/60';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={`min-h-[44px] flex-1 rounded-2xl border px-3 text-sm font-bold transition disabled:opacity-50 ${
        on ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : offClass
      }`}
    >
      {on ? onLabel : offLabel}
    </button>
  );
}

function ProductRow({ product, onEdit, onToggle, onMove, busy, isFirst, isLast }) {
  return (
    <li className="rounded-[1.6rem] border border-[#efc6d8] bg-white p-3 shadow-[0_10px_28px_rgba(63,33,40,0.06)]">
      <div className="flex gap-3">
        <button type="button" onClick={() => onEdit(product)} className="flex min-w-0 flex-1 gap-3 text-left">
          <Thumbnail url={product.imageUrl} name={product.name} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-base font-bold text-[#3f2128]">{product.name}</span>
            <span className="block text-xs font-semibold text-[#be185d]/70">{product.category}</span>
            <span className="mt-0.5 block text-sm font-semibold text-[#3f2128]/70">{priceSummary(product)}</span>
            {product.featured && (
              <span className="mt-1 inline-block rounded-full bg-[#be185d]/10 px-2 py-0.5 text-[11px] font-bold text-[#be185d]">En portada</span>
            )}
          </span>
        </button>
        <span className="flex shrink-0 flex-col gap-1">
          <button
            type="button"
            onClick={() => onMove(product, -1)}
            disabled={busy || isFirst}
            aria-label={`Subir ${product.name}`}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#efc6d8] text-[#3f2128]/60 disabled:opacity-25"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onMove(product, 1)}
            disabled={busy || isLast}
            aria-label={`Bajar ${product.name}`}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#efc6d8] text-[#3f2128]/60 disabled:opacity-25"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
        </span>
      </div>
      <div className="mt-3 flex gap-2">
        <StateChip
          on={product.visible}
          onLabel="Se ve en la página"
          offLabel="Oculto · tocar para mostrar"
          onClick={() => onToggle(product, 'visible')}
          busy={busy}
        />
        <StateChip
          on={product.available}
          onLabel="Hay"
          offLabel="Agotado"
          offTone="amber"
          onClick={() => onToggle(product, 'available')}
          busy={busy}
        />
      </div>
    </li>
  );
}

function ProductEditor({ initial, categories, onClose, onSave, onDelete, saving }) {
  const [draft, setDraft] = useState(initial);
  const [error, setError] = useState('');
  const [preparingPhoto, setPreparingPhoto] = useState(false);
  const [customCategory, setCustomCategory] = useState(
    Boolean(initial.category) && !categories.includes(initial.category)
  );
  const fileRef = useRef(null);
  const isNew = !initial.id;

  const photoUrl = draft.newPhoto?.previewUrl ?? (draft.removePhoto ? null : draft.imageUrl);

  useEffect(() => () => {
    if (draft.newPhoto?.previewUrl) URL.revokeObjectURL(draft.newPhoto.previewUrl);
  }, [draft.newPhoto]);

  const update = (field, value) => {
    setDraft(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const updateOption = (key, field, value) => {
    setDraft(prev => ({
      ...prev,
      options: prev.options.map(option => option.key === key ? { ...option, [field]: value } : option),
    }));
    setError('');
  };

  async function handleFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setPreparingPhoto(true);
    setError('');
    try {
      const photo = await comprimirFoto(file);
      setDraft(prev => ({ ...prev, newPhoto: photo, removePhoto: false }));
    } catch (photoError) {
      setError(photoError.message);
    }
    setPreparingPhoto(false);
  }

  function handleSave() {
    const problem = validateDraft(draft);
    if (problem) {
      setError(problem);
      return;
    }
    onSave(draft);
  }

  const categoryChoices = [...new Set([...categories, ...DEFAULT_CATEGORIES])];

  return (
    <Sheet
      title={isNew ? 'Nuevo producto' : 'Editar producto'}
      onClose={saving ? () => {} : onClose}
      footer={(
        <div className="space-y-2">
          {error && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-2 text-sm font-bold text-red-600">{error}</p>}
          <PrimaryButton onClick={handleSave} disabled={saving || preparingPhoto} className="w-full">
            {saving ? <RefreshCw className="h-5 w-5 animate-spin" /> : null}
            {saving ? 'Guardando...' : 'Guardar'}
          </PrimaryButton>
        </div>
      )}
    >
      <div className="space-y-6">
        <section>
          <p className="mb-2 text-sm font-bold text-[#3f2128]/75">Foto</p>
          <div className="flex items-center gap-4">
            <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-3xl border border-[#efc6d8] bg-[#fde7f1]">
              {photoUrl ? (
                <img src={photoUrl} alt="Foto del producto" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full flex-col items-center justify-center gap-1 text-center text-xs font-bold text-[#be185d]/50">
                  <ImageOff className="h-6 w-6" />
                  Sin foto
                </span>
              )}
              {preparingPhoto && (
                <span className="absolute inset-0 flex items-center justify-center bg-white/70">
                  <RefreshCw className="h-6 w-6 animate-spin text-[#be185d]" />
                </span>
              )}
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
              <SecondaryButton onClick={() => fileRef.current?.click()} disabled={preparingPhoto}>
                <Camera className="h-5 w-5 text-[#be185d]" />
                {photoUrl ? 'Cambiar foto' : 'Tomar o elegir foto'}
              </SecondaryButton>
              {photoUrl && (
                <button
                  type="button"
                  onClick={() => setDraft(prev => ({ ...prev, newPhoto: null, removePhoto: true }))}
                  className="min-h-[44px] rounded-2xl text-sm font-bold text-[#3f2128]/55"
                >
                  Quitar foto
                </button>
              )}
              <p className="text-xs font-medium leading-snug text-[#3f2128]/50">
                Puedes guardar sin foto y agregarla después. Se achica sola para que la página cargue rápido.
              </p>
            </div>
          </div>
        </section>

        <TextField
          label="Nombre"
          value={draft.name}
          maxLength={80}
          placeholder="Ej. Torta tres leches"
          onChange={(event) => update('name', event.target.value)}
        />

        <section>
          <p className="mb-2 text-sm font-bold text-[#3f2128]/75">Categoría</p>
          <div className="flex flex-wrap gap-2">
            {categoryChoices.map(category => {
              const active = !customCategory && draft.category === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => { setCustomCategory(false); update('category', category); }}
                  className={`min-h-[44px] rounded-full border px-4 text-sm font-bold transition ${
                    active ? 'border-[#be185d] bg-[#be185d] text-white' : 'border-[#efc6d8] bg-white text-[#3f2128]'
                  }`}
                >
                  {category}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => { setCustomCategory(true); update('category', ''); }}
              className={`min-h-[44px] rounded-full border px-4 text-sm font-bold ${
                customCategory ? 'border-[#be185d] bg-[#be185d] text-white' : 'border-dashed border-[#be185d]/50 text-[#be185d]'
              }`}
            >
              Otra...
            </button>
          </div>
          {customCategory && (
            <TextField
              className="mt-3"
              label="Nombre de la categoría"
              value={draft.category}
              maxLength={40}
              placeholder="Ej. Tortas frías"
              onChange={(event) => update('category', event.target.value)}
            />
          )}
        </section>

        <section>
          <p className="mb-2 text-sm font-bold text-[#3f2128]/75">Precio</p>
          <div className="mb-3 grid grid-cols-2 gap-2 rounded-2xl bg-[#3f2128]/5 p-1">
            {[
              { value: 'single', label: 'Un solo precio' },
              { value: 'sizes', label: 'Varios tamaños' },
            ].map(mode => (
              <button
                key={mode.value}
                type="button"
                onClick={() => update('priceMode', mode.value)}
                className={`min-h-[44px] rounded-xl text-sm font-bold transition ${
                  draft.priceMode === mode.value ? 'bg-white text-[#3f2128] shadow' : 'text-[#3f2128]/55'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {draft.priceMode === 'single' ? (
            <MoneyField value={draft.price} onChange={(value) => update('price', value)} placeholder="25.000" />
          ) : (
            <div className="space-y-2">
              {draft.options.map((option, index) => (
                <div key={option.key} className="grid grid-cols-[minmax(0,1fr)_8.5rem_auto] items-center gap-2">
                  <input
                    value={option.label}
                    maxLength={60}
                    placeholder={index === 0 ? 'Ej. 15 personas' : 'Ej. 25 personas'}
                    onChange={(event) => updateOption(option.key, 'label', event.target.value)}
                    aria-label={`Tamaño ${index + 1}`}
                    className="min-h-[52px] w-full min-w-0 rounded-2xl border border-[#efc6d8] bg-[#fff7fb] px-3 text-base font-semibold text-[#3f2128] outline-none focus:border-[#be185d]/50"
                  />
                  <MoneyField value={option.price} onChange={(value) => updateOption(option.key, 'price', value)} />
                  <button
                    type="button"
                    onClick={() => update('options', draft.options.filter(o => o.key !== option.key))}
                    disabled={draft.options.length <= 1}
                    aria-label={`Quitar tamaño ${index + 1}`}
                    className="flex h-12 w-10 items-center justify-center rounded-xl text-[#3f2128]/40 disabled:opacity-20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <SecondaryButton
                onClick={() => update('options', [...draft.options, { key: newOptionKey(), label: '', price: '' }])}
                disabled={draft.options.length >= 12}
                className="w-full"
              >
                <Plus className="h-4 w-4" />
                Agregar tamaño
              </SecondaryButton>
            </div>
          )}
        </section>

        <TextField
          label="Descripción (opcional)"
          hint={`${draft.description.length}/400 · Qué lleva, para cuántos alcanza, si es sin azúcar...`}
          multiline
          rows={3}
          maxLength={400}
          value={draft.description}
          onChange={(event) => update('description', event.target.value)}
        />

        <section className="space-y-2">
          <Switch
            checked={draft.visible}
            onChange={(value) => update('visible', value)}
            label="Mostrar en la página"
            detail="Si lo apagas, el producto queda guardado pero los clientes no lo ven."
          />
          <Switch
            checked={draft.available}
            onChange={(value) => update('available', value)}
            label="Hay disponible"
            detail="Apágalo cuando se acabe: se verá como Agotado y no se podrá pedir."
          />
          <Switch
            checked={draft.featured}
            onChange={(value) => update('featured', value)}
            label="Mostrar en la portada"
            detail="Aparece en las fotos grandes del inicio. Necesita foto."
          />
          <Switch
            checked={draft.suggest}
            onChange={(value) => update('suggest', value)}
            label="Sugerir en el carro"
            detail="Se ofrece como extra al pagar (ej. velas, caja de regalo)."
          />
        </section>

        {!isNew && (
          <button
            type="button"
            onClick={() => onDelete(initial)}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-red-100 bg-white text-sm font-bold text-red-500"
          >
            <Trash2 className="h-4 w-4" />
            Eliminar producto
          </button>
        )}
      </div>
    </Sheet>
  );
}

export default function AdminCatalog({ session, showNotice }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    const params = new URLSearchParams({ select: PRODUCT_SELECT, order: 'sort_order.asc,name.asc' });
    const { data, error } = await adminRest(session, `products?${params}`);
    if (error) setLoadError(error);
    else setProducts((data ?? []).map(fromRow));
    setLoading(false);
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  const categories = useMemo(() => [...new Set(products.map(p => p.category))], [products]);
  const counts = useMemo(
    () => Object.fromEntries(FILTERS.map(f => [f.value, products.filter(f.test).length])),
    [products]
  );
  const currentFilter = FILTERS.find(f => f.value === filter) ?? FILTERS[0];
  const shown = products.filter(currentFilter.test);
  const hiddenExamples = products.filter(p => !p.visible && p.imageUrl?.includes('images.unsplash.com')).length;

  async function handleToggle(product, field) {
    const column = field === 'visible' ? 'is_visible' : 'is_available';
    const next = !product[field];
    setBusyId(product.id);
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, [field]: next } : p));
    const { error } = await adminRest(session, `products?id=eq.${product.id}`, {
      method: 'PATCH',
      body: { [column]: next },
      prefer: 'return=minimal',
    });
    if (error) {
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, [field]: !next } : p));
      showNotice(`No se pudo cambiar: ${error}`, 'error');
    } else if (field === 'visible') {
      showNotice(next ? `"${product.name}" ya se ve en la página.` : `"${product.name}" quedó oculto.`);
    } else {
      showNotice(next ? `"${product.name}" está disponible.` : `"${product.name}" quedó como Agotado.`);
    }
    setBusyId(null);
  }

  async function handleMove(product, direction) {
    const index = products.findIndex(p => p.id === product.id);
    const neighbor = products[index + direction];
    if (!neighbor) return;

    // Se renumera todo el bloque: así el orden queda bien aunque hubiera empates.
    const reordered = products.slice();
    reordered[index] = neighbor;
    reordered[index + direction] = product;
    const withOrder = reordered.map((p, i) => ({ ...p, sortOrder: i + 1 }));
    const changed = withOrder.filter(p => p.sortOrder !== products.find(o => o.id === p.id).sortOrder);

    setBusyId(product.id);
    setProducts(withOrder);
    const results = await Promise.all(changed.map(p => adminRest(session, `products?id=eq.${p.id}`, {
      method: 'PATCH',
      body: { sort_order: p.sortOrder },
      prefer: 'return=minimal',
    })));
    const failed = results.find(r => r.error);
    if (failed) {
      showNotice(`No se pudo ordenar: ${failed.error}`, 'error');
      await load();
    }
    setBusyId(null);
  }

  async function handleSave(draft) {
    setSaving(true);
    const original = products.find(p => p.id === draft.id);
    let imageUrl = draft.removePhoto ? null : draft.imageUrl;
    let imagePath = draft.removePhoto ? null : draft.imagePath;
    let uploaded = null;

    if (draft.newPhoto) {
      const { data, error } = await uploadProductImage(session, draft.newPhoto.blob, draft.newPhoto.extension);
      if (error) {
        showNotice(`No se pudo subir la foto: ${error}`, 'error');
        setSaving(false);
        return;
      }
      uploaded = data;
      imageUrl = data.url;
      imagePath = data.path;
    }

    const sizes = draft.priceMode === 'sizes'
      ? draft.options
          .filter(o => o.label.trim() && Number(o.price) > 0)
          .map(o => ({ label: o.label.trim(), price_clp: Number(o.price) }))
      : [];

    const { error } = await adminRpc(session, 'save_product', {
      p_product: {
        id: draft.id,
        name: draft.name.trim(),
        category: draft.category.trim() || 'Otros',
        description: draft.description.trim(),
        price_clp: draft.priceMode === 'single' ? Number(draft.price) : null,
        options: sizes,
        image_url: imageUrl,
        image_path: imagePath,
        is_visible: draft.visible,
        is_available: draft.available,
        is_featured: draft.featured,
        suggest_in_cart: draft.suggest,
      },
    });

    if (error) {
      if (uploaded) deleteProductImage(session, uploaded.path);
      showNotice(`No se pudo guardar: ${error}`, 'error');
      setSaving(false);
      return;
    }

    if (original?.imagePath && original.imagePath !== imagePath) {
      deleteProductImage(session, original.imagePath);
    }

    setSaving(false);
    setEditing(null);
    showNotice(draft.visible ? 'Guardado. Ya se ve en la página.' : 'Guardado (oculto: los clientes todavía no lo ven).');
    await load();
  }

  async function handleDelete() {
    if (!toDelete) return;
    setDeleting(true);
    const { error } = await adminRest(session, `products?id=eq.${toDelete.id}`, {
      method: 'DELETE',
      prefer: 'return=minimal',
    });
    setDeleting(false);
    if (error) {
      showNotice(`No se pudo eliminar: ${error}`, 'error');
      return;
    }
    if (toDelete.imagePath) deleteProductImage(session, toDelete.imagePath);
    showNotice(`"${toDelete.name}" se eliminó.`);
    setToDelete(null);
    setEditing(null);
    await load();
  }

  return (
    <section>
      <SectionTitle
        title="Tu catálogo"
        subtitle="Lo que agregues aquí aparece en la página. Toca un producto para cambiar su foto, precio o tamaños."
        action={(
          <PrimaryButton onClick={() => setEditing(newDraft())} className="w-full sm:w-auto">
            <Plus className="h-5 w-5" strokeWidth={3} />
            Agregar producto
          </PrimaryButton>
        )}
      />

      {hiddenExamples > 0 && (
        <div className="mb-4 rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-900">
          Hay {hiddenExamples} {hiddenExamples === 1 ? 'producto de ejemplo oculto' : 'productos de ejemplo ocultos'}.
          Edítalos con tus productos reales (nombre, precio y foto) y tócalos para mostrarlos, o bórralos si no te sirven.
        </div>
      )}

      {products.length > 0 && (
        <div className="-mx-4 mb-4 overflow-x-auto px-4 pb-1">
          <div className="flex w-max gap-2">
            {FILTERS.map(f => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                className={`min-h-[44px] whitespace-nowrap rounded-full border px-4 text-sm font-bold ${
                  filter === f.value ? 'border-[#3f2128] bg-[#3f2128] text-white' : 'border-[#efc6d8] bg-white text-[#3f2128]'
                }`}
              >
                {f.label} ({counts[f.value]})
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && !products.length ? (
        <div className="flex justify-center py-16"><RefreshCw className="h-7 w-7 animate-spin text-[#be185d]" /></div>
      ) : loadError ? (
        <EmptyState Icon={Store} title="No se pudo cargar el catálogo" detail={loadError}>
          <SecondaryButton onClick={load}><RefreshCw className="h-4 w-4" /> Reintentar</SecondaryButton>
        </EmptyState>
      ) : !products.length ? (
        <EmptyState
          Icon={Store}
          title="Todavía no hay productos"
          detail="Agrega tu primer producto con su nombre y precio. La foto la puedes poner después."
        >
          <PrimaryButton onClick={() => setEditing(newDraft())}>
            <Plus className="h-5 w-5" strokeWidth={3} />
            Agregar el primero
          </PrimaryButton>
        </EmptyState>
      ) : !shown.length ? (
        <EmptyState title="Nada por aquí" detail="No hay productos en este filtro." />
      ) : (
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {shown.map(product => {
            const index = products.findIndex(p => p.id === product.id);
            return (
              <ProductRow
                key={product.id}
                product={product}
                onEdit={(p) => setEditing(draftFrom(p))}
                onToggle={handleToggle}
                onMove={handleMove}
                busy={busyId === product.id}
                isFirst={index === 0}
                isLast={index === products.length - 1}
              />
            );
          })}
        </ul>
      )}

      {editing && (
        <ProductEditor
          initial={editing}
          categories={categories}
          saving={saving}
          onClose={() => setEditing(null)}
          onSave={handleSave}
          onDelete={setToDelete}
        />
      )}

      {toDelete && (
        <ConfirmDialog
          title={`¿Eliminar "${toDelete.name}"?`}
          detail="No se puede deshacer. Si sólo no quieres que se vea por un tiempo, mejor apaga “Mostrar en la página”."
          confirmLabel="Sí, eliminar"
          busy={deleting}
          onCancel={() => setToDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </section>
  );
}
