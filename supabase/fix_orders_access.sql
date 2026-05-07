-- DulceMae quick fix: orders visible in /admin
-- Run this in Supabase SQL Editor.
-- Replace the email below with the exact admin email used to log in.

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

-- Optional check in SQL Editor:
-- select order_id, customer_name, customer_phone, created_at
-- from public.orders
-- order by created_at desc
-- limit 10;
