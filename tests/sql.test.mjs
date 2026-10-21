// Prueba supabase/catalogo_y_costos.sql sobre Postgres real (PGlite) con un
// Supabase mínimo simulado (roles anon/authenticated, auth.jwt() y storage).
// Correr con: npm test
import { test } from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

// PGlite no trae pgcrypto; gen_random_uuid() ya viene en Postgres.
const read = f => readFileSync(new URL(`../supabase/${f}`, import.meta.url), 'utf8')
  .replace(/create extension if not exists pgcrypto;/g, '');

const ADMIN = 'claudiamancilla1978@gmail.com';
const db = new PGlite();

await db.exec(`
  create role anon nologin; create role authenticated nologin;
  create schema auth;
  create function auth.jwt() returns jsonb language sql stable as
    $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
  grant usage on schema auth to anon, authenticated;
  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid default gen_random_uuid(), bucket_id text, name text);
  alter table storage.objects enable row level security;
`);

await db.exec(read('orders.sql'));
await db.exec(read('fix_orders_access.sql'));
await db.exec(read('catalogo_y_costos.sql'));
await db.exec(read('catalogo_y_costos.sql')); // dos veces: no debe fallar ni duplicar

async function as(role, email, sql, params = []) {
  await db.exec('begin');
  try {
    await db.exec(`set local role ${role}`);
    await db.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify(email ? { email } : {})]);
    const r = await db.query(sql, params);
    await db.exec('commit');
    return r.rows;
  } catch (e) {
    await db.exec('rollback');
    throw e;
  }
}
const anon = (sql, p) => as('anon', null, sql, p);
const admin = (sql, p) => as('authenticated', ADMIN, sql, p);
async function fails(promise, pattern, label) {
  try { await promise; } catch (e) {
    assert.match(e.message, pattern, `${label}: mensaje inesperado "${e.message}"`);
    return;
  }
  assert.fail(`${label}: debía fallar`);
}

