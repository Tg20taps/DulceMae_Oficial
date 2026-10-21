-- DulceMae: catálogo editable, zonas de delivery, costos y pedidos calculados en la base.
-- Correr completo en Supabase SQL Editor (Run sobre todo el script) DESPUÉS de orders.sql.
-- Se puede correr más de una vez: no borra datos.
--
-- Qué cambia:
-- 1. Productos, tamaños y zonas de delivery viven en la base y los edita el admin.
-- 2. El checkout ya no inserta pedidos directo: llama a create_order(), que toma
--    precios y costo de delivery de la base. El navegador sólo manda qué producto,
--    qué tamaño y cuántos; nunca montos.
-- 3. Ingredientes, recetas y lista de compras se guardan en la base (antes quedaban
--    sólo en el navegador).
-- 4. Bucket público "productos" para las fotos; sólo el admin sube y borra.

create extension if not exists pgcrypto;

create or replace function public.is_dulcemae_admin()
returns boolean
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) in (
    'claudiamancilla1978@gmail.com'
  );
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── Catálogo ────────────────────────────────────────────────────────────

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 80),
  category text not null default 'Otros' check (char_length(btrim(category)) between 2 and 40),
  description text check (description is null or char_length(description) <= 400),
  -- Precio del producto, o el menor de sus tamaños ("desde").
  price_clp integer not null check (price_clp between 1 and 5000000),
  image_url text check (image_url is null or char_length(image_url) <= 600),
  image_path text check (image_path is null or char_length(image_path) <= 300),
  is_visible boolean not null default true,
  is_available boolean not null default true,
  is_featured boolean not null default false,
  suggest_in_cart boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_visible_order_idx on public.products (is_visible, sort_order);

