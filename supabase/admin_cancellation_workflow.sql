-- DulceMae admin cancellation workflow
-- Run this in Supabase SQL Editor after the orders table exists.

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

grant update, delete on public.orders to authenticated;

drop policy if exists "Admins can update orders" on public.orders;
create policy "Admins can update orders"
on public.orders
for update
to authenticated
using (public.is_dulcemae_admin())
with check (public.is_dulcemae_admin());
