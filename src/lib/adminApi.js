import {
  buildSupabaseAuthUrl,
  buildSupabaseRestUrl,
  buildSupabaseStorageUrl,
  isSupabaseConfigured,
  supabaseAnonKey,
} from './supabaseConfig';

const ADMIN_SESSION_KEY = 'dulcemae_admin_session_v1';
const SESSION_REFRESH_MARGIN_SECONDS = 60;

let memorySession = null;

function getBrowserStorage() {
  if (typeof window === 'undefined') return null;

  for (const storageName of ['localStorage', 'sessionStorage']) {
    try {
      const storage = window[storageName];
      const key = '__dulcemae_storage_test__';
      storage.setItem(key, '1');
      storage.removeItem(key);
      return storage;
    } catch {
      // Some private or hardened browsers expose storage but deny access.
    }
  }

  return null;
}

function readSessionFromStorage() {
  const storage = getBrowserStorage();
  if (!storage) return memorySession;

  try {
    const raw = storage.getItem(ADMIN_SESSION_KEY);
    return raw ? JSON.parse(raw) : memorySession;
  } catch {
    return memorySession;
  }
}

function saveSession(session) {
  memorySession = session;
  const storage = getBrowserStorage();
  if (!storage) return;

  try {
    storage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  } catch {
    // Memory session still keeps the current tab usable.
  }
}

function clearSession() {
  memorySession = null;
  const storage = getBrowserStorage();
  if (!storage) return;

  try {
    storage.removeItem(ADMIN_SESSION_KEY);
  } catch {
    // Nothing else to clear.
  }
}

function normalizeAuthSession(payload) {
  if (!payload?.access_token || !payload?.user) return null;
  const now = Math.floor(Date.now() / 1000);

  return {
    access_token: payload.access_token,
    refresh_token: payload.refresh_token || '',
    expires_at: payload.expires_at || now + Number(payload.expires_in || 3600),
    user: payload.user,
  };
}

function isSessionFresh(session) {
  if (!session?.access_token || !session?.user?.email) return false;
  return Number(session.expires_at || 0) > Math.floor(Date.now() / 1000) + SESSION_REFRESH_MARGIN_SECONDS;
}

async function parseResponseError(response) {
  const text = await response.text();
  if (!text) return `Error ${response.status}`;

  try {
    const payload = JSON.parse(text);
    return payload.msg || payload.message || payload.error_description || payload.error || text;
  } catch {
    return text;
  }
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);

  if (!response.ok) {
    return { data: null, error: await parseResponseError(response) };
  }

  if (response.status === 204) return { data: null, error: null };

  const text = await response.text();
  return { data: text ? JSON.parse(text) : null, error: null };
}

