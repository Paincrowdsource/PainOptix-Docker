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

  // Set cookie with prod/dev security settings
  const isProd = process.env.NODE_ENV === 'production'
  const c = cookies()
  c.set('hpv2', on ? '1' : '0', {
    httpOnly: true,
    secure: isProd, // true in prod; false on localhost so we can test
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })

  // Build redirect target from forwarded headers (never from req.url)
  const proto = req.headers.get('x-forwarded-proto') ?? 'https'
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? 'painoptix.com'
  const response = NextResponse.redirect(`${proto}://${host}/`, 307)

  response.headers.set('Cache-Control', 'no-store')
  response.headers.set('X-Robots-Tag', 'noindex')

  return response
}
