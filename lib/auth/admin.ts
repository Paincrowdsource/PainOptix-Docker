import { NextRequest } from 'next/server'
import { createSupabaseRouteHandlerClient } from '@/lib/supabase-ssr'

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }

  return result === 0
}

/**
 * Verify admin authentication via password header or Supabase session
 *
 * Accepts two password sources (for transition period):
 * - ADMIN_PASSWORD (current, secure)
 * - ADMIN_PASSWORD_LEGACY (temporary backward compatibility)
 *
 * @returns { isAuthenticated: boolean, error?: string }
 */
export async function verifyAdminAuth(request: NextRequest): Promise<{
  isAuthenticated: boolean
  isAdmin: boolean
  error?: string
}> {
  // Method 1: Check Supabase session for admin role
  const { supabase } = await createSupabaseRouteHandlerClient(request)
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_role')
      .eq('id', user.id)
      .single()

    if (profile?.user_role === 'admin') {
      return { isAuthenticated: true, isAdmin: true }
    }
  }

  // Method 2: Check password header (current or legacy)
  const passwordHeader = request.headers.get('x-admin-password')

  if (passwordHeader) {
    const currentPassword = process.env.ADMIN_PASSWORD
    const legacyPassword = process.env.ADMIN_PASSWORD_LEGACY

    // Accept current password
    if (currentPassword && timingSafeEqual(passwordHeader, currentPassword)) {
      return { isAuthenticated: true, isAdmin: true }
    }

    // Accept legacy password (temporary - remove after client migration)
    if (legacyPassword && timingSafeEqual(passwordHeader, legacyPassword)) {
      return { isAuthenticated: true, isAdmin: true }
    }

    // Password provided but invalid
    return {
      isAuthenticated: false,
      isAdmin: false,
      error: 'Invalid admin password'
    }
  }

  // No valid authentication method
  return {
    isAuthenticated: false,
    isAdmin: false,
    error: 'No admin credentials provided'
  }
}
