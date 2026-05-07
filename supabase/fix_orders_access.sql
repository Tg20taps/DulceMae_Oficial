-- DulceMae quick fix: orders visible in /admin
-- Run this in Supabase SQL Editor.
-- This resets old RLS policies and recreates the safe admin/public checkout rules.

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

alter table public.orders
  add column if not exists cancel_reason text,
  add column if not exists cancel_reason_label text,
  add column if not exists cancel_note text,
  add column if not exists cancelled_at timestamptz;

create index if not exists orders_cancel_reason_idx
on public.orders (cancel_reason)
where status = 'cancelled';

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

alter table public.orders enable row level security;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'orders'
  loop
    execute format('drop policy if exists %I on public.orders', policy_record.policyname);
  end loop;
end;
$$;

create policy "Public checkout can create orders"
on public.orders
as permissive
for insert
to public
with check (true);

create policy "Admins can read orders"
on public.orders
as permissive
for select
to authenticated
using (public.is_dulcemae_admin());

create policy "Admins can update orders"
on public.orders
as permissive
for update
to authenticated
using (public.is_dulcemae_admin())
with check (public.is_dulcemae_admin());

create policy "Admins can delete orders"
on public.orders
as permissive
for delete
to authenticated
using (public.is_dulcemae_admin());

-- Optional check in SQL Editor:
-- select order_id, customer_name, customer_phone, created_at
-- from public.orders
-- order by created_at desc
-- limit 10;
