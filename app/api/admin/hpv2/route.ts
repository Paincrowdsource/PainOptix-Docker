import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Force dynamic - never cache this endpoint
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Preview toggle for Homepage V2
 *
 * Usage:
 *   /api/admin/hpv2?on=1  - Enable V2 preview (sets hpv2=1 cookie)
 *   /api/admin/hpv2?on=0  - Disable V2 preview (sets hpv2=0 cookie)
 *
 * Note: Open access for testing convenience. V2 is gated at page level.
 */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const on = url.searchParams.get('on') === '1'

  // Set cookie and redirect to homepage
  const c = cookies()
  c.set('hpv2', on ? '1' : '0', {
    httpOnly: false, // Allow client-side access for debugging
    path: '/',
    maxAge: 3600, // 1 hour
    sameSite: 'lax',
  })

  // Redirect back to homepage with no-cache and noindex headers
  const response = NextResponse.redirect(new URL('/', req.url))
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  response.headers.set('X-Robots-Tag', 'noindex, nofollow')

  return response
}
