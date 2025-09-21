import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let anonClient: SupabaseClient | null = null;
let browserClient: SupabaseClient | null = null;
let serviceClient: SupabaseClient | null = null;

function ensureAnonClient(): SupabaseClient {
  if (!anonClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error("Public Supabase envs missing");
    }
    anonClient = createClient(url, key);
  }
  return anonClient;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = ensureAnonClient();
    const value = Reflect.get(
      client as unknown as Record<PropertyKey, unknown>,
      prop,
      receiver,
    );
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

/** Browser-only anon client for client components */
export function getBrowserSupabase() {
  if (typeof window === "undefined") {
    throw new Error("getBrowserSupabase is browser-only");
  }
  if (!browserClient) {
    browserClient = ensureAnonClient();
  }
  return browserClient;
}

/** Server-only service client (jobs, API routes, scripts) */
export function getServiceSupabase() {
  if (!serviceClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error("service key missing (server-only path)");
    }
    serviceClient = createClient(url, key, { auth: { persistSession: false } });
  }
  return serviceClient;
}
