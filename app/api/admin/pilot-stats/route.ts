import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

const ONE_DAY_MS = 24 * 60 * 60 * 1000

export async function GET() {
  const sinceIso = new Date(Date.now() - ONE_DAY_MS).toISOString()
  const sinceUnix = Math.floor((Date.now() - ONE_DAY_MS) / 1000)

  // Try Supabase first
  try {
    const { data, error } = await supabaseAdmin
      .from('pilot_events')
      .select('price_strategy, amount_cents, tier, ts')
      .gte('ts', sinceIso)

    if (error) throw error

    const agg = aggregateFromEvents(data || [])
    return NextResponse.json({ source: 'supabase', sinceIso, ...agg })
  } catch (err: any) {
    console.warn('pilot_events query failed, falling back to Stripe:', err.message)

    // Fallback to Stripe (no DB required)
    const sk = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SK
    if (!sk) {
      return NextResponse.json(
        { error: 'Missing STRIPE_SECRET_KEY/STRIPE_SK', totals: null, by_tier: {} },
        { status: 500 }
      )
    }

    try {
      // Pull up to 100 sessions in last 24h (sufficient for our volume)
      const qs = new URLSearchParams({ limit: '100' })
      qs.append('created[gte]', String(sinceUnix))

      const resp = await fetch(`https://api.stripe.com/v1/checkout/sessions?${qs}`, {
        headers: { Authorization: `Bearer ${sk}` },
        cache: 'no-store',
      })

      const json = await resp.json()
      if (!resp.ok) {
        return NextResponse.json(
          { error: 'Stripe fetch failed', details: json, totals: null, by_tier: {} },
          { status: 502 }
        )
      }

      const events = (json.data || []).map((s: any) => ({
        price_strategy: s?.metadata?.price_strategy || 'standard',
        amount_cents: typeof s?.amount_total === 'number' ? s.amount_total : 0,
        tier: s?.metadata?.normalized_tier || s?.metadata?.tier || 'unknown',
      }))

      const agg = aggregateFromEvents(events)
      return NextResponse.json({ source: 'stripe', sinceIso, ...agg })
    } catch (stripeErr) {
      console.error('Stripe fallback also failed:', stripeErr)
      return NextResponse.json(
        { error: 'Both Supabase and Stripe failed', totals: null, by_tier: {} },
        { status: 500 }
      )
    }
  }
}

function aggregateFromEvents(
  events: Array<{ price_strategy: string; amount_cents: number; tier?: string }>
) {
  let pilotCount = 0,
    pilotRev = 0,
    standardCount = 0,
    standardRev = 0
  const byTier: Record<
    string,
    { pilot_count: number; pilot_rev: number; standard_count: number; standard_rev: number }
  > = {}

  for (const e of events) {
    const tier = e.tier || 'unknown'
    byTier[tier] ||= { pilot_count: 0, pilot_rev: 0, standard_count: 0, standard_rev: 0 }

    if (e.price_strategy === 'pilot') {
      pilotCount++
      pilotRev += e.amount_cents
      byTier[tier].pilot_count++
      byTier[tier].pilot_rev += e.amount_cents
    } else {
      standardCount++
      standardRev += e.amount_cents
      byTier[tier].standard_count++
      byTier[tier].standard_rev += e.amount_cents
    }
  }

  return {
    totals: {
      pilot_count: pilotCount,
      pilot_revenue_cents: pilotRev,
      standard_count: standardCount,
      standard_revenue_cents: standardRev,
    },
    by_tier: byTier,
  }
}
