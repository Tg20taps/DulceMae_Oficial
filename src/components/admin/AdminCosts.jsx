import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Calculator,
  ClipboardCopy,
  Copy,
  Plus,
  RefreshCw,
  ShoppingBasket,
  Trash2,
  Wheat,
} from 'lucide-react';
import { adminRest, adminRpc } from '../../lib/adminApi';
import { NEGOCIO } from '../../config/negocio';
import {
  ConfirmDialog,
  EmptyState,
  MoneyField,
  NumberField,
  PrimaryButton,
  SecondaryButton,
  SectionTitle,
  Sheet,
  TextField,
} from './AdminUi';
import { formatCLP } from './adminData';
import {
  AJUSTES_POR_DEFECTO,
  calcularReceta,
  costoDeLinea,
  describirCompra,
  INGREDIENTES_COMUNES,
  precioPorUnidadBase,
  textoListaDeCompras,
  unidadBase,
  UNIDADES,
} from './costos';

const VIEWS = [
  { value: 'recetas', label: 'Recetas' },
  { value: 'ingredientes', label: 'Ingredientes' },
  { value: 'compras', label: 'Lista de compras' },
];

const STOCK_LEVELS = [
  { value: 'ok', label: 'Hay', className: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
  { value: 'low', label: 'Queda poco', className: 'border-amber-200 bg-amber-50 text-amber-800' },
  { value: 'out', label: 'Se acabó', className: 'border-red-200 bg-red-50 text-red-700' },
];

const VERDICT_STYLES = {
  rojo: 'border-red-200 bg-red-50 text-red-700',
  naranjo: 'border-orange-200 bg-orange-50 text-orange-800',
  amarillo: 'border-amber-200 bg-amber-50 text-amber-800',
  verde: 'border-emerald-200 bg-emerald-50 text-emerald-800',
};

const QUICK_EXTRAS = ['Caja y base', 'Decoración', 'Gas y luz', 'Velas'];
// Claves de la calculadora y el stock antiguos, que guardaban todo en el navegador.
const LEGACY_COSTS_KEY = 'dulcemae_saved_cost_calculations_v1';
const LEGACY_STOCK_KEY = 'dulcemae_stock_items_v1';
const LEGACY_IMPORT_FLAG = 'dulcemae_costos_pasados_a_supabase_v1';

let lineSeed = 0;
const newLineKey = () => `l-${Date.now()}-${lineSeed++}`;

function readLegacyData() {
  try {
    if (localStorage.getItem(LEGACY_IMPORT_FLAG)) return null;
    const drafts = JSON.parse(localStorage.getItem(LEGACY_COSTS_KEY) || 'null');
    const stock = JSON.parse(localStorage.getItem(LEGACY_STOCK_KEY) || 'null');
    const recipes = Array.isArray(drafts)
      ? drafts.filter(d => d && typeof d === 'object').map(d => ({
          productName: String(d.productName || 'Receta sin nombre').trim() || 'Receta sin nombre',
          servings: Number(d.servings) || 1,
          salePrice: Number(d.salePrice) || 0,
          packagingCost: Number(d.packagingCost) || 0,
          decorationCost: Number(d.decorationCost) || 0,
          ingredients: Array.isArray(d.ingredients) ? d.ingredients : [],
        }))
      : [];
    const items = Array.isArray(stock) ? stock.filter(i => i && typeof i === 'object') : [];
    if (!recipes.length && !items.length) return null;
    return { recipes, items };
  } catch {
    return null;
  }
}

function markLegacyImported() {
  try {
    localStorage.setItem(LEGACY_IMPORT_FLAG, new Date().toISOString());
  } catch {
    // Si no se puede guardar la marca, el aviso vuelve a salir; no rompe nada.
  }
}

function minutesLabel(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
}

// ── Ingredientes ─────────────────────────────────────────────────────────

function newIngredientDraft(name = '') {
  return { id: null, name, unit: 'kg', pack_amount: '1', pack_price_clp: '', stock_level: 'ok' };
}

function IngredientEditor({ initial, onClose, onSaved, session, showNotice }) {
  const [draft, setDraft] = useState(initial);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isNew = !initial.id;

  const update = (field, value) => {
    setDraft(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const perBase = precioPorUnidadBase({ ...draft, pack_price_clp: draft.pack_price_clp === '' ? null : draft.pack_price_clp });
  const base = unidadBase(draft.unit);
  const example = perBase === null
    ? null
    : base === 'un'
      ? `Cada unidad te cuesta ${formatCLP(Math.round(perBase))}.`
      : `Cada 100 ${base} te cuestan ${formatCLP(Math.round(perBase * 100))}.`;

  async function save() {
    if (!draft.name.trim()) {
      setError('Escribe el nombre del ingrediente.');
      return;
    }
    if (!(Number(draft.pack_amount) > 0)) {
      setError('Escribe cuánto trae lo que compras (ej. 1 kg).');
      return;
    }
    setSaving(true);
    const body = {
      name: draft.name.trim(),
      unit: draft.unit,
      pack_amount: Number(draft.pack_amount),
      pack_price_clp: draft.pack_price_clp === '' ? null : Number(draft.pack_price_clp),
      stock_level: draft.stock_level,
    };
    const { data, error: saveError } = isNew
      ? await adminRest(session, 'ingredients', { method: 'POST', body, prefer: 'return=representation' })
      : await adminRest(session, `ingredients?id=eq.${draft.id}`, { method: 'PATCH', body, prefer: 'return=representation' });
    setSaving(false);
    if (saveError) {
      setError(saveError);
      return;
    }
    showNotice(isNew ? `"${body.name}" agregado.` : 'Ingrediente guardado.');
    onSaved(Array.isArray(data) ? data[0] : data);
  }

  async function remove() {
    setSaving(true);
    const { error: deleteError } = await adminRest(session, `ingredients?id=eq.${draft.id}`, {
      method: 'DELETE',
      prefer: 'return=minimal',
    });
    setSaving(false);
    setConfirmDelete(false);
    if (deleteError) {
      setError(deleteError);
      return;
    }
    showNotice(`"${draft.name}" se eliminó.`);
    onSaved(null);
  }

  return (
    <Sheet
      title={isNew ? 'Nuevo ingrediente' : 'Editar ingrediente'}
      onClose={saving ? () => {} : onClose}
      footer={(
        <div className="space-y-2">
          {error && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-2 text-sm font-bold text-red-600">{error}</p>}
          <PrimaryButton onClick={save} disabled={saving} className="w-full">
            {saving ? 'Guardando...' : 'Guardar'}
          </PrimaryButton>
        </div>
      )}
    >
      <div className="space-y-6">
        <TextField
          label="Nombre"
          value={draft.name}
          maxLength={60}
          placeholder="Ej. Harina"
          onChange={(event) => update('name', event.target.value)}
        />

        <section>
          <p className="mb-2 text-sm font-bold text-[#3f2128]/75">¿Cómo lo compras?</p>
          <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-2">
            <NumberField decimals value={draft.pack_amount} onChange={(value) => update('pack_amount', value)} />
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(UNIDADES).map(([value, unit]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => update('unit', value)}
                  className={`min-h-[44px] rounded-full border px-3 text-sm font-bold ${
                    draft.unit === value ? 'border-[#be185d] bg-[#be185d] text-white' : 'border-[#efc6d8] bg-white text-[#3f2128]'
                  }`}
                >
                  {unit.nombre}
                </button>
              ))}
            </div>
          </div>
          <p className="mt-1 text-xs font-medium text-[#3f2128]/50">Ej. 1 kg de harina, 30 huevos (unidad), 250 g de mantequilla.</p>
        </section>

        <MoneyField
          label="¿Cuánto pagaste?"
          value={draft.pack_price_clp}
          onChange={(value) => update('pack_price_clp', value)}
          hint={example ?? 'Si no sabes el precio ahora, déjalo vacío y complétalo después.'}
        />

        <section>
          <p className="mb-2 text-sm font-bold text-[#3f2128]/75">¿Cuánto te queda?</p>
          <div className="grid grid-cols-3 gap-2">
            {STOCK_LEVELS.map(level => (
              <button
                key={level.value}
                type="button"
                onClick={() => update('stock_level', level.value)}
                className={`min-h-[48px] rounded-2xl border text-sm font-bold ${
                  draft.stock_level === level.value ? level.className : 'border-[#efc6d8] bg-white text-[#3f2128]/55'
                }`}
              >
                {level.label}
              </button>
            ))}
          </div>
        </section>

        {!isNew && (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-red-100 bg-white text-sm font-bold text-red-500"
          >
            <Trash2 className="h-4 w-4" />
            Eliminar ingrediente
          </button>
        )}
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title={`¿Eliminar "${draft.name}"?`}
          detail="Si lo usas en alguna receta, primero hay que quitarlo de ahí."
          confirmLabel="Sí, eliminar"
          busy={saving}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={remove}
        />
      )}
    </Sheet>
  );
}

