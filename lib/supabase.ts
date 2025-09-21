import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function resolveUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  if (!url) {
    throw new Error("Supabase URL is not defined in environment variables.");
  }
  return url;
}

let anonClient: SupabaseClient | null = null;
function ensureAnonClient(): SupabaseClient {
  if (!anonClient) {
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    if (!anonKey) {
      throw new Error("Supabase anon key is not defined in environment variables.");
    }
    anonClient = createClient(resolveUrl(), anonKey);
  }
  return anonClient;
}

let serviceClient: SupabaseClient | null = null;
function ensureServiceClient(): SupabaseClient {
  if (!serviceClient) {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      throw new Error("Supabase service role key is not defined in environment variables.");
    }
    serviceClient = createClient(resolveUrl(), serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return serviceClient;
}

export function getSupabaseAnon(): SupabaseClient {
  return ensureAnonClient();
}

export function getSupabaseAdmin(): SupabaseClient {
  return ensureServiceClient();
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

export function getBrowserSupabase(): SupabaseClient {
  if (typeof window === "undefined") {
    throw new Error("getBrowserSupabase is browser-only");
  }
  return ensureAnonClient();
}

export function getServiceSupabase(): SupabaseClient {
  return ensureServiceClient();
}
