import { createClient } from '@supabase/supabase-js';
import {
  adminAllowedEmails,
  isAllowedAdminEmail,
  isSupabaseConfigured,
  supabaseAnonKey,
  supabaseUrl,
} from './supabaseConfig';

export { adminAllowedEmails, isAllowedAdminEmail, isSupabaseConfigured };

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