test('catálogo, pedidos calculados en la base y costos', async () => {
  // Catálogo
  assert.equal((await anon('select count(*)::int n from products'))[0].n, 0);
  assert.equal((await admin('select count(*)::int n from products'))[0].n, 6);

  const [{ id: torta }] = await admin(`select save_product($1::jsonb) id`, [JSON.stringify({
    name: 'Torta Tres Leches', category: 'Tortas', price_clp: 999,
    options: [{ label: '15 personas', price_clp: 26000 }, { label: '25 personas', price_clp: 38000 }],
  })]);
  const [prod] = await anon('select price_clp from products where id = $1', [torta]);
  assert.equal(prod.price_clp, 26000);
  const opts = await anon('select id, label, price_clp from product_options where product_id = $1 order by sort_order', [torta]);
  assert.equal(opts.length, 2);
  assert.equal((await anon('select count(*)::int n from product_options'))[0].n, 2);

  const [{ id: kuchen }] = await admin(`select save_product($1::jsonb) id`, [JSON.stringify({
    name: 'Kuchen de Nuez', category: 'Kuchen', price_clp: 15000, options: [],
  })]);
  const [{ id: agotado }] = await admin(`select save_product($1::jsonb) id`, [JSON.stringify({
    name: 'Pie de Limón', category: 'Postres', price_clp: 12000, is_available: false,
  })]);
  const [{ id: oculto }] = await admin(`select id from products where not is_visible limit 1`);

  // Editar: cambiar tamaños reemplaza los anteriores
  await admin(`select save_product($1::jsonb)`, [JSON.stringify({
    id: torta, name: 'Torta Tres Leches', category: 'Tortas',
    options: [{ label: '15 personas', price_clp: 27000 }, { label: '25 personas', price_clp: 39000 }, { label: '35 personas', price_clp: 52000 }],
  })]);
  const opts2 = await anon('select id, label, price_clp from product_options where product_id = $1 order by sort_order', [torta]);
  assert.deepEqual(opts2.map(o => o.price_clp), [27000, 39000, 52000]);

  await fails(as('authenticated', 'otra@persona.cl', `select save_product('{"name":"X","price_clp":1}'::jsonb)`), /admin/, 'otro usuario no edita catálogo');
  await fails(anon(`insert into products (name, price_clp) values ('Hack', 1)`), /permission|policy/, 'anon no inserta productos');

  // Pedidos
  const fecha = (await db.query(`select ((now() at time zone 'America/Santiago')::date + 3)::text d`)).rows[0].d;
  const base = {
    customer: { name: 'Ana Pérez', phone: '+56 9 1234 5678', delivery_date: fecha, preferred_time: '15:30', comments: 'Feliz cumple' },
    fulfillment: { type: 'pickup' },
    payment: { method: 'transfer' },
    items: [
      { product_id: torta, option_id: opts2[1].id, quantity: 1, unit_price: 1 },
      { product_id: kuchen, quantity: 2, price: 1 },
    ],
  };
  const [{ r }] = await anon('select create_order($1::jsonb) r', [JSON.stringify(base)]);
  assert.equal(r.subtotal_products_clp, 39000 + 30000);
  assert.equal(r.total_clp, 69000);
  assert.equal(r.item_count, 3);
  assert.equal(r.items[0].name, 'Torta Tres Leches (25 personas)');
  assert.match(r.order_id, /^DM-\d{6}-[0-9A-F]{5}$/);

  const delivery = { ...base, fulfillment: { type: 'delivery', delivery_zone: 'puerto_montt', address_mode: 'write', address: 'Av. Presidente Ibáñez 1234' } };
  const [{ r: rd }] = await anon('select create_order($1::jsonb) r', [JSON.stringify(delivery)]);
  assert.equal(rd.delivery_fee_clp, 5500);
  assert.equal(rd.total_clp, 69000 + 5500);
  const fuera = { ...base, fulfillment: { type: 'delivery', delivery_zone: 'fuera_zona', address_mode: 'whatsapp_location' } };
  const [{ r: rf }] = await anon('select create_order($1::jsonb) r', [JSON.stringify(fuera)]);
  assert.equal(rf.delivery_fee_pending, true);
  assert.equal(rf.delivery_fee_clp, 0);

  const variant = (patch) => JSON.stringify({ ...base, ...patch });
  await fails(anon('select create_order($1::jsonb)', [variant({ items: [{ product_id: torta, quantity: 1 }] })]), /tamaño/, 'falta tamaño');
  await fails(anon('select create_order($1::jsonb)', [variant({ items: [{ product_id: agotado, quantity: 1 }] })]), /agotado/, 'producto agotado');
  await fails(anon('select create_order($1::jsonb)', [variant({ items: [{ product_id: oculto, quantity: 1 }] })]), /ya no está/, 'producto oculto');
  await fails(anon('select create_order($1::jsonb)', [variant({ items: [{ product_id: 'no-es-uuid', quantity: 1 }] })]), /no es válido/, 'id inválido');
  await fails(anon('select create_order($1::jsonb)', [variant({ items: [{ product_id: kuchen, quantity: 0 }] })]), /cantidad/, 'cantidad 0');
  await fails(anon('select create_order($1::jsonb)', [variant({ items: [] })]), /vacío/, 'carro vacío');
  await fails(anon('select create_order($1::jsonb)', [variant({ customer: { ...base.customer, phone: '123' } })]), /celular/, 'teléfono');
  await fails(anon('select create_order($1::jsonb)', [variant({ customer: { ...base.customer, delivery_date: '2020-01-01' } })]), /48 horas/, 'fecha pasada');
  await fails(anon('select create_order($1::jsonb)', [variant({ fulfillment: { type: 'delivery', address_mode: 'write', address: 'Calle 123 casa 4' } })]), /sector/, 'delivery sin sector');
  await fails(anon('select create_order($1::jsonb)', [variant({ fulfillment: { type: 'delivery', delivery_zone: 'alerce_cercano', address_mode: 'write', address: 'x' } })]), /dirección/, 'delivery sin dirección');
  await fails(anon('select create_order($1::jsonb)', [variant({ payment: { method: 'bitcoin' } })]), /transferencia/, 'medio de pago');

  await fails(anon(`insert into orders (order_id, customer_name, customer_phone, delivery_date, preferred_time, fulfillment_type, fulfillment_label, payment_method, payment_label, total_clp) values ('X','a','b','2030-01-01','10:00','pickup','R','transfer','T',1)`), /permission/, 'anon no inserta pedidos directo');
  await fails(anon('select count(*) from orders'), /permission/, 'anon no lee pedidos');
  const pedidos = await admin('select order_id, total_clp, status, items from orders order by created_at');
  assert.equal(pedidos.length, 3);
  assert.equal(pedidos[0].status, 'pending');

  // Costos
  await fails(anon('select * from ingredients'), /permission/, 'anon no ve ingredientes');
  const [{ id: harina }] = await admin(`insert into ingredients (name, unit, pack_amount, pack_price_clp) values ('Harina', 'kg', 1, 1290) returning id`);
  await fails(admin(`insert into ingredients (name, unit, pack_amount) values (' harina ', 'kg', 1)`), /duplicate|unique/, 'ingrediente repetido');
  const [{ id: receta }] = await admin(`select save_recipe($1::jsonb) id`, [JSON.stringify({
    name: 'Torta 15 personas', yield_count: 15, work_minutes: 180, sale_price_clp: 26000,
    items: [{ ingredient_id: harina, amount: 500 }, { label: 'Caja y base', cost_clp: 1800 }],
  })]);
  assert.equal((await admin('select count(*)::int n from recipe_items where recipe_id = $1', [receta]))[0].n, 2);
  await admin(`select save_recipe($1::jsonb)`, [JSON.stringify({ id: receta, name: 'Torta 15 personas', yield_count: 15, items: [{ ingredient_id: harina, amount: 600 }] })]);
  assert.equal((await admin('select count(*)::int n from recipe_items where recipe_id = $1', [receta]))[0].n, 1);
  await fails(admin('delete from ingredients where id = $1', [harina]), /foreign key|violates/, 'no borra ingrediente usado en receta');
  await fails(admin(`select save_recipe($1::jsonb)`, [JSON.stringify({ name: 'Mala', items: [{ ingredient_id: harina }] })]), /recipe_items_kind/, 'línea sin cantidad');
  await admin('delete from recipes where id = $1', [receta]);
  await admin('delete from ingredients where id = $1', [harina]);

  // Fotos de la página: todos las ven, sólo el admin las cambia.
  assert.equal((await anon('select count(*)::int n from site_photos'))[0].n, 3);
  await fails(anon(`update site_photos set caption = 'x'`), /permission/, 'anon no cambia fotos de la página');
  await admin(`update site_photos set image_url = 'https://ejemplo.cl/a.webp', image_path = '2026-10/a.webp' where slot = 'nosotros_1'`);
  assert.equal((await anon(`select image_url from site_photos where slot = 'nosotros_1'`))[0].image_url, 'https://ejemplo.cl/a.webp');

  const [settings] = await admin(`select value from app_settings where key = 'costos'`);
  assert.equal(settings.value.valor_hora_clp, 3500);
  assert.equal((await db.query(`select count(*)::int n from storage.buckets where id = 'productos' and public`)).rows[0].n, 1);
});
