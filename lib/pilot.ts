export function isPilot(): boolean {
  if (typeof window === 'undefined') return false
  const params = new URLSearchParams(window.location.search)
  const fromSrc = params.get('src') === 'homepage_pilot'
  const cookieMatch = document.cookie.split(';').some(c => c.trim().startsWith('pilot=1'))
  return process.env.NEXT_PUBLIC_PILOT_ACTIVE === 'true' && (fromSrc || cookieMatch)
}

export function ensurePilotCookie() {
  try {
    const hasCookie = document.cookie.split(';').some(c => c.trim().startsWith('pilot='))
    if (!hasCookie) {
      const maxAge = 60 * 60 * 24 * 30 // 30 days
      const base = `pilot=1; Max-Age=${maxAge}; Path=/; SameSite=Lax`
      const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:'
      const cookie = isHttps ? `${base}; Secure` : base
      document.cookie = cookie
    }
  } catch {
    // no-op in non-DOM contexts
  }
}

export function pilotLabel() {
  return isPilot() ? process.env.NEXT_PUBLIC_PILOT_LABEL ?? '$20 → $5 (Pilot)' : '$20'
}
