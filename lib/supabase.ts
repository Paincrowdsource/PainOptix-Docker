import 'server-only';
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

// Create a mock Supabase client that returns empty data
// Used during build when env vars are unavailable
function createMockSupabaseClient(): any {
  const mockResponse = {
    data: null,
    error: null,
    count: null,
    status: 200,
    statusText: 'OK'
  };

  const mockQuery = {
    select: () => mockQuery,
    insert: () => mockQuery,
    update: () => mockQuery,
    delete: () => mockQuery,
    eq: () => mockQuery,
    neq: () => mockQuery,
    gt: () => mockQuery,
    gte: () => mockQuery,
    lt: () => mockQuery,
    lte: () => mockQuery,
    like: () => mockQuery,
    ilike: () => mockQuery,
    is: () => mockQuery,
    in: () => mockQuery,
    contains: () => mockQuery,
    containedBy: () => mockQuery,
    rangeGt: () => mockQuery,
    rangeGte: () => mockQuery,
    rangeLt: () => mockQuery,
    rangeLte: () => mockQuery,
    rangeAdjacent: () => mockQuery,
    overlaps: () => mockQuery,
    textSearch: () => mockQuery,
    match: () => mockQuery,
    not: () => mockQuery,
    or: () => mockQuery,
    filter: () => mockQuery,
    order: () => mockQuery,
    limit: () => mockQuery,
    range: () => mockQuery,
    abortSignal: () => mockQuery,
    single: () => Promise.resolve(mockResponse),
    maybeSingle: () => Promise.resolve(mockResponse),
    csv: () => Promise.resolve(mockResponse),
    geojson: () => Promise.resolve(mockResponse),
    explain: () => Promise.resolve(mockResponse),
    then: (resolve: any) => resolve(mockResponse),
    catch: () => Promise.resolve(mockResponse)
  };

  return {
    from: () => mockQuery,
    rpc: () => Promise.resolve(mockResponse),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signOut: () => Promise.resolve({ error: null })
    }
  };
}

let adminClient: SupabaseClient | null = null;
export function getSupabaseAdmin(): SupabaseClient {
  if (!adminClient) {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key) {
      // Return mock client when env is missing (e.g., during job builds)
      // This prevents "Supabase admin env missing" errors during Next.js build
      console.warn('⚠️  Supabase admin env missing - using mock client for build');
      return createMockSupabaseClient() as SupabaseClient;
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
      // Return mock client when env is missing (e.g., during job builds)
      console.warn('⚠️  Supabase anon env missing - using mock client for build');
      return createMockSupabaseClient() as SupabaseClient;
    }
    anonClient = createClient(getSupabaseUrl(), key);
  }
  return anonClient;
}

export function getBrowserSupabase(): SupabaseClient {
  if (typeof window === 'undefined') {
    // During build, return mock instead of throwing
    console.warn('⚠️  getBrowserSupabase called during build - using mock client');
    return createMockSupabaseClient() as SupabaseClient;
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
