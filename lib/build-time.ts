/**
 * Build-time detection utility
 *
 * Next.js tries to statically generate API routes during build,
 * which fails when Supabase env vars are missing (e.g., in job components).
 *
 * This helper allows routes to return mock responses during build time.
 */

export function isBuildTime(): boolean {
  // During Next.js build, these conditions are true:
  // 1. We're in a Node environment (not browser)
  // 2. Supabase credentials are missing
  // 3. We're in 'production' NODE_ENV but at build phase

  if (typeof window !== 'undefined') {
    return false; // Browser context
  }

  // Check if required env vars are missing
  const hasSupabaseUrl = !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL
  );

  const hasSupabaseKey = !!(
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // If both are missing, we're likely in build-only context
  return !hasSupabaseUrl && !hasSupabaseKey;
}

export function getBuildTimeMockResponse(message: string = 'Build-time mock response') {
  return {
    ok: true,
    buildTime: true,
    message,
    timestamp: new Date().toISOString()
  };
}
