import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  PackageCheck,
  Plus,
  Save,
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

function StockMetric({ label, value, detail, tone = 'pink', Icon }) {
  const toneClass = {
    green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    yellow: 'bg-amber-50 text-amber-700 border-amber-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    pink: 'bg-[#fff7fb] text-[#be185d] border-[#efc6d8]',
  }[tone];

  return (
    <div className={`rounded-[1.6rem] border p-4 shadow-[0_14px_34px_rgba(63,33,40,0.07)] ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.14em] opacity-70">{label}</p>
          <p className="mt-2 font-serif text-3xl font-bold">{value}</p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/70">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2 text-xs font-bold leading-5 opacity-70">{detail}</p>
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
            className="min-h-[44px] w-full rounded-2xl border border-[#efc6d8] bg-[#fff7fb] px-3 py-2 pr-12 text-sm font-bold text-[#3f2128] outline-none transition focus:border-[#be185d]/45"
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

function StockItemCard({ item, onChange, onRemove }) {
  const level = getStockLevel(item);
  const capacity = Math.max(1, toPositiveNumber(item.quantity), toPositiveNumber(item.yellowAt) * 1.5);
  const width = Math.min(100, (toPositiveNumber(item.quantity) / capacity) * 100);

  return (
    <article className="rounded-[1.7rem] border border-[#efc6d8] bg-white p-4 shadow-[0_16px_38px_rgba(63,33,40,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black ${level.badge}`}>
            {level.label}
          </span>
          <h3 className="mt-3 truncate font-serif text-2xl font-bold text-[#3f2128]">{item.name}</h3>
          <p className="mt-1 text-xs font-bold text-[#3f2128]/45">{level.detail}</p>
        </div>
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-red-100 bg-red-50 text-red-500 transition hover:-translate-y-0.5"
          aria-label={`Eliminar ${item.name}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 rounded-2xl bg-[#fff7fb] p-3">
        <div className="mb-2 flex items-center justify-between text-xs font-black text-[#3f2128]/58">
          <span>Actual</span>
          <span>{item.quantity} {item.unit}</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-white">
          <span className={`block h-full rounded-full ${level.bar}`} style={{ width: `${Math.max(5, width)}%` }} />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] font-black text-[#3f2128]/46">
          <span>Amarillo: {item.yellowAt} {item.unit}</span>
          <span>Rojo: {item.redAt} {item.unit}</span>
        </div>
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
          rows={2}
          value={item.note}
          onChange={(event) => onChange(item.id, 'note', event.target.value)}
          className="w-full resize-none rounded-2xl border border-[#efc6d8] bg-[#fff7fb] px-3 py-2 text-sm font-bold text-[#3f2128] outline-none transition focus:border-[#be185d]/45"
        />
      </label>
    </article>
  );
}

function RecipeCard({ recipe, stockItems, onChange, onLineChange, onAddLine, onRemoveLine, onRemove }) {
  return (
    <article className="rounded-[1.7rem] border border-[#efc6d8] bg-white p-4 shadow-[0_16px_38px_rgba(63,33,40,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#be185d]/55">Receta base</p>
          <h3 className="mt-1 truncate font-serif text-2xl font-bold text-[#3f2128]">{recipe.productName}</h3>
          <p className="mt-1 text-xs font-bold text-[#3f2128]/45">Sirve para descontar stock mas adelante.</p>
        </div>
        <button
          type="button"
          onClick={() => onRemove(recipe.id)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-red-100 bg-red-50 text-red-500 transition hover:-translate-y-0.5"
          aria-label={`Eliminar receta ${recipe.productName}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_8rem]">
        <StockField label="Producto" value={recipe.productName} onChange={(value) => onChange(recipe.id, 'productName', value)} />
        <StockField label="Porciones" type="number" value={recipe.portions} onChange={(value) => onChange(recipe.id, 'portions', value)} />
      </div>

      <div className="mt-4 grid gap-2">
        {recipe.lines.map(line => (
          <div key={line.id} className="grid gap-2 rounded-2xl border border-[#f1d3df] bg-[#fff7fb] p-3 sm:grid-cols-[1fr_7rem_6rem_auto] sm:items-end">
            <StockField label="Insumo" value={line.stockName} onChange={(value) => onLineChange(recipe.id, line.id, 'stockName', value)}>
              <select
                value={line.stockName}
                onChange={(event) => onLineChange(recipe.id, line.id, 'stockName', event.target.value)}
                className="min-h-[44px] w-full rounded-2xl border border-[#efc6d8] bg-white px-3 py-2 text-sm font-bold text-[#3f2128] outline-none"
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
              className="min-h-[44px] rounded-2xl border border-red-100 bg-white px-3 py-2 text-xs font-black text-red-500 disabled:cursor-not-allowed disabled:opacity-35"
            >
              Quitar
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onAddLine(recipe.id)}
        className="mt-3 inline-flex min-h-[42px] items-center justify-center gap-2 rounded-2xl border border-[#efc6d8] bg-[#fff7fb] px-4 py-2 text-xs font-black text-[#be185d] transition hover:-translate-y-0.5"
      >
        <Plus className="h-4 w-4" />
        Agregar insumo
      </button>
    </article>
  );
}

export default function AdminStock() {
  const [items, setItems] = useState(readStoredStockItems);
  const [recipes, setRecipes] = useState(readStoredStockRecipes);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    saveStockItemsToStorage(items);
  }, [items]);

  useEffect(() => {
    saveStockRecipesToStorage(recipes);
  }, [recipes]);

  useEffect(() => {
    if (!notice) return undefined;
    const timeoutId = window.setTimeout(() => setNotice(''), 2400);
    return () => window.clearTimeout(timeoutId);
  }, [notice]);

  const summary = useMemo(() => calculateStockSummary(items), [items]);
  const sortedItems = useMemo(() => {
    const priority = { red: 0, yellow: 1, green: 2 };
    return [...items].sort((a, b) => priority[getStockLevel(a).key] - priority[getStockLevel(b).key]);
  }, [items]);

  function addItem(template = null) {
    setItems(prev => [createStockItem(template ?? { name: 'Nuevo insumo', unit: 'un', quantity: 0, yellowAt: 3, redAt: 1 }), ...prev]);
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
    setRecipes(prev => [createStockRecipe(template ?? { productName: 'Nueva receta', portions: 1 }), ...prev]);
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
              Registra insumos importantes, ve alertas por color y prepara recetas base para automatizar descuentos mas adelante.
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

      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#be185d]/62">Inventario</p>
              <h2 className="mt-1 font-serif text-2xl font-bold text-[#3f2128]">Insumos importantes</h2>
            </div>
            <button
              type="button"
              onClick={() => addItem()}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl bg-[#be185d] px-4 py-2 text-sm font-black text-white shadow-[0_14px_30px_rgba(190,24,93,0.20)] transition hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4" />
              Nuevo insumo
            </button>
          </div>
          <div className="grid gap-3">
            {sortedItems.map(item => (
              <StockItemCard key={item.id} item={item} onChange={updateItem} onRemove={removeItem} />
            ))}
          </div>
        </div>

        <aside>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#be185d]/62">Recetas</p>
              <h2 className="mt-1 font-serif text-2xl font-bold text-[#3f2128]">Base para descontar</h2>
            </div>
            <button
              type="button"
              onClick={() => addRecipe()}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl bg-[#3f2128] px-4 py-2 text-sm font-black text-white shadow-[0_14px_30px_rgba(63,33,40,0.16)] transition hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4" />
              Nueva receta
            </button>
          </div>

          <section className="mb-3 rounded-[1.7rem] border border-[#efc6d8] bg-[#fff7fb] p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-[#be185d]">
                <Save className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-black text-[#3f2128]">Sin descuento automatico todavia</p>
                <p className="mt-1 text-xs font-bold leading-5 text-[#3f2128]/52">
                  Primero dejamos las recetas ordenadas. Despues se podra descontar stock al marcar pedidos.
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

          <div className="grid gap-3">
            {recipes.map(recipe => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                stockItems={items}
                onChange={updateRecipe}
                onLineChange={updateRecipeLine}
                onAddLine={addRecipeLine}
                onRemoveLine={removeRecipeLine}
                onRemove={removeRecipe}
              />
            ))}
          </div>
        </aside>
      </section>
    </section>
  );
}
