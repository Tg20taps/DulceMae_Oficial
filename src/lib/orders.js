import {
  buildSupabaseRestUrl,
  isSupabaseConfigured as isOrdersApiConfigured,
  supabaseAnonKey,
} from './supabaseConfig';

// El navegador manda qué productos, qué tamaño y cuántos; nunca montos.
// create_order() en Supabase calcula precios, delivery y total, y guarda el pedido.
export function buildOrderRequest(cartItems, formData) {
  const isDelivery = formData.fulfillment === 'delivery';

  return {
    customer: {
      name: formData.name.trim(),
      phone: formData.phone,
      delivery_date: formData.date,
      preferred_time: formData.time,
      comments: formData.comments.trim(),
    },
    fulfillment: {
      type: formData.fulfillment,
      delivery_zone: isDelivery ? formData.deliveryZone : null,
      address_mode: isDelivery ? formData.deliveryAddressMode : null,
      address: isDelivery && formData.deliveryAddressMode === 'write' ? formData.address.trim() : '',
    },
    payment: { method: formData.paymentMethod },
    items: cartItems.map(item => ({
      product_id: item.productId,
      option_id: item.optionId ?? null,
      quantity: item.quantity,
    })),
  };
}

// ok: el pedido quedó guardado y `order` trae los montos de la base.
// kind 'rejected': la base dijo que algo del pedido no sirve (agotado, fecha...);
//   `message` se le muestra al cliente tal cual.
// kind 'unavailable': no hubo respuesta (sin internet, Supabase pausado...);
//   el cliente igual puede mandar el pedido por WhatsApp.
export async function createOrder(request) {
  if (!isOrdersApiConfigured) {
    return { ok: false, kind: 'unavailable', message: 'supabase_not_configured' };
  }

  let response;
  try {
    response = await fetch(buildSupabaseRestUrl('rpc/create_order'), {
      method: 'POST',
      headers: {
        apikey: supabaseAnonKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ p_order: request }),
    });
  } catch (error) {
    return { ok: false, kind: 'unavailable', message: error.message };
  }

  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }

  if (response.ok && body?.order_id) return { ok: true, order: body };

  // Los raise exception de create_order llegan como 400 con código P0001.
  if (response.status === 400 && body?.code === 'P0001' && body.message) {
    return { ok: false, kind: 'rejected', message: body.message };
  }

  return { ok: false, kind: 'unavailable', message: body?.message || `Error ${response.status}` };
}