function authHeaders(session) {
  return {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${session.access_token}`,
  };
}

async function refreshAdminSession(session) {
  if (!session?.refresh_token || !isSupabaseConfigured) return null;

  const { data, error } = await requestJson(buildSupabaseAuthUrl('token?grant_type=refresh_token'), {
    method: 'POST',
    headers: {
      apikey: supabaseAnonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh_token: session.refresh_token }),
  });

  if (error) {
    clearSession();
    return null;
  }

  const refreshedSession = normalizeAuthSession(data);
  if (refreshedSession) saveSession(refreshedSession);
  return refreshedSession;
}

async function getActiveSession(session = readSessionFromStorage()) {
  if (!session) return null;
  if (isSessionFresh(session)) return session;
  return refreshAdminSession(session);
}

export async function getStoredAdminSession() {
  const session = await getActiveSession();
  return { session, error: null };
}

export async function signInAdmin(email, password) {
  if (!isSupabaseConfigured) {
    return { session: null, error: 'Supabase no esta configurado.' };
  }

  const { data, error } = await requestJson(buildSupabaseAuthUrl('token?grant_type=password'), {
    method: 'POST',
    headers: {
      apikey: supabaseAnonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (error) return { session: null, error };

  const session = normalizeAuthSession(data);
  if (!session) return { session: null, error: 'No pudimos iniciar sesion.' };

  saveSession(session);
  return { session, error: null };
}

export async function signOutAdmin(session) {
  const activeSession = await getActiveSession(session);

  if (activeSession) {
    await fetch(buildSupabaseAuthUrl('logout'), {
      method: 'POST',
      headers: authHeaders(activeSession),
    }).catch(() => {});
  }

  clearSession();
}

export async function fetchAdminOrders(session, limit = 200) {
  const activeSession = await getActiveSession(session);
  if (!activeSession) return { data: [], error: 'La sesion del admin expiro. Vuelve a entrar.' };

  const params = new URLSearchParams({
    select: '*',
    order: 'created_at.desc',
    limit: String(limit),
  });

  return requestJson(buildSupabaseRestUrl(`orders?${params.toString()}`), {
    headers: authHeaders(activeSession),
  });
}

export async function updateAdminOrder(session, id, payload) {
  const activeSession = await getActiveSession(session);
  if (!activeSession) return { error: 'La sesion del admin expiro. Vuelve a entrar.' };

  const params = new URLSearchParams({ id: `eq.${id}` });
  const { error } = await requestJson(buildSupabaseRestUrl(`orders?${params.toString()}`), {
    method: 'PATCH',
    headers: {
      ...authHeaders(activeSession),
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(payload),
  });

  return { error };
}

// ── Catálogo, fotos y costos ────────────────────────────────────────────

const SESSION_EXPIRED = 'La sesión se cerró. Vuelve a entrar.';
const PRODUCT_BUCKET = 'productos';

// Traduce los errores técnicos de Supabase a algo que se entienda.
export function friendlyError(error) {
  const text = String(error || '');
  if (!text) return '';
  if (/failed to fetch|networkerror|load failed/i.test(text)) return 'Sin conexión. Revisa el internet e intenta de nuevo.';
  if (/jwt|expired|sesi[oó]n/i.test(text)) return SESSION_EXPIRED;
  if (/ingredients_name_key/.test(text)) return 'Ya tienes un ingrediente con ese nombre.';
  if (/recipe_items_ingredient_id_fkey/.test(text)) return 'Ese ingrediente se usa en una receta. Quítalo de la receta antes de borrarlo.';
  if (/duplicate key/i.test(text)) return 'Ya existe uno con ese nombre.';
  if (/row-level security|permission denied/i.test(text)) return 'Tu usuario no tiene permiso para hacer esto.';
  if (/payload too large|exceeded the maximum/i.test(text)) return 'La foto es muy pesada. Prueba con otra.';
  if (/check constraint/i.test(text)) return 'Revisa los datos: hay algún campo vacío o fuera de rango.';
  return text;
}

export async function adminRest(session, path, { method = 'GET', body, prefer } = {}) {
  const activeSession = await getActiveSession(session);
  if (!activeSession) return { data: null, error: SESSION_EXPIRED };

  const headers = { ...authHeaders(activeSession) };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (prefer) headers.Prefer = prefer;

  try {
    const result = await requestJson(buildSupabaseRestUrl(path), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return { data: result.data, error: friendlyError(result.error) };
  } catch (error) {
    return { data: null, error: friendlyError(error.message) };
  }
}

export function adminRpc(session, functionName, args) {
  return adminRest(session, `rpc/${functionName}`, { method: 'POST', body: args });
}

function storageObjectUrl(path) {
  return buildSupabaseStorageUrl(`object/${path}`);
}

export async function uploadProductImage(session, blob, extension) {
  const activeSession = await getActiveSession(session);
  if (!activeSession) return { data: null, error: SESSION_EXPIRED };

  const now = new Date();
  const folder = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const name = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const path = `${folder}/${name}.${extension}`;

  try {
    const response = await fetch(storageObjectUrl(`${PRODUCT_BUCKET}/${path}`), {
      method: 'POST',
      headers: {
        ...authHeaders(activeSession),
        'Content-Type': blob.type,
        'cache-control': 'max-age=31536000',
      },
      body: blob,
    });
    if (!response.ok) return { data: null, error: friendlyError(await parseResponseError(response)) };
  } catch (error) {
    return { data: null, error: friendlyError(error.message) };
  }

  return {
    data: { path, url: storageObjectUrl(`public/${PRODUCT_BUCKET}/${path}`) },
    error: null,
  };
}

// Borrar la foto vieja es limpieza: si falla, el producto igual queda bien.
export async function deleteProductImage(session, path) {
  if (!path) return;
  const activeSession = await getActiveSession(session);
  if (!activeSession) return;
  await fetch(storageObjectUrl(`${PRODUCT_BUCKET}/${path}`), {
    method: 'DELETE',
    headers: authHeaders(activeSession),
  }).catch(() => {});
}
