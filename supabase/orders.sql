-- DulceMae orders schema
-- Run this in Supabase SQL Editor after replacing the admin email if needed.

create extension if not exists pgcrypto;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_id text not null unique,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
  source text not null default 'checkout_web',
  channel text not null default 'whatsapp_web',
  customer_name text not null,
  customer_phone text not null,
  delivery_date date not null,
  preferred_time text not null,
  fulfillment_type text not null check (fulfillment_type in ('pickup', 'delivery')),
  fulfillment_label text not null,
  address text,
  delivery_zone text,
  delivery_zone_label text,
  delivery_fee_clp integer not null default 0,
  delivery_fee_known boolean not null default true,
  delivery_fee_pending boolean not null default false,
  delivery_note text,
  payment_method text not null,
  payment_label text not null,
  comments text,
  cancel_reason text,
  cancel_reason_label text,
  cancel_note text,
  cancelled_at timestamptz,
  item_count integer not null default 0,
  subtotal_products_clp integer not null default 0,
  total_clp integer not null default 0,
  items jsonb not null default '[]'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_delivery_date_idx on public.orders (delivery_date);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_customer_phone_idx on public.orders (customer_phone);

alter table public.orders
  add column if not exists cancel_reason text,
  add column if not exists cancel_reason_label text,
  add column if not exists cancel_note text,
  add column if not exists cancelled_at timestamptz;

create index if not exists orders_cancel_reason_idx on public.orders (cancel_reason) where status = 'cancelled';

alter table public.orders drop constraint if exists orders_cancel_reason_allowed;
alter table public.orders
  add constraint orders_cancel_reason_allowed
  check (
    cancel_reason is null or cancel_reason in (
      'test_order',
      'client_not_confirmed',
      'out_of_zone',
      'no_availability',
      'product_unavailable',
      'duplicate',
      'other'
    )
  );

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists orders_touch_updated_at on public.orders;
create trigger orders_touch_updated_at
before update on public.orders
for each row execute function public.touch_updated_at();

create or replace function public.is_dulcemae_admin()
returns boolean
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) in (
    'claudiamancilla1978@gmail.com'
  );
$$;

grant usage on schema public to anon, authenticated;
grant insert on public.orders to anon, authenticated;
grant select, update, delete on public.orders to authenticated;

alter table public.orders enable row level security;

drop policy if exists "Public checkout can create orders" on public.orders;
create policy "Public checkout can create orders"
on public.orders
for insert
to anon, authenticated
with check (true);

drop policy if exists "Admins can read orders" on public.orders;
create policy "Admins can read orders"
on public.orders
for select
to authenticated
using (public.is_dulcemae_admin());

drop policy if exists "Admins can update orders" on public.orders;
create policy "Admins can update orders"
on public.orders
for update
to authenticated
using (public.is_dulcemae_admin())
with check (public.is_dulcemae_admin());

drop policy if exists "Admins can delete orders" on public.orders;
create policy "Admins can delete orders"
on public.orders
for delete
to authenticated
using (public.is_dulcemae_admin());
