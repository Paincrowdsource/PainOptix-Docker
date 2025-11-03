import 'server-only';
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

const ADMIN_COOKIE_NAME = 'admin-session'
const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

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
 * Verify admin password
 * Checks both current and legacy passwords during transition period
 */
function verifyAdminPassword(password: string): boolean {
  const currentPassword = process.env.ADMIN_PASSWORD
  const legacyPassword = process.env.ADMIN_PASSWORD_LEGACY

  // Check current password
  if (currentPassword && timingSafeEqual(password, currentPassword)) {
    return true
  }

  // Check legacy password (temporary - remove after migration)
  if (legacyPassword && timingSafeEqual(password, legacyPassword)) {
    return true
  }

  return false
}

/**
 * Set admin session cookie
 * Creates an httpOnly, secure cookie that cannot be accessed by client JavaScript
 */
export async function setAdminSession(): Promise<void> {
  const cookieStore = await cookies()

  cookieStore.set(ADMIN_COOKIE_NAME, 'authenticated', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: ADMIN_COOKIE_MAX_AGE,
    path: '/'
  })
}

/**
 * Get admin session from cookie
 * Returns true if valid admin session exists
 */
export async function getAdminSession(): Promise<boolean> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(ADMIN_COOKIE_NAME)

  return sessionCookie?.value === 'authenticated'
}

/**
 * Clear admin session cookie (logout)
 */
export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(ADMIN_COOKIE_NAME)
}

/**
 * Verify admin authentication via password or existing session
 *
 * This is used for:
 * 1. Login flow - verify password and set cookie
 * 2. Protected routes - check if valid session exists
 *
 * @param password - Optional password for login verification
 * @returns { isAuthenticated: boolean, error?: string }
 */
export async function verifyServerAdminAuth(password?: string): Promise<{
  isAuthenticated: boolean
  error?: string
}> {
  // If password provided (login flow), verify it
  if (password) {
    if (verifyAdminPassword(password)) {
      await setAdminSession()
      return { isAuthenticated: true }
    } else {
      return {
        isAuthenticated: false,
        error: 'Invalid admin password'
      }
    }
  }

  // Check existing session cookie
  const hasSession = await getAdminSession()
  if (hasSession) {
    return { isAuthenticated: true }
  }

  // No valid authentication
  return {
    isAuthenticated: false,
    error: 'No admin session found'
  }
}

/**
 * Check if user has admin role in Supabase
 * This is an alternative auth method via Supabase session
 */
export async function verifySupabaseAdmin(): Promise<boolean> {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_role')
      .eq('id', user.id)
      .single()

    if (profile?.user_role === 'admin') {
      return true
    }
  }

  return false
}

/**
 * Main auth check for server components and server actions
 * Checks both cookie session and Supabase session
 *
 * @returns true if authenticated, false otherwise
 */
export async function requireAdminAuth(): Promise<boolean> {
  // Check cookie-based session first (faster)
  const hasSession = await getAdminSession()
  if (hasSession) {
    return true
  }

  // Fall back to Supabase admin check
  const isSupabaseAdmin = await verifySupabaseAdmin()
  if (isSupabaseAdmin) {
    // Set cookie for future requests
    await setAdminSession()
    return true
  }

  return false
}
