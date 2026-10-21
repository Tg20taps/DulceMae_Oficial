// Cálculo de la calculadora de costos. Correr con: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calcularReceta,
  describirCompra,
  precioPorUnidadBase,
  redondearHaciaArriba,
  textoListaDeCompras,
} from '../src/components/admin/costos.js';

const formato = n => `$${n.toLocaleString('es-CL')}`;
const harina = { id: 'h', name: 'Harina', unit: 'kg', pack_amount: 1, pack_price_clp: 1290 };
const huevos = { id: 'e', name: 'Huevos', unit: 'un', pack_amount: 30, pack_price_clp: 6000 };
const manjar = { id: 'm', name: 'Manjar', unit: 'kg', pack_amount: 1, pack_price_clp: null };
const ingredientes = new Map([harina, huevos, manjar].map(i => [i.id, i]));
const ajustes = { valor_hora_clp: 3500, ganancia_pct: 30 };
const torta = {
  yield_count: 15,
  work_minutes: 180,
  sale_price_clp: 26000,
  items: [
    { ingredient_id: 'h', amount: 500 },
    { ingredient_id: 'e', amount: 6 },
    { ingredient_id: 'm', amount: 800 },
    { label: 'Caja y base', cost_clp: 1800 },
  ],
};

test('precio por gramo o unidad según cómo se compra', () => {
  assert.equal(precioPorUnidadBase(harina), 1.29);
  assert.equal(precioPorUnidadBase(huevos), 200);
  assert.equal(precioPorUnidadBase(manjar), null);
  assert.equal(precioPorUnidadBase({ unit: 'l', pack_amount: 1, pack_price_clp: 1000 }), 1);
});

test('describe la compra en palabras', () => {
  assert.equal(describirCompra(harina, formato), '$1.290 el kg');
  assert.equal(describirCompra(huevos, formato), '$6.000 por 30 unidades');
  assert.equal(describirCompra(manjar, formato), 'Falta el precio');
});

test('receta: ingredientes, gastos, trabajo y precio sugerido', () => {
  const r = calcularReceta(torta, ingredientes, ajustes);
  assert.equal(r.ingredientes, 645 + 1200);
  assert.equal(r.otros, 1800);
  assert.equal(r.trabajo, 10500);
  assert.equal(r.costoTotal, 14145);
  // 14.145 × 1,3 = 18.388,5 → se redondea hacia arriba a $500
  assert.equal(r.sugerido, 18500);
  assert.equal(r.sugeridoPorPorcion, 1233);
  assert.deepEqual(r.faltanPrecios, ['Manjar']);
});

test('semáforo del precio de venta', () => {
  const tono = venta => calcularReceta({ ...torta, sale_price_clp: venta }, ingredientes, ajustes).veredicto.tono;
  assert.equal(tono(3000), 'rojo');
  assert.equal(tono(9000), 'naranjo');
  assert.equal(tono(16000), 'amarillo');
  assert.equal(tono(18500), 'verde');
  assert.equal(calcularReceta({ ...torta, sale_price_clp: 9000 }, ingredientes, ajustes).veredicto.porHora, 1785);
  assert.equal(calcularReceta({ ...torta, sale_price_clp: null }, ingredientes, ajustes).veredicto, null);
});

test('redondeo y lista de compras', () => {
  assert.equal(redondearHaciaArriba(18001), 18500);
  assert.equal(redondearHaciaArriba(0), 0);
  const texto = textoListaDeCompras([
    { name: 'Harina', stock_level: 'out' },
    { name: 'Manjar', stock_level: 'low' },
    { name: 'Leche', stock_level: 'ok' },
  ], 'DulceMae');
  assert.equal(texto, 'Lista de compras DulceMae\n\nSe acabó:\n- Harina\n\nQueda poco:\n- Manjar');
});
