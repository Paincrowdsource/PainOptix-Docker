import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  if (!url) {
    // During build time (e.g., in job context without env vars), return placeholder
    if (process.env.NODE_ENV === 'production' && !process.env.RUNTIME_PHASE) {
      return 'https://placeholder.supabase.co';
    }
    throw new Error('Supabase URL env missing');
  }
  return url;
}

let adminClient: SupabaseClient | null = null;
export function getSupabaseAdmin(): SupabaseClient {
  if (!adminClient) {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key) {
      // During build time (e.g., in job context without env vars), return a stub client
      // This allows Next.js to analyze routes without actual database access
      if (process.env.NODE_ENV === 'production' && !process.env.RUNTIME_PHASE) {
        console.warn('⚠️  Supabase admin env missing - using stub client for build');
        return {} as SupabaseClient; // Stub client for build-time analysis
      }
      throw new Error('Supabase admin env missing');
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
