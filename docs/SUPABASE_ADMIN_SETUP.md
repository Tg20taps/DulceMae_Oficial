# DulceMae Supabase Admin Setup

## 1. Variables

En local y Vercel:

```text
VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_ANON_KEY
VITE_ADMIN_ALLOWED_EMAILS=claudiamancilla1978@gmail.com
```

## 2. Base de Datos

1. Abre Supabase SQL Editor.
2. Copia `supabase/orders.sql`.
3. Verifica que el correo dentro de `public.is_dulcemae_admin()` sea exactamente `claudiamancilla1978@gmail.com`.
4. Ejecuta el script.

Si el panel `/admin` abre bien pero muestra `Sin pedidos todavia` aunque ya se envio un pedido por WhatsApp, corre `supabase/fix_orders_access.sql` en Supabase SQL Editor. Ese archivo actualiza el correo admin de RLS, borra policies antiguas de `orders` y recrea los permisos correctos de lectura/escritura.

Importante: en Supabase usa Run sobre todo el script. Si queda seleccionado solo el bloque de diagnostico (`select count(*)...`), Supabase ejecuta solo esa parte y no cambia las policies.

El mismo script tambien agrega los campos de cancelacion:

- `cancel_reason`
- `cancel_reason_label`
- `cancel_note`
- `cancelled_at`

Con eso el admin puede marcar pedidos como cancelados sin borrarlos y conservar motivos utiles para analisis.

## 3. Usuario Admin

En Supabase Auth, crea un usuario con el mismo correo usado en:

- `VITE_ADMIN_ALLOWED_EMAILS`
- `public.is_dulcemae_admin()` dentro del SQL

Correo admin oficial:

```text
claudiamancilla1978@gmail.com
```

## 4. Flujo Esperado

- El checkout abre WhatsApp siempre.
- Si Supabase esta configurado, guarda el pedido en `orders` usando la API REST de Supabase antes de abrir el mensaje final.
- La insercion publica usa `Prefer: return=minimal`. Esto es intencional: el cliente anonimo puede crear pedidos, pero no debe leer filas protegidas por RLS.
- Si Supabase falla o falta la tabla, el cliente no queda bloqueado.
- `/admin` lee `orders` solo para usuarios autenticados autorizados por RLS.
- Cancelar un pedido cambia su estado a `cancelled`, guarda motivo y no lo cuenta en ventas visibles.

## 5. Diagnostico Rapido

- WhatsApp llega pero `/admin` esta en cero: revisar `public.is_dulcemae_admin()` y correr `supabase/fix_orders_access.sql`.
- `/admin` dice que falta configurar Supabase: revisar variables en Vercel.
- El pedido no llega a WhatsApp: revisar validaciones del checkout, especialmente fecha, hora y telefono.
- El pedido aparece en Supabase Table Editor pero no en `/admin`: es casi seguro un problema de RLS/correo admin.
