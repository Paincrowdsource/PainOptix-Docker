import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ADMIN_COOKIE_NAME = 'admin-session'

/**
 * Middleware to protect admin routes
 *
 * - Runs on all /admin/** routes
 * - Allows /admin/login to bypass auth check
 * - Redirects unauthenticated requests to /admin/login
 * - Allows authenticated requests to proceed
 *
 * Note: For Next.js 15+, this will be renamed to proxy.ts
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow access to login page without authentication
  if (pathname === '/admin/login') {
    return NextResponse.next()
  }

  // Check for admin session cookie
  const sessionCookie = request.cookies.get(ADMIN_COOKIE_NAME)

  if (!sessionCookie || sessionCookie.value !== 'authenticated') {
    // No valid session - redirect to login
    const loginUrl = new URL('/admin/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Valid session - allow request to proceed
  return NextResponse.next()
}

/**
 * Configure which routes this middleware runs on
 */
export const config = {
  matcher: [
    '/admin/:path*',
  ],
}
