import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.warn("VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required for sign-in.");
}

export const supabase = createClient(url ?? "", key ?? "");
