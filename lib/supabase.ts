import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  if (!url) {
    // Return placeholder when env is missing (e.g., during job builds)
    // Routes with dynamic='force-dynamic' won't execute at build time anyway
    console.warn('⚠️  Supabase URL env missing - using placeholder');
    return 'https://placeholder.supabase.co';
  }
  return url;
}

let adminClient: SupabaseClient | null = null;
export function getSupabaseAdmin(): SupabaseClient {
  if (!adminClient) {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key) {
      // Return stub client when env is missing (e.g., during job builds)
      // Routes with dynamic='force-dynamic' won't execute at build time anyway
      console.warn('⚠️  Supabase admin env missing - using stub client');
      return {} as SupabaseClient;
    }
    adminClient = createClient(getSupabaseUrl(), key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return adminClient;
}

export function getServiceSupabase(): SupabaseClient {
  return getSupabaseAdmin();
}

let anonClient: SupabaseClient | null = null;
export function getSupabaseAnon(): SupabaseClient {
  if (!anonClient) {
    const key =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    if (!key) {
      throw new Error('Supabase anon env missing');
    }
    anonClient = createClient(getSupabaseUrl(), key);
  }
  return anonClient;
}

export function getBrowserSupabase(): SupabaseClient {
  if (typeof window === 'undefined') {
    throw new Error('getBrowserSupabase is browser-only');
  }
  return getSupabaseAnon();
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = getSupabaseAnon();
    const value = Reflect.get(
      client as unknown as Record<PropertyKey, unknown>,
      prop,
      receiver,
    );
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
