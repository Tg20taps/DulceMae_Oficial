# DulceMae Supabase Admin Setup

## 1. Variables

En local y Vercel:

```text
VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_ANON_KEY
VITE_ADMIN_ALLOWED_EMAILS=correo-admin@ejemplo.cl
```

## 2. Base de datos

1. Abre Supabase SQL Editor.
2. Copia `supabase/orders.sql`.
3. Reemplaza `admin@dulcemae.cl` por el correo real del admin.
4. Ejecuta el script.

## 3. Usuario admin

En Supabase Auth, crea un usuario con el mismo correo usado en:

- `VITE_ADMIN_ALLOWED_EMAILS`
- `public.is_dulcemae_admin()` dentro del SQL

## 4. Flujo esperado

- El checkout abre WhatsApp siempre.
- Si Supabase está configurado, intenta guardar el pedido en `orders`.
- Si Supabase falla o falta la tabla, el cliente no queda bloqueado.
- `/admin` lee `orders` sólo para usuarios autenticados autorizados por RLS.
