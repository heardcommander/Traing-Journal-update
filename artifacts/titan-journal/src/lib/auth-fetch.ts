import { supabase } from "@/lib/supabase";

export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(input, { ...init, headers });
}
