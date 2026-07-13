import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(url && key);

export const supabaseConfigError = isSupabaseConfigured
  ? null
  : "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Add them in Cloudflare Pages → Settings → Environment variables, then redeploy.";

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, key!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
