import {
  buildSupabaseRestUrl,
  isSupabaseConfigured as isOrdersApiConfigured,
  supabaseAnonKey,
} from './supabaseConfig';

export function buildOrderRecord(payload) {
  return {
    order_id: payload.order_id,
    status: 'pending',
    source: 'checkout_web',
    channel: payload.channel,
    customer_name: payload.customer.name,
    customer_phone: payload.customer.phone,
    delivery_date: payload.customer.delivery_date,
    preferred_time: payload.customer.preferred_time,
    fulfillment_type: payload.fulfillment.type,
    fulfillment_label: payload.fulfillment.label,
    address: payload.fulfillment.address || null,
    delivery_zone: payload.fulfillment.delivery_zone || null,
    delivery_zone_label: payload.fulfillment.delivery_zone_label || null,
    delivery_fee_clp: payload.summary.delivery_fee_clp,
    delivery_fee_known: payload.fulfillment.delivery_fee_known,
    delivery_fee_pending: payload.summary.delivery_fee_pending,
    delivery_note: payload.fulfillment.delivery_note || null,
    payment_method: payload.payment.method,
    payment_label: payload.payment.label,
    comments: payload.customer.comments || null,
    item_count: payload.summary.item_count,
    subtotal_products_clp: payload.summary.subtotal_products_clp,
    total_clp: payload.summary.total_clp,
    items: payload.items,
    payload,
  };
}

export async function saveCheckoutOrder(payload) {
  if (!isOrdersApiConfigured) {
    return { ok: false, skipped: true, reason: 'supabase_not_configured' };
  }

  const response = await fetch(buildSupabaseRestUrl('orders'), {
    method: 'POST',
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(buildOrderRecord(payload)),
  });

  if (!response.ok) {
    const reason = await response.text();
    return { ok: false, skipped: false, reason };
  }

  const rows = await response.json().catch(() => []);
  return { ok: true, skipped: false, id: rows?.[0]?.id };
}