create table if not exists public.product_options (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  label text not null check (char_length(btrim(label)) between 1 and 60),
  price_clp integer not null check (price_clp between 1 and 5000000),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists product_options_product_idx on public.product_options (product_id, sort_order);

drop trigger if exists products_touch_updated_at on public.products;
create trigger products_touch_updated_at
before update on public.products
for each row execute function public.touch_updated_at();

-- ── Zonas de delivery ───────────────────────────────────────────────────

create table if not exists public.delivery_zones (
  id text primary key check (id ~ '^[a-z0-9_]{2,40}$'),
  label text not null check (char_length(btrim(label)) between 2 and 60),
  note text check (note is null or char_length(note) <= 200),
  fee_clp integer not null default 0 check (fee_clp between 0 and 200000),
  -- false = el costo se coordina por WhatsApp (fuera de zona).
  fee_known boolean not null default true,
  is_active boolean not null default true,
  sort_order integer not null default 0
);

insert into public.delivery_zones (id, label, note, fee_clp, fee_known, sort_order) values
  ('alerce_cercano', 'Alerce cercano', 'Costo fijo para sectores cercanos de Alerce.', 3000, true, 1),
  ('puerto_montt', 'Puerto Montt / sectores', 'Costo fijo para Puerto Montt y sectores disponibles.', 5500, true, 2),
  ('fuera_zona', 'Fuera de zona', 'Se coordina disponibilidad y costo antes de confirmar el pedido.', 0, false, 3)
on conflict (id) do nothing;

-- ── Costos ──────────────────────────────────────────────────────────────

create table if not exists public.ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 60),
  -- Cómo se compra: pack_amount en unit por pack_price_clp. Ej: 1 kg a $1.290.
  unit text not null default 'kg' check (unit in ('kg', 'g', 'l', 'ml', 'un')),
  pack_amount numeric(12, 3) not null default 1 check (pack_amount > 0),
  pack_price_clp integer check (pack_price_clp is null or pack_price_clp between 0 and 5000000),
  -- Lista de compras: ok = hay, low = queda poco, out = se acabó.
  stock_level text not null default 'ok' check (stock_level in ('ok', 'low', 'out')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists ingredients_name_key on public.ingredients (lower(btrim(name)));

drop trigger if exists ingredients_touch_updated_at on public.ingredients;
create trigger ingredients_touch_updated_at
before update on public.ingredients
for each row execute function public.touch_updated_at();

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 80),
  yield_count integer not null default 1 check (yield_count between 1 and 1000),
  yield_label text not null default 'porciones' check (yield_label in ('porciones', 'unidades')),
  work_minutes integer not null default 0 check (work_minutes between 0 and 6000),
  sale_price_clp integer check (sale_price_clp is null or sale_price_clp between 0 and 5000000),
  notes text check (notes is null or char_length(notes) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists recipes_touch_updated_at on public.recipes;
create trigger recipes_touch_updated_at
before update on public.recipes
for each row execute function public.touch_updated_at();

create table if not exists public.recipe_items (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  -- Una línea es un ingrediente con cantidad (en g, ml o un) o un gasto fijo con monto.
  ingredient_id uuid references public.ingredients (id) on delete restrict,
  amount numeric(12, 3) check (amount is null or amount > 0),
  label text check (label is null or char_length(btrim(label)) between 1 and 80),
  cost_clp integer check (cost_clp is null or cost_clp between 0 and 5000000),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint recipe_items_kind check (
    (ingredient_id is not null and amount is not null and label is null and cost_clp is null)
    or (ingredient_id is null and amount is null and label is not null and cost_clp is not null)
  )
);

create index if not exists recipe_items_recipe_idx on public.recipe_items (recipe_id, sort_order);
create index if not exists recipe_items_ingredient_idx on public.recipe_items (ingredient_id);

create table if not exists public.app_settings (
  key text primary key check (key ~ '^[a-z0-9_]{2,40}$'),
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (key, value) values
  ('costos', '{"valor_hora_clp": 3500, "ganancia_pct": 30}'::jsonb)
on conflict (key) do nothing;

-- ── Permisos ────────────────────────────────────────────────────────────

alter table public.products enable row level security;
alter table public.product_options enable row level security;
alter table public.delivery_zones enable row level security;
alter table public.ingredients enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_items enable row level security;
alter table public.app_settings enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.products, public.product_options, public.delivery_zones to anon, authenticated;
grant insert, update, delete on public.products, public.product_options, public.delivery_zones to authenticated;
grant select, insert, update, delete on public.ingredients, public.recipes, public.recipe_items, public.app_settings to authenticated;
revoke all on public.ingredients, public.recipes, public.recipe_items, public.app_settings from anon;

drop policy if exists "Catalogo visible para todos" on public.products;
create policy "Catalogo visible para todos" on public.products
for select to anon, authenticated
using (is_visible or public.is_dulcemae_admin());

drop policy if exists "Admin edita productos" on public.products;
create policy "Admin edita productos" on public.products
for all to authenticated
using (public.is_dulcemae_admin())
with check (public.is_dulcemae_admin());

drop policy if exists "Tamanos visibles para todos" on public.product_options;
create policy "Tamanos visibles para todos" on public.product_options
for select to anon, authenticated
using (exists (
  select 1 from public.products p
  where p.id = product_id and (p.is_visible or public.is_dulcemae_admin())
));

drop policy if exists "Admin edita tamanos" on public.product_options;
create policy "Admin edita tamanos" on public.product_options
for all to authenticated
using (public.is_dulcemae_admin())
with check (public.is_dulcemae_admin());

drop policy if exists "Zonas activas para todos" on public.delivery_zones;
create policy "Zonas activas para todos" on public.delivery_zones
for select to anon, authenticated
using (is_active or public.is_dulcemae_admin());

drop policy if exists "Admin edita zonas" on public.delivery_zones;
create policy "Admin edita zonas" on public.delivery_zones
for all to authenticated
using (public.is_dulcemae_admin())
with check (public.is_dulcemae_admin());

drop policy if exists "Admin maneja ingredientes" on public.ingredients;
create policy "Admin maneja ingredientes" on public.ingredients
for all to authenticated
using (public.is_dulcemae_admin())
with check (public.is_dulcemae_admin());

drop policy if exists "Admin maneja recetas" on public.recipes;
create policy "Admin maneja recetas" on public.recipes
for all to authenticated
using (public.is_dulcemae_admin())
with check (public.is_dulcemae_admin());

drop policy if exists "Admin maneja lineas de receta" on public.recipe_items;
create policy "Admin maneja lineas de receta" on public.recipe_items
for all to authenticated
using (public.is_dulcemae_admin())
with check (public.is_dulcemae_admin());

drop policy if exists "Admin maneja ajustes" on public.app_settings;
create policy "Admin maneja ajustes" on public.app_settings
for all to authenticated
using (public.is_dulcemae_admin())
with check (public.is_dulcemae_admin());

-- ── Guardar producto con sus tamaños en un solo paso ────────────────────

create or replace function public.save_product(p_product jsonb)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_id uuid := nullif(p_product ->> 'id', '')::uuid;
  v_options jsonb := coalesce(p_product -> 'options', '[]'::jsonb);
  v_price integer;
begin
  if not public.is_dulcemae_admin() then
    raise exception 'Sólo el admin puede editar el catálogo.';
  end if;

  if jsonb_typeof(v_options) <> 'array' or jsonb_array_length(v_options) > 12 then
    raise exception 'Revisa los tamaños: máximo 12.';
  end if;

  if jsonb_array_length(v_options) > 0 then
    select min((o.value ->> 'price_clp')::integer) into v_price
    from jsonb_array_elements(v_options) as o(value);
  else
    v_price := (p_product ->> 'price_clp')::integer;
  end if;

  if v_price is null or v_price < 1 then
    raise exception 'Falta el precio.';
  end if;

  if v_id is null then
    insert into public.products (
      name, category, description, price_clp, image_url, image_path,
      is_visible, is_available, is_featured, suggest_in_cart, sort_order
    ) values (
      btrim(p_product ->> 'name'),
      btrim(coalesce(nullif(p_product ->> 'category', ''), 'Otros')),
      nullif(btrim(coalesce(p_product ->> 'description', '')), ''),
      v_price,
      nullif(p_product ->> 'image_url', ''),
      nullif(p_product ->> 'image_path', ''),
      coalesce((p_product ->> 'is_visible')::boolean, true),
      coalesce((p_product ->> 'is_available')::boolean, true),
      coalesce((p_product ->> 'is_featured')::boolean, false),
      coalesce((p_product ->> 'suggest_in_cart')::boolean, false),
      (select coalesce(max(sort_order), 0) + 1 from public.products)
    )
    returning id into v_id;
  else
    update public.products set
      name = btrim(p_product ->> 'name'),
      category = btrim(coalesce(nullif(p_product ->> 'category', ''), 'Otros')),
      description = nullif(btrim(coalesce(p_product ->> 'description', '')), ''),
      price_clp = v_price,
      image_url = nullif(p_product ->> 'image_url', ''),
      image_path = nullif(p_product ->> 'image_path', ''),
      is_visible = coalesce((p_product ->> 'is_visible')::boolean, is_visible),
      is_available = coalesce((p_product ->> 'is_available')::boolean, is_available),
      is_featured = coalesce((p_product ->> 'is_featured')::boolean, is_featured),
      suggest_in_cart = coalesce((p_product ->> 'suggest_in_cart')::boolean, suggest_in_cart)
    where id = v_id;

    if not found then
      raise exception 'Ese producto ya no existe.';
    end if;
  end if;

  delete from public.product_options where product_id = v_id;
  insert into public.product_options (product_id, label, price_clp, sort_order)
  select v_id, btrim(o.value ->> 'label'), (o.value ->> 'price_clp')::integer, o.ordinality::integer
  from jsonb_array_elements(v_options) with ordinality as o(value, ordinality);

  return v_id;
end;
$$;

revoke all on function public.save_product(jsonb) from public;
grant execute on function public.save_product(jsonb) to authenticated;

-- ── Guardar receta con sus líneas en un solo paso ───────────────────────

create or replace function public.save_recipe(p_recipe jsonb)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_id uuid := nullif(p_recipe ->> 'id', '')::uuid;
  v_items jsonb := coalesce(p_recipe -> 'items', '[]'::jsonb);
begin
  if not public.is_dulcemae_admin() then
    raise exception 'Sólo el admin puede editar recetas.';
  end if;

  if jsonb_typeof(v_items) <> 'array' or jsonb_array_length(v_items) > 60 then
    raise exception 'Revisa la receta: máximo 60 líneas.';
  end if;

  if v_id is null then
    insert into public.recipes (name, yield_count, yield_label, work_minutes, sale_price_clp, notes)
    values (
      btrim(p_recipe ->> 'name'),
      coalesce((p_recipe ->> 'yield_count')::integer, 1),
      coalesce(nullif(p_recipe ->> 'yield_label', ''), 'porciones'),
      coalesce((p_recipe ->> 'work_minutes')::integer, 0),
      nullif(p_recipe ->> 'sale_price_clp', '')::integer,
      nullif(btrim(coalesce(p_recipe ->> 'notes', '')), '')
    )
    returning id into v_id;
  else
    update public.recipes set
      name = btrim(p_recipe ->> 'name'),
      yield_count = coalesce((p_recipe ->> 'yield_count')::integer, 1),
      yield_label = coalesce(nullif(p_recipe ->> 'yield_label', ''), 'porciones'),
      work_minutes = coalesce((p_recipe ->> 'work_minutes')::integer, 0),
      sale_price_clp = nullif(p_recipe ->> 'sale_price_clp', '')::integer,
      notes = nullif(btrim(coalesce(p_recipe ->> 'notes', '')), '')
    where id = v_id;

    if not found then
      raise exception 'Esa receta ya no existe.';
    end if;
  end if;

  delete from public.recipe_items where recipe_id = v_id;
  insert into public.recipe_items (recipe_id, ingredient_id, amount, label, cost_clp, sort_order)
  select
    v_id,
    nullif(i.value ->> 'ingredient_id', '')::uuid,
    nullif(i.value ->> 'amount', '')::numeric,
    nullif(btrim(coalesce(i.value ->> 'label', '')), ''),
    nullif(i.value ->> 'cost_clp', '')::integer,
    i.ordinality::integer
  from jsonb_array_elements(v_items) with ordinality as i(value, ordinality);

  return v_id;
end;
$$;

revoke all on function public.save_recipe(jsonb) from public;
grant execute on function public.save_recipe(jsonb) to authenticated;

-- ── Crear pedido desde la web ───────────────────────────────────────────
-- El navegador manda: cliente, entrega, pago y [{product_id, option_id, quantity}].
-- Precios, costo de delivery y totales salen de la base.

create or replace function public.create_order(p_order jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_customer jsonb := coalesce(p_order -> 'customer', '{}'::jsonb);
  v_fulfillment jsonb := coalesce(p_order -> 'fulfillment', '{}'::jsonb);
  v_name text := btrim(coalesce(v_customer ->> 'name', ''));
  v_phone text := btrim(coalesce(v_customer ->> 'phone', ''));
  v_time text := btrim(coalesce(v_customer ->> 'preferred_time', ''));
  v_comments text := nullif(btrim(coalesce(v_customer ->> 'comments', '')), '');
  v_type text := coalesce(v_fulfillment ->> 'type', '');
  v_address_mode text := coalesce(nullif(v_fulfillment ->> 'address_mode', ''), 'write');
  v_address text := nullif(btrim(coalesce(v_fulfillment ->> 'address', '')), '');
  v_payment text := coalesce(p_order -> 'payment' ->> 'method', '');
  v_raw_items jsonb := coalesce(p_order -> 'items', '[]'::jsonb);
  v_today date := (now() at time zone 'America/Santiago')::date;
  v_date date;
  v_zone public.delivery_zones;
  v_product public.products;
  v_option public.product_options;
  v_has_options boolean;
  v_item jsonb;
  v_quantity integer;
  v_unit_price integer;
  v_line_name text;
  v_items jsonb := '[]'::jsonb;
  v_subtotal integer := 0;
  v_count integer := 0;
  v_fee integer := 0;
  v_fee_pending boolean := false;
  v_order_id text;
  v_summary jsonb;
begin
  if char_length(v_name) < 3 or char_length(v_name) > 80 then
    raise exception 'Ingresa tu nombre completo.';
  end if;

  if v_phone !~ '^\+56 9 [0-9]{4} [0-9]{4}$' then
    raise exception 'Ingresa un celular chileno válido.';
  end if;

  begin
    v_date := (v_customer ->> 'delivery_date')::date;
  exception when others then
    v_date := null;
  end;

  if v_date is null then
    raise exception 'Elige una fecha de entrega.';
  end if;

  if v_date < v_today + 2 then
    raise exception 'Elige una fecha con al menos 48 horas de anticipación.';
  end if;

  if v_date > v_today + 180 then
    raise exception 'Elige una fecha dentro de los próximos 6 meses.';
  end if;

  if v_time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then
    raise exception 'Indica una hora preferida.';
  end if;

  if v_comments is not null and char_length(v_comments) > 800 then
    raise exception 'El detalle extra es muy largo (máximo 800 letras).';
  end if;

  if v_payment not in ('transfer', 'cash') then
    raise exception 'Elige transferencia o efectivo.';
  end if;

  if v_type = 'delivery' then
    select * into v_zone from public.delivery_zones
    where id = v_fulfillment ->> 'delivery_zone' and is_active;

    if not found then
      raise exception 'Elige un sector para el delivery.';
    end if;

    if v_address_mode not in ('write', 'whatsapp_location') then
      raise exception 'Indica cómo nos compartes la dirección.';
    end if;

    if v_address_mode = 'write' and coalesce(char_length(v_address), 0) < 8 then
      raise exception 'Agrega una dirección clara para el delivery.';
    end if;

    if v_address_mode = 'whatsapp_location' then
      v_address := null;
    end if;

    v_fee := case when v_zone.fee_known then v_zone.fee_clp else 0 end;
    v_fee_pending := not v_zone.fee_known;
  elsif v_type = 'pickup' then
    v_address := null;
  else
    raise exception 'Elige retiro o delivery.';
  end if;

  if jsonb_typeof(v_raw_items) <> 'array' or jsonb_array_length(v_raw_items) = 0 then
    raise exception 'Tu carro está vacío.';
  end if;

  if jsonb_array_length(v_raw_items) > 30 then
    raise exception 'El pedido tiene demasiados productos distintos.';
  end if;

  for v_item in select value from jsonb_array_elements(v_raw_items) loop
    begin
      v_quantity := (v_item ->> 'quantity')::integer;
      select * into v_product from public.products
      where id = (v_item ->> 'product_id')::uuid and is_visible;
    exception when others then
      raise exception 'Uno de los productos del carro no es válido. Vacía el carro y vuelve a elegir.';
    end;

    if v_product.id is null then
      raise exception 'Uno de los productos del carro ya no está en el catálogo. Revisa tu carro.';
    end if;

    if not v_product.is_available then
      raise exception '% está agotado por ahora. Quítalo del carro para seguir.', v_product.name;
    end if;

    if v_quantity is null or v_quantity < 1 or v_quantity > 50 then
      raise exception 'Revisa la cantidad de %.', v_product.name;
    end if;

    select exists (select 1 from public.product_options where product_id = v_product.id)
    into v_has_options;

    v_option := null;
    if v_has_options then
      begin
        select * into v_option from public.product_options
        where id = nullif(v_item ->> 'option_id', '')::uuid and product_id = v_product.id;
      exception when others then
        v_option := null;
      end;

      if v_option.id is null then
        raise exception 'Elige el tamaño de %.', v_product.name;
      end if;

      v_unit_price := v_option.price_clp;
      v_line_name := v_product.name || ' (' || v_option.label || ')';
    else
      v_unit_price := v_product.price_clp;
      v_line_name := v_product.name;
    end if;

    v_items := v_items || jsonb_build_array(jsonb_build_object(
      'id', v_product.id,
      'product_id', v_product.id,
      'option_id', v_option.id,
      'name', v_line_name,
      'product_name', v_product.name,
      'option_label', v_option.label,
      'category', v_product.category,
      'unit_price', v_unit_price,
      'quantity', v_quantity,
      'subtotal', v_unit_price * v_quantity
    ));
    v_subtotal := v_subtotal + v_unit_price * v_quantity;
    v_count := v_count + v_quantity;
    v_product := null;
  end loop;

  v_summary := jsonb_build_object(
    'item_count', v_count,
    'subtotal_products_clp', v_subtotal,
    'delivery_fee_clp', v_fee,
    'delivery_fee_pending', v_fee_pending,
    'total_clp', v_subtotal + v_fee
  );

  for attempt in 1..3 loop
    v_order_id := 'DM-' || to_char(now() at time zone 'America/Santiago', 'YYMMDD') || '-'
      || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 5));
    begin
      insert into public.orders (
        order_id, status, source, channel,
        customer_name, customer_phone, delivery_date, preferred_time,
        fulfillment_type, fulfillment_label, address,
        delivery_zone, delivery_zone_label, delivery_fee_clp, delivery_fee_known,
        delivery_fee_pending, delivery_note,
        payment_method, payment_label, comments,
        item_count, subtotal_products_clp, total_clp, items, payload
      ) values (
        v_order_id, 'pending', 'checkout_web', 'whatsapp_web',
        v_name, v_phone, v_date, v_time,
        v_type, case when v_type = 'delivery' then 'Delivery' else 'Retiro' end, v_address,
        v_zone.id, v_zone.label, v_fee, not v_fee_pending,
        v_fee_pending, v_zone.note,
        v_payment, case when v_payment = 'cash' then 'Efectivo' else 'Transferencia' end, v_comments,
        v_count, v_subtotal, v_subtotal + v_fee, v_items,
        jsonb_build_object(
          'customer', v_customer,
          'fulfillment', v_fulfillment || jsonb_build_object('address_mode', v_address_mode),
          'payment', p_order -> 'payment',
          'items', v_items,
          'summary', v_summary
        )
      );
      exit;
    exception when unique_violation then
      if attempt = 3 then
        raise;
      end if;
    end;
  end loop;

  return jsonb_build_object('order_id', v_order_id, 'items', v_items) || v_summary;
end;
$$;

revoke all on function public.create_order(jsonb) from public;
grant execute on function public.create_order(jsonb) to anon, authenticated;

-- El checkout ya no inserta directo: sólo por create_order().
drop policy if exists "Public checkout can create orders" on public.orders;
revoke insert on public.orders from anon, authenticated;

-- ── Fotos de productos ──────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('productos', 'productos', true, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admin ve fotos de productos" on storage.objects;
create policy "Admin ve fotos de productos" on storage.objects
for select to authenticated
using (bucket_id = 'productos' and public.is_dulcemae_admin());

drop policy if exists "Admin sube fotos de productos" on storage.objects;
create policy "Admin sube fotos de productos" on storage.objects
for insert to authenticated
with check (bucket_id = 'productos' and public.is_dulcemae_admin());

drop policy if exists "Admin borra fotos de productos" on storage.objects;
create policy "Admin borra fotos de productos" on storage.objects
for delete to authenticated
using (bucket_id = 'productos' and public.is_dulcemae_admin());

-- ── Productos de ejemplo (ocultos) ──────────────────────────────────────
-- Sólo si el catálogo está vacío. Quedan ocultos: tu mamá los edita con sus
-- productos reales y los muestra cuando estén listos.

insert into public.products (name, category, description, price_clp, image_url, is_visible, sort_order)
select v.name, v.category, v.description, v.price_clp, v.image_url, false, v.sort_order
from (values
  ('Torta de Chocolate y Frambuesa', 'Tortas', 'Bizcocho húmedo de cacao con relleno de ganache y mermelada artesanal de frambuesa.', 25000, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=800', 1),
  ('Kuchen de Nuez', 'Kuchen', 'Receta del sur: masa suave con abundante relleno de nueces y manjar.', 15000, 'https://images.unsplash.com/photo-1519869325930-281384150729?auto=format&fit=crop&q=80&w=800', 2),
  ('Caja de Alfajores', 'Alfajores', 'Seis alfajores de maicena con manjar, bañados en chocolate.', 12000, 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&q=80&w=800', 3),
  ('Torta Red Velvet', 'Tortas', 'Torta aterciopelada con frosting de queso crema.', 28000, 'https://images.unsplash.com/photo-1616541823729-00fe0aacd32c?auto=format&fit=crop&q=80&w=800', 4),
  ('Kuchen de Manzana', 'Kuchen', 'Manzanas caramelizadas con canela sobre masa crujiente.', 14000, 'https://images.unsplash.com/photo-1568430462989-44163eb17ab2?auto=format&fit=crop&q=80&w=800', 5),
  ('Cheesecake de Frutos Rojos', 'Postres', 'Suave y cremoso sobre base de galleta, con salsa de frutos rojos.', 22000, 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&q=80&w=800', 6)
) as v(name, category, description, price_clp, image_url, sort_order)
where not exists (select 1 from public.products);
