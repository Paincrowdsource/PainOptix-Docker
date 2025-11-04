import { isPilot } from './pilot'

export async function startCheckout(opts: { tier: 'enhanced' | 'comprehensive'; assessmentId?: string }) {
  const source = isPilot() ? 'homepage_pilot' : 'homepage'
  const priceId = opts.tier === 'comprehensive' ? 'monograph' : 'enhanced'
  const body: Record<string, any> = {
    tier: opts.tier,
    priceId,
    source,
  }
  if (opts.assessmentId) {
    body.assessmentId = opts.assessmentId
  }
  if (isPilot() && opts.tier === 'comprehensive') {
    body.tierPrice = Number(process.env.NEXT_PUBLIC_PILOT_MONO_PRICE_CENTS ?? '500')
  }
  const res = await fetch('/api/create-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('Checkout failed')
  const { url } = await res.json()
  window.location.href = url
}
