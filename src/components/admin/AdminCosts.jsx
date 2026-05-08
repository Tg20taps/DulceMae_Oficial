import { useEffect, useMemo, useState } from 'react';
import {
  Calculator,
  Copy,
  PackageCheck,
  Plus,
  ReceiptText,
  Save,
  Trash2,
} from 'lucide-react';
import {
  buildBlankCostDraft,
  buildCostDraft,
  calculateCostTotals,
  COST_PRESETS,
  createCostDraftId,
  createCostItem,
  formatCLP,
  getCostDraftLabel,
  readStoredCostDraft,
  readStoredCostDrafts,
  sanitizeCostDraft,
  saveCostDraftsToStorage,
  saveCostDraftToStorage,
  toPositiveNumber,
} from './adminData';

function CostNumberField({ label, value, onChange, suffix }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-[#3f2128]/52">{label}</span>
      <span className="relative block">
        <input
          type="number"
          min="0"
          step="1"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-[48px] w-full rounded-2xl border border-[#efc6d8] bg-[#fff7fb] px-4 py-3 pr-12 text-sm font-bold text-[#3f2128] outline-none transition focus:border-[#be185d]/45"
        />
        {suffix && (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#be185d]/55">
            {suffix}
          </span>
        )}
      </span>
    </label>
  );
}

function CostSummaryItem({ label, value }) {
  return (
    <div className="rounded-2xl bg-[#fff7fb] px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#3f2128]/48">{label}</p>
      <p className="mt-1 font-serif text-xl font-bold text-[#3f2128]">{value}</p>
    </div>
  );
}

export default function AdminCosts() {
  const [savedDrafts, setSavedDrafts] = useState(readStoredCostDrafts);
  const [draft, setDraft] = useState(() => savedDrafts[0] ?? readStoredCostDraft());
  const [costNotice, setCostNotice] = useState('');

  useEffect(() => {
    saveCostDraftToStorage(draft);
  }, [draft]);

  useEffect(() => {
    saveCostDraftsToStorage(savedDrafts);
  }, [savedDrafts]);

  useEffect(() => {
    if (!costNotice) return undefined;
    const timeoutId = window.setTimeout(() => setCostNotice(''), 2600);
    return () => window.clearTimeout(timeoutId);
  }, [costNotice]);

  const totals = useMemo(() => calculateCostTotals(draft), [draft]);
  const maxBreakdown = Math.max(1, ...totals.breakdown.map(item => item.value));
  const savedActive = savedDrafts.some(item => item.id === draft.id);
  const statusClass = {
    danger: 'border-red-100 bg-red-50 text-red-600',
    good: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    ok: 'border-amber-100 bg-amber-50 text-amber-700',
  }[totals.status.tone];

  function updateDraftField(field, value) {
    const numericField = field.includes('Cost') || ['servings', 'salePrice', 'targetMargin'].includes(field);
    setDraft(prev => ({ ...prev, [field]: numericField ? toPositiveNumber(value) : value }));
  }

  function updateIngredient(id, field, value) {
    setDraft(prev => ({
      ...prev,
      ingredients: prev.ingredients.map(item => (
        item.id === id
          ? { ...item, [field]: field === 'cost' ? toPositiveNumber(value) : value }
          : item
      )),
    }));
  }

  function addIngredient() {
    setDraft(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, createCostItem({ name: 'Nuevo insumo', quantity: 'cantidad', cost: 0 })],
    }));
  }

  function removeIngredient(id) {
    setDraft(prev => ({
      ...prev,
      ingredients: prev.ingredients.length > 1 ? prev.ingredients.filter(item => item.id !== id) : prev.ingredients,
    }));
  }

  function applyPreset(preset) {
    setDraft(buildCostDraft(preset));
    setCostNotice(`Plantilla "${preset.label}" cargada. Ajusta y guarda si te sirve.`);
  }

  function saveCurrentDraft() {
    const cleanDraft = sanitizeCostDraft({
      ...draft,
      productName: getCostDraftLabel(draft),
      updatedAt: new Date().toISOString(),
    });

    setDraft(cleanDraft);
    setSavedDrafts(prev => {
      const exists = prev.some(item => item.id === cleanDraft.id);
      const next = exists
        ? prev.map(item => item.id === cleanDraft.id ? cleanDraft : item)
        : [cleanDraft, ...prev];
      return next.slice(0, 40);
    });
    setCostNotice(`Guardado como "${getCostDraftLabel(cleanDraft)}".`);
  }

  function startNewDraft() {
    setDraft(buildBlankCostDraft());
    setCostNotice('Nuevo calculo listo.');
  }

  function loadSavedDraft(id) {
    const savedDraft = savedDrafts.find(item => item.id === id);
    if (!savedDraft) return;
    setDraft(sanitizeCostDraft(savedDraft));
    setCostNotice(`Abierto: "${getCostDraftLabel(savedDraft)}".`);
  }

  function duplicateDraft() {
    const copy = sanitizeCostDraft({
      ...draft,
      id: createCostDraftId(),
      productName: `Copia de ${getCostDraftLabel(draft)}`,
      updatedAt: new Date().toISOString(),
    });
    setDraft(copy);
    setCostNotice('Copia creada. Cambia el nombre y guarda.');
  }

  function deleteSavedDraft() {
    if (!savedActive) return;
    const next = savedDrafts.filter(item => item.id !== draft.id);
    setSavedDrafts(next);
    setDraft(next[0] ? sanitizeCostDraft(next[0]) : buildBlankCostDraft());
    setCostNotice('Calculo eliminado de guardados.');
  }

  return (
    <section className="space-y-4">
      <section className="rounded-[2rem] border border-[#efc6d8] bg-white p-4 shadow-[0_20px_54px_rgba(63,33,40,0.10)] sm:p-5">
        <div className="grid gap-4 xl:grid-cols-[1fr_28rem] xl:items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#be185d]/62">Costos internos</p>
            <h2 className="mt-2 font-serif text-3xl font-bold leading-tight text-[#3f2128]">Calculadora simple</h2>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#3f2128]/58">
              Una sola vista para estimar ingredientes, empaque, decoracion, margen y precio sugerido.
            </p>
          </div>
          <div className="rounded-3xl border border-[#efc6d8] bg-[#fff7fb] p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#be185d]/58">Producto activo</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
              <select
                value={savedActive ? draft.id : ''}
                onChange={(event) => loadSavedDraft(event.target.value)}
                className="min-h-[44px] rounded-2xl border border-[#efc6d8] bg-white px-3 py-2 text-sm font-bold text-[#3f2128] outline-none"
              >
                {!savedActive && <option value="">Borrador actual</option>}
                {savedDrafts.map(savedDraft => (
                  <option key={savedDraft.id} value={savedDraft.id}>{getCostDraftLabel(savedDraft)}</option>
                ))}
              </select>
              <div className="grid grid-cols-4 gap-2">
                <button type="button" onClick={startNewDraft} className="flex h-11 items-center justify-center rounded-2xl border border-[#efc6d8] bg-white text-[#be185d]" aria-label="Nuevo calculo">
                  <Plus className="h-4 w-4" />
                </button>
                <button type="button" onClick={duplicateDraft} className="flex h-11 items-center justify-center rounded-2xl border border-[#efc6d8] bg-white text-[#be185d]" aria-label="Duplicar calculo">
                  <Copy className="h-4 w-4" />
                </button>
                <button type="button" onClick={saveCurrentDraft} className="flex h-11 items-center justify-center rounded-2xl bg-[#be185d] text-white shadow-[0_12px_26px_rgba(190,24,93,0.18)]" aria-label="Guardar calculo">
                  <Save className="h-4 w-4" />
                </button>
                <button type="button" onClick={deleteSavedDraft} disabled={!savedActive} className="flex h-11 items-center justify-center rounded-2xl border border-red-100 bg-white text-red-500 disabled:cursor-not-allowed disabled:opacity-35" aria-label="Borrar calculo">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {costNotice && (
        <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          {costNotice}
        </p>
      )}

      <section className="rounded-[2rem] border border-[#efc6d8] bg-white p-4 shadow-[0_16px_38px_rgba(63,33,40,0.08)]">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-bold uppercase tracking-[0.14em] text-[#be185d]/58">Plantillas</span>
          {COST_PRESETS.map(preset => (
            <button
              key={preset.key}
              type="button"
              onClick={() => applyPreset(preset)}
              className="rounded-full border border-[#efc6d8] bg-[#fff7fb] px-3 py-2 text-xs font-bold text-[#3f2128] transition hover:border-[#be185d]/45 hover:text-[#be185d]"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1fr_24rem]">
        <div className="space-y-4">
          <section className="rounded-[2rem] border border-[#efc6d8] bg-white p-5 shadow-[0_16px_38px_rgba(63,33,40,0.08)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#be185d]/58">Producto</p>
                <h3 className="mt-1 font-serif text-2xl font-bold text-[#3f2128]">Datos de venta</h3>
              </div>
              <Calculator className="h-5 w-5 text-[#be185d]" />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="md:col-span-2">
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-[#3f2128]/52">Nombre</span>
                <input
                  value={draft.productName}
                  onChange={(event) => updateDraftField('productName', event.target.value)}
                  className="min-h-[48px] w-full rounded-2xl border border-[#efc6d8] bg-[#fff7fb] px-4 py-3 text-sm font-bold text-[#3f2128] outline-none transition focus:border-[#be185d]/45"
                />
              </label>
              <CostNumberField label="Porciones o unidades" value={draft.servings} onChange={(value) => updateDraftField('servings', value)} />
              <CostNumberField label="Precio de venta" value={draft.salePrice} onChange={(value) => updateDraftField('salePrice', value)} />
              <CostNumberField label="Margen objetivo" value={draft.targetMargin} suffix="%" onChange={(value) => updateDraftField('targetMargin', value)} />
              <CostNumberField label="Empaque" value={draft.packagingCost} onChange={(value) => updateDraftField('packagingCost', value)} />
              <CostNumberField label="Decoracion" value={draft.decorationCost} onChange={(value) => updateDraftField('decorationCost', value)} />
            </div>
          </section>

          <section className="rounded-[2rem] border border-[#efc6d8] bg-white p-5 shadow-[0_16px_38px_rgba(63,33,40,0.08)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#be185d]/58">Ingredientes</p>
                <h3 className="mt-1 font-serif text-2xl font-bold text-[#3f2128]">Insumos usados</h3>
                <p className="mt-1 text-xs font-semibold leading-5 text-[#3f2128]/52">
                  Anota solo el costo usado en este producto.
                </p>
              </div>
              <button
                type="button"
                onClick={addIngredient}
                className="inline-flex min-h-[42px] items-center gap-2 rounded-2xl bg-[#be185d] px-4 py-2 text-xs font-bold text-white shadow-[0_12px_26px_rgba(190,24,93,0.18)]"
              >
                <Plus className="h-4 w-4" />
                Agregar
              </button>
            </div>

            <div className="grid gap-2">
              {draft.ingredients.map(item => (
                <div key={item.id} className="grid gap-2 rounded-3xl border border-[#f1d3df] bg-[#fff7fb] p-3 md:grid-cols-[1.25fr_0.9fr_0.7fr_auto] md:items-end">
                  <label>
                    <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#3f2128]/48">Insumo</span>
                    <input value={item.name} onChange={(event) => updateIngredient(item.id, 'name', event.target.value)} className="min-h-[42px] w-full rounded-2xl border border-transparent bg-white px-3 py-2 text-sm font-bold text-[#3f2128] outline-none focus:border-[#be185d]/35" />
                  </label>
                  <label>
                    <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#3f2128]/48">Cantidad</span>
                    <input value={item.quantity} onChange={(event) => updateIngredient(item.id, 'quantity', event.target.value)} className="min-h-[42px] w-full rounded-2xl border border-transparent bg-white px-3 py-2 text-sm font-bold text-[#3f2128] outline-none focus:border-[#be185d]/35" />
                  </label>
                  <label>
                    <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#3f2128]/48">Costo</span>
                    <input type="number" min="0" value={item.cost} onChange={(event) => updateIngredient(item.id, 'cost', event.target.value)} className="min-h-[42px] w-full rounded-2xl border border-transparent bg-white px-3 py-2 text-sm font-bold text-[#3f2128] outline-none focus:border-[#be185d]/35" />
                  </label>
                  <button
                    type="button"
                    onClick={() => removeIngredient(item.id)}
                    disabled={draft.ingredients.length <= 1}
                    className="min-h-[42px] rounded-2xl border border-red-100 bg-white px-3 py-2 text-xs font-bold text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Quitar
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-5 xl:self-start">
          <section className="overflow-hidden rounded-[2rem] border border-[#efc6d8] bg-white shadow-[0_22px_58px_rgba(63,33,40,0.12)]">
            <div className="bg-[linear-gradient(135deg,#3f2128_0%,#6b2b3a_55%,#be185d_100%)] p-5 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/58">Resultado</p>
              <h3 className="mt-2 font-serif text-3xl font-bold">{formatCLP(totals.suggestedPrice)}</h3>
              <p className="mt-1 text-sm font-semibold text-white/72">Precio sugerido para {getCostDraftLabel(draft)}</p>
            </div>
            <div className="grid gap-3 p-5">
              <div className={`rounded-2xl border px-4 py-3 ${statusClass}`}>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] opacity-70">Lectura</p>
                <p className="mt-1 text-sm font-bold">{totals.status.label}</p>
                <p className="mt-1 text-xs font-semibold opacity-75">{totals.status.detail}</p>
              </div>
              <CostSummaryItem label="Costo total" value={formatCLP(totals.totalCost)} />
              <CostSummaryItem label="Precio actual" value={formatCLP(draft.salePrice)} />
              <CostSummaryItem label="Ganancia estimada" value={formatCLP(totals.profit)} />
              <CostSummaryItem label="Margen actual" value={`${totals.margin}%`} />
              <CostSummaryItem label="Costo por porcion" value={formatCLP(totals.costPerServing)} />
              <CostSummaryItem label="Precio por porcion" value={formatCLP(totals.pricePerServing)} />
            </div>
          </section>

          <section className="rounded-[2rem] border border-[#efc6d8] bg-white p-5 shadow-[0_16px_38px_rgba(63,33,40,0.08)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#be185d]/58">Desglose</p>
                <h3 className="mt-1 font-serif text-2xl font-bold text-[#3f2128]">Costo</h3>
              </div>
              <ReceiptText className="h-5 w-5 text-[#be185d]" />
            </div>
            <div className="grid gap-3">
              {totals.breakdown.map(item => (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between gap-3 text-xs font-bold text-[#3f2128]/58">
                    <span>{item.label}</span>
                    <span>{formatCLP(item.value)}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-[#f7dce8]">
                    <span className={`block h-full rounded-full ${item.color}`} style={{ width: item.value ? `${Math.max(8, (item.value / maxBreakdown) * 100)}%` : '0%' }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-[#efc6d8] bg-white p-5 shadow-[0_16px_38px_rgba(63,33,40,0.08)]">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#be185d]/10">
                <PackageCheck className="h-5 w-5 text-[#be185d]" />
              </span>
              <div>
                <h3 className="font-serif text-2xl font-bold text-[#3f2128]">Simple por ahora</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#3f2128]/58">
                  Costos usa ingredientes, empaque y decoracion. Supabase para recetas reales queda para una fase posterior.
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}
