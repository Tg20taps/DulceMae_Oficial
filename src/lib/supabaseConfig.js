function cleanEnvValue(value) {
  return String(value || '')
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .trim();
}

function normalizeSupabaseUrl(value) {
  const cleanValue = cleanEnvValue(value).replace(/\/+$/, '');
  return cleanValue.replace(/\/rest\/v1$/i, '');
}

export const supabaseUrl = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL);
export const supabaseAnonKey = cleanEnvValue(import.meta.env.VITE_SUPABASE_ANON_KEY);

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const adminAllowedEmails = cleanEnvValue(import.meta.env.VITE_ADMIN_ALLOWED_EMAILS)
  .split(',')
  .map(email => email.trim().toLowerCase())
  .filter(Boolean);

export function isAllowedAdminEmail(email) {
  if (!adminAllowedEmails.length) return true;
  return adminAllowedEmails.includes(String(email || '').trim().toLowerCase());
}

export function buildSupabaseRestUrl(path) {
  const cleanPath = String(path || '').replace(/^\/+/, '');
  return `${supabaseUrl}/rest/v1/${cleanPath}`;
}