function StockChip({ level, onClick, busy }) {
  const current = STOCK_LEVELS.find(l => l.value === level) ?? STOCK_LEVELS[0];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={`min-h-[40px] shrink-0 rounded-full border px-3 text-xs font-bold disabled:opacity-50 ${current.className}`}
    >
      {current.label}
    </button>
  );
}

function IngredientsView({ ingredients, onEdit, onAdd, onCycleLevel, onAddCommon, busyId, addingCommon }) {
  const [query, setQuery] = useState('');
  const shown = ingredients.filter(i => i.name.toLowerCase().includes(query.trim().toLowerCase()));

  if (!ingredients.length) {
    return (
      <EmptyState
        Icon={Wheat}
        title="Anota tus ingredientes"
        detail="Una vez por ingrediente: cómo lo compras y cuánto pagaste. Con eso las recetas calculan solas."
      >
        <PrimaryButton onClick={onAdd}><Plus className="h-5 w-5" strokeWidth={3} /> Agregar ingrediente</PrimaryButton>
        <SecondaryButton onClick={onAddCommon} disabled={addingCommon}>
          {addingCommon ? 'Agregando...' : 'Empezar con los más comunes'}
        </SecondaryButton>
      </EmptyState>
    );
  }

  return (
    <div>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row">
        {ingredients.length > 8 && (
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar ingrediente"
            className="min-h-[52px] flex-1 rounded-2xl border border-[#efc6d8] bg-white px-4 text-base font-semibold text-[#3f2128] outline-none focus:border-[#be185d]/50"
          />
        )}
        <PrimaryButton onClick={onAdd} className="sm:ml-auto">
          <Plus className="h-5 w-5" strokeWidth={3} /> Agregar ingrediente
        </PrimaryButton>
      </div>
      <ul className="grid grid-cols-1 gap-2 lg:grid-cols-2">
        {shown.map(ingredient => (
          <li key={ingredient.id} className="flex items-center gap-3 rounded-2xl border border-[#efc6d8] bg-white p-3">
            <button type="button" onClick={() => onEdit(ingredient)} className="min-w-0 flex-1 text-left">
              <span className="block truncate text-base font-bold text-[#3f2128]">{ingredient.name}</span>
              <span className={`block text-sm font-semibold ${ingredient.pack_price_clp === null ? 'text-amber-700' : 'text-[#3f2128]/60'}`}>
                {describirCompra(ingredient, formatCLP)}
              </span>
            </button>
            <StockChip level={ingredient.stock_level} onClick={() => onCycleLevel(ingredient)} busy={busyId === ingredient.id} />
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs font-medium text-[#3f2128]/50">
        Toca “Hay / Queda poco / Se acabó” para ir armando la lista de compras.
      </p>
    </div>
  );
}

// ── Lista de compras ────────────────────────────────────────────────────

function ShoppingView({ ingredients, onBought, busyId, showNotice }) {
  const pending = ingredients
    .filter(i => i.stock_level !== 'ok')
    .sort((a, b) => (a.stock_level === b.stock_level ? a.name.localeCompare(b.name) : a.stock_level === 'out' ? -1 : 1));
  const text = textoListaDeCompras(ingredients, NEGOCIO.nombre);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      showNotice('Lista copiada. Pégala donde quieras.');
    } catch {
      showNotice('No se pudo copiar. Usa “Enviar por WhatsApp”.', 'error');
    }
  }

  if (!pending.length) {
    return (
      <EmptyState
        Icon={ShoppingBasket}
        title="No falta nada"
        detail="Cuando algo se esté acabando, márcalo en Ingredientes como “Queda poco” o “Se acabó” y aparecerá aquí."
      />
    );
  }

  return (
    <div>
      <ul className="grid grid-cols-1 gap-2">
        {pending.map(ingredient => (
          <li key={ingredient.id} className="flex items-center gap-3 rounded-2xl border border-[#efc6d8] bg-white p-3">
            <span className={`h-3 w-3 shrink-0 rounded-full ${ingredient.stock_level === 'out' ? 'bg-red-500' : 'bg-amber-400'}`} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-base font-bold text-[#3f2128]">{ingredient.name}</span>
              <span className="block text-xs font-semibold text-[#3f2128]/55">
                {ingredient.stock_level === 'out' ? 'Se acabó' : 'Queda poco'}
              </span>
            </span>
            <SecondaryButton onClick={() => onBought(ingredient)} disabled={busyId === ingredient.id}>
              Ya lo compré
            </SecondaryButton>
          </li>
        ))}
      </ul>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <SecondaryButton onClick={copy}><ClipboardCopy className="h-4 w-4" /> Copiar lista</SecondaryButton>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(text)}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-[#16a34a] px-4 text-sm font-bold text-white"
        >
          Enviar por WhatsApp
        </a>
      </div>
    </div>
  );
}

// ── Recetas ─────────────────────────────────────────────────────────────

function newRecipeDraft() {
  return {
    id: null,
    name: '',
    yield_count: '1',
    yield_label: 'porciones',
    hours: '',
    minutes: '',
    sale_price_clp: '',
    ingredientLines: [{ key: newLineKey(), ingredient_id: '', amount: '' }],
    extraLines: [],
  };
}

function recipeDraftFrom(recipe) {
  const items = (recipe.recipe_items ?? []).slice().sort((a, b) => a.sort_order - b.sort_order);
  const minutes = Number(recipe.work_minutes) || 0;
  return {
    id: recipe.id,
    name: recipe.name,
    yield_count: String(recipe.yield_count),
    yield_label: recipe.yield_label,
    hours: minutes >= 60 ? String(Math.floor(minutes / 60)) : '',
    minutes: minutes % 60 ? String(minutes % 60) : '',
    sale_price_clp: recipe.sale_price_clp ?? '',
    ingredientLines: items.filter(i => i.ingredient_id).map(i => ({ key: newLineKey(), ingredient_id: i.ingredient_id, amount: String(Number(i.amount)) })),
    extraLines: items.filter(i => !i.ingredient_id).map(i => ({ key: newLineKey(), label: i.label, cost_clp: i.cost_clp })),
  };
}

function draftToRecipe(draft) {
  return {
    id: draft.id,
    name: draft.name.trim(),
    yield_count: Math.max(1, Number(draft.yield_count) || 1),
    yield_label: draft.yield_label,
    work_minutes: (Number(draft.hours) || 0) * 60 + (Number(draft.minutes) || 0),
    sale_price_clp: draft.sale_price_clp === '' ? null : Number(draft.sale_price_clp),
    items: [
      ...draft.ingredientLines
        .filter(l => l.ingredient_id && Number(l.amount) > 0)
        .map(l => ({ ingredient_id: l.ingredient_id, amount: Number(l.amount) })),
      ...draft.extraLines
        .filter(l => l.label.trim() && l.cost_clp !== '')
        .map(l => ({ label: l.label.trim(), cost_clp: Number(l.cost_clp) })),
    ],
  };
}

function ResultCard({ result, yieldLabel, compact = false }) {
  if (compact) {
    return (
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-[#3f2128]/60">Costo {formatCLP(result.costoTotal)}</span>
        <span className="font-bold text-[#3f2128]">Sugerido <span className="text-lg text-[#be185d]">{formatCLP(result.sugerido)}</span></span>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-[#efc6d8] bg-white">
      <div className="bg-[linear-gradient(135deg,#3f2128_0%,#5b2b35_58%,#9d174d_100%)] p-5 text-white">
        <p className="text-sm font-semibold text-white/70">Precio sugerido</p>
        <p className="font-serif text-4xl font-bold">{formatCLP(result.sugerido)}</p>
        <p className="mt-1 text-sm font-semibold text-white/70">
          {formatCLP(result.sugeridoPorPorcion)} por {yieldLabel === 'unidades' ? 'unidad' : 'porción'}
        </p>
      </div>
      <dl className="divide-y divide-[#f3d7e3] px-5 text-sm">
        <div className="flex justify-between py-2.5"><dt className="text-[#3f2128]/65">Ingredientes</dt><dd className="font-bold">{formatCLP(result.ingredientes)}</dd></div>
        <div className="flex justify-between py-2.5"><dt className="text-[#3f2128]/65">Otros gastos</dt><dd className="font-bold">{formatCLP(result.otros)}</dd></div>
        <div className="flex justify-between py-2.5">
          <dt className="text-[#3f2128]/65">Tu trabajo{result.minutos ? ` (${minutesLabel(result.minutos)})` : ''}</dt>
          <dd className="font-bold">{formatCLP(result.trabajo)}</dd>
        </div>
        <div className="flex justify-between py-2.5"><dt className="font-bold text-[#3f2128]">Te cuesta hacerlo</dt><dd className="font-bold">{formatCLP(result.costoTotal)}</dd></div>
      </dl>
      {result.faltanPrecios.length > 0 && (
        <p className="mx-5 mb-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          Falta el precio de: {result.faltanPrecios.join(', ')}. El costo real es mayor; complétalo en Ingredientes.
        </p>
      )}
      {result.veredicto && (
        <div className={`mx-5 mb-5 rounded-2xl border px-4 py-3 ${VERDICT_STYLES[result.veredicto.tono]}`}>
          <p className="text-base font-bold">{result.veredicto.titulo}</p>
          <p className="mt-0.5 text-sm font-semibold">{result.veredicto.detalle}</p>
        </div>
      )}
    </div>
  );
}

function RecipeEditor({ initial, ingredients, ingredientsById, settings, session, showNotice, onClose, onSaved, onIngredientCreated }) {
  const [draft, setDraft] = useState(initial);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [creatingFor, setCreatingFor] = useState(null);
  const isNew = !initial.id;

  const recipe = useMemo(() => draftToRecipe(draft), [draft]);
  const result = useMemo(() => calcularReceta(recipe, ingredientsById, settings), [recipe, ingredientsById, settings]);
  const sortedIngredients = useMemo(() => ingredients.slice().sort((a, b) => a.name.localeCompare(b.name)), [ingredients]);

  const update = (field, value) => {
    setDraft(prev => ({ ...prev, [field]: value }));
    setError('');
  };
  const updateLine = (list, key, field, value) => {
    setDraft(prev => ({ ...prev, [list]: prev[list].map(l => l.key === key ? { ...l, [field]: value } : l) }));
    setError('');
  };
  const removeLine = (list, key) => setDraft(prev => ({ ...prev, [list]: prev[list].filter(l => l.key !== key) }));

  function chooseIngredient(lineKey, value) {
    if (value === '__nuevo__') {
      setCreatingFor(lineKey);
      return;
    }
    updateLine('ingredientLines', lineKey, 'ingredient_id', value);
  }

  async function save() {
    if (recipe.name.length < 2) {
      setError('Escribe el nombre de la receta.');
      return;
    }
    if (draft.ingredientLines.some(l => l.ingredient_id && !(Number(l.amount) > 0))) {
      setError('A un ingrediente le falta la cantidad que usas.');
      return;
    }
    setSaving(true);
    const { error: saveError } = await adminRpc(session, 'save_recipe', { p_recipe: recipe });
    setSaving(false);
    if (saveError) {
      setError(saveError);
      return;
    }
    showNotice(`Receta "${recipe.name}" guardada.`);
    onSaved();
  }

  async function remove() {
    setSaving(true);
    const { error: deleteError } = await adminRest(session, `recipes?id=eq.${draft.id}`, { method: 'DELETE', prefer: 'return=minimal' });
    setSaving(false);
    setConfirmDelete(false);
    if (deleteError) {
      setError(deleteError);
      return;
    }
    showNotice(`Receta "${draft.name}" eliminada.`);
    onSaved();
  }

  function duplicate() {
    setDraft(prev => ({
      ...prev,
      id: null,
      name: `${prev.name} (copia)`,
      ingredientLines: prev.ingredientLines.map(l => ({ ...l, key: newLineKey() })),
      extraLines: prev.extraLines.map(l => ({ ...l, key: newLineKey() })),
    }));
    showNotice('Copia lista: cambia el nombre y las cantidades, y guarda.');
  }

  return (
    <Sheet
      title={draft.id ? 'Editar receta' : 'Nueva receta'}
      onClose={saving ? () => {} : onClose}
      footer={(
        <div className="space-y-2">
          {error && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-2 text-sm font-bold text-red-600">{error}</p>}
          <ResultCard result={result} compact />
          <PrimaryButton onClick={save} disabled={saving} className="w-full">
            {saving ? 'Guardando...' : 'Guardar receta'}
          </PrimaryButton>
        </div>
      )}
    >
      <div className="space-y-7">
        <section className="space-y-3">
          <p className="text-lg font-bold text-[#3f2128]">1. ¿Qué preparas?</p>
          <TextField
            label="Nombre"
            value={draft.name}
            maxLength={80}
            placeholder="Ej. Torta tres leches 15 personas"
            onChange={(event) => update('name', event.target.value)}
          />
          <div className="grid grid-cols-[7rem_minmax(0,1fr)] items-end gap-2">
            <NumberField label="Rinde" value={draft.yield_count} onChange={(value) => update('yield_count', value)} />
            <div className="grid grid-cols-2 gap-1 rounded-2xl bg-[#3f2128]/5 p-1">
              {['porciones', 'unidades'].map(label => (
                <button
                  key={label}
                  type="button"
                  onClick={() => update('yield_label', label)}
                  className={`min-h-[44px] rounded-xl text-sm font-bold ${draft.yield_label === label ? 'bg-white text-[#3f2128] shadow' : 'text-[#3f2128]/55'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div>
            <p className="text-lg font-bold text-[#3f2128]">2. ¿Qué ingredientes usas?</p>
            <p className="text-sm font-medium text-[#3f2128]/55">Elige el ingrediente y cuánto usas en esta receta.</p>
          </div>
          {draft.ingredientLines.map(line => {
            const ingredient = ingredientsById.get(line.ingredient_id);
            const base = ingredient ? unidadBase(ingredient.unit) : '';
            const { costo, faltaPrecio } = costoDeLinea({ ingredient_id: line.ingredient_id, amount: line.amount }, ingredientsById);
            return (
              <div key={line.key} className="rounded-2xl border border-[#efc6d8] bg-white p-3">
                <div className="flex gap-2">
                  <select
                    value={line.ingredient_id}
                    onChange={(event) => chooseIngredient(line.key, event.target.value)}
                    aria-label="Ingrediente"
                    className="min-h-[52px] min-w-0 flex-1 rounded-2xl border border-[#efc6d8] bg-[#fff7fb] px-3 text-base font-semibold text-[#3f2128] outline-none focus:border-[#be185d]/50"
                  >
                    <option value="">Elige un ingrediente</option>
                    {sortedIngredients.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                    <option value="__nuevo__">+ Crear ingrediente nuevo</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => removeLine('ingredientLines', line.key)}
                    aria-label="Quitar ingrediente"
                    className="flex h-[52px] w-11 shrink-0 items-center justify-center rounded-xl text-[#3f2128]/40"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {line.ingredient_id && (
                  <div className="mt-2 flex items-center gap-3">
                    <NumberField
                      className="w-36"
                      decimals
                      value={line.amount}
                      suffix={base}
                      onChange={(value) => updateLine('ingredientLines', line.key, 'amount', value)}
                    />
                    <span className={`text-sm font-bold ${faltaPrecio ? 'text-amber-700' : 'text-[#3f2128]/70'}`}>
                      {faltaPrecio ? 'Falta su precio' : `= ${formatCLP(costo)}`}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
          <SecondaryButton
            className="w-full"
            onClick={() => update('ingredientLines', [...draft.ingredientLines, { key: newLineKey(), ingredient_id: '', amount: '' }])}
          >
            <Plus className="h-4 w-4" /> Agregar ingrediente
          </SecondaryButton>
        </section>

        <section className="space-y-3">
          <div>
            <p className="text-lg font-bold text-[#3f2128]">3. Otros gastos</p>
            <p className="text-sm font-medium text-[#3f2128]/55">Caja, decoración, gas y luz: lo que cuesta pero no es ingrediente.</p>
          </div>
          {draft.extraLines.map(line => (
            <div key={line.key} className="grid grid-cols-[minmax(0,1fr)_8.5rem_auto] items-center gap-2">
              <input
                value={line.label}
                maxLength={80}
                onChange={(event) => updateLine('extraLines', line.key, 'label', event.target.value)}
                aria-label="Detalle del gasto"
                className="min-h-[52px] w-full min-w-0 rounded-2xl border border-[#efc6d8] bg-[#fff7fb] px-3 text-base font-semibold text-[#3f2128] outline-none focus:border-[#be185d]/50"
              />
              <MoneyField value={line.cost_clp} onChange={(value) => updateLine('extraLines', line.key, 'cost_clp', value)} />
              <button
                type="button"
                onClick={() => removeLine('extraLines', line.key)}
                aria-label="Quitar gasto"
                className="flex h-12 w-10 items-center justify-center rounded-xl text-[#3f2128]/40"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            {QUICK_EXTRAS.filter(label => !draft.extraLines.some(l => l.label === label)).map(label => (
              <button
                key={label}
                type="button"
                onClick={() => update('extraLines', [...draft.extraLines, { key: newLineKey(), label, cost_clp: '' }])}
                className="min-h-[44px] rounded-full border border-dashed border-[#be185d]/50 px-4 text-sm font-bold text-[#be185d]"
              >
                + {label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => update('extraLines', [...draft.extraLines, { key: newLineKey(), label: '', cost_clp: '' }])}
              className="min-h-[44px] rounded-full border border-dashed border-[#3f2128]/30 px-4 text-sm font-bold text-[#3f2128]/60"
            >
              + Otro
            </button>
          </div>
        </section>

        <section className="space-y-3">
          <div>
            <p className="text-lg font-bold text-[#3f2128]">4. ¿Cuánto tiempo te toma?</p>
            <p className="text-sm font-medium text-[#3f2128]/55">Todo: preparar, hornear, decorar y limpiar. Tu trabajo también se cobra.</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <NumberField label="Horas" value={draft.hours} suffix="h" onChange={(value) => update('hours', value)} />
            <NumberField label="Minutos" value={draft.minutes} suffix="min" onChange={(value) => update('minutes', value)} />
          </div>
        </section>

        <section className="space-y-3">
          <p className="text-lg font-bold text-[#3f2128]">5. ¿A cuánto lo vendes hoy? <span className="text-sm font-semibold text-[#3f2128]/45">(opcional)</span></p>
          <MoneyField
            value={draft.sale_price_clp}
            onChange={(value) => update('sale_price_clp', value)}
            hint="Si lo anotas, te digo si ese precio te conviene."
          />
        </section>

        <ResultCard result={result} yieldLabel={draft.yield_label} />

        {!isNew && (
          <div className="grid gap-2 sm:grid-cols-2">
            <SecondaryButton onClick={duplicate}><Copy className="h-4 w-4" /> Hacer una copia</SecondaryButton>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-red-100 bg-white text-sm font-bold text-red-500"
            >
              <Trash2 className="h-4 w-4" /> Eliminar receta
            </button>
          </div>
        )}
      </div>

      {creatingFor && (
        <IngredientEditor
          initial={newIngredientDraft()}
          session={session}
          showNotice={showNotice}
          onClose={() => setCreatingFor(null)}
          onSaved={(created) => {
            if (created) {
              onIngredientCreated(created);
              updateLine('ingredientLines', creatingFor, 'ingredient_id', created.id);
            }
            setCreatingFor(null);
          }}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title={`¿Eliminar "${draft.name}"?`}
          detail="La receta se borra. Los ingredientes se quedan."
          confirmLabel="Sí, eliminar"
          busy={saving}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={remove}
        />
      )}
    </Sheet>
  );
}

function SettingsCard({ settings, onSave, saving }) {
  const [hourValue, setHourValue] = useState(settings.valor_hora_clp);
  const [profit, setProfit] = useState(settings.ganancia_pct);
  const changed = hourValue !== settings.valor_hora_clp || profit !== settings.ganancia_pct;

  useEffect(() => {
    setHourValue(settings.valor_hora_clp);
    setProfit(settings.ganancia_pct);
  }, [settings]);

  return (
    <details className="mb-4 rounded-3xl border border-[#efc6d8] bg-white p-4">
      <summary className="cursor-pointer list-none text-sm font-bold text-[#3f2128]">
        Cómo calculo el precio sugerido
        <span className="mt-0.5 block text-xs font-semibold text-[#3f2128]/55">
          Ingredientes + gastos + tu tiempo a {formatCLP(settings.valor_hora_clp)} la hora, y encima {settings.ganancia_pct}% de ganancia. Tocar para cambiar.
        </span>
      </summary>
      <div className="mt-4 space-y-4">
        <MoneyField label="Tu hora de trabajo vale" value={hourValue} onChange={setHourValue} hint="Lo que te pagarías por una hora trabajando en otra parte." />
        <div>
          <p className="mb-2 text-sm font-bold text-[#3f2128]/75">Ganancia para el negocio</p>
          <div className="grid grid-cols-4 gap-2">
            {[20, 30, 40, 50].map(pct => (
              <button
                key={pct}
                type="button"
                onClick={() => setProfit(pct)}
                className={`min-h-[48px] rounded-2xl border text-base font-bold ${profit === pct ? 'border-[#be185d] bg-[#be185d] text-white' : 'border-[#efc6d8] bg-white text-[#3f2128]'}`}
              >
                {pct}%
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs font-medium text-[#3f2128]/50">Para pérdidas, ofertas, días sin pedidos y para crecer.</p>
        </div>
        {changed && (
          <PrimaryButton
            className="w-full"
            disabled={saving || !(Number(hourValue) >= 0)}
            onClick={() => onSave({ valor_hora_clp: Number(hourValue) || 0, ganancia_pct: profit })}
          >
            {saving ? 'Guardando...' : 'Guardar ajustes'}
          </PrimaryButton>
        )}
      </div>
    </details>
  );
}

function RecipesView({ recipes, ingredientsById, settings, onEdit, onAdd, onSaveSettings, savingSettings }) {
  return (
    <div>
      <SettingsCard settings={settings} onSave={onSaveSettings} saving={savingSettings} />
      {!recipes.length ? (
        <EmptyState
          Icon={Calculator}
          title="Calcula tu primera receta"
          detail="Anota qué ingredientes usas y cuánto tiempo te toma. Te digo cuánto te cuesta y a cuánto venderla."
        >
          <PrimaryButton onClick={onAdd}><Plus className="h-5 w-5" strokeWidth={3} /> Nueva receta</PrimaryButton>
        </EmptyState>
      ) : (
        <>
          <PrimaryButton onClick={onAdd} className="mb-3 w-full sm:w-auto">
            <Plus className="h-5 w-5" strokeWidth={3} /> Nueva receta
          </PrimaryButton>
          <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {recipes.map(recipe => {
              const result = calcularReceta({ ...recipe, items: recipe.recipe_items }, ingredientsById, settings);
              return (
                <li key={recipe.id}>
                  <button
                    type="button"
                    onClick={() => onEdit(recipe)}
                    className="w-full rounded-[1.6rem] border border-[#efc6d8] bg-white p-4 text-left shadow-[0_10px_28px_rgba(63,33,40,0.06)]"
                  >
                    <span className="block text-base font-bold text-[#3f2128]">{recipe.name}</span>
                    <span className="block text-xs font-semibold text-[#3f2128]/55">
                      Rinde {recipe.yield_count} {recipe.yield_label}
                      {result.minutos ? ` · ${minutesLabel(result.minutos)} de trabajo` : ''}
                    </span>
                    <span className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <span className="rounded-2xl bg-[#fff7fb] px-3 py-2">
                        <span className="block text-xs font-semibold text-[#3f2128]/55">Te cuesta</span>
                        <span className="font-bold text-[#3f2128]">{formatCLP(result.costoTotal)}</span>
                      </span>
                      <span className="rounded-2xl bg-[#be185d]/8 px-3 py-2">
                        <span className="block text-xs font-semibold text-[#be185d]/70">Precio sugerido</span>
                        <span className="font-bold text-[#be185d]">{formatCLP(result.sugerido)}</span>
                      </span>
                    </span>
                    {result.veredicto && (
                      <span className={`mt-2 block rounded-2xl border px-3 py-2 text-sm font-bold ${VERDICT_STYLES[result.veredicto.tono]}`}>
                        Lo vendes a {formatCLP(recipe.sale_price_clp)}: {result.veredicto.titulo.toLowerCase()}
                      </span>
                    )}
                    {result.faltanPrecios.length > 0 && (
                      <span className="mt-2 block text-xs font-bold text-amber-700">Falta el precio de {result.faltanPrecios.length} ingrediente{result.faltanPrecios.length > 1 ? 's' : ''}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

// ── Pantalla principal ──────────────────────────────────────────────────

export default function AdminCosts({ session, showNotice }) {
  const [view, setView] = useState('recetas');
  const [ingredients, setIngredients] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [settings, setSettings] = useState(AJUSTES_POR_DEFECTO);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [addingCommon, setAddingCommon] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [legacy, setLegacy] = useState(() => readLegacyData());
  const [importing, setImporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    const [ing, rec, set] = await Promise.all([
      adminRest(session, 'ingredients?select=*&order=name.asc'),
      adminRest(session, 'recipes?select=*,recipe_items(*)&order=name.asc'),
      adminRest(session, 'app_settings?key=eq.costos&select=value'),
    ]);
    const error = ing.error || rec.error || set.error;
    if (error) setLoadError(error);
    else {
      setIngredients(ing.data ?? []);
      setRecipes(rec.data ?? []);
      setSettings({ ...AJUSTES_POR_DEFECTO, ...(set.data?.[0]?.value ?? {}) });
    }
    setLoading(false);
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  const ingredientsById = useMemo(() => new Map(ingredients.map(i => [i.id, i])), [ingredients]);
  const shoppingCount = ingredients.filter(i => i.stock_level !== 'ok').length;

  async function setLevel(ingredient, level) {
    setBusyId(ingredient.id);
    setIngredients(prev => prev.map(i => i.id === ingredient.id ? { ...i, stock_level: level } : i));
    const { error } = await adminRest(session, `ingredients?id=eq.${ingredient.id}`, {
      method: 'PATCH',
      body: { stock_level: level },
      prefer: 'return=minimal',
    });
    if (error) {
      setIngredients(prev => prev.map(i => i.id === ingredient.id ? { ...i, stock_level: ingredient.stock_level } : i));
      showNotice(`No se pudo guardar: ${error}`, 'error');
    }
    setBusyId(null);
    return !error;
  }

  async function cycleLevel(ingredient) {
    const order = ['ok', 'low', 'out'];
    const next = order[(order.indexOf(ingredient.stock_level) + 1) % order.length];
    if (await setLevel(ingredient, next)) {
      const label = STOCK_LEVELS.find(l => l.value === next).label;
      showNotice(`${ingredient.name}: ${label.toLowerCase()}.`);
    }
  }

  async function markBought(ingredient) {
    if (await setLevel(ingredient, 'ok')) showNotice(`${ingredient.name} salió de la lista.`);
  }

  async function addCommonIngredients() {
    setAddingCommon(true);
    const existing = new Set(ingredients.map(i => i.name.trim().toLowerCase()));
    const rows = INGREDIENTES_COMUNES.filter(i => !existing.has(i.name.toLowerCase()));
    const { error } = await adminRest(session, 'ingredients', { method: 'POST', body: rows, prefer: 'return=minimal' });
    setAddingCommon(false);
    if (error) showNotice(`No se pudieron agregar: ${error}`, 'error');
    else showNotice('Listo. Ahora toca cada uno y anota cuánto pagaste.');
    await load();
  }

  async function saveSettings(next) {
    setSavingSettings(true);
    const { error } = await adminRest(session, 'app_settings?key=eq.costos', {
      method: 'PATCH',
      body: { value: next },
      prefer: 'return=minimal',
    });
    setSavingSettings(false);
    if (error) {
      showNotice(`No se pudo guardar: ${error}`, 'error');
      return;
    }
    setSettings(next);
    showNotice('Ajustes guardados. Las recetas ya calculan con estos valores.');
  }

  // Pasa a Supabase lo que se anotó antes en el navegador (calculadora y stock antiguos).
  async function importLegacy() {
    if (!legacy) return;
    setImporting(true);
    let ingredientCount = 0;
    let recipeCount = 0;
    const existing = new Set(ingredients.map(i => i.name.trim().toLowerCase()));
    const unitMap = { kg: 'kg', g: 'g', l: 'l', L: 'l', ml: 'ml', un: 'un' };
    const levelOf = (item) => {
      const quantity = Number(item.quantity) || 0;
      if (quantity <= (Number(item.redAt) || 0)) return 'out';
      if (quantity <= (Number(item.yellowAt) || 0)) return 'low';
      return 'ok';
    };

    const newIngredients = [];
    for (const item of legacy.items) {
      const name = String(item.name || '').trim().slice(0, 60);
      if (!name || existing.has(name.toLowerCase())) continue;
      existing.add(name.toLowerCase());
      newIngredients.push({
        name,
        unit: unitMap[item.unit] ?? 'un',
        pack_amount: 1,
        pack_price_clp: null,
        stock_level: levelOf(item),
      });
    }
    if (newIngredients.length) {
      const { error } = await adminRest(session, 'ingredients', { method: 'POST', body: newIngredients, prefer: 'return=minimal' });
      if (!error) ingredientCount = newIngredients.length;
    }

    for (const draft of legacy.recipes) {
      const items = [
        ...draft.ingredients
          .filter(i => i.name && Number(i.cost) >= 0)
          .map(i => ({ label: `${i.name}${i.quantity ? ` (${i.quantity})` : ''}`.slice(0, 80), cost_clp: Math.round(Number(i.cost) || 0) })),
        ...(draft.packagingCost ? [{ label: 'Empaque', cost_clp: Math.round(draft.packagingCost) }] : []),
        ...(draft.decorationCost ? [{ label: 'Decoración', cost_clp: Math.round(draft.decorationCost) }] : []),
      ];
      const { error } = await adminRpc(session, 'save_recipe', {
        p_recipe: {
          name: draft.productName.slice(0, 80),
          yield_count: Math.max(1, Math.round(draft.servings) || 1),
          yield_label: 'porciones',
          work_minutes: 0,
          sale_price_clp: draft.salePrice ? Math.round(draft.salePrice) : null,
          items,
        },
      });
      if (!error) recipeCount += 1;
    }

    markLegacyImported();
    setLegacy(null);
    setImporting(false);
    showNotice(`Listo: pasamos ${recipeCount} recetas y ${ingredientCount} ingredientes a la nube.`);
    await load();
  }

  function dismissLegacy() {
    markLegacyImported();
    setLegacy(null);
  }

  return (
    <section>
      <SectionTitle
        title="Costos"
        subtitle="Anota tus ingredientes una vez. Después, cada receta te dice cuánto te cuesta y a cuánto venderla."
      />

      {legacy && (
        <div className="mb-4 rounded-3xl border border-sky-200 bg-sky-50 p-4 text-sm font-semibold leading-6 text-sky-900">
          Encontramos {legacy.recipes.length} cálculos y {legacy.items.length} insumos guardados sólo en este equipo.
          ¿Los pasamos a la nube para verlos desde cualquier celular?
          <div className="mt-3 flex flex-wrap gap-2">
            <PrimaryButton onClick={importLegacy} disabled={importing}>{importing ? 'Pasando...' : 'Sí, pasarlos'}</PrimaryButton>
            <SecondaryButton onClick={dismissLegacy} disabled={importing}>No, gracias</SecondaryButton>
          </div>
        </div>
      )}

      <div className="mb-4 grid grid-cols-3 gap-1 rounded-2xl bg-[#3f2128]/6 p-1">
        {VIEWS.map(item => (
          <button
            key={item.value}
            type="button"
            onClick={() => setView(item.value)}
            className={`min-h-[48px] rounded-xl px-1 text-sm font-bold leading-tight transition ${
              view === item.value ? 'bg-white text-[#3f2128] shadow' : 'text-[#3f2128]/55'
            }`}
          >
            {item.label}
            {item.value === 'compras' && shoppingCount > 0 && (
              <span className="ml-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] text-white">{shoppingCount}</span>
            )}
          </button>
        ))}
      </div>

      {loading && !ingredients.length && !recipes.length ? (
        <div className="flex justify-center py-16"><RefreshCw className="h-7 w-7 animate-spin text-[#be185d]" /></div>
      ) : loadError ? (
        <EmptyState Icon={Calculator} title="No se pudieron cargar los costos" detail={loadError}>
          <SecondaryButton onClick={load}><RefreshCw className="h-4 w-4" /> Reintentar</SecondaryButton>
        </EmptyState>
      ) : view === 'recetas' ? (
        <RecipesView
          recipes={recipes}
          ingredientsById={ingredientsById}
          settings={settings}
          onEdit={(recipe) => setEditingRecipe(recipeDraftFrom(recipe))}
          onAdd={() => setEditingRecipe(newRecipeDraft())}
          onSaveSettings={saveSettings}
          savingSettings={savingSettings}
        />
      ) : view === 'ingredientes' ? (
        <IngredientsView
          ingredients={ingredients}
          onEdit={(ingredient) => setEditingIngredient({ ...ingredient, pack_amount: String(Number(ingredient.pack_amount)), pack_price_clp: ingredient.pack_price_clp ?? '' })}
          onAdd={() => setEditingIngredient(newIngredientDraft())}
          onCycleLevel={cycleLevel}
          onAddCommon={addCommonIngredients}
          busyId={busyId}
          addingCommon={addingCommon}
        />
      ) : (
        <ShoppingView ingredients={ingredients} onBought={markBought} busyId={busyId} showNotice={showNotice} />
      )}

      {editingRecipe && (
        <RecipeEditor
          initial={editingRecipe}
          ingredients={ingredients}
          ingredientsById={ingredientsById}
          settings={settings}
          session={session}
          showNotice={showNotice}
          onClose={() => setEditingRecipe(null)}
          onSaved={async () => {
            setEditingRecipe(null);
            await load();
          }}
          onIngredientCreated={(created) => setIngredients(prev => [...prev, created])}
        />
      )}

      {editingIngredient && (
        <IngredientEditor
          initial={editingIngredient}
          session={session}
          showNotice={showNotice}
          onClose={() => setEditingIngredient(null)}
          onSaved={async () => {
            setEditingIngredient(null);
            await load();
          }}
        />
      )}
    </section>
  );
}
