# DulceMae Supabase Admin Setup

## 1. Variables

En local y Vercel:

```text
VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_ANON_KEY
VITE_ADMIN_ALLOWED_EMAILS=correo-admin@ejemplo.cl
```

## 2. Base de Datos

1. Abre Supabase SQL Editor.
2. Copia `supabase/orders.sql`.
3. Verifica que el correo dentro de `public.is_dulcemae_admin()` sea exactamente el correo del admin.
4. Ejecuta el script.

Si el panel `/admin` abre bien pero muestra `Sin pedidos todavia` aunque ya se envio un pedido por WhatsApp, corre `supabase/fix_orders_access.sql` en Supabase SQL Editor. Ese archivo actualiza el correo admin de RLS y los permisos de lectura/escritura necesarios.

## 3. Usuario Admin

En Supabase Auth, crea un usuario con el mismo correo usado en:

- `VITE_ADMIN_ALLOWED_EMAILS`
- `public.is_dulcemae_admin()` dentro del SQL

## 4. Flujo Esperado

- El checkout abre WhatsApp siempre.
- Si Supabase esta configurado, guarda el pedido en `orders` usando la API REST de Supabase antes de abrir el mensaje final.
- Si Supabase falla o falta la tabla, el cliente no queda bloqueado.
- `/admin` lee `orders` solo para usuarios autenticados autorizados por RLS.

## 5. Diagnostico Rapido

- WhatsApp llega pero `/admin` esta en cero: revisar `public.is_dulcemae_admin()` y correr `supabase/fix_orders_access.sql`.
- `/admin` dice que falta configurar Supabase: revisar variables en Vercel.
- El pedido no llega a WhatsApp: revisar validaciones del checkout, especialmente fecha, hora y telefono.
- El pedido aparece en Supabase Table Editor pero no en `/admin`: es casi seguro un problema de RLS/correo admin.
