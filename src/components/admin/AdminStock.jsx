import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  PackageCheck,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
} from 'lucide-react';
import {
  calculateStockSummary,
  createStockItem,
  createStockRecipe,
  createStockRecipeLine,
  getStockLevel,
  readStoredStockItems,
  readStoredStockRecipes,
  saveStockItemsToStorage,
  saveStockRecipesToStorage,
  STOCK_ITEM_TEMPLATES,
  STOCK_RECIPE_TEMPLATES,
  toPositiveNumber,
} from './adminData';

const STOCK_FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'red', label: 'Comprar' },
  { value: 'yellow', label: 'Revisar' },
  { value: 'green', label: 'Bien' },
];

function StockMetric({ label, value, detail, tone = 'pink', Icon }) {
  const toneClass = {
    green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    yellow: 'bg-amber-50 text-amber-700 border-amber-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    pink: 'bg-[#fff7fb] text-[#be185d] border-[#efc6d8]',
  }[tone];

  return (
    <div className={`rounded-[1.35rem] border px-4 py-3 shadow-[0_12px_28px_rgba(63,33,40,0.06)] ${toneClass}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.14em] opacity-70">{label}</p>
          <p className="mt-1 font-serif text-2xl font-bold">{value}</p>
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white/72">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-1 text-[11px] font-bold leading-4 opacity-70">{detail}</p>
    </div>
  );
}

function StockField({ label, value, onChange, type = 'text', suffix, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.12em] text-[#3f2128]/46">{label}</span>
      <span className="relative block">
        {children ?? (
          <input
            type={type}
            min={type === 'number' ? '0' : undefined}
            step={type === 'number' ? '0.1' : undefined}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="min-h-[42px] w-full rounded-2xl border border-[#efc6d8] bg-[#fff7fb] px-3 py-2 pr-12 text-sm font-bold text-[#3f2128] outline-none transition focus:border-[#be185d]/45"
          />
        )}
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-[#be185d]/52">
            {suffix}
          </span>
        )}
      </span>
    </label>
  );
}

function LevelPill({ level }) {
  return (
    <span className={`inline-flex shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black ${level.badge}`}>
      {level.label}
    </span>
  );
}

function StockItemRow({ item, active, onSelect, onRemove }) {
  const level = getStockLevel(item);
  const capacity = Math.max(1, toPositiveNumber(item.quantity), toPositiveNumber(item.yellowAt) * 1.5);
  const width = Math.min(100, (toPositiveNumber(item.quantity) / capacity) * 100);

  return (
    <article
      className={`rounded-[1.35rem] border bg-white px-3 py-3 shadow-[0_10px_24px_rgba(63,33,40,0.06)] transition ${
        active ? 'border-[#be185d]/45 ring-2 ring-[#be185d]/10' : 'border-[#efc6d8]'
      }`}
    >
      <div className="grid gap-3 sm:grid-cols-[1.1fr_0.8fr_1fr_auto] sm:items-center">
        <button type="button" onClick={() => onSelect(item.id)} className="min-w-0 text-left">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${level.bar}`} />
            <p className="truncate font-serif text-xl font-bold text-[#3f2128]">{item.name}</p>
          </div>
          <p className="mt-0.5 truncate text-xs font-bold text-[#3f2128]/46">{item.category || 'General'}</p>
        </button>

        <div className="flex items-center gap-2">
          <LevelPill level={level} />
          <span className="text-xs font-black text-[#3f2128]/54">
            {item.quantity} {item.unit}
          </span>
        </div>

        <button type="button" onClick={() => onSelect(item.id)} className="text-left">
          <div className="mb-1 flex justify-between text-[10px] font-black text-[#3f2128]/42">
            <span>Amarillo {item.yellowAt}</span>
            <span>Rojo {item.redAt}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-[#fff1f8]">
            <span className={`block h-full rounded-full ${level.bar}`} style={{ width: `${Math.max(5, width)}%` }} />
          </div>
        </button>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onSelect(item.id)}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#efc6d8] bg-[#fff7fb] text-[#be185d]"
            aria-label={`Editar ${item.name}`}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-red-100 bg-red-50 text-red-500"
            aria-label={`Eliminar ${item.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}

function StockItemEditor({ item, onChange, onRemove }) {
  if (!item) {
    return (
      <section className="rounded-[1.7rem] border border-[#efc6d8] bg-white p-5 text-sm font-bold text-[#3f2128]/52">
        Selecciona un insumo para editarlo.
      </section>
    );
  }

  const level = getStockLevel(item);

  return (
    <section className="rounded-[1.7rem] border border-[#efc6d8] bg-white p-4 shadow-[0_16px_38px_rgba(63,33,40,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#be185d]/55">Editar insumo</p>
          <h3 className="mt-1 truncate font-serif text-2xl font-bold text-[#3f2128]">{item.name}</h3>
          <p className="mt-1 text-xs font-bold text-[#3f2128]/45">{level.detail}</p>
        </div>
        <LevelPill level={level} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <StockField label="Insumo" value={item.name} onChange={(value) => onChange(item.id, 'name', value)} />
        <StockField label="Categoria" value={item.category} onChange={(value) => onChange(item.id, 'category', value)} />
        <StockField label="Cantidad actual" type="number" value={item.quantity} suffix={item.unit} onChange={(value) => onChange(item.id, 'quantity', value)} />
        <StockField label="Unidad" value={item.unit} onChange={(value) => onChange(item.id, 'unit', value)} />
        <StockField label="Alerta amarilla" type="number" value={item.yellowAt} suffix={item.unit} onChange={(value) => onChange(item.id, 'yellowAt', value)} />
        <StockField label="Alerta roja" type="number" value={item.redAt} suffix={item.unit} onChange={(value) => onChange(item.id, 'redAt', value)} />
      </div>

      <label className="mt-3 block">
        <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.12em] text-[#3f2128]/46">Nota</span>
        <textarea
          rows={3}
          value={item.note}
          onChange={(event) => onChange(item.id, 'note', event.target.value)}
          className="w-full resize-none rounded-2xl border border-[#efc6d8] bg-[#fff7fb] px-3 py-2 text-sm font-bold text-[#3f2128] outline-none transition focus:border-[#be185d]/45"
        />
      </label>

      <button
        type="button"
        onClick={() => onRemove(item.id)}
        className="mt-3 inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-2 text-xs font-black text-red-500"
      >
        <Trash2 className="h-4 w-4" />
        Quitar insumo
      </button>
    </section>
  );
}

function RecipeRow({ recipe, active, onSelect, onRemove }) {
  return (
    <article className={`rounded-2xl border bg-white px-3 py-3 ${active ? 'border-[#be185d]/45 ring-2 ring-[#be185d]/10' : 'border-[#efc6d8]'}`}>
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={() => onSelect(recipe.id)} className="min-w-0 text-left">
          <p className="truncate text-sm font-black text-[#3f2128]">{recipe.productName}</p>
          <p className="mt-0.5 text-xs font-bold text-[#3f2128]/45">
            {recipe.lines.length} insumos · {recipe.portions} porciones
          </p>
        </button>
        <button
          type="button"
          onClick={() => onRemove(recipe.id)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-red-100 bg-red-50 text-red-500"
          aria-label={`Eliminar receta ${recipe.productName}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}

function RecipeEditor({ recipe, stockItems, onChange, onLineChange, onAddLine, onRemoveLine }) {
  if (!recipe) return null;

  return (
    <section className="rounded-[1.7rem] border border-[#efc6d8] bg-white p-4 shadow-[0_16px_38px_rgba(63,33,40,0.08)]">
      <div className="mb-3">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#be185d]/55">Receta seleccionada</p>
        <h3 className="mt-1 truncate font-serif text-2xl font-bold text-[#3f2128]">{recipe.productName}</h3>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
        <StockField label="Producto" value={recipe.productName} onChange={(value) => onChange(recipe.id, 'productName', value)} />
        <StockField label="Porciones" type="number" value={recipe.portions} onChange={(value) => onChange(recipe.id, 'portions', value)} />
      </div>

      <div className="mt-4 grid gap-2">
        {recipe.lines.map(line => (
          <div key={line.id} className="grid gap-2 rounded-2xl border border-[#f1d3df] bg-[#fff7fb] p-3 sm:grid-cols-[1fr_6rem_5.5rem_auto] sm:items-end">
            <StockField label="Insumo" value={line.stockName} onChange={(value) => onLineChange(recipe.id, line.id, 'stockName', value)}>
              <select
                value={line.stockName}
                onChange={(event) => onLineChange(recipe.id, line.id, 'stockName', event.target.value)}
                className="min-h-[42px] w-full rounded-2xl border border-[#efc6d8] bg-white px-3 py-2 text-sm font-bold text-[#3f2128] outline-none"
              >
                {stockItems.map(item => <option key={item.id} value={item.name}>{item.name}</option>)}
                {!stockItems.some(item => item.name === line.stockName) && <option value={line.stockName}>{line.stockName}</option>}
              </select>
            </StockField>
            <StockField label="Usa" type="number" value={line.amount} onChange={(value) => onLineChange(recipe.id, line.id, 'amount', value)} />
            <StockField label="Unidad" value={line.unit} onChange={(value) => onLineChange(recipe.id, line.id, 'unit', value)} />
            <button
              type="button"
              onClick={() => onRemoveLine(recipe.id, line.id)}
              disabled={recipe.lines.length <= 1}
              className="min-h-[42px] rounded-2xl border border-red-100 bg-white px-3 py-2 text-xs font-black text-red-500 disabled:cursor-not-allowed disabled:opacity-35"
            >
              Quitar
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onAddLine(recipe.id)}
        className="mt-3 inline-flex min-h-[42px] items-center justify-center gap-2 rounded-2xl border border-[#efc6d8] bg-[#fff7fb] px-4 py-2 text-xs font-black text-[#be185d]"
      >
        <Plus className="h-4 w-4" />
        Agregar insumo
      </button>
    </section>
  );
}

export default function AdminStock() {
  const [items, setItems] = useState(readStoredStockItems);
  const [recipes, setRecipes] = useState(readStoredStockRecipes);
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [selectedItemId, setSelectedItemId] = useState(() => readStoredStockItems()[0]?.id ?? '');
  const [selectedRecipeId, setSelectedRecipeId] = useState(() => readStoredStockRecipes()[0]?.id ?? '');

  useEffect(() => {
    saveStockItemsToStorage(items);
  }, [items]);

  useEffect(() => {
    saveStockRecipesToStorage(recipes);
  }, [recipes]);

  useEffect(() => {
    if (!items.some(item => item.id === selectedItemId)) {
      setSelectedItemId(items[0]?.id ?? '');
    }
  }, [items, selectedItemId]);

  useEffect(() => {
    if (!recipes.some(recipe => recipe.id === selectedRecipeId)) {
      setSelectedRecipeId(recipes[0]?.id ?? '');
    }
  }, [recipes, selectedRecipeId]);

  useEffect(() => {
    if (!notice) return undefined;
    const timeoutId = window.setTimeout(() => setNotice(''), 2400);
    return () => window.clearTimeout(timeoutId);
  }, [notice]);

  const summary = useMemo(() => calculateStockSummary(items), [items]);
  const filteredItems = useMemo(() => {
    const priority = { red: 0, yellow: 1, green: 2 };
    const normalizedQuery = query.trim().toLowerCase();
    return [...items]
      .filter(item => {
        const level = getStockLevel(item).key;
        const matchesLevel = levelFilter === 'all' || level === levelFilter;
        const searchable = `${item.name} ${item.category} ${item.note}`.toLowerCase();
        return matchesLevel && (!normalizedQuery || searchable.includes(normalizedQuery));
      })
      .sort((a, b) => priority[getStockLevel(a).key] - priority[getStockLevel(b).key] || a.name.localeCompare(b.name));
  }, [items, levelFilter, query]);
  const selectedItem = items.find(item => item.id === selectedItemId) ?? filteredItems[0] ?? null;
  const selectedRecipe = recipes.find(recipe => recipe.id === selectedRecipeId) ?? recipes[0] ?? null;

  function addItem(template = null) {
    const next = createStockItem(template ?? { name: 'Nuevo insumo', unit: 'un', quantity: 0, yellowAt: 3, redAt: 1 });
    setItems(prev => [next, ...prev]);
    setSelectedItemId(next.id);
    setNotice(template ? `${template.name} agregado al stock.` : 'Nuevo insumo agregado.');
  }

  function updateItem(id, field, value) {
    const numericFields = ['quantity', 'yellowAt', 'redAt'];
    setItems(prev => prev.map(item => (
      item.id === id
        ? { ...item, [field]: numericFields.includes(field) ? toPositiveNumber(value) : value, updatedAt: new Date().toISOString() }
        : item
    )));
  }

  function removeItem(id) {
    setItems(prev => prev.length > 1 ? prev.filter(item => item.id !== id) : prev);
    setNotice('Insumo quitado del stock local.');
  }

  function addRecipe(template = null) {
    const next = createStockRecipe(template ?? { productName: 'Nueva receta', portions: 1 });
    setRecipes(prev => [next, ...prev]);
    setSelectedRecipeId(next.id);
    setNotice(template ? `Receta ${template.productName} agregada.` : 'Nueva receta agregada.');
  }

  function updateRecipe(id, field, value) {
    setRecipes(prev => prev.map(recipe => (
      recipe.id === id
        ? { ...recipe, [field]: field === 'portions' ? toPositiveNumber(value) || 1 : value, updatedAt: new Date().toISOString() }
        : recipe
    )));
  }

  function updateRecipeLine(recipeId, lineId, field, value) {
    setRecipes(prev => prev.map(recipe => {
      if (recipe.id !== recipeId) return recipe;
      return {
        ...recipe,
        updatedAt: new Date().toISOString(),
        lines: recipe.lines.map(line => {
          if (line.id !== lineId) return line;
          if (field === 'stockName') {
            const match = items.find(item => item.name === value);
            return { ...line, stockName: value, unit: match?.unit ?? line.unit };
          }
          return { ...line, [field]: field === 'amount' ? toPositiveNumber(value) : value };
        }),
      };
    }));
  }

  function addRecipeLine(recipeId) {
    const firstItem = items[0];
    setRecipes(prev => prev.map(recipe => (
      recipe.id === recipeId
        ? {
            ...recipe,
            lines: [...recipe.lines, createStockRecipeLine({ stockName: firstItem?.name ?? 'Insumo', amount: 0, unit: firstItem?.unit ?? 'un' })],
          }
        : recipe
    )));
  }

  function removeRecipeLine(recipeId, lineId) {
    setRecipes(prev => prev.map(recipe => (
      recipe.id === recipeId && recipe.lines.length > 1
        ? { ...recipe, lines: recipe.lines.filter(line => line.id !== lineId) }
        : recipe
    )));
  }

  function removeRecipe(id) {
    setRecipes(prev => prev.length > 1 ? prev.filter(recipe => recipe.id !== id) : prev);
    setNotice('Receta quitada de guardados locales.');
  }

  return (
    <section className="space-y-5">
      <section className="overflow-hidden rounded-[2rem] border border-[#efc6d8] bg-white shadow-[0_22px_58px_rgba(63,33,40,0.10)]">
        <div className="grid gap-5 p-4 sm:p-5 xl:grid-cols-[1fr_24rem] xl:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#be185d]/62">Control diario</p>
            <h2 className="mt-2 font-serif text-3xl font-bold leading-tight text-[#3f2128]">Stock semaforo</h2>
            <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-[#3f2128]/58">
              Lista compacta para encontrar insumos rapido. Edita solo el seleccionado.
            </p>
          </div>
          <div className="rounded-[1.75rem] border border-[#efc6d8] bg-[linear-gradient(135deg,#fff7fb_0%,#fff_68%,#fdf2f8_100%)] p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#be185d]/58">Agregar rapido</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {STOCK_ITEM_TEMPLATES.map(template => (
                <button
                  key={template.name}
                  type="button"
                  onClick={() => addItem(template)}
                  className="rounded-full border border-[#efc6d8] bg-white px-3 py-2 text-xs font-black text-[#3f2128] transition hover:-translate-y-0.5 hover:border-[#be185d]/45 hover:text-[#be185d]"
                >
                  {template.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {notice && (
        <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
          {notice}
        </p>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StockMetric label="Insumos" value={summary.total} detail="Guardados en este navegador." Icon={PackageCheck} />
        <StockMetric label="Comprar" value={summary.urgent} detail="Nivel rojo, prioridad alta." tone="red" Icon={AlertTriangle} />
        <StockMetric label="Atentos" value={summary.warning} detail="Nivel amarillo, revisar pronto." tone="yellow" Icon={ClipboardList} />
        <StockMetric label="Bien" value={summary.good} detail="Nivel verde, stock tranquilo." tone="green" Icon={CheckCircle2} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_26rem]">
        <div className="space-y-3">
          <div className="rounded-[1.7rem] border border-[#efc6d8] bg-white p-4 shadow-[0_16px_38px_rgba(63,33,40,0.08)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#be185d]/62">Inventario</p>
                <h2 className="mt-1 font-serif text-2xl font-bold text-[#3f2128]">Insumos importantes</h2>
              </div>
              <button
                type="button"
                onClick={() => addItem()}
                className="inline-flex min-h-[42px] items-center gap-2 rounded-2xl bg-[#be185d] px-4 py-2 text-sm font-black text-white shadow-[0_14px_30px_rgba(190,24,93,0.20)]"
              >
                <Plus className="h-4 w-4" />
                Nuevo
              </button>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#be185d]/45" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar insumo, categoria o nota"
                  className="min-h-[44px] w-full rounded-2xl border border-[#efc6d8] bg-[#fff7fb] px-10 py-2 text-sm font-bold text-[#3f2128] outline-none focus:border-[#be185d]/45"
                />
              </label>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {STOCK_FILTERS.map(filter => {
                  const active = levelFilter === filter.value;
                  return (
                    <button
                      key={filter.value}
                      type="button"
                      onClick={() => setLevelFilter(filter.value)}
                      className={`min-h-[44px] shrink-0 rounded-2xl border px-4 py-2 text-xs font-black ${
                        active
                          ? 'border-[#be185d] bg-[#be185d] text-white'
                          : 'border-[#efc6d8] bg-white text-[#3f2128]'
                      }`}
                    >
                      {filter.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            {filteredItems.map(item => (
              <StockItemRow
                key={item.id}
                item={item}
                active={selectedItem?.id === item.id}
                onSelect={setSelectedItemId}
                onRemove={removeItem}
              />
            ))}
            {!filteredItems.length && (
              <p className="rounded-2xl border border-[#efc6d8] bg-white px-4 py-5 text-sm font-bold text-[#3f2128]/52">
                No hay insumos con ese filtro.
              </p>
            )}
          </div>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-5 xl:self-start">
          <StockItemEditor item={selectedItem} onChange={updateItem} onRemove={removeItem} />

          <section className="rounded-[1.7rem] border border-[#efc6d8] bg-[#fff7fb] p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-[#be185d]">
                <Save className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-black text-[#3f2128]">Recetas base</p>
                <p className="mt-1 text-xs font-bold leading-5 text-[#3f2128]/52">
                  Compactas por ahora. Despues serviran para descontar stock al marcar pedidos.
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {STOCK_RECIPE_TEMPLATES.map(template => (
                <button
                  key={template.productName}
                  type="button"
                  onClick={() => addRecipe(template)}
                  className="rounded-full border border-[#efc6d8] bg-white px-3 py-2 text-xs font-black text-[#be185d]"
                >
                  {template.productName}
                </button>
              ))}
            </div>
          </section>

          <div className="grid gap-2">
            {recipes.map(recipe => (
              <RecipeRow
                key={recipe.id}
                recipe={recipe}
                active={selectedRecipe?.id === recipe.id}
                onSelect={setSelectedRecipeId}
                onRemove={removeRecipe}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => addRecipe()}
            className="inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-2xl bg-[#3f2128] px-4 py-2 text-sm font-black text-white shadow-[0_14px_30px_rgba(63,33,40,0.16)]"
          >
            <Plus className="h-4 w-4" />
            Nueva receta
          </button>

          <RecipeEditor
            recipe={selectedRecipe}
            stockItems={items}
            onChange={updateRecipe}
            onLineChange={updateRecipeLine}
            onAddLine={addRecipeLine}
            onRemoveLine={removeRecipeLine}
          />
        </aside>
      </section>
    </section>
  );
}
